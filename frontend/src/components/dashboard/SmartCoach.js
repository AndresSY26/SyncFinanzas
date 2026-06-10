import { appStore } from '../../store/appStore.js';

export const SmartCoach = {
  render: (containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Componente Base con Skeleton Loader interactivo
    container.innerHTML = `
      <div class="card" style="height: fit-content; margin-bottom: 0; background: linear-gradient(145deg, rgba(20,20,20,0.95), rgba(30,30,30,0.85)); border: 1px solid rgba(123, 44, 191, 0.3);">
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid rgba(123, 44, 191, 0.2); padding-bottom: 10px; margin-bottom: 15px;">
          <h3 style="margin: 0; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.2rem;">✨</span> Smart Coach AI
          </h3>
          <div id="aiStatusLed" style="width: 10px; height: 10px; background-color: var(--accent-pink); border-radius: 50%; box-shadow: 0 0 10px var(--accent-pink); animation: pulse 1.5s infinite;"></div>
        </div>

        <style>
          @keyframes pulse {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(247, 37, 133, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(247, 37, 133, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(247, 37, 133, 0); }
          }
          .coach-card {
            background: rgba(255, 255, 255, 0.03);
            border-radius: 12px;
            padding: 15px;
            margin-bottom: 12px;
            border-left: 4px solid;
            backdrop-filter: blur(5px);
          }
          .coach-card h4 { margin: 0 0 5px 0; font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
          .coach-card p { margin: 0; font-size: 0.95rem; color: var(--text-primary); line-height: 1.4; }
        </style>

        <div id="coachContent">
          <p style="color: var(--text-secondary); font-size: 0.9rem; text-align: center; font-style: italic;">Gemini está analizando tu perfil financiero...</p>
        </div>
      </div>
    `;

    const renderInsights = (e) => {
      const data = e.detail;
      const content = document.getElementById('coachContent');
      const led = document.getElementById('aiStatusLed');
      if (!content || !led) return;

      // Desactivar pulso
      led.style.animation = 'none';
      led.style.backgroundColor = 'var(--primary-purple)';
      led.style.boxShadow = '0 0 10px var(--primary-purple)';

      content.innerHTML = `
        <div class="coach-card" style="border-left-color: var(--accent-pink);">
          <h4>🛑 Alerta Crítica</h4>
          <p>${data.alerta_critica || 'No hay alertas críticas inminentes.'}</p>
        </div>
        <div class="coach-card" style="border-left-color: var(--primary-purple);">
          <h4>⚡ Acción Inmediata</h4>
          <p>${data.accion_inmediata || 'Mantén tu ritmo actual.'}</p>
        </div>
        <div class="coach-card" style="border-left-color: var(--accent-blue);">
          <h4>🎯 Estrategia de Metas</h4>
          <p>${data.estrategia_ahorro || 'Vas por buen camino.'}</p>
        </div>
      `;
    };

    appStore.addEventListener('coach_insight_loaded', renderInsights);
  }
};
