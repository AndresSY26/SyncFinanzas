import pool from '../../config/database.js';

export const goalService = {
  createGoal: async ({ usuario_id, nombre, monto_objetivo, cuenta_id }) => {
    const query = `
      INSERT INTO savings_goals (usuario_id, nombre, monto_objetivo, cuenta_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const values = [usuario_id, nombre, monto_objetivo, cuenta_id];
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error al crear meta de ahorro:', error.message);
      throw new Error('No se pudo crear la meta de ahorro');
    }
  },

  listGoals: async (usuario_id) => {
    const query = `
      SELECT sg.*, 
             (SELECT COALESCE(SUM(monto), 0) FROM transactions t WHERE t.cuenta_id = sg.cuenta_id AND t.tipo = 'income') as progreso_calculado
      FROM savings_goals sg
      WHERE sg.usuario_id = $1
    `;
    try {
      const result = await pool.query(query, [usuario_id]);
      return result.rows.map(row => ({
        ...row,
        // Forzamos el uso del progreso automatizado
        monto_actual: parseFloat(row.progreso_calculado)
      }));
    } catch (error) {
      console.error('Error al listar metas:', error.message);
      throw new Error('No se pudieron listar las metas');
    }
  }
};
