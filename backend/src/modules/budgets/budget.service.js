import pool from '../../config/database.js';
import { appEvents } from '../../utils/eventEmitter.js';

export const budgetService = {
  createBudget: async ({ usuario_id, categoria, monto_limite, fecha_inicio, fecha_fin, recurrencia = 'none' }) => {
    // Validación de solapamiento
    const validationQuery = `
      SELECT id FROM budgets 
      WHERE usuario_id = $1 AND categoria = $2 
      AND NOT (fecha_fin < $3 OR fecha_inicio > $4)
    `;
    const validationResult = await pool.query(validationQuery, [usuario_id, categoria, fecha_inicio, fecha_fin]);
    
    if (validationResult.rows.length > 0) {
      throw new Error('Ya tienes un presupuesto activo para esta categoría en ese rango de fechas');
    }

    const query = `
      INSERT INTO budgets (usuario_id, categoria, monto_limite, fecha_inicio, fecha_fin, recurrencia)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [usuario_id, categoria, monto_limite, fecha_inicio, fecha_fin, recurrencia];
    try {
      const result = await pool.query(query, values);
      appEvents.emit('budget:changed', usuario_id);
      return result.rows[0];
    } catch (error) {
      console.error('Error al crear presupuesto:', error.message);
      throw new Error('No se pudo guardar el presupuesto');
    }
  },

  listBudgets: async (usuario_id) => {
    // === Lazy Evaluation: Generar ciclos para presupuestos recurrentes expirados ===
    try {
      const checkQuery = `
        SELECT id, categoria, monto_limite, fecha_inicio, fecha_fin, recurrencia 
        FROM budgets 
        WHERE usuario_id = $1 AND recurrencia != 'none' AND fecha_fin < CURRENT_DATE
      `;
      const expired = await pool.query(checkQuery, [usuario_id]);
      
      if (expired.rows.length > 0) {
        for (const b of expired.rows) {
          // Desactivar la recurrencia del registro viejo para no ciclar infinitamente
          await pool.query("UPDATE budgets SET recurrencia = 'none' WHERE id = $1", [b.id]);
          
          let dInicio = new Date(b.fecha_inicio);
          let dFin = new Date(b.fecha_fin);
          
          if (b.recurrencia === 'weekly') { dInicio.setDate(dInicio.getDate() + 7); dFin.setDate(dFin.getDate() + 7); }
          else if (b.recurrencia === 'biweekly') { dInicio.setDate(dInicio.getDate() + 15); dFin.setDate(dFin.getDate() + 15); }
          else if (b.recurrencia === 'monthly') { dInicio.setMonth(dInicio.getMonth() + 1); dFin.setMonth(dFin.getMonth() + 1); }
          else if (b.recurrencia === 'yearly') { dInicio.setFullYear(dInicio.getFullYear() + 1); dFin.setFullYear(dFin.getFullYear() + 1); }
          
          const nextInicio = dInicio.toISOString().split('T')[0];
          const nextFin = dFin.toISOString().split('T')[0];
          
          // Verificación de solapamiento para el nuevo registro clonado
          const overlap = await pool.query(
            `SELECT id FROM budgets WHERE usuario_id = $1 AND categoria = $2 AND NOT (fecha_fin < $3 OR fecha_inicio > $4)`, 
            [usuario_id, b.categoria, nextInicio, nextFin]
          );
          if (overlap.rows.length === 0) {
             await pool.query(
               `INSERT INTO budgets (usuario_id, categoria, monto_limite, fecha_inicio, fecha_fin, recurrencia) VALUES ($1, $2, $3, $4, $5, $6)`, 
               [usuario_id, b.categoria, b.monto_limite, nextInicio, nextFin, b.recurrencia]
             );
          }
        }
      }
    } catch (e) {
      console.error('Error procesando recurrencia lazy:', e.message);
    }
    // ==============================================================================

    const query = `
      SELECT b.*, 
             (SELECT COALESCE(SUM(monto), 0) FROM transactions t 
              WHERE t.usuario_id = b.usuario_id AND t.categoria = b.categoria 
              AND t.tipo = 'expense' AND t.fecha BETWEEN b.fecha_inicio AND b.fecha_fin) as gastado
      FROM budgets b
      WHERE b.usuario_id = $1
      ORDER BY b.fecha_fin ASC
    `;
    try {
      const result = await pool.query(query, [usuario_id]);
      return result.rows;
    } catch (error) {
      console.error('Error al listar presupuestos:', error.message);
      throw new Error('No se pudieron listar los presupuestos');
    }
  },

  deleteBudget: async (usuario_id, id) => {
    try {
      await pool.query('DELETE FROM budgets WHERE id = $1 AND usuario_id = $2', [id, usuario_id]);
      appEvents.emit('budget:changed', usuario_id);
      return true;
    } catch (error) {
      console.error('Error al eliminar presupuesto:', error.message);
      throw new Error('No se pudo eliminar el presupuesto');
    }
  },

  updateBudget: async ({ id, usuario_id, categoria, monto_limite, fecha_inicio, fecha_fin, recurrencia = 'none' }) => {
    // Validación de solapamiento excluyendo el actual
    const validationQuery = `
      SELECT id FROM budgets 
      WHERE usuario_id = $1 AND categoria = $2 AND id != $3
      AND NOT (fecha_fin < $4 OR fecha_inicio > $5)
    `;
    const validationResult = await pool.query(validationQuery, [usuario_id, categoria, id, fecha_inicio, fecha_fin]);
    
    if (validationResult.rows.length > 0) {
      throw new Error('Ya tienes un presupuesto activo para esta categoría en ese rango de fechas');
    }

    const query = `
      UPDATE budgets 
      SET categoria = $1, monto_limite = $2, fecha_inicio = $3, fecha_fin = $4, recurrencia = $5
      WHERE id = $6 AND usuario_id = $7
      RETURNING *;
    `;
    const values = [categoria, monto_limite, fecha_inicio, fecha_fin, recurrencia, id, usuario_id];
    try {
      const result = await pool.query(query, values);
      appEvents.emit('budget:changed', usuario_id);
      return result.rows[0];
    } catch (error) {
      console.error('Error al actualizar presupuesto:', error.message);
      throw new Error('No se pudo actualizar el presupuesto');
    }
  }
};
