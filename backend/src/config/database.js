import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Conectado a PostgreSQL (syncfinanzas_db) exitosamente');
    client.release();
  } catch (error) {
    console.error('❌ Error conectando a PostgreSQL:', error.message);
    console.error('💡 Asegúrate de que PostgreSQL esté corriendo y la base de datos "syncfinanzas_db" haya sido creada.');
    process.exit(1);
  }
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const initDB = async () => {
  try {
    const sqlFilePath = path.join(__dirname, 'schema.sql');
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf-8');

    console.log('⏳ Ejecutando script de creación de tablas...');
    await pool.query(sqlScript);
    console.log('✅ Estructura relacional de tablas verificada/creada exitosamente.');
  } catch (error) {
    console.error('❌ Error al inicializar las tablas:', error.message);
    process.exit(1);
  }
};

export default pool;
