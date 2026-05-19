import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {

  try {

    // Obtiene el header de autorización (si existe). 
    const authHeader = req.headers.authorization;

    // si no existe el header, se responde con un error 401 (Unauthorized)
    if (!authHeader) {
      return res.status(401).json({
        message: 'Token required. Your request does not incluide headers. Please add a header'
      });
    }

    // Se extrae el token del header (formato: "Bearer | token")
    const token = authHeader.split(' ')[1];

    //Se valida el token 
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;

    next();

  } catch (error) {

    return res.status(401).json({
      message: 'Invalid token',
    });

  }

};