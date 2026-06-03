import './History.css';
import { appStore } from '../../store/appStore.js';

export const renderHistory = (container) => {
  const txs = appStore.state.transactions || [];
  
  if (txs.length === 0) {
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
        <h2 style="margin: 0; color: var(--text-primary);">Historial Completo</h2>
      </div>
      <div class="empty-history-state">
        <div class="empty-icon">📋</div>
        <h3 style="color: var(--text-primary); margin-bottom: 10px;">Aún no tienes movimientos registrados</h3>
        <p style="color: var(--text-secondary); margin-top: 0;">Vuelve a la pestaña "Resumen" para registrar tu primera transacción y comenzar a tomar el control.</p>
      </div>
    `;
    return;
  }

  const listHtml = txs.map(tx => {
    const isIncome = tx.tipo === 'income';
    const amountSign = isIncome ? '+' : '-';
    const amountClass = isIncome ? 'text-cyan' : 'text-pink';
    const montoFloat = parseFloat(tx.monto).toFixed(2);
    
    // Parse fecha para mostrar dd/mm/yyyy hh:mm AM/PM
    const dateObj = new Date(tx.fecha);
    const dateStr = dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true });

    return `
      <div class="detailed-history-card">
        <div class="dh-left">
          <div class="dh-icon ${isIncome ? 'bg-cyan-light' : 'bg-pink-light'}">
            ${isIncome ? '↓' : '↑'}
          </div>
          <div class="dh-details">
            <h4>${tx.descripcion || 'Sin descripción'}</h4>
            <span class="dh-date">${dateStr} • ${timeStr}</span>
          </div>
        </div>
        <div class="dh-right">
          <span class="dh-pill ${isIncome ? 'pill-income' : 'pill-expense'}">${tx.categoria}</span>
          <span class="dh-amount ${amountClass}">${amountSign}$${montoFloat}</span>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
      <h2 style="margin: 0; color: var(--text-primary);">Historial Completo</h2>
    </div>
    <div class="detailed-history-list">
      ${listHtml}
    </div>
  `;

  // Añadimos reactividad para cuando haya eventos de websocket si el usuario sigue en la vista
  if (!appStore.hasHistoryViewListener) {
    appStore.addEventListener('transaction_added', () => {
      if (window.location.pathname === '/dashboard/history') {
        const currentContainer = document.getElementById('dashboard-content');
        if (currentContainer) renderHistory(currentContainer);
      }
    });
    appStore.hasHistoryViewListener = true;
  }
};
