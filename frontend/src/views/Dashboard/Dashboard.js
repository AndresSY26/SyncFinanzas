import { Router } from '../../core/router.js';
import { SocketClient } from '../../core/socket.js';
import { Sidebar } from '../../components/layout/Sidebar.js';
import { renderOverview } from './Overview.js';
import { renderPayments } from '../Payments/Payments.js';
import { renderHistory } from '../History/History.js';
import { renderSettings } from '../Settings/Settings.js';
import { renderBudgets } from './Budgets/Budgets.js';

export const renderDashboard = (container, path) => {
  const token = localStorage.getItem('jwtToken');
  if (!token) {
    Router.navigate('/login');
    return;
  }

  if (!SocketClient.getSocket()) {
    SocketClient.connect(token);
  }

  // Si el contenedor no tiene el layout activo, se inyecta
  if (!document.getElementById('dashboard-layout')) {
    container.innerHTML = `
      <div id="dashboard-layout" style="display: grid; grid-template-columns: 250px 1fr; height: 100vh; padding-top: 70px; overflow: hidden; box-sizing: border-box;">
        <div id="sidebarRoot"></div>
        <div id="dashboard-content" style="padding: 30px; background: var(--background-global); overflow-y: auto; height: 100%; box-sizing: border-box;"></div>
      </div>
    `;
  }

  // Renderizar o actualizar Sidebar pasándole la ruta activa
  Sidebar.render('sidebarRoot', path);

  const contentDiv = document.getElementById('dashboard-content');
  if (!contentDiv) return;
  contentDiv.innerHTML = ''; // Limpiar el área dinámica

  // Sub-routing local
  if (path === '/dashboard') {
    renderOverview(contentDiv);
  } else if (path === '/dashboard/payments') {
    renderPayments(contentDiv);
  } else if (path === '/dashboard/transfers' || path === '/dashboard/history') {
    renderHistory(contentDiv);
  } else if (path === '/dashboard/settings') {
    renderSettings(contentDiv);
  } else if (path === '/dashboard/budgets') {
    renderBudgets(contentDiv);
  } else {
    // Fallback simple por si se accede a una ruta desconocida
    contentDiv.innerHTML = `
      <div class="empty-payments-state" style="max-width: 500px; margin: 40px auto; padding: 60px 30px;">
        <i class="ri-route-line" style="font-size: 4rem; color: #ccc; margin-bottom: 20px;"></i>
        <h2 style="color: var(--text-primary); margin-bottom: 15px;">Ruta no encontrada</h2>
        <p style="color: var(--text-secondary); font-size: 1.05rem;">La sección solicitada no existe o fue movida.</p>
      </div>
    `;
  }
};
