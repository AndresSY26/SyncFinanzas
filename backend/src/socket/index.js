import { authMiddleware } from './middlewares/authMiddleware.js';
import { sessionManager } from './sessionManager.js';
import { registerGlobalEventObservers, registerTransactionHandlers } from './handlers/transactionHandler.js';

export const setupSockets = (io) => {
  // 1. Aplicar middleware de autenticación global a todos los sockets entrantes
  io.use(authMiddleware);

  // Registrar observadores globales (bus interno de Node.js -> WebSocket Push)
  registerGlobalEventObservers(io);

  // 2. Evento global de nueva conexión de un cliente (ya autenticado)
  io.on('connection', (socket) => {
    console.log(`✅ Conexión establecida. Socket: ${socket.id} | Usuario: ${socket.userId}`);

    // Registrar el usuario en nuestro gestor de sesiones
    sessionManager.addUser(socket.userId, socket.id);

    // --- REGISTRO DE HANDLERS DE EVENTOS ESPECÍFICOS ---
    registerTransactionHandlers(io, socket);
    // --------------------------------------------------

    // 3. Manejar evento de desconexión
    socket.on('disconnect', (reason) => {
      console.log(`❌ Desconexión. Socket: ${socket.id} | Razón: ${reason}`);
      // Eliminar el socket de la sesión del usuario
      sessionManager.removeUser(socket.userId, socket.id);
    });
  });
};
