/**
 * RegisterPage.js — Pantalla de Registro fiel al diseño de Figma
 */
import { authService } from '../../services/authService.js';
import { router } from '../../router/router.js';

export const RegisterPage = {
  render() {
    const container = document.createElement('div');
    container.className = 'auth-page-wrapper animate-fade';

    container.innerHTML = `
      <div class="auth-container">
        <!-- Lado Izquierdo (Visual / Promocional Registro) -->
        <div class="auth-hero-panel auth-hero-register">
          <div class="auth-hero-overlay"></div>
          <div class="auth-hero-content">

            <!-- Logo oficial arriba a la izquierda -->
            <div class="reg-hero-top-row">
              <div class="reg-brand-logo">
                <img src="src/assets/images/logo.png" alt="Misostenido" class="reg-logo-img" />
              </div>
              <!-- Thumbnail flotante arriba a la derecha: Trío de guitarristas -->
              <div class="reg-top-thumb">
                <img src="src/assets/images/reg_trio_guitars.png" alt="Trío de guitarristas en patio colonial" />
              </div>
            </div>

            <!-- Cuerpo central del hero -->
            <div class="auth-hero-body">
              <div class="reg-badge-row">
                <div class="reg-hero-badge-circle">
                  <img src="src/assets/images/reg_marimba_badge.png" alt="Marimba tradicional" class="img-circle-badge" />
                </div>
                <div class="auth-hero-badge-tag">REGISTRO DE ARTISTA</div>
              </div>

              <h1 class="reg-hero-title">
                Crea tu perfil musical
              </h1>

              <p class="auth-hero-description">
                Comparte tu talento, conecta con otros artistas y forma parte de la red musical más grande del país
              </p>

              <ul class="auth-feature-list">
                <li><span class="feature-icon">🎵</span> Publica tu música y eventos</li>
                <li><span class="feature-icon">🤝</span> Conecta con artistas y bandas</li>
                <li><span class="feature-icon">📈</span> Haz crecer tu audiencia</li>
              </ul>

              <div class="auth-hero-stats-row">
                <div class="hero-stat-pill">
                  <span>+2,000 artistas registrados</span>
                </div>
                <div class="hero-stat-pill">
                  <span>500+ eventos publicados</span>
                </div>
              </div>
            </div>

            <!-- Thumbnail flotante abajo a la derecha: Bailarinas Festival (160x120) -->
            <div class="reg-bottom-row">
              <div class="sound-wave-bars">
                <span></span><span></span><span></span><span></span><span></span><span></span><span></span>
              </div>
              <div class="reg-bottom-thumb">
                <img src="src/assets/images/reg_dancers_festival.png" alt="Festival Cultura Nicaragua" />
              </div>
            </div>

          </div>
        </div>

        <!-- Lado Derecho (Formulario de Registro) -->
        <div class="auth-form-panel">
          <div class="auth-card">
            <div class="auth-card-header">
              <div class="auth-brand-logo-wrap">
                <img src="src/assets/images/logo.png" alt="Misostenido" class="auth-logo-img" />
              </div>
              <h2 class="auth-card-title">Crear cuenta</h2>
              <p class="auth-card-subtitle">Únete a la plataforma musical nicaragüense</p>
            </div>

            <form id="register-form" class="auth-form">
              <div id="register-alert" class="auth-form-alert" style="display: none;"></div>

              <div class="form-group">
                <label for="reg-fullname" class="form-label">Nombre Completo</label>
                <div class="input-wrapper">
                  <span class="input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </span>
                  <input 
                    type="text" 
                    id="reg-fullname" 
                    class="form-control" 
                    placeholder="Nombre completo" 
                    autocomplete="off"
                    readonly
                    required 
                  />
                </div>
              </div>

              <div class="form-group">
                <label for="reg-email" class="form-label">Correo Electrónico</label>
                <div class="input-wrapper">
                  <span class="input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </span>
                  <input 
                    type="email" 
                    id="reg-email" 
                    class="form-control" 
                    placeholder="correo@gmail.com" 
                    autocomplete="off"
                    readonly
                    required 
                  />
                </div>
              </div>

              <div class="form-group">
                <label for="reg-password" class="form-label">Contraseña</label>
                <div class="input-wrapper">
                  <span class="input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </span>
                  <input 
                    type="password" 
                    id="reg-password" 
                    class="form-control" 
                    placeholder="Contraseña" 
                    autocomplete="new-password"
                    readonly
                    required 
                  />
                  <button type="button" class="btn-toggle-password" id="reg-toggle-pwd-btn" aria-label="Mostrar contraseña">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                </div>
              </div>

              <!-- Selector de Tipo de Perfil (Figma) -->
              <div class="form-group">
                <label class="form-label">Tipo de Perfil</label>
                <div class="profile-type-selector">
                  <button type="button" class="profile-type-btn active" data-type="Individual">Individual</button>
                  <button type="button" class="profile-type-btn" data-type="Grupo / Banda">Grupo / Banda</button>
                  <button type="button" class="profile-type-btn" data-type="Escuela / Academia">Escuela / Academia</button>
                </div>
              </div>

              <button type="submit" class="btn-auth-submit" id="btn-submit-register">
                <span>Crear cuenta</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>

              <div class="auth-divider">
                <span>O CONTINÚA CON</span>
              </div>

              <button type="button" class="btn-social-google" id="btn-google-register">
                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
                <span>Continuar con Google</span>
              </button>

              <div class="auth-footer-link">
                ¿Ya tienes una cuenta? <a href="#/login" class="link-highlight">Inicia sesión</a>
                <div class="auth-sub-link">Únete a la comunidad musical de Nicaragua</div>
              </div>
            </form>
          </div>

          <div class="auth-copyright">
            © 2024 Sostenido • Plataforma de música local nicaragüense
          </div>
        </div>
      </div>
    `;

    setTimeout(() => this.attachEvents(container), 0);

    return container;
  },

  attachEvents(container) {
    const form = container.querySelector('#register-form');
    const nameInput = container.querySelector('#reg-fullname');
    const emailInput = container.querySelector('#reg-email');
    const pwdInput = container.querySelector('#reg-password');
    const toggleBtn = container.querySelector('#reg-toggle-pwd-btn');
    const alertBox = container.querySelector('#register-alert');
    const submitBtn = container.querySelector('#btn-submit-register');
    const googleBtn = container.querySelector('#btn-google-register');
    const profileBtns = container.querySelectorAll('.profile-type-btn');

    // Quitar readonly al hacer clic — previene autofill del navegador
    [nameInput, emailInput, pwdInput].forEach(input => {
      input?.addEventListener('focus', () => input.removeAttribute('readonly'));
    });

    let selectedProfileType = 'Individual';

    // Selector de tipo de perfil
    profileBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        profileBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedProfileType = btn.getAttribute('data-type');
      });
    });

    // Toggle password
    toggleBtn?.addEventListener('click', () => {
      const isPwd = pwdInput.type === 'password';
      pwdInput.type = isPwd ? 'text' : 'password';
    });

    // Google Sign Up
    googleBtn?.addEventListener('click', async () => {
      submitBtn.disabled = true;
      try {
        await authService.register({
          fullName: 'Carlos M.',
          email: 'carlos.m@sostenido.ni',
          password: 'google-oauth',
          profileType: selectedProfileType,
        });
        router.navigate('#/');
      } finally {
        submitBtn.disabled = false;
      }
    });

    // Submit
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      alertBox.style.display = 'none';

      const fullName = nameInput.value.trim();
      const email = emailInput.value.trim();
      const password = pwdInput.value;

      if (!fullName || !email || !password) return;

      submitBtn.disabled = true;
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<span>Creando perfil...</span>';

      try {
        await authService.register({
          fullName,
          email,
          password,
          profileType: selectedProfileType
        });
        router.navigate('#/');
      } catch (err) {
        alertBox.textContent = err.message || 'Error al registrar la cuenta';
        alertBox.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }
};
