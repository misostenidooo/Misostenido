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

    const heroBgStyle = `background: linear-gradient(135deg, rgba(13, 104, 85, 0.94) 0%, rgba(8, 76, 62, 0.96) 100%), url('https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1600&q=80') center/cover no-repeat;`;

    const container = document.createElement('div');
    container.className = 'contrataciones-page animate-fade';
    this._container = container;
    this._selectedFiles = [];

    container.innerHTML = `
      <!-- ================= HERO HEADER ================= -->
      <section class="contrataciones-hero" id="contrataciones-hero" style="${heroBgStyle}">
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

      <!-- ==============================================================
           MODAL VER DETALLES (OFERTA O SOLICITUD)
           ============================================================== -->
      <div class="modal-overlay" id="modal-detalle" style="display:none">
        <div class="modal-detalle-card" id="modal-detalle-card">
          <!-- El contenido se inyecta dinámicamente via renderDetalleModal() -->
          <div class="detalle-loading">
            <div class="spinner"></div>
            <span>Cargando información...</span>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      this._moveModalsToBody(container);
      this.attachEvents(container);
      this.loadContent(container);
    }, 0);

    return container;
  },

  // ─────────────────────────────────────────────
  // MOVER MODALES AL BODY (evita duplicados y z-index corruption por transforms)
  // ─────────────────────────────────────────────
  _moveModalsToBody(container) {
    document.querySelectorAll('body > #modal-create-gig, body > #modal-hire-request, body > #modal-detalle').forEach(old => old.remove());
    const modals = container.querySelectorAll('.modal-overlay');
    modals.forEach(m => document.body.appendChild(m));
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

    // Cargar media en paralelo para ofertas que tengan archivos subidos
    this._ofertas = await Promise.all(
      this._ofertas.map(async (o) => {
        const id = o.idOfertaServicio || o.id;
        const hasMedia = (o.totalMedia || o.TotalMedia || 0) > 0;
        if (hasMedia) {
          try {
            const detalle = await contratacionService.getOfertaDetalle(id);
            if (detalle && detalle.media) {
              return { ...o, media: detalle.media };
            }
          } catch (e) {
            console.warn('Error cargando media para oferta', id, e);
          }
        }
        return o;
      })
    );

    if (titleLbl) titleLbl.textContent = `${this._ofertas.length} Ofertas de Servicios Musicales`;
    if (grid) {
      grid.innerHTML = this._ofertas.map(o => this.renderOfertaCard(o)).join('');

      // Auto-abrir modal de detalle si viene el id por parámetro (ej: #/contrataciones?id=5)
      const hash = window.location.hash || '';
      const queryParams = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
      const targetId = queryParams.get('id') || queryParams.get('oferta') || queryParams.get('highlight');
      if (targetId) {
        setTimeout(() => {
          const modalDetalle = document.querySelector('#modal-detalle');
          if (modalDetalle) {
            modalDetalle.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            this.openDetalle(targetId, 'oferta', container, authService.isAuthenticated());
          }
          const cardEl = grid.querySelector(`[data-id="${targetId}"]`);
          if (cardEl) {
            cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            cardEl.style.boxShadow = '0 0 0 4px #0d6855, 0 12px 28px rgba(13, 104, 85, 0.35)';
          }
        }, 250);
      }
    }
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

    // Cargar media en paralelo para solicitudes que tengan archivos subidos
    this._solicitudes = await Promise.all(
      this._solicitudes.map(async (s) => {
        const id = s.idSolicitudContratacion || s.id;
        const hasMedia = (s.totalMedia || s.TotalMedia || (s.media && s.media.length) || 0) > 0;
        if (hasMedia) {
          try {
            const detalle = await contratacionService.getSolicitudDetalle(id);
            if (detalle && detalle.media) {
              return { ...s, media: detalle.media };
            }
          } catch (e) {
            console.warn('Error cargando media para solicitud', id, e);
          }
        }
        return s;
      })
    );

    if (titleLbl) titleLbl.textContent = `${this._solicitudes.length} Solicitudes de Eventos encontradas`;
    if (grid) grid.innerHTML = this._solicitudes.map(s => this.renderSolicitudCard(s)).join('');
  },

  // ─────────────────────────────────────────────
  // ─────────────────────────────────────────────
  // HELPERS DE GENERO / ÁREA MUSICAL → CLASE CSS, INSTRUMENTO Y EMOJI
  // ─────────────────────────────────────────────
  _getAreaInfo(genero = '', artistaTipo = '') {
    const g = (genero || '').toLowerCase();
    const t = (artistaTipo || '').toLowerCase();
    const combined = `${g} ${t}`;

    if (combined.includes('rock') || combined.includes('metal') || combined.includes('punk') || combined.includes('guitarra el')) {
      return {
        area: 'Guitarra Eléctrica & Rock',
        instrumento: 'Guitarra Eléctrica / Bajo / Batería',
        emoji: '🎸',
        genreClass: 'genre-rock',
        iconText: 'Rock & Alternativo'
      };
    }
    if (combined.includes('jazz') || combined.includes('bossa') || combined.includes('sax') || combined.includes('trompet') || combined.includes('viento')) {
      return {
        area: 'Saxofón & Jazz / Vientos',
        instrumento: 'Saxofón / Trompeta / Ensamble Jazz',
        emoji: '🎷',
        genreClass: 'genre-jazz',
        iconText: 'Jazz & Vientos'
      };
    }
    if (combined.includes('cl') && (combined.includes('sica') || combined.includes('viol') || combined.includes('orquest') || combined.includes('piano') || combined.includes('chelo'))) {
      return {
        area: 'Violín, Piano & Música Clásica',
        instrumento: 'Violín / Violonchelo / Piano de Cola',
        emoji: '🎻',
        genreClass: 'genre-clasica',
        iconText: 'Clásica & Cuerdas'
      };
    }
    if (combined.includes('cumbia') || combined.includes('tropical') || combined.includes('acorde')) {
      return {
        area: 'Acordeón & Cumbia Tropical',
        instrumento: 'Acordeón / Percusión Tropical',
        emoji: '🪗',
        genreClass: 'genre-cumbia',
        iconText: 'Cumbia & Tropical'
      };
    }
    if (combined.includes('salsa') || combined.includes('merengue') || combined.includes('bachata') || combined.includes('timbal') || combined.includes('conga') || combined.includes('latina')) {
      return {
        area: 'Percusión Latina & Salsa',
        instrumento: 'Congas / Timbales / Piano Latino',
        emoji: '💃',
        genreClass: 'genre-salsa',
        iconText: 'Salsa & Son Latino'
      };
    }
    if (combined.includes('electr') || combined.includes('dj') || combined.includes('sint') || combined.includes('beat') || combined.includes('urbano') || combined.includes('trap') || combined.includes('regge')) {
      return {
        area: 'DJ, Sintetizadores & Beats',
        instrumento: 'Controlador DJ / Sintetizador / Beats',
        emoji: '🎛️',
        genreClass: 'genre-electronica',
        iconText: 'Electrónica & DJ'
      };
    }
    if (combined.includes('mariachi') || combined.includes('ranch') || combined.includes('guitarron') || combined.includes('norte')) {
      return {
        area: 'Trompeta, Guitarrón & Mariachi',
        instrumento: 'Trompeta / Vihuela / Guitarrón',
        emoji: '🪕',
        genreClass: 'genre-mariachi',
        iconText: 'Mariachi & Regional'
      };
    }
    if (combined.includes('piano') || combined.includes('teclado') || combined.includes('organo')) {
      return {
        area: 'Piano & Teclados',
        instrumento: 'Piano / Teclado Digital / Sintetizador',
        emoji: '🎹',
        genreClass: 'genre-clasica',
        iconText: 'Teclados & Piano'
      };
    }
    if (combined.includes('bater') || combined.includes('percusi')) {
      return {
        area: 'Batería & Percusión',
        instrumento: 'Set de Batería Acústica / Percusión',
        emoji: '🥁',
        genreClass: 'genre-rock',
        iconText: 'Batería & Ritmo'
      };
    }
    if (combined.includes('ac') && combined.includes('stico') || combined.includes('voz') || combined.includes('cant') || combined.includes('trova') || combined.includes('balada') || combined.includes('pop')) {
      return {
        area: 'Voz & Guitarra Acústica',
        instrumento: 'Micrófono Vocal / Guitarra Acústica',
        emoji: '🎤',
        genreClass: 'genre-acustico',
        iconText: 'Acústico & Voz'
      };
    }

    // Genérico por defecto
    return {
      area: genero ? `${genero} • Área Musical` : 'Música en Vivo & Ejecución',
      instrumento: artistaTipo || 'Instrumentista / Ensamble Musical',
      emoji: '🎵',
      genreClass: 'genre-default',
      iconText: genero ? genero.toUpperCase() : 'MÚSICA EN VIVO'
    };
  },

  _getGenreClass(genero) {
    return this._getAreaInfo(genero).genreClass;
  },

  _getGenreEmoji(genero) {
    return this._getAreaInfo(genero).emoji;
  },

  // ─────────────────────────────────────────────
  // RENDERIZAR CARD DE OFERTA DE SERVICIO
  // ─────────────────────────────────────────────
  renderOfertaCard(o) {
    const id = o.idOfertaServicio || o.id;
    const generoRaw = o.generoMusical || '';
    const verificado = o.artistaVerificado !== false;
    const avatar = o.fotoPerfilUrl
      ? this.formatMediaUrl(o.fotoPerfilUrl)
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(o.artistaNombre || 'Artista')}&background=0d6855&color=fff`;
    const precio = o.tarifaAproximada ? `$${o.tarifaAproximada} / hora` : 'A convenir';
    
    const areaInfo = this._getAreaInfo(generoRaw, o.artistaTipo);
    const media = o.media || [];
    const fotos = media.filter(m => m.tipo === 'FOTO' || (m.url || '').match(/\.(jpg|jpeg|png|gif|webp)$/i));
    const audios = media.filter(m => m.tipo === 'AUDIO' || (m.url || '').match(/\.(mp3|wav|ogg|m4a|flac)$/i));

    // Cover: foto real si la subió, o carátula temática de área musical si no
    let coverHtml;
    if (fotos.length > 0) {
      coverHtml = `
        <img src="${this.formatMediaUrl(fotos[0].url)}" alt="${o.titulo}" class="gig-cover-real-img"
          onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
        <div class="gig-cover-placeholder" style="display:none">
          <span class="placeholder-icon">${areaInfo.emoji}</span>
          <span class="placeholder-genre">${areaInfo.iconText}</span>
          <div class="placeholder-instrument-area">
            <span class="pia-tag">Área: ${areaInfo.area}</span>
          </div>
        </div>
      `;
    } else {
      coverHtml = `
        <div class="gig-cover-placeholder">
          <span class="placeholder-icon">${areaInfo.emoji}</span>
          <span class="placeholder-genre">${areaInfo.iconText}</span>
          <div class="placeholder-instrument-area">
            <span class="pia-tag">Área: ${areaInfo.area}</span>
            <span class="pia-no-photo">📷 Sin foto adjunta</span>
          </div>
        </div>
      `;
    }

    // Audio: reproductor interactivo en la tarjeta si subió audio
    let audioHtml;
    if (audios.length > 0) {
      const audUrl = this.formatMediaUrl(audios[0].url);
      const audName = audios[0].descripcion || 'Muestra de audio';
      audioHtml = `
        <div class="gig-audio-sample-card gig-audio-card-player" title="${audName}">
          <button class="btn-card-audio-play" type="button" title="Reproducir / Pausar muestra de audio">
            <svg class="cap-play-icon" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            <svg class="cap-pause-icon" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="display:none"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          </button>
          <div class="gig-waveform-bars">
            <span class="bar b1"></span><span class="bar b2"></span><span class="bar b3"></span>
            <span class="bar b4"></span><span class="bar b5"></span><span class="bar b6"></span>
            <span class="bar b7"></span><span class="bar b8"></span>
          </div>
          <span class="gig-card-audio-time">0:00</span>
          <audio src="${audUrl}" class="card-audio-el" preload="none"></audio>
        </div>
      `;
    } else {
      audioHtml = `<div class="gig-audio-no-demo">🎤 Sin muestra de audio cargada</div>`;
    }

    return `
      <div class="gig-card" data-id="${id}" data-type="oferta">
        <div class="gig-cover-wrap ${fotos.length === 0 ? areaInfo.genreClass : ''}">
          ${coverHtml}
          <span class="gig-genre-badge">${areaInfo.iconText}</span>
          ${verificado ? `<span class="gig-verified-badge" title="Artista Verificado">✓ Verificado</span>` : ''}
        </div>

        <div class="gig-card-body">
          <div class="gig-artist-row">
            <img src="${avatar}" alt="${o.artistaNombre || 'Artista'}" class="gig-artist-avatar"
              onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(o.artistaNombre || 'A')}&background=0d6855&color=fff'" />
            <div class="gig-artist-meta">
              <span class="gig-artist-name">${o.artistaNombre || 'Artista Musical'}</span>
              <span style="font-size:0.74rem;color:#64748b">${o.artistaTipo || areaInfo.instrumento}</span>
            </div>
          </div>

          <h3 class="gig-card-title">${o.titulo}</h3>

          <div class="gig-location-price">
            <span class="gig-location">📍 ${o.ubicacion || 'Nicaragua'}</span>
            <span class="gig-price">${precio}</span>
          </div>

          ${audioHtml}

          <div class="gig-actions">
            <button class="btn-ver-detalles btn-ver-detalle-oferta" data-id="${id}" data-type="oferta">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              Ver Detalles
            </button>
            <button class="btn-solicitar-contratacion" data-id="${id}" data-title="${encodeURIComponent(o.titulo)}">
              Contratar
            </button>
          </div>

        </div>
      </div>
    `;
  },

  // ─────────────────────────────────────────────
  // ─────────────────────────────────────────────
  // PREVIEWS DE ARCHIVOS SELECCIONADOS EN MODAL CREAR
  // ─────────────────────────────────────────────
  renderGigPreviews(container) {
    const previewsList = container.querySelector('#gig-previews-list');
    if (!previewsList) return;

    if (!this._selectedFiles || this._selectedFiles.length === 0) {
      previewsList.style.display = 'none';
      previewsList.innerHTML = '';
      return;
    }

    previewsList.style.display = 'flex';
    previewsList.innerHTML = this._selectedFiles.map((f, idx) => {
      let icon = '📷';
      if (f.type.startsWith('audio/') || f.name.match(/\.(mp3|wav|ogg|m4a|aac|flac)$/i)) icon = '🎵';
      else if (f.type.startsWith('video/') || f.name.match(/\.(mp4|webm|mov|mkv|avi)$/i)) icon = '🎬';

      const sizeMb = (f.size / (1024 * 1024)).toFixed(1);
      return `
        <div class="gig-preview-chip">
          <span>${icon} ${f.name} (${sizeMb} MB)</span>
          <button type="button" class="chip-remove" data-idx="${idx}" title="Eliminar archivo">✕</button>
        </div>
      `;
    }).join('');

    previewsList.querySelectorAll('.chip-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        this._selectedFiles.splice(idx, 1);
        this.renderGigPreviews(container);
      });
    });
  },

  // ─────────────────────────────────────────────
  // RENDERIZAR CARD DE SOLICITUD DE EVENTO
  // ─────────────────────────────────────────────
  renderSolicitudCard(s) {
    const id = s.idSolicitudContratacion || s.id;
    const avatar = s.fotoPerfilUrl
      ? this.formatMediaUrl(s.fotoPerfilUrl)
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(s.contratanteNombre || 'Organizador')}&background=1a9974&color=fff`;
    const presupuesto = s.presupuesto ? `$${s.presupuesto}` : 'A convenir';
    const media = s.media || [];
    const fotos = media.filter(m => m.tipo === 'FOTO' || (m.url || '').match(/\.(jpg|jpeg|png|gif|webp)$/i));
    const audios = media.filter(m => m.tipo === 'AUDIO' || (m.url || '').match(/\.(mp3|wav|ogg|m4a|flac)$/i));
    const videos = media.filter(m => m.tipo === 'VIDEO' || (m.url || '').match(/\.(mp4|webm|mov)$/i));

    const mediaCount = (s.totalMedia || s.TotalMedia || media.length || 0);
    const mediaIndicator = mediaCount > 0
      ? `<div style="display:flex;align-items:center;gap:6px;font-size:0.78rem;color:#0d6855;font-weight:600;margin-bottom:12px;">📎 ${mediaCount} archivo(s) adjunto(s) ${videos.length > 0 ? '🎬' : ''} ${audios.length > 0 ? '🎵' : ''}</div>`
      : '';

    return `
      <div class="gig-card gig-solicitud-card" data-id="${id}" data-type="solicitud">
        <div class="gig-card-header-solicitud">
          <span class="gig-solicitud-badge">💼 SOLICITUD DE EVENTO</span>
          <span class="gig-solicitud-date">📅 ${s.fechaEvento ? new Date(s.fechaEvento).toLocaleDateString('es-NI') : 'Próximamente'}</span>
        </div>

        <div class="gig-card-body">
          <div class="gig-artist-row">
            <img src="${avatar}" alt="${s.contratanteNombre || 'Organizador'}" class="gig-artist-avatar"
              onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(s.contratanteNombre || 'O')}&background=1a9974&color=fff'" />
            <div class="gig-artist-meta">
              <span class="gig-artist-name">${s.contratanteNombre || 'Contratante'}</span>
              <small class="gig-organizer-tag">${s.contratanteTipo || 'Organizador de Eventos'}</small>
            </div>
          </div>

          <h3 class="gig-card-title">${s.titulo}</h3>
          <p class="gig-card-desc">${s.descripcion || 'Se busca músico o banda para evento.'}</p>

          ${mediaIndicator}

          <div class="gig-location-price">
            <span class="gig-location">📍 ${s.ubicacion || 'Nicaragua'}</span>
            <span class="gig-price">Presupuesto: <strong>${presupuesto}</strong></span>
          </div>

          <div class="gig-actions mt-auto">
            <button class="btn-ver-detalles btn-ver-detalle-oferta" data-id="${id}" data-type="solicitud">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              Ver Detalles
            </button>
            <button class="btn-solicitar-contratacion" data-id="${id}" data-solicitud="true" data-title="${encodeURIComponent(s.titulo)}">
              Postularme
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

    // Reproductor de audio interactivo en las tarjetas de oferta
    container.addEventListener('click', (e) => {
      const btnPlay = e.target.closest('.btn-card-audio-play');
      if (!btnPlay) return;

      const playerWrap = btnPlay.closest('.gig-audio-card-player');
      const audioEl = playerWrap?.querySelector('.card-audio-el');
      const playIcon = btnPlay.querySelector('.cap-play-icon');
      const pauseIcon = btnPlay.querySelector('.cap-pause-icon');
      const timeLbl = playerWrap?.querySelector('.gig-card-audio-time');

      if (!audioEl) return;

      if (audioEl.paused) {
        // Pausar cualquier otro audio sonando
        container.querySelectorAll('audio').forEach(a => {
          if (a !== audioEl && !a.paused) {
            a.pause();
            const parent = a.closest('.gig-audio-card-player') || a.closest('.detalle-audio-section');
            if (parent) {
              parent.classList.remove('playing');
              const pi = parent.querySelector('.cap-play-icon') || parent.querySelector('.dpa-icon-play');
              const pau = parent.querySelector('.cap-pause-icon') || parent.querySelector('.dpa-icon-pause');
              if (pi) pi.style.display = 'inline';
              if (pau) pau.style.display = 'none';
            }
          }
        });

        audioEl.play().then(() => {
          playerWrap.classList.add('playing');
          if (playIcon) playIcon.style.display = 'none';
          if (pauseIcon) pauseIcon.style.display = 'inline';
        }).catch(err => {
          console.warn('Error al reproducir audio de la tarjeta:', err);
        });
      } else {
        audioEl.pause();
        playerWrap.classList.remove('playing');
        if (playIcon) playIcon.style.display = 'inline';
        if (pauseIcon) pauseIcon.style.display = 'none';
      }

      audioEl.ontimeupdate = () => {
        const cur = audioEl.currentTime;
        const mins = Math.floor(cur / 60);
        const secs = Math.floor(cur % 60);
        if (timeLbl) timeLbl.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
      };

      audioEl.onended = () => {
        playerWrap.classList.remove('playing');
        if (playIcon) playIcon.style.display = 'inline';
        if (pauseIcon) pauseIcon.style.display = 'none';
        if (timeLbl) timeLbl.textContent = '0:00';
      };
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
    const modalCreate = document.querySelector('body > #modal-create-gig') || container.querySelector('#modal-create-gig');
    const modalHire = document.querySelector('body > #modal-hire-request') || container.querySelector('#modal-hire-request');
    const modalDetalle = document.querySelector('body > #modal-detalle') || container.querySelector('#modal-detalle');

    const btnOpenCreate = container.querySelector('#btn-open-create-modal');
    const btnCloseCreate = modalCreate?.querySelector('#btn-close-create-modal');
    const btnCancelCreate = modalCreate?.querySelector('#btn-cancel-create');
    const formCreate = modalCreate?.querySelector('#form-create-gig');

    let createMode = 'oferta'; // 'oferta' | 'solicitud'

    const openCreateModal = () => {
      if (!isAuth) {
        AuthModal.show('¡Publica en Contrataciones!', 'Debes iniciar sesión para publicar ofertas de servicio o solicitudes.');
        return;
      }
      if (modalCreate) {
        modalCreate.style.display = 'flex';
        document.body.style.overflow = 'hidden';
      }
    };

    const closeCreateModal = () => {
      if (modalCreate) {
        modalCreate.style.display = 'none';
        document.body.style.overflow = '';
      }
      this._selectedFiles = [];
      if (formCreate) formCreate.reset();
      const list = modalCreate?.querySelector('#gig-previews-list');
      if (list) {
        list.style.display = 'none';
        list.innerHTML = '';
      }
    };

    btnOpenCreate?.addEventListener('click', openCreateModal);
    btnCloseCreate?.addEventListener('click', closeCreateModal);
    btnCancelCreate?.addEventListener('click', closeCreateModal);

    modalCreate?.addEventListener('click', (e) => {
      if (e.target === modalCreate) closeCreateModal();
    });

    // Switcher dentro del modal (Oferta vs Solicitud)
    const tabTypeOferta = modalCreate?.querySelector('#tab-type-oferta');
    const tabTypeSolicitud = modalCreate?.querySelector('#tab-type-solicitud');
    const lblPrice = modalCreate?.querySelector('#lbl-price');
    const groupDate = modalCreate?.querySelector('#group-event-date');

    tabTypeOferta?.addEventListener('click', () => {
      createMode = 'oferta';
      tabTypeOferta.classList.add('active');
      tabTypeSolicitud?.classList.remove('active');
      if (lblPrice) lblPrice.textContent = 'Tarifa por Hora / Presupuesto (USD) *';
      if (groupDate) groupDate.style.display = 'none';
    });

    tabTypeSolicitud?.addEventListener('click', () => {
      createMode = 'solicitud';
      tabTypeSolicitud.classList.add('active');
      tabTypeOferta?.classList.remove('active');
      if (lblPrice) lblPrice.textContent = 'Presupuesto Total Estimado (USD) *';
      if (groupDate) groupDate.style.display = 'block';
    });

    // Dropzone Supabase en el modal
    const dropzone = modalCreate?.querySelector('#gig-dropzone');
    const fileInput = modalCreate?.querySelector('#gig-file-input');

    dropzone?.addEventListener('click', (e) => {
      if (e.target !== fileInput) fileInput?.click();
    });

    dropzone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('drag-over');
    });

    dropzone?.addEventListener('dragleave', () => {
      dropzone.classList.remove('drag-over');
    });

    dropzone?.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        for (let i = 0; i < e.dataTransfer.files.length; i++) {
          this._selectedFiles.push(e.dataTransfer.files[i]);
        }
        this.renderGigPreviews(modalCreate);
      }
    });

    fileInput?.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        for (let i = 0; i < e.target.files.length; i++) {
          this._selectedFiles.push(e.target.files[i]);
        }
        this.renderGigPreviews(modalCreate);
      }
      fileInput.value = '';
    });

    // SUBMIT DEL FORMULARIO DE CREACIÓN
    formCreate?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = formCreate.querySelector('#btn-submit-create');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Subiendo multimedia y guardando...';
      }

      const titulo = modalCreate.querySelector('#gig-title').value;
      const genero = modalCreate.querySelector('#gig-genre').value;
      const precio = modalCreate.querySelector('#gig-price').value;
      const ubicacion = modalCreate.querySelector('#gig-location').value;
      const descripcion = modalCreate.querySelector('#gig-description').value;
      const fechaEvento = modalCreate.querySelector('#gig-event-date').value;

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
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Publicar en Contrataciones';
        }
      }
    });

    // MODAL DE ENVIAR SOLICITUD DE CONTRATACIÓN DIRECTA
    const btnCloseHire = modalHire?.querySelector('#btn-close-hire-modal');
    const btnCancelHire = modalHire?.querySelector('#btn-cancel-hire');
    const formHire = modalHire?.querySelector('#form-hire-request');

    const closeHireModal = () => {
      if (modalHire) {
        modalHire.style.display = 'none';
        document.body.style.overflow = '';
      }
      if (formHire) formHire.reset();
    };

    btnCloseHire?.addEventListener('click', closeHireModal);
    btnCancelHire?.addEventListener('click', closeHireModal);

    modalHire?.addEventListener('click', (e) => {
      if (e.target === modalHire) closeHireModal();
    });

    let targetGigId = null;
    let isSolicitudTarget = false;

    formHire?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = formHire.querySelector('#btn-submit-hire');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';
      }

      const mensaje = modalHire.querySelector('#hire-message').value;

      // Puede venir de card directa o del modal de detalles
      const resolvedId = targetGigId || modalHire.dataset.targetId;
      const resolvedIsSolicitud = isSolicitudTarget || (modalHire.dataset.esSolicitud === 'true');

      try {
        await contratacionService.solicitarContratacion({
          idOferta: !resolvedIsSolicitud ? resolvedId : null,
          idSolicitud: resolvedIsSolicitud ? resolvedId : null,
          mensaje
        });

        closeHireModal();
        // Limpiar dataset tras envío exitoso
        modalHire.dataset.targetId = '';
        modalHire.dataset.esSolicitud = '';
        targetGigId = null;
        isSolicitudTarget = false;
        alert('¡Tu solicitud ha sido enviada exitosamente al músico/contratante!');
      } catch (err) {
        alert('Error al enviar propuesta: ' + (err.message || 'Verifica tu conexión'));
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Enviar Solicitud Directa';
        }
      }
    });

    // Abrir modal de contratación
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

      const summaryCard = modalHire?.querySelector('#hire-summary-card');
      if (summaryCard) {
        summaryCard.innerHTML = `
          <h4>${title}</h4>
          <p><small>${isSolicitudTarget ? 'Postulación a Solicitud de Evento' : 'Solicitud de Contratación de Músico'}</small></p>
        `;
      }

      if (modalHire) {
        modalHire.style.display = 'flex';
        document.body.style.overflow = 'hidden';
      }
    });

    // ─── MODAL VER DETALLES ───
    container.addEventListener('click', async (e) => {
      const btnVer = e.target.closest('.btn-ver-detalles, .btn-ver-detalle-oferta');
      const card = e.target.closest('.gig-card');
      const isPlayAudio = e.target.closest('.btn-card-audio-play, .gig-audio-sample-card');
      const isHireBtn = e.target.closest('.btn-solicitar-contratacion');

      if (isPlayAudio || isHireBtn) return;

      const target = btnVer || card;
      if (!target) return;

      const id = target.dataset.id;
      const tipo = target.dataset.type || (this._activeTab === 'solicitudes' ? 'solicitud' : 'oferta');
      if (id) {
        await this.openDetalle(id, tipo, container, isAuth);
      }
    });

    // Cerrar modal detalle al click en el overlay o botón cerrar
    modalDetalle?.addEventListener('click', (e) => {
      if (e.target === modalDetalle || e.target.closest('.btn-close-modal, #btn-detalle-cerrar')) {
        modalDetalle.style.display = 'none';
        document.body.style.overflow = '';
        document.querySelectorAll('audio.detalle-audio-element, video.detalle-video-player').forEach(a => a.pause());
      }
    });
  },

  // ─────────────────────────────────────────────
  // ABRIR DETALLE: CARGA DATOS REALES DE LA API
  // ─────────────────────────────────────────────
  async openDetalle(id, tipo = 'oferta', container, isAuth = authService.isAuthenticated()) {
    const modalDetalle = document.querySelector('body > #modal-detalle') || document.querySelector('#modal-detalle');
    const card = modalDetalle?.querySelector('#modal-detalle-card');
    if (!modalDetalle || !card) return;

    modalDetalle.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Mostrar spinner
    card.innerHTML = `
      <div class="detalle-loading">
        <div class="spinner"></div>
        <span>Cargando información...</span>
      </div>
    `;

    try {
      let data;
      if (tipo === 'solicitud') {
        data = await contratacionService.getSolicitudDetalle(id);
      } else {
        data = await contratacionService.getOfertaDetalle(id);
      }

      if (!data) {
        card.innerHTML = `
          <div class="detalle-error" style="padding: 24px; text-align: center;">
            ❌ No se pudo cargar la información de la contratación.
            <div style="margin-top:14px">
              <button class="btn-detalle-cerrar" id="btn-err-cerrar" style="background:#0d6855;color:#fff;border:none;padding:8px 16px;border-radius:8px;cursor:pointer">← Cerrar</button>
            </div>
          </div>
        `;
        card.querySelector('#btn-err-cerrar')?.addEventListener('click', () => {
          modalDetalle.style.display = 'none';
          document.body.style.overflow = '';
        });
        return;
      }

      this.renderDetalleModal(data, tipo, card, isAuth);
    } catch (err) {
      card.innerHTML = `
        <div class="detalle-error" style="padding: 24px; text-align: center;">
          ❌ Error: ${err.message || 'No se pudo conectar con el servidor.'}
          <div style="margin-top:14px">
            <button class="btn-detalle-cerrar" id="btn-err-cerrar" style="background:#0d6855;color:#fff;border:none;padding:8px 16px;border-radius:8px;cursor:pointer">← Cerrar</button>
          </div>
        </div>
      `;
      card.querySelector('#btn-err-cerrar')?.addEventListener('click', () => {
        modalDetalle.style.display = 'none';
        document.body.style.overflow = '';
      });
    }
  },

  // ─────────────────────────────────────────────
  // RENDERIZAR MODAL DE DETALLES CON DATOS REALES
  // ─────────────────────────────────────────────
  renderDetalleModal(data, tipo, card, isAuth) {
    const media = data.media || [];
    const fotos = media.filter(m => m.tipo === 'FOTO' || (m.url || '').match(/\.(jpg|jpeg|png|gif|webp)$/i));
    const videos = media.filter(m => m.tipo === 'VIDEO' || (m.url || '').match(/\.(mp4|webm|mov|mkv|avi)$/i));
    const audios = media.filter(m => m.tipo === 'AUDIO' || (m.url || '').match(/\.(mp3|wav|ogg|m4a|aac|flac)$/i));

    // ── Artista / autor
    const esOferta = tipo === 'oferta';
    const nombre = esOferta ? (data.artistaNombre || 'Artista') : (data.contratanteNombre || 'Contratante');
    const avatarUrl = data.fotoPerfilUrl
      ? this.formatMediaUrl(data.fotoPerfilUrl)
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=0d6855&color=fff`;
    const authorTag = esOferta ? (data.artistaTipo || 'Músico') : (data.contratanteTipo || 'Organizador de Eventos');
    const precio = esOferta
      ? (data.tarifaAproximada ? `$${data.tarifaAproximada} / hora` : 'A convenir')
      : (data.presupuesto ? `$${data.presupuesto}` : 'A convenir');
    const verificado = esOferta && data.artistaVerificado;
    const generoRaw = data.generoMusical || '';
    const areaInfo = this._getAreaInfo(generoRaw, authorTag);

    // ── Galería: primera foto o placeholder temático CSS por área musical
    let galleryHtml;
    if (fotos.length > 0) {
      const mainUrl = this.formatMediaUrl(fotos[0].url);
      galleryHtml = `
        <img src="${mainUrl}" class="detalle-gallery-main" id="detalle-main-img" alt="${data.titulo}"
          onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
        <div class="detalle-gallery-placeholder" style="display:none">
          <span class="dg-icon">${areaInfo.emoji}</span>
          <span class="dg-genre-title">${areaInfo.iconText}</span>
          <span class="dg-area-badge">Área: ${areaInfo.area}</span>
          <small class="dg-no-photo-badge">📷 Sin foto disponible</small>
        </div>
        ${fotos.length > 1 ? `
          <div class="detalle-gallery-thumbnails">
            ${fotos.slice(0, 5).map((f, i) => `
              <img src="${this.formatMediaUrl(f.url)}" class="detalle-thumb ${i === 0 ? 'active' : ''}"
                data-src="${this.formatMediaUrl(f.url)}" data-thumb-idx="${i}" alt="Foto ${i+1}" />
            `).join('')}
          </div>` : ''}
      `;
    } else {
      galleryHtml = `
        <div class="detalle-gallery-placeholder">
          <span class="dg-icon">${areaInfo.emoji}</span>
          <span class="dg-genre-title">${areaInfo.iconText}</span>
          <div class="dg-area-box">
            <span class="dg-area-label">ÁREA MUSICAL / INSTRUMENTO</span>
            <span class="dg-area-value">${areaInfo.area}</span>
          </div>
          <span class="dg-no-photo-badge">📷 Sin foto adjunta</span>
        </div>
      `;
    }

    // ── Reproductor de audio REAL
    let audioHtml = '';
    if (audios.length > 0) {
      audioHtml = `
        <div class="detalle-audio-section" id="detalle-audio-section">
          <div class="detalle-audio-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
            </svg>
            Muestra de Audio (${audios.length})
          </div>
          ${audios.map((aud, idx) => {
            const audUrl = this.formatMediaUrl(aud.url);
            const audName = aud.descripcion || aud.url.split('/').pop() || `Audio ${idx + 1}`;
            return `
              <div class="detalle-audio-player-row mb-8" data-audio-idx="${idx}">
                <button class="btn-detalle-play btn-play-audio-track" type="button" title="Reproducir">
                  <svg class="dpa-icon-play" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  <svg class="dpa-icon-pause" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="display:none"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                </button>
                <div class="detalle-audio-waveform">
                  ${Array.from({length: 18}, (_, i) => {
                    const h = [10,16,12,18,14,10,17,11,15,9,13,18,11,16,12,10,15,8][i];
                    return `<span class="bar" style="height:${h}px"></span>`;
                  }).join('')}
                </div>
                <span class="detalle-audio-time">0:00</span>
                <audio src="${audUrl}" class="detalle-audio-element" preload="metadata"></audio>
              </div>
              <div class="detalle-audio-name">🎵 ${audName}</div>
            `;
          }).join('')}
        </div>
      `;
    }

    // ── Video Demostrativo REAL
    let videoHtml = '';
    if (videos.length > 0) {
      videoHtml = `
        <div class="detalle-video-section">
          <div class="detalle-desc-label">🎬 Video Demostrativo (${videos.length})</div>
          <div class="detalle-videos-list">
            ${videos.map(v => `
              <div class="detalle-video-card">
                <video src="${this.formatMediaUrl(v.url)}" controls preload="metadata" class="detalle-video-player" playsinline></video>
                ${v.descripcion ? `<div class="detalle-video-caption">📹 ${v.descripcion}</div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // ── Grid de fotos adicionales (aparte de la principal)
    let extraMediaHtml = '';
    const extraFotos = fotos.slice(1);
    if (extraFotos.length > 0) {
      extraMediaHtml = `
        <div>
          <div class="detalle-desc-label">Galería de Fotos</div>
          <div class="detalle-media-grid">
            ${extraFotos.map(f => `
              <img src="${this.formatMediaUrl(f.url)}" class="detalle-media-thumb" alt="Foto"
                onclick="document.getElementById('detalle-main-img').src='${this.formatMediaUrl(f.url)}'" />
            `).join('')}
          </div>
        </div>
      `;
    }

    // ── Chips de metadata
    const chips = [];
    if (data.ubicacion) chips.push(`📍 ${data.ubicacion}`);
    if (generoRaw) chips.push(`🎵 ${generoRaw}`);
    if (esOferta && data.disponible !== undefined) {
      chips.push(data.disponible ? '✅ Disponible' : '🔴 No disponible');
    }
    if (!esOferta && data.abierta !== undefined) {
      chips.push(data.abierta ? '🟢 Solicitud abierta' : '🔴 Solicitud cerrada');
    }
    if (!esOferta && data.fechaEvento) {
      chips.push(`📅 ${new Date(data.fechaEvento).toLocaleDateString('es-NI', { day: 'numeric', month: 'long', year: 'numeric' })}`);
    }
    if (data.fechaPublicacion) {
      chips.push(`🕐 Publicado: ${new Date(data.fechaPublicacion).toLocaleDateString('es-NI')}`);
    }

    // ── Botón de postulación
    const idForHire = esOferta ? (data.idOfertaServicio || data.id) : (data.idSolicitudContratacion || data.id);
    const btnPostularHtml = isAuth
      ? `<button class="btn-detalle-postular" id="btn-detalle-postular"
           data-id="${idForHire}" data-solicitud="${!esOferta}" data-title="${encodeURIComponent(data.titulo)}">
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
           </svg>
           ${esOferta ? 'Solicitar Contratación' : 'Postularme como Músico'}
         </button>`
      : `<button class="btn-detalle-postular" onclick="this.disabled=true" style="opacity:0.7;cursor:not-allowed">
           Inicia sesión para ${esOferta ? 'contratar' : 'postularte'}
         </button>`;

    // ── Ensamblado del HTML final
    const galleryBgClass = this._getGenreClass(generoRaw);
    card.innerHTML = `
      <div class="detalle-gallery ${fotos.length === 0 ? ('gig-cover-wrap ' + galleryBgClass) : ''}">
        ${galleryHtml}
        <span class="detalle-gallery-badge">${esOferta ? '🎵 OFERTA MUSICAL' : '💼 SOLICITUD DE EVENTO'}</span>
        ${verificado ? `<span class="detalle-verified-badge">✓ Artista Verificado</span>` : ''}
      </div>

      <div class="detalle-body">
        <div class="detalle-header-row">
          <img src="${avatarUrl}" class="detalle-avatar" alt="${nombre}"
            onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=0d6855&color=fff'" />
          <div class="detalle-author-info">
            <span class="detalle-author-name">${nombre}</span>
            <span class="detalle-author-tag">${authorTag}</span>
          </div>
          <div class="detalle-price-badge">${precio}</div>
        </div>

        <h2 class="detalle-title">${data.titulo}</h2>

        <div class="detalle-meta-chips">
          ${chips.map(c => `<span class="detalle-chip">${c}</span>`).join('')}
        </div>

        ${audioHtml}
        ${videoHtml}

        ${data.descripcion ? `
          <div class="detalle-divider"></div>
          <div class="detalle-desc-label">Descripción</div>
          <p class="detalle-desc-text">${data.descripcion}</p>
        ` : ''}

        ${extraMediaHtml}

        ${media.length === 0 ? `
          <div style="background:#f8fafc;border-radius:12px;padding:14px 16px;text-align:center;color:#94a3b8;font-size:0.84rem;margin-top:12px;">
            📁 Sin archivos multimedia adjuntos
          </div>` : ''}

        <div class="detalle-footer">
          <button class="btn-detalle-cerrar" id="btn-detalle-cerrar">← Volver</button>
          ${btnPostularHtml}
        </div>
      </div>
    `;

    // ── Eventos del modal de detalle
    // Cerrar
    card.querySelector('#btn-detalle-cerrar')?.addEventListener('click', () => {
      const overlay = document.querySelector('#modal-detalle');
      if (overlay) overlay.style.display = 'none';
      document.body.style.overflow = '';
      document.querySelectorAll('audio.detalle-audio-element, video.detalle-video-player').forEach(a => a.pause());
    });

    // Thumbnails galería
    card.querySelectorAll('.detalle-thumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        const mainImg = card.querySelector('#detalle-main-img');
        if (mainImg) mainImg.src = thumb.dataset.src;
        card.querySelectorAll('.detalle-thumb').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
      });
    });

    // Reproductor(es) de audio real en el modal
    card.querySelectorAll('.detalle-audio-player-row').forEach(row => {
      const playBtn = row.querySelector('.btn-play-audio-track');
      const audioEl = row.querySelector('.detalle-audio-element');
      const timeEl = row.querySelector('.detalle-audio-time');
      const iconPlay = row.querySelector('.dpa-icon-play');
      const iconPause = row.querySelector('.dpa-icon-pause');

      if (playBtn && audioEl) {
        playBtn.addEventListener('click', () => {
          if (audioEl.paused) {
            // Pausar cualquier otro audio sonando
            document.querySelectorAll('audio').forEach(a => {
              if (a !== audioEl && !a.paused) {
                a.pause();
                const parentRow = a.closest('.detalle-audio-player-row');
                if (parentRow) {
                  const pI = parentRow.querySelector('.dpa-icon-play');
                  const pauI = parentRow.querySelector('.dpa-icon-pause');
                  if (pI) pI.style.display = 'block';
                  if (pauI) pauI.style.display = 'none';
                }
              }
            });

            audioEl.play().then(() => {
              if (iconPlay) iconPlay.style.display = 'none';
              if (iconPause) iconPause.style.display = 'block';
              row.closest('.detalle-audio-section')?.classList.add('playing');
            }).catch(err => console.warn('[Detalle] Error audio:', err));
          } else {
            audioEl.pause();
            if (iconPlay) iconPlay.style.display = 'block';
            if (iconPause) iconPause.style.display = 'none';
            row.closest('.detalle-audio-section')?.classList.remove('playing');
          }
        });

        audioEl.addEventListener('timeupdate', () => {
          const t = audioEl.currentTime;
          const m = Math.floor(t / 60);
          const s = Math.floor(t % 60).toString().padStart(2, '0');
          if (timeEl) timeEl.textContent = `${m}:${s}`;
        });

        audioEl.addEventListener('ended', () => {
          if (iconPlay) iconPlay.style.display = 'block';
          if (iconPause) iconPause.style.display = 'none';
          row.closest('.detalle-audio-section')?.classList.remove('playing');
          if (timeEl) timeEl.textContent = '0:00';
        });

        audioEl.addEventListener('pause', () => {
          if (iconPlay) iconPlay.style.display = 'block';
          if (iconPause) iconPause.style.display = 'none';
          row.closest('.detalle-audio-section')?.classList.remove('playing');
        });
      }
    });

    // Botón postular desde detalle
    const btnPostular = card.querySelector('#btn-detalle-postular');
    if (btnPostular && isAuth) {
      btnPostular.addEventListener('click', () => {
        // Cerrar modal detalle
        const overlay = document.querySelector('#modal-detalle');
        if (overlay) overlay.style.display = 'none';
        document.querySelectorAll('audio.detalle-audio-element').forEach(a => a.pause());

        // Abrir modal de contratación simulando click en btn-solicitar
        const gigId = btnPostular.dataset.id;
        const esSolicitud = btnPostular.dataset.solicitud === 'true';
        const titulo = decodeURIComponent(btnPostular.dataset.title || 'Servicio Musical');

        const modalHire = document.querySelector('#modal-hire-request');
        const summaryCard = document.querySelector('#hire-summary-card');
        if (summaryCard) {
          summaryCard.innerHTML = `
            <h4>${titulo}</h4>
            <p><small>${esSolicitud ? 'Postulación a Solicitud de Evento' : 'Solicitud de Contratación de Músico'}</small></p>
          `;
        }
        // Guardar el targetGigId en el form
        if (modalHire) {
          modalHire.dataset.targetId = gigId;
          modalHire.dataset.esSolicitud = esSolicitud;
          modalHire.style.display = 'flex';
        }
      });
    }
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
