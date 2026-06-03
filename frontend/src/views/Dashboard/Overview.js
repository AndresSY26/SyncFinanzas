import { Router } from '../../core/router.js';
import { SocketClient } from '../../core/socket.js';
import { appStore } from '../../store/appStore.js';
import { BudgetProgress } from '../../components/dashboard/BudgetProgress.js';
import { DonutChart } from '../../components/dashboard/DonutChart.js';

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

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
      <h2 style="margin: 0; color: var(--text-primary);">Dashboard Financiero</h2>
    </div>

    <div class="dashboard-grid">
      <div class="metric-card border-primary">
        <h3>Balance Actual</h3>
        <h1 id="netBalance" class="text-primary">$ 0.00</h1>
      </div>
      <div class="metric-card border-success">
        <h3>Ingresos Totales</h3>
        <h1 id="totalIncome" class="text-success">$ 0.00</h1>
      </div>
      <div class="metric-card border-danger">
        <h3>Gastos Totales</h3>
        <h1 id="totalExpense" class="text-danger">$ 0.00</h1>
      </div>
    </div>

    <!-- Layout dividido en 3 columnas/secciones: Formulario, Presupuestos, Grafica e Historial -->
    <div class="content-grid" style="grid-template-columns: 1fr 1fr 1fr; gap: 20px;">
      
      <!-- Columna Izquierda: Formulario -->
      <div class="card" style="height: fit-content;">
        <h3 style="margin-top: 0; border-bottom: 2px solid rgba(123, 44, 191, 0.2); padding-bottom: 10px;">Registrar Movimiento</h3>
        <form id="transactionForm">
          <select id="txTipo" required>
            <option value="income">Ingreso (+)</option>
            <option value="expense">Gasto (-)</option>
          </select>
          
          <input type="number" id="txMonto" placeholder="Monto (ej: 100.50)" step="0.01" required>
          
          <select id="txCategoria" required>
            <option value="" disabled selected>Selecciona Categoría...</option>
            <option value="Salario">Salario</option>
            <option value="Ventas">Ventas</option>
            <option value="Comida">Comida</option>
            <option value="Transporte">Transporte</option>
            <option value="Servicios">Servicios Básicos</option>
            <option value="Entretenimiento">Entretenimiento</option>
            <option value="Otros">Otros</option>
          </select>

          <input type="text" id="txDescripcion" placeholder="Descripción breve">
          <button type="submit" style="margin-top: 15px; font-size: 1.1rem; padding: 12px;">Procesar Transacción</button>
        </form>
      </div>

      <!-- Columna Central: Presupuestos y Donut -->
      <div style="display: flex; flex-direction: column; gap: 20px;">
        <div id="budgetProgressRoot"></div>
        <div id="donutChartRoot"></div>
      </div>

      <!-- Columna Derecha: Historial -->
      <div class="card" style="height: fit-content;">
        <h3 style="margin-top: 0; border-bottom: 2px solid rgba(123, 44, 191, 0.2); padding-bottom: 10px;">Historial de Transacciones</h3>
        <ul id="historyList" class="history-list">
          <p id="emptyHistoryMsg" style="color: #6c757d; text-align: center; margin-top: 30px; font-style: italic;">
            El historial está vacío. Registra tu primera transacción.
          </p>
        </ul>
      </div>
    </div>
  `;

  const netBalanceEl = document.getElementById('netBalance');
  const totalIncomeEl = document.getElementById('totalIncome');
  const totalExpenseEl = document.getElementById('totalExpense');
  const historyListEl = document.getElementById('historyList');

  // Funciones de actualización de la UI basadas en el Store
  const updateBalanceUI = (e) => {
    const data = e.detail;
    netBalanceEl.innerText = `$ ${data.currentBalance.toFixed(2)}`;
    totalIncomeEl.innerText = `$ ${data.totalIncome.toFixed(2)}`;
    totalExpenseEl.innerText = `$ ${data.totalExpense.toFixed(2)}`;
    
    if (data.currentBalance < 0) {
      netBalanceEl.className = 'text-danger';
    } else {
      netBalanceEl.className = 'text-primary';
    }
  };

  const updateHistoryUI = (e) => {
    const tx = e.detail;
    document.getElementById('txMonto').value = '';
    document.getElementById('txDescripcion').value = '';

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
    amountDiv.textContent = `${amountSign}$${montoFloat}`;

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
      amountDiv.textContent = `${amountSign}$${montoFloat}`;

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
    textSpan.textContent = `Límite: $${alertData.limite.toFixed(2)} | Gastado: $${alertData.gastado.toFixed(2)}`;

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

  // Suscripción al Store Global
  appStore.addEventListener('balance_changed', updateBalanceUI);
  appStore.addEventListener('transaction_added', updateHistoryUI);
  appStore.addEventListener('transaction_history_loaded', renderFullHistory);
  appStore.addEventListener('budget_alert', showToastUI);

  // Inicializar estado actual en UI si ya existe
  const currentBalance = appStore.getBalance();
  if (currentBalance && (currentBalance.currentBalance !== 0 || currentBalance.totalIncome !== 0)) {
    updateBalanceUI({ detail: currentBalance });
  }

  // Si hay transacciones en el store, renderizarlas
  if (appStore.state.transactions.length > 0) {
    renderFullHistory({ detail: appStore.state.transactions });
  }

  // Solicitar lista completa al backend
  if (socket) {
    socket.emit('transaction:list');
  }

  // Mount components
  BudgetProgress.render('budgetProgressRoot');
  DonutChart.render('donutChartRoot');

  // Emisión (Action) - La vista sigue enviando la petición a través del socket
  document.getElementById('transactionForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const inputMonto = parseFloat(document.getElementById('txMonto').value);
    
    const payload = {
      tipo: document.getElementById('txTipo').value,
      monto: isNaN(inputMonto) ? 0 : inputMonto,
      categoria: document.getElementById('txCategoria').value,
      descripcion: document.getElementById('txDescripcion').value
    };

    socket.emit('transaction:create', payload);
  });

  // Importante: Limpieza al desmontar para evitar memory leaks!
  // Como `renderDashboard` reemplaza el HTML, idealmente el router debería llamar un método de limpieza
  // Por ahora lo solucionamos usando un observer o asumiendo que el store manejará los listeners globalmente,
  // pero para evitar fugas en esta SPA limpia, podemos limpiar los viejos eventos si se vuelve a montar.
  // Un enfoque sencillo es sobreescribir los metodos o removerlos antes de agregar.
};
