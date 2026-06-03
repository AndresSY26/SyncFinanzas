import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Inicializamos el Pool de conexiones usando la cadena de conexión del .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Función para verificar la conexión al arrancar el servidor
export const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Conectado a PostgreSQL (syncfinanzas_db) exitosamente');
    client.release(); // Liberar el cliente de vuelta al pool
  } catch (error) {
    console.error('❌ Error conectando a PostgreSQL:', error.message);
    console.error('💡 Asegúrate de que PostgreSQL esté corriendo y la base de datos "syncfinanzas_db" haya sido creada.');
    process.exit(1);
  }
};

export default pool;
