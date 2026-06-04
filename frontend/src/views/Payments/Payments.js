import './Payments.css';
import { appStore } from '../../store/appStore.js';
import { showNotification } from '../../components/common/Toast.js';
import { SocketClient } from '../../core/socket.js';

export const renderPayments = (container) => {
  let modalActiveTab = 'billetera';

  const renderContent = () => {
    const methods = appStore.state.paymentMethods || [];
    
    let html = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
        <h2 style="margin: 0; color: var(--text-primary);">Mis Cuentas y Tarjetas</h2>
        ${methods.length > 0 ? '<button class="add-payment-btn" id="btnOpenModal">+ Vincular Cuenta</button>' : ''}
      </div>
    `;

    if (methods.length === 0) {
      html += `
        <div class="empty-payments-state">
          <div class="empty-icon">💳</div>
          <h3 style="color: var(--text-primary); margin-bottom: 10px;">No tienes cuentas ni billeteras vinculadas aún</h3>
          <p style="color: var(--text-secondary); margin-top: 0; margin-bottom: 25px;">Agrega tu primera tarjeta o billetera virtual para gestionar tus finanzas de forma integral.</p>
          <button class="add-payment-btn empty-btn" id="btnOpenModalEmpty">+ Vincular Cuenta o Billetera</button>
        </div>
      `;
    } else {
      html += `<div class="payments-grid">`;
      methods.forEach(method => {
        if (method.type === 'billetera') {
          const isNequi = method.platform === 'Nequi';
          const isDavi = method.platform === 'Daviplata';
          const bgClass = isNequi ? 'bg-nequi' : isDavi ? 'bg-davi' : 'bg-paypal';
          html += `
            <div class="payment-card ${bgClass}">
              <div class="card-header">
                <span class="card-type">Billetera Digital</span>
                <span class="card-logo">${method.platform}</span>
              </div>
              <div class="card-body">
                <h3>${method.identifier}</h3>
                <p>Conectado y listo para pagos</p>
              </div>
            </div>
          `;
        } else if (method.type === 'tarjeta') {
          html += `
            <div class="payment-card credit-card">
              <div class="card-header">
                <span class="card-type">Tarjeta de Crédito/Débito</span>
                <span class="card-logo">💳</span>
              </div>
              <div class="card-body">
                <div class="card-chip"></div>
                <p class="card-number">**** **** **** ${method.number.slice(-4)}</p>
                <div class="card-details">
                  <div>
                    <p class="detail-lbl">Titular</p>
                    <p class="detail-val">${method.holder}</p>
                  </div>
                  <div>
                    <p class="detail-lbl">Expira</p>
                    <p class="detail-val">${method.expiry}</p>
                  </div>
                </div>
              </div>
            </div>
          `;
        } else if (method.type === 'banco') {
          html += `
            <div class="payment-card bank-card">
              <div class="card-header">
                <span class="card-type">Cuenta Bancaria</span>
                <span class="card-logo">🏦 ${method.bank}</span>
              </div>
              <div class="card-body">
                <h3>Cuenta de ${method.accountType}</h3>
                <p class="card-number">No. ${method.accountNumber}</p>
                <p>Vinculada con éxito</p>
              </div>
            </div>
          `;
        }
      });
      html += `</div>`;
    }

    // Modal inyectado directamente en el contenedor local
    html += `
      <div id="paymentModalOverlay" class="modal-overlay" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(4px); z-index: 9999; align-items: center; justify-content: center;">
        <div class="modal-content fade-up-enter" id="paymentModalContent" style="background: var(--surface-card); width: 90%; max-width: 500px; border-radius: 20px; padding: 25px; box-shadow: 0 15px 35px rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05);">
          <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="margin: 0; color: var(--text-primary);">Vincular Cuenta o Billetera</h3>
            <button class="close-modal-btn" id="btnCloseModal" style="background: none; border: none; color: var(--text-secondary); font-size: 1.5rem; cursor: pointer;">&times;</button>
          </div>
          
          <div class="modal-tabs" style="display: flex; gap: 10px; margin-bottom: 20px; background: rgba(0,0,0,0.2); padding: 5px; border-radius: 12px;">
            <button class="pill-tab active" data-tab="billetera" style="flex: 1; padding: 10px; border: none; border-radius: 8px; background: var(--accent-primary); color: white; cursor: pointer; transition: 0.3s;">Billetera Digital</button>
            <button class="pill-tab" data-tab="tarjeta" style="flex: 1; padding: 10px; border: none; border-radius: 8px; background: transparent; color: var(--text-secondary); cursor: pointer; transition: 0.3s;">Tarjeta</button>
            <button class="pill-tab" data-tab="banco" style="flex: 1; padding: 10px; border: none; border-radius: 8px; background: transparent; color: var(--text-secondary); cursor: pointer; transition: 0.3s;">Banco</button>
          </div>

          <div class="modal-body">
            <form id="paymentForm">
              <div id="form-billetera" class="tab-content active">
                <div class="input-group" style="margin-bottom: 15px;">
                  <select id="billPlatform" class="auth-input" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); color: white;">
                    <option value="" style="color: black;">Selecciona la Plataforma...</option>
                    <option value="Nequi" style="color: black;">Nequi</option>
                    <option value="Daviplata" style="color: black;">Daviplata</option>
                    <option value="PayPal" style="color: black;">PayPal</option>
                  </select>
                </div>
                <div class="input-group" style="margin-bottom: 15px;">
                  <input type="text" id="billId" class="auth-input" placeholder="Número de Celular o Email" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); color: white; box-sizing: border-box;">
                </div>
              </div>

              <div id="form-tarjeta" class="tab-content" style="display: none;">
                <div class="input-group" style="margin-bottom: 15px;">
                  <input type="text" id="cardNumber" class="auth-input" placeholder="Número de Tarjeta (16 dígitos)" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); color: white; box-sizing: border-box;">
                </div>
                <div class="input-group" style="margin-bottom: 15px;">
                  <input type="text" id="cardHolder" class="auth-input" placeholder="Nombre del Titular" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); color: white; box-sizing: border-box;">
                </div>
                <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                  <div class="input-group" style="flex: 1;">
                    <input type="text" id="cardExpiry" class="auth-input" placeholder="MM/YY" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); color: white; box-sizing: border-box;">
                  </div>
                  <div class="input-group" style="flex: 1;">
                    <input type="text" id="cardCvv" class="auth-input" placeholder="CVV" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); color: white; box-sizing: border-box;">
                  </div>
                </div>
              </div>

              <div id="form-banco" class="tab-content" style="display: none;">
                <div class="input-group" style="margin-bottom: 15px;">
                  <select id="bankName" class="auth-input" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); color: white;">
                    <option value="" style="color: black;">Selecciona el Banco...</option>
                    <option value="Bancolombia" style="color: black;">Bancolombia</option>
                    <option value="Davivienda" style="color: black;">Davivienda</option>
                    <option value="Banco de Bogotá" style="color: black;">Banco de Bogotá</option>
                    <option value="BBVA" style="color: black;">BBVA</option>
                  </select>
                </div>
                <div class="input-group" style="margin-bottom: 15px;">
                  <select id="bankAccType" class="auth-input" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); color: white;">
                    <option value="" style="color: black;">Tipo de Cuenta...</option>
                    <option value="Ahorros" style="color: black;">Ahorros</option>
                    <option value="Corriente" style="color: black;">Corriente</option>
                  </select>
                </div>
                <div class="input-group" style="margin-bottom: 15px;">
                  <input type="text" id="bankAccNumber" class="auth-input" placeholder="Número de Cuenta" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); color: white; box-sizing: border-box;">
                </div>
              </div>

              <button type="submit" class="auth-btn" style="width: 100%; padding: 14px; border-radius: 12px; background: linear-gradient(135deg, var(--accent-primary), var(--accent-pink)); color: white; border: none; font-weight: bold; cursor: pointer; margin-top: 15px;">Guardar Cuenta o Billetera</button>
            </form>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
    
    // Asignación explícita de referencias DESPUÉS de inyectar al DOM
    const btnOpen = container.querySelector('#btnOpenModal');
    const btnOpenEmpty = container.querySelector('#btnOpenModalEmpty');
    const btnClose = container.querySelector('#btnCloseModal');
    const overlay = container.querySelector('#paymentModalOverlay');
    const modalContent = container.querySelector('#paymentModalContent');
    const form = container.querySelector('#paymentForm');
    const tabs = container.querySelectorAll('.pill-tab');

    const openModal = () => {
      if (overlay) overlay.style.display = 'flex';
      if (form) form.reset();
      switchTab('billetera');
    };

    const closeModal = () => {
      if (overlay) overlay.style.display = 'none';
    };

    const switchTab = (tabId) => {
      tabs.forEach(t => {
        t.classList.remove('active');
        t.style.background = 'transparent';
        t.style.color = 'var(--text-secondary)';
      });
      const activeTab = Array.from(tabs).find(t => t.dataset.tab === tabId);
      if (activeTab) {
        activeTab.classList.add('active');
        activeTab.style.background = 'var(--accent-primary)';
        activeTab.style.color = 'white';
      }

      container.querySelectorAll('.tab-content').forEach(tc => {
        tc.style.display = 'none';
        tc.classList.remove('active');
      });
      const activeContent = container.querySelector('#form-' + tabId);
      if (activeContent) {
        activeContent.style.display = 'block';
        activeContent.classList.add('active');
      }
      modalActiveTab = tabId;
    };

    // Mapeo seguro de eventos (sin depender de window u onclicks perdidos)
    if (btnOpen) btnOpen.addEventListener('click', openModal);
    if (btnOpenEmpty) btnOpenEmpty.addEventListener('click', openModal);
    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (overlay) overlay.addEventListener('click', closeModal);
    if (modalContent) modalContent.addEventListener('click', (e) => e.stopPropagation());

    tabs.forEach(tab => {
      tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        let newMethod = { type: modalActiveTab };

        if (modalActiveTab === 'billetera') {
          const platform = form.querySelector('#billPlatform').value;
          const id = form.querySelector('#billId').value.trim();
          if (!platform || !id) return showNotification('Por favor completa la plataforma y el identificador.', 'error');
          newMethod.platform = platform;
          newMethod.identifier = id;
        } else if (modalActiveTab === 'tarjeta') {
          const num = form.querySelector('#cardNumber').value.trim();
          const holder = form.querySelector('#cardHolder').value.trim();
          const exp = form.querySelector('#cardExpiry').value.trim();
          const cvv = form.querySelector('#cardCvv').value.trim();
          if (!num || !holder || !exp || !cvv) return showNotification('Por favor completa todos los datos de la tarjeta.', 'error');
          newMethod.number = num;
          newMethod.holder = holder;
          newMethod.expiry = exp;
        } else if (modalActiveTab === 'banco') {
          const bank = form.querySelector('#bankName').value;
          const accType = form.querySelector('#bankAccType').value;
          const accNum = form.querySelector('#bankAccNumber').value.trim();
          if (!bank || !accType || !accNum) return showNotification('Por favor selecciona el banco y detalla la cuenta.', 'error');
          newMethod.bank = bank;
          newMethod.accountType = accType;
          newMethod.accountNumber = accNum;
        }

        const socket = SocketClient.getSocket();
        if (socket) {
          socket.emit('account:create', newMethod);
        } else {
          showNotification('Error de conexión en tiempo real', 'error');
        }
        
        closeModal();
      });
    }
  };

  const handlePaymentChange = () => {
    renderContent();
  };

  appStore.addEventListener('payment_methods_changed', handlePaymentChange);
  
  const observer = new MutationObserver(() => {
    if (!document.contains(container)) {
      appStore.removeEventListener('payment_methods_changed', handlePaymentChange);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  renderContent();
};

