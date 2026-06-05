import { SocketClient } from '../../core/socket.js';
import { Router } from '../../core/router.js';
import './TransactionModal.css';

export const TransactionModal = {
  render: () => {
    // Create modal wrapper if it doesn't exist
    let modalWrapper = document.getElementById('transaction-modal-wrapper');
    if (!modalWrapper) {
      modalWrapper = document.createElement('div');
      modalWrapper.id = 'transaction-modal-wrapper';
      modalWrapper.className = 'modal-overlay';
      document.body.appendChild(modalWrapper);
    }

    modalWrapper.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Registrar Movimiento</h3>
          <button id="modalCloseBtn" class="modal-close-btn"><i class="ri-close-line"></i></button>
        </div>
        <div id="modalBody">
          <div style="text-align: center; color: var(--text-secondary); padding: 20px;">
            <i class="ri-loader-4-line" style="font-size: 2rem; display: block; margin-bottom: 10px; animation: spin 1s linear infinite;"></i>
            Cargando cuentas...
          </div>
        </div>
      </div>
    `;

    // Show modal
    setTimeout(() => {
      modalWrapper.classList.add('show');
    }, 10);

    const closeModal = () => {
      modalWrapper.classList.remove('show');
      setTimeout(() => {
        modalWrapper.innerHTML = '';
      }, 300);
    };

    document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
    // Cierra modal al hacer clic afuera
    modalWrapper.addEventListener('click', (e) => {
      if(e.target === modalWrapper) closeModal();
    });

    const socket = SocketClient.getSocket();
    if (!socket) {
      document.getElementById('modalBody').innerHTML = `<p style="color: var(--accent-pink);">Error de conexión con el servidor.</p>`;
      return;
    }

    // Handle response once
    const handleAccountList = (accounts) => {
      const modalBody = document.getElementById('modalBody');
      if (!modalBody) return; // if closed before load

      if (!accounts || accounts.length === 0) {
        modalBody.innerHTML = `
          <div class="empty-state-modal">
            <i class="ri-wallet-3-line"></i>
            <p>No tienes cuentas financieras vinculadas aún. Agrega una cuenta para poder gestionar tus ingresos y gastos de forma integral.</p>
            <button id="btnIrCuentas" class="btn-primary-modal">Ir a Cuentas</button>
          </div>
        `;
        document.getElementById('btnIrCuentas').addEventListener('click', () => {
          closeModal();
          Router.navigate('/dashboard/payments');
        });
        return;
      }

      const optionsHtml = accounts.map(acc => `<option value="${acc.id}">${acc.nombre} (${acc.tipo})</option>`).join('');

      modalBody.innerHTML = `
        <form id="modalTransactionForm" style="display: flex; flex-direction: column; gap: 15px;">
          <select id="modalTxCuenta" required class="custom-select">
            <option value="" disabled selected>Selecciona Cuenta o Billetera...</option>
            ${optionsHtml}
          </select>
          
          <div id="transferDestContainer" style="display: none;">
            <select id="modalTxDestino" class="custom-select">
              <option value="" disabled selected>Selecciona Cuenta de Destino...</option>
              ${optionsHtml}
            </select>
          </div>
          
          <select id="modalTxTipo" required class="custom-select">
            <option value="income">Ingreso (+)</option>
            <option value="expense">Gasto (-)</option>
            <option value="transfer">Transferencia (⇄)</option>
          </select>
          
          <div style="display: flex; gap: 10px;">
            <select id="modalTxMoneda" required class="custom-select" style="flex: 1;">
              <option value="COP" selected>COP</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="MXN">MXN</option>
            </select>
            <input type="text" id="modalTxMonto" placeholder="Monto (ej: 1.000,50)" required style="flex: 2;">
          </div>
          
          <select id="modalTxCategoria" required class="custom-select">
            <option value="" disabled selected>Selecciona Categoría...</option>
            <option value="Salario">Salario</option>
            <option value="Ventas">Ventas</option>
            <option value="Comida">Comida</option>
            <option value="Transporte">Transporte</option>
            <option value="Servicios">Servicios Básicos</option>
            <option value="Entretenimiento">Entretenimiento</option>
            <option value="Otros">Otros</option>
          </select>

          <input type="text" id="modalTxDescripcion" placeholder="Descripción breve">
          
          <button type="submit" id="btnProcesarTx" class="btn-primary-modal" style="margin-top: 10px;">Procesar Transacción</button>
        </form>
      `;

      // Masking logic
      const txMontoEl = document.getElementById('modalTxMonto');
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

      // UI Reactivity for Transfers
      const txTipoEl = document.getElementById('modalTxTipo');
      const destContainer = document.getElementById('transferDestContainer');
      const destSelect = document.getElementById('modalTxDestino');
      const catSelect = document.getElementById('modalTxCategoria');
      const btnProcesar = document.getElementById('btnProcesarTx');
      const originSelect = document.getElementById('modalTxCuenta');

      const checkTransferValidation = () => {
        if (txTipoEl.value === 'transfer') {
          if (originSelect.value && destSelect.value && originSelect.value === destSelect.value) {
            btnProcesar.disabled = true;
            btnProcesar.style.opacity = '0.5';
            btnProcesar.textContent = 'Cuentas origen y destino iguales';
          } else {
            btnProcesar.disabled = false;
            btnProcesar.style.opacity = '1';
            btnProcesar.textContent = 'Procesar Transacción';
          }
        }
      };

      originSelect.addEventListener('change', checkTransferValidation);
      destSelect.addEventListener('change', checkTransferValidation);

      txTipoEl.addEventListener('change', (e) => {
        if (e.target.value === 'transfer') {
          destContainer.style.display = 'block';
          destSelect.required = true;
          catSelect.style.display = 'none';
          catSelect.required = false;
          originSelect.options[0].text = "Selecciona Cuenta de Origen...";
        } else {
          destContainer.style.display = 'none';
          destSelect.required = false;
          catSelect.style.display = 'block';
          catSelect.required = true;
          originSelect.options[0].text = "Selecciona Cuenta o Billetera...";
          btnProcesar.disabled = false;
          btnProcesar.style.opacity = '1';
          btnProcesar.textContent = 'Procesar Transacción';
        }
        checkTransferValidation();
      });

      // Submit logic
      document.getElementById('modalTransactionForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const inputMontoRaw = document.getElementById('modalTxMonto').value.replace(/\D/g, '');
        const inputMonto = inputMontoRaw ? parseFloat(inputMontoRaw) / 100 : 0;
        
        const tipo = document.getElementById('modalTxTipo').value;
        const payload = {
          cuenta_id: document.getElementById('modalTxCuenta').value,
          tipo: tipo,
          monto: inputMonto,
          moneda: document.getElementById('modalTxMoneda').value,
          categoria: tipo === 'transfer' ? 'Transferencia' : document.getElementById('modalTxCategoria').value,
          descripcion: document.getElementById('modalTxDescripcion').value
        };

        if (tipo === 'transfer') {
          payload.cuenta_destino_id = document.getElementById('modalTxDestino').value;
        }

        socket.emit('transaction:create', payload);
        closeModal();
      });
    };

    socket.once('account:list_success', handleAccountList);

    // Request accounts
    socket.emit('account:list');
  }
};
