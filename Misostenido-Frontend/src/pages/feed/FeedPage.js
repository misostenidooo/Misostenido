/**
 * FeedPage.js — Feed Principal de Misostenido con diseño y subida estilo Facebook
 * Conectado a Misostenido.Api (.NET) con subida de archivos locales a /api/Upload
 */
import { authService } from '../../services/authService.js';
import { feedService } from '../../services/feedService.js';
import { AuthModal } from '../../components/modal/AuthModal.js';
import { api } from '../../services/api.js';

export const FeedPage = {
  _posts: [],
  _selectedFiles: [], // Array de File objects
  _page: 1,
  _container: null,

  render() {
    const user = authService.getCurrentUser() || {};
    const avatarSrc = user.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'Usuario')}&background=0d6855&color=fff`;
    const firstName = (user.name || 'Músico').split(' ')[0];

    const container = document.createElement('div');
    container.className = 'feed-page animate-fade';
    this._container = container;
    this._selectedFiles = [];

    const savedProfileBanner = localStorage.getItem('profile_banner_bg');
    const profileBannerStyle = savedProfileBanner ? `background-image: url('${savedProfileBanner}');` : '';

    container.innerHTML = `
      <div class="feed-layout">

        <!-- ============ SIDEBAR IZQUIERDO ============ -->
        <aside class="feed-sidebar feed-sidebar-left">
          <div class="sidebar-profile-card">
            <div class="profile-banner" id="profile-banner-el" style="${profileBannerStyle}">
              <button class="btn-change-profile-banner" id="btn-change-profile-banner" title="Cambiar foto de fondo de portada">📷</button>
              <input type="file" id="profile-banner-file-input" accept="image/*" style="display:none" />
            </div>
            <div class="profile-info">
              <div class="profile-avatar-wrap">
                <img src="${avatarSrc}" alt="${user.name || 'Usuario'}" class="profile-avatar" />
                <span class="profile-online-dot"></span>
              </div>
              <h3 class="profile-name">${user.name || 'Usuario'}</h3>
              <span class="profile-role-badge">${user.profileType || user.role || 'Músico'}</span>
              <p class="profile-location">📍 Nicaragua</p>
              <div class="profile-stats-row">
                <div class="pstat"><span class="pstat-num">1.2K</span><span class="pstat-label">Seguidores</span></div>
                <div class="pstat-divider"></div>
                <div class="pstat"><span class="pstat-num">45</span><span class="pstat-label">Colabos</span></div>
              </div>
              <a href="#/" class="btn-view-profile">Ver mi perfil completo →</a>
            </div>
          </div>

          <nav class="sidebar-feed-nav">
            <button class="feed-nav-item active" data-filter="todos">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              <span>Feed Principal</span>
            </button>
            <button class="feed-nav-item" data-filter="explorar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <span>Explorar Artistas</span>
            </button>
            <button class="feed-nav-item" data-filter="contrataciones">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>Gigs y Empleo</span>
              <span class="nav-badge">NUEVO</span>
            </button>
            <button class="feed-nav-item" data-filter="eventos">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span>Eventos y Jams</span>
            </button>
          </nav>
        </aside>

        <!-- ============ FEED CENTRAL ============ -->
        <main class="feed-center">

          <!-- COMPOSER ESTILO FACEBOOK -->
          <div class="fb-composer-card" id="fb-composer-trigger">
            <div class="fb-composer-top">
              <img src="${avatarSrc}" alt="Yo" class="fb-user-avatar" />
              <div class="fb-fake-input">
                <span class="fb-fake-placeholder">¿Qué estás pensando, ${firstName}?</span>
                <div class="fb-quick-icons">
                  <span class="fb-icon-live" title="Video en vivo">🎥</span>
                  <span class="fb-icon-media" title="Foto/video">🖼️</span>
                  <span class="fb-icon-emoji" title="Sentimiento/actividad">😊</span>
                </div>
              </div>
            </div>

            <div class="fb-composer-divider"></div>

            <div class="fb-composer-actions">
              <button class="fb-action-btn fb-action-live" id="btn-quick-live">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#f43f5e"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                <span>Video en vivo</span>
              </button>

              <button class="fb-action-btn fb-action-photo" id="btn-quick-photo">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#22c55e"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                <span>Foto/video</span>
              </button>

              <button class="fb-action-btn fb-action-feeling" id="btn-quick-feeling">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#eab308"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                <span>Sentimiento/actividad</span>
              </button>
            </div>
          </div>

          <!-- LISTA DE PUBLICACIONES -->
          <div class="posts-list" id="posts-list">
            <div class="feed-skeleton">
              <div class="skeleton-post"><div class="sk-avatar"></div><div class="sk-lines"><div class="sk-line sk-line-w70"></div><div class="sk-line sk-line-w40"></div><div class="sk-line sk-line-w90"></div></div></div>
              <div class="skeleton-post"><div class="sk-avatar"></div><div class="sk-lines"><div class="sk-line sk-line-w60"></div><div class="sk-line sk-line-w80"></div></div></div>
            </div>
          </div>

        </main>

        <!-- ============ SIDEBAR DERECHO ============ -->
        <aside class="feed-sidebar feed-sidebar-right">
          <!-- Oportunidades -->
          <div class="sidebar-widget">
            <div class="widget-header">
              <h4 class="widget-title">💼 Oportunidades Abiertas</h4>
              <a href="#/contrataciones" class="widget-link">Ver todas</a>
            </div>
            <div id="oportunidades-list">
              <div class="sidebar-skeleton"><div class="sk-line sk-line-w90"></div><div class="sk-line sk-line-w70"></div></div>
            </div>
          </div>

          <!-- Eventos -->
          <div class="sidebar-widget">
            <div class="widget-header">
              <h4 class="widget-title">🎟️ Próximos Eventos</h4>
              <a href="#/eventos" class="widget-link">Ver todos</a>
            </div>
            <div id="eventos-sidebar-list">
              <div class="sidebar-skeleton"><div class="sk-line sk-line-w90"></div><div class="sk-line sk-line-w70"></div></div>
            </div>
          </div>

          <!-- Artistas Destacados -->
          <div class="sidebar-widget">
            <div class="widget-header">
              <h4 class="widget-title">🎵 Artistas Destacados</h4>
              <a href="#/" class="widget-link">Ver todos</a>
            </div>
            <div id="sugeridos-list">
              <div class="sidebar-skeleton"><div class="sk-line sk-line-w90"></div><div class="sk-line sk-line-w70"></div></div>
            </div>
          </div>
        </aside>

      </div>

      <!-- ==============================================================
           MODAL DE CREAR PUBLICACIÓN ESTILO FACEBOOK (CON DROPZONE REAL)
           ============================================================== -->
      <div class="fb-modal-overlay" id="fb-modal-overlay" style="display:none">
        <div class="fb-modal-box">
          
          <!-- Encabezado Modal -->
          <div class="fb-modal-header">
            <h3>Crear publicación</h3>
            <button class="fb-modal-close-btn" id="fb-modal-close" aria-label="Cerrar">✕</button>
          </div>

          <!-- Cuerpo Modal -->
          <div class="fb-modal-body">
            <!-- Info del Usuario -->
            <div class="fb-modal-user">
              <img src="${avatarSrc}" alt="${user.name || 'Usuario'}" class="fb-modal-avatar" />
              <div class="fb-modal-user-meta">
                <span class="fb-modal-user-name">${user.name || 'Usuario'}</span>
                <div class="fb-privacy-pill">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                  <span>Público</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                </div>
              </div>
            </div>

            <!-- Textarea -->
            <textarea class="fb-modal-textarea" id="fb-modal-textarea" placeholder="¿Qué estás pensando, ${firstName}?"></textarea>

            <!-- CONTENEDOR DE SUBIDA DE ARCHIVOS (DROPZONE + PREVIEWS) -->
            <div class="fb-media-dropzone-container" id="fb-media-container" style="display:none">
              
              <!-- Input oculto para seleccionar archivos -->
              <input type="file" id="fb-file-input" multiple accept="image/*,video/*,audio/*" style="display:none" />

              <!-- Zona de Drop si no hay archivos seleccionados -->
              <div class="fb-drop-area" id="fb-drop-area">
                <button class="fb-drop-close-btn" id="fb-close-media-zone" title="Quitar fotos/videos">✕</button>
                <div class="fb-drop-content">
                  <div class="fb-drop-icon-circle">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="#22c55e"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  </div>
                  <h4>Agregar fotos, videos o música</h4>
                   <p>o arrastra y suelta aquí · MP3, MP4, JPG, PNG...</p>
                </div>
              </div>

              <!-- Cuadrícula de Vista Previa de Archivos Seleccionados -->
              <div class="fb-previews-grid" id="fb-previews-grid" style="display:none"></div>

              <div class="fb-add-more-row" id="fb-add-more-row" style="display:none">
                <button class="btn-fb-add-more" id="btn-fb-add-more">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
                  <span>Agregar más fotos o videos</span>
                </button>
              </div>

            </div>

            <!-- Barra "Agregar a tu publicación" estilo Facebook -->
            <div class="fb-add-to-post-card">
              <span class="fb-add-title">Agregar a tu publicación</span>
              <div class="fb-add-icons">
                <button class="fb-tool-btn fb-tool-photo" id="btn-tool-photo" title="Foto/video">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#22c55e"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                </button>
                <button class="fb-tool-btn fb-tool-tag" title="Etiquetar personas">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#1877f2"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                </button>
                <button class="fb-tool-btn fb-tool-emoji" title="Sentimiento/actividad">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#eab308"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                </button>
                <button class="fb-tool-btn fb-tool-location" title="Ubicación">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#ef4444"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                </button>
                <button class="fb-tool-btn fb-tool-audio" title="Audio / Canción">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#0d6855"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                </button>
              </div>
            </div>

          </div>

          <!-- Footer Modal: Botón Publicar -->
          <div class="fb-modal-footer">
            <button class="btn-fb-submit" id="btn-fb-submit" disabled>
              Publicar
            </button>
          </div>

        </div>
      </div>
    `;

    setTimeout(() => {
      this.attachEvents(container);
      this.loadFeed(container);
      this.loadSidebars(container);
    }, 0);

    return container;
  },

  // ─────────────────────────────────────────────
  // NORMALIZADOR DE URLS (Servidor Local vs CDN)
  // ─────────────────────────────────────────────
  formatMediaUrl(url) {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
      return url;
    }
    // Si es ruta relativa tipo /uploads/feed/...
    const backendOrigin = api.BASE_URL.replace('/api', '');
    return `${backendOrigin}${url.startsWith('/') ? '' : '/'}${url}`;
  },

  // ─────────────────────────────────────────────
  // RENDERIZAR UN POST DE LA BASE DE DATOS
  // ─────────────────────────────────────────────
  renderPost(post) {
    const id = post.idPublicacion || post.id;
    const autorNombre = post.autorNombre || post.autor?.nombre || 'Usuario';
    const autorFoto = post.autorFoto || post.autor?.avatar || 
      `https://ui-avatars.com/api/?name=${encodeURIComponent(autorNombre)}&background=0d6855&color=fff`;
    const autorTipo = post.autorTipo || post.autor?.rol || 'Músico';
    const autorVerificado = post.autorVerificado || false;
    const likes = post.totalLikes ?? post.likes ?? 0;
    const comentarios = post.totalComentarios ?? post.comentarios ?? 0;
    const dioLike = post.dioLike || post.liked || false;
    const texto = post.texto || '';
    
    // Formateo de fecha
    let tiempoTexto = 'Hace un momento';
    if (post.fechaPublicacion) {
      const fecha = new Date(post.fechaPublicacion);
      if (!isNaN(fecha.getTime())) {
        tiempoTexto = fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      }
    }

    // Multimedia clasificada limpiamente
    let mediaHtml = '';
    const multimediaList = post.multimedia || (post.imagenes ? post.imagenes.map(u => ({ tipo: 'FOTO', url: u })) : []);

    if (multimediaList && multimediaList.length > 0) {
      // Resuelve el tipo real de cada item (URL tiene prioridad sobre la BD)
      const resolverTipo = (m) => {
        const u = (m.url || '').toLowerCase().split('?')[0];
        if (u.match(/\.(mp3|wav|ogg|m4a|aac|flac)$/i)) return 'AUDIO';
        if (u.match(/\.(mp4|webm|mov|mkv|avi)$/i)) return 'VIDEO';
        const t = (m.tipo || '').toUpperCase();
        if (t === 'AUDIO') return 'AUDIO';
        if (t === 'VIDEO') return 'VIDEO';
        return 'FOTO';
      };

      // Generar un slide por cada item multimedia
      const slides = multimediaList.map((m, idx) => {
        const fullUrl = this.formatMediaUrl(m.url);
        const tipo = resolverTipo(m);

        if (tipo === 'AUDIO') {
          let rawName = m.descripcion;
          if (!rawName) {
            const urlPart = (m.url || '').split('/').pop().split('?')[0];
            rawName = urlPart.replace(/^\d+_[a-z0-9]+\./i, '').replace(/\.[^.]+$/, '') || 'Pista de audio';
          }
          const trackTitle = rawName.replace(/\.[^.]+$/, '').replace(/_/g, ' ');
          return `
            <div class="carousel-slide" data-idx="${idx}">
              <div class="post-audio-whatsapp-card">
                <button class="wa-audio-play-btn" type="button" aria-label="Reproducir audio">
                  <svg class="wa-icon-play" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  <svg class="wa-icon-pause" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style="display:none"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                </button>
                <div class="wa-audio-body">
                  <div class="wa-audio-top">
                    <span class="wa-audio-title">${trackTitle}</span>
                    <span class="wa-audio-timer">00:00</span>
                  </div>
                  <div class="wa-audio-seek-container">
                    <div class="wa-audio-seek-track">
                      <div class="wa-audio-seek-fill" style="width: 0%"></div>
                    </div>
                    <input type="range" class="wa-audio-slider" min="0" max="100" value="0" step="0.1" aria-label="Progreso de reproducción" />
                  </div>
                </div>
                <audio src="${fullUrl}" class="post-audio-element" preload="metadata"></audio>
              </div>
            </div>
          `;
        }

        if (tipo === 'VIDEO') {
          return `
            <div class="carousel-slide" data-idx="${idx}">
              <div class="carousel-video-wrap">
                <video src="${fullUrl}" controls class="carousel-video" preload="metadata"></video>
              </div>
            </div>
          `;
        }

        // FOTO
        return `
          <div class="carousel-slide" data-idx="${idx}">
            <div class="carousel-img-wrap">
              <img src="${fullUrl}" alt="${m.descripcion || 'Foto'}" loading="lazy" class="carousel-img" />
            </div>
          </div>
        `;
      });

      const totalSlides = slides.length;
      const carouselId = `carousel-${id}`;

      const arrowsHtml = totalSlides > 1 ? `
        <button class="carousel-arrow carousel-prev" data-carousel="${carouselId}" aria-label="Anterior">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button class="carousel-arrow carousel-next" data-carousel="${carouselId}" aria-label="Siguiente">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      ` : '';

      const dotsHtml = totalSlides > 1 ? `
        <div class="carousel-dots">
          ${slides.map((_, i) => `<span class="carousel-dot ${i === 0 ? 'active' : ''}" data-carousel="${carouselId}" data-dot="${i}"></span>`).join('')}
        </div>
      ` : '';

      const counterHtml = totalSlides > 1 ? `<div class="carousel-counter" id="${carouselId}-counter">1 / ${totalSlides}</div>` : '';

      mediaHtml = `
        <div class="post-carousel" id="${carouselId}" data-current="0" data-total="${totalSlides}">
          <div class="carousel-track">
            ${slides.join('')}
          </div>
          ${arrowsHtml}
          ${counterHtml}
          ${dotsHtml}
        </div>
      `;
    }

    const verificadoBadge = autorVerificado
      ? `<svg class="verified-icon" width="14" height="14" viewBox="0 0 24 24" fill="#0d6855"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
      : '';

    return `
      <article class="post-card" data-post-id="${id}" id="post-${id}">
        <div class="post-header">
          <div class="post-author">
            <div class="post-avatar-wrap">
              <img src="${autorFoto}" alt="${autorNombre}" class="post-avatar-img" />
              <span class="post-avatar-status"></span>
            </div>
            <div class="post-author-info">
              <div class="post-author-name">
                ${autorNombre}
                ${verificadoBadge}
                <span class="post-role-tag">${autorTipo}</span>
              </div>
              <div class="post-meta">
                <span class="post-time">${tiempoTexto}</span>
                <span class="post-dot">·</span>
                <span class="post-audience">🌍</span>
              </div>
            </div>
          </div>
        </div>

        ${texto ? `<p class="post-text">${texto}</p>` : ''}
        ${mediaHtml}

        <div class="post-footer">
          <div class="post-reactions">
            <button class="post-action-btn like-btn ${dioLike ? 'liked' : ''}" data-post-id="${id}" id="like-${id}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="${dioLike ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              <span id="likes-count-${id}">${likes}</span>
            </button>
            <button class="post-action-btn comment-btn" data-post-id="${id}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <span id="comments-count-${id}">${comentarios}</span>
            </button>
            <button class="post-action-btn share-btn" data-post-id="${id}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              <span>Compartir</span>
            </button>
          </div>
        </div>

        <!-- SECCIÓN DE COMENTARIOS PROFESIONAL ESTILO BURBUJA -->
        <div class="post-comments-section" id="comments-section-${id}" style="display:none">
          <div class="comment-input-row">
            <input type="text" placeholder="Escribe un comentario..." class="comment-input" id="comment-input-${id}" />
            <button class="btn-comment-send" data-post-id="${id}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
          <div class="comments-list" id="comments-list-${id}">
            <div class="comments-loading">Cargando comentarios...</div>
          </div>
        </div>
      </article>
    `;
  },

  // ─────────────────────────────────────────────
  // CARGAR PUBLICACIONES DESDE LA API
  // ─────────────────────────────────────────────
  async loadFeed(container) {
    const postsList = container.querySelector('#posts-list');
    if (!postsList) return;

    const { posts } = await feedService.getPosts({ page: this._page, pageSize: 10 });
    this._posts = posts;

    if (!posts || posts.length === 0) {
      postsList.innerHTML = `
        <div class="empty-feed-state">
          <div class="empty-feed-icon">🎵</div>
          <h3>No hay publicaciones aún</h3>
          <p>¡Sé el primero en compartir fotos, videos o música con la comunidad!</p>
        </div>
      `;
      return;
    }

    postsList.innerHTML = posts.map(p => this.renderPost(p)).join('');
    this.bindPostEvents(container);
  },

  // ─────────────────────────────────────────────
  // CARGAR SIDEBARS
  // ─────────────────────────────────────────────
  async loadSidebars(container) {
    const oppList = container.querySelector('#oportunidades-list');
    const oportunidades = await feedService.getOportunidadesSidebar();
    if (oppList) {
      oppList.innerHTML = (!oportunidades || oportunidades.length === 0)
        ? `<p class="empty-sidebar-msg">No hay ofertas activas.</p>`
        : oportunidades.slice(0, 3).map(o => `
          <div class="sidebar-opp-item">
            <div class="opp-item-info">
              <p class="opp-item-title">${o.titulo}</p>
              <small class="opp-item-sub">${o.artistaNombre || 'Contratante'} · <span class="opp-item-pay">${o.tarifaAproximada ? '$' + o.tarifaAproximada : 'A convenir'}</span></small>
            </div>
            <a href="#/contrataciones" class="widget-link">Ver</a>
          </div>
        `).join('');
    }

    const evList = container.querySelector('#eventos-sidebar-list');
    const eventos = await feedService.getEventosSidebar();
    if (evList) {
      evList.innerHTML = (!eventos || eventos.length === 0)
        ? `<p class="empty-sidebar-msg">No hay eventos próximos.</p>`
        : eventos.slice(0, 2).map(e => {
          const d = new Date(e.fechaEvento || Date.now());
          const dia = isNaN(d.getDate()) ? '15' : d.getDate();
          const mes = isNaN(d.getTime()) ? 'DIC' : d.toLocaleString('es-ES', { month: 'short' }).toUpperCase();
          return `
            <div class="sidebar-event-item">
              <div class="event-date-badge">
                <span class="ev-dia">${dia}</span>
                <span class="ev-mes">${mes}</span>
              </div>
              <div class="event-item-info">
                <p class="event-item-title">${e.titulo}</p>
                <small class="event-item-place">📍 ${e.ubicacion || 'Managua'}</small>
              </div>
            </div>
          `;
        }).join('');
    }

    const sugList = container.querySelector('#sugeridos-list');
    const artistas = await feedService.getMusicosSugeridosSidebar();
    if (sugList) {
      sugList.innerHTML = (!artistas || artistas.length === 0)
        ? `<p class="empty-sidebar-msg">No hay artistas destacados.</p>`
        : artistas.slice(0, 3).map(a => {
          const avt = a.fotoPerfilUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(a.nombre)}&background=0d6855&color=fff`;
          return `
            <div class="sidebar-user-item">
              <img src="${avt}" alt="${a.nombre}" class="sidebar-user-avatar" />
              <div class="sidebar-user-info">
                <p class="sidebar-user-name">${a.nombre}</p>
                <small class="sidebar-user-role">${a.generoMusical || a.tipoPerfil || 'Músico'}</small>
              </div>
              <a href="#/" class="btn-seguir">Ver Perfil</a>
            </div>
          `;
        }).join('');
    }
  },

  // ─────────────────────────────────────────────
  // GESTIÓN DE VISTA PREVIA DE ARCHIVOS
  // ─────────────────────────────────────────────
  renderSelectedFilesPreview(container) {
    const dropArea = container.querySelector('#fb-drop-area');
    const previewsGrid = container.querySelector('#fb-previews-grid');
    const addMoreRow = container.querySelector('#fb-add-more-row');
    const modalSubmit = container.querySelector('#btn-fb-submit');
    const textarea = container.querySelector('#fb-modal-textarea');

    if (this._selectedFiles.length === 0) {
      dropArea.style.display = 'block';
      previewsGrid.style.display = 'none';
      previewsGrid.innerHTML = '';
      addMoreRow.style.display = 'none';
      modalSubmit.disabled = textarea.value.trim().length === 0;
      return;
    }

    dropArea.style.display = 'none';
    previewsGrid.style.display = 'grid';
    addMoreRow.style.display = 'flex';
    modalSubmit.disabled = false;

    // Clase según cantidad
    const count = this._selectedFiles.length;
    previewsGrid.className = `fb-previews-grid fb-grid-count-${Math.min(count, 4)}`;

    previewsGrid.innerHTML = this._selectedFiles.map((file, idx) => {
      const objUrl = URL.createObjectURL(file);
      const isVideo = file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov|mkv)$/i);
      const isAudio = file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|ogg|m4a|aac|flac)$/i);

      if (isAudio) {
        return `
          <div class="fb-preview-tile fb-preview-audio-tile" data-idx="${idx}">
            <button class="fb-remove-tile-btn" data-idx="${idx}" title="Eliminar archivo">✕</button>
            <div class="fb-audio-preview-content">
              <div class="fb-audio-badge">🎵 AUDIO / MÚSICA</div>
              <p class="fb-audio-file-title">${file.name}</p>
              <audio src="${objUrl}" controls class="fb-audio-preview-player"></audio>
            </div>
          </div>
        `;
      }

      return `
        <div class="fb-preview-tile" data-idx="${idx}">
          <button class="fb-remove-tile-btn" data-idx="${idx}" title="Eliminar archivo">✕</button>
          ${isVideo ? `
            <video src="${objUrl}" class="fb-preview-media" muted controls></video>
            <span class="fb-video-tag">🎬 Video</span>
          ` : `
            <img src="${objUrl}" alt="${file.name}" class="fb-preview-media" />
          `}
        </div>
      `;
    }).join('');

    // Eventos para eliminar archivos individuales
    previewsGrid.querySelectorAll('.fb-remove-tile-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const removeIdx = parseInt(btn.dataset.idx, 10);
        this._selectedFiles.splice(removeIdx, 1);
        this.renderSelectedFilesPreview(container);
      });
    });
  },

  // ─────────────────────────────────────────────
  // EVENTOS DEL MODAL Y COMPOSER ESTILO FACEBOOK
  // ─────────────────────────────────────────────
  attachEvents(container) {
    const isAuth = authService.isAuthenticated();

    // Cambiar foto de portada/fondo del perfil
    const btnChangeBanner = container.querySelector('#btn-change-profile-banner');
    const inputBannerFile = container.querySelector('#profile-banner-file-input');
    const bannerEl = container.querySelector('#profile-banner-el');

    btnChangeBanner?.addEventListener('click', (e) => {
      e.stopPropagation();
      inputBannerFile.click();
    });

    inputBannerFile?.addEventListener('change', async (e) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        btnChangeBanner.textContent = '⏳';
        try {
          const { storageService } = await import('../../services/storageService.js');
          const res = await storageService.uploadFile(file);
          if (res && res.url) {
            localStorage.setItem('profile_banner_bg', res.url);
            bannerEl.style.backgroundImage = `url('${res.url}')`;
            btnChangeBanner.textContent = '📷';
          }
        } catch (err) {
          alert('Error al subir imagen de portada: ' + (err.message || 'Intente nuevamente'));
          btnChangeBanner.textContent = '📷';
        }
      }
    });
    const modalOverlay = container.querySelector('#fb-modal-overlay');
    const mediaContainer = container.querySelector('#fb-media-container');
    const fileInput = container.querySelector('#fb-file-input');
    const dropArea = container.querySelector('#fb-drop-area');
    const textarea = container.querySelector('#fb-modal-textarea');
    const modalSubmit = container.querySelector('#btn-fb-submit');

    const openModal = (autoOpenMedia = false) => {
      if (!isAuth) {
        AuthModal.show('¡Únete a Misostenido!', 'Debes iniciar sesión para publicar en el feed.');
        return;
      }
      modalOverlay.style.display = 'flex';
      if (autoOpenMedia) {
        mediaContainer.style.display = 'block';
      }
      textarea.focus();
    };

    const closeModal = () => {
      modalOverlay.style.display = 'none';
      this._selectedFiles = [];
      textarea.value = '';
      mediaContainer.style.display = 'none';
      this.renderSelectedFilesPreview(container);
    };

    // Triggers en el Feed
    container.querySelector('#fb-composer-trigger')?.addEventListener('click', () => openModal(false));
    container.querySelector('#btn-quick-photo')?.addEventListener('click', (e) => {
      e.stopPropagation();
      openModal(true);
    });
    container.querySelector('#btn-quick-live')?.addEventListener('click', (e) => {
      e.stopPropagation();
      openModal(false);
    });
    container.querySelector('#btn-quick-feeling')?.addEventListener('click', (e) => {
      e.stopPropagation();
      openModal(false);
    });

    // Cerrar modal
    container.querySelector('#fb-modal-close')?.addEventListener('click', closeModal);
    modalOverlay?.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

    // Botón verde (foto/video) dentro del modal para abrir dropzone
    container.querySelector('#btn-tool-photo')?.addEventListener('click', () => {
      mediaContainer.style.display = 'block';
      fileInput.click();
    });

    // Botón de audio/música también abre el mismo selector (acepta image/*,video/*,audio/*)
    container.querySelector('.fb-tool-audio')?.addEventListener('click', () => {
      mediaContainer.style.display = 'block';
      fileInput.click();
    });

    // Botón cerrar zona de drop
    container.querySelector('#fb-close-media-zone')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this._selectedFiles = [];
      mediaContainer.style.display = 'none';
      this.renderSelectedFilesPreview(container);
    });

    // Click en la zona de drop abre el selector de archivos
    dropArea?.addEventListener('click', () => {
      fileInput.click();
    });

    // Botón "Agregar más fotos o videos"
    container.querySelector('#btn-fb-add-more')?.addEventListener('click', () => {
      fileInput.click();
    });

    // Manejar archivos seleccionados desde el input file
    fileInput?.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        for (let i = 0; i < e.target.files.length; i++) {
          this._selectedFiles.push(e.target.files[i]);
        }
        mediaContainer.style.display = 'block';
        this.renderSelectedFilesPreview(container);
      }
      fileInput.value = ''; // Limpiar para permitir re-selección
    });

    // Drag and drop en la zona
    dropArea?.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropArea.classList.add('fb-drag-active');
    });

    dropArea?.addEventListener('dragleave', () => {
      dropArea.classList.remove('fb-drag-active');
    });

    dropArea?.addEventListener('drop', (e) => {
      e.preventDefault();
      dropArea.classList.remove('fb-drag-active');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        for (let i = 0; i < e.dataTransfer.files.length; i++) {
          this._selectedFiles.push(e.dataTransfer.files[i]);
        }
        mediaContainer.style.display = 'block';
        this.renderSelectedFilesPreview(container);
      }
    });

    // Textarea input para activar/desactivar botón Publicar
    textarea?.addEventListener('input', () => {
      const hasText = textarea.value.trim().length > 0;
      const hasFiles = this._selectedFiles.length > 0;
      modalSubmit.disabled = !hasText && !hasFiles;
    });

    // PUBLICAR AL BACKEND (SUBIDA DE ARCHIVOS + CREAR POST + ASOCIAR MEDIA)
    modalSubmit?.addEventListener('click', async () => {
      let texto = textarea.value.trim();
      const filesToUpload = [...this._selectedFiles];

      if (!texto && filesToUpload.length === 0) return;

      // Si no escribió texto pero subió archivos, poner un texto descriptivo por defecto para que la BD no dé error
      if (!texto && filesToUpload.length > 0) {
        const firstFile = filesToUpload[0];
        if (firstFile.type.startsWith('audio/') || firstFile.name.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) {
          texto = `🎵 ${firstFile.name.replace(/\.[^/.]+$/, '')}`;
        } else if (firstFile.type.startsWith('video/')) {
          texto = `🎬 Video`;
        } else {
          texto = `📸 Foto`;
        }
      }

      modalSubmit.disabled = true;
      modalSubmit.innerHTML = `
        <svg class="fb-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
        <span>Publicando...</span>
      `;

      try {
        await feedService.crearPublicacion({
          texto,
          files: filesToUpload
        });

        // Cerrar modal y limpiar
        closeModal();

        // Recargar el feed real
        await this.loadFeed(container);
      } catch (err) {
        if (err.status === 401 || (err.message && (err.message.includes('401') || err.message.includes('Unauthorized')))) {
          AuthModal.show(
            'Sesión Expirada',
            'Tu sesión ha expirado o el servidor se reinició. Por favor inicia sesión nuevamente para renovar tu acceso.'
          );
        } else {
          alert('Error al publicar: ' + (err.message || 'Verifica la conexión con el backend'));
        }
      } finally {
        modalSubmit.disabled = false;
        modalSubmit.textContent = 'Publicar';
      }
    });
  },

  // ─────────────────────────────────────────────
  // EVENTOS DE CADA POST (LIKES, COMENTARIOS, COMPARTIR)
  // ─────────────────────────────────────────────
  bindPostEvents(container) {
    const isAuth = authService.isAuthenticated();

    // ─── 0. CARRUSEL TIPO INSTAGRAM ───
    const goToSlide = (carousel, newIdx) => {
      const total = parseInt(carousel.dataset.total, 10);
      if (newIdx < 0 || newIdx >= total) return;
      carousel.dataset.current = newIdx;

      // Mover el track (translate)
      const track = carousel.querySelector('.carousel-track');
      if (track) track.style.transform = `translateX(-${newIdx * 100}%)`;

      // Actualizar counter (ej: "2 / 4")
      const counter = container.querySelector(`#${carousel.id}-counter`);
      if (counter) counter.textContent = `${newIdx + 1} / ${total}`;

      // Actualizar dots
      carousel.querySelectorAll('.carousel-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === newIdx);
      });

      // Actualizar visibilidad de flechas
      const prev = carousel.querySelector('.carousel-prev');
      const next = carousel.querySelector('.carousel-next');
      if (prev) prev.style.opacity = newIdx === 0 ? '0.35' : '1';
      if (next) next.style.opacity = newIdx === total - 1 ? '0.35' : '1';
    };

    // Flechas
    container.querySelectorAll('.carousel-arrow').forEach(btn => {
      if (btn.dataset.bound === 'true') return;
      btn.dataset.bound = 'true';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const carouselId = btn.dataset.carousel;
        const carousel = container.querySelector(`#${carouselId}`);
        if (!carousel) return;
        const current = parseInt(carousel.dataset.current, 10);
        const delta = btn.classList.contains('carousel-next') ? 1 : -1;
        goToSlide(carousel, current + delta);
      });
    });

    // Dots
    container.querySelectorAll('.carousel-dot').forEach(dot => {
      if (dot.dataset.bound === 'true') return;
      dot.dataset.bound = 'true';
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        const carouselId = dot.dataset.carousel;
        const carousel = container.querySelector(`#${carouselId}`);
        if (!carousel) return;
        goToSlide(carousel, parseInt(dot.dataset.dot, 10));
      });
    });

    // Touch / Swipe en móvil
    container.querySelectorAll('.post-carousel').forEach(carousel => {
      if (carousel.dataset.swipeBound === 'true') return;
      carousel.dataset.swipeBound = 'true';
      let startX = 0;
      carousel.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
      carousel.addEventListener('touchend', e => {
        const diff = startX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) {
          const current = parseInt(carousel.dataset.current, 10);
          goToSlide(carousel, diff > 0 ? current + 1 : current - 1);
        }
      });
    });

    // ─── AUDIOS ESTILO WHATSAPP DE REPRODUCCIÓN INTERACTIVA ───
    container.querySelectorAll('.post-audio-whatsapp-card').forEach(card => {
      if (card.dataset.bound === 'true') return;
      card.dataset.bound = 'true';

      const audio = card.querySelector('.post-audio-element');
      const playBtn = card.querySelector('.wa-audio-play-btn');
      const iconPlay = card.querySelector('.wa-icon-play');
      const iconPause = card.querySelector('.wa-icon-pause');
      const timer = card.querySelector('.wa-audio-timer');
      const slider = card.querySelector('.wa-audio-slider');
      const fill = card.querySelector('.wa-audio-seek-fill');

      if (!audio || !playBtn) return;

      const formatTime = (seconds) => {
        if (isNaN(seconds) || seconds < 0) return '00:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      };

      audio.addEventListener('loadedmetadata', () => {
        if (audio.duration && !isNaN(audio.duration)) {
          timer.textContent = formatTime(audio.duration);
        }
      });

      audio.addEventListener('timeupdate', () => {
        if (!audio.duration) return;
        const pct = (audio.currentTime / audio.duration) * 100;
        if (slider) slider.value = pct;
        if (fill) fill.style.width = `${pct}%`;
        if (timer) {
          timer.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
        }
      });

      playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Pausar todos los otros reproductores activos en la página (estilo WhatsApp)
        document.querySelectorAll('audio.post-audio-element').forEach(a => {
          if (a !== audio && !a.paused) {
            a.pause();
          }
        });

        if (audio.paused) {
          audio.play().then(() => {
            if (iconPlay) iconPlay.style.display = 'none';
            if (iconPause) iconPause.style.display = 'block';
            card.classList.add('playing');
          }).catch(err => console.warn('[AudioPlayer] Error al reproducir audio:', err));
        } else {
          audio.pause();
          if (iconPlay) iconPlay.style.display = 'block';
          if (iconPause) iconPause.style.display = 'none';
          card.classList.remove('playing');
        }
      });

      audio.addEventListener('pause', () => {
        if (iconPlay) iconPlay.style.display = 'block';
        if (iconPause) iconPause.style.display = 'none';
        card.classList.remove('playing');
      });

      audio.addEventListener('ended', () => {
        if (iconPlay) iconPlay.style.display = 'block';
        if (iconPause) iconPause.style.display = 'none';
        card.classList.remove('playing');
        if (slider) slider.value = 0;
        if (fill) fill.style.width = '0%';
        if (audio.duration && timer) timer.textContent = formatTime(audio.duration);
      });

      slider?.addEventListener('input', (e) => {
        e.stopPropagation();
        if (!audio.duration) return;
        const seekTime = (parseFloat(e.target.value) / 100) * audio.duration;
        audio.currentTime = seekTime;
        if (fill) fill.style.width = `${e.target.value}%`;
      });
    });

    // 1. Dar / Quitar Like real
    container.querySelectorAll('.like-btn').forEach(btn => {
      if (btn.dataset.bound === 'true') return;
      btn.dataset.bound = 'true';

      btn.addEventListener('click', async () => {
        if (!isAuth) {
          AuthModal.show('¡Únete a la comunidad!', 'Debes iniciar sesión para dar like.');
          return;
        }

        const idPost = btn.dataset.postId;
        const isLiked = btn.classList.contains('liked');
        const countSpan = container.querySelector(`#likes-count-${idPost}`);
        const currentCount = parseInt(countSpan?.textContent || '0', 10);

        btn.classList.toggle('liked');
        if (countSpan) countSpan.textContent = isLiked ? Math.max(0, currentCount - 1) : currentCount + 1;

        try {
          const res = await feedService.toggleLike(idPost);
          if (res?.totalLikes !== undefined && countSpan) {
            countSpan.textContent = res.totalLikes;
          }
        } catch (err) {
          btn.classList.toggle('liked');
          if (countSpan) countSpan.textContent = currentCount;
          console.error('[FeedPage] Error en toggleLike:', err);
        }
      });
    });

    // 2. Toggle Comentarios y Carga real
    container.querySelectorAll('.comment-btn').forEach(btn => {
      if (btn.dataset.bound === 'true') return;
      btn.dataset.bound = 'true';

      btn.addEventListener('click', async () => {
        const idPost = btn.dataset.postId;
        const section = container.querySelector(`#comments-section-${idPost}`);
        if (!section) return;

        const isVisible = section.style.display !== 'none';
        section.style.display = isVisible ? 'none' : 'block';

        if (!isVisible) {
          const listEl = container.querySelector(`#comments-list-${idPost}`);
          listEl.innerHTML = '<div class="comments-loading">Cargando comentarios...</div>';

          const renderCommentsHtml = (list) => {
            if (!list || list.length === 0) {
              return '<p class="no-comments">No hay comentarios aún. ¡Sé el primero en opinar!</p>';
            }
            return list.map(c => {
              const uFoto = c.usuarioFoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.usuarioNombre || 'U')}&background=0d6855&color=fff`;
              const tiempo = c.fecha ? new Date(c.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'Hace un momento';
              return `
                <div class="fb-comment-item">
                  <img src="${uFoto}" alt="${c.usuarioNombre}" class="fb-comment-avatar" />
                  <div class="fb-comment-bubble-wrap">
                    <div class="fb-comment-bubble">
                      <div class="fb-comment-author-row">
                        <strong class="fb-comment-author-name">${c.usuarioNombre || 'Usuario'}</strong>
                        ${c.tipoPerfil ? `<span class="fb-comment-role-badge">${c.tipoPerfil}</span>` : ''}
                      </div>
                      <p class="fb-comment-text">${c.texto}</p>
                    </div>
                    <div class="fb-comment-meta-row">
                      <button class="fb-comment-action-link">Me gusta</button>
                      <span class="fb-comment-dot">·</span>
                      <button class="fb-comment-action-link">Responder</button>
                      <span class="fb-comment-dot">·</span>
                      <span class="fb-comment-time">${tiempo}</span>
                    </div>
                  </div>
                </div>
              `;
            }).join('');
          };

          const comentarios = await feedService.getComentarios(idPost);
          listEl.innerHTML = renderCommentsHtml(comentarios);
        }
      });
    });

    // 3. Enviar Comentario real
    container.querySelectorAll('.btn-comment-send').forEach(btn => {
      if (btn.dataset.bound === 'true') return;
      btn.dataset.bound = 'true';

      btn.addEventListener('click', async () => {
        if (!isAuth) {
          AuthModal.show('¡Únete a la comunidad!', 'Debes iniciar sesión para comentar.');
          return;
        }

        const idPost = btn.dataset.postId;
        const input = container.querySelector(`#comment-input-${idPost}`);
        const texto = input?.value?.trim();
        if (!texto) return;

        try {
          await feedService.comentar(idPost, texto);
          input.value = '';

          const countSpan = container.querySelector(`#comments-count-${idPost}`);
          if (countSpan) {
            const current = parseInt(countSpan.textContent || '0', 10);
            countSpan.textContent = current + 1;
          }

          const listEl = container.querySelector(`#comments-list-${idPost}`);
          const comentarios = await feedService.getComentarios(idPost);
          listEl.innerHTML = comentarios.map(c => {
            const uFoto = c.usuarioFoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.usuarioNombre || 'U')}&background=0d6855&color=fff`;
            const tiempo = c.fecha ? new Date(c.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'Ahora';
            return `
              <div class="fb-comment-item">
                <img src="${uFoto}" alt="${c.usuarioNombre}" class="fb-comment-avatar" />
                <div class="fb-comment-bubble-wrap">
                  <div class="fb-comment-bubble">
                    <div class="fb-comment-author-row">
                      <strong class="fb-comment-author-name">${c.usuarioNombre || 'Usuario'}</strong>
                      ${c.tipoPerfil ? `<span class="fb-comment-role-badge">${c.tipoPerfil}</span>` : ''}
                    </div>
                    <p class="fb-comment-text">${c.texto}</p>
                  </div>
                  <div class="fb-comment-meta-row">
                    <button class="fb-comment-action-link">Me gusta</button>
                    <span class="fb-comment-dot">·</span>
                    <button class="fb-comment-action-link">Responder</button>
                    <span class="fb-comment-dot">·</span>
                    <span class="fb-comment-time">${tiempo}</span>
                  </div>
                </div>
              </div>
            `;
          }).join('');
        } catch (err) {
          alert('Error al enviar comentario: ' + (err.message || 'Error del servidor'));
        }
      });
    });

    // 4. Compartir
    container.querySelectorAll('.share-btn').forEach(btn => {
      if (btn.dataset.bound === 'true') return;
      btn.dataset.bound = 'true';

      btn.addEventListener('click', () => {
        navigator.clipboard?.writeText(window.location.href);
        alert('🔗 ¡Enlace copiado al portapapeles!');
      });
    });
  }
};
