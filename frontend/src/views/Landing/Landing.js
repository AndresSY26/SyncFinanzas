import { Router } from '../../core/router.js';

export const renderLanding = (container) => {
  const token = localStorage.getItem('jwtToken');
  const targetRoute = token ? '/dashboard' : '/login';

  container.innerHTML = `
    <!-- CONTENEDOR PRINCIPAL CON ANIMACIÓN FADE-UP -->
    <div class="landing-premium-wrapper fade-up-enter">
      
      <!-- HERO SECTION RENOVADO -->
      <section class="landing-hero-premium">
        <div class="hero-content">
          <h1 class="hero-title">Sincronización <span class="gradient-text">Reactiva Extrema</span></h1>
          <p class="hero-subtitle">Experimenta el futuro del control financiero. Registra ingresos y presupuestos y observa cómo se reflejan instantáneamente en todos tus dispositivos gracias a nuestros WebSockets bidireccionales en tiempo real.</p>
          <div class="hero-actions">
            <button id="btnHeroStart" class="liquid-btn pulse-btn">Comenzar Gratis Ahora</button>
          </div>
        </div>
        <!-- Decoración de fondo del hero -->
        <div class="hero-bg-glow"></div>
      </section>

      <!-- SECCIÓN ¿POR QUÉ SYNCFINANZAS? -->
      <section id="caracteristicas" class="landing-features-premium">
        <div class="section-header">
          <h2>¿Por qué SyncFinanzas?</h2>
          <p>Hemos construido una arquitectura que reacciona a tus finanzas más rápido de lo que puedes parpadear.</p>
        </div>
        
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">🚀</div>
            <h3>100% Tiempo Real</h3>
            <p>Se acabó el recargar páginas. Cada transacción empuja los datos a tu pantalla en milisegundos gracias a la conexión nativa bidireccional.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">💸</div>
            <h3>Presupuestos Inteligentes</h3>
            <p>Auditoría activa en el servidor. Registra un gasto e inmediatamente una notificación (Toast) aparecerá en tus pantallas si superas tu límite.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🛡️</div>
            <h3>Seguridad Asimétrica</h3>
            <p>No comprometemos tus datos. Toda conexión HTTP y WebSocket requiere validación de tokens JWT protegidos y cifrado bcrypt de alto nivel.</p>
          </div>
        </div>
      </section>

      <!-- SECCIÓN: FLUJO REACTIVO E IMPACTO -->
      <section id="flujo" class="landing-flow-section">
        <div class="section-header">
          <h2>Motor de 15 Milisegundos</h2>
          <p>Observa cómo tus transacciones fluyen de forma bidireccional y segura.</p>
        </div>
        
        <!-- Gráfica CSS de flujo de WebSockets -->
        <div class="flow-container">
          <div class="css-graph">
            <div class="node user-node">Dispositivo A</div>
            <div class="flow-line"><div class="flow-particle forward"></div></div>
            <div class="node server-node">Servidor WebSocket</div>
            <div class="flow-line"><div class="flow-particle backward"></div></div>
            <div class="node user-node">Dispositivo B</div>
          </div>
        </div>

        <!-- FAQ -->
        <div class="faq-container">
          <div class="faq-item">
            <h3>¿Cómo protegemos tus datos?</h3>
            <p>Utilizamos el algoritmo de hashing <strong>bcrypt</strong> (10 salt rounds) para proteger tus contraseñas en PostgreSQL. El flujo en tiempo real se asegura inyectando matemáticamente tu <strong>Token JWT firmado</strong> en el <em>handshake</em> del WebSocket, bloqueando intrusos a nivel de red.</p>
          </div>
          <div class="faq-item">
            <h3>¿Qué significa Sincronización Reactiva?</h3>
            <p>En las plataformas tradicionales debes recargar (F5) para ver tus nuevos balances. Con nuestra arquitectura orientada a eventos nativos, el servidor empuja (Push) la información. Tu Dashboard muta su DOM en tiempo real, sin pedir permiso.</p>
          </div>
        </div>
      </section>
    </div>
  `;

  document.getElementById('btnHeroStart').addEventListener('click', () => {
    Router.navigate(targetRoute);
  });
};
