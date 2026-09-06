/**
 * CreatividadPage.js — Módulo de Creatividad de Misostenido (Nicaragua)
 *
 * Directorio Musical & Plataforma Educativa:
 *  - Tiendas de guitarras, bajos e instrumentos en Nicaragua
 *  - Estudios de grabación y producción musical (Managua, León, Granada, Masaya)
 *  - Clases y Video Cursos Gratuitos de guitarra, canto, producción y teoría musical
 *  - Luthier, calibración y mantenimiento de instrumentos
 *  - Publicación de Cursos en Video y Negocios
 */
import { authService } from '../../services/authService.js';
import { creatividadService } from '../../services/creatividadService.js';
import { storageService } from '../../services/storageService.js';
import { AuthModal } from '../../components/modal/AuthModal.js';
import { api } from '../../services/api.js';

export const CreatividadPage = {
  _categorias: [],
  _negocios: [],
  _favoritos: [],
  _activeTab: 'todos', // 'todos' | 'videocursos' | 'favoritos'
  _filtros: {
    idCategoria: null,
    ciudad: '',
    busqueda: '',
    soloVerificados: false,
    soloDestacados: false,
    soloGratis: false,
    orden: 'RECIENTES',
    pagina: 1,
    tamPagina: 12
  },
  _selectedFiles: [],
  _selectedCourseFiles: [],
  _container: null,

  // ─────────────────────────────────────────────────────────────
  // MAPEO DE ÍCONOS PARA CATEGORÍAS (Emojis estéticos)
  // ─────────────────────────────────────────────────────────────
  _getCategoryIcon(icono, slug, nombre) {
    const raw = (icono || slug || nombre || '').toLowerCase().trim();
    if (raw.includes('guitar') || raw.includes('asesor')) return '🎸';
    if (raw.includes('store') || raw.includes('tienda')) return '🏪';
    if (raw.includes('book') || raw.includes('educa') || raw.includes('curso') || raw.includes('clase')) return '🎓';
    if (raw.includes('mic') || raw.includes('estudio') || raw.includes('grabaci')) return '🎙️';
    if (raw.includes('disc') || raw.includes('distrib')) return '💿';
    if (raw.includes('megaphone') || raw.includes('market') || raw.includes('promo')) return '📢';
    if (raw.includes('tool') || raw.includes('luthier') || raw.includes('mantenimiento') || raw.includes('reparac')) return '🛠️';
    if (raw.includes('scale') || raw.includes('legal') || raw.includes('derecho')) return '⚖️';
    if (icono && icono.length <= 2) return icono;
    return '🎵';
  },

  // ─────────────────────────────────────────────────────────────
  // FORMATO DE PRECIOS & MONEDA (Nicaragua: NIO C$ / USD $)
  // ─────────────────────────────────────────────────────────────
  _formatoPrecio(precioDesde, precioHasta, moneda = 'NIO') {
    const pDesde = parseFloat(precioDesde ?? 0);
    const pHasta = parseFloat(precioHasta ?? 0);

    if (pDesde === 0 && (pHasta === 0 || isNaN(pHasta))) {
      return '<span class="cr-badge-gratis">🎉 GRATIS</span>';
    }

    const sim = (moneda === 'USD') ? '$' : 'C$';
    const cod = (moneda === 'USD') ? 'USD' : 'NIO';

    if (pDesde > 0 && pHasta > pDesde) {
      return `<span class="cr-precio-num">${sim} ${pDesde.toLocaleString()} - ${pHasta.toLocaleString()} <small>${cod}</small></span>`;
    }
    if (pDesde > 0) {
      return `<span class="cr-precio-num">Desde ${sim} ${pDesde.toLocaleString()} <small>${cod}</small></span>`;
    }
    return '<span class="cr-precio-consultar">Consultar precios</span>';
  },

  // ─────────────────────────────────────────────────────────────
  // PARSEADOR DE VIDEOS (YouTube / Archivos MP4)
  // ─────────────────────────────────────────────────────────────
  _parseVideoUrl(url) {
    if (!url) return null;
    const clean = url.trim();
    const ytMatch = clean.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch && ytMatch[1]) {
      const id = ytMatch[1];
      return { 
        type: 'youtube', 
        id,
        embedUrl: `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&enablejsapi=1`,
        watchUrl: `https://www.youtube.com/watch?v=${id}`
      };
    }
    if (clean.match(/\.(mp4|webm|mov|mkv|avi)$/i) || clean.startsWith('blob:')) {
      return { type: 'file', url: clean };
    }
    return { type: 'file', url: clean };
  },

  // ─────────────────────────────────────────────────────────────
  // RENDER PRINCIPAL
  // ─────────────────────────────────────────────────────────────
  render() {
    const container = document.createElement('div');
    container.className = 'creatividad-page animate-fade';
    this._container = container;
    this._selectedFiles = [];
    this._selectedCourseFiles = [];

    container.innerHTML = `
      <!-- =================== HERO =================== -->
      <section class="creatividad-hero" id="cr-hero">
        <div class="creatividad-hero-content">
          <span class="creatividad-hero-pill">🇳🇮 NICARAGUA • ECOSISTEMA CREATIVO & DIRECTORIO</span>
          <h1 class="creatividad-hero-title">Tiendas de Instrumentos, Video Cursos Gratis y Estudios</h1>
          <p class="creatividad-hero-subtitle">Encuentra dónde comprar guitarras, aprender con clases y cursos en video gratuitos, calibrar tus instrumentos con luthiers o grabar en estudios de Managua, León, Granada y todo el país.</p>

          <!-- Buscador Predictivo -->
          <div class="creatividad-search-box">
            <div class="cr-search-field">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" id="cr-input-search" placeholder="Busca tiendas de guitarras, video clases gratis, estudios..." />
            </div>
            <div class="cr-search-divider"></div>
            <div class="cr-search-field" style="max-width:220px">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
              <input type="text" id="cr-input-ciudad" placeholder="Ciudad (Managua, León...)" />
            </div>
            <button class="btn-cr-search" id="btn-cr-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Buscar
            </button>
          </div>
        </div>
      </section>

      <!-- =================== CATEGORÍAS RIBBON (Flujo natural) =================== -->
      <div class="creatividad-categories-ribbon" id="cr-cat-ribbon">
        <button class="cr-cat-chip active" data-id="">
          <span class="cr-chip-icon">✨</span>
          <span>Todas</span>
        </button>
      </div>

      <!-- =================== CONTENIDO PRINCIPAL =================== -->
      <div class="creatividad-main">
        <!-- Barra superior de navegación y acciones -->
        <div class="creatividad-top-bar">
          <div class="creatividad-views-tabs">
            <button class="cr-view-tab active" id="tab-cr-todos">
              <span>🏢 Directorio General</span>
            </button>
            <button class="cr-view-tab" id="tab-cr-videocursos">
              <span>🎬 Video Cursos & Clases Gratis</span>
            </button>
            <button class="cr-view-tab" id="tab-cr-favoritos">
              <span>❤️ Mis Guardados</span>
            </button>
          </div>

          <div class="creatividad-quick-actions">
            <button class="btn-crear-curso-quick" id="btn-cr-crear-curso">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
              + Publicar Curso / Video
            </button>
            <button class="btn-crear-negocio" id="btn-cr-crear">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              + Publicar Negocio o Tienda
            </button>
          </div>
        </div>

        <!-- Filtros secundarios y conteo -->
        <div class="creatividad-results-header">
          <span class="cr-count-title" id="cr-count-title">Cargando directorio de Nicaragua...</span>
          
          <div class="cr-filter-toggles">
            <label class="cr-checkbox-label">
              <input type="checkbox" id="chk-gratis" />
              <span>Cursos Gratis 🎁</span>
            </label>
            <label class="cr-checkbox-label">
              <input type="checkbox" id="chk-verificados" />
              <span>Verificados ✅</span>
            </label>
            <label class="cr-checkbox-label">
              <input type="checkbox" id="chk-destacados" />
              <span>Destacados ⭐</span>
            </label>
            <select class="sort-select-cr" id="cr-sort-select">
              <option value="RECIENTES">Más recientes</option>
              <option value="CALIFICACION">Mejor calificados</option>
              <option value="VISTAS">Más populares</option>
            </select>
          </div>
        </div>

        <!-- Grid de Negocios y Cursos -->
        <div class="creatividad-grid" id="cr-grid">
          <div class="cr-grid-loading">
            <div class="cr-sk-card"></div>
            <div class="cr-sk-card"></div>
            <div class="cr-sk-card"></div>
          </div>
        </div>
      </div>

      <!-- =================== MODAL 1: REGISTRAR NEGOCIO O TIENDA =================== -->
      <div class="cr-modal-overlay" id="cr-modal-crear" style="display:none">
        <div class="cr-modal-card">
          <div class="cr-modal-header">
            <h3>🏢 Registrar Negocio, Tienda o Estudio en Nicaragua</h3>
            <button class="cr-modal-close" id="btn-cr-close-crear">✕</button>
          </div>
          <div class="cr-modal-body">
            <form id="cr-form-crear">
              <div class="cr-form-row2">
                <div class="cr-form-group">
                  <label>Categoría *</label>
                  <select id="cr-form-categoria" required>
                    <option value="">— Selecciona Categoría —</option>
                    <option value="2">🏪 Tiendas de Instrumentos & Guitarras</option>
                    <option value="3">🎓 Educación, Clases & Video Cursos</option>
                    <option value="4">🎙️ Estudios de Grabación & Mezcla</option>
                    <option value="7">🛠️ Luthier & Mantenimiento de Instrumentos</option>
                    <option value="1">🎸 Asesoría Artística & Producción</option>
                    <option value="5">💿 Distribución Musical (Spotify / Apple)</option>
                    <option value="6">📢 Marketing & Promoción Musical</option>
                  </select>
                </div>
                <div class="cr-form-group">
                  <label>Nombre del Negocio / Tienda *</label>
                  <input type="text" id="cr-form-nombre" placeholder="Ej: La Guitarra Shop Managua" required />
                </div>
              </div>

              <div class="cr-form-group">
                <label>Eslogan o Frase Destacada</label>
                <input type="text" id="cr-form-slogan" placeholder="Ej: Venta de guitarras acústicas, cuerdas y accesorios" />
              </div>

              <div class="cr-form-group">
                <label>Descripción Completa *</label>
                <textarea id="cr-form-descripcion" rows="3" placeholder="Describe los productos, marcas (Fender, Yamaha, Ibanez), servicios de grabación o clases que ofreces en Nicaragua..." required></textarea>
              </div>

              <div class="cr-form-row2">
                <div class="cr-form-group">
                  <label>Ciudad en Nicaragua *</label>
                  <input type="text" id="cr-form-ciudad" placeholder="Ej: Managua, León, Granada, Masaya, Estelí" required />
                </div>
                <div class="cr-form-group">
                  <label>Dirección / Ubicación Física</label>
                  <input type="text" id="cr-form-direccion" placeholder="Ej: De los semáforos de Plaza El Sol 2c al sur" />
                </div>
              </div>

              <div class="cr-form-row3">
                <div class="cr-form-group">
                  <label>Teléfono Convencional</label>
                  <input type="text" id="cr-form-telefono" placeholder="+505 2278 0000" />
                </div>
                <div class="cr-form-group">
                  <label>WhatsApp Oficial *</label>
                  <input type="text" id="cr-form-whatsapp" placeholder="+505 8888 8888" />
                </div>
                <div class="cr-form-group">
                  <label>Email de Contacto</label>
                  <input type="email" id="cr-form-email" placeholder="contacto@tienda.ni" />
                </div>
              </div>

              <div class="cr-form-row2">
                <div class="cr-form-group">
                  <label>Sitio Web o Redes</label>
                  <input type="url" id="cr-form-web" placeholder="https://www.minegocio.com" />
                </div>
                <div class="cr-form-group">
                  <label>Horario de Atención</label>
                  <input type="text" id="cr-form-horario" placeholder="Lun-Sáb 9:00am - 6:00pm" />
                </div>
              </div>

              <div class="cr-form-row3">
                <div class="cr-form-group">
                  <label>Precio Desde (C$)</label>
                  <input type="number" id="cr-form-preciodesde" placeholder="0 si es gratis" />
                </div>
                <div class="cr-form-group">
                  <label>Precio Hasta (C$)</label>
                  <input type="number" id="cr-form-preciohasta" placeholder="Ej: 3500" />
                </div>
                <div class="cr-form-group">
                  <label>Moneda</label>
                  <select id="cr-form-moneda">
                    <option value="NIO">Córdobas (C$ NIO)</option>
                    <option value="USD">Dólares ($ USD)</option>
                  </select>
                </div>
              </div>

              <div class="cr-form-group">
                <label>Fotos y Videos del Negocio / Muestras 📸🎬</label>
                <div class="cr-dropzone" id="cr-dropzone">
                  <input type="file" id="cr-file-input" multiple accept="image/*,video/*" style="display:none" />
                  <div style="font-size:1.8rem;margin-bottom:6px">📁</div>
                  <p style="margin:0;font-weight:700">Arrastra o haz clic para subir fotos y videos</p>
                  <small style="color:#64748b">Formatos JPG, PNG, WEBP, MP4, WEBM (Se guardan en Supabase Storage)</small>
                </div>
                <div id="cr-previews-list" style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"></div>
              </div>

              <div class="cr-modal-footer">
                <button type="button" class="btn-cr-cancel" id="btn-cr-cancel-crear">Cancelar</button>
                <button type="submit" class="btn-cr-submit" id="btn-cr-submit-crear">Guardar y Publicar Negocio</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- =================== MODAL 2: PUBLICAR CURSO / VIDEO CLASE =================== -->
      <div class="cr-modal-overlay" id="cr-modal-crear-curso" style="display:none">
        <div class="cr-modal-card">
          <div class="cr-modal-header">
            <h3>🎓 Publicar Nuevo Curso o Video Clase</h3>
            <button class="cr-modal-close" id="btn-cr-close-crear-curso">✕</button>
          </div>
          <div class="cr-modal-body">
            <form id="cr-form-crear-curso">
              <div class="cr-form-group">
                <label>Asociación del Curso o Video Clase</label>
                <select id="cr-curso-negocio">
                  <option value="0" selected>🎓 Curso Libre / Músico Independiente (Sin asociar a negocio)</option>
                  <!-- Negocios cargados dinámicamente -->
                </select>
                <small style="color:#64748b;font-size:0.75rem">Puedes subirlo como artista independiente libre o asociarlo a tu academia/tienda en Nicaragua.</small>
              </div>

              <div class="cr-form-group">
                <label>Título del Curso, Clase o Tutorial *</label>
                <input type="text" id="cr-curso-titulo" placeholder="Ej: Clase de Guitarra Acústica - Acordes y Técnicas" required />
              </div>

              <div class="cr-form-row2">
                <div class="cr-form-group">
                  <label>Nivel de Dificultad *</label>
                  <select id="cr-curso-nivel" required>
                    <option value="Principiante">Principiante (Desde Cero)</option>
                    <option value="Intermedio">Intermedio</option>
                    <option value="Avanzado">Avanzado</option>
                    <option value="Todos los niveles">Todos los niveles</option>
                  </select>
                </div>
                <div class="cr-form-group">
                  <label>Modalidad *</label>
                  <select id="cr-curso-modalidad" required>
                    <option value="Online / Video">Online / Video Clase Bajo Demanda</option>
                    <option value="Presencial">Presencial</option>
                    <option value="Híbrido">Híbrido (Video + Presencial)</option>
                    <option value="En Vivo por Zoom">En Vivo por Zoom / Meet</option>
                  </select>
                </div>
              </div>

              <!-- Tipo de Acceso: GRATIS vs DE PAGO -->
              <div class="cr-form-group" style="background:#f1f5f9;padding:14px 16px;border-radius:12px;border:1px solid #cbd5e1">
                <label style="margin-bottom:8px">Tipo de Acceso *</label>
                <div style="display:flex;gap:20px;align-items:center">
                  <label class="cr-radio-label" style="display:flex;align-items:center;gap:6px;cursor:pointer;font-weight:700;color:#059669">
                    <input type="radio" name="cr-tipo-precio" value="gratis" id="rad-curso-gratis" checked />
                    <span>🎁 100% GRATIS (Acceso Libre)</span>
                  </label>
                  <label class="cr-radio-label" style="display:flex;align-items:center;gap:6px;cursor:pointer;font-weight:700;color:#0f2e26">
                    <input type="radio" name="cr-tipo-precio" value="pago" id="rad-curso-pago" />
                    <span>💳 De Pago (C$ NIO)</span>
                  </label>
                </div>
              </div>

              <div class="cr-form-row2" id="box-precio-curso" style="display:none">
                <div class="cr-form-group">
                  <label>Precio del Curso (C$ Córdobas) *</label>
                  <input type="number" id="cr-curso-precio" placeholder="Ej: 500" value="0" />
                </div>
                <div class="cr-form-group">
                  <label>Cupos Disponibles</label>
                  <input type="number" id="cr-curso-cupos" placeholder="Ej: 20 (dejar vacío si ilimitado)" />
                </div>
              </div>

              <!-- Subida de Archivos Multimedia: Videos, Audio o Imágenes -->
              <div class="cr-form-group">
                <label>Subir Contenido Multimedia (Videos MP4, Audios MP3/WAV, Imágenes) 🎥🎵🖼️</label>
                <div class="cr-dropzone" id="cr-curso-dropzone" style="border:2px dashed #059669;background:#f0fdf4;padding:18px 16px;text-align:center;border-radius:12px;cursor:pointer">
                  <input type="file" id="cr-curso-file-input" multiple accept="video/*,audio/*,image/*" style="display:none" />
                  <div style="font-size:1.8rem;margin-bottom:4px">🎬 🎵 📸</div>
                  <p style="margin:0;font-weight:700;color:#065f46">Haz clic o arrastra aquí tu Video, Pista de Audio o Portada</p>
                  <small style="color:#047857">Formatos compatibles: MP4, WebM, MP3, WAV, JPG, PNG</small>
                </div>
                <div id="cr-curso-previews-list" style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"></div>
              </div>

              <!-- Enlace de Video Tutorial / Clase YouTube o Vimeo -->
              <div class="cr-form-group">
                <label>O Enlace de Streaming (YouTube / Vimeo / URL Directa) 🎬</label>
                <input type="url" id="cr-curso-videourl" placeholder="https://www.youtube.com/watch?v=... o enlace de video" />
                <small style="color:#64748b;font-size:0.75rem">Permite a los usuarios reproducir y ver la clase directamente dentro de la plataforma.</small>
              </div>

              <div class="cr-form-row2">
                <div class="cr-form-group">
                  <label>Duración Estimada</label>
                  <input type="text" id="cr-curso-duracion" placeholder="Ej: 4 semanas / 45 minutos" />
                </div>
                <div class="cr-form-group">
                  <label>Horario o Disponibilidad</label>
                  <input type="text" id="cr-curso-horario" placeholder="Ej: Acceso libre 24/7 o Sábados 2pm" />
                </div>
              </div>

              <div class="cr-form-group">
                <label>Descripción y Temario del Curso *</label>
                <textarea id="cr-curso-descripcion" rows="3" placeholder="Detalla los acordes, técnicas, canciones o temas que aprenderán los alumnos..." required></textarea>
              </div>

              <div class="cr-modal-footer">
                <button type="button" class="btn-cr-cancel" id="btn-cr-cancel-crear-curso">Cancelar</button>
                <button type="submit" class="btn-cr-submit" id="btn-cr-submit-crear-curso" style="background:linear-gradient(135deg,#059669 0%,#0d6855 100%)">Publicar Curso / Clase</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- =================== MODAL 3: DETALLE DE NEGOCIO =================== -->
      <div class="cr-modal-overlay" id="cr-modal-detalle" style="display:none">
        <div class="cr-detalle-card" id="cr-detalle-card">
          <div style="padding:48px;text-align:center">
            <div class="cr-sk-card" style="height:200px"></div>
          </div>
        </div>
      </div>

      <!-- =================== MODAL 4: REPRODUCTOR DE VIDEO EN LÍNEA =================== -->
      <div class="cr-modal-overlay" id="cr-modal-video" style="display:none">
        <div class="cr-video-modal-card" id="cr-video-card">
          <div class="cr-modal-header">
            <h3 id="cr-video-modal-title">🎬 Video Clase en Línea</h3>
            <button class="cr-modal-close" id="btn-cr-close-video">✕</button>
          </div>
          <div class="cr-video-container" id="cr-video-player-box"></div>
        </div>
      </div>
    `;

    setTimeout(() => {
      this._moveModalsToBody(container);
      this.attachEvents(container);
      this.loadCategorias(container);
      this.loadNegocios(container);
    }, 0);

    return container;
  },

  // ─────────────────────────────────────────────────────────────
  // MOVER MODALES AL BODY
  // ─────────────────────────────────────────────────────────────
  _moveModalsToBody(container) {
    document.querySelectorAll('body > #cr-modal-crear, body > #cr-modal-crear-curso, body > #cr-modal-detalle, body > #cr-modal-video').forEach(old => old.remove());
    const modals = container.querySelectorAll('.cr-modal-overlay');
    modals.forEach(m => document.body.appendChild(m));
  },

  _mediaUrl(url) {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('blob:')) return url;
    const base = api.BASE_URL.replace('/api', '');
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
  },

  _renderStars(calificacion = 0) {
    const val = Math.round(calificacion);
    let html = '';
    for (let i = 1; i <= 5; i++) {
      html += i <= val ? '★' : '☆';
    }
    return html;
  },

  // ─────────────────────────────────────────────────────────────
  // CARGAR CATEGORÍAS
  // ─────────────────────────────────────────────────────────────
  async loadCategorias(container) {
    const ribbon = document.querySelector('#cr-cat-ribbon') || container.querySelector('#cr-cat-ribbon');
    const select = document.querySelector('#cr-form-categoria');

    const categorias = await creatividadService.getCategorias();
    this._categorias = categorias;

    if (ribbon && categorias.length > 0) {
      ribbon.innerHTML = `
        <button class="cr-cat-chip active" data-id="">
          <span class="cr-chip-icon">✨</span>
          <span>Todas</span>
        </button>
        ${categorias.map(c => {
          const emoji = this._getCategoryIcon(c.icono, c.slug, c.nombre);
          return `
            <button class="cr-cat-chip" data-id="${c.idCategoria}">
              <span class="cr-chip-icon">${emoji}</span>
              <span>${c.nombre}</span>
            </button>
          `;
        }).join('')}
      `;

      ribbon.querySelectorAll('.cr-cat-chip').forEach(btn => {
        btn.addEventListener('click', () => {
          ribbon.querySelectorAll('.cr-cat-chip').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const id = btn.getAttribute('data-id');
          this._filtros.idCategoria = id ? parseInt(id, 10) : null;
          this.loadNegocios(container);
        });
      });
    }

    if (select && categorias.length > 0) {
      select.innerHTML = `<option value="">— Selecciona Categoría —</option>` +
        categorias.map(c => {
          const emoji = this._getCategoryIcon(c.icono, c.slug, c.nombre);
          return `<option value="${c.idCategoria}">${emoji} ${c.nombre}</option>`;
        }).join('');
    }
  },

  // ─────────────────────────────────────────────────────────────
  // CARGAR NEGOCIOS Y CURSOS
  // ─────────────────────────────────────────────────────────────
  async loadNegocios(container) {
    const grid = document.querySelector('#cr-grid') || container.querySelector('#cr-grid');
    const countTitle = document.querySelector('#cr-count-title') || container.querySelector('#cr-count-title');

    if (grid) {
      grid.innerHTML = `
        <div class="cr-grid-loading">
          <div class="cr-sk-card"></div>
          <div class="cr-sk-card"></div>
          <div class="cr-sk-card"></div>
        </div>`;
    }

    // Pestaña Favoritos
    if (this._activeTab === 'favoritos') {
      const favs = await creatividadService.getFavoritos();
      this._favoritos = favs;
      if (countTitle) {
        countTitle.textContent = favs.length === 0
          ? 'No tienes negocios guardados'
          : `${favs.length} negocio${favs.length !== 1 ? 's' : ''} guardado${favs.length !== 1 ? 's' : ''} en Favoritos`;
      }
      if (favs.length === 0) {
        if (grid) {
          grid.innerHTML = `
            <div class="cr-empty-state">
              <div class="cr-empty-icon">❤️</div>
              <h3>Aún no tienes favoritos guardados</h3>
              <p>Haz clic en el ícono de corazón en cualquier tienda, curso de guitarra o estudio para guardarlo aquí.</p>
            </div>`;
        }
        return;
      }
      if (grid) {
        grid.innerHTML = favs.map(n => this._renderCard(n, true)).join('');
      }
      return;
    }

    // Pestaña Video Cursos & Clases Gratis (Carga directamente desde CursoCreatividad)
    if (this._activeTab === 'videocursos') {
      const cursos = await creatividadService.getCursos({
        busqueda: this._filtros.busqueda,
        soloGratis: this._filtros.soloGratis
      });

      if (countTitle) {
        countTitle.textContent = cursos.length === 0
          ? 'No hay video cursos publicados aún en Nicaragua'
          : `${cursos.length} video clase${cursos.length !== 1 ? 's' : ''} y curso${cursos.length !== 1 ? 's' : ''} en Nicaragua`;
      }

      if (cursos.length === 0) {
        if (grid) {
          grid.innerHTML = `
            <div class="cr-empty-state">
              <div class="cr-empty-icon">🎓</div>
              <h3>No hay video cursos con estos filtros</h3>
              <p>Sé el primero en subir un video tutorial, masterclass o pista demostrativa en Nicaragua.</p>
              <div style="margin-top:16px">
                <button class="btn-crear-curso-quick" id="btn-cr-crear-curso-empty">+ Publicar Mi Video Clase</button>
              </div>
            </div>`;
          grid.querySelector('#btn-cr-crear-curso-empty')?.addEventListener('click', () => {
            document.querySelector('#btn-cr-crear-curso')?.click();
          });
        }
        return;
      }

      if (grid) {
        grid.innerHTML = cursos.map(c => this._renderCursoCard(c)).join('');
      }
      return;
    }

    const { negocios } = await creatividadService.getNegocios(this._filtros);
    let lista = (negocios || []).filter(n => {
      const p = (n.pais || n.Pais || '').toLowerCase();
      const c = (n.ciudad || n.Ciudad || '').toLowerCase();
      const nom = (n.nombre || n.Nombre || '').toLowerCase();
      return !p.includes('mexic') && !c.includes('cdmx') && !c.includes('monterrey') && !c.includes('guadalajara') && !nom.includes('mexico');
    });

    // Filtro de solo gratis
    if (this._filtros.soloGratis) {
      lista = lista.filter(n => (parseFloat(n.precioDesde ?? n.precio_desde ?? 0) === 0));
    }

    this._negocios = lista;

    // Actualizar select de negocios en el modal de Crear Curso
    this._populateNegociosSelect(lista);

    if (countTitle) {
      countTitle.textContent = this._negocios.length === 0
        ? 'No se encontraron resultados en Nicaragua'
        : `${this._negocios.length} negocio${this._negocios.length !== 1 ? 's' : ''} en el directorio`;
    }

    if (this._negocios.length === 0) {
      if (grid) {
        grid.innerHTML = `
          <div class="cr-empty-state">
            <div class="cr-empty-icon">🎸</div>
            <h3>No encontramos resultados con esos filtros</h3>
            <p>Prueba con otros términos de búsqueda o publica tu tienda, taller o video curso en Nicaragua.</p>
            <div style="display:flex;gap:12px;justify-content:center;margin-top:16px">
              <button class="btn-crear-curso-quick" id="btn-cr-crear-curso-empty">
                + Publicar Video Curso Gratis
              </button>
              <button class="btn-crear-negocio" id="btn-cr-crear-empty">
                + Publicar Tienda o Estudio
              </button>
            </div>
          </div>`;
        grid.querySelector('#btn-cr-crear-empty')?.addEventListener('click', () => {
          document.querySelector('#btn-cr-crear')?.click();
        });
        grid.querySelector('#btn-cr-crear-curso-empty')?.addEventListener('click', () => {
          document.querySelector('#btn-cr-crear-curso')?.click();
        });
      }
      return;
    }

    if (grid) {
      grid.innerHTML = this._negocios.map(n => this._renderCard(n)).join('');

      // Auto-abrir modal de detalle si viene el id por parámetro (ej: #/creatividad?id=5)
      const hash = window.location.hash || '';
      const queryParams = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
      const targetId = queryParams.get('id') || queryParams.get('negocio') || queryParams.get('highlight');
      if (targetId) {
        setTimeout(() => {
          this.openDetalle(targetId);
          const cardEl = grid.querySelector(`[data-id="${targetId}"]`);
          if (cardEl) {
            cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            cardEl.style.boxShadow = '0 0 0 4px #0d6855, 0 12px 28px rgba(13, 104, 85, 0.35)';
          }
        }, 250);
      }
    }
  },

  _populateNegociosSelect(negocios) {
    const select = document.querySelector('#cr-curso-negocio');
    if (!select) return;
    const nicas = (negocios || []).filter(n => {
      const p = (n.pais || n.Pais || '').toLowerCase();
      const c = (n.ciudad || n.Ciudad || '').toLowerCase();
      const nom = (n.nombre || n.Nombre || '').toLowerCase();
      return !p.includes('mexic') && !c.includes('cdmx') && !c.includes('monterrey') && !c.includes('guadalajara') && !nom.includes('mexico');
    });

    select.innerHTML = `
      <option value="0" selected>🎓 Curso Libre / Músico Independiente (Sin asociar a negocio)</option>
      ${nicas.length > 0 ? `
        <optgroup label="🏢 Asociar a una Academia o Negocio de Nicaragua:">
          ${nicas.map(n => `<option value="${n.idNegocio || n.IdNegocio}">${n.nombre || n.Nombre} (${n.ciudad || n.Ciudad || 'Nicaragua'})</option>`).join('')}
        </optgroup>
      ` : ''}
    `;
  },

  // ─────────────────────────────────────────────────────────────
  // RENDER CARD DE CURSO O VIDEO CLASE
  // ─────────────────────────────────────────────────────────────
  _renderCursoCard(c) {
    const id = c.idCurso || c.IdCurso;
    const nombre = c.nombreCurso || c.NombreCurso || 'Video Clase de Música';
    const desc = c.descripcion || c.Descripcion || '';
    const nivel = c.nivel || c.Nivel || 'Todos los niveles';
    const modalidad = c.modalidad || c.Modalidad || 'Online';
    const duracion = c.duracion || c.Duracion || '';
    const precio = parseFloat(c.precio ?? c.Precio ?? 0);
    const esGratis = precio === 0;
    const precioHtml = esGratis ? '<span class="cr-badge-gratis">🎉 GRATIS</span>' : `<span class="cr-precio-num">C$ ${precio.toLocaleString()} <small>NIO</small></span>`;
    const videoUrl = c.videoUrl || c.video_url || c.VideoUrl || '';
    const audioUrl = c.audioUrl || c.audio_url || c.AudioUrl || '';
    const portada = c.imagenUrl || c.imagen_url || c.ImagenUrl || c.negocioPortadaUrl || c.NegocioPortadaUrl || '';
    const autor = c.nombreNegocio || c.NombreNegocio || 'Músico Independiente';
    const ciudad = c.ciudad || c.Ciudad || 'Nicaragua';

    const coverHtml = portada ? `
      <img src="${this._mediaUrl(portada)}" alt="${nombre}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
      <div class="cr-cover-placeholder" style="display:none">
        <span class="cr-ph-icon">🎓</span>
        <span class="cr-ph-cat">Video Clase</span>
      </div>` : `
      <div class="cr-cover-placeholder" style="background:linear-gradient(135deg,#064e3b 0%,#0f766e 100%)">
        <span class="cr-ph-icon">${videoUrl ? '🎬' : (audioUrl ? '🎵' : '🎓')}</span>
        <span class="cr-ph-cat">${modalidad}</span>
      </div>`;

    return `
      <article class="cr-card cr-curso-item" data-id="${id}">
        <div class="cr-card-cover">
          ${coverHtml}
          <div class="cr-badge-cat">🎓 ${modalidad}</div>
          ${esGratis ? '<div class="cr-badge-destacado" style="background:#059669">🎁 GRATIS</div>' : ''}
          ${videoUrl ? `
            <button class="btn-quick-play-cover btn-cr-ver-video-curso" data-title="${nombre}" data-desc="${desc}" data-url="${videoUrl}" title="Ver Video Clase" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(5,150,105,0.9);color:#fff;border:none;border-radius:50%;width:50px;height:50px;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 15px rgba(0,0,0,0.3)">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </button>
          ` : ''}
        </div>

        <div class="cr-card-body">
          <div class="cr-card-header-row">
            <h3 class="cr-card-title">${nombre}</h3>
          </div>

          <div class="cr-card-slogan" style="color:#059669;font-weight:700">
            🧑‍🏫 ${autor} • 📍 ${ciudad}
          </div>

          ${desc ? `<p class="cr-card-desc">${desc}</p>` : ''}

          <div class="cr-curso-tags" style="display:flex;gap:6px;flex-wrap:wrap;margin:10px 0">
            <span class="cr-curso-tag" style="background:#e0f2fe;color:#0369a1;padding:3px 8px;border-radius:6px;font-size:0.75rem;font-weight:600">Nivel: ${nivel}</span>
            ${duracion ? `<span class="cr-curso-tag" style="background:#f1f5f9;color:#475569;padding:3px 8px;border-radius:6px;font-size:0.75rem;font-weight:600">⏱ ${duracion}</span>` : ''}
          </div>

          ${audioUrl ? `
            <div style="margin:8px 0">
              <small style="color:#0f2e26;font-weight:700;display:block;margin-bottom:3px">🎵 Pista / Audio Demostrativo:</small>
              <audio controls src="${this._mediaUrl(audioUrl)}" style="width:100%;height:34px;border-radius:6px"></audio>
            </div>
          ` : ''}

          <div class="cr-card-footer">
            <div class="cr-price-tag">
              ${precioHtml}
            </div>
            ${videoUrl ? `
              <button class="btn-cr-ver-video-curso" data-title="${nombre}" data-desc="${desc}" data-url="${videoUrl}" style="padding:7px 14px;background:#059669;color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                <span>Ver Clase</span>
              </button>
            ` : `
              <span style="font-size:0.8rem;color:#64748b;font-weight:600">Video en preparación</span>
            `}
          </div>
        </div>
      </article>
    `;
  },

  // ─────────────────────────────────────────────────────────────
  // RENDER CARD DE NEGOCIO
  // ─────────────────────────────────────────────────────────────
  _renderCard(n, esFavoritoTab = false) {
    const id = n.idNegocio || n.IdNegocio;
    const nombre = n.nombre || n.Nombre || 'Negocio Musical';
    const slogan = n.slogan || n.Slogan || '';
    const desc = n.descripcion || n.Descripcion || '';
    const cat = n.categoria || n.Categoria || 'Música';
    const icono = this._getCategoryIcon(n.categoriaIcono || n.categoria_icono, n.categoriaSlug, cat);
    const ciudad = n.ciudad || n.Ciudad || 'Managua, Nicaragua';
    const verificado = n.verificado || n.Verificado;
    const destacado = n.destacado || n.Destacado;
    const calif = n.calificacionPromedio ?? n.CalificacionPromedio ?? 5.0;
    const totalRes = n.totalResenas ?? n.TotalResenas ?? 0;
    const portada = n.imagenPortadaUrl || n.imagen_portada_url || n.ImagenPortadaUrl;
    const precioDesde = n.precioDesde ?? n.precio_desde ?? n.PrecioDesde;
    const precioHasta = n.precioHasta ?? n.precio_hasta ?? n.PrecioHasta;
    const moneda = n.moneda || n.Moneda || 'NIO';

    const precioHtml = this._formatoPrecio(precioDesde, precioHasta, moneda);

    const coverHtml = portada ? `
      <img src="${this._mediaUrl(portada)}" alt="${nombre}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
      <div class="cr-cover-placeholder" style="display:none">
        <span class="cr-ph-icon">${icono}</span>
        <span class="cr-ph-cat">${cat}</span>
      </div>` : `
      <div class="cr-cover-placeholder">
        <span class="cr-ph-icon">${icono}</span>
        <span class="cr-ph-cat">${cat}</span>
      </div>`;

    return `
      <article class="cr-card" data-id="${id}">
        <div class="cr-card-cover">
          ${coverHtml}
          <div class="cr-badge-cat">${icono} ${cat}</div>
          ${destacado ? `<div class="cr-badge-destacado">⭐ Destacado</div>` : ''}
          <button class="btn-cr-favorite-card ${esFavoritoTab ? 'active' : ''}" data-id="${id}" title="Guardar en favoritos">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="${esFavoritoTab ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
        </div>

        <div class="cr-card-body">
          <div class="cr-card-header-row">
            <h3 class="cr-card-title">${nombre}</h3>
            ${verificado ? `<span class="cr-verified-badge" title="Verificado en Nicaragua">✓</span>` : ''}
          </div>

          ${slogan ? `<div class="cr-card-slogan">${slogan}</div>` : ''}
          ${desc ? `<p class="cr-card-desc">${desc}</p>` : ''}

          <div class="cr-card-meta">
            <div class="cr-meta-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
              <span>${ciudad}</span>
            </div>
            <div class="cr-rating-row">
              <span class="cr-stars">${this._renderStars(calif)}</span>
              <span>${Number(calif).toFixed(1)}</span>
              <span class="cr-rating-count">(${totalRes} reseña${totalRes !== 1 ? 's' : ''})</span>
            </div>
          </div>

          <div class="cr-card-footer">
            <div class="cr-price-tag">
              ${precioHtml}
            </div>
            <button class="btn-cr-ver-detalle" data-id="${id}">
              <span>Ver Perfil & Cursos</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
      </article>
    `;
  },

  // ─────────────────────────────────────────────────────────────
  // ABRIR Y RENDERIZAR DETALLE DE NEGOCIO (Multi-Resultset)
  // ─────────────────────────────────────────────────────────────
  async openDetalle(idNegocio) {
    const overlay = document.querySelector('#cr-modal-detalle');
    const card = document.querySelector('#cr-detalle-card');
    if (!overlay || !card) return;

    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    card.innerHTML = `
      <div style="padding:60px;text-align:center">
        <div style="font-size:2.2rem;margin-bottom:12px">🎸</div>
        <div style="font-weight:700;color:#0d6855">Cargando información del negocio...</div>
      </div>`;

    const data = await creatividadService.getNegocioDetalle(idNegocio);

    if (!data) {
      card.innerHTML = `
        <div style="padding:40px;text-align:center">
          <p>❌ No se pudo cargar la información del negocio.</p>
          <button class="btn-cr-cancel" onclick="document.querySelector('#cr-modal-detalle').style.display='none';document.body.style.overflow=''">Cerrar</button>
        </div>`;
      return;
    }

    this._renderDetalleContent(data, card);
  },

  _renderDetalleContent(data, card) {
    const id = data.idNegocio || data.IdNegocio;
    const nombre = data.nombre || data.Nombre;
    const slogan = data.slogan || data.Slogan || '';
    const desc = data.descripcion || data.Descripcion || '';
    const cat = data.categoria || data.Categoria;
    const icono = this._getCategoryIcon(data.categoriaIcono || data.categoria_icono, data.categoriaSlug, cat);
    const ciudad = data.ciudad || data.Ciudad || 'Nicaragua';
    const direccion = data.direccion || data.Direccion || '';
    const telefono = data.telefono || data.Telefono || '';
    const whatsapp = data.whatsapp || data.Whatsapp || '';
    const web = data.sitioWeb || data.SitioWeb || '';
    const email = data.emailContacto || data.EmailContacto || '';
    const horario = data.horario || data.Horario || '';
    const calif = data.calificacionPromedio ?? data.CalificacionPromedio ?? 5.0;
    const totalRes = data.totalResenas ?? data.TotalResenas ?? 0;
    const portada = data.imagenPortadaUrl || data.ImagenPortadaUrl;
    const tags = data.tags || data.Tags || [];
    const multimedia = data.multimedia || data.Multimedia || [];
    const cursos = data.cursos || data.Cursos || [];

    const waLink = whatsapp ? `https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola ${nombre}, los encontré en MiSostenido y deseo solicitar información.`)}` : null;

    card.innerHTML = `
      <!-- Header Hero -->
      <div class="cr-det-hero">
        ${portada ? `<img src="${this._mediaUrl(portada)}" alt="${nombre}" />` : ''}
        <div class="cr-det-hero-overlay">
          <div class="cr-det-header-info">
            <span class="cr-det-cat-badge">${icono} ${cat}</span>
            <h2 class="cr-det-title">${nombre}</h2>
            ${slogan ? `<p class="cr-det-slogan">${slogan}</p>` : ''}
          </div>
        </div>
        <button class="cr-modal-close" style="position:absolute;top:16px;right:16px;background:rgba(0,0,0,0.55);color:#fff" id="btn-cr-close-det">✕</button>
      </div>

      <!-- Barra de Tabs -->
      <div class="cr-det-tabs">
        <button class="cr-det-tab-btn active" data-tab="info">ℹ️ Información & Contacto</button>
        <button class="cr-det-tab-btn" data-tab="cursos">🎓 Cursos & Video Clases (${cursos.length})</button>
        ${multimedia.length > 0 ? `<button class="cr-det-tab-btn" data-tab="galeria">📸 Galería (${multimedia.length})</button>` : ''}
        <button class="cr-det-tab-btn" data-tab="resenas">⭐ Reseñas (${totalRes})</button>
      </div>

      <!-- Contenido Tab -->
      <div class="cr-det-content" id="cr-det-tab-body">
        <!-- Tab Info -->
        <div class="cr-det-tab-pane active" id="pane-info">
          <div style="margin-bottom:20px">
            <h4 style="font-weight:800;color:#0f2e26;margin-bottom:8px">Sobre Nosotros</h4>
            <p style="color:#334155;line-height:1.6">${desc}</p>
          </div>

          ${tags.length > 0 ? `
            <div style="margin-bottom:20px">
              <h5 style="font-size:0.85rem;font-weight:700;color:#64748b;margin-bottom:8px">ESPECIALIDADES & ETIQUETAS</h5>
              <div style="display:flex;gap:6px;flex-wrap:wrap">
                ${tags.map(t => `<span style="background:#e6f4f1;color:#0d6855;padding:4px 10px;border-radius:6px;font-size:0.8rem;font-weight:700">#${t}</span>`).join('')}
              </div>
            </div>` : ''}

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;background:#f8fafc;padding:18px;border-radius:12px;border:1px solid #e2e8f0;margin-bottom:20px">
            <div>
              <div style="font-size:0.78rem;font-weight:700;color:#64748b">📍 UBICACIÓN EN NICARAGUA</div>
              <div style="font-weight:600;color:#0f2e26">${direccion ? `${direccion}, ` : ''}${ciudad}</div>
            </div>
            <div>
              <div style="font-size:0.78rem;font-weight:700;color:#64748b">🕒 HORARIO DE ATENCIÓN</div>
              <div style="font-weight:600;color:#0f2e26">${horario || 'Lunes a Sábado 9am - 6pm'}</div>
            </div>
          </div>

          <!-- Acciones de contacto directas -->
          <div style="display:flex;gap:12px;flex-wrap:wrap">
            ${waLink ? `
              <a href="${waLink}" target="_blank" class="btn-cr-submit" style="background:#25d366;text-decoration:none;display:inline-flex;align-items:center;gap:8px">
                <span>💬 Escribir al WhatsApp (${whatsapp})</span>
              </a>` : ''}
            ${telefono ? `
              <a href="tel:${telefono}" class="btn-cr-cancel" style="text-decoration:none;display:inline-flex;align-items:center;gap:8px">
                <span>📞 Llamar (${telefono})</span>
              </a>` : ''}
            ${web ? `
              <a href="${web}" target="_blank" class="btn-cr-cancel" style="text-decoration:none;display:inline-flex;align-items:center;gap:8px">
                <span>🌐 Sitio Web</span>
              </a>` : ''}
          </div>
        </div>

        <!-- Tab Cursos con Video y Gratuidad -->
        <div class="cr-det-tab-pane" id="pane-cursos" style="display:none">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
            <h4 style="margin:0;font-weight:800;color:#0f2e26">Cursos, Talleres y Clases en Video</h4>
            <button class="btn-crear-curso-quick" id="btn-add-curso-to-negocio" data-id="${id}" style="padding:6px 14px;font-size:0.78rem">
              + Agregar Curso a este Negocio
            </button>
          </div>

          ${cursos.length === 0 ? `
            <div style="text-align:center;padding:32px 16px;background:#f8fafc;border-radius:12px;border:1.5px dashed #cbd5e1">
              <div style="font-size:2rem;margin-bottom:8px">🎓</div>
              <p style="color:#64748b;margin:0 0 12px">Este negocio aún no tiene cursos registrados.</p>
              <button class="btn-cr-submit" id="btn-add-curso-empty" data-id="${id}" style="font-size:0.84rem">
                + Publicar Primer Curso Aquí
              </button>
            </div>
          ` : `
            <div class="cr-cursos-grid">
              ${cursos.map(c => {
                const precio = parseFloat(c.precio ?? 0);
                const esGratis = precio === 0;
                const precioTxt = esGratis ? '🎉 GRATIS' : `C$ ${precio.toLocaleString()} NIO`;
                const videoUrl = c.videoUrl || c.video_url || c.imagenUrl || c.imagen_url || '';
                const audioUrl = c.audioUrl || c.audio_url || '';

                return `
                  <div class="cr-curso-card">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
                      <div class="cr-curso-title">${c.nombreCurso || c.NombreCurso}</div>
                      ${esGratis ? `<span class="cr-badge-gratis-mini">GRATIS</span>` : ''}
                    </div>
                    
                    <div class="cr-curso-tags">
                      ${c.nivel ? `<span class="cr-curso-tag">Nivel: ${c.nivel}</span>` : ''}
                      ${c.modalidad ? `<span class="cr-curso-tag">💻 ${c.modalidad}</span>` : ''}
                      ${c.duracion ? `<span class="cr-curso-tag">⏱ ${c.duracion}</span>` : ''}
                    </div>
                    ${c.descripcion ? `<p class="cr-curso-desc">${c.descripcion}</p>` : ''}
                    ${c.horario ? `<div style="font-size:0.8rem;color:#64748b;margin-bottom:8px">📅 ${c.horario}</div>` : ''}

                    ${audioUrl ? `
                      <div style="margin:8px 0">
                        <small style="color:#0f2e26;font-weight:700;display:block;margin-bottom:3px">🎵 Pista / Demostración de Audio:</small>
                        <audio controls src="${this._mediaUrl(audioUrl)}" style="width:100%;height:36px;border-radius:8px"></audio>
                      </div>
                    ` : ''}
                    
                    <div class="cr-curso-footer">
                      <div class="cr-curso-precio" style="color:${esGratis ? '#059669' : '#0d6855'}">${precioTxt}</div>
                      <div style="display:flex;gap:6px">
                        ${videoUrl ? `
                          <button class="btn-cr-ver-video-curso" data-title="${c.nombreCurso || c.NombreCurso}" data-desc="${c.descripcion || ''}" data-url="${videoUrl}">
                            ▶ Ver Video Clase
                          </button>
                        ` : ''}
                        ${waLink && !esGratis ? `<a href="${waLink}" target="_blank" class="btn-cr-ver-detalle" style="text-decoration:none">Inscribirme</a>` : ''}
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>

        <!-- Tab Galería -->
        <div class="cr-det-tab-pane" id="pane-galeria" style="display:none">
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px">
            ${multimedia.map(m => `
              <img src="${this._mediaUrl(m.url || m.Url)}" style="width:100%;height:140px;object-fit:cover;border-radius:10px;cursor:pointer" onclick="window.open('${this._mediaUrl(m.url || m.Url)}','_blank')" />
            `).join('')}
          </div>
        </div>

        <!-- Tab Reseñas -->
        <div class="cr-det-tab-pane" id="pane-resenas" style="display:none">
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px;margin-bottom:24px">
            <h4 style="margin:0 0 10px;font-weight:800;color:#0f2e26">Deja tu Opinión & Calificación</h4>
            <div class="cr-star-rating-input" id="cr-star-input">
              <span class="star active" data-val="1">★</span>
              <span class="star active" data-val="2">★</span>
              <span class="star active" data-val="3">★</span>
              <span class="star active" data-val="4">★</span>
              <span class="star active" data-val="5">★</span>
            </div>
            <textarea id="cr-resena-comentario" rows="2" placeholder="Comparte tu experiencia con esta tienda, curso o estudio en Nicaragua..." style="width:100%;margin-top:10px;padding:8px 12px;border:1.5px solid #cbd5e1;border-radius:8px"></textarea>
            <button class="btn-cr-submit" id="btn-submit-resena" style="margin-top:10px" data-id="${id}">Publicar Reseña</button>
          </div>

          <div id="cr-resenas-list-container">
            <div style="color:#64748b;font-size:0.9rem">Cargando reseñas...</div>
          </div>
        </div>
      </div>
    `;

    // Cerrar Detalle
    card.querySelector('#btn-cr-close-det')?.addEventListener('click', () => {
      document.querySelector('#cr-modal-detalle').style.display = 'none';
      document.body.style.overflow = '';
    });

    // Pestañas internas
    const tabs = card.querySelectorAll('.cr-det-tab-btn');
    tabs.forEach(t => {
      t.addEventListener('click', () => {
        tabs.forEach(btn => btn.classList.remove('active'));
        t.classList.add('active');
        const tabKey = t.getAttribute('data-tab');

        card.querySelectorAll('.cr-det-tab-pane').forEach(p => p.style.display = 'none');
        const activePane = card.querySelector(`#pane-${tabKey}`);
        if (activePane) activePane.style.display = 'block';

        if (tabKey === 'resenas') {
          this._loadResenas(id, card);
        }
      });
    });

    // Botón agregar curso desde detalle
    const openAddCourse = () => {
      document.querySelector('#cr-modal-detalle').style.display = 'none';
      const select = document.querySelector('#cr-curso-negocio');
      if (select) select.value = id;
      const modalCurso = document.querySelector('#cr-modal-crear-curso');
      if (modalCurso) modalCurso.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    };
    card.querySelector('#btn-add-curso-to-negocio')?.addEventListener('click', openAddCourse);
    card.querySelector('#btn-add-curso-empty')?.addEventListener('click', openAddCourse);

    // Botones "Ver Video Clase"
    card.querySelectorAll('.btn-cr-ver-video-curso').forEach(btn => {
      btn.addEventListener('click', () => {
        const title = btn.getAttribute('data-title');
        const desc = btn.getAttribute('data-desc');
        const url = btn.getAttribute('data-url');
        this.openVideoModal(title, desc, url);
      });
    });

    // Star Rating
    let selectedRating = 5;
    const stars = card.querySelectorAll('#cr-star-input .star');
    stars.forEach(s => {
      s.addEventListener('click', () => {
        selectedRating = parseInt(s.getAttribute('data-val'), 10);
        stars.forEach((st, idx) => {
          st.classList.toggle('active', idx < selectedRating);
        });
      });
    });

    // Enviar Reseña
    card.querySelector('#btn-submit-resena')?.addEventListener('click', async () => {
      if (!authService.isAuthenticated()) {
        AuthModal.show('Iniciar Sesión', 'Debes iniciar sesión para publicar una reseña.');
        return;
      }
      const comentario = card.querySelector('#cr-resena-comentario')?.value || '';
      try {
        const res = await creatividadService.crearResena(id, {
          calificacion: selectedRating,
          comentario
        });
        if (res.exito || res.Exito) {
          alert('¡Gracias por tu reseña!');
          card.querySelector('#cr-resena-comentario').value = '';
          this._loadResenas(id, card);
        } else {
          alert(res.mensaje || 'No se pudo publicar la reseña');
        }
      } catch (e) {
        alert(e.message || 'Error al publicar reseña');
      }
    });
  },

  // ─────────────────────────────────────────────────────────────
  // REPRODUCTOR DE VIDEO CLASE EN LA PLATAFORMA
  // ─────────────────────────────────────────────────────────────
  openVideoModal(title, desc, videoUrl) {
    const modal     = document.querySelector('#cr-modal-video');
    const titleEl   = document.querySelector('#cr-video-modal-title');
    const playerBox = document.querySelector('#cr-video-player-box');

    if (!modal || !playerBox) return;
    if (titleEl) titleEl.textContent = `🎬 ${title}`;

    const parsed = this._parseVideoUrl(videoUrl);

    // ── Limpiar listener anterior de postMessage ──────────────────
    if (this._ytMsgHandler) {
      window.removeEventListener('message', this._ytMsgHandler);
      this._ytMsgHandler = null;
    }

    let videoMarkup = '';

    // ════════════════════════════════════════════════════════════════
    // A) Video subido (archivo MP4, blob, etc.)
    // ════════════════════════════════════════════════════════════════
    if (parsed && parsed.type === 'file') {
      videoMarkup = `
        <video
          src="${parsed.url}"
          controls autoplay playsinline
          style="width:100%;max-height:480px;border-radius:12px;
                 background:#000;box-shadow:0 10px 30px rgba(0,0,0,0.3);display:block">
          Tu navegador no soporta la reproducción de video.
        </video>`;

    // ════════════════════════════════════════════════════════════════
    // B) Video de YouTube — embebe el iframe directamente
    // ════════════════════════════════════════════════════════════════
    } else if (parsed && parsed.type === 'youtube') {
      const iframeId  = `yt-iframe-${Date.now()}`;
      const warningId = `yt-warn-${Date.now()}`;

      // Usamos origin=* y enablejsapi para que YouTube pueda comunicarse
      const embedSrc = `https://www.youtube-nocookie.com/embed/${parsed.id}`
        + `?autoplay=1&rel=0&modestbranding=1&enablejsapi=1&origin=${encodeURIComponent(location.origin)}`;

      videoMarkup = `
        <!-- Contenedor 16:9 responsive -->
        <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;
                    border-radius:12px;background:#000;box-shadow:0 10px 30px rgba(0,0,0,0.3)">
          <iframe
            id="${iframeId}"
            style="position:absolute;top:0;left:0;width:100%;height:100%;border:none"
            src="${embedSrc}"
            title="${title}"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerpolicy="no-referrer-when-downgrade"
            allowfullscreen>
          </iframe>
        </div>
        <!-- Aviso de embedding bloqueado (oculto por defecto) -->
        <div id="${warningId}" style="display:none;margin-top:10px;
          background:#fff3cd;border:1px solid #ffc107;border-radius:10px;
          padding:14px 18px;display:none;align-items:center;gap:12px;flex-wrap:wrap">
          <span style="font-size:1.2rem">⚠️</span>
          <div style="flex:1">
            <strong style="color:#856404;display:block;margin-bottom:2px">
              Este video no permite reproducirse dentro de la plataforma
            </strong>
            <span style="color:#856404;font-size:0.85rem">
              El creador del video desactivó la reproducción embebida en YouTube Studio.
            </span>
          </div>
          <a href="${parsed.watchUrl}" target="_blank" rel="noopener noreferrer"
            style="background:#ef4444;color:#fff;text-decoration:none;padding:9px 16px;
                   border-radius:8px;font-weight:700;font-size:0.85rem;
                   display:inline-flex;align-items:center;gap:6px;white-space:nowrap">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            Ver en YouTube ↗
          </a>
        </div>`;

      // Detectar error de embedding vía postMessage de YouTube
      this._ytMsgHandler = (e) => {
        try {
          const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
          // YouTube envía error 101 o 150 cuando el embedding está bloqueado
          if (data && data.event === 'onError' &&
              (data.info === 101 || data.info === 150 || data.info === 100)) {
            const warnEl = document.getElementById(warningId);
            const ifrEl  = document.getElementById(iframeId);
            if (warnEl) { warnEl.style.display = 'flex'; }
            if (ifrEl)  { ifrEl.closest('div').style.opacity = '0.3'; }
          }
        } catch (_) {}
      };
      window.addEventListener('message', this._ytMsgHandler);

    // ════════════════════════════════════════════════════════════════
    // C) URL desconocida
    // ════════════════════════════════════════════════════════════════
    } else {
      videoMarkup = `
        <div style="padding:32px;text-align:center;background:#0f172a;color:#fff;border-radius:12px">
          <p style="margin:0 0 12px">No se pudo cargar el reproductor para este enlace.</p>
          ${videoUrl ? `<a href="${videoUrl}" target="_blank" style="color:#10b981;font-weight:700">Abrir enlace ↗</a>` : ''}
        </div>`;
    }

    playerBox.innerHTML = `
      ${videoMarkup}
      <div style="margin-top:16px;background:#f8fafc;padding:16px;border-radius:12px;
                  border:1px solid #e2e8f0;display:flex;justify-content:space-between;
                  align-items:center;flex-wrap:wrap;gap:12px">
        <div style="flex:1;min-width:240px">
          <h4 style="font-weight:800;color:#0f2e26;margin:0 0 6px">${title}</h4>
          <p style="color:#475569;font-size:0.9rem;line-height:1.5;margin:0">
            ${desc || 'Aprende y practica desde tu casa con las lecciones y video cursos de MiSostenido Nicaragua.'}
          </p>
        </div>
        ${parsed?.watchUrl ? `
          <a href="${parsed.watchUrl}" target="_blank" rel="noopener noreferrer"
            style="background:#ef4444;color:#fff;text-decoration:none;padding:9px 16px;
                   border-radius:8px;font-weight:700;font-size:0.85rem;
                   display:inline-flex;align-items:center;gap:6px;
                   box-shadow:0 2px 10px rgba(239,68,68,.3)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            Ver en YouTube ↗
          </a>
        ` : ''}
      </div>`;

    modal.style.display = 'flex';
  },

  async _loadResenas(idNegocio, card) {

    const listContainer = card.querySelector('#cr-resenas-list-container');
    if (!listContainer) return;

    const resenas = await creatividadService.getResenas(idNegocio);
    if (resenas.length === 0) {
      listContainer.innerHTML = `<div style="color:#64748b;font-style:italic">Sé el primero en dejar una reseña para este negocio en Nicaragua.</div>`;
      return;
    }

    listContainer.innerHTML = resenas.map(r => `
      <div class="cr-resena-item">
        <div class="cr-resena-header">
          <div class="cr-resena-user">
            <img src="${r.fotoPerfilUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.nombreUsuario || 'U')}&background=0d6855&color=fff`}" class="cr-resena-avatar" />
            <div>
              <div class="cr-resena-name">${r.nombreUsuario}</div>
              <div class="cr-resena-date">${new Date(r.fecha).toLocaleDateString('es-NI')}</div>
            </div>
          </div>
          <div class="cr-stars">${this._renderStars(r.calificacion)}</div>
        </div>
        <div class="cr-resena-comment">${r.comentario || ''}</div>
      </div>
    `).join('');
  },

  // ─────────────────────────────────────────────────────────────
  // ATTACH EVENTS
  // ─────────────────────────────────────────────────────────────
  attachEvents(container) {
    const searchInput = container.querySelector('#cr-input-search');
    const ciudadInput = container.querySelector('#cr-input-ciudad');
    const btnSearch = container.querySelector('#btn-cr-search');

    const doSearch = () => {
      this._filtros.busqueda = searchInput?.value.trim() || '';
      this._filtros.ciudad = ciudadInput?.value.trim() || '';
      this.loadNegocios(container);
    };

    btnSearch?.addEventListener('click', doSearch);
    searchInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });
    ciudadInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });

    // Toggles de filtros
    container.querySelector('#chk-gratis')?.addEventListener('change', (e) => {
      this._filtros.soloGratis = e.target.checked;
      this.loadNegocios(container);
    });

    container.querySelector('#chk-gratis')?.addEventListener('change', (e) => {
      this._filtros.soloGratis = e.target.checked;
      this.loadNegocios(container);
    });

    container.querySelector('#chk-verificados')?.addEventListener('change', (e) => {
      this._filtros.soloVerificados = e.target.checked;
      this.loadNegocios(container);
    });

    container.querySelector('#chk-destacados')?.addEventListener('change', (e) => {
      this._filtros.soloDestacados = e.target.checked;
      this.loadNegocios(container);
    });

    container.querySelector('#cr-sort-select')?.addEventListener('change', (e) => {
      this._filtros.orden = e.target.value;
      this.loadNegocios(container);
    });

    // Pestañas Directorio / Video Cursos / Favoritos
    const tabTodos = container.querySelector('#tab-cr-todos');
    const tabVideos = container.querySelector('#tab-cr-videocursos');
    const tabFavs = container.querySelector('#tab-cr-favoritos');

    const resetTabs = () => {
      tabTodos?.classList.remove('active');
      tabVideos?.classList.remove('active');
      tabFavs?.classList.remove('active');
    };

    tabTodos?.addEventListener('click', () => {
      resetTabs();
      tabTodos.classList.add('active');
      this._activeTab = 'todos';
      this._filtros.idCategoria = null;
      this.loadNegocios(container);
    });

    tabVideos?.addEventListener('click', () => {
      resetTabs();
      tabVideos.classList.add('active');
      this._activeTab = 'videocursos';
      this.loadNegocios(container);
    });

    tabFavs?.addEventListener('click', () => {
      if (!authService.isAuthenticated()) {
        AuthModal.show('Favoritos', 'Inicia sesión para ver y gestionar tus negocios guardados.');
        return;
      }
      resetTabs();
      tabFavs.classList.add('active');
      this._activeTab = 'favoritos';
      this.loadNegocios(container);
    });

    // Cerrar Video Modal
    document.querySelector('#btn-cr-close-video')?.addEventListener('click', () => {
      const modal = document.querySelector('#cr-modal-video');
      if (modal) {
        modal.style.display = 'none';
        const playerBox = document.querySelector('#cr-video-player-box');
        if (playerBox) playerBox.innerHTML = '';
      }
    });

    // Botón abrir Crear Negocio
    container.querySelector('#btn-cr-crear')?.addEventListener('click', () => {
      if (!authService.isAuthenticated()) {
        AuthModal.show('Registrar Negocio', 'Debes iniciar sesión para publicar tu tienda, academia o estudio en Nicaragua.');
        return;
      }
      const modal = document.querySelector('#cr-modal-crear');
      if (modal) modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    });

    const closeModalCrear = () => {
      const modal = document.querySelector('#cr-modal-crear');
      if (modal) modal.style.display = 'none';
      document.body.style.overflow = '';
    };
    document.querySelector('#btn-cr-close-crear')?.addEventListener('click', closeModalCrear);
    document.querySelector('#btn-cr-cancel-crear')?.addEventListener('click', closeModalCrear);

    // Botón abrir Crear Curso
    container.querySelector('#btn-cr-crear-curso')?.addEventListener('click', () => {
      if (!authService.isAuthenticated()) {
        AuthModal.show('Publicar Curso', 'Debes iniciar sesión para publicar un curso o video clase.');
        return;
      }
      const modal = document.querySelector('#cr-modal-crear-curso');
      if (modal) modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    });

    const closeModalCrearCurso = () => {
      const modal = document.querySelector('#cr-modal-crear-curso');
      if (modal) modal.style.display = 'none';
      document.body.style.overflow = '';
    };
    const resetCursoForm = () => {
      closeModalCrearCurso();
      document.querySelector('#cr-form-crear-curso')?.reset();
      this._selectedCourseFiles = [];
      const cPreviews = document.querySelector('#cr-curso-previews-list');
      if (cPreviews) cPreviews.innerHTML = '';
      if (boxPrecio) boxPrecio.style.display = 'none';
    };
    document.querySelector('#btn-cr-close-crear-curso')?.addEventListener('click', resetCursoForm);
    document.querySelector('#btn-cr-cancel-crear-curso')?.addEventListener('click', resetCursoForm);

    // Toggle de Gratuidad en formulario de Curso
    const radGratis = document.querySelector('#rad-curso-gratis');
    const radPago = document.querySelector('#rad-curso-pago');
    const boxPrecio = document.querySelector('#box-precio-curso');
    const inputPrecio = document.querySelector('#cr-curso-precio');

    radGratis?.addEventListener('change', () => {
      if (boxPrecio) boxPrecio.style.display = 'none';
      if (inputPrecio) inputPrecio.value = '0';
    });
    radPago?.addEventListener('change', () => {
      if (boxPrecio) boxPrecio.style.display = 'grid';
      if (inputPrecio) inputPrecio.value = '350';
    });

    // Dropzone de fotos y videos de Negocio
    const dropzone = document.querySelector('#cr-dropzone');
    const fileInput = document.querySelector('#cr-file-input');
    const previewsList = document.querySelector('#cr-previews-list');

    dropzone?.addEventListener('click', () => fileInput?.click());
    fileInput?.addEventListener('change', () => {
      if (!fileInput.files) return;
      this._selectedFiles = Array.from(fileInput.files);
      if (previewsList) {
        previewsList.innerHTML = this._selectedFiles.map(f => `
          <span style="background:#e2e8f0;padding:4px 8px;border-radius:6px;font-size:0.75rem">${f.type.startsWith('video') ? '🎬' : (f.type.startsWith('audio') ? '🎵' : '📷')} ${f.name}</span>
        `).join('');
      }
    });

    // Dropzone de videos, audios y fotos para el Curso / Video Clase
    const cursoDropzone = document.querySelector('#cr-curso-dropzone');
    const cursoFileInput = document.querySelector('#cr-curso-file-input');
    const cursoPreviewsList = document.querySelector('#cr-curso-previews-list');

    cursoDropzone?.addEventListener('click', () => cursoFileInput?.click());
    cursoFileInput?.addEventListener('change', () => {
      if (!cursoFileInput.files) return;
      this._selectedCourseFiles = Array.from(cursoFileInput.files);
      if (cursoPreviewsList) {
        cursoPreviewsList.innerHTML = this._selectedCourseFiles.map(f => {
          const isVid = f.type.startsWith('video') || f.name.match(/\.(mp4|webm|mov)$/i);
          const isAud = f.type.startsWith('audio') || f.name.match(/\.(mp3|wav|ogg|m4a)$/i);
          const ic = isVid ? '🎬 Video:' : (isAud ? '🎵 Audio:' : '📸 Portada:');
          return `<span style="background:#dcfce7;color:#166534;font-weight:600;padding:5px 10px;border-radius:6px;font-size:0.78rem;display:inline-flex;align-items:center;gap:4px">${ic} ${f.name}</span>`;
        }).join('');
      }
    });

    // Submit Crear Negocio
    document.querySelector('#cr-form-crear')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btnSubmit = document.querySelector('#btn-cr-submit-crear');
      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Guardando...';
      }

      const dto = {
        idCategoria: document.querySelector('#cr-form-categoria')?.value,
        nombre: document.querySelector('#cr-form-nombre')?.value,
        slogan: document.querySelector('#cr-form-slogan')?.value,
        descripcion: document.querySelector('#cr-form-descripcion')?.value,
        ciudad: document.querySelector('#cr-form-ciudad')?.value,
        direccion: document.querySelector('#cr-form-direccion')?.value,
        telefono: document.querySelector('#cr-form-telefono')?.value,
        whatsapp: document.querySelector('#cr-form-whatsapp')?.value,
        emailContacto: document.querySelector('#cr-form-email')?.value,
        sitioWeb: document.querySelector('#cr-form-web')?.value,
        horario: document.querySelector('#cr-form-horario')?.value,
        precioDesde: document.querySelector('#cr-form-preciodesde')?.value,
        precioHasta: document.querySelector('#cr-form-preciohasta')?.value,
        moneda: document.querySelector('#cr-form-moneda')?.value || 'NIO'
      };

      try {
        const res = await creatividadService.crearNegocio(dto, this._selectedFiles);
        if (res.exito || res.Exito) {
          alert('¡Negocio publicado exitosamente en MiSostenido Nicaragua!');
          closeModalCrear();
          document.querySelector('#cr-form-crear')?.reset();
          this._selectedFiles = [];
          if (previewsList) previewsList.innerHTML = '';
          this.loadNegocios(container);
        } else {
          alert(res.mensaje || 'Ocurrió un error al guardar el negocio');
        }
      } catch (err) {
        alert(err.message || 'Error al conectar con la API');
      } finally {
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.textContent = 'Guardar y Publicar Negocio';
        }
      }
    });

    // Submit Crear Curso / Video Clase (Permite independiente o asociado)
    document.querySelector('#cr-form-crear-curso')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btnSubmit = document.querySelector('#btn-cr-submit-crear-curso');
      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Subiendo y Publicando...';
      }

      const valNegocio = document.querySelector('#cr-curso-negocio')?.value;
      const idNegocio = (valNegocio && parseInt(valNegocio, 10) > 0) ? parseInt(valNegocio, 10) : null;

      const isGratis = document.querySelector('#rad-curso-gratis')?.checked;
      const precioVal = isGratis ? 0 : parseFloat(document.querySelector('#cr-curso-precio')?.value || 0);

      const dto = {
        nombreCurso: document.querySelector('#cr-curso-titulo')?.value,
        nivel: document.querySelector('#cr-curso-nivel')?.value,
        modalidad: document.querySelector('#cr-curso-modalidad')?.value,
        duracion: document.querySelector('#cr-curso-duracion')?.value,
        horario: document.querySelector('#cr-curso-horario')?.value,
        precio: precioVal,
        videoUrl: document.querySelector('#cr-curso-videourl')?.value || null,
        cuposDisponibles: document.querySelector('#cr-curso-cupos')?.value ? parseInt(document.querySelector('#cr-curso-cupos')?.value, 10) : null,
        descripcion: document.querySelector('#cr-curso-descripcion')?.value
      };

      try {
        const res = await creatividadService.crearCurso(idNegocio, dto, this._selectedCourseFiles);
        if (res.exito || res.Exito) {
          alert('¡Curso / Video Clase publicada exitosamente en MiSostenido Nicaragua!');
          resetCursoForm();
          // Activar pestaña de Video Cursos para que aparezca inmediatamente el curso recién creado
          const tabVideos = container.querySelector('#tab-cr-videocursos');
          const tabTodos = container.querySelector('#tab-cr-todos');
          const tabFavs = container.querySelector('#tab-cr-favoritos');
          tabTodos?.classList.remove('active');
          tabFavs?.classList.remove('active');
          tabVideos?.classList.add('active');
          this._activeTab = 'videocursos';
          this.loadNegocios(container);
        } else {
          alert(res.mensaje || 'Error al publicar curso');
        }
      } catch (err) {
        alert(err.message || 'Error al conectar con la API');
      } finally {
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.textContent = 'Publicar Curso / Clase';
        }
      }
    });

    // Delegación de eventos para Cards (Ver Detalle, Favorito y Reproducir Video Clase)
    container.querySelector('#cr-grid')?.addEventListener('click', async (e) => {
      // Reproducir Video Clase directo desde la Card
      const btnVid = e.target.closest('.btn-cr-ver-video-curso');
      if (btnVid) {
        e.stopPropagation();
        const url = btnVid.getAttribute('data-url');
        const title = btnVid.getAttribute('data-title') || 'Video Clase';
        const desc = btnVid.getAttribute('data-desc') || '';
        this.openVideoModal(title, desc, url);
        return;
      }

      const btnDet = e.target.closest('.btn-cr-ver-detalle');
      if (btnDet) {
        const id = parseInt(btnDet.getAttribute('data-id'), 10);
        this.openDetalle(id);
        return;
      }

      const btnFav = e.target.closest('.btn-cr-favorite-card');
      if (btnFav) {
        e.stopPropagation();
        if (!authService.isAuthenticated()) {
          AuthModal.show('Favoritos', 'Debes iniciar sesión para guardar negocios en tus favoritos.');
          return;
        }
        const id = parseInt(btnFav.getAttribute('data-id'), 10);
        try {
          const res = await creatividadService.toggleFavorito(id);
          btnFav.classList.toggle('active', res.esFavorito || res.EsFavorito);
          if (this._activeTab === 'favoritos') {
            this.loadNegocios(container);
          }
        } catch (err) {
          alert(err.message);
        }
      }
    });
  }
};
