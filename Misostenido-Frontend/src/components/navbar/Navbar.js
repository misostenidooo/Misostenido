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

      const mobileNavItemsHtml = navLinks.map(link => {
        const isActive = currentHash === link.path ? 'active' : '';
        return `
          <li>
            <a href="${link.path}" class="mobile-nav-link ${isActive}" data-protected="${link.protected}">
              <span>${link.label}</span>
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
            <!-- Botón Hamburguesa Móvil -->
            <button class="btn-mobile-toggle" id="btn-mobile-toggle" aria-label="Abrir menú de navegación">
              <span class="bar"></span>
              <span class="bar"></span>
              <span class="bar"></span>
            </button>

            <!-- Logo Oficial -->
            <a href="#/" class="navbar-brand">
              <img src="src/assets/images/logo.png" alt="Misostenido" class="brand-logo-img" />
            </a>

            <!-- Barra de búsqueda global (Desktop) -->
            <div class="navbar-search-wrapper" id="navbar-search-wrapper">
              <div class="navbar-search-bar" id="navbar-search-bar">
                <img src="src/assets/images/ICONO_BUSQUEDA.png" alt="Buscar" class="ms-icon ms-icon-sm" />
                <input type="text" id="navbar-search-input" placeholder="Busca artistas, eventos, canciones..." class="navbar-search-input" autocomplete="off" />
                <button class="navbar-search-clear" id="navbar-search-clear" style="display:none">✕</button>
              </div>
              <!-- Dropdown de resultados -->
              <div class="navbar-search-results" id="navbar-search-results" style="display:none"></div>
            </div>

            <!-- Menú central (Desktop) -->
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
                    <img src="src/assets/images/ICONO_CAMPANA.png" alt="Notificaciones" class="ms-icon ms-icon-md" />
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
                      <a href="#/perfil" class="dropdown-item" id="btn-user-profile" style="display:flex;align-items:center;gap:8px;">
                        <img src="src/assets/images/ICONO 9.png" alt="Perfil" class="ms-icon ms-icon-sm" />
                        <span>Mi Perfil & Ajustes</span>
                      </a>
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

        <!-- Drawer y Overlay para Móviles -->
        <div class="mobile-nav-overlay" id="mobile-nav-overlay"></div>
        <aside class="mobile-nav-drawer" id="mobile-nav-drawer">
          <div class="mobile-drawer-header">
            <a href="#/" class="navbar-brand">
              <img src="src/assets/images/logo.png" alt="Misostenido" class="brand-logo-img-mobile" />
            </a>
            <button class="btn-drawer-close" id="btn-drawer-close" aria-label="Cerrar menú">✕</button>
          </div>

          <!-- Buscador en Drawer Móvil -->
          <div class="mobile-drawer-search">
            <div class="navbar-search-bar">
              <img src="src/assets/images/ICONO_BUSQUEDA.png" alt="Buscar" class="ms-icon ms-icon-sm" />
              <input type="text" id="mobile-search-input" placeholder="Buscar artistas, canciones..." class="navbar-search-input" autocomplete="off" />
            </div>
          </div>

          <!-- Links de Navegación Móvil -->
          <ul class="mobile-drawer-links">
            ${mobileNavItemsHtml}
          </ul>

          <!-- Sección Usuario Móvil -->
          <div class="mobile-drawer-footer">
            ${isAuth ? `
              <div class="mobile-user-card">
                <img src="${avatarSrc}" alt="${userName}" class="mobile-user-avatar" />
                <div class="mobile-user-details">
                  <span class="mobile-user-name">${userName}</span>
                  <span class="mobile-user-email">${userEmail}</span>
                </div>
              </div>
              <a href="#/perfil" class="mobile-btn-profile">
                <img src="src/assets/images/ICONO 9.png" alt="Perfil" class="ms-icon ms-icon-sm" />
                <span>Ver Mi Perfil</span>
              </a>
              <button class="mobile-btn-logout" id="btn-mobile-logout">
                <span>Cerrar Sesión</span>
              </button>
            ` : `
              <div class="mobile-auth-buttons">
                <a href="#/login" class="mobile-btn-login">Iniciar Sesión</a>
                <a href="#/register" class="mobile-btn-register">Registrarse</a>
              </div>
            `}
          </div>
        </aside>
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

    // Proteger links de navegación si no está autenticado (Desktop y Móvil)
    const links = el.querySelectorAll('.nav-item[data-protected="true"], .mobile-nav-link[data-protected="true"]');
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        if (!isAuth) {
          e.preventDefault();
          this._closeMobileDrawer(el);
          const target = link.textContent.trim();
          AuthModal.show('Función Exclusiva', `Debes iniciar sesión para explorar la sección de "${target}".`);
        }
      });
    });

    // Control del Cajón Móvil (Hamburger & Overlay)
    const toggleBtn = el.querySelector('#btn-mobile-toggle');
    const closeBtn = el.querySelector('#btn-drawer-close');
    const overlay = el.querySelector('#mobile-nav-overlay');
    const drawer = el.querySelector('#mobile-nav-drawer');

    toggleBtn?.addEventListener('click', () => {
      drawer?.classList.add('open');
      overlay?.classList.add('open');
      document.body.style.overflow = 'hidden';
    });

    const closeDrawer = () => {
      drawer?.classList.remove('open');
      overlay?.classList.remove('open');
      document.body.style.overflow = '';
    };

    closeBtn?.addEventListener('click', closeDrawer);
    overlay?.addEventListener('click', closeDrawer);

    // Cerrar menú móvil al hacer clic en cualquier link
    el.querySelectorAll('.mobile-drawer-links a, .mobile-drawer-footer a').forEach(a => {
      a.addEventListener('click', () => closeDrawer());
    });

    // Dropdown de perfil Desktop
    const profileTrigger = el.querySelector('#user-profile-trigger');
    const dropdown = el.querySelector('#user-dropdown');
    profileTrigger?.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown?.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      dropdown?.classList.remove('show');
    });

    // Botón logout Desktop & Móvil
    const logoutBtn = el.querySelector('#btn-nav-logout');
    logoutBtn?.addEventListener('click', () => {
      authService.logout();
    });

    const mobileLogoutBtn = el.querySelector('#btn-mobile-logout');
    mobileLogoutBtn?.addEventListener('click', () => {
      closeDrawer();
      authService.logout();
    });

    // Campana notificaciones
    const bellBtn = el.querySelector('#btn-notifications');
    bellBtn?.addEventListener('click', () => {
      alert('Tienes 1 nueva solicitud de contratación pendiente.');
    });

    // Buscador móvil con tecla enter
    const mobileSearchInput = el.querySelector('#mobile-search-input');
    mobileSearchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const q = mobileSearchInput.value.trim();
        if (q) {
          closeDrawer();
          router.navigate(`#/?busqueda=${encodeURIComponent(q)}`);
        }
      }
    });

    // ====== BUSCADOR GLOBAL FUNCIONAL ======
    this._attachSearchEvents(el);
  },

  _closeMobileDrawer(el) {
    el.querySelector('#mobile-nav-drawer')?.classList.remove('open');
    el.querySelector('#mobile-nav-overlay')?.classList.remove('open');
    document.body.style.overflow = '';
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
          html += `
            <div class="search-group-title" style="display:flex;align-items:center;gap:6px;">
              <img src="src/assets/images/ICONO 3.png" alt="Artistas" class="ms-icon ms-icon-xs" />
              <span>Artistas</span>
            </div>
          `;
          html += artistas.slice(0, 4).map(a => {
            const av = a.fotoPerfilUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(a.nombre||'A')}&background=0d6855&color=fff&size=40`;
            const aId = a.idUsuario || a.id || a.idArtista || '';
            const navUrl = aId ? `#/perfil?id=${aId}` : `#/perfil`;
            return `
              <div class="search-result-item" data-nav="${navUrl}">
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
          html += `
            <div class="search-group-title" style="display:flex;align-items:center;gap:6px;">
              <img src="src/assets/images/ICONO 6.png" alt="Eventos" class="ms-icon ms-icon-xs" />
              <span>Eventos</span>
            </div>
          `;
          html += eventos.slice(0, 3).map(ev => {
            const id = ev.idEvento || ev.id;
            return `
              <div class="search-result-item" data-nav="#/detalle?tipo=evento&id=${id}">
                <img src="src/assets/images/ICONO 6.png" alt="Evento" class="ms-icon ms-icon-sm" />
                <div class="search-result-info">
                  <span class="search-result-title">${ev.titulo}</span>
                  <span class="search-result-sub">📍 ${ev.ubicacion || 'Nicaragua'}</span>
                </div>
              </div>
            `;
          }).join('');
        }

        if (posts.length > 0) {
          html += `
            <div class="search-group-title" style="display:flex;align-items:center;gap:6px;">
              <img src="src/assets/images/ICONO 2.png" alt="Publicaciones" class="ms-icon ms-icon-xs" />
              <span>Publicaciones</span>
            </div>
          `;
          html += posts.map(p => {
            const id = p.idPublicacion || p.id;
            const thumb = (p.media || [])[0]?.url || null;
            return `
              <div class="search-result-item" data-nav="#/detalle?tipo=post&id=${id}">
                ${thumb ? `<img src="${thumb}" class="search-result-thumb" />` : `<img src="src/assets/images/ICONO 2.png" alt="Post" class="ms-icon ms-icon-sm" />`}
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
