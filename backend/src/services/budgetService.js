import pool from '../db/index.js';
import { appEvents } from '../utils/eventEmitter.js';

export const budgetService = {
  createBudget: async ({ usuario_id, categoria, monto_limite }) => {
    const query = `
      INSERT INTO budgets (usuario_id, categoria, monto_limite)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const values = [usuario_id, categoria, monto_limite];
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error al insertar presupuesto:', error.message);
      throw new Error('No se pudo crear el presupuesto');
    }
  },

  checkBudgetAlert: async (usuario_id, categoria) => {
    try {
      // 1. Obtener el límite del presupuesto mensual para esta categoría
      const budgetQuery = `SELECT monto_limite FROM budgets WHERE usuario_id = $1 AND categoria = $2`;
      const budgetResult = await pool.query(budgetQuery, [usuario_id, categoria]);
      
      if (budgetResult.rows.length === 0) {
        return; // No hay presupuesto configurado para esta categoría, salimos
      }
      
      const limite = parseFloat(budgetResult.rows[0].monto_limite);

      // 2. Sumar todos los gastos del usuario en esa categoría durante EL MES ACTUAL
      const expensesQuery = `
        SELECT COALESCE(SUM(monto), 0) as total_gastado
        FROM transactions 
        WHERE usuario_id = $1 AND categoria = $2 AND tipo = 'expense' 
        AND date_trunc('month', fecha) = date_trunc('month', CURRENT_DATE)
      `;
      const expensesResult = await pool.query(expensesQuery, [usuario_id, categoria]);
      const totalGastado = parseFloat(expensesResult.rows[0].total_gastado);

      // 3. Comprobar auditoría. Si el usuario superó su límite, disparamos evento
      if (totalGastado > limite) {
        appEvents.emit('budget:limit_exceeded', {
          usuario_id,
          categoria,
          monto_limite: limite,
          actual: totalGastado
        });
      }
    } catch (error) {
      console.error('Error verificando presupuesto:', error.message);
    }
  }
};
