import { appStore } from '../../store/appStore.js';
import Chart from 'chart.js/auto';

export const TrendChart = {
  render: (containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="card" style="position: relative; height: 400px; display: flex; flex-direction: column; margin-bottom: 0;">
        <h3 style="margin-top: 0; border-bottom: 2px solid rgba(123, 44, 191, 0.2); padding-bottom: 10px; color: var(--text-primary);">Tendencia de Flujo</h3>
        <div id="predictiveInsightBanner" style="display: none; background: rgba(123, 44, 191, 0.05); border: 1px solid rgba(123, 44, 191, 0.2); border-radius: 8px; padding: 10px; margin-bottom: 10px; color: var(--primary-purple); font-size: 0.85rem; backdrop-filter: blur(4px);"></div>
        <div style="flex-grow: 1; position: relative;">
          <canvas id="trendChartCanvas"></canvas>
        </div>
      </div>
    `;

    const ctx = document.getElementById('trendChartCanvas').getContext('2d');
    
    // Configuración de Chart.js
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Ingresos',
            data: [],
            borderColor: '#4cc9f0',
            backgroundColor: 'rgba(76, 201, 240, 0.1)',
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#4cc9f0',
            pointBorderWidth: 0,
            pointRadius: 3,
            pointHoverRadius: 6
          },
          {
            label: 'Gastos',
            data: [],
            borderColor: '#f72585',
            backgroundColor: 'rgba(247, 37, 133, 0.05)',
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#f72585',
            pointBorderWidth: 0,
            pointRadius: 3,
            pointHoverRadius: 6
          },
          {
            label: 'Proyección Ingresos',
            data: [],
            borderColor: '#06d6a0', // Verde Neón distintivo
            borderDash: [5, 5],
            borderWidth: 3,
            tension: 0.4,
            fill: false,
            pointBackgroundColor: '#06d6a0',
            pointRadius: 3
          },
          {
            label: 'Proyección Gastos',
            data: [],
            borderColor: '#ffb703', // Ámbar distintivo
            borderDash: [5, 5],
            borderWidth: 3,
            tension: 0.4,
            fill: false,
            pointBackgroundColor: '#ffb703',
            pointRadius: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0,0,0,0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(context.parsed.y);
                }
                return label;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false,
              drawBorder: false
            },
            ticks: {
              color: '#888',
              font: { size: 10 }
            }
          },
          y: {
            grid: {
              color: 'rgba(128, 128, 128, 0.1)',
              drawBorder: false
            },
            ticks: {
              color: '#888',
              font: { size: 10 },
              callback: function(value) {
                if(value === 0) return '$0';
                return '$' + (value / 1000) + 'k';
              }
            }
          }
        }
      }
    });

    const updateChart = () => {
      const txs = appStore.state.transactions || [];
      if (txs.length === 0) {
        chart.data.labels = ['Sin datos'];
        chart.data.datasets.forEach(d => d.data = [0]);
        chart.update();
        return;
      }

      const grouped = {};
      txs.forEach(tx => {
        const dateObj = new Date(tx.fecha);
        const dateStr = dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
        
        if (!grouped[dateStr]) {
          grouped[dateStr] = { income: 0, expense: 0, timestamp: dateObj.getTime() };
        }
        
        if (tx.tipo === 'income') {
          grouped[dateStr].income += parseFloat(tx.monto);
        } else {
          grouped[dateStr].expense += parseFloat(tx.monto);
        }
      });

      const sortedKeys = Object.keys(grouped).sort((a, b) => grouped[a].timestamp - grouped[b].timestamp);

      const labels = sortedKeys;
      const incomeData = sortedKeys.map(k => grouped[k].income);
      const expenseData = sortedKeys.map(k => grouped[k].expense);

      chart.data.labels = labels;
      
      // Llenamos datos reales, pero dejamos huecos (null) en los datasets de proyeccion
      chart.data.datasets[0].data = incomeData;
      chart.data.datasets[1].data = expenseData;
      
      // Proyección: llenar con null los reales para que no se dibujen ahí
      chart.data.datasets[2].data = new Array(labels.length).fill(null);
      chart.data.datasets[3].data = new Array(labels.length).fill(null);

      chart.update();
    };

    const updatePredictions = (e) => {
      const data = e.detail;
      if (!data || !data.predictions) return;
      
      const insightsEl = document.getElementById('predictiveInsightBanner');
      if (data.insights && insightsEl) {
        insightsEl.innerHTML = `<strong>🔮 Alerta Temprana:</strong> ${data.insights}`;
        insightsEl.style.display = 'block';
      }

      // Si no tenemos datos reales en la grafica, no conectamos
      if (chart.data.labels.length === 0 || chart.data.labels[0] === 'Sin datos') return;

      const incProj = data.predictions.income.projectedPoints;
      const expProj = data.predictions.expense.projectedPoints;

      if (!incProj || incProj.length === 0) return;

      // Unir el último punto real
      const lastLabelIndex = chart.data.labels.length - 1;
      const lastIncome = chart.data.datasets[0].data[lastLabelIndex] || 0;
      const lastExpense = chart.data.datasets[1].data[lastLabelIndex] || 0;

      chart.data.datasets[2].data[lastLabelIndex] = lastIncome;
      chart.data.datasets[3].data[lastLabelIndex] = lastExpense;

      // Extender los labels
      incProj.forEach((pt, i) => {
        const d = new Date(pt.date);
        const dateStr = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
        
        // Agregar si no existe
        if (!chart.data.labels.includes(dateStr)) {
          chart.data.labels.push(dateStr);
          chart.data.datasets[0].data.push(null);
          chart.data.datasets[1].data.push(null);
          chart.data.datasets[2].data.push(pt.amount);
          chart.data.datasets[3].data.push(expProj[i] ? expProj[i].amount : 0);
        }
      });

      chart.update();
    };

    appStore.addEventListener('transaction_history_loaded', updateChart);
    appStore.addEventListener('transaction_added', updateChart);
    appStore.addEventListener('predictions_loaded', updatePredictions);
    
    // Init with current data
    updateChart();
  }
};
