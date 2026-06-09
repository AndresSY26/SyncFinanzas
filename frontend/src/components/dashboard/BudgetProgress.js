import { appStore } from '../../store/appStore.js';
import { formatCurrency } from '../../utils/formatters.js';
import './BudgetProgress.css';

export const BudgetProgress = {
  render: (containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="card budget-card">
        <h3 class="card-title">Mis Presupuestos Mensuales</h3>
        <div id="budgetBarsContainer" class="budget-bars-container">
          <p class="empty-msg">No hay gastos registrados para calcular presupuestos.</p>
        </div>
      </div>
    `;

    const updateBars = () => {
      const budgets = Array.isArray(appStore.state.budgets) ? appStore.state.budgets : [];
      const barsContainer = document.getElementById('budgetBarsContainer');
      if (!barsContainer) return;

      if (budgets.length === 0) {
        barsContainer.innerHTML = '<p class="empty-msg">No tienes presupuestos activos. ¡Crea el primero en el módulo de Presupuestos!</p>';
        return;
      }

      let html = '';
      for (const b of budgets) {
        const cat = b.categoria;
        const limit = parseFloat(b.monto_limite) || 0;
        const amount = parseFloat(b.gastado) || 0;
        const percent = limit > 0 ? Math.min((amount / limit) * 100, 100) : 0;
        
        let colorClass = 'bar-normal';
        let badgeHtml = '';
        
        if (amount > limit && limit > 0) {
          colorClass = 'bar-danger';
          badgeHtml = '<span class="budget-alert-badge">¡Límite Superado!</span>';
        } else if (percent >= 70) {
          colorClass = 'bar-warning';
        }

        html += `
          <div class="budget-item">
            <div class="budget-header">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="budget-cat">${cat}</span>
                ${badgeHtml}
              </div>
              <span class="budget-amounts">${formatCurrency(amount, 'COP')} / ${formatCurrency(limit, 'COP')}</span>
            </div>
            <div class="progress-bg">
              <div class="progress-fill ${colorClass}" style="width: ${percent}%;"></div>
            </div>
          </div>
        `;
      }
      barsContainer.innerHTML = html;
    };

    appStore.addEventListener('budgets_loaded', updateBars);
    updateBars();
  }
};
