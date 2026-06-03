import pool from '../db/index.js';
import { appEvents } from '../utils/eventEmitter.js';
import { budgetService } from './budgetService.js';

export const transactionService = {
  /**
   * Crea un nuevo registro financiero en la base de datos 
   * y emite internamente un evento para notificar que el balance cambió.
   */
  createTransaction: async ({ usuario_id, tipo, monto, categoria, descripcion }) => {
    const query = `
      INSERT INTO transactions (usuario_id, tipo, monto, categoria, descripcion)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [usuario_id, tipo, monto, categoria, descripcion];
    
    try {
      const result = await pool.query(query, values);
      const newTransaction = result.rows[0];

      // ¡Aquí está la magia reactiva!
      // Emitimos el evento de forma asíncrona dentro del servidor de Node.
      // El socket escuchará este evento y enviará el push al cliente.
      appEvents.emit('balance:changed', usuario_id);

      // Auditoría de presupuesto si la transacción es un gasto
      if (tipo === 'expense') {
        // Llamado asíncrono fire-and-forget, no bloquea la respuesta principal
        budgetService.checkBudgetAlert(usuario_id, categoria);
      }

      return newTransaction;
    } catch (error) {
      console.error('Error al insertar transacción:', error.message);
      throw new Error('No se pudo crear la transacción');
    }
  },

  getTransactions: async (usuario_id) => {
    const query = `
      SELECT * FROM transactions
      WHERE usuario_id = $1
      ORDER BY fecha DESC;
    `;
    try {
      const result = await pool.query(query, [usuario_id]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching tx history:', error.message);
      return [];
    }
  },

  /**
   * Ejecuta una agregación en SQL para calcular el total de ingresos, 
   * gastos y el balance neto final de un usuario específico.
   */
  getBalance: async (usuario_id) => {
    const query = `
      SELECT 
        COALESCE(SUM(CASE WHEN tipo = 'income' THEN monto ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN tipo = 'expense' THEN monto ELSE 0 END), 0) as total_expense
      FROM transactions
      WHERE usuario_id = $1;
    `;
    
    try {
      const result = await pool.query(query, [usuario_id]);
      const totals = result.rows[0];
      
      // PostgreSQL devuelve tipos NUMERIC como Strings en 'pg' para no perder precisión.
      // Los convertimos a Float para facilitar su serialización en JSON al frontend.
      const totalIncome = parseFloat(totals.total_income);
      const totalExpense = parseFloat(totals.total_expense);
      const currentBalance = totalIncome - totalExpense;

      return {
        currentBalance,
        totalIncome,
        totalExpense
      };
    } catch (error) {
      console.error('Error calculando balance:', error.message);
      throw new Error('No se pudo calcular el balance actual');
    }
  }
};
