import { predictionService } from '../../modules/analytics/prediction.service.js';

export const registerPredictionHandlers = (io, socket) => {
  socket.on('analytics:getProjection', async () => {
    try {
      const result = await predictionService.getProjection(socket.userId);
      socket.emit('analytics:projection_loaded', result);
    } catch (error) {
      console.error('Error procesando proyección predictiva:', error);
      // Omitimos emitir error al cliente para no bloquear UI, simplemente enviamos data nula
      socket.emit('analytics:projection_loaded', { predictions: null, insights: null });
    }
  });
};
