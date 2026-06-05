import { formatCurrency } from '../../utils/formatters.js';

export const SavingsGoal = {
  render: (containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Simular estado de la meta (se conectaría a DB/Store en el futuro)
    const goal = {
      name: 'Fondo de Emergencia',
      target: 5000,
      current: 3200,
      currency: 'USD'
    };

    const percent = Math.min((goal.current / goal.target) * 100, 100);

    container.innerHTML = `
      <div class="card" style="padding: 20px; border-radius: 20px; background: var(--surface-card); margin-bottom: 0; height: 100%; box-sizing: border-box;">
        <h3 style="margin-top: 0; margin-bottom: 15px; border-bottom: 2px solid rgba(123, 44, 191, 0.2); padding-bottom: 10px; font-size: 1.1rem; color: var(--text-primary);">Mi Meta Activa</h3>
        
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 1.5rem; display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; background: rgba(76, 201, 240, 0.1); color: #4cc9f0; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">🎯</span>
              <span style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary);">${goal.name}</span>
            </div>
            <span style="font-weight: 800; color: var(--primary-purple); font-size: 1.1rem;">${percent.toFixed(0)}%</span>
          </div>
          
          <div style="width: 100%; height: 12px; background: var(--background-global); border-radius: 999px; overflow: hidden; margin-top: 8px;">
            <div style="width: ${percent}%; height: 100%; background: linear-gradient(90deg, #4cc9f0, var(--primary-purple)); border-radius: 999px; transition: width 1s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 0 10px rgba(76, 201, 240, 0.4);"></div>
          </div>
          
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--text-secondary); margin-top: 5px; font-weight: 600;">
            <span>${formatCurrency(goal.current, goal.currency)} <span style="font-weight:normal;">ahorrado</span></span>
            <span>Meta: ${formatCurrency(goal.target, goal.currency)}</span>
          </div>
        </div>
      </div>
    `;
  }
};
