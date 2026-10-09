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
              <h4 class="footer-heading" style="display:flex;align-items:center;gap:6px;">
                <img src="src/assets/images/ICONO 1.png" alt="Músicos" class="ms-icon ms-icon-xs" />
                <span>Para Músicos</span>
              </h4>
              <ul class="footer-links">
                <li><a href="#/">Crear Perfil</a></li>
                <li><a href="#/contrataciones">Explorar Contrataciones</a></li>
                <li><a href="#/eventos">Eventos</a></li>
                <li><a href="#/creatividad">Cursos y Tiendas</a></li>
              </ul>
            </div>

            <!-- Columna Para Contratistas -->
            <div class="footer-col">
              <h4 class="footer-heading" style="display:flex;align-items:center;gap:6px;">
                <img src="src/assets/images/ICONO 5.png" alt="Contratistas" class="ms-icon ms-icon-xs" />
                <span>Para Contratistas</span>
              </h4>
              <ul class="footer-links">
                <li><a href="#/contrataciones">Publicar Trabajo</a></li>
                <li><a href="#/feed">Buscar Músicos</a></li>
                <li><a href="#/contrataciones">Intermediación y Garantía</a></li>
                <li><a href="#/">Casos de Éxito</a></li>
              </ul>
            </div>

            <!-- Columna Soporte y Legal -->
            <div class="footer-col">
              <h4 class="footer-heading" style="display:flex;align-items:center;gap:6px;">
                <img src="src/assets/images/ICONO 9.png" alt="Soporte" class="ms-icon ms-icon-xs" />
                <span>Soporte y Legal</span>
              </h4>
              <ul class="footer-links">
                <li><a href="#/">Centro de Ayuda</a></li>
                <li><a href="#/">Normativa de Intermediación</a></li>
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
