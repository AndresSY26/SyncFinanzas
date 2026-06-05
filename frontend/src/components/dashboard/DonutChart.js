import { appStore } from '../../store/appStore.js';
import { formatCurrency } from '../../utils/formatters.js';
import './DonutChart.css';

export const DonutChart = {
  render: (containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="card donut-card">
        <h3 class="card-title">Distribución de Gastos</h3>
        <div id="donutContentWrapper" class="donut-content-wrapper">
           <p class="empty-msg">Sin datos para mostrar.</p>
        </div>
      </div>
    `;

    // Paleta premium
    const colors = ['#7b2cbf', '#f72585', '#4cc9f0', '#ffb703', '#fb8500', '#8338ec', '#3a0ca3'];

    const updateChart = () => {
      const expenses = appStore.getCategoryExpenses();
      const wrapper = document.getElementById('donutContentWrapper');
      if (!wrapper) return;

      const entries = Object.entries(expenses).filter(([_, amt]) => amt > 0);
      if (entries.length === 0) {
         wrapper.innerHTML = '<p class="empty-msg">No hay gastos registrados aún.</p>';
         return;
      }

      const total = entries.reduce((sum, [_, amt]) => sum + amt, 0);
      const radius = 60;
      const circumference = 2 * Math.PI * radius;
      
      let svgHtml = `
        <div class="donut-svg-container">
          <svg width="200" height="200" viewBox="0 0 160 160" class="donut-svg">
            <circle r="${radius}" cx="80" cy="80" class="donut-base" />
      `;
      let legendHtml = '<div class="donut-legend">';
      let currentOffset = 0;

      entries.forEach(([cat, amt], index) => {
        const percent = amt / total;
        const dashArray = percent * circumference;
        const color = colors[index % colors.length];
        
        svgHtml += `
          <circle 
            r="${radius}" cx="80" cy="80" 
            class="donut-segment" 
            stroke="${color}"
            stroke-dasharray="${dashArray} ${circumference}"
            stroke-dashoffset="${-currentOffset}"
          >
            <title>${cat}: ${formatCurrency(amt, 'COP')} (${(percent * 100).toFixed(1)}%)</title>
          </circle>
        `;
        
        legendHtml += `
          <div class="legend-item">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span class="legend-color" style="background: ${color}; width: 10px; height: 10px; border-radius: 50%;"></span>
              <span class="legend-label" style="font-size: 0.9rem; color: var(--text-secondary);">${cat}</span>
            </div>
            <span class="legend-amt" style="font-size: 0.95rem; font-weight: bold; color: var(--text-primary);">${formatCurrency(amt, 'COP')}</span>
          </div>
        `;

        currentOffset += dashArray;
      });

      const totalFormatted = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(total);

      svgHtml += `
          </svg>
          <div class="donut-center-text" style="width: 100px; text-align: center;">
            <span class="donut-total-lbl">Total</span>
            <span class="donut-total-val" style="display: block; font-size: 1.15rem; word-break: break-word;">${totalFormatted}</span>
          </div>
        </div>
      `;
      
      legendHtml += '</div>';

      wrapper.innerHTML = svgHtml + legendHtml;
    };

    appStore.addEventListener('transaction_added', updateChart);
    appStore.addEventListener('transaction_history_loaded', updateChart);
    updateChart();
  }
};
