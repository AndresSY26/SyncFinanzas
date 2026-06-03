// Mapa en memoria para asociar userId con socket.id(s)
// Permite que un mismo usuario tenga múltiples pestañas/dispositivos conectados
const activeUsers = new Map();

export const sessionManager = {
  /**
   * Registra un nuevo socket para un usuario.
   */
  addUser: (userId, socketId) => {
    if (!activeUsers.has(userId)) {
      activeUsers.set(userId, new Set());
    }
    activeUsers.get(userId).add(socketId);
    console.log(`👤 Sesión registrada: Usuario [${userId}] -> Socket [${socketId}]`);
  },

  /**
   * Elimina un socket de la lista de un usuario.
   */
  removeUser: (userId, socketId) => {
    if (activeUsers.has(userId)) {
      const userSockets = activeUsers.get(userId);
      userSockets.delete(socketId);
      
      if (userSockets.size === 0) {
        activeUsers.delete(userId);
      }
      console.log(`🔌 Sesión removida: Usuario [${userId}] -> Socket [${socketId}]`);
    }
  },

  /**
   * Devuelve un array con todos los socket IDs activos de un usuario.
   * Ideal para emitir eventos a todas las sesiones de un usuario (ej. actualizar balance).
   */
  getUserSockets: (userId) => {
    return activeUsers.has(userId) ? Array.from(activeUsers.get(userId)) : [];
  }
};
