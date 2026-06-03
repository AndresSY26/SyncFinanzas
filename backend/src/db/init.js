import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './index.js';

// Equivalente a __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const initDB = async () => {
  try {
    // 1. Leer el script SQL local de forma síncrona
    const sqlFilePath = path.join(__dirname, 'init.sql');
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf-8');

    console.log('⏳ Ejecutando script de creación de tablas...');
    
    // 2. Ejecutar la query en bloque a la base de datos
    await pool.query(sqlScript);

    console.log('✅ Estructura relacional de tablas verificada/creada exitosamente.');
  } catch (error) {
    console.error('❌ Error al inicializar las tablas:', error.message);
    process.exit(1);
  }
};
