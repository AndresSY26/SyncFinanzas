import { Router } from '../core/router.js';
import { authService } from '../services/authService.js';
import { appStore } from '../store/appStore.js';
import { formatCurrency } from '../utils/formatters.js';
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
    }

    // Theme toggle logic (Funciona siempre, con o sin token)
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

    if (token) {
      // Update Nav balance reacting to appStore
      const navBalanceDisplay = document.getElementById('navBalanceDisplay');
      
      const updateNavBalance = (e) => {
        if (!navBalanceDisplay) return;
        const balances = e.detail;
        
        let displayHtml = '';
        if (Array.isArray(balances) && balances.length > 0) {
          const mainBal = balances[0];
          const otherBals = balances.slice(1);
          
          displayHtml = `<span class="rgb-text-balance" style="cursor: pointer; margin: 0;">Balance: ${formatCurrency(mainBal.currentBalance, mainBal.moneda)}</span>`;
          
          if (otherBals.length > 0) {
            displayHtml += `<div class="balance-popover">`;
            otherBals.forEach(b => {
              const valClass = b.currentBalance < 0 ? 'popover-negative' : 'popover-positive';
              displayHtml += `
                <div class="popover-item">
                  <div class="popover-badge">${b.moneda}</div>
                  <span class="popover-val ${valClass}">${formatCurrency(b.currentBalance, b.moneda)}</span>
                </div>`;
            });
            displayHtml += `</div>`;
          }
        } else if (balances && balances.currentBalance !== undefined) {
          displayHtml = `<span class="rgb-text-balance" style="margin: 0;">Balance: ${formatCurrency(balances.currentBalance, balances.moneda || 'COP')}</span>`;
        } else {
          displayHtml = `<span class="rgb-text-balance" style="margin: 0;">Balance: ${formatCurrency(0, 'COP')}</span>`;
        }
        
        navBalanceDisplay.innerHTML = displayHtml;
        navBalanceDisplay.className = 'navbar-balance-container';
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
