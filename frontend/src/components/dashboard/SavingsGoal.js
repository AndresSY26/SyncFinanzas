import { formatCurrency } from '../../utils/formatters.js';
import { appStore } from '../../store/appStore.js';

export const SavingsGoal = {
  render: (containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const renderUI = () => {
      const wrapper = document.getElementById(containerId);
      if (!wrapper) return;

      const goals = appStore.state.savingsGoals || [];
      
      if (goals.length === 0) {
        wrapper.innerHTML = `
          <div class="card" style="padding: 20px; border-radius: 20px; background: var(--surface-card); margin-bottom: 0; height: 100%; box-sizing: border-box;">
            <h3 style="margin-top: 0; margin-bottom: 15px; border-bottom: 2px solid rgba(123, 44, 191, 0.2); padding-bottom: 10px; font-size: 1.1rem; color: var(--text-primary);">Mi Meta Activa</h3>
            <p style="color: var(--text-secondary); text-align: center; margin-top: 20px; font-style: italic;">No tienes metas activas. ¡Crea una en la pestaña de Metas!</p>
          </div>
        `;
        return;
      }

      // Tomamos la primera meta activa para mostrar en el resumen
      const goalObj = goals[0];
      const target = parseFloat(goalObj.monto_objetivo);
      const current = parseFloat(goalObj.monto_actual);
      const percent = target > 0 ? Math.min((current / target) * 100, 100) : 0;
      const currency = 'COP'; 

      wrapper.innerHTML = `
        <div class="card" style="padding: 20px; border-radius: 20px; background: var(--surface-card); margin-bottom: 0; height: 100%; box-sizing: border-box;">
          <h3 style="margin-top: 0; margin-bottom: 15px; border-bottom: 2px solid rgba(123, 44, 191, 0.2); padding-bottom: 10px; font-size: 1.1rem; color: var(--text-primary);">Mi Meta Activa</h3>
          
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.5rem; display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; background: rgba(76, 201, 240, 0.1); color: #4cc9f0; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">🎯</span>
                <span style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary);">${goalObj.nombre}</span>
              </div>
              <span style="font-weight: 800; color: var(--primary-purple); font-size: 1.1rem;">${percent.toFixed(0)}%</span>
            </div>
            
            <div style="width: 100%; height: 12px; background: var(--background-global); border-radius: 999px; overflow: hidden; margin-top: 8px;">
              <div style="width: ${percent}%; height: 100%; background: linear-gradient(90deg, #4cc9f0, var(--primary-purple)); border-radius: 999px; transition: width 1s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 0 10px rgba(76, 201, 240, 0.4);"></div>
            </div>
            
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--text-secondary); margin-top: 5px; font-weight: 600;">
              <span>${formatCurrency(current, currency)} <span style="font-weight:normal;">ahorrado</span></span>
              <span>Meta: ${formatCurrency(target, currency)}</span>
            </div>
          </div>
        </div>
      `;
    };

    appStore.addEventListener('goals_loaded', renderUI);
    renderUI(); // Renderizado inicial
  }
};
