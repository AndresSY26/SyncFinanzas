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
          <select id="modalTxCuenta" required class="custom-select" style="width: 100%; padding: 12px; border-radius: 10px; background: var(--background-global); color: var(--text-primary); border: 1px solid rgba(123, 44, 191, 0.3);">
            <option value="" disabled selected>Selecciona Cuenta o Billetera...</option>
            ${optionsHtml}
          </select>
          
          <select id="modalTxTipo" required class="custom-select" style="width: 100%; padding: 12px; border-radius: 10px; background: var(--background-global); color: var(--text-primary); border: 1px solid rgba(123, 44, 191, 0.3);">
            <option value="income">Ingreso (+)</option>
            <option value="expense">Gasto (-)</option>
          </select>
          
          <input type="text" id="modalTxMonto" placeholder="Monto (ej: 1.000,50)" required style="width: 100%; padding: 12px; border-radius: 10px; background: var(--background-global); color: var(--text-primary); border: 1px solid rgba(123, 44, 191, 0.3); box-sizing: border-box;">
          
          <select id="modalTxCategoria" required class="custom-select" style="width: 100%; padding: 12px; border-radius: 10px; background: var(--background-global); color: var(--text-primary); border: 1px solid rgba(123, 44, 191, 0.3);">
            <option value="" disabled selected>Selecciona Categoría...</option>
            <option value="Salario">Salario</option>
            <option value="Ventas">Ventas</option>
            <option value="Comida">Comida</option>
            <option value="Transporte">Transporte</option>
            <option value="Servicios">Servicios Básicos</option>
            <option value="Entretenimiento">Entretenimiento</option>
            <option value="Otros">Otros</option>
          </select>

          <input type="text" id="modalTxDescripcion" placeholder="Descripción breve" style="width: 100%; padding: 12px; border-radius: 10px; background: var(--background-global); color: var(--text-primary); border: 1px solid rgba(123, 44, 191, 0.3); box-sizing: border-box;">
          
          <button type="submit" class="btn-primary-modal" style="margin-top: 10px;">Procesar Transacción</button>
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

      // Submit logic
      document.getElementById('modalTransactionForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const inputMontoRaw = document.getElementById('modalTxMonto').value.replace(/\D/g, '');
        const inputMonto = inputMontoRaw ? parseFloat(inputMontoRaw) / 100 : 0;
        
        const payload = {
          cuenta_id: document.getElementById('modalTxCuenta').value,
          tipo: document.getElementById('modalTxTipo').value,
          monto: inputMonto,
          categoria: document.getElementById('modalTxCategoria').value,
          descripcion: document.getElementById('modalTxDescripcion').value
        };

        socket.emit('transaction:create', payload);
        closeModal();
      });
    };

    socket.once('account:list_success', handleAccountList);

    // Request accounts
    socket.emit('account:list');
  }
};
