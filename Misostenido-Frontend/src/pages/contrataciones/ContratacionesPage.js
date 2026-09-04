/**
 * ContratacionesPage.js — Sección de Oportunidades y Contrataciones Musicales
 * Diseñado fiel a la interfaz premium con búsqueda, filtros, reproductor de audio demo,
 * y modal de creación conectado a la API y Supabase Storage.
 */
import { authService } from '../../services/authService.js';
import { contratacionService } from '../../services/contratacionService.js';
import { storageService } from '../../services/storageService.js';
import { AuthModal } from '../../components/modal/AuthModal.js';
import { api } from '../../services/api.js';

export const ContratacionesPage = {
  _activeTab: 'ofertas', // 'ofertas' | 'solicitudes'
  _ofertas: [],
  _solicitudes: [],
  _selectedFiles: [],
  _filtros: {
    busqueda: '',
    generoMusical: '',
    ubicacion: '',
    tarifaMax: null,
    soloVerificados: false,
    tipoFormacion: ''
  },
  _container: null,

  render() {
    const user = authService.getCurrentUser() || {};
    const avatarSrc = user.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'Usuario')}&background=0d6855&color=fff`;

    const savedHeroBg = localStorage.getItem('contrataciones_hero_bg') || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1600&q=80';
    const heroBgStyle = `background: linear-gradient(135deg, rgba(13, 104, 85, 0.88) 0%, rgba(8, 76, 62, 0.92) 100%), url('${savedHeroBg}') center/cover no-repeat;`;

    const container = document.createElement('div');
    container.className = 'contrataciones-page animate-fade';
    this._container = container;
    this._selectedFiles = [];

    container.innerHTML = `
      <!-- ================= HERO HEADER ================= -->
      <section class="contrataciones-hero" id="contrataciones-hero" style="${heroBgStyle}">
        <button class="btn-change-hero-bg" id="btn-change-hero-bg" title="Cambiar foto de fondo del encabezado">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          <span>📷 Cambiar Foto de Fondo</span>
        </button>
        <input type="file" id="hero-bg-file-input" accept="image/*" style="display:none" />

        <div class="hero-content">
          <h1 class="hero-title">Encuentra el Talento Musical Perfecto para tu Evento</h1>
          <p class="hero-subtitle">Conecta con los mejores músicos, bandas, mariachis y DJs de Nicaragua y Latinoamérica.</p>
          
          <!-- BUSCADOR PRINCIPAL -->
          <div class="hero-search-box">
            <div class="search-field search-text">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" id="hero-input-search" placeholder="Buscar por nombre, banda o instrumento..." value="${this._filtros.busqueda}" />
            </div>

            <div class="search-divider"></div>

            <div class="search-field search-select">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
              <select id="hero-select-genero">
                <option value="">Todos los Géneros</option>
                <option value="Rock">Rock / Pop</option>
                <option value="Jazz">Jazz & Bossa Nova</option>
                <option value="Clásica">Música Clásica</option>
                <option value="Cumbia">Cumbia & Latina</option>
                <option value="Salsa">Salsa & Merengue</option>
                <option value="Electrónica">DJ / Electrónica</option>
                <option value="Mariachi">Mariachi & Rancheras</option>
                <option value="Acústico">Acústico / Trova</option>
              </select>
            </div>

            <div class="search-divider"></div>

            <div class="search-field search-select">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
              <select id="hero-select-ubicacion">
                <option value="">Todas las Ciudades</option>
                <option value="Managua">Managua</option>
                <option value="León">León</option>
                <option value="Granada">Granada</option>
                <option value="Estelí">Estelí</option>
                <option value="Matagalpa">Matagalpa</option>
                <option value="Rivas">Rivas / San Juan del Sur</option>
              </select>
            </div>

            <button class="btn-hero-search" id="btn-hero-search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <span>Buscar Talento</span>
            </button>
          </div>
        </div>
      </section>

      <!-- ================= BARRA DE TABS Y NAVEGACIÓN ================= -->
      <section class="contrataciones-main-container">
        <div class="contrataciones-top-bar">
          <div class="tabs-switcher">
            <button class="tab-btn ${this._activeTab === 'ofertas' ? 'active' : ''}" id="tab-ofertas">
              <span>Ofertas de Servicios Musicales</span>
              <span class="tab-badge" id="badge-count-ofertas">0</span>
            </button>
            <button class="tab-btn ${this._activeTab === 'solicitudes' ? 'active' : ''}" id="tab-solicitudes">
              <span>Solicitudes de Eventos</span>
              <span class="tab-badge secondary" id="badge-count-solicitudes">0</span>
            </button>
          </div>

          <button class="btn-create-gai" id="btn-open-create-modal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>+ Publicar Servicio o Empleo</span>
          </button>
        </div>

        <!-- ================= LAYOUT 2 COLUMNAS (FILTROS + GRID) ================= -->
        <div class="contrataciones-layout">

          <!-- SIDEBAR DE FILTROS -->
          <aside class="contrataciones-sidebar">
            <div class="filter-card">
              <h3 class="filter-title">Filtros de Búsqueda</h3>

              <!-- Rango de tarifa -->
              <div class="filter-group">
                <div class="filter-label-row">
                  <label>Rango de Tarifa / Presupuesto</label>
                </div>
                <div class="price-range-inputs">
                  <span class="p-min">Min: $50</span>
                  <span class="p-max" id="lbl-max-price">Max: $2,000+</span>
                </div>
                <input type="range" class="price-slider" id="price-slider" min="50" max="2000" step="50" value="2000" />
              </div>

              <!-- Solo Verificados -->
              <div class="filter-group filter-toggle-row">
                <label for="toggle-verificados">Solo Artistas Verificados</label>
                <label class="switch-toggle">
                  <input type="checkbox" id="toggle-verificados" />
                  <span class="slider-round"></span>
                </label>
              </div>

              <!-- Géneros musicales -->
              <div class="filter-group">
                <label class="filter-label">Género Musical</label>
                <div class="checkbox-list">
                  <label class="custom-checkbox"><input type="checkbox" name="genero-chk" value="Rock" /> Rock</label>
                  <label class="custom-checkbox"><input type="checkbox" name="genero-chk" value="Jazz" /> Jazz</label>
                  <label class="custom-checkbox"><input type="checkbox" name="genero-chk" value="Clásica" /> Clásica</label>
                  <label class="custom-checkbox"><input type="checkbox" name="genero-chk" value="Pop" /> Pop</label>
                  <label class="custom-checkbox"><input type="checkbox" name="genero-chk" value="Cumbia" /> Cumbia</label>
                  <label class="custom-checkbox"><input type="checkbox" name="genero-chk" value="Salsa" /> Salsa</label>
                  <label class="custom-checkbox"><input type="checkbox" name="genero-chk" value="Electrónica" /> Electrónica</label>
                  <label class="custom-checkbox"><input type="checkbox" name="genero-chk" value="Mariachi" /> Mariachi</label>
                </div>
              </div>

              <!-- Tipo de formación -->
              <div class="filter-group">
                <label class="filter-label">Tipo de Formación</label>
                <div class="radio-list">
                  <label class="custom-radio"><input type="radio" name="formacion" value="" checked /> Todos</label>
                  <label class="custom-radio"><input type="radio" name="formacion" value="Solista" /> Solista</label>
                  <label class="custom-radio"><input type="radio" name="formacion" value="Dúo / Trío" /> Dúo / Trío</label>
                  <label class="custom-radio"><input type="radio" name="formacion" value="Banda Completa" /> Banda Completa</label>
                  <label class="custom-radio"><input type="radio" name="formacion" value="Orquesta" /> Orquesta</label>
                  <label class="custom-radio"><input type="radio" name="formacion" value="DJ / Productor" /> DJ / Productor</label>
                </div>
              </div>

              <!-- Incluye sonido -->
              <div class="filter-group filter-toggle-row">
                <label for="toggle-sonido">Incluye equipo de sonido y luces</label>
                <label class="switch-toggle">
                  <input type="checkbox" id="toggle-sonido" />
                  <span class="slider-round"></span>
                </label>
              </div>

            </div>
          </aside>

          <!-- SECCIÓN DE RESULTADOS -->
          <main class="contrataciones-results">
            <div class="results-header">
              <h2 class="results-count-title" id="results-count-title">Cargando contrataciones...</h2>
              <div class="sort-wrap">
                <span class="sort-label">Ordenar por:</span>
                <select id="select-sort" class="sort-select">
                  <option value="relevantes">Más relevantes</option>
                  <option value="precio-asc">Precio: Menor a Mayor</option>
                  <option value="precio-desc">Precio: Mayor a Menor</option>
                  <option value="recientes">Más recientes</option>
                </select>
              </div>
            </div>

            <!-- GRID DE TARJETAS -->
            <div class="gigs-grid" id="gigs-grid">
              <div class="grid-loading-skeleton">
                <div class="sk-gig-card"></div>
                <div class="sk-gig-card"></div>
                <div class="sk-gig-card"></div>
              </div>
            </div>
          </main>

        </div>
      </section>

      <!-- ==============================================================
           MODAL DE CREAR OFERTA / SOLICITUD DE EVENTO (CON SUBIDA A SUPABASE)
           ============================================================== -->
      <div class="modal-overlay" id="modal-create-gig" style="display:none">
        <div class="modal-card">
          <div class="modal-header">
            <h3>Publicar en Contrataciones</h3>
            <button class="btn-close-modal" id="btn-close-create-modal">✕</button>
          </div>

          <div class="modal-body">
            <!-- Selector de Tipo -->
            <div class="modal-type-tabs">
              <button class="type-tab active" id="tab-type-oferta" data-type="oferta">
                🎵 Ofrecer Servicio Musical (Soy Músico)
              </button>
              <button class="type-tab" id="tab-type-solicitud" data-type="solicitud">
                💼 Publicar Busqueda / Trabajo (Busco Músico)
              </button>
            </div>

            <form id="form-create-gig">
              <div class="form-group">
                <label>Título del anuncio *</label>
                <input type="text" id="gig-title" placeholder="Ej: Show Rock/Pop 80s y 90s En Vivo para Bodas y Eventos" required />
              </div>

              <div class="form-row-2">
                <div class="form-group">
                  <label id="lbl-cat">Género Musical / Estilo *</label>
                  <select id="gig-genre" required>
                    <option value="Rock">Rock / Pop</option>
                    <option value="Jazz">Jazz & Bossa Nova</option>
                    <option value="Clásica">Música Clásica</option>
                    <option value="Cumbia">Cumbia & Latina</option>
                    <option value="Salsa">Salsa & Merengue</option>
                    <option value="Electrónica">DJ / Electrónica</option>
                    <option value="Mariachi">Mariachi & Rancheras</option>
                    <option value="Acústico">Acústico / Trova</option>
                  </select>
                </div>

                <div class="form-group">
                  <label id="lbl-price">Tarifa por Hora / Presupuesto (USD) *</label>
                  <input type="number" id="gig-price" placeholder="Ej: 250" min="10" required />
                </div>
              </div>

              <div class="form-row-2">
                <div class="form-group">
                  <label>Ubicación / Ciudad *</label>
                  <input type="text" id="gig-location" placeholder="Ej: Managua, Nicaragua" required />
                </div>

                <div class="form-group" id="group-event-date" style="display:none">
                  <label>Fecha del Evento</label>
                  <input type="date" id="gig-event-date" />
                </div>
              </div>

              <div class="form-group">
                <label>Descripción detallada *</label>
                <textarea id="gig-description" rows="4" placeholder="Describe el repertorio, experiencia, equipo de sonido que incluyes y detalles importantes..." required></textarea>
              </div>

              <!-- CONTENEDOR DE SUBIDA SUPABASE (AUDIO, VIDEO, FOTOS) -->
              <div class="form-group">
                <label>Fotos, Video Promocional o Muestra de Audio (Demostración) 🎵</label>
                <div class="gig-dropzone" id="gig-dropzone">
                  <input type="file" id="gig-file-input" multiple accept="image/*,video/*,audio/*" style="display:none" />
                  <div class="dropzone-prompt">
                    <div class="dz-icon">📁</div>
                    <p><strong>Arrastra o haz clic para subir multimedia</strong></p>
                    <small>Admite fotos, videos y muestras de audio MP3/WAV a Supabase Storage</small>
                  </div>
                </div>
                <div class="gig-previews-list" id="gig-previews-list" style="display:none"></div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn-secondary" id="btn-cancel-create">Cancelar</button>
                <button type="submit" class="btn-primary" id="btn-submit-create">
                  Publicar en Contrataciones
                </button>
              </div>
            </form>

          </div>
        </div>
      </div>

      <!-- ==============================================================
           MODAL PARA SOLICITAR CONTRATACIÓN (ENVIAR MENSAJE / PROPUESTA)
           ============================================================== -->
      <div class="modal-overlay" id="modal-hire-request" style="display:none">
        <div class="modal-card">
          <div class="modal-header">
            <h3>Enviar Solicitud de Contratación</h3>
            <button class="btn-close-modal" id="btn-close-hire-modal">✕</button>
          </div>
          <div class="modal-body">
            <div class="hire-summary-card" id="hire-summary-card"></div>

            <form id="form-hire-request">
              <div class="form-group">
                <label>Tu Mensaje o Propuesta para el Músico *</label>
                <textarea id="hire-message" rows="5" placeholder="Hola, quisiera consultar tu disponibilidad para un evento el próximo sábado..." required></textarea>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn-secondary" id="btn-cancel-hire">Cancelar</button>
                <button type="submit" class="btn-primary" id="btn-submit-hire">
                  Enviar Solicitud Directa
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      this.attachEvents(container);
      this.loadContent(container);
    }, 0);

    return container;
  },

  formatMediaUrl(url) {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
      return url;
    }
    const backendOrigin = api.BASE_URL.replace('/api', '');
    return `${backendOrigin}${url.startsWith('/') ? '' : '/'}${url}`;
  },

  async loadContent(container) {
    if (this._activeTab === 'ofertas') {
      await this.loadOfertas(container);
    } else {
      await this.loadSolicitudes(container);
    }
  },

  // ─────────────────────────────────────────────
  // CARGAR OFERTAS REALES DESDE LA API .NET
  // ─────────────────────────────────────────────
  async loadOfertas(container) {
    const grid = container.querySelector('#gigs-grid');
    const titleLbl = container.querySelector('#results-count-title');
    const badgeOfertas = container.querySelector('#badge-count-ofertas');

    if (grid) grid.innerHTML = `<div class="grid-loading-skeleton"><div class="sk-gig-card"></div><div class="sk-gig-card"></div><div class="sk-gig-card"></div></div>`;

    const { ofertas } = await contratacionService.getOfertas({
      busqueda: this._filtros.busqueda,
      generoMusical: this._filtros.generoMusical,
      ubicacion: this._filtros.ubicacion,
      tarifaMax: this._filtros.tarifaMax
    });

    this._ofertas = ofertas || [];
    if (badgeOfertas) badgeOfertas.textContent = this._ofertas.length;

    if (this._ofertas.length === 0) {
      if (titleLbl) titleLbl.textContent = '0 Artistas e Ofertas encontradas';
      if (grid) {
        grid.innerHTML = `
          <div class="empty-gigs-card">
            <div class="empty-gigs-icon">🎵</div>
            <h3>No se encontraron ofertas con los filtros actuales</h3>
            <p>Sé el primero en ofrecer tus servicios musicales o limpia los filtros de búsqueda.</p>
            <button class="btn-create-gai mt-14" id="btn-empty-create-oferta">
              + Publicar Servicio Musical
            </button>
          </div>
        `;
        grid.querySelector('#btn-empty-create-oferta')?.addEventListener('click', () => {
          container.querySelector('#btn-open-create-modal')?.click();
        });
      }
      return;
    }

    if (titleLbl) titleLbl.textContent = `${this._ofertas.length} Ofertas de Servicios Musicales`;
    if (grid) grid.innerHTML = this._ofertas.map(o => this.renderOfertaCard(o)).join('');

    this.bindCardEvents(container);
  },

  // ─────────────────────────────────────────────
  // CARGAR SOLICITUDES REALES DESDE LA API .NET
  // ─────────────────────────────────────────────
  async loadSolicitudes(container) {
    const grid = container.querySelector('#gigs-grid');
    const titleLbl = container.querySelector('#results-count-title');
    const badgeSol = container.querySelector('#badge-count-solicitudes');

    if (grid) grid.innerHTML = `<div class="grid-loading-skeleton"><div class="sk-gig-card"></div><div class="sk-gig-card"></div></div>`;

    const { solicitudes } = await contratacionService.getSolicitudes({
      busqueda: this._filtros.busqueda,
      ubicacion: this._filtros.ubicacion
    });

    this._solicitudes = solicitudes || [];
    if (badgeSol) badgeSol.textContent = this._solicitudes.length;

    if (this._solicitudes.length === 0) {
      if (titleLbl) titleLbl.textContent = '0 Solicitudes de Eventos encontradas';
      if (grid) {
        grid.innerHTML = `
          <div class="empty-gigs-card">
            <div class="empty-gigs-icon">💼</div>
            <h3>No hay solicitudes de eventos registradas aún</h3>
            <p>Sé el primero en publicar una oportunidad de contratación de músicos para tu evento.</p>
            <button class="btn-create-gai mt-14" id="btn-empty-create-solicitud">
              + Publicar Solicitud de Evento
            </button>
          </div>
        `;
        grid.querySelector('#btn-empty-create-solicitud')?.addEventListener('click', () => {
          container.querySelector('#btn-open-create-modal')?.click();
        });
      }
      return;
    }

    if (titleLbl) titleLbl.textContent = `${this._solicitudes.length} Solicitudes de Eventos encontradas`;
    if (grid) grid.innerHTML = this._solicitudes.map(s => this.renderSolicitudCard(s)).join('');

    this.bindCardEvents(container);
  },

  // ─────────────────────────────────────────────
  // RENDERIZAR CARD DE OFERTA DE SERVICIO
  // ─────────────────────────────────────────────
  renderOfertaCard(o) {
    const id = o.idOfertaServicio || o.id;
    const genero = (o.generoMusical || 'JAZZ & BOSSA').toUpperCase();
    const verificado = o.artistaVerificado !== false;
    const avatar = o.fotoPerfilUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(o.artistaNombre || 'Artista')}&background=0d6855&color=fff`;
    const precio = o.tarifaAproximada ? `$${o.tarifaAproximada} / hora` : 'A convenir';

    // Imagen o Demo Media
    const mediaItem = (o.media && o.media.length > 0) ? o.media[0] : null;
    let coverSrc = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80';
    if (mediaItem && mediaItem.tipo === 'FOTO') {
      coverSrc = this.formatMediaUrl(mediaItem.url);
    }

    const audioMedia = (o.media || []).find(m => m.tipo === 'AUDIO' || (m.url || '').match(/\.(mp3|wav|ogg|m4a)$/i));
    const audioUrl = audioMedia ? this.formatMediaUrl(audioMedia.url) : 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

    return `
      <div class="gig-card" data-id="${id}" data-type="oferta">
        <div class="gig-cover-wrap">
          <img src="${coverSrc}" alt="${o.titulo}" class="gig-cover-img" loading="lazy" />
          <span class="gig-genre-badge">${genero}</span>
          ${verificado ? `<span class="gig-verified-badge" title="Artista Verificado">✓</span>` : ''}
        </div>

        <div class="gig-card-body">
          <div class="gig-artist-row">
            <img src="${avatar}" alt="${o.artistaNombre || 'Artista'}" class="gig-artist-avatar" />
            <div class="gig-artist-meta">
              <span class="gig-artist-name">${o.artistaNombre || 'Artista Musical'}</span>
              <span class="gig-rating">⭐ 4.9 <small>(38 reseña)</small></span>
            </div>
          </div>

          <h3 class="gig-card-title">${o.titulo}</h3>
          
          <div class="gig-location-price">
            <span class="gig-location">📍 ${o.ubicacion || 'Managua, NIC'}</span>
            <span class="gig-price">${precio}</span>
          </div>

          <!-- DEMO DE REPRODUCCIÓN AUDIO / ONDAS DE SONIDO 🎵 -->
          <div class="gig-audio-sample-card">
            <button class="btn-gig-play-demo" type="button" aria-label="Reproducir demo audio">
              <svg class="demo-icon-play" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              <svg class="demo-icon-pause" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="display:none"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            </button>
            <div class="gig-waveform-bars">
              <span class="bar b1"></span><span class="bar b2"></span><span class="bar b3"></span><span class="bar b4"></span><span class="bar b5"></span>
              <span class="bar b6"></span><span class="bar b7"></span><span class="bar b8"></span><span class="bar b9"></span><span class="bar b10"></span>
            </div>
            <small class="gig-demo-time">0:30</small>
            <audio src="${audioUrl}" class="gig-audio-element" preload="metadata"></audio>
          </div>

          <div class="gig-actions">
            <button class="btn-gig-icon btn-like-gig" title="Guardar en Favoritos">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>
            <button class="btn-gig-icon btn-chat-gig" title="Consultar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </button>
            <button class="btn-solicitar-contratacion" data-id="${id}" data-title="${encodeURIComponent(o.titulo)}">
              Solicitar Contratación
            </button>
          </div>

        </div>
      </div>
    `;
  },

  // ─────────────────────────────────────────────
  // RENDERIZAR CARD DE SOLICITUD DE EVENTO
  // ─────────────────────────────────────────────
  renderSolicitudCard(s) {
    const id = s.idSolicitudContratacion || s.id;
    const avatar = s.fotoPerfilUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.contratanteNombre || 'Organizador')}&background=1a9974&color=fff`;
    const presupuesto = s.presupuesto ? `$${s.presupuesto}` : 'A convenir';

    return `
      <div class="gig-card gig-solicitud-card" data-id="${id}" data-type="solicitud">
        <div class="gig-card-header-solicitud">
          <span class="gig-solicitud-badge">💼 SOLICITUD DE EVENTO</span>
          <span class="gig-solicitud-date">📅 ${s.fechaEvento ? new Date(s.fechaEvento).toLocaleDateString() : 'Próximamente'}</span>
        </div>

        <div class="gig-card-body">
          <div class="gig-artist-row">
            <img src="${avatar}" alt="${s.contratanteNombre}" class="gig-artist-avatar" />
            <div class="gig-artist-meta">
              <span class="gig-artist-name">${s.contratanteNombre || 'Contratante'}</span>
              <small class="gig-organizer-tag">Organizador de Eventos</small>
            </div>
          </div>

          <h3 class="gig-card-title">${s.titulo}</h3>
          <p class="gig-card-desc">${s.descripcion || 'Se busca banda o músico para amenizar evento corporativo o fiesta privada.'}</p>

          <div class="gig-location-price">
            <span class="gig-location">📍 ${s.ubicacion || 'Managua, NIC'}</span>
            <span class="gig-price">Presupuesto: <strong>${presupuesto}</strong></span>
          </div>

          <div class="gig-actions mt-auto">
            <button class="btn-solicitar-contratacion w-full" data-id="${id}" data-solicitud="true" data-title="${encodeURIComponent(s.titulo)}">
              Postularme como Músico
            </button>
          </div>
        </div>
      </div>
    `;
  },



  // ─────────────────────────────────────────────
  // EVENTOS E INTERACTIVIDAD DE PÁGINA
  // ─────────────────────────────────────────────
  attachEvents(container) {
    const isAuth = authService.isAuthenticated();

    // Cambiar Foto de Fondo del Hero
    const btnChangeHeroBg = container.querySelector('#btn-change-hero-bg');
    const inputHeroBgFile = container.querySelector('#hero-bg-file-input');
    const heroSection = container.querySelector('#contrataciones-hero');

    btnChangeHeroBg?.addEventListener('click', () => {
      inputHeroBgFile.click();
    });

    inputHeroBgFile?.addEventListener('change', async (e) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        const btnText = btnChangeHeroBg.querySelector('span');
        if (btnText) btnText.textContent = 'Subiendo a Supabase...';
        btnChangeHeroBg.disabled = true;

        try {
          const res = await storageService.uploadFile(file);
          if (res && res.url) {
            localStorage.setItem('contrataciones_hero_bg', res.url);
            heroSection.style.background = `linear-gradient(135deg, rgba(13, 104, 85, 0.88) 0%, rgba(8, 76, 62, 0.92) 100%), url('${res.url}') center/cover no-repeat`;
            if (btnText) btnText.textContent = '📷 Cambiar Foto de Fondo';
          }
        } catch (err) {
          alert('Error al actualizar imagen de fondo: ' + (err.message || 'Intente nuevamente'));
          if (btnText) btnText.textContent = '📷 Cambiar Foto de Fondo';
        } finally {
          btnChangeHeroBg.disabled = false;
        }
      }
    });

    // Swticher de Tabs (Ofertas vs Solicitudes)
    const tabOfertas = container.querySelector('#tab-ofertas');
    const tabSolicitudes = container.querySelector('#tab-solicitudes');

    tabOfertas?.addEventListener('click', () => {
      this._activeTab = 'ofertas';
      tabOfertas.classList.add('active');
      tabSolicitudes.classList.remove('active');
      this.loadOfertas(container);
    });

    tabSolicitudes?.addEventListener('click', () => {
      this._activeTab = 'solicitudes';
      tabSolicitudes.classList.add('active');
      tabOfertas.classList.remove('active');
      this.loadSolicitudes(container);
    });

    // Buscador del Hero
    const searchBtn = container.querySelector('#btn-hero-search');
    const inputSearch = container.querySelector('#hero-input-search');
    const selectGenero = container.querySelector('#hero-select-genero');
    const selectUbicacion = container.querySelector('#hero-select-ubicacion');

    const triggerSearch = () => {
      this._filtros.busqueda = inputSearch.value.trim();
      this._filtros.generoMusical = selectGenero.value;
      this._filtros.ubicacion = selectUbicacion.value;
      this.loadContent(container);
    };

    searchBtn?.addEventListener('click', triggerSearch);
    inputSearch?.addEventListener('keyup', (e) => { if (e.key === 'Enter') triggerSearch(); });
    selectGenero?.addEventListener('change', triggerSearch);
    selectUbicacion?.addEventListener('change', triggerSearch);

    // Slider de precio
    const slider = container.querySelector('#price-slider');
    const lblMax = container.querySelector('#lbl-max-price');
    slider?.addEventListener('input', (e) => {
      lblMax.textContent = `Max: $${e.target.value}`;
      this._filtros.tarifaMax = parseFloat(e.target.value);
    });

    slider?.addEventListener('change', () => {
      this.loadContent(container);
    });

    // MODAL CREAR OFERTA/SOLICITUD
    const modalCreate = container.querySelector('#modal-create-gig');
    const btnOpenCreate = container.querySelector('#btn-open-create-modal');
    const btnCloseCreate = container.querySelector('#btn-close-create-modal');
    const btnCancelCreate = container.querySelector('#btn-cancel-create');
    const formCreate = container.querySelector('#form-create-gig');

    let createMode = 'oferta'; // 'oferta' | 'solicitud'

    const openCreateModal = () => {
      if (!isAuth) {
        AuthModal.show('¡Publica en Contrataciones!', 'Debes iniciar sesión para publicar ofertas de servicio o solicitudes.');
        return;
      }
      modalCreate.style.display = 'flex';
    };

    const closeCreateModal = () => {
      modalCreate.style.display = 'none';
      this._selectedFiles = [];
      formCreate.reset();
      container.querySelector('#gig-previews-list').style.display = 'none';
      container.querySelector('#gig-previews-list').innerHTML = '';
    };

    btnOpenCreate?.addEventListener('click', openCreateModal);
    btnCloseCreate?.addEventListener('click', closeCreateModal);
    btnCancelCreate?.addEventListener('click', closeCreateModal);

    // Switcher dentro del modal (Oferta vs Solicitud)
    const tabTypeOferta = container.querySelector('#tab-type-oferta');
    const tabTypeSolicitud = container.querySelector('#tab-type-solicitud');
    const lblPrice = container.querySelector('#lbl-price');
    const groupDate = container.querySelector('#group-event-date');

    tabTypeOferta?.addEventListener('click', () => {
      createMode = 'oferta';
      tabTypeOferta.classList.add('active');
      tabTypeSolicitud.classList.remove('active');
      lblPrice.textContent = 'Tarifa por Hora / Presupuesto (USD) *';
      groupDate.style.display = 'none';
    });

    tabTypeSolicitud?.addEventListener('click', () => {
      createMode = 'solicitud';
      tabTypeSolicitud.classList.add('active');
      tabTypeOferta.classList.remove('active');
      lblPrice.textContent = 'Presupuesto Total Estimado (USD) *';
      groupDate.style.display = 'block';
    });

    // Dropzone Supabase en el modal
    const dropzone = container.querySelector('#gig-dropzone');
    const fileInput = container.querySelector('#gig-file-input');
    const previewsList = container.querySelector('#gig-previews-list');

    dropzone?.addEventListener('click', () => fileInput.click());

    fileInput?.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        for (let i = 0; i < e.target.files.length; i++) {
          this._selectedFiles.push(e.target.files[i]);
        }
        this.renderGigPreviews(container);
      }
      fileInput.value = '';
    });

    // SUBMIT DEL FORMULARIO DE CREACIÓN
    formCreate?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = formCreate.querySelector('#btn-submit-create');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Subiendo a Supabase y guardando...';

      const titulo = container.querySelector('#gig-title').value;
      const genero = container.querySelector('#gig-genre').value;
      const precio = container.querySelector('#gig-price').value;
      const ubicacion = container.querySelector('#gig-location').value;
      const descripcion = container.querySelector('#gig-description').value;
      const fechaEvento = container.querySelector('#gig-event-date').value;

      try {
        if (createMode === 'oferta') {
          await contratacionService.crearOferta({
            titulo,
            descripcion,
            generoMusical: genero,
            tarifaAproximada: precio,
            ubicacion,
            files: this._selectedFiles
          });
          this._activeTab = 'ofertas';
          tabOfertas?.click();
        } else {
          await contratacionService.crearSolicitud({
            titulo,
            descripcion,
            presupuesto: precio,
            ubicacion,
            fechaEvento,
            files: this._selectedFiles
          });
          this._activeTab = 'solicitudes';
          tabSolicitudes?.click();
        }

        closeCreateModal();
        alert('¡Publicación creada exitosamente en Contrataciones!');
      } catch (err) {
        alert('Error al publicar: ' + (err.message || 'Verifica la conexión'));
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Publicar en Contrataciones';
      }
    });

    // MODAL DE ENVIAR SOLICITUD DE CONTRATACIÓN DIRECTA
    const modalHire = container.querySelector('#modal-hire-request');
    const btnCloseHire = container.querySelector('#btn-close-hire-modal');
    const btnCancelHire = container.querySelector('#btn-cancel-hire');
    const formHire = container.querySelector('#form-hire-request');

    const closeHireModal = () => {
      modalHire.style.display = 'none';
      formHire.reset();
    };

    btnCloseHire?.addEventListener('click', closeHireModal);
    btnCancelHire?.addEventListener('click', closeHireModal);

    let targetGigId = null;
    let isSolicitudTarget = false;

    formHire?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = formHire.querySelector('#btn-submit-hire');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';

      const mensaje = container.querySelector('#hire-message').value;

      try {
        await contratacionService.solicitarContratacion({
          idOferta: !isSolicitudTarget ? targetGigId : null,
          idSolicitud: isSolicitudTarget ? targetGigId : null,
          mensaje
        });

        closeHireModal();
        alert('¡Tu solicitud ha sido enviada exitosamente al músico/contratante!');
      } catch (err) {
        alert('Error al enviar propuesta: ' + (err.message || 'Verifica tu conexión'));
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar Solicitud Directa';
      }
    });

    // Exponer apertura de modal hire
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-solicitar-contratacion');
      if (!btn) return;

      if (!isAuth) {
        AuthModal.show('¡Contrata Artistas!', 'Debes iniciar sesión para solicitar contrataciones.');
        return;
      }

      targetGigId = btn.dataset.id;
      isSolicitudTarget = btn.dataset.solicitud === 'true';
      const title = decodeURIComponent(btn.dataset.title || 'Servicio Musical');

      const summaryCard = container.querySelector('#hire-summary-card');
      summaryCard.innerHTML = `
        <h4>${title}</h4>
        <p><small>${isSolicitudTarget ? 'Postulación a Solicitud de Evento' : 'Solicitud de Contratación de Músico'}</small></p>
      `;

      modalHire.style.display = 'flex';
    });
  },

  renderGigPreviews(container) {
    const list = container.querySelector('#gig-previews-list');
    if (this._selectedFiles.length === 0) {
      list.style.display = 'none';
      list.innerHTML = '';
      return;
    }

    list.style.display = 'flex';
    list.innerHTML = this._selectedFiles.map((file, idx) => `
      <div class="gig-preview-chip">
        <span class="chip-icon">${file.type.startsWith('audio/') ? '🎵' : (file.type.startsWith('video/') ? '🎬' : '📸')}</span>
        <span class="chip-name">${file.name}</span>
        <button type="button" class="chip-remove" data-idx="${idx}">✕</button>
      </div>
    `).join('');

    list.querySelectorAll('.chip-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const removeIdx = parseInt(btn.dataset.idx, 10);
        this._selectedFiles.splice(removeIdx, 1);
        this.renderGigPreviews(container);
      });
    });
  },

  // ─────────────────────────────────────────────
  // REPRODUCTOR DEMO EN TARJETAS DE MÚSICOS 🎵
  // ─────────────────────────────────────────────
  bindCardEvents(container) {
    container.querySelectorAll('.btn-gig-play-demo').forEach(btn => {
      if (btn.dataset.bound === 'true') return;
      btn.dataset.bound = 'true';

      const card = btn.closest('.gig-audio-sample-card');
      const audio = card?.querySelector('.gig-audio-element');
      const iconPlay = btn.querySelector('.demo-icon-play');
      const iconPause = btn.querySelector('.demo-icon-pause');

      if (!audio) return;

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Pausar otros audios activos
        document.querySelectorAll('audio.gig-audio-element').forEach(a => {
          if (a !== audio && !a.paused) {
            a.pause();
          }
        });

        if (audio.paused) {
          audio.play().then(() => {
            if (iconPlay) iconPlay.style.display = 'none';
            if (iconPause) iconPause.style.display = 'block';
            card.classList.add('playing');
          }).catch(err => console.warn('Error al reproducir audio demo:', err));
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
      });
    });
  }
};
