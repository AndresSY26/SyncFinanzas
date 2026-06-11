import pool from '../../config/database.js';
import { appEvents } from '../../utils/eventEmitter.js';
import { budgetService } from '../budgets/budget.service.js';

export const transactionService = {
  /**
   * Crea un nuevo registro financiero en la base de datos 
   * y emite internamente un evento para notificar que el balance cambió.
   */
  createTransaction: async ({ usuario_id, cuenta_id, tipo, monto, moneda, categoria, descripcion }) => {
    const numericMonto = Number(monto);
    if (isNaN(numericMonto) || numericMonto <= 0) {
      throw new Error('HTTP 400: El monto de la transacción debe ser un número mayor a cero');
    }
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

      // Auditoría asíncrona de eventos de dominio
      if (tipo === 'expense') {
        appEvents.emit('transaction:expense', newTransaction);
      } else if (tipo === 'income') {
        appEvents.emit('transaction:income', newTransaction);
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
    const numericMonto = Number(monto);
    if (isNaN(numericMonto) || numericMonto <= 0) {
      throw new Error('HTTP 400: El monto de la transferencia debe ser un número mayor a cero');
    }
    if (cuenta_id === cuenta_destino_id) {
      throw new Error('La cuenta de origen y destino no pueden ser la misma');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Validación de sobregiro y divisa cruzada
      const balanceOrigenQuery = `
        SELECT COALESCE(SUM(CASE WHEN tipo = 'income' THEN monto ELSE -monto END), 0) as current_balance,
               MAX(moneda) as moneda_principal
        FROM transactions 
        WHERE cuenta_id = $1 AND usuario_id = $2
      `;
      const balanceDestinoQuery = `
        SELECT MAX(moneda) as moneda_principal
        FROM transactions
        WHERE cuenta_id = $1 AND usuario_id = $2
      `;

      const origenRes = await client.query(balanceOrigenQuery, [cuenta_id, usuario_id]);
      const currentBalance = parseFloat(origenRes.rows[0].current_balance);
      const monedaOrigen = origenRes.rows[0].moneda_principal;

      if (currentBalance < numericMonto) {
        throw new Error('Fondos insuficientes en la cuenta de origen');
      }

      const destinoRes = await client.query(balanceDestinoQuery, [cuenta_destino_id, usuario_id]);
      const monedaDestino = destinoRes.rows[0].moneda_principal;
      const monedaTx = moneda || 'COP';

      if ((monedaOrigen && monedaOrigen !== monedaTx) || (monedaDestino && monedaDestino !== monedaTx)) {
        throw new Error('No se permiten transferencias con monedas cruzadas (divisas diferentes)');
      }

      const query = `
        INSERT INTO transactions (usuario_id, cuenta_id, tipo, monto, moneda, categoria, descripcion)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
      `;
      
      // 1. Gasto de la cuenta origen
      const res1 = await client.query(query, [usuario_id, cuenta_id, 'expense', numericMonto, monedaTx, categoria, descripcion]);
      
      // 2. Ingreso a la cuenta destino
      const res2 = await client.query(query, [usuario_id, cuenta_destino_id, 'income', numericMonto, monedaTx, categoria, descripcion]);
      
      await client.query('COMMIT');
      
      // Emitir el evento de reactividad para actualizar el balance
      appEvents.emit('balance:changed', usuario_id);
      
      // Emitir eventos granulares con el flag isTransfer para no gatillar falsos positivos en metas/presupuestos
      appEvents.emit('transaction:expense', { ...res1.rows[0], isTransfer: true });
      appEvents.emit('transaction:income', { ...res2.rows[0], isTransfer: true });
      
      return [res1.rows[0], res2.rows[0]];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error al insertar transferencia:', error.message);
      throw new Error(error.message || 'No se pudo crear la transferencia');
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
      case 'Este Mes':
        return `fecha >= DATE_TRUNC('month', CURRENT_DATE)`;
      case '3 Meses':
        return `fecha >= CURRENT_DATE - INTERVAL '3 months'`;
      case '6 Meses':
        return `fecha >= CURRENT_DATE - INTERVAL '6 months'`;
      case 'all':
      case 'Todos':
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
