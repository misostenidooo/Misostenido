/**
 * EventosPage.js — Módulo de Eventos de Misostenido
 *
 * Conectado a la API .NET (EventoController.cs) usando exactamente los DTOs:
 *   GET    /api/Evento              → EventoResumenDto[]
 *   GET    /api/Evento/{id}         → EventoDetalleDto
 *   POST   /api/Evento              → CrearEventoDto
 *   POST   /api/Evento/{id}/media   → AgregarEventoMediaDto
 *   DELETE /api/Evento/{id}
 *   DELETE /api/Evento/media/{idMedia}
 *
 * Campos por DTO:
 *   EventoResumenDto: idEvento, titulo, descripcion, tipoEvento, fechaEvento,
 *     ubicacion, infoInscripcion, fechaPublicacion, organizadorId,
 *     organizadorNombre, organizadorTipo, fotoPerfilUrl, totalMedia
 *
 *   EventoDetalleDto: (igual que Resumen) + organizadorEmail
 *     + media[] { idEventoMultimedia, idEvento, tipo, url, descripcion, fechaSubida }
 *
 *   CrearEventoDto: titulo, descripcion, tipoEvento, fechaEvento (ISO),
 *     ubicacion, infoInscripcion
 *
 *   AgregarEventoMediaDto: tipo (FOTO|VIDEO), url, descripcion
 */
import { authService } from '../../services/authService.js';
import { eventoService } from '../../services/eventoService.js';
import { storageService } from '../../services/storageService.js';
import { AuthModal } from '../../components/modal/AuthModal.js';
import { api } from '../../services/api.js';

export const EventosPage = {
  _eventos: [],
  _filtros: {
    busqueda: '',
    tipoEvento: '',
    ubicacion: '',
    soloProximos: false,
  },
  _selectedFiles: [],
  _container: null,

  // ─────────────────────────────────────────────────────────────
  // RENDER PRINCIPAL
  // ─────────────────────────────────────────────────────────────
  render() {
    const container = document.createElement('div');
    container.className = 'eventos-page animate-fade';
    this._container = container;
    this._selectedFiles = [];

    container.innerHTML = `
      <!-- =================== HERO =================== -->
      <section class="eventos-hero" id="ev-hero">
        <div class="eventos-hero-content">
          <span class="eventos-hero-pill">🎵 CARTELERA MUSICAL</span>
          <h1 class="eventos-hero-title">Eventos, Conciertos y Talleres Musicales</h1>
          <p class="eventos-hero-subtitle">Descubre y publica conciertos, masterclasses, audiciones y más en la comunidad Misostenido.</p>

          <!-- Buscador -->
          <div class="eventos-search-box">
            <div class="ev-search-field">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" id="ev-input-search" placeholder="Buscar eventos, artistas, talleres..." />
            </div>
            <div class="ev-search-divider"></div>
            <div class="ev-search-field" style="max-width:200px">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
              <input type="text" id="ev-input-ubicacion" placeholder="Ciudad (ej. Managua)" />
            </div>
            <button class="btn-ev-search" id="btn-ev-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Buscar
            </button>
          </div>
        </div>
      </section>

      <!-- =================== CONTENIDO PRINCIPAL =================== -->
      <div class="eventos-main">
        <!-- Barra superior -->
        <div class="eventos-top-bar">
          <div class="eventos-filters-row" id="ev-filters-row">
            <button class="filter-chip active" data-tipo="">🎶 Todos</button>
            <button class="filter-chip" data-tipo="Concierto">🎸 Conciertos</button>
            <button class="filter-chip" data-tipo="Festival">🎪 Festivales</button>
            <button class="filter-chip" data-tipo="Masterclass">🎓 Masterclass</button>
            <button class="filter-chip" data-tipo="Taller">🛠 Talleres</button>
            <button class="filter-chip" data-tipo="Audición">🎤 Audiciones</button>
            <button class="filter-chip" data-tipo="Jam Session">🎷 Jam Sessions</button>
          </div>
          <button class="btn-crear-evento" id="btn-ev-crear">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            + Crear Evento
          </button>
        </div>

        <!-- Cabecera resultados -->
        <div class="eventos-results-header">
          <span class="eventos-count-title" id="ev-count-title">Cargando eventos...</span>
          <select class="sort-select-ev" id="ev-sort-select">
            <option value="proximos">Más próximos</option>
            <option value="recientes">Más recientes</option>
          </select>
        </div>

        <!-- Grid -->
        <div class="eventos-grid" id="ev-grid">
          <div class="ev-grid-loading">
            <div class="ev-sk-card"></div>
            <div class="ev-sk-card"></div>
            <div class="ev-sk-card"></div>
          </div>
        </div>
      </div>

      <!-- =================== MODAL CREAR EVENTO =================== -->
      <div class="ev-modal-overlay" id="ev-modal-crear" style="display:none">
        <div class="ev-modal-card">
          <div class="ev-modal-header">
            <h3>Publicar Nuevo Evento</h3>
            <button class="ev-modal-close" id="btn-ev-close-crear">✕</button>
          </div>
          <div class="ev-modal-body">
            <form id="ev-form-crear">
              <div class="ev-form-group">
                <label>Título del evento *</label>
                <input type="text" id="ev-titulo" placeholder="Ej: Noche de Jazz & Blues en Vivo" required />
              </div>

              <div class="ev-form-row2">
                <div class="ev-form-group">
                  <label>Tipo de Evento *</label>
                  <select id="ev-tipo" required>
                    <option value="">— Selecciona —</option>
                    <option value="Concierto">🎸 Concierto</option>
                    <option value="Festival">🎪 Festival</option>
                    <option value="Masterclass">🎓 Masterclass</option>
                    <option value="Taller">🛠 Taller</option>
                    <option value="Audición">🎤 Audición</option>
                    <option value="Jam Session">🎷 Jam Session</option>
                    <option value="Otro">📅 Otro</option>
                  </select>
                </div>
                <div class="ev-form-group">
                  <label>Fecha del Evento *</label>
                  <input type="datetime-local" id="ev-fecha" required />
                </div>
              </div>

              <div class="ev-form-group">
                <label>Ubicación / Lugar *</label>
                <input type="text" id="ev-ubicacion" placeholder="Ej: Blue Note CDMX, Polanco" required />
              </div>

              <div class="ev-form-group">
                <label>Descripción del evento *</label>
                <textarea id="ev-descripcion" rows="4" placeholder="Describe el evento, artistas que participan, repertorio esperado, dresscode, etc." required></textarea>
              </div>

              <div class="ev-form-group">
                <label>Información de Inscripción / Precio de entrada</label>
                <textarea id="ev-info-inscripcion" rows="2" placeholder="Ej: Entrada libre con cupo limitado de 120 personas. Registro en eventbrite.com/misostenido"></textarea>
              </div>

              <!-- Subida de multimedia (Fotos / Videos) -->
              <div class="ev-form-group">
                <label>Fotos y Videos del Evento 📸🎬 (Supabase Storage)</label>
                <div class="ev-dropzone" id="ev-dropzone">
                  <input type="file" id="ev-file-input" multiple accept="image/*,video/*" style="display:none" />
                  <div class="ev-dropzone-icon">📁</div>
                  <p><strong>Arrastra o haz clic para subir fotos/videos</strong></p>
                  <small>JPG, PNG, WEBP, MP4, WEBM — se guardan en Supabase Storage</small>
                </div>
                <div class="ev-previews-list" id="ev-previews-list"></div>
              </div>

              <div class="ev-modal-footer">
                <button type="button" class="btn-ev-cancel" id="btn-ev-cancel-crear">Cancelar</button>
                <button type="submit" class="btn-ev-submit" id="btn-ev-submit-crear">
                  Publicar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- =================== MODAL DETALLE EVENTO =================== -->
      <div class="ev-modal-overlay" id="ev-modal-detalle" style="display:none">
        <div class="ev-detalle-card" id="ev-detalle-card">
          <div class="ev-detalle-loading">
            <div class="ev-spinner"></div>
            <span>Cargando evento...</span>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      this._moveModalsToBody(container);
      this.attachEvents(container);
      this.loadEventos(container);
    }, 0);

    return container;
  },

  // ─────────────────────────────────────────────────────────────
  // MOVER MODALES AL BODY (evita z-index corruption por transforms)
  // ─────────────────────────────────────────────────────────────
  _moveModalsToBody(container) {
    document.querySelectorAll('body > #ev-modal-crear, body > #ev-modal-detalle').forEach(old => old.remove());
    const modals = container.querySelectorAll('.ev-modal-overlay');
    modals.forEach(m => document.body.appendChild(m));
  },

  // ─────────────────────────────────────────────────────────────
  // HELPERS DE MEDIA URL
  // ─────────────────────────────────────────────────────────────
  _mediaUrl(url) {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('blob:')) return url;
    const base = api.BASE_URL.replace('/api', '');
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
  },

  _avatarUrl(fotoPerfilUrl, nombre) {
    if (fotoPerfilUrl) return this._mediaUrl(fotoPerfilUrl);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre || 'Org')}&background=0d6855&color=fff`;
  },

  // ─────────────────────────────────────────────────────────────
  // TIPO → EMOJI Y COLOR
  // ─────────────────────────────────────────────────────────────
  _tipoInfo(tipoEvento = '') {
    const mapa = {
      'Concierto':    { emoji: '🎸', color: '#6d28d9' },
      'Festival':     { emoji: '🎪', color: '#b45309' },
      'Masterclass':  { emoji: '🎓', color: '#0369a1' },
      'Taller':       { emoji: '🛠',  color: '#065f46' },
      'Audición':     { emoji: '🎤', color: '#9f1239' },
      'Jam Session':  { emoji: '🎷', color: '#c2410c' },
    };
    return mapa[tipoEvento] || { emoji: '📅', color: '#0d6855' };
  },

  // ─────────────────────────────────────────────────────────────
  // CARGAR EVENTOS DESDE LA API
  // ─────────────────────────────────────────────────────────────
  async loadEventos(container) {
    const grid = document.querySelector('#ev-grid') || container.querySelector('#ev-grid');
    const countTitle = document.querySelector('#ev-count-title') || container.querySelector('#ev-count-title');

    if (grid) {
      grid.innerHTML = `
        <div class="ev-grid-loading">
          <div class="ev-sk-card"></div>
          <div class="ev-sk-card"></div>
          <div class="ev-sk-card"></div>
        </div>`;
    }

    const { eventos } = await eventoService.getEventos({
      busqueda: this._filtros.busqueda,
      tipoEvento: this._filtros.tipoEvento,
      ubicacion: this._filtros.ubicacion,
      soloProximos: this._filtros.soloProximos,
    });

    this._eventos = eventos || [];

    if (countTitle) {
      countTitle.textContent = this._eventos.length === 0
        ? 'Sin eventos encontrados'
        : `${this._eventos.length} evento${this._eventos.length !== 1 ? 's' : ''} encontrado${this._eventos.length !== 1 ? 's' : ''}`;
    }

    if (this._eventos.length === 0) {
      if (grid) {
        grid.innerHTML = `
          <div class="ev-empty-state">
            <div class="ev-empty-icon">🎵</div>
            <h3>No hay eventos disponibles</h3>
            <p>Sé el primero en publicar un concierto, taller o masterclass en Misostenido.</p>
            <button class="btn-crear-evento" id="btn-ev-crear-empty" style="margin:0 auto">
              + Publicar Primer Evento
            </button>
          </div>`;
        grid.querySelector('#btn-ev-crear-empty')?.addEventListener('click', () => {
          document.querySelector('#btn-ev-crear')?.click();
        });
      }
      return;
    }

    // Enriquecer eventos con fotos si tienen multimedia
    await Promise.all(
      this._eventos.map(async (ev) => {
        const id = ev.idEvento || ev.IdEvento || ev.id;
        if (id && (ev.totalMedia > 0 || ev.TotalMedia > 0 || !ev.coverUrl)) {
          try {
            const det = await eventoService.getEventoDetalle(id);
            if (det && det.media && det.media.length > 0) {
              ev.media = det.media;
              const fotoObj = det.media.find(m => (m.tipo || m.Tipo || '').toUpperCase() === 'FOTO' || (m.url && m.url.match(/\.(jpg|jpeg|png|webp|gif)/i)));
              ev.coverUrl = fotoObj?.url || det.media[0].url;
            }
          } catch (e) {}
        }
      })
    );

    if (grid) {
      grid.innerHTML = this._eventos.map(ev => this._renderCard(ev)).join('');

      // Auto-abrir modal de detalle si viene el id por parámetro (ej: #/eventos?id=5)
      const hash = window.location.hash || '';
      const queryParams = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
      const targetEventoId = queryParams.get('id') || queryParams.get('evento') || queryParams.get('highlight');
      if (targetEventoId) {
        setTimeout(() => {
          this.openDetalle(targetEventoId);
          const cardEl = grid.querySelector(`[data-id="${targetEventoId}"]`);
          if (cardEl) {
            cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            cardEl.style.boxShadow = '0 0 0 4px #0d6855, 0 12px 28px rgba(13, 104, 85, 0.35)';
          }
        }, 250);
      }
    }
  },

  // ─────────────────────────────────────────────────────────────
  // RENDERIZAR CARD DE EVENTO  (EventoResumenDto)
  // Fields: idEvento, titulo, descripcion, tipoEvento, fechaEvento,
  //         ubicacion, infoInscripcion, fechaPublicacion,
  //         organizadorId, organizadorNombre, organizadorTipo,
  //         fotoPerfilUrl, totalMedia
  // ─────────────────────────────────────────────────────────────
  _renderCard(ev) {
    const id = ev.idEvento || ev.IdEvento;
    const fecha = new Date(ev.fechaEvento || ev.FechaEvento);
    const dia = fecha.getDate();
    const mes = fecha.toLocaleDateString('es-NI', { month: 'short' });
    const tipo = ev.tipoEvento || ev.TipoEvento || '';
    const tipoInfo = this._tipoInfo(tipo);
    const totalMedia = ev.totalMedia || ev.TotalMedia || (ev.media ? ev.media.length : 0);
    const organizadorNombre = ev.organizadorNombre || ev.OrganizadorNombre || 'Organizador';
    const organizadorTipo = ev.organizadorTipo || ev.OrganizadorTipo || '';
    const avatarSrc = this._avatarUrl(ev.fotoPerfilUrl || ev.FotoPerfilUrl, organizadorNombre);
    const ubicacion = ev.ubicacion || ev.Ubicacion || '';

    const rawCover = ev.coverUrl || (ev.media && ev.media[0]?.url) || null;
    const coverUrl = rawCover ? this._mediaUrl(rawCover) : null;

    const coverHtml = coverUrl
      ? `<img src="${coverUrl}" alt="${ev.titulo || ev.Titulo}" class="ev-card-cover-img" onerror="this.parentElement.innerHTML='<div class=\\'ev-cover-placeholder\\'><span class=\\'ev-placeholder-icon\\'>${tipoInfo.emoji}</span><span class=\\'ev-placeholder-type\\'>${tipo || 'Evento Musical'}</span></div>'" />`
      : `<div class="ev-cover-placeholder">
          <span class="ev-placeholder-icon">${tipoInfo.emoji}</span>
          <span class="ev-placeholder-type">${tipo || 'Evento Musical'}</span>
        </div>`;

    return `
      <article class="ev-card" data-id="${id}" tabindex="0" role="button" aria-label="Ver detalles de ${ev.titulo}">
        <div class="ev-card-cover">
          ${coverHtml}
          ${tipo ? `<span class="ev-type-badge">${tipoInfo.emoji} ${tipo}</span>` : ''}
          <div class="ev-date-badge">
            <div class="ev-day">${dia}</div>
            <div class="ev-month">${mes}</div>
          </div>
        </div>

        <div class="ev-card-body">
          <h3 class="ev-card-title">${ev.titulo || ev.Titulo}</h3>
          ${ev.descripcion ? `<p class="ev-card-desc">${ev.descripcion}</p>` : ''}

          <div class="ev-card-meta">
            ${ubicacion ? `
              <div class="ev-meta-row">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
                ${ubicacion}
              </div>` : ''}
            <div class="ev-meta-row">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              ${fecha.toLocaleDateString('es-NI', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>

          ${totalMedia > 0 ? `<div class="ev-media-indicator">📎 ${totalMedia} archivo(s) multimedia</div>` : ''}

          <div class="ev-organizer-row">
            <img src="${avatarSrc}" alt="${organizadorNombre}" class="ev-organizer-avatar"
              onerror="this.src='${this._avatarUrl('', organizadorNombre)}'" />
            <div>
              <div class="ev-organizer-name">${organizadorNombre}</div>
              ${organizadorTipo ? `<div class="ev-organizer-type">${organizadorTipo}</div>` : ''}
            </div>
          </div>

          <div class="ev-card-actions">
            <button class="btn-ev-ver btn-ev-ver-detalle" data-id="${id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              Ver Detalles
            </button>
          </div>
        </div>
      </article>`;
  },

  // ─────────────────────────────────────────────────────────────
  // ABRIR Y RENDERIZAR DETALLE  (EventoDetalleDto)
  // Fields adicionales: organizadorEmail, media[]
  //   media[]: idEventoMultimedia, idEvento, tipo(FOTO|VIDEO), url, descripcion, fechaSubida
  // ─────────────────────────────────────────────────────────────
  async openDetalle(idEvento) {
    const overlay = document.querySelector('#ev-modal-detalle');
    const card = document.querySelector('#ev-detalle-card');
    if (!overlay || !card) return;

    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    card.innerHTML = `
      <div class="ev-detalle-loading">
        <div class="ev-spinner"></div>
        <span>Cargando evento...</span>
      </div>`;

    const data = await eventoService.getEventoDetalle(idEvento);

    if (!data) {
      card.innerHTML = `
        <div class="ev-detalle-error">
          ❌ No se pudo cargar el evento. Verifica la conexión con la API.
          <button class="btn-ev-back" onclick="document.querySelector('#ev-modal-detalle').style.display='none';document.body.style.overflow=''">← Cerrar</button>
        </div>`;
      return;
    }

    this._renderDetalle(data, card);
  },

  _renderDetalle(data, card) {
    const media = data.media || data.Media || [];
    const fotos = media.filter(m => (m.tipo || m.Tipo || '').toUpperCase() === 'FOTO'
      || (m.url || m.Url || '').match(/\.(jpg|jpeg|png|gif|webp)$/i));
    const videos = media.filter(m => (m.tipo || m.Tipo || '').toUpperCase() === 'VIDEO'
      || (m.url || m.Url || '').match(/\.(mp4|webm|mov|mkv|avi)$/i));

    const tipo = data.tipoEvento || data.TipoEvento || '';
    const tipoInfo = this._tipoInfo(tipo);
    const fecha = new Date(data.fechaEvento || data.FechaEvento);
    const fechaStr = fecha.toLocaleDateString('es-NI', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const horaStr = fecha.toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' });
    const organizadorNombre = data.organizadorNombre || data.OrganizadorNombre || 'Organizador';
    const organizadorTipo = data.organizadorTipo || data.OrganizadorTipo || '';
    const organizadorEmail = data.organizadorEmail || data.OrganizadorEmail || '';
    const avatarSrc = this._avatarUrl(data.fotoPerfilUrl || data.FotoPerfilUrl, organizadorNombre);
    const ubicacion = data.ubicacion || data.Ubicacion || '';
    const infoInscripcion = data.infoInscripcion || data.InfoInscripcion || '';
    const descripcion = data.descripcion || data.Descripcion || '';
    const titulo = data.titulo || data.Titulo || '';
    const isAuth = authService.isAuthenticated();

    // Cover: primera foto real si existe
    let coverHtml;
    if (fotos.length > 0) {
      const url = this._mediaUrl(fotos[0].url || fotos[0].Url);
      coverHtml = `
        <img src="${url}" alt="${titulo}"
          onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
        <div class="ev-detalle-cover-placeholder" style="display:none">
          <span class="dp-icon">${tipoInfo.emoji}</span>
          <span class="dp-type">${tipo || 'Evento Musical'}</span>
        </div>`;
    } else {
      coverHtml = `
        <div class="ev-detalle-cover-placeholder">
          <span class="dp-icon">${tipoInfo.emoji}</span>
          <span class="dp-type">${tipo || 'Evento Musical'}</span>
        </div>`;
    }

    // Galería de fotos (máx 5 + contador "+N más")
    let galeriaHtml = '';
    if (fotos.length > 0) {
      const visibles = fotos.slice(0, 5);
      const extras = fotos.length - 5;
      galeriaHtml = `
        <div class="ev-detalle-gallery">
          <div class="ev-gallery-tabs">
            <span class="ev-gallery-tab-btn active">📷 Fotos (${fotos.length})</span>
            ${videos.length > 0 ? `<span class="ev-gallery-tab-btn" id="ev-tab-videos">🎬 Videos (${videos.length})</span>` : ''}
          </div>
          <div class="ev-gallery-grid" id="ev-gallery-fotos">
            ${visibles.map(f => {
              const fUrl = this._mediaUrl(f.url || f.Url);
              return `<img src="${fUrl}" class="ev-gallery-img" alt="${f.descripcion || f.Descripcion || 'Foto del evento'}"
                onclick="window.open('${fUrl}','_blank')"
                onerror="this.style.display='none'" />`;
            }).join('')}
            ${extras > 0 ? `<div class="ev-gallery-more">+${extras} más</div>` : ''}
          </div>
          ${videos.length > 0 ? `
          <div class="ev-video-grid" id="ev-gallery-videos" style="display:none">
            ${videos.map(v => {
              const vUrl = this._mediaUrl(v.url || v.Url);
              return `
                <div class="ev-video-item">
                  <video src="${vUrl}" controls preload="metadata" playsinline></video>
                  ${(v.descripcion || v.Descripcion) ? `<div class="ev-video-caption">📹 ${v.descripcion || v.Descripcion}</div>` : ''}
                </div>`;
            }).join('')}
          </div>` : ''}
        </div>`;
    } else if (videos.length > 0) {
      galeriaHtml = `
        <div class="ev-detalle-gallery">
          <div class="ev-gallery-tabs">
            <span class="ev-gallery-tab-btn active">🎬 Videos (${videos.length})</span>
          </div>
          <div class="ev-video-grid">
            ${videos.map(v => {
              const vUrl = this._mediaUrl(v.url || v.Url);
              return `
                <div class="ev-video-item">
                  <video src="${vUrl}" controls preload="metadata" playsinline></video>
                  ${(v.descripcion || v.Descripcion) ? `<div class="ev-video-caption">📹 ${v.descripcion || v.Descripcion}</div>` : ''}
                </div>`;
            }).join('')}
          </div>
        </div>`;
    }

    // Sin multimedia
    const sinMediaHtml = media.length === 0 ? `
      <div style="background:#f8fafc;border-radius:12px;padding:14px 16px;text-align:center;color:#94a3b8;font-size:.84rem;margin-bottom:16px;">
        📁 Sin archivos multimedia adjuntos
      </div>` : '';

    card.innerHTML = `
      <!-- Cover -->
      <div class="ev-detalle-cover">
        ${coverHtml}
        ${tipo ? `<span class="ev-detalle-cover-badge">${tipoInfo.emoji} ${tipo}</span>` : ''}
      </div>

      <!-- Cuerpo -->
      <div class="ev-detalle-body">
        <h2 class="ev-detalle-title">${titulo}</h2>

        <!-- Chips de metadata -->
        <div class="ev-detalle-chips">
          <span class="ev-detalle-chip">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            ${fechaStr}
          </span>
          <span class="ev-detalle-chip">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            ${horaStr}
          </span>
          ${ubicacion ? `<span class="ev-detalle-chip">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
            ${ubicacion}
          </span>` : ''}
          ${tipo ? `<span class="ev-detalle-chip">${tipoInfo.emoji} ${tipo}</span>` : ''}
        </div>

        <!-- Organizador -->
        <div class="ev-detalle-organizer">
          <img src="${avatarSrc}" alt="${organizadorNombre}" class="ev-detalle-org-avatar"
            onerror="this.src='${this._avatarUrl('', organizadorNombre)}'" />
          <div>
            <div class="ev-detalle-org-name">${organizadorNombre}</div>
            ${organizadorTipo ? `<div class="ev-detalle-org-type">${organizadorTipo}</div>` : ''}
            ${organizadorEmail ? `<div class="ev-detalle-org-type">✉ ${organizadorEmail}</div>` : ''}
          </div>
        </div>

        <!-- Descripción -->
        ${descripcion ? `
          <div class="ev-detalle-section-label">Sobre este evento</div>
          <p class="ev-detalle-desc">${descripcion}</p>` : ''}

        <!-- Info inscripción -->
        ${infoInscripcion ? `
          <div class="ev-detalle-section-label">Información de acceso / inscripción</div>
          <div class="ev-detalle-info-box">${infoInscripcion}</div>` : ''}

        <!-- Galería multimedia real -->
        ${galeriaHtml}
        ${sinMediaHtml}

        <!-- Footer -->
        <div class="ev-detalle-footer">
          <button class="btn-ev-back" id="btn-ev-cerrar-detalle">← Volver</button>
          ${isAuth ? `
            <button class="btn-ev-postular" id="btn-ev-compartir">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              Compartir evento
            </button>` : `
            <button class="btn-ev-postular" onclick="document.querySelector('#ev-modal-detalle').style.display='none';document.body.style.overflow=''" style="opacity:.7;cursor:not-allowed" disabled>
              Inicia sesión para más acciones
            </button>`}
        </div>
      </div>`;

    // Evento cerrar
    card.querySelector('#btn-ev-cerrar-detalle')?.addEventListener('click', () => {
      document.querySelector('#ev-modal-detalle').style.display = 'none';
      document.body.style.overflow = '';
      card.querySelectorAll('video').forEach(v => v.pause());
    });

    // Compartir (copiar link)
    card.querySelector('#btn-ev-compartir')?.addEventListener('click', () => {
      navigator.clipboard.writeText(window.location.href).then(() => {
        alert('¡Link del evento copiado al portapapeles!');
      }).catch(() => alert('No se pudo copiar el link.'));
    });

    // Tabs galería fotos/videos
    card.querySelector('#ev-tab-videos')?.addEventListener('click', (e) => {
      card.querySelectorAll('.ev-gallery-tab-btn').forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      card.querySelector('#ev-gallery-fotos') && (card.querySelector('#ev-gallery-fotos').style.display = 'none');
      card.querySelector('#ev-gallery-videos') && (card.querySelector('#ev-gallery-videos').style.display = 'flex');
    });
  },

  // ─────────────────────────────────────────────────────────────
  // RENDERIZAR PREVIEWS DE ARCHIVOS SELECCIONADOS
  // ─────────────────────────────────────────────────────────────
  _renderPreviews() {
    const list = document.querySelector('#ev-previews-list');
    if (!list) return;

    if (this._selectedFiles.length === 0) {
      list.style.display = 'none';
      list.innerHTML = '';
      return;
    }

    list.style.display = 'flex';
    list.innerHTML = this._selectedFiles.map((f, idx) => {
      const icon = f.type.startsWith('video/') ? '🎬' : '📷';
      const sizeMb = (f.size / (1024 * 1024)).toFixed(1);
      return `
        <div class="ev-preview-chip">
          ${icon} ${f.name} (${sizeMb} MB)
          <button type="button" class="chip-remove" data-idx="${idx}">✕</button>
        </div>`;
    }).join('');

    list.querySelectorAll('.chip-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.idx, 10);
        this._selectedFiles.splice(idx, 1);
        this._renderPreviews();
      });
    });
  },

  // ─────────────────────────────────────────────────────────────
  // EVENTOS E INTERACTIVIDAD
  // ─────────────────────────────────────────────────────────────
  attachEvents(container) {
    const isAuth = authService.isAuthenticated();

    // ── Buscador del hero ───
    const inputSearch = document.querySelector('#ev-input-search') || container.querySelector('#ev-input-search');
    const inputUbicacion = document.querySelector('#ev-input-ubicacion') || container.querySelector('#ev-input-ubicacion');
    const btnSearch = document.querySelector('#btn-ev-search') || container.querySelector('#btn-ev-search');

    const triggerSearch = () => {
      this._filtros.busqueda = inputSearch?.value.trim() || '';
      this._filtros.ubicacion = inputUbicacion?.value.trim() || '';
      this.loadEventos(container);
    };

    btnSearch?.addEventListener('click', triggerSearch);
    inputSearch?.addEventListener('keyup', e => { if (e.key === 'Enter') triggerSearch(); });

    // ── Chips de filtro por tipo ───
    const filtersRow = document.querySelector('#ev-filters-row') || container.querySelector('#ev-filters-row');
    filtersRow?.addEventListener('click', (e) => {
      const chip = e.target.closest('.filter-chip');
      if (!chip) return;
      filtersRow.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      this._filtros.tipoEvento = chip.dataset.tipo || '';
      this.loadEventos(container);
    });

    // ── Sort ───
    const sortSelect = document.querySelector('#ev-sort-select') || container.querySelector('#ev-sort-select');
    sortSelect?.addEventListener('change', () => {
      this._filtros.soloProximos = sortSelect.value === 'proximos';
      this.loadEventos(container);
    });

    // ── Abrir modal crear ───
    const btnCrear = document.querySelector('#btn-ev-crear') || container.querySelector('#btn-ev-crear');
    const modalCrear = document.querySelector('#ev-modal-crear');
    const formCrear = document.querySelector('#ev-form-crear');

    const openCrear = () => {
      if (!isAuth) {
        AuthModal.show('¡Crea tu Evento!', 'Debes iniciar sesión para publicar eventos en Misostenido.');
        return;
      }
      if (modalCrear) {
        modalCrear.style.display = 'flex';
        document.body.style.overflow = 'hidden';
      }
    };

    const closeCrear = () => {
      if (modalCrear) {
        modalCrear.style.display = 'none';
        document.body.style.overflow = '';
      }
      this._selectedFiles = [];
      if (formCrear) formCrear.reset();
      this._renderPreviews();
    };

    btnCrear?.addEventListener('click', openCrear);
    document.querySelector('#btn-ev-close-crear')?.addEventListener('click', closeCrear);
    document.querySelector('#btn-ev-cancel-crear')?.addEventListener('click', closeCrear);
    modalCrear?.addEventListener('click', (e) => { if (e.target === modalCrear) closeCrear(); });

    // ── Dropzone ───
    const dropzone = document.querySelector('#ev-dropzone');
    const fileInput = document.querySelector('#ev-file-input');

    dropzone?.addEventListener('click', (e) => {
      if (e.target !== fileInput) fileInput?.click();
    });
    dropzone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('drag-over');
    });
    dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
    dropzone?.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
      if (e.dataTransfer?.files?.length) {
        Array.from(e.dataTransfer.files).forEach(f => this._selectedFiles.push(f));
        this._renderPreviews();
      }
    });
    fileInput?.addEventListener('change', (e) => {
      if (e.target.files?.length) {
        Array.from(e.target.files).forEach(f => this._selectedFiles.push(f));
        this._renderPreviews();
      }
      fileInput.value = '';
    });

    // ── Submit crear evento ───
    formCrear?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.querySelector('#btn-ev-submit-crear');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Publicando...'; }

      const titulo = document.querySelector('#ev-titulo')?.value || '';
      const tipoEvento = document.querySelector('#ev-tipo')?.value || '';
      const fechaEvento = document.querySelector('#ev-fecha')?.value || '';
      const ubicacion = document.querySelector('#ev-ubicacion')?.value || '';
      const descripcion = document.querySelector('#ev-descripcion')?.value || '';
      const infoInscripcion = document.querySelector('#ev-info-inscripcion')?.value || '';

      try {
        await eventoService.crearEvento({
          titulo,
          descripcion,
          tipoEvento,
          fechaEvento,
          ubicacion,
          infoInscripcion,
          files: this._selectedFiles,
        });

        closeCrear();
        alert('¡Evento publicado exitosamente en Misostenido!');
        this.loadEventos(container);
      } catch (err) {
        alert('Error al publicar el evento: ' + (err.message || 'Verifica la conexión.'));
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Publicar Evento'; }
      }
    });

    // ── Abrir detalle al hacer clic en card o en btn-ver ───
    const grid = document.querySelector('#ev-grid') || container.querySelector('#ev-grid');
    grid?.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-ev-ver-detalle');
      const card = e.target.closest('.ev-card');
      const id = (btn?.dataset.id) || (card?.dataset.id);
      if (!id) return;
      this.openDetalle(parseInt(id, 10));
    });

    // ── Cerrar modal detalle al click en overlay ───
    const overlayDetalle = document.querySelector('#ev-modal-detalle');
    overlayDetalle?.addEventListener('click', (e) => {
      if (e.target === overlayDetalle) {
        overlayDetalle.style.display = 'none';
        document.body.style.overflow = '';
        overlayDetalle.querySelectorAll('video').forEach(v => v.pause());
      }
    });
  },
};
