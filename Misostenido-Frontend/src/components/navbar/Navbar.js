/**
 * Navbar.js — Barra de navegación dinámica con búsqueda global funcional
 */
import { store } from '../../store/store.js';
import { authService } from '../../services/authService.js';
import { AuthModal } from '../modal/AuthModal.js';
import { router } from '../../router/router.js';
import { api } from '../../services/api.js';

export const Navbar = {
  _searchTimeout: null,

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
            <div class="navbar-search-wrapper" id="navbar-search-wrapper">
              <div class="navbar-search-bar" id="navbar-search-bar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" id="navbar-search-input" placeholder="Busca artistas, eventos, canciones..." class="navbar-search-input" autocomplete="off" />
                <button class="navbar-search-clear" id="navbar-search-clear" style="display:none">✕</button>
              </div>
              <!-- Dropdown de resultados -->
              <div class="navbar-search-results" id="navbar-search-results" style="display:none"></div>
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
                      <a href="#/perfil" class="dropdown-item" id="btn-user-profile">Mi Perfil</a>
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

    // ====== BUSCADOR GLOBAL FUNCIONAL ======
    this._attachSearchEvents(el);
  },

  _attachSearchEvents(el) {
    const input = el.querySelector('#navbar-search-input');
    const resultsBox = el.querySelector('#navbar-search-results');
    const clearBtn = el.querySelector('#navbar-search-clear');

    if (!input || !resultsBox) return;

    // Teclas
    input.addEventListener('input', () => {
      const q = input.value.trim();
      clearBtn.style.display = q ? 'flex' : 'none';
      if (!q) {
        resultsBox.style.display = 'none';
        return;
      }
      // Debounce 350ms
      clearTimeout(this._searchTimeout);
      this._searchTimeout = setTimeout(() => this._doSearch(q, resultsBox), 350);
    });

    // Limpiar
    clearBtn?.addEventListener('click', () => {
      input.value = '';
      clearBtn.style.display = 'none';
      resultsBox.style.display = 'none';
      input.focus();
    });

    // Enter para buscar en inicio
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const q = input.value.trim();
        if (q) {
          resultsBox.style.display = 'none';
          router.navigate(`#/?busqueda=${encodeURIComponent(q)}`);
        }
      }
      if (e.key === 'Escape') {
        resultsBox.style.display = 'none';
        input.blur();
      }
    });

    // Cerrar al hacer clic fuera
    document.addEventListener('click', (e) => {
      if (!el.querySelector('#navbar-search-wrapper')?.contains(e.target)) {
        resultsBox.style.display = 'none';
      }
    });
  },

  async _doSearch(q, resultsBox) {
    resultsBox.style.display = 'block';
    resultsBox.innerHTML = `<div class="search-loading">🔍 Buscando "${q}"...</div>`;

    try {
      // Llamar a /api/inicio/buscar (búsqueda global de artistas y eventos)
      const [globalResults, postsData] = await Promise.all([
        api.get(`/inicio/buscar?busqueda=${encodeURIComponent(q)}`).catch(() => null),
        api.get(`/Feed/posts?pagina=1&tamanoPagina=5`).catch(() => null),
      ]);

      const artistas = globalResults?.artistas || globalResults?.artistasDestacados || [];
      const eventos = globalResults?.eventos || globalResults?.eventosProximos || [];
      const allPosts = Array.isArray(postsData) ? postsData : (postsData?.posts || postsData?.publicaciones || []);
      // Filtrar posts por query
      const posts = allPosts.filter(p =>
        (p.texto || '').toLowerCase().includes(q.toLowerCase()) ||
        (p.autorNombre || '').toLowerCase().includes(q.toLowerCase())
      ).slice(0, 3);

      let html = '';

      if (artistas.length === 0 && eventos.length === 0 && posts.length === 0) {
        html = `<div class="search-no-results">No se encontraron resultados para "<strong>${q}</strong>"</div>`;
      } else {
        if (artistas.length > 0) {
          html += `<div class="search-group-title">🎤 Artistas</div>`;
          html += artistas.slice(0, 4).map(a => {
            const av = a.fotoPerfilUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(a.nombre||'A')}&background=0d6855&color=fff&size=40`;
            return `
              <div class="search-result-item" data-nav="#/perfil">
                <img src="${av}" class="search-result-avatar" />
                <div class="search-result-info">
                  <span class="search-result-title">${a.nombre}</span>
                  <span class="search-result-sub">${a.generoMusical || a.tipoPerfil || 'Músico'} · ${a.ubicacion || 'Nicaragua'}</span>
                </div>
              </div>
            `;
          }).join('');
        }

        if (eventos.length > 0) {
          html += `<div class="search-group-title">🎟️ Eventos</div>`;
          html += eventos.slice(0, 3).map(ev => {
            const id = ev.idEvento || ev.id;
            return `
              <div class="search-result-item" data-nav="#/detalle?tipo=evento&id=${id}">
                <span class="search-result-icon">🎟️</span>
                <div class="search-result-info">
                  <span class="search-result-title">${ev.titulo}</span>
                  <span class="search-result-sub">📍 ${ev.ubicacion || 'Nicaragua'}</span>
                </div>
              </div>
            `;
          }).join('');
        }

        if (posts.length > 0) {
          html += `<div class="search-group-title">📝 Publicaciones</div>`;
          html += posts.map(p => {
            const id = p.idPublicacion || p.id;
            const thumb = (p.media || [])[0]?.url || null;
            return `
              <div class="search-result-item" data-nav="#/detalle?tipo=post&id=${id}">
                ${thumb ? `<img src="${thumb}" class="search-result-thumb" />` : `<span class="search-result-icon">📝</span>`}
                <div class="search-result-info">
                  <span class="search-result-title">${p.autorNombre || 'Publicación'}</span>
                  <span class="search-result-sub">${(p.texto || '').slice(0, 60)}...</span>
                </div>
              </div>
            `;
          }).join('');
        }

        html += `<div class="search-view-all" id="search-view-all-btn" data-q="${q}">Ver todos los resultados →</div>`;
      }

      resultsBox.innerHTML = html;

      // Listeners en resultados
      resultsBox.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
          const nav = item.dataset.nav;
          if (nav) {
            router.navigate(nav);
            resultsBox.style.display = 'none';
          }
        });
      });

      resultsBox.querySelector('#search-view-all-btn')?.addEventListener('click', () => {
        const queryQ = resultsBox.querySelector('#search-view-all-btn')?.dataset.q || q;
        router.navigate(`#/?busqueda=${encodeURIComponent(queryQ)}`);
        resultsBox.style.display = 'none';
      });

    } catch (err) {
      resultsBox.innerHTML = `<div class="search-no-results">Error al buscar. Intenta de nuevo.</div>`;
    }
  }
};
