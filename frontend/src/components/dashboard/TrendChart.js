import { appStore } from '../../store/appStore.js';
import Chart from 'chart.js/auto';

export const TrendChart = {
  render: (containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="card" style="position: relative; height: 350px; display: flex; flex-direction: column; margin-bottom: 0;">
        <h3 style="margin-top: 0; border-bottom: 2px solid rgba(123, 44, 191, 0.2); padding-bottom: 10px; color: var(--text-primary);">Tendencia de Flujo</h3>
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
        chart.data.datasets[0].data = [0];
        chart.data.datasets[1].data = [0];
        chart.update();
        return;
      }

      // Agrupar por fecha
      const grouped = {};
      txs.forEach(tx => {
        // Usar formato corto "15 Jun"
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

      // Ordenar cronológicamente ascendente (de izquierda a derecha en el gráfico)
      const sortedKeys = Object.keys(grouped).sort((a, b) => grouped[a].timestamp - grouped[b].timestamp);

      const labels = sortedKeys;
      const incomeData = sortedKeys.map(k => grouped[k].income);
      const expenseData = sortedKeys.map(k => grouped[k].expense);

      chart.data.labels = labels;
      chart.data.datasets[0].data = incomeData;
      chart.data.datasets[1].data = expenseData;
      
      chart.update();
    };

    appStore.addEventListener('transaction_history_loaded', updateChart);
    appStore.addEventListener('transaction_added', updateChart);
    
    // Init with current data
    updateChart();
  }
};
