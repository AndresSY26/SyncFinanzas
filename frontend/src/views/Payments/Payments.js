import './Payments.css';
import { appStore } from '../../store/appStore.js';
import { showNotification } from '../../components/common/Toast.js';

export const renderPayments = (container) => {
  let modalActiveTab = 'billetera';

  const renderContent = () => {
    const methods = appStore.state.paymentMethods || [];
    
    let html = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
        <h2 style="margin: 0; color: var(--text-primary);">Cuentas y Métodos de Pago</h2>
        ${methods.length > 0 ? '<button class="add-payment-btn" id="btnOpenModal">+ Vincular Método</button>' : ''}
      </div>
    `;

    if (methods.length === 0) {
      html += `
        <div class="empty-payments-state">
          <div class="empty-icon">💳</div>
          <h3 style="color: var(--text-primary); margin-bottom: 10px;">No tienes cuentas ni métodos de pago vinculados aún</h3>
          <p style="color: var(--text-secondary); margin-top: 0; margin-bottom: 25px;">Agrega tu primera tarjeta o billetera virtual para gestionar tus finanzas de forma integral.</p>
          <button class="add-payment-btn empty-btn" id="btnOpenModalEmpty">+ Vincular Método de Pago</button>
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

    // Modal UI
    html += `
      <div id="paymentModalOverlay" class="modal-overlay" style="display: none;">
        <div class="modal-content fade-up-enter" id="paymentModalContent">
          <div class="modal-header">
            <h3>Vincular Método de Pago</h3>
            <button class="close-modal-btn" id="btnCloseModal">&times;</button>
          </div>
          
          <div class="modal-tabs">
            <button class="pill-tab active" data-tab="billetera">Billetera Digital</button>
            <button class="pill-tab" data-tab="tarjeta">Tarjeta</button>
            <button class="pill-tab" data-tab="banco">Cuenta Bancaria</button>
          </div>

          <div class="modal-body">
            <form id="paymentForm">
              <div id="form-billetera" class="tab-content active">
                <div class="input-group">
                  <select id="billPlatform" class="auth-input">
                    <option value="">Selecciona la Plataforma...</option>
                    <option value="Nequi">Nequi</option>
                    <option value="Daviplata">Daviplata</option>
                    <option value="PayPal">PayPal</option>
                  </select>
                </div>
                <div class="input-group">
                  <input type="text" id="billId" class="auth-input" placeholder="Número de Celular o Email">
                </div>
              </div>

              <div id="form-tarjeta" class="tab-content" style="display: none;">
                <div class="input-group">
                  <input type="text" id="cardNumber" class="auth-input" placeholder="Número de Tarjeta (16 dígitos)">
                </div>
                <div class="input-group">
                  <input type="text" id="cardHolder" class="auth-input" placeholder="Nombre del Titular">
                </div>
                <div style="display: flex; gap: 10px;">
                  <div class="input-group" style="flex: 1;">
                    <input type="text" id="cardExpiry" class="auth-input" placeholder="MM/YY">
                  </div>
                  <div class="input-group" style="flex: 1;">
                    <input type="text" id="cardCvv" class="auth-input" placeholder="CVV">
                  </div>
                </div>
              </div>

              <div id="form-banco" class="tab-content" style="display: none;">
                <div class="input-group">
                  <select id="bankName" class="auth-input">
                    <option value="">Selecciona el Banco...</option>
                    <option value="Bancolombia">Bancolombia</option>
                    <option value="Davivienda">Davivienda</option>
                    <option value="Banco de Bogotá">Banco de Bogotá</option>
                    <option value="BBVA">BBVA</option>
                  </select>
                </div>
                <div class="input-group">
                  <select id="bankAccType" class="auth-input">
                    <option value="">Tipo de Cuenta...</option>
                    <option value="Ahorros">Ahorros</option>
                    <option value="Corriente">Corriente</option>
                  </select>
                </div>
                <div class="input-group">
                  <input type="text" id="bankAccNumber" class="auth-input" placeholder="Número de Cuenta">
                </div>
              </div>

              <button type="submit" class="auth-btn" style="margin-top: 15px;">Guardar Método de Pago</button>
            </form>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
    attachEvents();
  };

  const attachEvents = () => {
    const btnOpen = document.getElementById('btnOpenModal');
    const btnOpenEmpty = document.getElementById('btnOpenModalEmpty');
    const btnClose = document.getElementById('btnCloseModal');
    const overlay = document.getElementById('paymentModalOverlay');
    const modalContent = document.getElementById('paymentModalContent');
    const tabs = document.querySelectorAll('.pill-tab');
    const form = document.getElementById('paymentForm');

    const openModal = () => {
      overlay.style.display = 'flex';
      // Reset form
      form.reset();
      modalActiveTab = 'billetera';
      switchTab('billetera');
    };

    const closeModal = () => {
      overlay.style.display = 'none';
    };

    if (btnOpen) btnOpen.addEventListener('click', openModal);
    if (btnOpenEmpty) btnOpenEmpty.addEventListener('click', openModal);
    if (btnClose) btnClose.addEventListener('click', closeModal);

    // Close on click outside
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal();
      }
    });

    // Close on ESC key
    const handleEsc = (e) => {
      if (e.key === 'Escape' && overlay.style.display === 'flex') {
        closeModal();
      }
    };
    document.addEventListener('keydown', handleEsc);
    
    // Clean up listener when re-rendering to avoid memory leaks
    container.addEventListener('DOMNodeRemoved', (e) => {
      if (e.target === container) {
        document.removeEventListener('keydown', handleEsc);
      }
    });

    // Tab switching logic
    const switchTab = (tabId) => {
      tabs.forEach(t => t.classList.remove('active'));
      const activeTab = Array.from(tabs).find(t => t.dataset.tab === tabId);
      if (activeTab) activeTab.classList.add('active');

      document.querySelectorAll('.tab-content').forEach(tc => {
        tc.style.display = 'none';
        tc.classList.remove('active');
      });
      const activeContent = document.getElementById('form-' + tabId);
      if (activeContent) {
        activeContent.style.display = 'block';
        activeContent.classList.add('active');
      }
      modalActiveTab = tabId;
    };

    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        switchTab(e.target.dataset.tab);
      });
    });

    // Form Submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let newMethod = { type: modalActiveTab };

      if (modalActiveTab === 'billetera') {
        const platform = document.getElementById('billPlatform').value;
        const id = document.getElementById('billId').value.trim();
        if (!platform || !id) {
          return showNotification('Por favor completa la plataforma y el identificador.', 'error');
        }
        newMethod.platform = platform;
        newMethod.identifier = id;
      } else if (modalActiveTab === 'tarjeta') {
        const num = document.getElementById('cardNumber').value.trim();
        const holder = document.getElementById('cardHolder').value.trim();
        const exp = document.getElementById('cardExpiry').value.trim();
        const cvv = document.getElementById('cardCvv').value.trim();
        if (!num || !holder || !exp || !cvv) {
          return showNotification('Por favor completa todos los datos de la tarjeta.', 'error');
        }
        newMethod.number = num;
        newMethod.holder = holder;
        newMethod.expiry = exp;
      } else if (modalActiveTab === 'banco') {
        const bank = document.getElementById('bankName').value;
        const accType = document.getElementById('bankAccType').value;
        const accNum = document.getElementById('bankAccNumber').value.trim();
        if (!bank || !accType || !accNum) {
          return showNotification('Por favor selecciona el banco y detalla la cuenta.', 'error');
        }
        newMethod.bank = bank;
        newMethod.accountType = accType;
        newMethod.accountNumber = accNum;
      }

      appStore.addPaymentMethod(newMethod);
      showNotification('Método de pago vinculado exitosamente', 'success');
      closeModal();
    });
  };

  // Re-render when payment methods change
  const handlePaymentChange = () => {
    renderContent();
  };

  appStore.addEventListener('payment_methods_changed', handlePaymentChange);
  
  // Cleanup listener when navigating away (though container innerHTML will destroy the view)
  const observer = new MutationObserver(() => {
    if (!document.contains(container)) {
      appStore.removeEventListener('payment_methods_changed', handlePaymentChange);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  renderContent();
};

