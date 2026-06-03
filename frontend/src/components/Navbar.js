import { Router } from '../core/router.js';
import { authService } from '../services/authService.js';
import { appStore } from '../store/appStore.js';
import './Navbar.css';

export const Navbar = {
  render: () => {
    const container = document.getElementById('navbar-root');
    const token = localStorage.getItem('jwtToken');
    const btnText = token ? 'Ingresar al Dashboard' : 'Iniciar Sesión';
    const targetRoute = token ? '/dashboard' : '/login';
    const currentPath = window.location.pathname;

    const linksHtml = (currentPath === '/' || currentPath === '') ? `
      <a href="#caracteristicas">Características</a>
      <a href="#flujo">Motor Reactivo</a>
    ` : '';

    const balanceHtml = token ? `<span id="navBalanceDisplay" class="navbar-balance"></span>` : '';
    const authBtnHtml = currentPath.startsWith('/dashboard') ? '' : `<button id="btnGlobalAuth" class="navbar-btn">${btnText}</button>`;
    
    // Theme Toggle Button
    const themeIcon = appStore.state.theme === 'dark' ? 'ri-sun-line' : 'ri-moon-line';
    const themeToggleHtml = `<button id="theme-toggle-btn" class="theme-toggle-btn" aria-label="Cambiar Tema"><i class="${themeIcon}"></i></button>`;

    const logoutHtml = token ? `<button id="btnGlobalLogout" class="navbar-btn-logout">Cerrar Sesión</button>` : '';

    container.innerHTML = `
      <nav class="global-navbar">
        <div class="${currentPath.startsWith('/dashboard') ? 'nav-content-fluid' : 'nav-content'}">
          <div class="navbar-logo" id="navLogo">
            SyncFinanzas ⚡
          </div>
          <div class="navbar-links">
            ${linksHtml}
            ${balanceHtml}
            ${authBtnHtml}
            ${themeToggleHtml}
            ${logoutHtml}
          </div>
        </div>
      </nav>
    `;

    document.getElementById('navLogo').addEventListener('click', () => {
      Router.navigate('/');
    });

    const btnAuth = document.getElementById('btnGlobalAuth');
    if (btnAuth) {
      btnAuth.addEventListener('click', () => {
        Router.navigate(targetRoute);
      });
    }

    if (token) {
      document.getElementById('btnGlobalLogout').addEventListener('click', () => {
        authService.logout();
      });

      // Theme toggle logic
      const themeBtn = document.getElementById('theme-toggle-btn');
      if (themeBtn) {
        themeBtn.addEventListener('click', () => {
          appStore.toggleTheme();
        });

        const updateThemeIcon = (e) => {
          const newTheme = e.detail;
          const icon = themeBtn.querySelector('i');
          if (icon) {
            icon.className = newTheme === 'dark' ? 'ri-sun-line' : 'ri-moon-line';
          }
        };

        appStore.addEventListener('theme_changed', updateThemeIcon);
      }

      // Update Nav balance reacting to appStore
      const navBalanceDisplay = document.getElementById('navBalanceDisplay');
      
      const updateNavBalance = (e) => {
        if (!navBalanceDisplay) return;
        const bal = e.detail.currentBalance;
        navBalanceDisplay.innerText = `Balance: $${bal.toFixed(2)}`;
        navBalanceDisplay.style.color = bal < 0 ? '#f72585' : '#7b2cbf';
        navBalanceDisplay.style.fontWeight = 'bold';
        navBalanceDisplay.style.marginRight = '15px';
      };

      appStore.addEventListener('balance_changed', updateNavBalance);
      
      // Init state
      const currentBalance = appStore.getBalance();
      if (currentBalance) {
        updateNavBalance({ detail: currentBalance });
      }
    }
  }
};
