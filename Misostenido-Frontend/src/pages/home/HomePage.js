/**
 * HomePage.js — Página de Inicio / Dashboard con datos reales
 * Conectada a Misostenido.Api — incluye sección de Entretenimiento
 */
import { authService } from '../../services/authService.js';
import { homeService } from '../../services/homeService.js';
import { AuthModal } from '../../components/modal/AuthModal.js';
import { router } from '../../router/router.js';
import { api } from '../../services/api.js';

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

          <!-- BUSCADOR CON FILTROS -->
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
                <option value="bateria">Batería &amp; Percusión</option>
                <option value="vocalista">Vocalista / Coros</option>
                <option value="teclado">Teclado &amp; Piano</option>
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
          <button class="section-link-more protected-action" data-feature="Ver todos los Músicos" data-nav="#/feed">
            Ver Todos los Músicos &rarr;
          </button>
        </div>
        <p class="section-subtitle">Los talentos más activos y valorados de la comunidad musical</p>
        <div id="artists-container">
          <div class="loading-state-card">Cargando artistas destacados...</div>
        </div>
      </section>

      <!-- ================= 🔥 TENDENCIAS DEL FEED ================= -->
      <section class="content-section tendencias-section">
        <div class="section-header-row">
          <div class="section-title-wrapper">
            <span class="section-title-icon">🔥</span>
            <h2 class="section-title">Tendencias de la Comunidad</h2>
          </div>
          <button class="section-link-more protected-action" data-feature="Feed Principal" data-nav="#/feed">
            Ver Feed Completo &rarr;
          </button>
        </div>
        <p class="section-subtitle">Las publicaciones con más likes y más recientes de la plataforma</p>
        <div id="tendencias-container">
          <div class="loading-state-card">Cargando tendencias...</div>
        </div>
      </section>

      <!-- ================= CONTRATACIONES DESTACADAS ================= -->
      <section class="content-section">
        <div class="section-header-row">
          <div class="section-title-wrapper">
            <span class="section-title-icon">💼</span>
            <h2 class="section-title">Contrataciones Destacadas</h2>
          </div>
          <button class="section-link-more protected-action" data-feature="Ver todas las contrataciones" data-nav="#/contrataciones">
            Ver Todas &rarr;
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
          <button class="section-link-more protected-action" data-feature="Ver Calendario Completo" data-nav="#/eventos">
            Ver Calendario Completo &rarr;
          </button>
        </div>
        <p class="section-subtitle">Asiste a conciertos, clínicas, jams y expande tu red de contactos en vivo.</p>
        <div id="events-container">
          <div class="loading-state-card">Cargando cartelera de eventos...</div>
        </div>
      </section>

      <!-- ================= ENTRETENIMIENTO / NEGOCIOS ================= -->
      <section class="content-section entretenimiento-section">
        <div class="section-header-row">
          <div class="section-title-wrapper">
            <span class="section-title-icon">🎨</span>
            <h2 class="section-title">Entretenimiento y Creatividad</h2>
          </div>
          <button class="section-link-more protected-action" data-feature="Explorar Creatividad" data-nav="#/creatividad">
            Explorar Todo &rarr;
          </button>
        </div>
        <p class="section-subtitle">Estudios, tiendas musicales, academias y negocios creativos recomendados.</p>
        <div id="entretenimiento-container">
          <div class="loading-state-card">Cargando entretenimiento...</div>
        </div>
      </section>

      <!-- ================= CTA COMUNIDAD ================= -->
      <section class="content-section">
        <div class="community-header text-center">
          <div class="badge-fire">🚀 ¿Listo para unirte?</div>
          <p class="section-subtitle">Crea tu perfil, publica tu música y conecta con la industria musical de Latinoamérica.</p>
        </div>
        <div class="feed-cta-center">
          <button class="btn-feed-cta protected-action" data-feature="Feed Principal de la Comunidad" data-nav="#/feed">
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
    const artistsContainer = container.querySelector('#artists-container');
    const gigsContainer = container.querySelector('#gigs-container');
    const eventsContainer = container.querySelector('#events-container');
    const tendenciasContainer = container.querySelector('#tendencias-container');
    const entretenimientoContainer = container.querySelector('#entretenimiento-container');

    const [destacadosData, ofertasData, postsData, negociosData] = await Promise.all([
      homeService.getDestacados(),
      homeService.getOfertas(),
      api.get('/Feed/posts?pagina=1&tamanoPagina=20').catch(() => null),
      api.get('/creatividad/negocios?orden=RECIENTES&tamPagina=6').catch(() => null),
    ]);

    const { artistasDestacados, eventosProximos } = destacadosData;

    // 1. ARTISTAS DESTACADOS (Top 4)
    const artistasTop = (artistasDestacados || []).slice(0, 4);
    if (artistasTop.length === 0) {
      artistsContainer.innerHTML = this._emptyState('🎤', 'No hay artistas disponibles', 'Sé el primero en registrarte y crear tu perfil de artista en la plataforma.');
    } else {
      artistsContainer.innerHTML = `
        <div class="artists-grid">
          ${artistasTop.map(artist => {
            const avatar = artist.fotoPerfilUrl 
              ? this._formatMediaUrl(artist.fotoPerfilUrl)
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(artist.nombre)}&background=0d6855&color=fff`;
            const infoTag = artist.generoMusical || artist.instrumento || artist.tipoPerfil || 'Músico';
            return `
              <div class="artist-card">
                <div class="artist-avatar-wrap">
                  <img src="${avatar}" alt="${artist.nombre}" class="artist-img" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(artist.nombre)}&background=0d6855&color=fff'" />
                  <span class="status-indicator"></span>
                </div>
                <h3 class="artist-name">${artist.nombre}</h3>
                <span class="artist-role-badge">🎵 ${infoTag}</span>
                <p class="artist-location">📍 ${artist.ubicacion || 'Nicaragua'} • ${artist.totalSeguidores || 0} seguidores</p>
                <button class="btn-card-action protected-action" data-feature="Ver perfil de ${artist.nombre}" data-nav="#/perfil">
                  Ver Perfil Completo
                </button>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    // 2. TENDENCIAS DEL FEED (Top 6 ordenadas por likes)
    const allPosts = Array.isArray(postsData)
      ? postsData
      : (postsData?.posts || postsData?.publicaciones || []);

    const postsSorted = [...allPosts]
      .sort((a, b) => (b.totalLikes || 0) - (a.totalLikes || 0))
      .slice(0, 6);

    if (postsSorted.length === 0) {
      tendenciasContainer.innerHTML = this._emptyState('🔥', 'No hay tendencias todavía', 'Aún no hay publicaciones con likes. ¡Sé el primero en publicar algo!');
    } else {
      tendenciasContainer.innerHTML = `
        <div class="tendencias-grid">
          ${postsSorted.map(post => {
            const id = post.idPublicacion || post.id;
            const avatar = post.autorFoto 
              ? this._formatMediaUrl(post.autorFoto)
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(post.autorNombre||'U')}&background=0d6855&color=fff`;
            
            const mediaList = post.multimedia || post.media || [];
            const firstMedia = mediaList[0];
            const mediaUrl = firstMedia?.url ? this._formatMediaUrl(firstMedia.url) : null;
            
            const isFoto = firstMedia && (firstMedia.tipo === 'FOTO' || (firstMedia.url && firstMedia.url.match(/\.(jpg|jpeg|png|webp|gif)$/i)));
            const isVideo = firstMedia && (firstMedia.tipo === 'VIDEO' || (firstMedia.url && (firstMedia.url.includes('youtube') || firstMedia.url.includes('youtu.be') || firstMedia.url.match(/\.(mp4|webm|mov)$/i))));
            const isAudio = firstMedia && (firstMedia.tipo === 'AUDIO' || (firstMedia.url && firstMedia.url.match(/\.(mp3|wav|ogg|m4a)$/i)));

            return `
              <div class="tendencia-card clickable-card" data-nav="#/detalle?tipo=post&id=${id}">
                ${isFoto && mediaUrl ? `
                  <div class="tendencia-media-wrap">
                    <img src="${mediaUrl}" alt="Publicación de ${post.autorNombre}" class="tendencia-img" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'tendencia-text-thumb\\'>🎵 Publicación</div>'" />
                    <div class="tendencia-overlay">
                      <span class="tendencia-likes-badge">❤️ ${post.totalLikes || 0}</span>
                    </div>
                  </div>
                ` : isVideo ? `
                  <div class="tendencia-media-wrap tendencia-video-thumb">
                    <div class="tendencia-play-icon">▶️</div>
                    <span class="tendencia-tipo-badge">🎬 Video</span>
                  </div>
                ` : isAudio ? `
                  <div class="tendencia-media-wrap tendencia-audio-thumb">
                    <div class="tendencia-play-icon">🎧</div>
                    <span class="tendencia-tipo-badge">🎵 Audio</span>
                  </div>
                ` : `
                  <div class="tendencia-media-wrap tendencia-text-thumb">
                    <div class="tendencia-text-preview">"${(post.texto || 'Música y Comunidad').slice(0, 80)}${(post.texto||'').length > 80 ? '...' : ''}"</div>
                  </div>
                `}
                <div class="tendencia-info">
                  <div class="tendencia-author-row">
                    <img src="${avatar}" class="tendencia-avatar" onerror="this.src='https://ui-avatars.com/api/?name=U&background=0d6855&color=fff'" />
                    <span class="tendencia-author">${post.autorNombre || 'Músico'}</span>
                  </div>
                  ${post.texto && !isFoto ? `<p class="tendencia-text">${post.texto.slice(0, 90)}${post.texto.length > 90 ? '...' : ''}</p>` : ''}
                  <div class="tendencia-footer">
                    <span class="tendencia-stat">❤️ ${post.totalLikes || 0}</span>
                    <span class="tendencia-stat">💬 ${post.totalComentarios || 0}</span>
                    <span class="tendencia-cta">Ver más →</span>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    // 3. CONTRATACIONES DESTACADAS (Top 6 con foto si tiene)
    const ofertasRaw = (ofertasData || []).slice(0, 6);
    const ofertasTop = await Promise.all(
      ofertasRaw.map(async (gig) => {
        const id = gig.idOfertaServicio || gig.id;
        try {
          const detalle = await api.get(`/Contratacion/ofertas/${id}`).catch(() => null);
          if (detalle && detalle.media) {
            return { ...gig, ...detalle, media: detalle.media };
          }
        } catch(e) {}
        return gig;
      })
    );

    if (ofertasTop.length === 0) {
      gigsContainer.innerHTML = this._emptyState('💼', 'No hay ofertas disponibles', 'No hay ofertas de contratación activas publicadas por la comunidad.');
    } else {
      gigsContainer.innerHTML = `
        <div class="gigs-grid">
          ${ofertasTop.map(gig => {
            const id = gig.idOfertaServicio || gig.id;
            const tarifa = gig.tarifaAproximada ? `$${gig.tarifaAproximada} USD` : 'A convenir';
            const mediaList = gig.media || gig.multimedia || [];
            const fotoObj = mediaList.find(m => m.tipo === 'FOTO' || (m.url && m.url.match(/\.(jpg|jpeg|png|webp|gif)$/i)));
            const gigImg = fotoObj?.url ? this._formatMediaUrl(fotoObj.url) : (gig.fotoPerfilUrl ? this._formatMediaUrl(gig.fotoPerfilUrl) : null);
            const avatar = gig.fotoPerfilUrl 
              ? this._formatMediaUrl(gig.fotoPerfilUrl)
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(gig.artistaNombre||'U')}&background=0d6855&color=fff`;

            return `
              <div class="gig-card clickable-card" data-nav="#/detalle?tipo=contratacion&id=${id}">
                ${gigImg ? `
                  <div class="gig-media-wrap">
                    <img src="${gigImg}" alt="${gig.titulo}" class="gig-cover-img" onerror="this.parentElement.style.display='none'" />
                    <span class="gig-badge-category">🎵 ${gig.generoMusical || 'Música'}</span>
                  </div>
                ` : `
                  <div class="gig-media-placeholder">
                    <span class="gig-ph-icon">🎸</span>
                    <span class="gig-badge-category">🎵 ${gig.generoMusical || 'Música en Vivo'}</span>
                  </div>
                `}
                <div class="gig-card-body-content">
                  <div class="gig-card-head">
                    <img src="${avatar}" class="gig-avatar-sm" onerror="this.src='https://ui-avatars.com/api/?name=U&background=0d6855&color=fff'" />
                    <div class="gig-org-info">
                      <h4>${gig.artistaNombre || 'Usuario'}</h4>
                      <small>📍 ${gig.ubicacion || 'Nicaragua'}</small>
                    </div>
                  </div>
                  <h3 class="gig-title">${gig.titulo}</h3>
                  <div class="gig-rate-badge">💰 Tarifa: ${tarifa}</div>
                  <button class="btn-card-action btn-gig-apply protected-action" data-feature="Postulación ${gig.titulo}" data-nav="#/detalle?tipo=contratacion&id=${id}">
                    💼 Ver Oferta
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    // 4. EVENTOS PRÓXIMOS (Top 6 con foto si tiene)
    const eventosRaw = (eventosProximos && eventosProximos.length > 0)
      ? eventosProximos.slice(0, 6)
      : [];
    const eventosLista = eventosRaw.length > 0
      ? eventosRaw
      : ((await api.get('/Evento').catch(() => [])) || []).slice(0, 6);

    const eventosTop = await Promise.all(
      eventosLista.map(async (ev) => {
        const id = ev.idEvento || ev.id;
        try {
          const detalle = await api.get(`/Evento/${id}`).catch(() => null);
          if (detalle) {
            return { ...ev, ...detalle, media: detalle.media || [] };
          }
        } catch (e) {}
        return ev;
      })
    );

    if (eventosTop.length === 0) {
      eventsContainer.innerHTML = this._emptyState('🎟️', 'No hay eventos próximos', 'No hay eventos o jam sessions próximas agendadas actualmente.');
    } else {
      eventsContainer.innerHTML = `
        <div class="events-grid">
          ${eventosTop.map(ev => {
            const id = ev.idEvento || ev.id;
            const fecha = ev.fechaEvento ? new Date(ev.fechaEvento) : null;
            const mes = fecha ? fecha.toLocaleString('es-ES', { month: 'short' }).toUpperCase() : '---';
            const dia = fecha ? fecha.getDate() : '?';
            
            // Imagen real del evento
            const mediaList = ev.media || ev.multimedia || [];
            const fotoObj = mediaList.find(m => m.tipo === 'FOTO' || (m.url && m.url.match(/\.(jpg|jpeg|png|webp|gif)$/i)));
            const rawImg = fotoObj?.url || mediaList[0]?.url || ev.fotoPerfilUrl || ev.organizadorFoto || null;
            const imgUrl = rawImg ? this._formatMediaUrl(rawImg) : null;

            return `
              <div class="event-card clickable-card" data-nav="#/detalle?tipo=evento&id=${id}">
                <div class="event-thumb">
                  <div class="event-date-box">
                    <span class="date-month">${mes}</span>
                    <span class="date-day">${dia}</span>
                  </div>
                  ${imgUrl
                    ? `<img src="${imgUrl}" alt="${ev.titulo}" class="event-img-cover" onerror="this.parentElement.innerHTML='<div class=\\'event-thumb-placeholder\\'><span>🎟️</span></div>'" />`
                    : `<div class="event-thumb-placeholder"><span>🎟️</span></div>`
                  }
                </div>
                <div class="event-details">
                  <span class="event-badge-tipo">🎟️ ${ev.tipoEvento || 'Evento en vivo'}</span>
                  <h3 class="event-title">${ev.titulo}</h3>
                  <p class="event-org">Organizado por ${ev.organizadorNombre || 'Misostenido'}</p>
                  <div class="event-meta">
                    <span>📍 ${ev.ubicacion || 'Localización por confirmar'}</span>
                  </div>
                  <button class="btn-card-action btn-event-ticket protected-action" data-feature="Ver evento ${ev.titulo}" data-nav="#/detalle?tipo=evento&id=${id}">
                    🎟️ Ver Evento
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    // 5. ENTRETENIMIENTO / NEGOCIOS (Top 6 con foto o icono temático)
    const negociosArr = Array.isArray(negociosData)
      ? negociosData
      : (negociosData?.negocios || negociosData?.items || []);
    const negociosRaw = negociosArr.slice(0, 6);

    const negociosTop = await Promise.all(
      negociosRaw.map(async (neg) => {
        const id = neg.idNegocio || neg.id || neg.IdNegocio;
        const portada = neg.imagenPortadaUrl || neg.ImagenPortadaUrl || neg.logoUrl || neg.LogoUrl || neg.fotoPerfilUrl;
        if (!portada && id) {
          try {
            const detalle = await api.get(`/creatividad/negocios/${id}`).catch(() => null);
            if (detalle) {
              return { ...neg, ...detalle };
            }
          } catch(e) {}
        }
        return neg;
      })
    );

    if (negociosTop.length === 0) {
      entretenimientoContainer.innerHTML = this._emptyState('🎨', 'No hay negocios todavía', 'Aún no hay negocios creativos publicados en la plataforma.');
    } else {
      entretenimientoContainer.innerHTML = `
        <div class="entretenimiento-grid">
          ${negociosTop.map(neg => {
            const id = neg.idNegocio || neg.id || neg.IdNegocio;
            const portada = neg.imagenPortadaUrl || neg.ImagenPortadaUrl || neg.logoUrl || neg.LogoUrl || neg.fotoPerfilUrl;
            let rawImg = portada;
            if (!rawImg && neg.multimedia && neg.multimedia.length > 0) {
              const foto = neg.multimedia.find(m => m.tipo === 'FOTO' || (m.url && m.url.match(/\.(jpg|jpeg|png|webp|gif)$/i)));
              rawImg = foto?.url || neg.multimedia[0]?.url;
            }
            const img = rawImg ? this._formatMediaUrl(rawImg) : null;
            const rating = neg.calificacionPromedio ? `⭐ ${Number(neg.calificacionPromedio).toFixed(1)}` : '';
            const cat = neg.categoria || neg.categoriaNombre || 'Creatividad';
            const catEmoji = cat.toLowerCase().includes('tienda') ? '🏪' : cat.toLowerCase().includes('estudio') ? '🎙️' : cat.toLowerCase().includes('curso') || cat.toLowerCase().includes('academia') ? '🎓' : cat.toLowerCase().includes('luthier') ? '🛠️' : '🎨';

            return `
              <div class="entretenimiento-card clickable-card" data-nav="#/detalle?tipo=negocio&id=${id}">
                ${img
                  ? `<img src="${img}" alt="${neg.nombre}" class="entretenimiento-img" onerror="this.outerHTML='<div class=\\'entretenimiento-img-placeholder\\'>${catEmoji}</div>'" />`
                  : `<div class="entretenimiento-img-placeholder">${catEmoji}</div>`
                }
                <div class="entretenimiento-info">
                  <span class="entretenimiento-categoria">${catEmoji} ${cat}</span>
                  <h3 class="entretenimiento-nombre">${neg.nombre}</h3>
                  <p class="entretenimiento-ciudad">📍 ${neg.ciudad || 'Nicaragua'} ${rating ? `• ${rating}` : ''}</p>
                  ${neg.descripcion ? `<p class="entretenimiento-desc">${neg.descripcion.slice(0, 80)}${neg.descripcion.length > 80 ? '...' : ''}</p>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    this.bindProtectedActions(container);
    this.bindClickableCards(container);
  },

  _formatMediaUrl(url) {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
      return url;
    }
    const backendOrigin = api.BASE_URL.replace('/api', '');
    return `${backendOrigin}${url.startsWith('/') ? '' : '/'}${url}`;
  },

  _emptyState(icon, title, subtitle) {
    return `
      <div class="empty-state-card">
        <span class="empty-state-icon">${icon}</span>
        <h4 class="empty-state-title">${title}</h4>
        <p class="empty-state-subtitle">${subtitle}</p>
      </div>
    `;
  },

  bindClickableCards(container) {
    container.querySelectorAll('.clickable-card').forEach(card => {
      if (card.dataset.boundNav === 'true') return;
      card.dataset.boundNav = 'true';
      card.style.cursor = 'pointer';
      card.addEventListener('click', (e) => {
        // Evitar si el clic fue en un botón interno
        if (e.target.closest('button')) return;
        const nav = card.dataset.nav;
        if (nav) {
          const isAuth = authService.isAuthenticated();
          if (!isAuth && (nav.includes('detalle') || nav.includes('feed') || nav.includes('eventos') || nav.includes('contrataciones'))) {
            AuthModal.show('Inicia Sesión', 'Debes iniciar sesión para ver el detalle de este contenido.');
          } else {
            router.navigate(nav);
          }
        }
      });
    });
  },

  bindProtectedActions(container) {
    const isAuth = authService.isAuthenticated();
    const protectedElements = container.querySelectorAll('.protected-action');

    protectedElements.forEach(el => {
      if (el.dataset.bound === 'true') return;
      el.dataset.bound = 'true';

      el.addEventListener('click', (e) => {
        e.stopPropagation(); // Evitar que el card padre también navegue
        if (!isAuth) {
          e.preventDefault();
          const feature = el.getAttribute('data-feature') || 'esta función';
          AuthModal.show(
            '¡Únete a Misostenido!',
            `Para acceder a "${feature}", necesitas iniciar sesión con tu cuenta.`
          );
        } else {
          const nav = el.getAttribute('data-nav');
          if (nav) {
            router.navigate(nav);
          } else {
            const feature = el.getAttribute('data-feature') || '';
            if (feature.includes('contrataciones') || feature.includes('Músicos') || feature.includes('Contratar')) {
              router.navigate('#/contrataciones');
            } else if (feature.includes('Calendario') || feature.includes('Entradas') || feature.includes('evento')) {
              router.navigate('#/eventos');
            } else if (feature.includes('Feed') || feature.includes('Comunidad')) {
              router.navigate('#/feed');
            } else if (feature.includes('Perfil') || feature.includes('perfil')) {
              router.navigate('#/perfil');
            } else if (feature.includes('Creatividad') || feature.includes('Explorar')) {
              router.navigate('#/creatividad');
            }
          }
        }
      });
    });
  },

  attachEvents(container) {
    this.bindProtectedActions(container);
    this.bindClickableCards(container);

    // Buscador interactivo del hero
    const isAuth = authService.isAuthenticated();
    const searchBtn = container.querySelector('#btn-search-hero');

    searchBtn?.addEventListener('click', () => {
      const q = container.querySelector('#search-query')?.value?.trim();
      const g = container.querySelector('#search-genre')?.value;
      const loc = container.querySelector('#search-location')?.value?.trim();

      if (!q && !g && !loc) {
        container.querySelector('#search-query')?.focus();
        return;
      }

      // Navegar al inicio con la búsqueda como param (puede expandirse a una SearchPage)
      const params = new URLSearchParams();
      if (q) params.append('busqueda', q);
      if (g) params.append('generoMusical', g);
      if (loc) params.append('ubicacion', loc);

      router.navigate(`#/?${params.toString()}`);
    });

    // También buscar al presionar Enter en los inputs
    container.querySelectorAll('#search-query, #search-location').forEach(inp => {
      inp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') container.querySelector('#btn-search-hero')?.click();
      });
    });
  }
};
