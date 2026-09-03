/**
 * LoginPage.js — Pantalla de Inicio de Sesión fiel al Figma
 * Conectada a POST /api/Auth/login de Misostenido.Api (.NET)
 */
import { authService } from '../../services/authService.js';
import { router } from '../../router/router.js';

export const LoginPage = {
  render() {
    const container = document.createElement('div');
    container.className = 'auth-page-wrapper';

    container.innerHTML = `
      <div class="auth-container">

        <!-- ====== PANEL IZQUIERDO ====== -->
        <div class="auth-hero-panel auth-hero-login">
          <div class="auth-hero-overlay"></div>
          <div class="auth-hero-content">

            <!-- Parte superior: bailarina Güegüense en badge circular (arriba izquierda) -->
            <div class="auth-hero-badge-circle">
              <img
                src="src/assets/images/hero_badge_dancer.png"
                alt="Bailarina folclórica de Nicaragua"
                class="img-circle-badge"
              />
            </div>

            <!-- Parte central: texto principal -->
            <div class="auth-hero-body">
              <h1 class="auth-hero-title">
                Conecta con artistas locales para tu próximo evento.
              </h1>

              <p class="auth-hero-description">
                Contratá músicos nicaragüenses para bodas, fiestas, serenatas y
                eventos íntimos. Experiencias únicas, arte local.
              </p>

              <p class="auth-hero-tags">
                CONCIERTOS • BODAS • FIESTAS • SERENATAS • EVENTOS CORPORATIVOS
              </p>

              <div class="auth-hero-stats-row">
                <div class="hero-stat-pill">
                  <span class="pill-dot">›</span>
                  <span>200+ Artistas Locales</span>
                </div>
                <div class="hero-stat-pill">
                  <span>1K+ Eventos Realizados</span>
                </div>
              </div>
            </div>

            <!-- Parte inferior: miniaturas -->
            <div class="auth-hero-bottom">
              <div class="auth-hero-thumbnails">
                <!-- Tocador de guitarra a la izquierda abajo -->
                <div class="thumb-card thumb-left">
                  <img
                    src="src/assets/images/hero_thumb_guitarist.png"
                    alt="Músico tocando guitarra frente a volcán"
                  />
                </div>
                <!-- Guitarra a la derecha abajo -->
                <div class="thumb-card thumb-right">
                  <img
                    src="src/assets/images/hero_thumb_guitar_hands.png"
                    alt="Manos tocando guitarra acústica"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- ====== PANEL DERECHO ====== -->
        <div class="auth-form-panel">

          <!-- Tarjeta flotante blanca -->
          <div class="auth-card">

            <div class="auth-card-header">
              <div class="auth-brand-logo-wrap">
                <img src="src/assets/images/logo.png" alt="Misostenido" class="auth-logo-img" />
              </div>
              <h2 class="auth-card-title">Bienvenido de vuelta</h2>
              <p class="auth-card-subtitle">Tu siguiente evento musical te espera</p>
            </div>

            <form id="login-form" class="auth-form" novalidate>

              <!-- Alerta de error -->
              <div id="login-alert" class="auth-form-alert" style="display:none;" role="alert"></div>

              <!-- Campo: Usuario o Gmail -->
              <div class="form-group">
                <label for="login-email" class="form-label">Usuario o Gmail</label>
                <div class="input-wrapper">
                  <span class="input-icon" aria-hidden="true">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </span>
                  <input
                    type="text"
                    id="login-email"
                    class="form-control"
                    placeholder="Usuario o Gmail"
                    autocomplete="off"
                    readonly
                    required
                  />
                </div>
              </div>

              <!-- Campo: Contraseña -->
              <div class="form-group">
                <label for="login-password" class="form-label">Contraseña</label>
                <div class="input-wrapper">
                  <span class="input-icon" aria-hidden="true">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  <input
                    type="password"
                    id="login-password"
                    class="form-control"
                    placeholder="Contraseña"
                    autocomplete="new-password"
                    readonly
                    required
                  />
                  <button
                    type="button"
                    class="btn-toggle-password"
                    id="toggle-pwd-btn"
                    aria-label="Mostrar u ocultar contraseña"
                  >
                    <!-- ícono ojo (abierto por defecto) -->
                    <svg id="eye-open" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    <!-- ícono ojo tachado (se muestra cuando pwd es visible) -->
                    <svg id="eye-closed" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Recordarme + Olvidaste contraseña -->
              <div class="form-options">
                <label class="checkbox-label" for="remember-me">
                  <input type="checkbox" id="remember-me" checked />
                  Recordarme
                </label>
                <a href="#/forgot" class="link-forgot">¿Olvidaste tu contraseña?</a>
              </div>

              <!-- Botón submit -->
              <button type="submit" class="btn-auth-submit" id="btn-submit-login">
                <span id="submit-label">Iniciar Sesión</span>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>

              <!-- Divisor -->
              <div class="auth-divider">
                <span>O CONTINÚA CON</span>
              </div>

              <!-- Google -->
              <button type="button" class="btn-social-google" id="btn-google-login">
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Continuar con Google</span>
              </button>

              <!-- ¿No tienes cuenta? -->
              <div class="auth-footer-link">
                ¿No tienes cuenta? <a href="#/register" class="link-highlight">Regístrate gratis</a>
                <div class="auth-sub-link">Únete a la comunidad musical de Nicaragua</div>
              </div>

            </form>
          </div><!-- /auth-card -->

          <p class="auth-copyright">
            © 2024 Sostenido · Plataforma de música local nicaragüense
          </p>

        </div><!-- /auth-form-panel -->
      </div><!-- /auth-container -->
    `;

    // Adjuntar eventos después de que el DOM esté listo
    setTimeout(() => this._attachEvents(container), 0);

    return container;
  },

  _attachEvents(container) {
    const form        = container.querySelector('#login-form');
    const emailInput  = container.querySelector('#login-email');
    const pwdInput    = container.querySelector('#login-password');
    const toggleBtn   = container.querySelector('#toggle-pwd-btn');
    const eyeOpen     = container.querySelector('#eye-open');
    const eyeClosed   = container.querySelector('#eye-closed');
    const alertBox    = container.querySelector('#login-alert');
    const submitBtn   = container.querySelector('#btn-submit-login');
    const submitLabel = container.querySelector('#submit-label');

    // Quitar readonly al hacer clic — evita autofill del navegador
    // y deja el campo limpio para que el usuario escriba
    emailInput?.addEventListener('focus', () => {
      emailInput.removeAttribute('readonly');
    });
    pwdInput?.addEventListener('focus', () => {
      pwdInput.removeAttribute('readonly');
    });

    // Toggle mostrar / ocultar contraseña
    toggleBtn?.addEventListener('click', () => {
      const isHidden = pwdInput.type === 'password';
      pwdInput.type = isHidden ? 'text' : 'password';
      eyeOpen.style.display  = isHidden ? 'none'  : '';
      eyeClosed.style.display = isHidden ? ''     : 'none';
    });

    // Google (placeholder — integrar OAuth cuando esté listo)
    container.querySelector('#btn-google-login')?.addEventListener('click', () => {
      this._showError(alertBox, 'La autenticación con Google estará disponible próximamente.');
    });

    // Submit del formulario → conecta con Misostenido.Api
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email    = emailInput.value.trim();
      const password = pwdInput.value;

      // Validación mínima en frontend
      if (!email || !password) {
        this._showError(alertBox, 'Por favor ingresa tu usuario/correo y contraseña.');
        return;
      }

      // Estado de carga
      this._setLoading(submitBtn, submitLabel, true);
      alertBox.style.display = 'none';

      try {
        // Petición real a POST /api/Auth/login → { Email, Contrasena }
        await authService.login({ email, password });
        // Redirigir al inicio/dashboard al autenticarse
        router.navigate('#/');
      } catch (err) {
        this._showError(
          alertBox,
          err.message || 'Credenciales incorrectas. Verifica tu usuario y contraseña.'
        );
        this._setLoading(submitBtn, submitLabel, false);
      }
    });
  },

  _showError(alertBox, message) {
    alertBox.textContent = message;
    alertBox.style.display = 'block';
  },

  _setLoading(btn, label, isLoading) {
    btn.disabled = isLoading;
    label.textContent = isLoading ? 'Verificando...' : 'Iniciar Sesión';
  }
};
