import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/supabase.js';


export const register = async (req, res) => {
  try {

    const {
      name,
      last_name,
      email,
      password,
      role,
      
    } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        last_name,
        email,
        password: hashedPassword
      }
    });

    const roleFallback = role ?? "STUDENT";

    // Extraemos el string si vino dentro de un array ["STUDENT"]
    const roleRaw = Array.isArray(roleFallback) ? roleFallback[0] : roleFallback;

    // Convertimos a texto puro en MAYÚSCULAS para que calce con tu Enum
    const roleToFind = String(roleRaw).toUpperCase();

    const foundRole = await prisma.role.findUnique({
      where: {
        name: roleToFind
      }
    });

    await prisma.userRole.create({
      data: {
        user_id: newUser.user_id,
        role_id: foundRole.role_id
      }
    });

    const userResponse = {
      user_id: newUser.user_id,
    }

    res.status(201).json({
      message: 'User created successfully',
      user: userResponse
    });

  } catch (error) {
    console.error("erro gei: ", error)
    res.status(500).json({
      error: error.message
    });

  }
};

export const login = async (req, res) => {
  try {

    const { email, password } = req.body;

    //Obtiene el usuario por email e incluye sus roles
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        user_roles: {
          include: {
            role: true
          }
        }
      }
    });

    // Usuario no encontrado
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    //Validar contraseña 
    const validPassword = await bcrypt.compare(
      password,
      user.password
    );

    //Credenciales inválidas
    if (!validPassword) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    const roles = user.user_roles.map(
      ur => ur.role.name
    );

    // 3. COMUNICACIÓN ENTRE MICROSERVICIOS (Buscar ID específico según el Rol)
    let roleIdData = {
      student_id: null,
      teacher_id: null,
      parent_id: null,
      director_id: null
    };

    // Diccionario de configuración para mapear Roles con sus Endpoints y las claves de sus IDs
    const roleConfig = {
      'STUDENT':  { endpoint: 'students',  idKey: 'student_id' },
      'TEACHER':  { endpoint: 'teachers',  idKey: 'teacher_id' },
      'PARENT':   { endpoint: 'parents',   idKey: 'parent_id' },
      'DIRECTOR': { endpoint: 'director',  idKey: 'director_id' }
    };

    // Buscamos cuál de los roles del usuario coincide con nuestra configuración
    const activeRole = roles.find(role => roleConfig[role]);

    if (activeRole) {
      try {
        const { endpoint, idKey } = roleConfig[activeRole];
        const usersServiceUrl = process.env.USERS_SERVICE_URL || 'http://localhost:3002';
        
        // La URL se genera sola: ej. http://localhost:3002/teachers/user/id123
        const responseRoleData = await fetch(
          `${usersServiceUrl}/${endpoint}/user/${user.user_id}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        if (responseRoleData.ok) {
          const roleData = await responseRoleData.json();
          // Guardamos el ID dinámicamente usando la clave correcta (ej: teacher_id)
          roleIdData[idKey] = roleData[idKey];
        } else {
          console.error(`[Auth-Log] Users-Service respondió con código ${responseRoleData.status} para el rol ${activeRole}`);
        }
      } catch (fetchError) {
        console.error(`[Auth-Log] Error al conectar con Users-Service para rol ${activeRole}: `, fetchError.message);
      }
    }

    // 4. Construcción del Payload del JWT (Desestructuramos el objeto directamente en el JWT)
    const tokenPayload = {
      user_id: user.user_id,
      email: user.email,
      roles,
      ...roleIdData // Esto inyecta student_id, teacher_id, etc. (los que no apliquen irán como null)
    };

    console.log("Payload para JWT: ", tokenPayload);

    const token = jwt.sign(
      {
        user_id: user.user_id,
        email: user.email,
        roles,
        ...roleIdData
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '5h'
      }
    );

    res.json({
      token
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
};

export const me = async (req, res) => {

  res.json({
    user: req.user
  });

};

export const getUserById = async (req, res) => {
  try{
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where:{
        user_id: id
      }
    })

    res.json(user);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
}



export const googleLogin = async (req, res) => {
  try {
    const { id_token } = req.body;

    if (!id_token) {
      return res.status(400).json({ message: 'Missing Google token (id_token)' });
    }

    // 1. Preguntarle directamente a Google si el token es verídico y vigente
    const googleVerifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${id_token}`;
    const googleResponse = await fetch(googleVerifyUrl);

    if (!googleResponse.ok) {
      return res.status(401).json({ message: 'Invalid or expired Google token' });
    }

    const googleUserData = await googleResponse.json();
    
    // Si el token es real, Google nos garantiza el correo verificado aquí:
    const email = googleUserData.email;

    // 2. Buscamos el usuario en tu base de datos usando Prisma (Igual que en tu login clásico)
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        user_roles: {
          include: {
            role: true
          }
        }
      }
    });

    // Si el administrador no dio de alta previamente este correo institucional, se le deniega el acceso
    if (!user) {
      return res.status(404).json({
        message: 'Esta cuenta de Google no está dada de alta en el sistema institucional.'
      });
    }

    const roles = user.user_roles.map(ur => ur.role.name);

    // 3. COMUNICACIÓN ENTRE MICROSERVICIOS (Reutilizamos tu lógica exacta de mapeo de IDs)
    let roleIdData = {
      student_id: null,
      teacher_id: null,
      parent_id: null,
      director_id: null
    };

    const roleConfig = {
      'STUDENT':  { endpoint: 'students',  idKey: 'student_id' },
      'TEACHER':  { endpoint: 'teachers',  idKey: 'teacher_id' },
      'PARENT':   { endpoint: 'parents',   idKey: 'parent_id' },
      'DIRECTOR': { endpoint: 'director',  idKey: 'director_id' }
    };

    const activeRole = roles.find(role => roleConfig[role]);

    if (activeRole) {
      try {
        const { endpoint, idKey } = roleConfig[activeRole];
        const usersServiceUrl = process.env.USERS_SERVICE_URL || 'http://localhost:3002';
        
        const responseRoleData = await fetch(
          `${usersServiceUrl}/${endpoint}/user/${user.user_id}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        if (responseRoleData.ok) {
          const roleData = await responseRoleData.json();
          roleIdData[idKey] = roleData[idKey];
        } else {
          console.error(`[Google-Auth-Log] Users-Service respondió con código ${responseRoleData.status} para el rol ${activeRole}`);
        }
      } catch (fetchError) {
        console.error(`[Google-Auth-Log] Error al conectar con Users-Service para rol ${activeRole}: `, fetchError.message);
      }
    }

    // 4. Firmar el token JWT institucional idéntico al tradicional
    const token = jwt.sign(
      {
        user_id: user.user_id,
        email: user.email,
        roles,
        ...roleIdData
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '5h'
      }
    );

    // Devolvemos el token exacto que Flutter está esperando
    res.json({ token });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};