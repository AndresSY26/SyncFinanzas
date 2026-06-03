import { transactionService } from '../../services/transactionService.js';
import { appEvents } from '../../utils/eventEmitter.js';
import { sessionManager } from '../sessionManager.js';

/**
 * Registra un "listener" del bus interno de Node.
 * Esto debe llamarse UNA SOLA VEZ al iniciar el servidor, no por cada cliente conectado.
 */
export const registerGlobalEventObservers = (io) => {
  // Cuando el transactionService emite este evento interno...
  appEvents.on('balance:changed', async (userId) => {
    try {
      // 1. Obtenemos los nuevos cálculos frescos de la BD
      const balanceData = await transactionService.getBalance(userId);
      
      // 2. Buscamos todas las pestañas/dispositivos conectados del usuario
      const userSockets = sessionManager.getUserSockets(userId);
      
      // 3. Emitimos ('push') la actualización reactiva a cada uno de sus sockets
      userSockets.forEach(socketId => {
        io.to(socketId).emit('balance:updated', balanceData);
      });
      
    } catch (error) {
      console.error(`Error procesando actualización de balance para [${userId}]:`, error.message);
    }
  });

  // Cuando el budgetService emite que un presupuesto fue excedido...
  appEvents.on('budget:limit_exceeded', (payload) => {
    const { usuario_id, categoria, monto_limite, actual } = payload;
    const userSockets = sessionManager.getUserSockets(usuario_id);
    
    // Empujamos la alerta (Push Notification) a las pantallas del usuario
    userSockets.forEach(socketId => {
      io.to(socketId).emit('budget:alert', {
        categoria,
        limite: monto_limite,
        gastado: actual,
        mensaje: `¡Has superado tu presupuesto de ${categoria}!`
      });
    });
  });
};

/**
 * Asocia los eventos específicos entrantes enviados por un Socket particular.
 * Esto se llama individualmente cada vez que se conecta un usuario.
 */
export const registerTransactionHandlers = (io, socket) => {
  socket.on('transaction:list', async () => {
    try {
      if (!socket.userId) return;
      const txs = await transactionService.getTransactions(socket.userId);
      socket.emit('transaction:history', txs);
      
      const balanceData = await transactionService.getBalance(socket.userId);
      socket.emit('balance:updated', balanceData);
    } catch (error) {
      console.error(error);
    }
  });

  // Escuchar cuando el cliente pide crear un registro
  socket.on('transaction:create', async (payload) => {
    try {
      // Validación de seguridad estricta: Garantizar que usamos el ID del token JWT
      if (!socket.userId) {
        throw new Error('No autorizado: Usuario no autenticado en el socket.');
      }

      // Inyectamos el usuario desde el token/middleware
      const newTx = await transactionService.createTransaction({
        usuario_id: socket.userId, // Obligamos a que use el ID del token seguro
        tipo: payload.tipo,
        monto: parseFloat(payload.monto), // Parseo defensivo en el backend también
        categoria: payload.categoria,
        descripcion: payload.descripcion
      });

      // Respondemos SOLO a este cliente que el registro de su gasto/ingreso fue un éxito
      socket.emit('transaction:created_success', newTx);
      
    } catch (error) {
      socket.emit('error:system', { code: 'TX_CREATE_ERROR', message: error.message });
    }
  });
};
