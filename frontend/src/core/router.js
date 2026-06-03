import { renderLogin } from '../views/Login/Login.js';
import { renderDashboard } from '../views/Dashboard/Dashboard.js';
import { renderLanding } from '../views/Landing/Landing.js';
import { Navbar } from '../components/Navbar.js';
import { Footer } from '../components/Footer.js';

export const Router = {
  navigate: (path) => {
    const appDiv = document.getElementById('app');
    
    // Auth Guard
    const token = localStorage.getItem('jwtToken');
    if (token && (path === '/' || path === '/login')) {
      path = '/dashboard';
    }

    const isCurrentlyDashboard = window.location.pathname.startsWith('/dashboard');
    const isGoingToDashboard = path.startsWith('/dashboard');

    if (!(isCurrentlyDashboard && isGoingToDashboard)) {
      appDiv.innerHTML = '';
    }

    if (path === '/login') {
      history.pushState(null, '', '/login');
      appDiv.classList.add('auth-layout');
      const navRoot = document.getElementById('navbar-root');
      const footRoot = document.getElementById('footer-root');
      if (navRoot) navRoot.innerHTML = '';
      if (footRoot) footRoot.innerHTML = '';
      renderLogin(appDiv);
    } else {
      appDiv.classList.remove('auth-layout');
      if (path.startsWith('/dashboard')) {
        appDiv.classList.add('dashboard-layout-container');
        history.pushState(null, '', path);
        renderDashboard(appDiv, path);
      } else {
        appDiv.classList.remove('dashboard-layout-container');
        history.pushState(null, '', '/');
        renderLanding(appDiv);
      }
      Navbar.render();
      
      const footRoot = document.getElementById('footer-root');
      if (path.startsWith('/dashboard')) {
        if (footRoot) footRoot.innerHTML = '';
      } else {
        Footer.render();
      }
    }
  },

  init: () => {
    window.addEventListener('popstate', () => {
      Router.navigate(window.location.pathname);
    });
    Router.navigate(window.location.pathname);
  }
};
