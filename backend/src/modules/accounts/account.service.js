import pool from '../../config/database.js';

export const accountService = {
  getAccountsByUserId: async (usuario_id) => {
    const query = `
      SELECT id, nombre, tipo, balance_inicial, detalles 
      FROM accounts 
      WHERE usuario_id = $1 
      ORDER BY creado_en DESC;
    `;
    try {
      const result = await pool.query(query, [usuario_id]);
      // Aplanar el resultado para el frontend (mezclar detalles con propiedades base)
      return result.rows.map(row => ({
        id: row.id,
        nombre: row.nombre,
        type: row.tipo,
        balance_inicial: row.balance_inicial,
        ...(row.detalles || {})
      }));
    } catch (error) {
      console.error('Error fetching accounts:', error.message);
      return [];
    }
  },

  createAccount: async (usuario_id, payload) => {
    const { type, ...detalles } = payload;
    let nombre = 'Cuenta';

    if (type === 'billetera') {
      nombre = `${detalles.platform} - ${detalles.identifier.slice(-4) || detalles.identifier}`;
    } else if (type === 'tarjeta') {
      nombre = `Tarjeta **** ${detalles.number.slice(-4)}`;
    } else if (type === 'banco') {
      nombre = `${detalles.bank} - ${detalles.accountType}`;
    }

    const query = `
      INSERT INTO accounts (usuario_id, nombre, tipo, detalles)
      VALUES ($1, $2, $3, $4)
      RETURNING id, nombre, tipo, balance_inicial, detalles;
    `;
    
    try {
      const result = await pool.query(query, [usuario_id, nombre, type, detalles]);
      const row = result.rows[0];
      return {
        id: row.id,
        nombre: row.nombre,
        type: row.tipo,
        balance_inicial: row.balance_inicial,
        ...(row.detalles || {})
      };
      } catch (error) {
      console.error('Error creating account:', error.message);
      throw error;
    }
  },

  deleteAccount: async (usuario_id, account_id) => {
    const query = 'DELETE FROM accounts WHERE id = $1 AND usuario_id = $2 RETURNING id;';
    try {
      const result = await pool.query(query, [account_id, usuario_id]);
      if (result.rowCount === 0) throw new Error('Cuenta no encontrada o no pertenece al usuario');
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting account:', error.message);
      throw error;
    }
  }
};
