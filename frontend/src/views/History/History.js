import './History.css';
import { appStore } from '../../store/appStore.js';
import { SocketClient } from '../../core/socket.js';
import { TransactionModal } from '../../components/dashboard/TransactionModal.js';
import { InternalTransferModal } from '../../components/dashboard/InternalTransferModal.js';

export const renderHistory = (container) => {
  const txs = appStore.state.transactions || [];
  const currentFilter = appStore.state.historyFilter || 'Todos';

  const headerHtml = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
      <div style="display: flex; align-items: center; gap: 15px;">
        <h2 style="margin: 0; color: var(--text-primary);">Movimientos</h2>
        <select id="historyFilterSelect" class="form-input" style="width: auto; padding: 6px 16px; border-radius: 12px; cursor: pointer; background-color: var(--surface-card); color: var(--text-primary); border: 2px solid rgba(123, 44, 191, 0.1);">
          <option value="Este Mes" ${currentFilter === 'Este Mes' ? 'selected' : ''}>Este Mes</option>
          <option value="3 Meses" ${currentFilter === '3 Meses' ? 'selected' : ''}>3 Meses</option>
          <option value="6 Meses" ${currentFilter === '6 Meses' ? 'selected' : ''}>6 Meses</option>
          <option value="Todos" ${currentFilter === 'Todos' ? 'selected' : ''}>Todos</option>
        </select>
      </div>
      <div style="display: flex; gap: 10px;">
        <button id="btnInternalTransfer" class="navbar-btn" style="padding: 8px 16px; font-size: 0.95rem; border-radius: 50px; display: flex; align-items: center; gap: 5px; background: rgba(123, 44, 191, 0.1); color: var(--text-primary); border: 1px solid rgba(123, 44, 191, 0.3);">
          <i class="ri-arrow-left-right-line"></i> ⇄ Transferencia Interna
        </button>
        <button id="btnRegisterTx" class="navbar-btn" style="padding: 8px 16px; font-size: 0.95rem; border-radius: 50px; display: flex; align-items: center; gap: 5px;">
          <i class="ri-add-line"></i> + Registrar Movimiento
        </button>
      </div>
    </div>
  `;

  const setupFilterListener = () => {
    const select = document.getElementById('historyFilterSelect');
    if (select) {
      select.addEventListener('change', (e) => {
        const val = e.target.value;
        appStore.state.historyFilter = val;
        const socket = SocketClient.getSocket();
        if (socket) {
          socket.emit('dashboard:filter', val);
        }
      });
    }

    const btnTransfer = document.getElementById('btnInternalTransfer');
    if (btnTransfer) {
      const methods = appStore.state.paymentMethods || [];
      if (methods.length < 2) {
        btnTransfer.style.opacity = '0.5';
        btnTransfer.style.cursor = 'not-allowed';
        btnTransfer.title = 'Necesitas al menos 2 cuentas para realizar transferencias internas';
      } else {
        btnTransfer.addEventListener('click', () => {
          InternalTransferModal.render();
        });
      }
    }

    const btnRegister = document.getElementById('btnRegisterTx');
    if (btnRegister) {
      btnRegister.addEventListener('click', () => {
        TransactionModal.render();
      });
    }
  };

  // Solicitar datos al backend siempre que entremos a esta vista
  // Usamos un pequeño dataset en el contenedor para evitar loops infinitos
  const socket = SocketClient.getSocket();
  if (socket && container.dataset.loadedFilter !== currentFilter) {
    // Si acaba de cargar, forzamos un refetch con el filtro actual
    setTimeout(() => {
      socket.emit('dashboard:filter', currentFilter);
    }, 50);
    container.dataset.loadedFilter = currentFilter;
  }

  if (txs.length === 0) {
    container.innerHTML = `
      ${headerHtml}
      <div class="empty-history-state">
        <div class="empty-icon">📋</div>
        <h3 style="color: var(--text-primary); margin-bottom: 10px;">Aún no tienes movimientos en este periodo</h3>
        <p style="color: var(--text-secondary); margin-top: 0;">Intenta cambiar el filtro o registra una nueva transacción.</p>
      </div>
    `;
    setupFilterListener();
  } else {
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
      ${headerHtml}
      <div class="detailed-history-list">
        ${listHtml}
      </div>
    `;
    setupFilterListener();
  }

  // Añadimos reactividad para cuando haya eventos de websocket si el usuario sigue en la vista
  if (!appStore.hasHistoryViewListener) {
    const reRenderIfActive = () => {
      if (window.location.pathname === '/dashboard/transfers' || window.location.pathname === '/dashboard/history') {
        const currentContainer = document.getElementById('dashboard-content');
        if (currentContainer) renderHistory(currentContainer);
      }
    };
    appStore.addEventListener('transaction_added', reRenderIfActive);
    appStore.addEventListener('transaction_history_loaded', reRenderIfActive);
    appStore.hasHistoryViewListener = true;
  }
};
