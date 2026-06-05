import './Payments.css';
import { appStore } from '../../store/appStore.js';
import { showNotification } from '../../components/common/Toast.js';
import { SocketClient } from '../../core/socket.js';

const initGlobalPaymentModal = () => {
  if (document.getElementById('paymentModalOverlay')) return;
  
  const modalHtml = `
    <div id="paymentModalOverlay" style="display: none; visibility: visible; opacity: 1; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(4px); z-index: 999999; align-items: center; justify-content: center;">
      <div class="modal-content fade-up-enter" id="paymentModalContent" style="background: var(--surface-card); width: 90%; max-width: 500px; border-radius: 20px; padding: 25px; box-shadow: 0 15px 35px rgba(0,0,0,0.2); border: 1px solid rgba(123,44,191,0.1);" onclick="event.stopPropagation()">
        <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h3 style="margin: 0; color: var(--text-primary);">Vincular Cuenta o Billetera</h3>
          <button class="close-modal-btn" onclick="window.closePaymentModal()">&times;</button>
        </div>
        
        <div class="modal-tabs segment-control" style="margin-bottom: 20px;">
          <button class="pill-tab segment-btn active" data-tab="billetera" onclick="window.switchPaymentTab('billetera')">Billetera Digital</button>
          <button class="pill-tab segment-btn" data-tab="tarjeta" onclick="window.switchPaymentTab('tarjeta')">Tarjeta</button>
          <button class="pill-tab segment-btn" data-tab="banco" onclick="window.switchPaymentTab('banco')">Banco</button>
        </div>

        <div class="modal-body">
          <form id="paymentForm" onsubmit="window.submitPaymentForm(event)" oninput="window.validatePaymentForm()" onchange="window.validatePaymentForm()">
            <div id="form-billetera" class="tab-content active" style="display: block;">
              <div class="input-group" style="margin-bottom: 15px;">
                <select id="billPlatform" class="auth-input">
                  <option value="" disabled selected>Selecciona la Plataforma...</option>
                  <option value="Nequi">Nequi</option>
                  <option value="Daviplata">Daviplata</option>
                  <option value="PayPal">PayPal</option>
                </select>
              </div>
              <div class="input-group" style="margin-bottom: 15px;">
                <input type="text" id="billId" class="auth-input" placeholder="Número de Celular o Email">
              </div>
            </div>

            <div id="form-tarjeta" class="tab-content" style="display: none;">
              <div class="input-group" style="margin-bottom: 15px;">
                <input type="text" id="cardNumber" oninput="window.handleCardNumberInput(event)" class="auth-input" placeholder="Número de Tarjeta (16 dígitos)">
              </div>
              <div class="input-group" style="margin-bottom: 15px;">
                <input type="text" id="cardHolder" class="auth-input" placeholder="Nombre del Titular">
              </div>
              <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                <div class="input-group" style="flex: 1;">
                  <input type="text" id="cardExpiry" oninput="window.handleExpiryInput(event)" class="auth-input" placeholder="MM/YY">
                </div>
                <div class="input-group" style="flex: 1;">
                  <input type="text" id="cardCvv" oninput="window.handleCvvInput(event)" class="auth-input" placeholder="CVV">
                </div>
              </div>
            </div>

            <div id="form-banco" class="tab-content" style="display: none;">
              <div class="input-group" style="margin-bottom: 15px;">
                <select id="bankName" class="auth-input">
                  <option value="" disabled selected>Selecciona el Banco...</option>
                  <option value="Bancolombia">Bancolombia</option>
                  <option value="Davivienda">Davivienda</option>
                  <option value="Banco de Bogotá">Banco de Bogotá</option>
                  <option value="BBVA">BBVA</option>
                </select>
              </div>
              <div class="input-group" style="margin-bottom: 15px;">
                <select id="bankAccType" class="auth-input">
                  <option value="" disabled selected>Tipo de Cuenta...</option>
                  <option value="Ahorros">Ahorros</option>
                  <option value="Corriente">Corriente</option>
                </select>
              </div>
              <div class="input-group" style="margin-bottom: 15px;">
                <input type="text" id="bankAccNumber" class="auth-input" placeholder="Número de Cuenta">
              </div>
            </div>

            <button type="submit" id="btnSubmitPayment" class="auth-btn" disabled style="width: 100%; padding: 14px; border-radius: 12px; background: linear-gradient(135deg, var(--accent-primary), var(--accent-pink)); color: var(--text-primary); border: none; font-weight: bold; cursor: not-allowed; margin-top: 15px; opacity: 0.5;">Guardar Cuenta o Billetera</button>
          </form>
        </div>
      </div>
    </div>
  `;
  const wrapper = document.createElement('div');
  wrapper.innerHTML = modalHtml;
  document.body.appendChild(wrapper.firstElementChild);

  const overlay = document.getElementById('paymentModalOverlay');
  overlay.addEventListener('click', () => window.closePaymentModal());

  // Cerrar con Escape globalmente
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.style.display === 'flex') {
      window.closePaymentModal();
    }
  });
};

// Global Handlers
window.cvvState = { realValue: '' };

window.handleCardNumberInput = (e) => {
  let v = e.target.value.replace(/\D/g, '');
  if (v.length > 16) v = v.slice(0, 16);
  e.target.value = v;
  window.validatePaymentForm();
};

window.handleExpiryInput = (e) => {
  if (e.inputType && e.inputType.startsWith('delete')) {
    window.validatePaymentForm();
    return;
  }
  
  let v = e.target.value.replace(/\D/g, '');
  if (v.length > 4) v = v.slice(0, 4);
  if (v.length >= 2) {
    v = v.slice(0, 2) + '/' + v.slice(2);
  }
  e.target.value = v;
  window.validatePaymentForm();
};

window.handleCvvInput = (e) => {
  const input = e.target;
  let currentDisplay = input.value;
  
  if (currentDisplay.length < window.cvvState.realValue.length) {
    window.cvvState.realValue = window.cvvState.realValue.substring(0, currentDisplay.length);
    window.validatePaymentForm();
    return;
  }
  
  const addedLen = currentDisplay.length - window.cvvState.realValue.length;
  if (addedLen > 0) {
    let newChars = currentDisplay.slice(-addedLen);
    newChars = newChars.replace(/\D/g, ''); // Solo números
    
    // Límite estricto de 3 caracteres
    if (window.cvvState.realValue.length + newChars.length > 3) {
      const allowed = 3 - window.cvvState.realValue.length;
      newChars = newChars.slice(0, Math.max(0, allowed));
    }
    
    // Reconstruir display limpiando lo inválido
    const prevDisplay = currentDisplay.slice(0, currentDisplay.length - addedLen);
    input.value = prevDisplay + newChars;
    
    if (newChars.length === 0) {
      window.validatePaymentForm();
      return;
    }
    
    const actualAddedLen = newChars.length;
    window.cvvState.realValue += newChars;
    
    const startIndex = window.cvvState.realValue.length - actualAddedLen;
    for (let i = 0; i < actualAddedLen; i++) {
      const maskIndex = startIndex + i;
      setTimeout(() => {
        if (input.value.length > maskIndex) {
          let chars = input.value.split('');
          if (chars[maskIndex] !== '•') {
            chars[maskIndex] = '•';
            input.value = chars.join('');
          }
        }
      }, 3000);
    }
  }
  window.validatePaymentForm();
};

window.validatePaymentForm = () => {
  const form = document.getElementById('paymentForm');
  const btn = document.getElementById('btnSubmitPayment');
  if (!form || !btn) return;
  
  const tab = window.modalActiveTab || 'billetera';
  let isValid = false;

  if (tab === 'billetera') {
    const platform = form.querySelector('#billPlatform').value;
    const id = form.querySelector('#billId').value.trim();
    if (platform && id) isValid = true;
  } else if (tab === 'tarjeta') {
    const num = form.querySelector('#cardNumber').value.trim();
    const holder = form.querySelector('#cardHolder').value.trim();
    const exp = form.querySelector('#cardExpiry').value.trim();
    const cvv = window.cvvState.realValue.trim();
    if (num && holder && exp && cvv) isValid = true;
  } else if (tab === 'banco') {
    const bank = form.querySelector('#bankName').value;
    const accType = form.querySelector('#bankAccType').value;
    const accNum = form.querySelector('#bankAccNumber').value.trim();
    if (bank && accType && accNum) isValid = true;
  }

  if (isValid) {
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
  } else {
    btn.disabled = true;
    btn.style.opacity = '0.5';
    btn.style.cursor = 'not-allowed';
  }
};

window.openPaymentModal = () => {
  const overlay = document.getElementById('paymentModalOverlay');
  const form = document.getElementById('paymentForm');
  if (overlay) overlay.style.display = 'flex';
  if (form) form.reset();
  window.cvvState.realValue = '';
  window.switchPaymentTab('billetera');
};

window.closePaymentModal = () => {
  const overlay = document.getElementById('paymentModalOverlay');
  if (overlay) overlay.style.display = 'none';
};

window.switchPaymentTab = (tabId) => {
  const overlay = document.getElementById('paymentModalOverlay');
  if (!overlay) return;
  const tabs = overlay.querySelectorAll('.pill-tab');
  tabs.forEach(t => {
    t.classList.remove('active');
  });
  const activeTab = Array.from(tabs).find(t => t.dataset.tab === tabId);
  if (activeTab) {
    activeTab.classList.add('active');
  }

  overlay.querySelectorAll('.tab-content').forEach(tc => {
    tc.style.display = 'none';
    tc.classList.remove('active');
  });
  const activeContent = overlay.querySelector('#form-' + tabId);
  if (activeContent) {
    activeContent.style.display = 'block';
    activeContent.classList.add('active');
  }
  window.modalActiveTab = tabId;
  window.validatePaymentForm();
};

window.submitPaymentForm = (e) => {
  e.preventDefault();
  const form = document.getElementById('paymentForm');
  if (!form) return;
  
  let newMethod = { type: window.modalActiveTab || 'billetera' };
  const tab = window.modalActiveTab || 'billetera';

  if (tab === 'billetera') {
    const platform = form.querySelector('#billPlatform').value;
    const id = form.querySelector('#billId').value.trim();
    if (!platform || !id) return showNotification('Por favor completa la plataforma y el identificador.', 'error');
    newMethod.platform = platform;
    newMethod.identifier = id;
  } else if (tab === 'tarjeta') {
    const num = form.querySelector('#cardNumber').value.trim();
    const holder = form.querySelector('#cardHolder').value.trim();
    const exp = form.querySelector('#cardExpiry').value.trim();
    const cvv = window.cvvState.realValue.trim();
    if (!num || !holder || !exp || !cvv) return showNotification('Por favor completa todos los datos de la tarjeta.', 'error');
    newMethod.number = num;
    newMethod.holder = holder;
    newMethod.expiry = exp;
  } else if (tab === 'banco') {
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
  
  window.closePaymentModal();
};

const initConfirmDeleteModal = () => {
  if (document.getElementById('confirmDeleteOverlay')) return;
  
  const modalHtml = `
    <div id="confirmDeleteOverlay" style="display: none; opacity: 0; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(8px); z-index: 9999999; align-items: center; justify-content: center; transition: opacity 0.3s ease;">
      <div class="modal-content fade-up-enter" style="background: var(--surface-card); width: 90%; max-width: 400px; border-radius: 24px; padding: 30px; box-shadow: 0 20px 40px rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.08); text-align: center;" onclick="event.stopPropagation()">
        <div style="background: rgba(255, 50, 50, 0.1); color: #ff4d4d; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; margin: 0 auto 20px;">
          <i class="ri-delete-bin-line"></i>
        </div>
        <h3 style="margin: 0 0 10px; color: var(--text-primary); font-size: 1.4rem;">¿Desvincular cuenta?</h3>
        <p style="color: var(--text-secondary); margin: 0 0 25px; line-height: 1.5; font-size: 0.95rem;">
          Esta acción eliminará la cuenta de tu billetera y no se puede deshacer. ¿Deseas continuar?
        </p>
        <div style="display: flex; gap: 12px; justify-content: center;">
          <button onclick="window.closeConfirmDelete()" style="flex: 1; padding: 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: var(--text-secondary); font-weight: 600; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='transparent'">Cancelar</button>
          <button id="btnConfirmDelete" style="flex: 1; padding: 12px; border-radius: 12px; border: none; background: #ff4d4d; color: white; font-weight: 600; cursor: pointer; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">Sí, Desvincular</button>
        </div>
      </div>
    </div>
  `;
  const wrapper = document.createElement('div');
  wrapper.innerHTML = modalHtml;
  document.body.appendChild(wrapper.firstElementChild);

  const overlay = document.getElementById('confirmDeleteOverlay');
  overlay.addEventListener('click', () => window.closeConfirmDelete());

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.style.display === 'flex') {
      window.closeConfirmDelete();
    }
  });
};

window.closeConfirmDelete = () => {
  const overlay = document.getElementById('confirmDeleteOverlay');
  if (overlay) {
    overlay.style.opacity = '0';
    setTimeout(() => { overlay.style.display = 'none'; }, 300);
  }
};

window.deleteAccount = (id) => {
  initConfirmDeleteModal();
  const overlay = document.getElementById('confirmDeleteOverlay');
  const btnConfirm = document.getElementById('btnConfirmDelete');
  
  btnConfirm.onclick = () => {
    const socket = SocketClient.getSocket();
    if (socket) {
      socket.emit('account:delete', id);
    }
    window.closeConfirmDelete();
  };

  overlay.style.display = 'flex';
  setTimeout(() => {
    overlay.style.opacity = '1';
  }, 10);
};

export const renderPayments = (container) => {
  window.modalActiveTab = 'billetera';
  initGlobalPaymentModal();

  let socket = SocketClient.getSocket();
  const token = localStorage.getItem('jwtToken');
  
  if (!socket && token) {
    SocketClient.connect(token);
    socket = SocketClient.getSocket();
  }

  if (socket) {
    socket.emit('account:list');
  }

  container.innerHTML = '<div id="payments-view-root"></div>';
  const root = container.querySelector('#payments-view-root');

  const renderContent = () => {
    const methods = appStore.state.paymentMethods || [];
    
    let html = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
        <h2 style="margin: 0; color: var(--text-primary);">Mis Cuentas y Tarjetas</h2>
        ${methods.length > 0 ? '<button class="navbar-btn" style="width: max-content; padding: 8px 16px; font-size: 0.95rem; border-radius: 50px;" onclick="window.openPaymentModal()">+ Vincular Cuenta</button>' : ''}
      </div>
    `;

    if (methods.length === 0) {
      html += `
        <div class="empty-payments-state">
          <div class="empty-icon">💳</div>
          <h3 style="color: var(--text-primary); margin-bottom: 10px;">No tienes cuentas ni billeteras vinculadas aún</h3>
          <p style="color: var(--text-secondary); margin-top: 0; margin-bottom: 25px;">Agrega tu primera tarjeta o billetera virtual para gestionar tus finanzas de forma integral.</p>
          <button class="add-payment-btn empty-btn" onclick="window.openPaymentModal()">+ Vincular Cuenta o Billetera</button>
        </div>
      `;
    } else {
      html += `<div class="payments-grid">`;
      methods.forEach(method => {
        if (method.type === 'billetera') {
          const isNequi = method.platform === 'Nequi';
          const isDavi = method.platform === 'Daviplata';
          const bgClass = isNequi ? 'bg-nequi' : isDavi ? 'bg-davi' : 'bg-paypal';
          
          let maskedId = method.identifier;
          if (maskedId.includes('@')) {
            const [local, domain] = maskedId.split('@');
            if (local.length > 4) {
              maskedId = `${local[0]}*******${local.slice(-3)}@${domain}`;
            } else {
              maskedId = `***@${domain}`;
            }
          } else {
            maskedId = `*******${maskedId.slice(-3)}`;
          }

          html += `
            <div class="payment-card ${bgClass}">
              <button class="delete-account-btn" onclick="window.deleteAccount('${method.id}')" title="Desvincular cuenta"><i class="ri-delete-bin-line"></i></button>
              <div class="card-header">
                <span class="card-type">Billetera Digital</span>
                <span class="card-logo">${method.platform}</span>
              </div>
              <div class="card-body">
                <h3>${maskedId}</h3>
                <p>Conectado y listo para pagos</p>
              </div>
            </div>
          `;
        } else if (method.type === 'tarjeta') {
          html += `
            <div class="payment-card credit-card">
              <button class="delete-account-btn" onclick="window.deleteAccount('${method.id}')" title="Desvincular cuenta"><i class="ri-delete-bin-line"></i></button>
              <div class="card-header">
                <span class="card-type">Tarjeta de Crédito/Débito</span>
                <span class="card-logo">💳</span>
              </div>
              <div class="card-body">
                <div class="card-chip"></div>
                <p class="card-number">*********${method.number.slice(-3)}</p>
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
              <button class="delete-account-btn" onclick="window.deleteAccount('${method.id}')" title="Desvincular cuenta" style="color: #666; background: rgba(0,0,0,0.1);"><i class="ri-delete-bin-line"></i></button>
              <div class="card-header">
                <span class="card-type">Cuenta Bancaria</span>
                <span class="card-logo">🏦 ${method.bank}</span>
              </div>
              <div class="card-body">
                <h3>Cuenta de ${method.accountType}</h3>
                <p class="card-number">*********${method.accountNumber.slice(-3)}</p>
                <p>Vinculada con éxito</p>
              </div>
            </div>
          `;
        }
      });
      html += `</div>`;
    }

    root.innerHTML = html;
  };

  const handlePaymentChange = () => {
    renderContent();
  };

  appStore.addEventListener('payment_methods_changed', handlePaymentChange);
  
  const observer = new MutationObserver(() => {
    if (!document.contains(root)) {
      appStore.removeEventListener('payment_methods_changed', handlePaymentChange);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  renderContent();
};

