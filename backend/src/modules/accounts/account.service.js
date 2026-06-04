import pool from '../../config/database.js';

export const accountService = {
  getAccountsByUserId: async (usuario_id) => {
    const query = `
      SELECT id, nombre, tipo, balance_inicial 
      FROM accounts 
      WHERE usuario_id = $1 
      ORDER BY creado_en DESC;
    `;
    try {
      const result = await pool.query(query, [usuario_id]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching accounts:', error.message);
      return [];
    }
  }
};
