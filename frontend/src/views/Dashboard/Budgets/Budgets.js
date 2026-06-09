import { SocketClient } from '../../../core/socket.js';
import { appStore } from '../../../store/appStore.js';
import { formatCurrency } from '../../../utils/formatters.js';
import './Budgets.css';

export const renderBudgets = (container) => {
  const socket = SocketClient.getSocket();
  if (!socket) return;

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
      <h2 style="margin: 0; color: var(--text-primary);">Presupuestos y Metas</h2>
    </div>
    
    <div class="budgets-grid">
      <!-- Columna Izquierda: Presupuestos -->
      <div class="card" style="display: flex; flex-direction: column;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid rgba(123, 44, 191, 0.2); padding-bottom: 10px; margin-bottom: 15px;">
          <h3 style="margin: 0; color: var(--text-primary);">Tus Presupuestos Activos</h3>
          <button id="btnNewBudget" class="primary-btn" style="width: auto; padding: 6px 12px; font-size: 0.85rem; margin: 0;">+ Crear Presupuesto</button>
        </div>
        <div id="budgetsListContainer" style="display:flex; flex-direction: column; gap: 15px;"></div>
      </div>
      
      <!-- Columna Derecha: Metas -->
      <div class="card" style="display: flex; flex-direction: column; height: fit-content;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid rgba(123, 44, 191, 0.2); padding-bottom: 10px; margin-bottom: 15px;">
          <h3 style="margin: 0; color: var(--text-primary);">Metas de Ahorro</h3>
          <button id="btnNewGoal" class="primary-btn" style="width: auto; padding: 6px 12px; font-size: 0.85rem; margin: 0;">+ Nueva Meta</button>
        </div>
        <div id="goalsListContainer" style="display:flex; flex-direction: column; gap: 15px;"></div>
      </div>
    </div>
    
    <!-- Modal Nuevo Presupuesto -->
    <div id="budgetModal" class="modal-overlay">
      <div class="modal-content card" style="max-width: 450px; width: 100%;">
        <h3 id="budgetModalTitle" style="margin-top: 0; border-bottom: 2px solid rgba(123, 44, 191, 0.2); padding-bottom: 10px; color: var(--text-primary);">Crear Presupuesto</h3>
        <form id="budgetForm" style="display: flex; flex-direction: column; gap: 15px; margin-top: 15px;">
          <input type="hidden" id="budgetId" value="">
          <div class="form-group">
            <label style="color: var(--text-secondary); font-size: 0.9rem;">Categoría</label>
            <input type="text" id="budgetCategoria" required placeholder="Ej. Comida" class="form-input">
          </div>
          <div class="form-group">
            <label style="color: var(--text-secondary); font-size: 0.9rem;">Monto Límite</label>
            <input type="text" id="budgetLimit" required placeholder="Ej. 500.000" class="form-input">
          </div>
          <div style="display: flex; gap: 10px;">
            <div class="form-group" style="flex: 1;">
              <label style="color: var(--text-secondary); font-size: 0.9rem;">Fecha Inicio</label>
              <input type="date" id="budgetStart" required class="form-input">
            </div>
            <div class="form-group" style="flex: 1;">
              <label style="color: var(--text-secondary); font-size: 0.9rem;">Fecha Fin</label>
              <input type="date" id="budgetEnd" required class="form-input">
            </div>
          </div>
          <div class="form-group">
            <label style="color: var(--text-secondary); font-size: 0.9rem;">Ciclo de Repetición</label>
            <select id="budgetRecurrence" class="form-input">
              <option value="none">Ninguno (Solo esta vez)</option>
              <option value="weekly">Semanal</option>
              <option value="biweekly">Quincenal</option>
              <option value="monthly">Mensual</option>
              <option value="yearly">Anual</option>
            </select>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
            <button type="button" id="btnCancelBudget" class="secondary-btn" style="padding: 10px 20px; border-radius: 8px; background: transparent; border: 1px solid rgba(255,255,255,0.2); color: var(--text-primary); cursor: pointer;">Cancelar</button>
            <button type="submit" class="primary-btn" style="padding: 10px 20px; border-radius: 8px; background: var(--primary-purple); color: white; border: none; cursor: pointer;">Guardar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Nueva Meta -->
    <div id="goalModal" class="modal-overlay">
      <div class="modal-content card" style="max-width: 450px; width: 100%;">
        <h3 style="margin-top: 0; border-bottom: 2px solid rgba(123, 44, 191, 0.2); padding-bottom: 10px; color: var(--text-primary);">Crear Meta de Ahorro</h3>
        <form id="goalForm" style="display: flex; flex-direction: column; gap: 15px; margin-top: 15px;">
          <div class="form-group">
            <label style="color: var(--text-secondary); font-size: 0.9rem;">Nombre de la Meta</label>
            <input type="text" id="goalName" required placeholder="Ej. Fondo de Emergencia" class="form-input">
          </div>
          <div class="form-group">
            <label style="color: var(--text-secondary); font-size: 0.9rem;">Monto Objetivo</label>
            <input type="text" id="goalTarget" required placeholder="Ej. 5.000.000" class="form-input">
          </div>
          <div class="form-group">
            <label style="color: var(--text-secondary); font-size: 0.9rem;">Cuenta Vinculada (Recibe depósitos)</label>
            <select id="goalAccount" class="form-input">
              <option value="">Ninguna (Manual)</option>
            </select>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
            <button type="button" id="btnCancelGoal" class="secondary-btn" style="padding: 10px 20px; border-radius: 8px; background: transparent; border: 1px solid rgba(255,255,255,0.2); color: var(--text-primary); cursor: pointer;">Cancelar</button>
            <button type="submit" class="primary-btn" style="padding: 10px 20px; border-radius: 8px; background: var(--primary-purple); color: white; border: none; cursor: pointer;">Guardar Meta</button>
          </div>
        </form>
      </div>
    </div>
    <!-- Modal Confirmación Eliminar -->
    <div id="confirmModal" class="modal-overlay">
      <div class="modal-content card" style="max-width: 400px; width: 100%; text-align: center;">
        <div style="font-size: 3rem; color: var(--accent-pink); margin-bottom: 10px;"><i class="ri-error-warning-line"></i></div>
        <h3 style="margin-top: 0; color: var(--text-primary);">¿Eliminar Presupuesto?</h3>
        <p style="color: var(--text-secondary); margin-bottom: 25px; font-size: 0.95rem;">Esta acción no se puede deshacer. ¿Estás seguro de que deseas eliminar este presupuesto?</p>
        <div style="display: flex; justify-content: center; gap: 15px;">
          <button type="button" id="btnCancelConfirm" class="secondary-btn" style="padding: 10px 25px; border-radius: 8px; background: transparent; border: 1px solid rgba(255,255,255,0.2); color: var(--text-primary); cursor: pointer; width: auto;">Cancelar</button>
          <button type="button" id="btnAcceptConfirm" class="primary-btn" style="padding: 10px 25px; border-radius: 8px; background: var(--accent-pink); color: white; border: none; cursor: pointer; width: auto; box-shadow: 0 4px 15px rgba(247, 37, 133, 0.4);">Sí, eliminar</button>
        </div>
      </div>
    </div>
  `;

  const budgetsListContainer = document.getElementById('budgetsListContainer');
  const goalsListContainer = document.getElementById('goalsListContainer');
  const goalAccountSelect = document.getElementById('goalAccount');
  
  const renderBudgetsList = () => {
    const budgetsArray = Array.isArray(appStore.state.budgets) ? appStore.state.budgets : [];
    
    if (budgetsArray.length === 0) {
      budgetsListContainer.innerHTML = `<p style="color: var(--text-secondary); text-align: center; font-style: italic; margin-top: 20px;">No tienes presupuestos activos. ¡Crea el primero!</p>`;
      return;
    }

    let html = '';
    budgetsArray.forEach(b => {
      const cat = b.categoria;
      const limit = parseFloat(b.monto_limite) || 0;
      const spent = parseFloat(b.gastado) || 0;
      const progress = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
      const isExceeded = spent > limit && limit > 0;
      
      const inicioDate = new Date(b.fecha_inicio);
      const finDate = new Date(b.fecha_fin);
      // Ajustar huso horario si es necesario para evitar desfasaje de días
      const inicio = inicioDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
      const fin = finDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', timeZone: 'UTC' });
      
      const hoy = new Date();
      // Calcular diferencia en días (aproximación)
      const diffTime = finDate.getTime() + (finDate.getTimezoneOffset() * 60000) - hoy.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let vigenciaText = '';
      if (diffDays < 0) {
        vigenciaText = `Expirado: ${inicio} - ${fin}`;
      } else if (diffDays === 0) {
        vigenciaText = `Vence hoy: ${inicio} - ${fin}`;
      } else {
        vigenciaText = `Vence en ${diffDays} días: ${inicio} - ${fin}`;
      }
      
      let badgeHtml = '';
      let colorClass = 'bar-normal';
      if (progress > 85 && !isExceeded) colorClass = 'bar-warning';
      if (isExceeded) {
        colorClass = 'bar-danger';
        badgeHtml = '<span style="background: rgba(247, 37, 133, 0.15); color: #f72585; font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(247, 37, 133, 0.3); font-weight: bold; margin-left: 8px; animation: pulseRed 2s infinite;">¡LÍMITE SUPERADO!</span>';
      }
      
      let repeatIcon = '';
      if (b.recurrencia && b.recurrencia !== 'none') {
        const labels = { weekly: 'Semanal', biweekly: 'Quincenal', monthly: 'Mensual', yearly: 'Anual' };
        repeatIcon = `<span style="font-size: 0.75rem; color: #4cc9f0; border: 1px solid rgba(76, 201, 240, 0.3); padding: 2px 6px; border-radius: 12px; margin-left: 8px;">🔄 ${labels[b.recurrencia]}</span>`;
      }

      html += `
        <div class="budget-item" style="background: rgba(255,255,255,0.02); padding: 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5px; flex-wrap: wrap; gap: 10px;">
            <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 8px;">
              <span style="font-weight: 600; color: var(--text-primary); font-size: 1rem;">${cat}</span>
              ${repeatIcon}
              ${badgeHtml}
            </div>
            <div style="display: flex; align-items: center; gap: 5px; margin-left: auto;">
              <span style="font-size: 0.8rem; color: var(--text-secondary); white-space: nowrap; margin-right: 10px;">${vigenciaText}</span>
              <button data-id="${b.id}" class="icon-btn edit" title="Editar"><i class="ri-pencil-line"></i></button>
              <button data-id="${b.id}" class="icon-btn delete" title="Eliminar"><i class="ri-delete-bin-line"></i></button>
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 5px;">
            <span>Gastado: ${formatCurrency(spent, 'COP')}</span>
            <span>Límite: ${formatCurrency(limit, 'COP')}</span>
          </div>
          <div style="width: 100%; height: 10px; background: rgba(123, 44, 191, 0.08); border-radius: 999px; overflow: hidden; border: 1px solid rgba(123, 44, 191, 0.05);">
            <div style="width: ${progress}%; height: 100%; border-radius: 999px; transition: width 0.5s;" class="${colorClass}"></div>
          </div>
        </div>
      `;
    });
    
    budgetsListContainer.innerHTML = html;
  };

  const renderGoalsList = () => {
    const goals = appStore.state.savingsGoals || [];
    
    if (goals.length === 0) {
      goalsListContainer.innerHTML = `<p style="color: var(--text-secondary); text-align: center; font-style: italic; margin-top: 20px;">No tienes metas activas. ¡Crea tu primera meta!</p>`;
      return;
    }

    let html = '';
    goals.forEach(goal => {
      const target = parseFloat(goal.monto_objetivo);
      const current = parseFloat(goal.monto_actual);
      const percent = Math.min((current / target) * 100, 100);

      html += `
        <div style="background: rgba(255,255,255,0.02); padding: 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.2rem;">🎯</span>
              <span style="font-weight: 600; color: var(--text-primary); font-size: 0.95rem;">${goal.nombre}</span>
            </div>
            <span style="font-weight: 800; color: var(--primary-purple); font-size: 1rem;">${percent.toFixed(0)}%</span>
          </div>
          
          <div style="width: 100%; height: 10px; background: rgba(123, 44, 191, 0.08); border-radius: 999px; overflow: hidden; margin-bottom: 8px; border: 1px solid rgba(123, 44, 191, 0.05);">
            <div style="width: ${percent}%; height: 100%; background: linear-gradient(90deg, #4cc9f0, var(--primary-purple)); border-radius: 999px; transition: width 1s ease-out;"></div>
          </div>
          
          <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-secondary); font-weight: 600;">
            <span>${formatCurrency(current, 'COP')} ahorrado</span>
            <span>Meta: ${formatCurrency(target, 'COP')}</span>
          </div>
        </div>
      `;
    });
    goalsListContainer.innerHTML = html;
  };

  const populateAccounts = () => {
    const methods = appStore.state.paymentMethods || [];
    if (methods.length === 0) {
      goalAccountSelect.innerHTML = '<option value="" disabled selected>Primero debes registrar una cuenta</option>';
      return;
    }
    goalAccountSelect.innerHTML = '<option value="">Ninguna (Manual)</option>';
    methods.forEach(m => {
      const isCard = m.type === 'credit' || m.type === 'debit';
      const last4 = isCard && m.last_four ? ` - *${m.last_four}` : '';
      const name = m.platform || m.bank || 'Cuenta';
      goalAccountSelect.innerHTML += `<option value="${m.id}">${name}${last4}</option>`;
    });
  };

  // Event Listeners for Store
  const onBudgetsLoaded = () => renderBudgetsList();
  const onGoalsLoaded = () => renderGoalsList();
  const onTxsLoaded = () => {
    renderBudgetsList();
    renderGoalsList();
  };

  appStore.addEventListener('budgets_loaded', onBudgetsLoaded);
  appStore.addEventListener('goals_loaded', onGoalsLoaded);
  appStore.addEventListener('transaction_history_loaded', onTxsLoaded);
  appStore.addEventListener('transaction_added', onTxsLoaded);
  appStore.addEventListener('payment_methods_changed', populateAccounts);

  populateAccounts();

  // Modal interactions
  const bModal = document.getElementById('budgetModal');
  const bForm = document.getElementById('budgetForm');
  
  document.getElementById('btnNewBudget').addEventListener('click', () => {
    document.getElementById('budgetModalTitle').innerText = 'Crear Presupuesto';
    document.getElementById('budgetId').value = '';
    bForm.reset();
    bModal.classList.add('show');
  });
  document.getElementById('btnCancelBudget').addEventListener('click', () => {
    bModal.classList.remove('show');
  });

  const bLimitInput = document.getElementById('budgetLimit');
  bLimitInput.addEventListener('input', (e) => {
    let valStr = e.target.value.replace(/\D/g, '');
    if (valStr) {
      e.target.value = new Intl.NumberFormat('es-CO').format(parseInt(valStr, 10));
    } else {
      e.target.value = '';
    }
  });

  bForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('budgetId').value;
    const categoria = document.getElementById('budgetCategoria').value;
    const monto_limite = parseFloat(document.getElementById('budgetLimit').value.replace(/\D/g, ''));
    const fecha_inicio = document.getElementById('budgetStart').value;
    const fecha_fin = document.getElementById('budgetEnd').value;
    const recurrencia = document.getElementById('budgetRecurrence').value;
    
    if (id) {
      socket.emit('budget:edit', { id, categoria, monto_limite, fecha_inicio, fecha_fin, recurrencia });
    } else {
      socket.emit('budget:update', { categoria, monto_limite, fecha_inicio, fecha_fin, recurrencia });
    }
    bModal.classList.remove('show');
    bForm.reset();
  });

  let budgetIdToDelete = null;

  budgetsListContainer.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.icon-btn.edit');
    const deleteBtn = e.target.closest('.icon-btn.delete');

    if (editBtn) {
      const id = editBtn.dataset.id;
      const budget = appStore.state.budgets.find(b => b.id === id);
      if (!budget) return;
      
      document.getElementById('budgetModalTitle').innerText = 'Editar Presupuesto';
      document.getElementById('budgetId').value = budget.id;
      document.getElementById('budgetCategoria').value = budget.categoria;
      document.getElementById('budgetLimit').value = new Intl.NumberFormat('es-CO').format(parseFloat(budget.monto_limite));
      document.getElementById('budgetStart').value = new Date(budget.fecha_inicio).toISOString().split('T')[0];
      document.getElementById('budgetEnd').value = new Date(budget.fecha_fin).toISOString().split('T')[0];
      document.getElementById('budgetRecurrence').value = budget.recurrencia || 'none';
      document.getElementById('budgetModal').classList.add('show');
    }

    if (deleteBtn) {
      budgetIdToDelete = deleteBtn.dataset.id;
      document.getElementById('confirmModal').classList.add('show');
    }
  });

  document.getElementById('btnCancelConfirm').addEventListener('click', () => {
    budgetIdToDelete = null;
    document.getElementById('confirmModal').classList.remove('show');
  });

  document.getElementById('btnAcceptConfirm').addEventListener('click', () => {
    if (budgetIdToDelete) {
      socket.emit('budget:delete', { id: budgetIdToDelete });
      budgetIdToDelete = null;
      document.getElementById('confirmModal').classList.remove('show');
    }
  });

  // Handle server errors globally in this view if needed
  socket.on('error', (err) => {
    if(err.message === 'Ya tienes un presupuesto activo para esta categoría en ese rango de fechas' || err.message === 'Error al actualizar presupuesto') {
      alert(err.message);
    }
  });

  const modal = document.getElementById('goalModal');
  document.getElementById('btnNewGoal').addEventListener('click', () => {
    modal.classList.add('show');
  });
  document.getElementById('btnCancelGoal').addEventListener('click', () => {
    modal.classList.remove('show');
  });
  document.getElementById('goalForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const nombre = document.getElementById('goalName').value;
    const monto_objetivo = parseFloat(document.getElementById('goalTarget').value.replace(/\D/g, ''));
    const cuenta_id = document.getElementById('goalAccount').value || null;
    
    socket.emit('goal:create', { nombre, monto_objetivo, cuenta_id });
    
    modal.classList.remove('show');
    e.target.reset();
  });

  // Formateo de monto objetivo
  const goalTargetInput = document.getElementById('goalTarget');
  goalTargetInput.addEventListener('input', (e) => {
    let valStr = e.target.value.replace(/\D/g, '');
    if (valStr) {
      e.target.value = new Intl.NumberFormat('es-CO').format(parseInt(valStr, 10));
    } else {
      e.target.value = '';
    }
  });

  // Initial renders & fetch
  populateAccounts();
  renderBudgetsList();
  renderGoalsList();
  
  // Request fresh data from server
  socket.emit('budget:list');
  socket.emit('goal:list');
  socket.emit('account:list');

  // Handle cleanup
  const root = document.getElementById('budgetsListContainer');
  const observer = new MutationObserver(() => {
    if (!document.contains(root)) {
      appStore.removeEventListener('budgets_loaded', onBudgetsLoaded);
      appStore.removeEventListener('goals_loaded', onGoalsLoaded);
      appStore.removeEventListener('transaction_history_loaded', onTxsLoaded);
      appStore.removeEventListener('transaction_added', onTxsLoaded);
      appStore.removeEventListener('payment_methods_changed', populateAccounts);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
};
