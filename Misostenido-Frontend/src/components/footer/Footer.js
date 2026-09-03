/**
 * Footer.js — Footer corporativo fiel al diseño de Figma
 */

export const Footer = {
  render(selector) {
    const el = document.querySelector(selector);
    if (!el) return;

    el.innerHTML = `
      <footer class="app-footer">
        <div class="footer-container">
          <div class="footer-grid">
            <!-- Columna Brand -->
            <div class="footer-col-brand">
              <div class="footer-brand">
                <img src="src/assets/images/logo.png" alt="Misostenido" class="footer-logo-img" />
              </div>
              <p class="footer-desc">
                La red social y plataforma de trabajo para el ecosistema musical latinoamericano. Encontrarse nunca fue tan profesional.
              </p>
              <div class="footer-social-icons">
                <a href="#/" aria-label="Spotify">🎵</a>
                <a href="#/" aria-label="YouTube">📺</a>
                <a href="#/" aria-label="Instagram">📸</a>
              </div>
            </div>

            <!-- Columna Para Músicos -->
            <div class="footer-col">
              <h4 class="footer-heading">Para Músicos</h4>
              <ul class="footer-links">
                <li><a href="#/">Crear Perfil</a></li>
                <li><a href="#/">Explorar Contrataciones</a></li>
                <li><a href="#/">Eventos</a></li>
                <li><a href="#/">Precios</a></li>
              </ul>
            </div>

            <!-- Columna Para Contratistas -->
            <div class="footer-col">
              <h4 class="footer-heading">Para Contratistas</h4>
              <ul class="footer-links">
                <li><a href="#/">Publicar Trabajo</a></li>
                <li><a href="#/">Buscar Músicos</a></li>
                <li><a href="#/">Garantía de Pago</a></li>
                <li><a href="#/">Casos de Éxito</a></li>
              </ul>
            </div>

            <!-- Columna Soporte y Legal -->
            <div class="footer-col">
              <h4 class="footer-heading">Soporte y Legal</h4>
              <ul class="footer-links">
                <li><a href="#/">Soporte</a></li>
                <li><a href="#/">Términos de Servicio</a></li>
                <li><a href="#/">Privacidad</a></li>
                <li><a href="#/">Contacto</a></li>
              </ul>
            </div>
          </div>

          <div class="footer-bottom">
            <p>© 2026 Misostenido Inc. Todos los derechos reservados. Hecho con amor por la música.</p>
          </div>
        </div>
      </footer>
    `;
  }
};
