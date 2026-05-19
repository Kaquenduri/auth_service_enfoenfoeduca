import { PrismaClient } from "../generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg"; 


// Crea una reservar de conexiones listas para usar con Prisma y Supabase (conexiones a la database)
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }); 

// Crea una instancia del adaptador de PostgreSQL con la cadena de conexión de Supabase
const adapter = new PrismaPg(pool);

// Crea una instancia de PrismaClient utilizando el adaptador de PostgreSQL
const prisma = new PrismaClient({ adapter });

//Exportamos la instancia de Prisma para usarla en el resto de la aplicación
export default prisma;