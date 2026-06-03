import './Footer.css';

export const Footer = {
  render: () => {
    const container = document.getElementById('footer-root');
    container.innerHTML = `
      <footer class="global-footer">
        <div class="footer-content">
          <div class="footer-brand">
            <span class="footer-logo">SyncFinanzas ⚡</span>
            <p class="footer-desc">Plataforma de finanzas reactivas diseñada para el profesional moderno.</p>
          </div>
          <div class="footer-links">
            <a href="#">Términos de Servicio</a>
            <a href="#">Política de Privacidad</a>
            <a href="#">Soporte Técnico</a>
          </div>
        </div>
        <div class="footer-bottom">
          &copy; ${new Date().getFullYear()} SyncFinanzas. Todos los derechos reservados.
        </div>
      </footer>
    `;
  }
};
