import pool from '../../config/database.js';
import { appEvents } from '../../utils/eventEmitter.js';
import { budgetService } from '../budgets/budget.service.js';

export const transactionService = {
  /**
   * Crea un nuevo registro financiero en la base de datos 
   * y emite internamente un evento para notificar que el balance cambió.
   */
  createTransaction: async ({ usuario_id, cuenta_id, tipo, monto, moneda, categoria, descripcion }) => {
    const query = `
      INSERT INTO transactions (usuario_id, cuenta_id, tipo, monto, moneda, categoria, descripcion)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const values = [usuario_id, cuenta_id || null, tipo, monto, moneda || 'COP', categoria, descripcion];
    
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

  /**
   * Ejecuta una transferencia atómica (BEGIN/COMMIT) creando dos registros:
   * Un gasto en la cuenta origen y un ingreso en la cuenta destino.
   */
  createTransfer: async ({ usuario_id, cuenta_id, cuenta_destino_id, monto, moneda, categoria, descripcion }) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const query = `
        INSERT INTO transactions (usuario_id, cuenta_id, tipo, monto, moneda, categoria, descripcion)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
      `;
      
      // 1. Gasto de la cuenta origen
      const res1 = await client.query(query, [usuario_id, cuenta_id, 'expense', monto, moneda || 'COP', categoria, descripcion]);
      
      // 2. Ingreso a la cuenta destino
      const res2 = await client.query(query, [usuario_id, cuenta_destino_id, 'income', monto, moneda || 'COP', categoria, descripcion]);
      
      await client.query('COMMIT');
      
      // Emitir el evento de reactividad para actualizar el balance
      appEvents.emit('balance:changed', usuario_id);
      
      return [res1.rows[0], res2.rows[0]];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error al insertar transferencia:', error.message);
      throw new Error('No se pudo crear la transferencia');
    } finally {
      client.release();
    }
  },

  _getDateCondition: (filterRange) => {
    switch (filterRange) {
      case 'today':
        return `fecha >= CURRENT_DATE`;
      case '7days':
        return `fecha >= CURRENT_DATE - INTERVAL '7 days'`;
      case 'month':
        return `date_trunc('month', fecha) = date_trunc('month', CURRENT_DATE)`;
      case 'all':
      default:
        return `1=1`;
    }
  },

  getTransactions: async (usuario_id, filterRange = 'all') => {
    const dateCondition = transactionService._getDateCondition(filterRange);
    const query = `
      SELECT * FROM transactions
      WHERE usuario_id = $1 AND ${dateCondition}
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
  getBalance: async (usuario_id, filterRange = 'all') => {
    const dateCondition = transactionService._getDateCondition(filterRange);
    const query = `
      SELECT 
        moneda,
        COALESCE(SUM(CASE WHEN tipo = 'income' THEN monto ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN tipo = 'expense' THEN monto ELSE 0 END), 0) as total_expense
      FROM transactions
      WHERE usuario_id = $1 AND ${dateCondition}
      GROUP BY moneda;
    `;
    
    try {
      const result = await pool.query(query, [usuario_id]);
      
      const balances = result.rows.map(row => {
        const totalIncome = parseFloat(row.total_income);
        const totalExpense = parseFloat(row.total_expense);
        return {
          moneda: row.moneda || 'COP',
          currentBalance: totalIncome - totalExpense,
          totalIncome,
          totalExpense
        };
      });

      // Si no hay transacciones, devolver array vacío o array con un balance 0 en COP por defecto
      if (balances.length === 0) {
        return [{ moneda: 'COP', currentBalance: 0, totalIncome: 0, totalExpense: 0 }];
      }

      return balances;
    } catch (error) {
      console.error('Error calculando balance:', error.message);
      throw new Error('No se pudo calcular el balance actual');
    }
  },

  getAccountBalances: async (usuario_id) => {
    const query = `
      SELECT 
        cuenta_id,
        moneda,
        SUM(CASE WHEN tipo = 'income' THEN monto ELSE -monto END) as balance
      FROM transactions
      WHERE usuario_id = $1 AND cuenta_id IS NOT NULL
      GROUP BY cuenta_id, moneda;
    `;
    try {
      const result = await pool.query(query, [usuario_id]);
      return result.rows.map(r => ({
        cuenta_id: r.cuenta_id,
        moneda: r.moneda,
        balance: parseFloat(r.balance)
      }));
    } catch (error) {
      console.error('Error calculando balance por cuenta:', error.message);
      return [];
    }
  }
};
