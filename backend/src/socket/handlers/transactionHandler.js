import { transactionService } from '../../modules/transactions/transaction.service.js';
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
      const userSockets = sessionManager.getUserSockets(userId);
      
      userSockets.forEach(async (socketId) => {
        const socket = io.sockets.sockets.get(socketId);
        if (socket) {
          const filterRange = socket.filterRange || 'all';
          const balanceData = await transactionService.getBalance(userId, filterRange);
          const txs = await transactionService.getTransactions(userId, filterRange);
          const accountBalances = await transactionService.getAccountBalances(userId);

          socket.emit('balance:updated', balanceData);
          socket.emit('account:balances_updated', accountBalances);
          socket.emit('transaction:history', txs);
        }
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
      const filterRange = socket.filterRange || 'all';
      const txs = await transactionService.getTransactions(socket.userId, filterRange);
      socket.emit('transaction:history', txs);
      
      const balanceData = await transactionService.getBalance(socket.userId, filterRange);
      socket.emit('balance:updated', balanceData);
      
      const accountBalances = await transactionService.getAccountBalances(socket.userId);
      socket.emit('account:balances_updated', accountBalances);
    } catch (error) {
      console.error(error);
    }
  });

  socket.on('dashboard:filter', async (range) => {
    try {
      if (!socket.userId) return;
      socket.filterRange = range;
      const txs = await transactionService.getTransactions(socket.userId, range);
      socket.emit('transaction:history', txs);
      
      const balanceData = await transactionService.getBalance(socket.userId, range);
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

      if (payload.tipo === 'transfer') {
        if (!payload.cuenta_destino_id) {
          throw new Error('La cuenta de destino es obligatoria para transferencias.');
        }
        
        const [txExpense, txIncome] = await transactionService.createTransfer({
          usuario_id: socket.userId,
          cuenta_id: payload.cuenta_id,
          cuenta_destino_id: payload.cuenta_destino_id,
          monto: parseFloat(payload.monto),
          moneda: payload.moneda,
          categoria: 'Transferencia',
          descripcion: payload.descripcion
        });

        // Respondemos 2 veces para inyectar ambos en el UI
        socket.emit('transaction:created_success', txExpense);
        socket.emit('transaction:created_success', txIncome);

      } else {
        const newTx = await transactionService.createTransaction({
          usuario_id: socket.userId,
          cuenta_id: payload.cuenta_id,
          tipo: payload.tipo,
          monto: parseFloat(payload.monto),
          moneda: payload.moneda,
          categoria: payload.categoria,
          descripcion: payload.descripcion
        });

        socket.emit('transaction:created_success', newTx);
      }
      
    } catch (error) {
      socket.emit('error:system', { code: 'TX_CREATE_ERROR', message: error.message });
    }
  });
};
