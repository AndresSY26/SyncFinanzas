import { budgetService } from '../../modules/budgets/budget.service.js';
import { goalService } from '../../modules/goals/goal.service.js';
import { sessionManager } from '../sessionManager.js';

export const registerBudgetHandlers = (io, socket) => {
  // BUDGETS
  socket.on('budget:list', async () => {
    try {
      const budgets = await budgetService.listBudgets(socket.userId);
      socket.emit('budget:list:success', budgets);
    } catch (error) {
      socket.emit('error', { message: 'Error al listar presupuestos', details: error.message });
    }
  });

  socket.on('budget:update', async (payload) => {
    try {
      const { categoria, monto_limite, fecha_inicio, fecha_fin, recurrencia } = payload;
      await budgetService.createBudget({
        usuario_id: socket.userId,
        categoria,
        monto_limite,
        fecha_inicio,
        fecha_fin,
        recurrencia
      });
      
      // Broadcast a todos los dispositivos del usuario
      const budgets = await budgetService.listBudgets(socket.userId);
      const userSockets = sessionManager.getUserSockets(socket.userId);
      userSockets.forEach(socketId => {
        io.to(socketId).emit('budget:list:success', budgets);
      });
    } catch (error) {
      socket.emit('error', { message: 'Error al actualizar presupuesto', details: error.message });
    }
  });
  socket.on('budget:edit', async (payload) => {
    try {
      const { id, categoria, monto_limite, fecha_inicio, fecha_fin, recurrencia } = payload;
      await budgetService.updateBudget({
        id,
        usuario_id: socket.userId,
        categoria,
        monto_limite,
        fecha_inicio,
        fecha_fin,
        recurrencia
      });
      
      const budgets = await budgetService.listBudgets(socket.userId);
      const userSockets = sessionManager.getUserSockets(socket.userId);
      userSockets.forEach(socketId => io.to(socketId).emit('budget:list:success', budgets));
    } catch (error) {
      socket.emit('error', { message: 'Error al editar presupuesto', details: error.message });
    }
  });

  socket.on('budget:delete', async (payload) => {
    try {
      const { id } = payload;
      await budgetService.deleteBudget(socket.userId, id);
      
      const budgets = await budgetService.listBudgets(socket.userId);
      const userSockets = sessionManager.getUserSockets(socket.userId);
      userSockets.forEach(socketId => io.to(socketId).emit('budget:list:success', budgets));
    } catch (error) {
      socket.emit('error', { message: 'Error al eliminar presupuesto', details: error.message });
    }
  });

  // GOALS
  socket.on('goal:list', async () => {
    try {
      const goals = await goalService.listGoals(socket.userId);
      socket.emit('goal:list:success', goals);
    } catch (error) {
      socket.emit('error', { message: 'Error al listar metas', details: error.message });
    }
  });

  socket.on('goal:create', async (payload) => {
    try {
      const { nombre, monto_objetivo, cuenta_id } = payload;
      await goalService.createGoal({
        usuario_id: socket.userId,
        nombre,
        monto_objetivo,
        cuenta_id
      });
      
      const goals = await goalService.listGoals(socket.userId);
      const userSockets = sessionManager.getUserSockets(socket.userId);
      userSockets.forEach(socketId => {
        io.to(socketId).emit('goal:list:success', goals);
      });
    } catch (error) {
      socket.emit('error', { message: 'Error al crear meta', details: error.message });
    }
  });
};
