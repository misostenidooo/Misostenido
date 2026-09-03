/**
 * Navbar.js — Barra de navegación dinámica acorde al Figma
 */
import { store } from '../../store/store.js';
import { authService } from '../../services/authService.js';
import { AuthModal } from '../modal/AuthModal.js';
import { router } from '../../router/router.js';

export const Navbar = {
  render(selector) {
    const el = document.querySelector(selector);
    if (!el) return;

    const renderNavbarContent = (state) => {
      const isAuth = state.isAuthenticated;
      const user = state.user || {};
      const currentHash = window.location.hash || '#/';

      // Opciones del menú
      const navLinks = [
        { label: 'Inicio', path: '#/', protected: false },
        { label: 'Feed', path: '#/feed', protected: true },
        { label: 'Creatividad', path: '#/creatividad', protected: true },
        { label: 'Contrataciones', path: '#/contrataciones', protected: true },
        { label: 'Eventos', path: '#/eventos', protected: true },
      ];

      const navItemsHtml = navLinks.map(link => {
        const isActive = currentHash === link.path ? 'active' : '';
        return `
          <li>
            <a href="${link.path}" class="nav-item ${isActive}" data-protected="${link.protected}">
              ${link.label}
            </a>
          </li>
        `;
      }).join('');

      const avatarSrc = user.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'Usuario')}&background=0d6855&color=fff`;
      const userName = user.name || 'Usuario';
      const userEmail = user.email || '';

      el.innerHTML = `
        <header class="app-header">
          <div class="navbar-container">
            <!-- Logo Oficial -->
            <a href="#/" class="navbar-brand">
              <img src="src/assets/images/logo.png" alt="Misostenido" class="brand-logo-img" />
            </a>

            <!-- Barra de búsqueda global -->
            <div class="navbar-search-bar" id="navbar-search-bar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" id="navbar-search-input" placeholder="Busca artistas, eventos, canciones..." class="navbar-search-input" />
            </div>

            <!-- Menú central -->
            <nav class="navbar-nav">
              <ul class="nav-list">
                ${navItemsHtml}
              </ul>
            </nav>

            <!-- Acciones según estado de autenticación -->
            <div class="navbar-auth-actions">
              ${isAuth ? `
                <div class="user-auth-menu">
                  <button class="btn-notification-bell" aria-label="Notificaciones" id="btn-notifications">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                    <span class="bell-badge">1</span>
                  </button>

                  <div class="user-profile-badge" id="user-profile-trigger">
                    <img src="${avatarSrc}" alt="${userName}" class="user-avatar" />
                    <span class="user-name">${userName}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>

                    <!-- Menú desplegable usuario -->
                    <div class="user-dropdown-menu" id="user-dropdown">
                      <div class="dropdown-header">
                        <strong>${userName}</strong>
                        <small>${userEmail}</small>
                      </div>
                      <a href="#/" class="dropdown-item" id="btn-user-profile">Mi Perfil</a>
                      <button class="dropdown-item btn-logout" id="btn-nav-logout">Cerrar Sesión</button>
                    </div>
                  </div>
                </div>
              ` : `
                <div class="guest-auth-buttons">
                  <a href="#/login" class="btn-nav-login">Iniciar Sesión</a>
                  <a href="#/register" class="btn-nav-register">Registrarse</a>
                </div>
              `}
            </div>
          </div>
        </header>
      `;

      // Asignar listeners
      setTimeout(() => this.attachEvents(el), 0);
    };

    // Render inicial
    renderNavbarContent(store.getState());

    // Re-render al cambiar el estado o la ruta
    store.subscribe((state) => renderNavbarContent(state));
    window.addEventListener('hashchange', () => renderNavbarContent(store.getState()));
  },

  attachEvents(el) {
    const isAuth = authService.isAuthenticated();

    // Proteger links de navegación si no está autenticado
    const links = el.querySelectorAll('.nav-item[data-protected="true"]');
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        if (!isAuth) {
          e.preventDefault();
          const target = link.textContent.trim();
          AuthModal.show('Función Exclusiva', `Debes iniciar sesión para explorar la sección de "${target}".`);
        }
      });
    });

    // Dropdown de perfil
    const profileTrigger = el.querySelector('#user-profile-trigger');
    const dropdown = el.querySelector('#user-dropdown');
    profileTrigger?.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown?.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      dropdown?.classList.remove('show');
    });

    // Botón logout
    const logoutBtn = el.querySelector('#btn-nav-logout');
    logoutBtn?.addEventListener('click', () => {
      authService.logout();
    });

    // Campana notificaciones
    const bellBtn = el.querySelector('#btn-notifications');
    bellBtn?.addEventListener('click', () => {
      alert('Tienes 1 nueva solicitud de contratación pendiente.');
    });
  }
};
