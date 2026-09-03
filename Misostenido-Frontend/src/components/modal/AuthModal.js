/**
 * AuthModal.js — Modal que notifica al usuario que debe iniciar sesión
 */

export const AuthModal = {
  containerId: 'auth-modal-root',

  init() {
    let modalRoot = document.getElementById(this.containerId);
    if (!modalRoot) {
      modalRoot = document.createElement('div');
      modalRoot.id = this.containerId;
      document.body.appendChild(modalRoot);
    }
  },

  /**
   * Muestra el modal de acceso restringido
   * @param {string} title Título opcional
   * @param {string} message Mensaje de aviso
   */
  show(title = 'Acceso Exclusivo', message = 'Debes iniciar sesión o registrarte para acceder a esta sección y disfrutar de todas las funciones de Misostenido.') {
    this.init();
    const modalRoot = document.getElementById(this.containerId);

    modalRoot.innerHTML = `
      <div class="auth-modal-overlay" id="auth-modal-backdrop">
        <div class="auth-modal-card animate-fade">
          <button class="auth-modal-close" id="btn-close-modal" aria-label="Cerrar">&times;</button>
          
          <div class="auth-modal-icon">
            <span>🔒</span>
          </div>

          <h3 class="auth-modal-title">${title}</h3>
          <p class="auth-modal-desc">${message}</p>

          <div class="auth-modal-actions">
            <a href="#/login" class="btn-modal-primary" id="modal-btn-login">
              Iniciar Sesión
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
            <a href="#/register" class="btn-modal-secondary" id="modal-btn-register">
              Registrarme gratis
            </a>
          </div>
        </div>
      </div>
    `;

    // Cerrar con backdrop o botón X
    const closeBtn = document.getElementById('btn-close-modal');
    const backdrop = document.getElementById('auth-modal-backdrop');
    const loginBtn = document.getElementById('modal-btn-login');
    const regBtn = document.getElementById('modal-btn-register');

    const closeHandler = (e) => {
      if (e.target === backdrop || e.target === closeBtn || e.target === loginBtn || e.target === regBtn) {
        modalRoot.innerHTML = '';
      }
    };

    backdrop.addEventListener('click', closeHandler);
  },

  close() {
    const modalRoot = document.getElementById(this.containerId);
    if (modalRoot) modalRoot.innerHTML = '';
  }
};
