import { appStore } from '../../store/appStore.js';
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
        const isWarning = percent >= 85;
        const colorClass = isWarning ? 'bar-warning' : 'bar-normal';

        html += `
          <div class="budget-item">
            <div class="budget-header">
              <span class="budget-cat">${cat}</span>
              <span class="budget-amounts">$${amount.toFixed(2)} / $${limit.toFixed(2)}</span>
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
