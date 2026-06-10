import { coachService } from '../../modules/analytics/coach.service.js';

export const registerCoachHandlers = (io, socket) => {
  socket.on('analytics:getCoachInsight', async () => {
    try {
      const insightData = await coachService.getInsight(socket.userId);
      socket.emit('analytics:coach_insight_loaded', insightData);
    } catch (error) {
      console.error('Error procesando coach insight:', error);
      socket.emit('analytics:coach_insight_loaded', {
        alerta_critica: "Error de conexión",
        accion_inmediata: "No se pudo obtener el insight del Coach.",
        estrategia_ahorro: "Reintenta más tarde."
      });
    }
  });
};
