import './styles/variables.css';
import './styles/globals.css';
import './styles/animations.css';
import './views/Landing/Landing.css'; // Módulo de Landing

import { Router } from './core/router.js';

document.addEventListener('DOMContentLoaded', () => {
  Router.init();
});
