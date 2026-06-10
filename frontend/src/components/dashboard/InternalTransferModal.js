import { SocketClient } from '../../core/socket.js';
import { Router } from '../../core/router.js';
import './TransactionModal.css'; // Reusing the same CSS

export const InternalTransferModal = {
  render: () => {
    let modalWrapper = document.getElementById('internal-transfer-modal-wrapper');
    if (!modalWrapper) {
      modalWrapper = document.createElement('div');
      modalWrapper.id = 'internal-transfer-modal-wrapper';
      modalWrapper.className = 'modal-overlay';
      document.body.appendChild(modalWrapper);
    }

    modalWrapper.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>⇄ Transferencia Interna</h3>
          <button id="transferModalCloseBtn" class="modal-close-btn"><i class="ri-close-line"></i></button>
        </div>
        <div id="transferModalBody">
          <div style="text-align: center; color: var(--text-secondary); padding: 20px;">
            <i class="ri-loader-4-line" style="font-size: 2rem; display: block; margin-bottom: 10px; animation: spin 1s linear infinite;"></i>
            Cargando cuentas...
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      modalWrapper.classList.add('show');
    }, 10);

    const closeModal = () => {
      modalWrapper.classList.remove('show');
      setTimeout(() => {
        modalWrapper.innerHTML = '';
      }, 300);
    };

    document.getElementById('transferModalCloseBtn').addEventListener('click', closeModal);
    modalWrapper.addEventListener('click', (e) => {
      if(e.target === modalWrapper) closeModal();
    });

    const socket = SocketClient.getSocket();
    if (!socket) {
      document.getElementById('transferModalBody').innerHTML = `<p style="color: var(--accent-pink);">Error de conexión con el servidor.</p>`;
      return;
    }

    const handleAccountList = (accounts) => {
      const modalBody = document.getElementById('transferModalBody');
      if (!modalBody) return;

      if (!accounts || accounts.length < 2) {
        modalBody.innerHTML = `
          <div class="empty-state-modal">
            <i class="ri-wallet-3-line"></i>
            <p>Necesitas al menos 2 cuentas financieras vinculadas para realizar una transferencia interna.</p>
            <button id="btnIrCuentasTransfer" class="btn-primary-modal">Ir a Cuentas</button>
          </div>
        `;
        document.getElementById('btnIrCuentasTransfer').addEventListener('click', () => {
          closeModal();
          Router.navigate('/dashboard/payments');
        });
        return;
      }

      const optionsHtml = accounts.map(acc => `<option value="${acc.id}">${acc.nombre} (${acc.tipo})</option>`).join('');

      modalBody.innerHTML = `
        <form id="modalTransferForm" style="display: flex; flex-direction: column; gap: 15px;">
          <select id="modalTransferOrigen" required class="custom-select">
            <option value="" disabled selected>Selecciona Cuenta de Origen...</option>
            ${optionsHtml}
          </select>
          
          <select id="modalTransferDestino" required class="custom-select">
            <option value="" disabled selected>Selecciona Cuenta de Destino...</option>
            ${optionsHtml}
          </select>
          
          <div style="display: flex; gap: 10px;">
            <select id="modalTransferMoneda" required class="custom-select" style="flex: 1;">
              <option value="COP" selected>COP</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="MXN">MXN</option>
            </select>
            <input type="date" id="modalTransferFecha" required class="custom-select" style="flex: 1;" title="Fecha de la transferencia">
            <input type="text" id="modalTransferMonto" placeholder="Monto (ej: 1.000,50)" required style="flex: 2;">
          </div>

          <input type="text" id="modalTransferDescripcion" placeholder="Descripción breve">
          
          <button type="submit" id="btnProcesarTransfer" class="btn-primary-modal" style="margin-top: 10px;" disabled>Cuentas origen y destino iguales</button>
        </form>
      `;

      const txMontoEl = document.getElementById('modalTransferMonto');
      txMontoEl.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (!value) {
          e.target.value = '';
          return;
        }
        const floatValue = parseFloat(value) / 100;
        e.target.value = new Intl.NumberFormat('es-CO', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(floatValue);
      });

      const originSelect = document.getElementById('modalTransferOrigen');
      const destSelect = document.getElementById('modalTransferDestino');
      const btnProcesar = document.getElementById('btnProcesarTransfer');

      const checkTransferValidation = () => {
        if (!originSelect.value || !destSelect.value) {
          btnProcesar.disabled = true;
          btnProcesar.style.opacity = '0.5';
          btnProcesar.textContent = 'Selecciona ambas cuentas';
        } else if (originSelect.value === destSelect.value) {
          btnProcesar.disabled = true;
          btnProcesar.style.opacity = '0.5';
          btnProcesar.textContent = 'Cuentas origen y destino iguales';
        } else {
          btnProcesar.disabled = false;
          btnProcesar.style.opacity = '1';
          btnProcesar.textContent = 'Procesar Transferencia';
        }
      };

      originSelect.addEventListener('change', checkTransferValidation);
      destSelect.addEventListener('change', checkTransferValidation);
      checkTransferValidation(); // init state

      // Set default date to today
      const today = new Date().toISOString().split('T')[0];
      const fechaEl = document.getElementById('modalTransferFecha');
      if (fechaEl) {
        fechaEl.value = today;
        fechaEl.max = today;
      }

      document.getElementById('modalTransferForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const inputMontoRaw = document.getElementById('modalTransferMonto').value.replace(/\D/g, '');
        const inputMonto = inputMontoRaw ? parseFloat(inputMontoRaw) / 100 : 0;
        
        const payload = {
          cuenta_id: document.getElementById('modalTransferOrigen').value,
          cuenta_destino_id: document.getElementById('modalTransferDestino').value,
          tipo: 'transfer',
          monto: inputMonto,
          moneda: document.getElementById('modalTransferMoneda').value,
          fecha: document.getElementById('modalTransferFecha') ? document.getElementById('modalTransferFecha').value : today,
          categoria: 'Transferencia',
          descripcion: document.getElementById('modalTransferDescripcion').value
        };

        socket.emit('transaction:create', payload);
        closeModal();
      });
    };

    socket.once('account:list_success', handleAccountList);
    socket.emit('account:list');
  }
};
