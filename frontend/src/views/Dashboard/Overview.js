import { Router } from '../../core/router.js';
import { SocketClient } from '../../core/socket.js';
import { appStore } from '../../store/appStore.js';
import { BudgetProgress } from '../../components/dashboard/BudgetProgress.js';
import { DonutChart } from '../../components/dashboard/DonutChart.js';
import { TrendChart } from '../../components/dashboard/TrendChart.js';
import { SavingsGoal } from '../../components/dashboard/SavingsGoal.js';
import { formatCurrency } from '../../utils/formatters.js';
import { TransactionModal } from '../../components/dashboard/TransactionModal.js';

export const renderOverview = (container) => {
  const token = localStorage.getItem('jwtToken');
  let socket = SocketClient.getSocket();
  
  if (!socket && token) {
    SocketClient.connect(token);
    socket = SocketClient.getSocket();
  }

  if (!socket || !token) {
    alert('Sesión no iniciada o expirada. Redirigiendo a Login.');
    Router.navigate('/login');
    return;
  }

  container.innerHTML = '<div id="overview-view-root"></div>';
  const root = container.querySelector('#overview-view-root');

  root.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
      <h2 style="margin: 0; color: var(--text-primary);">Dashboard Financiero</h2>
      <div style="display: flex; gap: 15px; align-items: center;">
        <div class="segment-control" id="dateFilterTabs">
          <button class="segment-btn" data-val="today">Hoy</button>
          <button class="segment-btn" data-val="7days">7 Días</button>
          <button class="segment-btn" data-val="month">Este Mes</button>
          <button class="segment-btn active" data-val="all">Todo</button>
        </div>
        <button id="btnOpenTxModal" class="navbar-btn" style="padding: 8px 16px; font-size: 0.95rem; border-radius: 50px; width: max-content;">+ Registrar Movimiento</button>
      </div>
    </div>

    <div class="dashboard-grid">
      <div class="metric-card border-primary">
        <h3>Balance Actual</h3>
        <div id="netBalanceContainer"></div>
      </div>
      <div class="metric-card border-success">
        <h3>Ingresos Totales</h3>
        <div id="totalIncomeContainer"></div>
      </div>
      <div class="metric-card border-danger">
        <h3>Gastos Totales</h3>
        <div id="totalExpenseContainer"></div>
      </div>
    </div>

    <!-- Layout de Dos Columnas Simétricas -->
    <div class="content-grid" style="grid-template-columns: 1fr 1fr; gap: 20px;">
      
      <!-- Columna Izquierda -->
      <div style="display: flex; flex-direction: column; gap: 20px;">
        <div id="budgetProgressRoot"></div>
        <div id="donutChartRoot"></div>
        
        <div id="pocketsRoot" class="card" style="padding: 20px; border-radius: 20px; background: var(--surface-card); margin-bottom: 0; height: fit-content;">
          <h3 style="margin-top: 0; margin-bottom: 15px; border-bottom: 2px solid rgba(123, 44, 191, 0.2); padding-bottom: 10px; color: var(--text-primary);">Mis Bolsillos Principales</h3>
          <div id="pocketsList" style="display: flex; flex-direction: column; gap: 10px;">
            <p style="color: var(--text-secondary); text-align: center; margin: 0; font-size: 0.9rem;">Cargando bolsillos...</p>
          </div>
        </div>
      </div>

      <!-- Columna Derecha -->
      <div style="display: flex; flex-direction: column; gap: 20px;">
        
        <div class="card" style="height: fit-content; margin-bottom: 0;">
          <h3 style="margin-top: 0; border-bottom: 2px solid rgba(123, 44, 191, 0.2); padding-bottom: 10px; color: var(--text-primary);">Historial de Transacciones</h3>
          <ul id="historyList" class="history-list">
            <p id="emptyHistoryMsg" style="color: #6c757d; text-align: center; margin-top: 30px; font-style: italic;">
              El historial está vacío. Registra tu primera transacción.
            </p>
          </ul>
        </div>

        <div id="trendChartRoot"></div>
        
        <div id="savingsGoalRoot" style="height: fit-content; display: flex; flex-direction: column;"></div>
        
      </div>
    </div>
  `;

  const historyListEl = document.getElementById('historyList');

  const updateBalanceUI = (e) => {
    const balances = e.detail || [];
    
    const netBalanceContainer = document.getElementById('netBalanceContainer');
    const totalIncomeContainer = document.getElementById('totalIncomeContainer');
    const totalExpenseContainer = document.getElementById('totalExpenseContainer');
    
    if(!netBalanceContainer) return;

    netBalanceContainer.innerHTML = '';
    totalIncomeContainer.innerHTML = '';
    totalExpenseContainer.innerHTML = '';

    if (!Array.isArray(balances) || balances.length === 0) {
      netBalanceContainer.innerHTML = `<h1 class="text-primary" style="margin:0;">${formatCurrency(0, 'COP')}</h1>`;
      totalIncomeContainer.innerHTML = `<h1 class="text-success" style="margin:0;">${formatCurrency(0, 'COP')}</h1>`;
      totalExpenseContainer.innerHTML = `<h1 class="text-danger" style="margin:0;">${formatCurrency(0, 'COP')}</h1>`;
      return;
    }

    balances.forEach(b => {
      const netClass = b.currentBalance < 0 ? 'text-danger' : 'text-primary';
      netBalanceContainer.innerHTML += `<h2 class="${netClass}" style="margin: 5px 0; font-size: 1.5rem;">${formatCurrency(b.currentBalance, b.moneda)}</h2>`;
      totalIncomeContainer.innerHTML += `<h2 class="text-success" style="margin: 5px 0; font-size: 1.5rem;">${formatCurrency(b.totalIncome, b.moneda)}</h2>`;
      totalExpenseContainer.innerHTML += `<h2 class="text-danger" style="margin: 5px 0; font-size: 1.5rem;">${formatCurrency(b.totalExpense, b.moneda)}</h2>`;
    });
  };

  const updateHistoryUI = (e) => {
    const tx = e.detail;

    if (document.getElementById('emptyHistoryMsg')) {
      document.getElementById('emptyHistoryMsg').remove();
    }

    const li = document.createElement('li');
    li.className = 'history-item';
    
    const isIncome = tx.tipo === 'income';
    const amountSign = isIncome ? '+' : '-';
    const amountClass = isIncome ? 'tx-income' : 'tx-expense';
    const montoFloat = parseFloat(tx.monto).toFixed(2);

    const infoDiv = document.createElement('div');
    infoDiv.className = 'tx-info';

    const catSpan = document.createElement('span');
    catSpan.className = 'tx-cat';
    catSpan.textContent = tx.categoria;

    const descSpan = document.createElement('span');
    descSpan.className = 'tx-desc';
    descSpan.textContent = tx.descripcion || 'Sin descripción';

    infoDiv.appendChild(catSpan);
    infoDiv.appendChild(descSpan);

    const amountDiv = document.createElement('div');
    amountDiv.className = `tx-amount ${amountClass}`;
    amountDiv.textContent = `${amountSign}${formatCurrency(tx.monto, tx.moneda || 'COP')}`;

    li.appendChild(infoDiv);
    li.appendChild(amountDiv);

    historyListEl.prepend(li);
  };

  const renderFullHistory = (e) => {
    const txs = e.detail;
    historyListEl.innerHTML = '';
    
    if (!txs || txs.length === 0) {
      historyListEl.innerHTML = `
        <p id="emptyHistoryMsg" style="color: #6c757d; text-align: center; margin-top: 30px; font-style: italic;">
          El historial está vacío. Registra tu primera transacción.
        </p>`;
      return;
    }

    txs.forEach(tx => {
      const li = document.createElement('li');
      li.className = 'history-item';
      
      const isIncome = tx.tipo === 'income';
      const amountSign = isIncome ? '+' : '-';
      const amountClass = isIncome ? 'tx-income' : 'tx-expense';
      const montoFloat = parseFloat(tx.monto).toFixed(2);

      const infoDiv = document.createElement('div');
      infoDiv.className = 'tx-info';

      const catSpan = document.createElement('span');
      catSpan.className = 'tx-cat';
      catSpan.textContent = tx.categoria;

      const descSpan = document.createElement('span');
      descSpan.className = 'tx-desc';
      descSpan.textContent = tx.descripcion || 'Sin descripción';

      infoDiv.appendChild(catSpan);
      infoDiv.appendChild(descSpan);

      const amountDiv = document.createElement('div');
      amountDiv.className = `tx-amount ${amountClass}`;
      amountDiv.textContent = `${amountSign}${formatCurrency(tx.monto, tx.moneda || 'COP')}`;

      li.appendChild(infoDiv);
      li.appendChild(amountDiv);
      
      historyListEl.appendChild(li); // append in order
    });
  };

  const showToastUI = (e) => {
    const alertData = e.detail;
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toastContainer';
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    const contentDiv = document.createElement('div');
    contentDiv.className = 'toast-content';

    const titleSpan = document.createElement('span');
    titleSpan.className = 'toast-title';
    titleSpan.textContent = `⚠️ ${alertData.mensaje}`;

    const textSpan = document.createElement('span');
    textSpan.className = 'toast-text';
    textSpan.textContent = `Límite: ${formatCurrency(alertData.limite)} | Gastado: ${formatCurrency(alertData.gastado)}`;

    contentDiv.appendChild(titleSpan);
    contentDiv.appendChild(textSpan);
    toast.appendChild(contentDiv);

    toastContainer.appendChild(toast);
    setTimeout(() => { toast.classList.add('show'); }, 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 5000);
  };

  const renderPockets = () => {
    const pocketsList = document.getElementById('pocketsList');
    if (!pocketsList) return;

    const methods = appStore.state.paymentMethods || [];
    const balances = appStore.state.accountBalances || [];

    if (methods.length === 0) {
      pocketsList.innerHTML = `<p style="color: var(--text-secondary); text-align: center; margin: 0; font-size: 0.9rem;">No tienes cuentas vinculadas.</p>`;
      return;
    }

    let html = '';
    methods.forEach(method => {
      const accountBal = balances.find(b => b.cuenta_id === method.id);
      if (!accountBal) return; // Solo mostrar si tiene un balance asociado
      
      const balanceVal = accountBal.balance;
      const currency = accountBal.moneda || 'COP';

      // Enmascaramiento igual que en Payments.js pero adaptado
      let maskedId = '';
      let icon = '';
      if (method.type === 'billetera') {
        icon = method.platform === 'Nequi' ? '📱' : method.platform === 'Daviplata' ? '🔴' : '🅿️';
        maskedId = method.identifier;
        if (maskedId.includes('@')) {
          const [local, domain] = maskedId.split('@');
          if (local.length > 4) {
            maskedId = `${local[0]}***@${domain}`;
          } else {
            maskedId = `***@${domain}`;
          }
        } else {
          maskedId = `***${maskedId.slice(-3)}`;
        }
      } else if (method.type === 'tarjeta') {
        icon = '💳';
        maskedId = `***${method.number.slice(-3)}`;
      } else if (method.type === 'banco') {
        icon = '🏦';
        maskedId = `***${method.accountNumber.slice(-3)}`;
      }

      html += `
        <div class="pocket-item">
          <div style="display: flex; align-items: center; gap: 15px;">
            <div style="display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; background: var(--background-global); border-radius: 12px; font-size: 1.4rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
              ${icon}
            </div>
            <div style="display: flex; flex-direction: column; gap: 2px;">
              <span style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">${method.platform || method.bank || 'Tarjeta'}</span>
              <span style="font-size: 0.95rem; font-weight: bold; color: var(--text-primary);">${maskedId}</span>
            </div>
          </div>
          <span style="font-size: 1.05rem; font-weight: 800; color: ${balanceVal < 0 ? 'var(--accent-pink)' : 'var(--primary-purple)'}">${formatCurrency(balanceVal, currency)}</span>
        </div>
      `;
    });

    if (html === '') {
      pocketsList.innerHTML = `<p style="color: var(--text-secondary); text-align: center; margin: 0; font-size: 0.9rem;">Sin fondos en bolsillos.</p>`;
    } else {
      pocketsList.innerHTML = html;
    }
  };

  // Suscripción al Store Global
  appStore.addEventListener('balance_changed', updateBalanceUI);
  appStore.addEventListener('transaction_added', updateHistoryUI);
  appStore.addEventListener('transaction_history_loaded', renderFullHistory);
  appStore.addEventListener('budget_alert', showToastUI);
  appStore.addEventListener('account_balances_loaded', renderPockets);
  appStore.addEventListener('payment_methods_changed', renderPockets);

  // Inicializar estado actual en UI si ya existe
  const currentBalance = appStore.getBalance();
  if (Array.isArray(currentBalance) && currentBalance.length > 0) {
    updateBalanceUI({ detail: currentBalance });
  }

  // Si hay transacciones en el store, renderizarlas
  if (appStore.state.transactions.length > 0) {
    renderFullHistory({ detail: appStore.state.transactions });
  }

  // Solicitar lista completa al backend
  if (socket) {
    socket.emit('transaction:list');
    if (appStore.state.paymentMethods.length === 0) {
      socket.emit('account:list');
    }
  }

  // Mount components
  BudgetProgress.render('budgetProgressRoot');
  DonutChart.render('donutChartRoot');
  TrendChart.render('trendChartRoot');
  SavingsGoal.render('savingsGoalRoot');

  // Abrir Modal de Transacciones
  document.getElementById('btnOpenTxModal').addEventListener('click', () => {
    TransactionModal.render();
  });

  const dateFilterTabs = document.getElementById('dateFilterTabs');
  if (dateFilterTabs && socket) {
    const btns = dateFilterTabs.querySelectorAll('.segment-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        btns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        socket.emit('dashboard:filter', e.target.dataset.val);
      });
    });
  }

  const observer = new MutationObserver(() => {
    if (!document.contains(root)) {
      appStore.removeEventListener('balance_changed', updateBalanceUI);
      appStore.removeEventListener('transaction_added', updateHistoryUI);
      appStore.removeEventListener('transaction_history_loaded', renderFullHistory);
      appStore.removeEventListener('budget_alert', showToastUI);
      appStore.removeEventListener('account_balances_loaded', renderPockets);
      appStore.removeEventListener('payment_methods_changed', renderPockets);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
};
