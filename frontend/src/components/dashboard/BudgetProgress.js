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
      const expenses = appStore.getCategoryExpenses();
      const barsContainer = document.getElementById('budgetBarsContainer');
      if (!barsContainer) return;

      if (Object.keys(expenses).length === 0) {
        barsContainer.innerHTML = '<p class="empty-msg">No hay gastos registrados para calcular presupuestos.</p>';
        return;
      }

      let html = '';
      for (const [cat, amount] of Object.entries(expenses)) {
        const limit = appStore.getBudgetLimit(cat);
        const percent = Math.min((amount / limit) * 100, 100);
        
        let colorClass = 'bar-normal';
        let badgeHtml = '';
        
        if (percent >= 100) {
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

    appStore.addEventListener('transaction_added', updateBars);
    appStore.addEventListener('transaction_history_loaded', updateBars);
    updateBars();
  }
};
