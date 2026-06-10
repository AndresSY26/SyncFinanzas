import { Router } from '../../core/router.js';
import './Sidebar.css';

export const Sidebar = {
  render: (containerId, currentPath) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <aside class="sidebar-wrapper">
        <div class="sidebar-menu">
          <button class="sidebar-item ${currentPath === '/dashboard' ? 'active' : ''}" data-path="/dashboard">
            <i class="ri-dashboard-3-line icon"></i> Resumen
          </button>
          <button class="sidebar-item ${currentPath === '/dashboard/payments' ? 'active' : ''}" data-path="/dashboard/payments">
            <i class="ri-bank-card-line icon"></i> Mis Cuentas y Tarjetas
          </button>
          <button class="sidebar-item ${currentPath === '/dashboard/budgets' ? 'active' : ''}" data-path="/dashboard/budgets">
            <i class="ri-pie-chart-line icon"></i> Presupuestos y Metas
          </button>
          <button class="sidebar-item ${currentPath === '/dashboard/transfers' ? 'active' : ''}" data-path="/dashboard/transfers">
            <i class="ri-arrow-left-right-line icon"></i> Transferencias y Envíos
          </button>

          <button class="sidebar-item ${currentPath === '/dashboard/settings' ? 'active' : ''}" data-path="/dashboard/settings">
            <i class="ri-settings-3-line icon"></i> Configuración
          </button>
        </div>
      </aside>
    `;

    const items = container.querySelectorAll('.sidebar-item');
    items.forEach(item => {
      item.addEventListener('click', (e) => {
        const path = e.currentTarget.getAttribute('data-path');
        Router.navigate(path);
      });
    });
  }
};

