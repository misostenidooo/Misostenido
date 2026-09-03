/**
 * HomePage.js — Página de Inicio / Dashboard basada en Figma
 * Conectada a datos reales de Misostenido.Api
 */
import { authService } from '../../services/authService.js';
import { homeService } from '../../services/homeService.js';
import { AuthModal } from '../../components/modal/AuthModal.js';
import { router } from '../../router/router.js';

export const HomePage = {
  render() {
    const isAuth = authService.isAuthenticated();

    const container = document.createElement('div');
    container.className = 'home-view animate-fade';

    container.innerHTML = `
      <!-- ================= HERO SECTION ================= -->
      <section class="hero-section">
        <div class="hero-backdrop"></div>
        <div class="hero-content">
          <div class="hero-pill-tag">
            <span>🌿 #1 PLATAFORMA MUSICAL DE LATINOAMÉRICA</span>
          </div>

          <h1 class="hero-main-title">
            Conecta con Músicos, Encuentra Talentos y<br />
            Haz Sonar tu Música
          </h1>

          <p class="hero-sub-title">
            La plataforma donde bandas, instrumentistas, docentes y contratistas se encuentran en<br />
            un solo lugar para potenciar la industria musical latina.
          </p>

          <!-- BUSCADOR CON FILTROS (Figma) -->
          <div class="search-filter-bar">
            <div class="filter-input-col">
              <span class="filter-icon">🔍</span>
              <input type="text" placeholder="¿Qué buscas?" class="filter-input" id="search-query" />
            </div>
            <div class="filter-divider"></div>
            <div class="filter-input-col">
              <span class="filter-icon">🎸</span>
              <select class="filter-select" id="search-genre">
                <option value="">Género / Instrumento</option>
                <option value="guitarra">Guitarra / Solista</option>
                <option value="bateria">Batería & Percusión</option>
                <option value="vocalista">Vocalista / Coros</option>
                <option value="teclado">Teclado & Piano</option>
                <option value="marimba">Marimba Tradicional</option>
              </select>
            </div>
            <div class="filter-divider"></div>
            <div class="filter-input-col">
              <span class="filter-icon">📍</span>
              <input type="text" placeholder="Ubicación (ej. Managua)" class="filter-input" id="search-location" />
            </div>
            <button class="btn-search-submit" id="btn-search-hero">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <span>Buscar</span>
            </button>
          </div>

          <!-- BOTONES DE ACCIÓN RÁPIDA -->
          <div class="hero-quick-actions">
            <button class="btn-quick-primary protected-action" data-feature="Crear Perfil de Músico">
              <span>🎤</span>
              <span>Soy Músico / Crear mi Perfil</span>
            </button>
            <button class="btn-quick-secondary protected-action" data-feature="Contratar Músicos">
              <span>💼</span>
              <span>Quiero Contratar Músicos</span>
            </button>
          </div>
        </div>
      </section>

      <!-- ================= MÉTRICAS / STATS ================= -->
      <section class="stats-section">
        <div class="stats-container">
          <div class="stat-box">
            <h2 class="stat-number">+2,500</h2>
            <p class="stat-label">Músicos Verificados</p>
          </div>
          <div class="stat-box">
            <h2 class="stat-number">+850</h2>
            <p class="stat-label">Contratos al Mes</p>
          </div>
          <div class="stat-box">
            <h2 class="stat-number">+120</h2>
            <p class="stat-label">Eventos este Mes</p>
          </div>
          <div class="stat-box">
            <h2 class="stat-number">4.9 ★</h2>
            <p class="stat-label">Calificación Promedio</p>
          </div>
        </div>
      </section>

      <!-- ================= ARTISTAS DESTACADOS ================= -->
      <section class="content-section">
        <div class="section-header-row">
          <div class="section-title-wrapper">
            <span class="section-title-icon">⭐</span>
            <h2 class="section-title">Artistas y Bandas Destacadas</h2>
          </div>
          <button class="section-link-more protected-action" data-feature="Ver todos los Músicos">
            Ver Todos los Músicos &rarr;
          </button>
        </div>
        <p class="section-subtitle">Los talentos más activos y valorados de la comunidad musical</p>

        <div id="artists-container">
          <div class="loading-state-card">Cargando artistas destacados...</div>
        </div>
      </section>

      <!-- ================= CONTRATACIONES DESTACADAS ================= -->
      <section class="content-section">
        <div class="section-header-row">
          <div class="section-title-wrapper">
            <span class="section-title-icon">💼</span>
            <h2 class="section-title">Contrataciones Destacadas</h2>
          </div>
          <button class="section-link-more protected-action" data-feature="Ver todas las contrataciones">
            Ver Todos los Músicos &rarr;
          </button>
        </div>

        <div id="gigs-container">
          <div class="loading-state-card">Cargando ofertas de contratación...</div>
        </div>
      </section>

      <!-- ================= CARTELERA DE EVENTOS ================= -->
      <section class="content-section">
        <div class="section-header-row">
          <div class="section-title-wrapper">
            <span class="section-title-icon">🎟️</span>
            <h2 class="section-title">Cartelera de Eventos y Jam Sessions</h2>
          </div>
          <button class="section-link-more protected-action" data-feature="Ver Calendario Completo">
            Ver Calendario Completo &rarr;
          </button>
        </div>
        <p class="section-subtitle">Asiste a conciertos, clínicas, jams y expande tu red de contactos en vivo.</p>

        <div id="events-container">
          <div class="loading-state-card">Cargando cartelera de eventos...</div>
        </div>
      </section>

      <!-- ================= LO MÁS SONADO EN LA COMUNIDAD ================= -->
      <section class="content-section">
        <div class="community-header text-center">
          <div class="badge-fire">🔥 Lo más Sonado en la Comunidad</div>
          <p class="section-subtitle">Últimas maquetas, demos, videos y riffs cargados directamente por nuestros creadores.</p>
        </div>

        <div id="community-container">
          <div class="loading-state-card">Cargando maquetas de la comunidad...</div>
        </div>

        <div class="feed-cta-center">
          <button class="btn-feed-cta protected-action" data-feature="Feed Principal de la Comunidad">
            <span>🚀 Ir al Feed Principal de la Comunidad</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>
      </section>
    `;

    setTimeout(() => {
      this.attachEvents(container);
      this.loadRealData(container);
    }, 0);

    return container;
  },

  async loadRealData(container) {
    const isAuth = authService.isAuthenticated();

    const artistsContainer = container.querySelector('#artists-container');
    const gigsContainer = container.querySelector('#gigs-container');
    const eventsContainer = container.querySelector('#events-container');
    const communityContainer = container.querySelector('#community-container');

    const [destacadosData, ofertasData] = await Promise.all([
      homeService.getDestacados(),
      homeService.getOfertas()
    ]);

    const { artistasDestacados, publicacionesRecientes, eventosProximos } = destacadosData;

    // 1. RENDERIZAR ARTISTAS
    if (!artistasDestacados || artistasDestacados.length === 0) {
      artistsContainer.innerHTML = `
        <div class="empty-state-card">
          <span class="empty-state-icon">🎤</span>
          <h4 class="empty-state-title">No hay contenido disponible en este momento</h4>
          <p class="empty-state-subtitle">Sé el primero en registrarte y crear tu perfil de artista en la plataforma.</p>
        </div>
      `;
    } else {
      artistsContainer.innerHTML = `
        <div class="artists-grid">
          ${artistasDestacados.map(artist => {
            const avatar = artist.fotoPerfilUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(artist.nombre)}&background=0d6855&color=fff`;
            const infoTag = artist.generoMusical || artist.instrumento || artist.tipoPerfil;
            return `
              <div class="artist-card">
                <div class="artist-avatar-wrap">
                  <img src="${avatar}" alt="${artist.nombre}" class="artist-img" />
                  <span class="status-indicator"></span>
                </div>
                <h3 class="artist-name">${artist.nombre}</h3>
                <span class="artist-role-badge">🎵 ${infoTag}</span>
                <p class="artist-location">📍 ${artist.ubicacion || 'Nicaragua'} • ${artist.totalSeguidores || 0} seguidores</p>
                <button class="btn-card-action protected-action" data-feature="Perfil de ${artist.nombre}">
                  Ver Perfil Completo
                </button>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    // 2. RENDERIZAR CONTRATACIONES / OFERTAS DE SERVICIO
    if (!ofertasData || ofertasData.length === 0) {
      gigsContainer.innerHTML = `
        <div class="empty-state-card">
          <span class="empty-state-icon">💼</span>
          <h4 class="empty-state-title">No hay contenido disponible en este momento</h4>
          <p class="empty-state-subtitle">No hay ofertas de contratación activas publicadas por la comunidad.</p>
        </div>
      `;
    } else {
      gigsContainer.innerHTML = `
        <div class="gigs-grid">
          ${ofertasData.map(gig => {
            const tarifa = gig.tarifaAproximada ? `$${gig.tarifaAproximada} USD` : 'A convenir';
            return `
              <div class="gig-card">
                <div class="gig-card-head">
                  <div class="gig-icon-box">💼</div>
                  <div class="gig-org-info">
                    <h4>${gig.artistaNombre || 'Usuario'}</h4>
                    <small>Publicado recientemente</small>
                  </div>
                </div>
                <h3 class="gig-title">${gig.titulo}</h3>
                <div class="gig-rate-badge">💰 Tarifa: ${tarifa}</div>
                <div class="gig-meta-info">
                  <span>📍 ${gig.ubicacion || 'Nicaragua'}</span>
                  <span>🎵 ${gig.generoMusical || 'General'}</span>
                </div>
                <button class="btn-card-action btn-gig-apply protected-action" data-feature="Postulación ${gig.titulo}">
                  💼 Postularme Ahora
                </button>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    // 3. RENDERIZAR EVENTOS PRÓXIMOS
    if (!eventosProximos || eventosProximos.length === 0) {
      eventsContainer.innerHTML = `
        <div class="empty-state-card">
          <span class="empty-state-icon">🎟️</span>
          <h4 class="empty-state-title">No hay contenido disponible en este momento</h4>
          <p class="empty-state-subtitle">No hay eventos o jam sessions próximas agendadas actualmente.</p>
        </div>
      `;
    } else {
      eventsContainer.innerHTML = `
        <div class="events-grid">
          ${eventosProximos.map(ev => {
            const fecha = new Date(ev.fechaEvento);
            const mes = fecha.toLocaleString('es-ES', { month: 'short' }).toUpperCase();
            const dia = fecha.getDate();
            const img = ev.organizadorFoto || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80';
            return `
              <div class="event-card">
                <div class="event-thumb">
                  <div class="event-date-box">
                    <span class="date-month">${mes}</span>
                    <span class="date-day">${dia}</span>
                  </div>
                  <img src="${img}" alt="${ev.titulo}" />
                </div>
                <div class="event-details">
                  <h3 class="event-title">${ev.titulo}</h3>
                  <p class="event-org">Organizado por ${ev.organizadorNombre}</p>
                  <div class="event-meta">
                    <span>📍 ${ev.ubicacion || 'Localización por confirmar'}</span>
                    <span>⏰ ${ev.tipoEvento || 'Evento en vivo'}</span>
                  </div>
                  <button class="btn-card-action btn-event-ticket protected-action" data-feature="Entradas ${ev.titulo}">
                    🎟️ Obtener Entradas
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    // 4. RENDERIZAR COMUNIDAD (PUBLICACIONES RECIENTES)
    if (!publicacionesRecientes || publicacionesRecientes.length === 0) {
      communityContainer.innerHTML = `
        <div class="empty-state-card">
          <span class="empty-state-icon">🔥</span>
          <h4 class="empty-state-title">No hay contenido disponible en este momento</h4>
          <p class="empty-state-subtitle">Aún no hay maquetas o publicaciones creadas por los usuarios de la comunidad.</p>
        </div>
      `;
    } else {
      communityContainer.innerHTML = `
        <div class="community-grid">
          ${publicacionesRecientes.map(post => {
            const avatar = post.autorFoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.autorNombre)}&background=0d6855&color=fff`;
            return `
              <div class="community-card">
                <div class="post-user-head">
                  <img src="${avatar}" alt="${post.autorNombre}" class="post-avatar" />
                  <div>
                    <h4>${post.autorNombre}</h4>
                    <small>🎵 ${post.autorTipo || 'Músico'}</small>
                  </div>
                </div>
                <p class="post-desc">${post.texto || 'Publicación sin texto.'}</p>
                <div class="post-footer-stats">
                  <span>❤️ ${post.totalLikes || 0} likes</span>
                  <span>💬 ${post.totalComentarios || 0} comentarios</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    // Re-bind listeners para los nuevos elementos .protected-action cargados dinámicamente
    this.bindProtectedActions(container);
  },

  bindProtectedActions(container) {
    const isAuth = authService.isAuthenticated();
    const protectedElements = container.querySelectorAll('.protected-action');

    protectedElements.forEach(el => {
      // Evitamos duplicar event listeners
      if (el.dataset.bound === 'true') return;
      el.dataset.bound = 'true';

      el.addEventListener('click', (e) => {
        if (!isAuth) {
          e.preventDefault();
          const feature = el.getAttribute('data-feature') || 'esta función';
          AuthModal.show(
            '¡Únete a Misostenido!', 
            `Para acceder a "${feature}", postularte a contratos o interactuar con la comunidad, inicia sesión con tu cuenta.`
          );
        } else {
          const feature = el.getAttribute('data-feature') || '';
          alert(`Has interactuado con: ${feature}`);
        }
      });
    });
  },

  attachEvents(container) {
    this.bindProtectedActions(container);

    // Buscador interactivo
    const isAuth = authService.isAuthenticated();
    const searchBtn = container.querySelector('#btn-search-hero');

    searchBtn?.addEventListener('click', () => {
      const q = container.querySelector('#search-query')?.value;
      const g = container.querySelector('#search-genre')?.value;
      const loc = container.querySelector('#search-location')?.value;
      
      if (!isAuth) {
        AuthModal.show('Búsqueda Avanzada', 'Inicia sesión para filtrar y contactar a los músicos de la plataforma.');
      } else {
        alert(`Buscando: ${q || 'Cualquiera'} | Género: ${g || 'Todos'} | Ubicación: ${loc || 'Global'}`);
      }
    });
  }
};
