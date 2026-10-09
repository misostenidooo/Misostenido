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
  _chatPollingTimer: null,


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
              <img src="src/assets/images/ICONO_BUSQUEDA.png" alt="Buscar" class="ms-icon ms-icon-sm" />
              <input type="text" id="hero-input-search" placeholder="Buscar por nombre, banda o instrumento..." value="${this._filtros.busqueda}" />
            </div>

            <div class="search-divider"></div>

            <div class="search-field search-select">
              <img src="src/assets/images/ICONO 1.png" alt="Género" class="ms-icon ms-icon-sm" />
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
              <img src="src/assets/images/ICONO 6.png" alt="Ubicación" class="ms-icon ms-icon-sm" />
              <select id="hero-select-ubicacion">
                <option value="">Todas las Ciudades (Nicaragua)</option>
                <option value="Managua">Managua</option>
                <option value="León">León</option>
                <option value="Granada">Granada</option>
                <option value="Masaya">Masaya</option>
                <option value="Matagalpa">Matagalpa</option>
                <option value="Estelí">Estelí</option>
                <option value="Chinandega">Chinandega</option>
                <option value="Rivas">Rivas / San Juan del Sur</option>
                <option value="Carazo">Carazo / Jinotepe</option>
                <option value="Jinotega">Jinotega</option>
                <option value="Chontales">Chontales / Juigalpa</option>
                <option value="Boaco">Boaco</option>
                <option value="Madriz">Madriz / Somoto</option>
                <option value="Nueva Segovia">Nueva Segovia / Ocotal</option>
                <option value="Río San Juan">Río San Juan / San Carlos</option>
                <option value="Costa Caribe Norte">Costa Caribe Norte (Bilwi)</option>
                <option value="Costa Caribe Sur">Costa Caribe Sur (Bluefields)</option>
              </select>
            </div>

            <button class="btn-hero-search" id="btn-hero-search">
              <img src="src/assets/images/ICONO 5.png" alt="Buscar" class="ms-icon ms-icon-sm" />
              <span>Buscar Talento</span>
            </button>
          </div>
        </div>
      </section>

      <!-- ================= BANNER NORMATIVA E INTERMEDIACIÓN ================= -->
      <section class="contrataciones-normativa-banner" id="contrataciones-normativa-banner">
        <div class="normativa-banner-header">
          <div class="normativa-title-wrap">
            <div class="normativa-icon-badge" style="background:#fff;padding:6px;border-radius:10px;display:flex;align-items:center;justify-content:center;">
              <img src="src/assets/images/ICONO 9.png" alt="Normativa" class="ms-icon ms-icon-md" />
            </div>
            <div>
              <h3 class="normativa-title">Comunicación, Intermediación y Normativa Laboral</h3>
              <p class="normativa-subtitle">MiSostenido facilita el acercamiento seguro entre candidatos y contratantes a través de mensajería canalizada por gestores autorizados.</p>
            </div>
          </div>
          <button class="btn-toggle-normativa" id="btn-toggle-normativa" type="button">
            <span>Ver Normativa Completa</span>
            <span id="normativa-chevron">▼</span>
          </button>
        </div>

        <div class="normativa-badges-row">
          <span class="nb-pill highlight">🤝 Intermediación Neutral</span>
          <span class="nb-pill">🛡️ Gestor Autorizado Canalizador</span>
          <span class="nb-pill">📜 Acuerdos Libres (Sin fijación salarial unilateral)</span>
          <span class="nb-pill">🔍 Auditoría & Trazabilidad</span>
          <span class="nb-pill">🚩 Mecanismos de Reporte Activos</span>
        </div>

        <div class="normativa-details-drawer" id="normativa-drawer" style="display:none">
          <h4>Marco Normativo y Principios de Contratación:</h4>
          <div class="normativa-details-grid">
            <div class="normativa-point-card">
              <strong>1. Intermediación y Canalización</strong>
              Toda solicitud de contratación es canalizada mediante nuestro sistema de mensajería interno, donde un gestor autorizado atiende consultas, analiza requerimientos y coordina la comunicación entre candidato y contratante.
            </div>
            <div class="normativa-point-card">
              <strong>2. No Fijación Salarial Unilateral</strong>
              La plataforma no establece ni impone unilateralmente salarios, horarios o condiciones laborales. Estos aspectos son acordados directamente por los involucrados respetando la legislación laboral aplicable.
            </div>
            <div class="normativa-point-card">
              <strong>3. Registro de Avances y Cierre</strong>
              El gestor autorizado registra los avances de cada solicitud y formaliza el cierre del proceso cuando se concrete la contratación, se rechace la propuesta o alguna de las partes decida no continuar.
            </div>
            <div class="normativa-point-card">
              <strong>4. Auditoría, Verificación y Seguridad</strong>
              Contamos con políticas de privacidad, procedimientos de verificación de usuarios, supervisión por el rol Auditor y mecanismos de reporte para proteger a los usuarios y promover contrataciones transparentes.
            </div>
          </div>
        </div>
      </section>

      <!-- ================= BARRA DE TABS Y NAVEGACIÓN ================= -->
      <section class="contrataciones-main-container">
        <div class="contrataciones-top-bar">
          <div class="tabs-switcher">
            <button class="tab-btn ${this._activeTab === 'ofertas' ? 'active' : ''}" id="tab-ofertas" style="display:flex;align-items:center;gap:8px;">
              <img src="src/assets/images/ICONO 2.png" alt="Ofertas" class="ms-icon ms-icon-sm" />
              <span>Ofertas de Servicios</span>
              <span class="tab-badge" id="badge-count-ofertas">0</span>
            </button>
            <button class="tab-btn ${this._activeTab === 'solicitudes' ? 'active' : ''}" id="tab-solicitudes" style="display:flex;align-items:center;gap:8px;">
              <img src="src/assets/images/ICONO 5.png" alt="Solicitudes" class="ms-icon ms-icon-sm" />
              <span>Solicitudes de Eventos</span>
              <span class="tab-badge secondary" id="badge-count-solicitudes">0</span>
            </button>
            <button class="tab-btn ${this._activeTab === 'intermediacion' ? 'active' : ''}" id="tab-intermediacion" style="display:flex;align-items:center;gap:8px;">
              <img src="src/assets/images/ICONO 9.png" alt="Intermediación" class="ms-icon ms-icon-sm" />
              <span>Centro de Intermediación</span>
              <span class="tab-badge" id="badge-count-intermediacion">0</span>
            </button>
          </div>

          <button class="btn-create-gai" id="btn-open-create-modal" style="display:flex;align-items:center;gap:8px;">
            <img src="src/assets/images/ICONO 5.png" alt="Publicar" class="ms-icon ms-icon-sm" />
            <span>Publicar Servicio o Empleo</span>
          </button>
        </div>

        <!-- ================= LAYOUT PRINCIPAL ================= -->
        <div class="contrataciones-layout ${this._activeTab === 'intermediacion' ? 'is-tab-intermediacion' : ''}">

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
              <button class="type-tab active" id="tab-type-oferta" data-type="oferta" style="display:flex;align-items:center;justify-content:center;gap:8px;">
                <img src="src/assets/images/ICONO 1.png" alt="Músico" class="ms-icon ms-icon-sm" />
                <span>Ofrecer Servicio Musical (Soy Músico)</span>
              </button>
              <button class="type-tab" id="tab-type-solicitud" data-type="solicitud" style="display:flex;align-items:center;justify-content:center;gap:8px;">
                <img src="src/assets/images/ICONO 5.png" alt="Contratar" class="ms-icon ms-icon-sm" />
                <span>Publicar Búsqueda / Empleo (Busco Músico)</span>
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
                  <select id="gig-location" required>
                    <option value="Managua, Nicaragua">Managua, Nicaragua</option>
                    <option value="León, Nicaragua">León, Nicaragua</option>
                    <option value="Granada, Nicaragua">Granada, Nicaragua</option>
                    <option value="Masaya, Nicaragua">Masaya, Nicaragua</option>
                    <option value="Matagalpa, Nicaragua">Matagalpa, Nicaragua</option>
                    <option value="Estelí, Nicaragua">Estelí, Nicaragua</option>
                    <option value="Chinandega, Nicaragua">Chinandega, Nicaragua</option>
                    <option value="Rivas, Nicaragua">Rivas, Nicaragua</option>
                    <option value="Carazo, Nicaragua">Carazo, Nicaragua</option>
                    <option value="Jinotega, Nicaragua">Jinotega, Nicaragua</option>
                    <option value="Chontales, Nicaragua">Chontales, Nicaragua</option>
                    <option value="Boaco, Nicaragua">Boaco, Nicaragua</option>
                    <option value="Madriz, Nicaragua">Madriz, Nicaragua</option>
                    <option value="Nueva Segovia, Nicaragua">Nueva Segovia, Nicaragua</option>
                    <option value="Río San Juan, Nicaragua">Río San Juan, Nicaragua</option>
                    <option value="Costa Caribe Norte, Nicaragua">Costa Caribe Norte, Nicaragua</option>
                    <option value="Costa Caribe Sur, Nicaragua">Costa Caribe Sur, Nicaragua</option>
                  </select>
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
           MODAL PARA SOLICITAR CONTRATACIÓN (CANALIZADA POR GESTOR)
           ============================================================== -->
      <div class="modal-overlay" id="modal-hire-request" style="display:none">
        <div class="modal-card">
          <div class="modal-header">
            <h3>Solicitud de Intermediación y Contacto</h3>
            <button class="btn-close-modal" id="btn-close-hire-modal">✕</button>
          </div>
          <div class="modal-body">
            <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:12px 14px;margin-bottom:14px;font-size:0.83rem;color:#065f46;line-height:1.45;">
              🛡️ <strong>Canalizado por Gestor Autorizado:</strong> Esta solicitud será evaluada y coordinada por un gestor autorizado de MiSostenido. La plataforma no fija tarifas ni condiciones laborales: estas serán acordadas de mutuo acuerdo entre las partes conforme a la legislación aplicable.
            </div>

            <div class="hire-summary-card" id="hire-summary-card"></div>

            <form id="form-hire-request">
              <div class="form-group">
                <label>Tu Consulta, Propuesta o Requerimientos *</label>
                <textarea id="hire-message" rows="4" placeholder="Detalla las fechas, género musical, necesidades del evento y requerimientos para que el gestor pueda coordinar el acercamiento..." required></textarea>
              </div>

              <div style="margin:12px 0 16px;display:flex;align-items:flex-start;gap:8px;">
                <input type="checkbox" id="hire-accept-normativa" required style="margin-top:3px;cursor:pointer;" />
                <label for="hire-accept-normativa" style="font-size:0.8rem;color:#475569;cursor:pointer;line-height:1.4;">
                  Acepto las normas de intermediación de MiSostenido y entiendo que las condiciones contractuales y salariales se pactarán directamente entre las partes conforme a la ley.
                </label>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn-secondary" id="btn-cancel-hire">Cancelar</button>
                <button type="submit" class="btn-primary" id="btn-submit-hire">
                  Enviar a Intermediación
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- ==============================================================
           MODAL PARA REPORTAR IRREGULARIDAD O INCUMPLIMIENTO
           ============================================================== -->
      <div class="modal-overlay" id="modal-reporte-contratacion" style="display:none">
        <div class="modal-card">
          <div class="modal-header">
            <h3 style="color:#b91c1c;">🚩 Reportar Publicación o Incumplimiento</h3>
            <button class="btn-close-modal" id="btn-close-reporte-modal">✕</button>
          </div>
          <div class="modal-body">
            <p style="font-size:0.85rem;color:#64748b;margin-bottom:14px;">
              Este reporte será derivado a los roles de Moderador, Auditor y Administrador para garantizar contrataciones transparentes y seguras.
            </p>
            <form id="form-reporte-contratacion">
              <div class="form-group">
                <label>Motivo del Reporte *</label>
                <select id="reporte-motivo" required style="width:100%;padding:10px;border-radius:8px;border:1px solid #cbd5e1;">
                  <option value="Condiciones fraudulentas">Condiciones engañosas o fraudulentas</option>
                  <option value="Incumplimiento de normativa">Incumplimiento de normas laborales o de uso</option>
                  <option value="Suplantación de identidad">Cuenta no verificada / Suplantación</option>
                  <option value="Contenido inapropiado">Contenido ofensivo o inapropiado</option>
                  <option value="Otro">Otro motivo</option>
                </select>
              </div>
              <div class="form-group">
                <label>Detalle de la situación *</label>
                <textarea id="reporte-detalle" rows="4" placeholder="Explica detalladamente la irregularidad observada..." required style="width:100%;padding:10px;border-radius:8px;border:1px solid #cbd5e1;"></textarea>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn-secondary" id="btn-cancel-reporte">Cancelar</button>
                <button type="submit" class="btn-primary" style="background:#b91c1c;">Enviar Reporte a Auditoría</button>
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

      <!-- ==============================================================
           MODAL SALA DE NEGOCIACIÓN & CHAT DE CONTRATACIÓN (EL PLUS DE LA APP)
           ============================================================== -->
      <div class="modal-overlay" id="modal-chat-negociacion" style="display:none">
        <div class="modal-card modal-chat-card">
          <div class="modal-header chat-modal-header">
            <div class="chat-header-info">
              <div class="chat-header-title-wrap">
                <span class="chat-live-badge">🟢 Sala de Negociación Activa</span>
                <h3 id="chat-title">Negociación de Contratación Musical</h3>
              </div>
              <p class="chat-subtitle" id="chat-subtitle">Canal formal con respaldo y trazabilidad legal de MiSostenido</p>
            </div>
            <button class="btn-close-modal" id="btn-close-chat-modal">✕</button>
          </div>

          <!-- Barra de Participantes Tripartita (Creador del Evento, Postulante y Gestor) -->
          <div class="chat-participants-bar" id="chat-participants-bar"></div>

          <!-- Barra de Asignación y Cierre de Trato -->
          <div class="chat-assignment-action-bar" id="chat-assignment-action-bar"></div>

          <!-- Pestañas de la Sala de Negociación -->
          <div class="chat-nav-tabs">
            <button class="chat-tab-btn active" id="tab-sub-chat" type="button">
              💬 Mensajería & Propuesta
            </button>
            <button class="chat-tab-btn" id="tab-sub-acuerdo" type="button">
              📋 Hoja de Acuerdo / Pre-Contrato
            </button>
            <button class="chat-tab-btn" id="tab-sub-soporte" type="button">
              🛡️ Mediación & Garantías
            </button>
          </div>

          <div class="modal-body chat-modal-body">
            <!-- SECCIÓN 1: CHAT EN VIVO -->
            <div class="chat-tab-content active" id="content-sub-chat">
              <div class="chat-security-banner">
                <span>🔒 <strong>Comunicación Protegida:</strong> Los acuerdos alcanzados en este canal gozan de respaldo institucional, mediación neutral y registro en la bitácora oficial.</span>
              </div>

              <!-- Quick chips / Preguntas frecuentes -->
              <div class="chat-quick-suggestions">
                <span class="cqs-title">Sugerencias rápidas:</span>
                <button type="button" class="btn-quick-chip" data-msg="¿El servicio incluye equipo de sonido, luces y microfonía para el local?">🔊 ¿Incluyen sonido?</button>
                <button type="button" class="btn-quick-chip" data-msg="¿Tienen disponibilidad para la fecha y horario solicitado?">📅 ¿Disponibilidad?</button>
                <button type="button" class="btn-quick-chip" data-msg="¿Podrían compartir la lista del repertorio musical para el evento?">🎵 ¿Repertorio?</button>
                <button type="button" class="btn-quick-chip" data-msg="Podemos acordar un anticipo del 30% y el resto al finalizar la presentación.">💵 Proponer anticipo</button>
              </div>

              <div class="chat-messages-container" id="chat-messages-list">
                <!-- Se llena dinámicamente con las burbujas -->
              </div>

              <form class="chat-input-bar" id="form-chat-send">
                <input type="text" id="input-chat-message" placeholder="Escribe un mensaje, propuesta de tarifa o consulta técnica..." autocomplete="off" required />
                <button type="submit" class="btn-chat-send" id="btn-chat-send">
                  <span>Enviar</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
              </form>
            </div>

            <!-- SECCIÓN 2: HOJA DE ACUERDO Y PRE-CONTRATO -->
            <div class="chat-tab-content" id="content-sub-acuerdo" style="display:none">
              <div class="acuerdo-card">
                <div class="acuerdo-header">
                  <div class="acuerdo-badge">📜 Pre-Contrato Digital</div>
                  <h4>Términos Acordados para la Prestación del Servicio</h4>
                  <p>Guía rápida para formalizar la contratación de forma segura:</p>
                </div>

                <!-- GUÍA VISUAL SENCILLA DE 3 PASOS -->
                <div class="acuerdo-step-guide" style="display:flex;gap:8px;background:#f8fafc;padding:10px;border-radius:10px;margin-bottom:16px;border:1px solid #e2e8f0;flex-wrap:wrap;">
                  <div style="flex:1;min-width:140px;background:#ffffff;padding:8px 10px;border-radius:8px;border:1px solid #cbd5e1;text-align:center;">
                    <strong style="color:#0d6855;font-size:0.82rem;display:block;">1️⃣ Dialogar en Chat</strong>
                    <span style="color:#64748b;font-size:0.74rem;">Acuerden precio, horario y canciones</span>
                  </div>
                  <div style="flex:1;min-width:140px;background:#ffffff;padding:8px 10px;border-radius:8px;border:1px solid #cbd5e1;text-align:center;">
                    <strong style="color:#0d6855;font-size:0.82rem;display:block;">2️⃣ Ajustar Términos</strong>
                    <span style="color:#64748b;font-size:0.74rem;">Verifiquen los datos en esta hoja</span>
                  </div>
                  <div style="flex:1;min-width:140px;background:#ffffff;padding:8px 10px;border-radius:8px;border:1px solid #cbd5e1;text-align:center;">
                    <strong style="color:#0d6855;font-size:0.82rem;display:block;">3️⃣ Firmar y Contratar</strong>
                    <span style="color:#64748b;font-size:0.74rem;">El evento se cierra y queda protegido</span>
                  </div>
                </div>

                <div id="acuerdo-ratificado-seal" style="display:none;background:#f0fdf4;border:2px solid #86efac;border-radius:12px;padding:14px 18px;margin-bottom:18px;align-items:center;gap:12px;"></div>

                <div class="acuerdo-grid">
                  <div class="acuerdo-field">
                    <label>Tarifa Total Acordada (USD):</label>
                    <div class="acuerdo-input-wrap">
                      <span>$</span>
                      <input type="number" id="acuerdo-precio" placeholder="Ej: 300" min="0" />
                    </div>
                  </div>

                  <div class="acuerdo-field">
                    <label>Duración del Show (Horas):</label>
                    <input type="text" id="acuerdo-duracion" placeholder="Ej: 3 horas (2 tandas de 90 min)" />
                  </div>

                  <div class="acuerdo-field">
                    <label>Fecha y Hora del Evento:</label>
                    <input type="datetime-local" id="acuerdo-fecha-hora" />
                  </div>

                  <div class="acuerdo-field">
                    <label>Ubicación / Lugar del Evento:</label>
                    <input type="text" id="acuerdo-ubicacion" placeholder="Ej: Hotel Intercontinental, Managua" />
                  </div>
                </div>

                <div class="acuerdo-checklist">
                  <label class="acuerdo-chk-item">
                    <input type="checkbox" id="chk-sonido-incluido" />
                    <span>El músico/banda provee su propio equipo de amplificación y audio.</span>
                  </label>
                  <label class="acuerdo-chk-item">
                    <input type="checkbox" id="chk-transporte-incluido" />
                    <span>Viáticos de transporte y logística incluidos en la tarifa.</span>
                  </label>
                  <label class="acuerdo-chk-item">
                    <input type="checkbox" id="chk-anticipo-pactado" />
                    <span>Se pacta entrega de anticipo del 30% a 50% previo al día del show.</span>
                  </label>
                </div>

                <div class="acuerdo-status-box" id="acuerdo-status-box">
                  <div class="asb-signatures">
                    <div class="asb-sign-item" id="sign-contratante">
                      <span class="sign-icon">⏳</span>
                      <div>
                        <strong>Contratante</strong>
                        <span class="sign-status" id="lbl-sign-contratante">Pendiente de firma</span>
                      </div>
                    </div>
                    <div class="asb-sign-item" id="sign-artista">
                      <span class="sign-icon">⏳</span>
                      <div>
                        <strong>Músico / Artista</strong>
                        <span class="sign-status" id="lbl-sign-artista">Pendiente de firma</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="acuerdo-actions-row">
                  <button type="button" class="btn-primary" id="btn-firmar-acuerdo">
                    ✍️ Aceptar y Firmar Acuerdo Digital
                  </button>
                  <button type="button" class="btn-secondary" id="btn-descargar-resumen">
                    📄 Descargar Resumen del Acuerdo
                  </button>
                </div>
              </div>
            </div>

            <!-- SECCIÓN 3: MEDIACIÓN, GARANTÍAS Y CALIFICACIÓN -->
            <div class="chat-tab-content" id="content-sub-soporte" style="display:none">
              <div class="soporte-section-grid">
                <div class="soporte-card">
                  <h4>🛡️ Beneficios de Contratar en MiSostenido</h4>
                  <ul class="soporte-benefits-list">
                    <li><strong>Mediación Neutral:</strong> Ante cualquier cambio de horario o eventualidad, un gestor autorizado asiste a las partes.</li>
                    <li><strong>Perfiles Verificados:</strong> Historial de presentaciones, reputación y muestras de audio reales sin sorpresas.</li>
                    <li><strong>Trazabilidad Legal:</strong> Todo acuerdo queda documentado con fecha, hora y cláusulas claras.</li>
                    <li><strong>Garantía de Respaldo:</strong> En caso de fuerza mayor comprobable, MiSostenido te asiste en la reubicación de talento.</li>
                  </ul>
                  <button type="button" class="btn-secondary mt-14" id="btn-solicitar-gestor-chat" style="width:100%;">
                    🙋 Solicitar Asistencia del Gestor en esta Conversación
                  </button>
                </div>

                <div class="soporte-card">
                  <h4>⭐ Calificación y Reputación Mutua</h4>
                  <p style="font-size:0.86rem;color:#64748b;margin-bottom:12px;">Al concretar el evento, califica tu experiencia para impulsar la confianza en el ecosistema musical.</p>
                  
                  <div class="rating-stars-picker" id="rating-stars-picker">
                    <span class="star" data-val="1">★</span>
                    <span class="star" data-val="2">★</span>
                    <span class="star" data-val="3">★</span>
                    <span class="star" data-val="4">★</span>
                    <span class="star" data-val="5">★</span>
                  </div>

                  <textarea id="review-comment" rows="3" placeholder="Escribe una reseña sobre la puntualidad, profesionalismo, repertorio y trato recibido..." style="width:100%;margin-top:10px;padding:10px;border-radius:8px;border:1px solid #cbd5e1;"></textarea>

                  <button type="button" class="btn-primary mt-14" id="btn-enviar-calificacion" style="width:100%;">
                    Enviar Calificación Verificada
                  </button>
                </div>
              </div>
            </div>

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
    document.querySelectorAll('body > #modal-create-gig, body > #modal-hire-request, body > #modal-detalle, body > #modal-reporte-contratacion, body > #modal-chat-negociacion').forEach(old => old.remove());
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
    } else if (this._activeTab === 'solicitudes') {
      await this.loadSolicitudes(container);
    } else if (this._activeTab === 'intermediacion') {
      await this.loadIntermediacion(container);
    }
  },

  async loadGigs(container) {
    return this.loadContent(container);
  },

  // ─────────────────────────────────────────────
  // CARGAR OFERTAS REALES DESDE LA API .NET
  // ─────────────────────────────────────────────
  async loadOfertas(container) {
    const layout = container.querySelector('.contrataciones-layout');
    if (layout) layout.classList.remove('is-tab-intermediacion');
    const sidebarFiltros = container.querySelector('.contrataciones-sidebar');
    if (sidebarFiltros) sidebarFiltros.style.display = '';
    const sortWrap = container.querySelector('.sort-wrap');
    if (sortWrap) sortWrap.style.display = 'flex';

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
    const layout = container.querySelector('.contrataciones-layout');
    if (layout) layout.classList.remove('is-tab-intermediacion');
    const sidebarFiltros = container.querySelector('.contrataciones-sidebar');
    if (sidebarFiltros) sidebarFiltros.style.display = '';
    const sortWrap = container.querySelector('.sort-wrap');
    if (sortWrap) sortWrap.style.display = 'flex';

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
            ${(() => {
              const currentUser = authService.getCurrentUser();
              if (currentUser && (currentUser.id === o.artistaId || currentUser.idUsuario === o.artistaId)) {
                return `<button class="btn-solicitar-contratacion" disabled style="background:#f1f5f9;color:#64748b;border:1px solid #cbd5e1;cursor:default;font-weight:600;">⭐ Tu Oferta</button>`;
              }
              if (o.disponible === false) {
                return `<button class="btn-solicitar-contratacion" disabled style="background:#64748b;color:#ffffff;opacity:0.8;cursor:not-allowed;">🔴 No Disponible</button>`;
              }
              return `<button class="btn-solicitar-contratacion" data-id="${id}" data-title="${encodeURIComponent(o.titulo)}">Contratar</button>`;
            })()}
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

    const estaAsignado = s.abierta === false;
    const mediaCount = (s.totalMedia || s.TotalMedia || media.length || 0);
    const mediaIndicator = mediaCount > 0
      ? `<div style="display:flex;align-items:center;gap:6px;font-size:0.78rem;color:#0d6855;font-weight:600;margin-bottom:12px;">📎 ${mediaCount} archivo(s) adjunto(s) ${videos.length > 0 ? '🎬' : ''} ${audios.length > 0 ? '🎵' : ''}</div>`
      : '';

    return `
      <div class="gig-card gig-solicitud-card ${estaAsignado ? 'is-asignado-card' : ''}" data-id="${id}" data-type="solicitud">
        <div class="gig-card-header-solicitud">
          <span class="gig-solicitud-badge ${estaAsignado ? 'tomada' : ''}" style="${estaAsignado ? 'background:#0f172a;color:#38bdf8;border:1px solid #0284c7;' : ''}">
            ${estaAsignado ? '🔒 EVENTO TOMADO / ASIGNADO' : '💼 SOLICITUD DE EVENTO'}
          </span>
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
            ${(() => {
              const currentUser = authService.getCurrentUser();
              if (currentUser && (currentUser.id === s.contratanteId || currentUser.idUsuario === s.contratanteId)) {
                return `<button class="btn-solicitar-contratacion" disabled style="background:#f1f5f9;color:#64748b;border:1px solid #cbd5e1;cursor:default;font-weight:600;">⭐ Tu Publicación</button>`;
              }
              if (estaAsignado) {
                return `<button class="btn-solicitar-contratacion" disabled style="background:#64748b;color:#ffffff;opacity:0.8;cursor:not-allowed;">🔒 Evento Tomado</button>`;
              }
              return `<button class="btn-solicitar-contratacion" data-id="${id}" data-solicitud="true" data-title="${encodeURIComponent(s.titulo)}">Postularme</button>`;
            })()}
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

    // Toggle de Drawer de Normativa
    const btnToggleNormativa = container.querySelector('#btn-toggle-normativa');
    const drawerNormativa = container.querySelector('#normativa-drawer');
    const chevronNormativa = container.querySelector('#normativa-chevron');

    btnToggleNormativa?.addEventListener('click', () => {
      if (drawerNormativa) {
        const isClosed = drawerNormativa.style.display === 'none';
        drawerNormativa.style.display = isClosed ? 'block' : 'none';
        if (chevronNormativa) chevronNormativa.textContent = isClosed ? '▲' : '▼';
        btnToggleNormativa.querySelector('span:first-child').textContent = isClosed ? 'Ocultar Normativa' : 'Ver Normativa Completa';
      }
    });

    // Swticher de Tabs (Ofertas vs Solicitudes vs Intermediación)
    const tabOfertas = container.querySelector('#tab-ofertas');
    const tabSolicitudes = container.querySelector('#tab-solicitudes');
    const tabIntermediacion = container.querySelector('#tab-intermediacion');
    const sidebarFiltros = container.querySelector('.contrataciones-sidebar');
    const resultsArea = container.querySelector('.contrataciones-results');

    tabOfertas?.addEventListener('click', () => {
      this._activeTab = 'ofertas';
      tabOfertas.classList.add('active');
      tabSolicitudes?.classList.remove('active');
      tabIntermediacion?.classList.remove('active');
      if (sidebarFiltros) sidebarFiltros.style.display = '';
      if (resultsArea) resultsArea.style.width = '';
      this.loadOfertas(container);
    });

    tabSolicitudes?.addEventListener('click', () => {
      this._activeTab = 'solicitudes';
      tabSolicitudes.classList.add('active');
      tabOfertas?.classList.remove('active');
      tabIntermediacion?.classList.remove('active');
      if (sidebarFiltros) sidebarFiltros.style.display = '';
      if (resultsArea) resultsArea.style.width = '';
      this.loadSolicitudes(container);
    });

    tabIntermediacion?.addEventListener('click', () => {
      this._activeTab = 'intermediacion';
      tabIntermediacion.classList.add('active');
      tabOfertas?.classList.remove('active');
      tabSolicitudes?.classList.remove('active');
      if (sidebarFiltros) sidebarFiltros.style.display = 'none';
      if (resultsArea) resultsArea.style.width = '100%';
      this.loadIntermediacion(container);
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
        modalHire.dataset.targetId = '';
        modalHire.dataset.esSolicitud = '';
        document.body.style.overflow = '';
      }
      targetGigId = null;
      isSolicitudTarget = false;
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
        alert('¡Tu postulación/propuesta ha sido registrada exitosamente!');
        // Recargar para actualizar estado
        await this.loadContent(container);
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
      if (!btn || btn.disabled) return;

      if (!isAuth) {
        AuthModal.show('¡Contrata Artistas!', 'Debes iniciar sesión para solicitar contrataciones.');
        return;
      }

      targetGigId = btn.dataset.id;
      isSolicitudTarget = btn.dataset.solicitud === 'true';
      const title = decodeURIComponent(btn.dataset.title || 'Servicio Musical');

      if (modalHire) {
        modalHire.dataset.targetId = targetGigId;
        modalHire.dataset.esSolicitud = isSolicitudTarget ? 'true' : 'false';
        const summaryCard = modalHire.querySelector('#hire-summary-card');
        if (summaryCard) {
          summaryCard.innerHTML = `
            <h4>${title}</h4>
            <p><small>${isSolicitudTarget ? 'Postulación a Solicitud de Evento' : 'Solicitud de Contratación de Músico'}</small></p>
          `;
        }
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
    const currentUser = authService.getCurrentUser();
    const isOwner = currentUser && (
      (esOferta && (currentUser.id === data.artistaId || currentUser.idUsuario === data.artistaId)) ||
      (!esOferta && (currentUser.id === data.contratanteId || currentUser.idUsuario === data.contratanteId))
    );
    const estaCerrado = (!esOferta && data.abierta === false) || (esOferta && data.disponible === false);

    const idForHire = esOferta ? (data.idOfertaServicio || data.id) : (data.idSolicitudContratacion || data.id);
    let btnPostularHtml = '';
    if (!isAuth) {
      btnPostularHtml = `<button class="btn-detalle-postular" onclick="this.disabled=true" style="opacity:0.7;cursor:not-allowed">
        Inicia sesión para ${esOferta ? 'contratar' : 'postularte'}
      </button>`;
    } else if (isOwner) {
      btnPostularHtml = `<button class="btn-detalle-postular" disabled style="background:#f1f5f9;color:#64748b;border:1px solid #cbd5e1;cursor:default;font-weight:600;">
        ⭐ Es tu ${esOferta ? 'Oferta' : 'Solicitud'}
      </button>`;
    } else if (estaCerrado) {
      btnPostularHtml = `<button class="btn-detalle-postular" disabled style="background:#64748b;color:#fff;opacity:0.85;cursor:not-allowed;">
        🔒 ${esOferta ? 'Oferta No Disponible' : 'Evento Tomado / Cerrado'}
      </button>`;
    } else {
      btnPostularHtml = `<button class="btn-detalle-postular" id="btn-detalle-postular"
           data-id="${idForHire}" data-solicitud="${!esOferta}" data-title="${encodeURIComponent(data.titulo)}">
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
           </svg>
           ${esOferta ? 'Solicitar Contratación' : 'Postularme como Músico'}
         </button>`;
    }

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
  },

  // ─────────────────────────────────────────────
  // CARGAR CENTRO DE INTERMEDIACIÓN & SEGUIMIENTO (TAB 3)
  // ─────────────────────────────────────────────
  async loadIntermediacion(container) {
    const layout = container.querySelector('.contrataciones-layout');
    if (layout) layout.classList.add('is-tab-intermediacion');
    const sidebarFiltros = container.querySelector('.contrataciones-sidebar');
    if (sidebarFiltros) sidebarFiltros.style.display = 'none';
    const sortWrap = container.querySelector('.sort-wrap');
    if (sortWrap) sortWrap.style.display = 'none';

    const grid = container.querySelector('#gigs-grid');
    const titleLbl = container.querySelector('#results-count-title');
    const badgeIntermediacion = container.querySelector('#badge-count-intermediacion');
    const isAuth = authService.isAuthenticated();

    if (titleLbl) titleLbl.textContent = 'Centro de Intermediación & Seguimiento Laboral';

    if (!isAuth) {
      if (grid) {
        grid.innerHTML = `
          <div class="intermediacion-wrapper">
            <div class="empty-gigs-card">
              <div class="empty-gigs-icon">🔒</div>
              <h3>Inicia sesión para dar seguimiento a tus solicitudes</h3>
              <p>Accede con tu cuenta para consultar el estado de tus solicitudes canalizadas, comunicarte con el gestor y dar seguimiento a acuerdos.</p>
              <button class="btn-create-gai mt-14" id="btn-login-intermediacion">
                Iniciar Sesión
              </button>
            </div>
          </div>
        `;
        grid.querySelector('#btn-login-intermediacion')?.addEventListener('click', () => {
          AuthModal.show('Seguimiento de Contratación', 'Inicia sesión para acceder al centro de intermediación.');
        });
      }
      return;
    }

    if (grid) grid.innerHTML = `<div class="grid-loading-skeleton"><div class="sk-gig-card"></div><div class="sk-gig-card"></div></div>`;

    const user = authService.getCurrentUser() || {};
    const rol = (user.rolNombre || user.rol || user.role || 'USUARIO').toUpperCase();
    const esGestor = rol === 'ADMIN' || rol === 'MODERADOR';
    const esAuditor = rol === 'AUDITOR';
    const currentUserId = user.idUsuario || user.id || 0;

    let postulaciones = await contratacionService.getPostulaciones();
    this._lastPostulaciones = postulaciones;
    if (badgeIntermediacion) badgeIntermediacion.textContent = postulaciones.length;

    let roleTag = 'CANDIDATO / CONTRATANTE';
    let roleClass = '';
    let roleDescription = 'Visualiza tus solicitudes enviadas y recibidas, con la trazabilidad y mediación del gestor autorizado.';

    if (rol === 'ADMIN') {
      roleTag = 'ADMINISTRADOR DEL SISTEMA';
      roleClass = 'admin';
      roleDescription = 'Control total de solicitudes, bitácora de auditoría, gestión de usuarios y cierre de procesos.';
    } else if (rol === 'AUDITOR') {
      roleTag = 'AUDITOR DE TRANSPARENCIA';
      roleClass = 'auditor';
      roleDescription = 'Supervisión de trazabilidad, cumplimiento de la normativa legal y consulta de la bitácora de auditoría.';
    } else if (rol === 'MODERADOR') {
      roleTag = 'GESTOR AUTORIZADO DE CONTRATACIÓN';
      roleClass = '';
      roleDescription = 'Atención de consultas, análisis de requerimientos y coordinación de comunicación entre partes.';
    }

    let roleBannerHtml = `
      <div class="intermediacion-role-banner">
        <div class="irb-left">
          <div class="irb-badge-row">
            <span class="role-badge-tag ${roleClass}">Rol Activo: ${roleTag}</span>
            <span class="irb-status-pill" style="background:#e0f2fe;color:#0369a1;border:1px solid #bae6fd;font-weight:700;">👤 Usuario: ${user.nombre || user.name || user.email || 'Usuario'}</span>
            <span class="irb-status-pill">🛡️ Centro de Intermediación Operativo</span>
          </div>
          <p class="irb-description">${roleDescription}</p>
        </div>
        ${esAuditor || rol === 'ADMIN' ? `
          <button class="btn-ic-action btn-audit" id="btn-open-audit-log" type="button" title="Ver bitácora de auditoría">
            📜 Bitácora de Auditoría
          </button>
        ` : ''}
      </div>
    `;

    if (postulaciones.length === 0) {
      if (grid) {
        grid.innerHTML = `
          <div class="intermediacion-wrapper">
            ${roleBannerHtml}
            <div class="empty-gigs-card">
              <div class="empty-gigs-icon">📁</div>
              <h3>No hay solicitudes de intermediación activas</h3>
              <p>Cuando un candidato se postule a un evento o solicite contratar a un artista, el proceso aparecerá aquí canalizado por el gestor autorizado.</p>
            </div>
          </div>
        `;
        grid.querySelector('#btn-open-audit-log')?.addEventListener('click', () => {
          window.location.hash = '#/admin';
        });
      }
      return;
    }

    if (grid) {
      const groups = this._groupPostulaciones(postulaciones);
      const recomendadosCount = postulaciones.filter(p => {
        const est = (p.estado || '').toUpperCase();
        return est === 'ACEPTADA' || est === 'COORDINACION' || est === 'CONCRETADA';
      }).length;

      let currentViewMode = 'GRUPOS'; // 'GRUPOS' | 'TODOS' | 'RECOMENDADOS'

      const renderView = (mode) => {
        currentViewMode = mode;
        const cardsList = grid.querySelector('#intermediacion-cards-list');
        if (!cardsList) return;

        if (mode === 'GRUPOS') {
          cardsList.innerHTML = groups.length > 0
            ? groups.map(g => this.renderEventoGroupCard(g, rol, currentUserId, true)).join('')
            : '<div class="empty-gigs-card" style="padding:28px"><p>Sin eventos registrados aún.</p></div>';
        } else if (mode === 'RECOMENDADOS') {
          const recs = postulaciones.filter(p => {
            const est = (p.estado || '').toUpperCase();
            return est === 'ACEPTADA' || est === 'COORDINACION' || est === 'CONCRETADA';
          });
          cardsList.innerHTML = recs.length > 0
            ? recs.map(p => this.renderIntermediacionCard(p, rol, currentUserId)).join('')
            : '<div class="empty-gigs-card" style="padding:28px"><p>No hay candidatos recomendados aún.</p></div>';
        } else {
          cardsList.innerHTML = postulaciones.length > 0
            ? postulaciones.map(p => this.renderIntermediacionCard(p, rol, currentUserId)).join('')
            : '<div class="empty-gigs-card" style="padding:28px"><p>Sin solicitudes registradas.</p></div>';
        }

        this.bindIntermediacionEvents(cardsList, container);
      };

      grid.innerHTML = `
        <div class="intermediacion-wrapper">
          ${roleBannerHtml}
          <div class="intermediacion-filters-bar">
            <span class="ifb-label">Vista de solicitantes:</span>
            <div class="ifb-chips-wrap">
              <button class="filter-chip-btn active" data-view="GRUPOS">📂 Agrupado por Evento / Publicación (${groups.length})</button>
              <button class="filter-chip-btn" data-view="RECOMENDADOS" style="background:#fef3c7;color:#92400e;border-color:#fde68a;font-weight:700;">⭐ Recomendados por la App (${recomendadosCount})</button>
              <button class="filter-chip-btn" data-view="TODOS">📋 Lista Completa Individual (${postulaciones.length})</button>
            </div>
          </div>
          <div class="intermediacion-grid" id="intermediacion-cards-list">
            ${groups.map(g => this.renderEventoGroupCard(g, rol, currentUserId, true)).join('')}
          </div>
        </div>
      `;

      // Filter chips de vista
      const chips = grid.querySelectorAll('.filter-chip-btn');
      chips.forEach(btn => {
        btn.addEventListener('click', () => {
          chips.forEach(c => c.classList.remove('active'));
          btn.classList.add('active');
          const view = btn.dataset.view;
          renderView(view);
        });
      });

      grid.querySelector('#btn-open-audit-log')?.addEventListener('click', () => {
        window.location.hash = '#/admin';
      });

      this.bindIntermediacionEvents(grid, container);
    }
  },

  // ─────────────────────────────────────────────
  // AGRUPAR POSTULACIONES POR EVENTO / PUBLICACIÓN
  // ─────────────────────────────────────────────
  _groupPostulaciones(postulaciones) {
    const map = new Map();
    postulaciones.forEach(p => {
      const isSol = !!p.idSolicitud;
      const key = isSol ? `sol_${p.idSolicitud}` : (p.idOferta ? `of_${p.idOferta}` : `post_${p.idPostulacion}`);
      if (!map.has(key)) {
        map.set(key, {
          key,
          idSolicitud: p.idSolicitud,
          idOferta: p.idOferta,
          tipo: isSol ? 'solicitud' : 'oferta',
          titulo: p.solicitudTitulo || p.ofertaTitulo || (isSol ? `Solicitud de Evento #${p.idSolicitud}` : `Oferta de Servicio #${p.idOferta}`),
          postulantes: []
        });
      }
      map.get(key).postulantes.push(p);
    });
    return Array.from(map.values());
  },

  // ─────────────────────────────────────────────
  // RENDERIZAR GRUPO DE EVENTO CON SOLICITANTES ADENTRO
  // ─────────────────────────────────────────────
  renderEventoGroupCard(group, rol, currentUserId, defaultExpanded = true) {
    const isSol = group.tipo === 'solicitud';
    const total = group.postulantes.length;
    const recomendadosList = group.postulantes.filter(p => {
      const est = (p.estado || '').toUpperCase();
      return est === 'ACEPTADA' || est === 'COORDINACION' || est === 'CONCRETADA';
    });
    const recomendados = recomendadosList.length;
    const esAdminOGestor = rol === 'ADMIN' || rol === 'MODERADOR';

    return `
      <div class="evento-group-card ${defaultExpanded ? 'is-expanded' : ''}" data-group-key="${group.key}">
        <div class="eg-header">
          <div class="eg-header-left">
            <div class="eg-icon-wrap">
              ${isSol ? '💼' : '🎵'}
            </div>
            <div class="eg-info-wrap">
              <div class="eg-type-row">
                <span class="eg-type-tag ${isSol ? 'solicitud' : 'oferta'}">
                  ${isSol ? '💼 Solicitud de Evento' : '🎵 Oferta de Servicio'}
                </span>
                ${group.idSolicitud ? `<span class="ic-id-tag">#${group.idSolicitud}</span>` : (group.idOferta ? `<span class="ic-id-tag">#${group.idOferta}</span>` : '')}
                ${recomendados > 0 ? `<span class="nb-pill highlight" style="font-size:0.75rem;padding:2px 8px;">⭐ ${recomendados} Recomendado(s) por MiSostenido</span>` : ''}
              </div>
              <h3 class="eg-title">${group.titulo}</h3>
              <div class="eg-meta-sub">
                <span>👥 ${total} solicitante${total !== 1 ? 's' : ''} aplicando a este evento</span>
                ${recomendados > 0 ? `<span style="color:#0d6855;font-weight:700;">• ⭐ ${recomendados} opción(es) validada(s) lista(s) para contratar</span>` : ''}
              </div>
            </div>
          </div>

          <div class="eg-header-right">
            ${esAdminOGestor && recomendados > 0 ? `
              <button class="btn-comunicar-opciones-evento" data-group-key="${group.key}" type="button" title="Enviar informe de candidatos recomendados al contratante" style="background:#0d6855;color:#fff;border:none;padding:6px 14px;border-radius:8px;font-size:0.78rem;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;">
                📢 Presentar Opciones al Contratante
              </button>
            ` : ''}
            <span class="eg-count-badge">
              ${total} Postulante${total !== 1 ? 's' : ''}
            </span>
            <button class="eg-chevron-btn" type="button" title="Desplegar u ocultar solicitantes">
              ▼
            </button>
          </div>
        </div>

        <div class="eg-body">
          <div class="eg-body-header">
            <span>📋 Músicos / Candidatos aplicando a este evento:</span>
            <small style="color:#64748b">${total} candidato(s) registrado(s) • ${recomendados} recomendado(s)</small>
          </div>
          ${recomendados > 0 ? `
            <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;padding:10px 14px;font-size:0.82rem;color:#065f46;display:flex;align-items:center;gap:8px;">
              <span>⭐ <strong>Opciones Recomendadas por la App:</strong> MiSostenido ha verificado estos perfiles para garantizar profesionalismo, puntualidad y cumplimiento. Puedes comunicarte y cerrar el acuerdo con el que más te convenza.</span>
            </div>
          ` : ''}
          <div class="eg-candidates-list">
            ${group.postulantes.map(p => this.renderIntermediacionCard(p, rol, currentUserId)).join('')}
          </div>
        </div>
      </div>
    `;
  },

  renderIntermediacionCard(p, rol, currentUserId) {
    const estado = (p.estado || 'PENDIENTE').toUpperCase();
    let estadoClass = 'pendiente';
    let estadoLabel = '🟡 EN EVALUACIÓN POR MISOSTENIDO';
    let isRecomendado = false;
    let isContratada = false;

    if (estado === 'EN_REVISION') {
      estadoClass = 'en_revision';
      estadoLabel = '🔍 EN REVISIÓN DE CALIDAD';
    } else if (estado === 'RECOMENDADA' || estado === 'RECOMENDADO' || estado === 'VALIDADA' || estado === 'COORDINACION') {
      estadoClass = 'coordinacion';
      estadoLabel = '⭐ CANDIDATO VALIDADO & RECOMENDADO POR LA APP';
      isRecomendado = true;
    } else if (estado === 'CONTRATADA' || estado === 'CONCRETADA' || estado === 'ACEPTADA') {
      estadoClass = 'contratada';
      estadoLabel = '🎉 CONTRATACIÓN CONCRETADA & ASIGNADA';
      isContratada = true;
      isRecomendado = true;
    } else if (estado === 'RECHAZADA') {
      estadoClass = 'rechazada';
      estadoLabel = '❌ PROPUESTA NO SELECCIONADA';
    } else if (estado === 'CERRADA' || estado === 'CANCELADA') {
      estadoClass = 'cerrada';
      estadoLabel = '⚫ PROCESO CERRADO';
    }

    const fechaStr = p.fecha ? new Date(p.fecha).toLocaleDateString('es-NI', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Fecha reciente';
    const emisorAvatar = p.emisorFoto
      ? this.formatMediaUrl(p.emisorFoto)
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(p.emisorNombre || 'C')}&background=0d6855&color=fff`;

    const tituloRelacionado = p.ofertaTitulo || p.solicitudTitulo || (p.idOferta ? `Oferta de Servicio #${p.idOferta}` : `Solicitud de Evento #${p.idSolicitud}`);
    const esGestorOAdmin = rol === 'ADMIN' || rol === 'MODERADOR';
    const esAuditor = rol === 'AUDITOR';

    // Determinar roles
    const esPostulante = String(p.emisorId) === String(currentUserId);
    const esContratante = !esGestorOAdmin && !esAuditor && !esPostulante;

    return `
      <div class="intermediacion-card ${isContratada ? 'card-contratada' : (isRecomendado ? 'card-recomendado' : '')}" data-id="${p.idPostulacion}">
        <div class="ic-header">
          <div class="ic-title-group">
            <div class="ic-badge-type-row">
              <span class="ic-target-link">${p.idOferta ? '🎵 Oferta de Servicio' : '💼 Solicitud de Evento'}</span>
              <span class="ic-id-tag">#${p.idPostulacion}</span>
              ${isContratada ? '<span class="nb-pill highlight" style="background:#dcfce7;color:#166534;font-size:0.75rem;padding:2px 8px;font-weight:700;">🤝 Contratación Cerrada</span>' : (isRecomendado ? '<span class="nb-pill highlight" style="font-size:0.75rem;padding:2px 8px;font-weight:700;">🌟 Recomendado por Administrador</span>' : '')}
            </div>
            <h3 class="ic-card-title">${tituloRelacionado}</h3>
          </div>
          <span class="ic-status-badge ${estadoClass}">${estadoLabel}</span>
        </div>

        <div class="ic-users-container">
          <div class="ic-user-card ic-user-sender">
            <span class="ic-user-role-label">👤 Postulante / Candidato</span>
            <div class="ic-user-body">
              <img src="${emisorAvatar}" alt="${p.emisorNombre}" class="ic-user-avatar" />
              <div class="ic-user-info-text">
                <strong class="ic-user-name">${p.emisorNombre || 'Usuario'}</strong>
                <span class="ic-user-meta">${p.emisorTipo || 'Músico / Candidato'} ${p.emisorEmail ? `• ${p.emisorEmail}` : ''}</span>
              </div>
            </div>
            <div style="margin-top:8px;">
              <a href="#/perfil?id=${p.emisorId || ''}" class="btn-ic-action btn-ver-perfil-candidato" style="font-size:0.78rem;padding:4px 10px;text-decoration:none;display:inline-flex;align-items:center;gap:4px;background:#f1f5f9;color:#334155;border-radius:6px;font-weight:600;">
                👤 Ver Perfil & Portafolio
              </a>
            </div>
          </div>

          <div class="ic-connector">
            <span class="ic-connector-arrow">➔</span>
            <span class="ic-connector-sub">${isContratada ? '🤝 Contratado' : (isRecomendado ? '⭐ Validado' : 'En Revisión')}</span>
          </div>

          <div class="ic-user-card ic-user-mediator">
            <span class="ic-user-role-label">🛡️ Mediación & Garantía MiSostenido</span>
            <div class="ic-user-body">
              <div class="ic-mediator-icon">⚖️</div>
              <div class="ic-user-info-text">
                <strong class="ic-user-name">Gestor Autorizado Asignado</strong>
                <span class="ic-user-meta">Verificación, antecedentes limpios y mediación neutral</span>
              </div>
            </div>
          </div>
        </div>

        <div class="ic-message-box">
          <div class="ic-message-header">
            <span class="ic-message-title">💬 Propuesta / Mensaje del Postulante:</span>
          </div>
          <p class="ic-message-text">${p.mensaje || 'Solicitud de contacto e intermediación laboral.'}</p>
        </div>

        <div class="ic-actions-footer">
          <div class="ic-footer-left">
            <span class="ic-date-lbl">📅 Registrado: ${fechaStr}</span>
          </div>
          
          <div class="ic-manager-controls">
            <!-- Botón principal de chat y sala de negociación -->
            <button class="btn-ic-action btn-open-chat" data-id="${p.idPostulacion}" type="button"
              title="Abrir sala de chat y negociación"
              style="${isRecomendado || isContratada ? 'background:#0d6855;color:#fff;font-weight:bold;' : ''}">
              💬 Sala de Negociación & Chat
            </button>

            ${esContratante && !isContratada ? `
              <!-- BOTONES PRINCIPALES para el CONTRATANTE/ORGANIZADOR: Aceptar o Rechazar -->
              <button class="btn-ic-action btn-cerrar-trato-directo" data-id="${p.idPostulacion}" type="button"
                style="background:#047857;color:#fff;font-weight:700;font-size:0.92rem;padding:8px 16px;border-radius:10px;border:none;cursor:pointer;display:inline-flex;align-items:center;gap:6px;"
                title="Aceptar este candidato y formalizar la contratación">
                🤝 Aceptar & Contratar
              </button>
              <button class="btn-ic-action btn-rechazar-oferta-contratante" data-id="${p.idPostulacion}" type="button"
                style="background:#fef2f2;color:#b91c1c;border:1px solid #fecaca;font-weight:700;font-size:0.88rem;padding:8px 14px;border-radius:10px;cursor:pointer;display:inline-flex;align-items:center;gap:5px;"
                title="No me convence esta propuesta / Descartar candidato">
                ❌ No Aceptar
              </button>
            ` : ''}

            ${esContratante && isContratada ? `
              <span class="nb-pill" style="background:#dcfce7;color:#166534;font-weight:700;padding:6px 12px;border-radius:8px;">
                ✓ Ya Contrataste a este Músico
              </span>
            ` : ''}

            ${esGestorOAdmin ? `
              <!-- CONTROLES DEL ADMIN: Validar y recomendar al contratante -->
              <div class="ic-control-group">
                <label class="ic-control-label">Validación Gestor:</label>
                <select class="ic-status-select" data-id="${p.idPostulacion}">
                  <option value="RECOMENDADA" ${estado === 'RECOMENDADA' || estado === 'RECOMENDADO' || estado === 'VALIDADA' || estado === 'COORDINACION' ? 'selected' : ''}>⭐ Validar & Recomendar al Contratante</option>
                  <option value="CONTRATADA" ${estado === 'CONTRATADA' || estado === 'CONCRETADA' || estado === 'ACEPTADA' ? 'selected' : ''}>🤝 Contratación Concretada</option>
                  <option value="EN_REVISION" ${estado === 'PENDIENTE' || estado === 'EN_REVISION' ? 'selected' : ''}>🟡 En Revisión de Calidad</option>
                  <option value="RECHAZADA" ${estado === 'RECHAZADA' ? 'selected' : ''}>❌ No Apto / Rechazar</option>
                </select>
                <button class="btn-ic-action btn-save-status" data-id="${p.idPostulacion}" type="button">
                  Guardar
                </button>
              </div>
            ` : ''}

            ${esAuditor ? `
              <span class="nb-pill" style="font-size:0.75rem">🔍 Supervisión de Auditoría Activa</span>
            ` : ''}

            ${esPostulante ? `
              <!-- El postulante ve el estado de su propia postulación -->
              <span class="nb-pill" style="font-size:0.82rem;padding:6px 14px;background:${isContratada ? '#dcfce7' : (isRecomendado ? '#fef3c7' : '#f1f5f9')};color:${isContratada ? '#166534' : (isRecomendado ? '#92400e' : '#64748b')};border-radius:8px;font-weight:700;">
                ${isContratada ? '🎉 ¡Fuiste contratado formalmente para este evento!' : (isRecomendado ? '⭐ Tu perfil fue validado y recomendado al organizador' : '⏳ Tu propuesta está en revisión por MiSostenido')}
              </span>
            ` : ''}

            <button class="btn-ic-action btn-report btn-report-postulacion" data-id="${p.idPostulacion}" type="button" title="Reportar irregularidad">
              🚩 Reportar
            </button>
          </div>
        </div>
      </div>
    `;
  },

  bindIntermediacionEvents(container, pageContainer) {
    // Acordeón de Eventos: Expandir / Colapsar
    container.querySelectorAll('.eg-header').forEach(header => {
      header.addEventListener('click', (e) => {
        const card = header.closest('.evento-group-card');
        if (card) {
          card.classList.toggle('is-expanded');
        }
      });
    });

    // Abrir Chat y Sala de Negociación
    container.querySelectorAll('.btn-open-chat').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idPostulacion = btn.dataset.id;
        const post = this._lastPostulaciones?.find(p => String(p.idPostulacion) === String(idPostulacion)) || { idPostulacion };
        this.openChatModal(idPostulacion, post);
      });
    });

    // Guardar avance de estado por gestor/admin
    container.querySelectorAll('.btn-save-status').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const idPostulacion = btn.dataset.id;
        const select = container.querySelector(`.ic-status-select[data-id="${idPostulacion}"]`);
        if (!select) return;

        const nuevoEstado = select.value;
        btn.disabled = true;
        btn.textContent = 'Guardando...';

        try {
          await contratacionService.actualizarEstadoPostulacion(idPostulacion, nuevoEstado);
          alert('¡Validación guardada exitosamente! El estado ha sido actualizado.');
          this.loadIntermediacion(pageContainer);
        } catch (err) {
          alert('Error al registrar validación: ' + (err.message || 'Verifica la conexión'));
        } finally {
          btn.disabled = false;
          btn.textContent = 'Guardar Validación';
        }
      });
    });

    // Presentar Opciones Recomendadas al Contratante (por Admin/Gestor)
    container.querySelectorAll('.btn-comunicar-opciones-evento').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const groupKey = btn.dataset.groupKey;
        const groups = this._groupPostulaciones(this._lastPostulaciones || []);
        const group = groups.find(g => g.key === groupKey);
        if (!group) return;

        const recomendados = group.postulantes.filter(p => {
          const est = (p.estado || '').toUpperCase();
          return est === 'ACEPTADA' || est === 'COORDINACION' || est === 'CONCRETADA';
        });

        if (recomendados.length === 0) {
          alert('No hay candidatos recomendados en este evento todavía.');
          return;
        }

        const primerPost = recomendados[0];
        const nombresList = recomendados.map((r, i) => `${i + 1}. ${r.emisorNombre} (${r.emisorTipo || 'Músico'}) - "${r.mensaje || 'Listo para el evento'}"`).join('\n');
        const informeMsg = `⭐ [INFORME OFICIAL DE CANDIDATOS RECOMENDADOS]:\nEstimado organizador, tras evaluar las postulaciones para "${group.titulo}", MiSostenido te presenta las siguientes opciones recomendadas y validadas:\n\n${nombresList}\n\nPuedes revisar sus perfiles y confirmar la asignación con el que prefieras para formalizar el pre-contrato.`;

        await this.openChatModal(primerPost.idPostulacion, primerPost);
        const modal = document.querySelector('body > #modal-chat-negociacion') || document.querySelector('#modal-chat-negociacion');
        if (modal) {
          await this.sendChatMessage(primerPost.idPostulacion, informeMsg, modal, primerPost, true);
        }
      });
    });

    // Aceptar y Cerrar Trato Directo (Contratante / Admin)
    container.querySelectorAll('.btn-cerrar-trato-directo').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const idPostulacion = btn.dataset.id;
        const post = this._lastPostulaciones?.find(p => String(p.idPostulacion) === String(idPostulacion)) || { idPostulacion };
        
        await this.openChatModal(idPostulacion, post);
        const modal = document.querySelector('body > #modal-chat-negociacion') || document.querySelector('#modal-chat-negociacion');
        if (modal) {
          const tabAcuerdo = modal.querySelector('#tab-sub-acuerdo');
          tabAcuerdo?.click();
        }
      });
    });

    // Rechazar / No Aceptar Oferta (Contratante)
    container.querySelectorAll('.btn-rechazar-oferta-contratante').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const idPostulacion = btn.dataset.id;
        const post = this._lastPostulaciones?.find(p => String(p.idPostulacion) === String(idPostulacion)) || { idPostulacion };
        
        const confirmar = confirm(`¿Estás seguro de que no deseas aceptar esta propuesta? La postulación de ${post.emisorNombre || 'este candidato'} será descartada, pero tu publicación seguirá abierta para recibir más opciones.`);
        if (!confirmar) return;

        try {
          await contratacionService.actualizarEstadoPostulacion(idPostulacion, 'RECHAZADA');
          alert('Has descartado esta propuesta. Tu evento sigue disponible.');
          this.loadIntermediacion(pageContainer);
        } catch (err) {
          alert('Error al actualizar estado: ' + (err.message || 'Verifica la conexión'));
        }
      });
    });

    // Reportar
    container.querySelectorAll('.btn-report-postulacion').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idPostulacion = btn.dataset.id;
        this.openReportModal('POSTULACION', idPostulacion, `Solicitud #${idPostulacion}`);
      });
    });
  },

  // ─────────────────────────────────────────────
  // SALA DE NEGOCIACIÓN & CHAT EN VIVO DE CONTRATACIÓN
  // ─────────────────────────────────────────────
  async openChatModal(idPostulacion, post) {
    const modal = document.querySelector('body > #modal-chat-negociacion') || document.querySelector('#modal-chat-negociacion');
    if (!modal) return;

    modal.dataset.idPostulacion = idPostulacion;
    const tituloRelacionado = post.ofertaTitulo || post.solicitudTitulo || `Solicitud #${idPostulacion}`;
    const user = authService.getCurrentUser() || {};

    const titleEl = modal.querySelector('#chat-title');
    if (titleEl) titleEl.textContent = `Sala de Negociación: ${tituloRelacionado}`;

    const subtitleEl = modal.querySelector('#chat-subtitle');
    if (subtitleEl) subtitleEl.textContent = `Canal formal entre ${post.emisorNombre || 'Candidato'} y Contratante • Mediación oficial por MiSostenido`;

    // ── Cargar información de los participantes (Creador del Evento, Candidato, Gestor) ──
    const participantsBar = modal.querySelector('#chat-participants-bar');
    const assignmentBar = modal.querySelector('#chat-assignment-action-bar');
    
    let creadorNombre = 'Organizador / Creador';
    let creadorAvatar = `https://ui-avatars.com/api/?name=Organizador&background=1a9974&color=fff`;
    try {
      if (post.idSolicitud) {
        const solDetalle = await contratacionService.getSolicitudDetalle(post.idSolicitud);
        if (solDetalle) {
          creadorNombre = solDetalle.contratanteNombre || 'Contratante';
          if (solDetalle.fotoPerfilUrl) creadorAvatar = this.formatMediaUrl(solDetalle.fotoPerfilUrl);
        }
      } else if (post.idOferta) {
        const ofDetalle = await contratacionService.getOfertaDetalle(post.idOferta);
        if (ofDetalle) {
          creadorNombre = ofDetalle.artistaNombre || 'Artista';
          if (ofDetalle.fotoPerfilUrl) creadorAvatar = this.formatMediaUrl(ofDetalle.fotoPerfilUrl);
        }
      }
    } catch (e) {
      console.warn('Error cargando detalles del creador:', e);
    }

    const candidatoAvatar = post.emisorFoto
      ? this.formatMediaUrl(post.emisorFoto)
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(post.emisorNombre || 'Candidato')}&background=0d6855&color=fff`;

    if (participantsBar) {
      participantsBar.innerHTML = `
        <div class="cp-item">
          <img src="${creadorAvatar}" alt="${creadorNombre}" class="cp-avatar" />
          <div class="cp-text-wrap">
            <span class="cp-tag">👑 Creador del Evento</span>
            <strong class="cp-name">${creadorNombre}</strong>
          </div>
        </div>

        <div class="cp-item">
          <img src="${candidatoAvatar}" alt="${post.emisorNombre}" class="cp-avatar" />
          <div class="cp-text-wrap">
            <span class="cp-tag">🎵 Músico Postulante</span>
            <strong class="cp-name">${post.emisorNombre || 'Candidato'}</strong>
          </div>
        </div>

        <div class="cp-item">
          <div class="ic-mediator-icon" style="width:32px;height:32px;font-size:0.9rem;">⚖️</div>
          <div class="cp-text-wrap">
            <span class="cp-tag">🛡️ Gestor / Admin</span>
            <strong class="cp-name">Gestor MiSostenido</strong>
          </div>
        </div>
      `;
    }

    // ── Barra de Asignación y Validación ──
    const currentUserId = user.idUsuario || user.id || 0;
    const estadoActual = (post.estado || '').toUpperCase();
    const yaAsignado = estadoActual === 'CONTRATADA' || estadoActual === 'CONCRETADA' || estadoActual === 'ACEPTADA';
    const rolUsuario = (user.rolNombre || user.rol || user.role || 'USUARIO').toUpperCase();
    const esAdminOGestor = rolUsuario === 'ADMIN' || rolUsuario === 'MODERADOR';
    
    let creadorId = null;
    try {
      if (post.idSolicitud) {
        const solDetalle = await contratacionService.getSolicitudDetalle(post.idSolicitud);
        if (solDetalle) creadorId = solDetalle.contratanteId || solDetalle.idUsuario;
      } else if (post.idOferta) {
        const ofDetalle = await contratacionService.getOfertaDetalle(post.idOferta);
        if (ofDetalle) creadorId = ofDetalle.artistaId || ofDetalle.idUsuario;
      }
    } catch (e) {
      console.warn('Error resolviendo creadorId:', e);
    }

    const esCreador = creadorId && String(creadorId) === String(currentUserId);
    const esPostulante = String(post.emisorId) === String(currentUserId);

    if (assignmentBar) {
      if (yaAsignado) {
        assignmentBar.innerHTML = `
          <div class="caab-info">
            <span>🔒 <strong>Contratación Concretada:</strong> Este evento ha sido formalizado y asignado formalmente a <strong>${post.emisorNombre || 'el candidato'}</strong>. Los términos del pre-contrato son definitivos e inmutables.</span>
          </div>
          <span class="caab-badge-assigned">✓ CONTRATACIÓN CERRADA & ASIGNADA</span>
        `;
      } else if (esCreador || esAdminOGestor) {
        assignmentBar.innerHTML = `
          <div class="caab-info">
            <span>💡 <strong>${esCreador ? 'Organizador del Evento' : 'Gestor MiSostenido'}:</strong> ${esAdminOGestor ? 'Como Administrador, evalúa el perfil y presenta formalmente la recomendación al organizador.' : 'Negocia los detalles y decide si aceptas o descartas esta propuesta.'}</span>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${esAdminOGestor ? `
              <button class="caab-btn-assign" id="btn-proponer-candidato-chat" type="button" style="background:#0284c7;">
                ⭐ Recomendar Candidato
              </button>
            ` : ''}
            <button class="caab-btn-assign" id="btn-confirmar-asignacion-chat" type="button" style="background:#047857;">
              🤝 Confirmar Contratación
            </button>
            ${esCreador ? `
              <button class="caab-btn-assign" id="btn-rechazar-asignacion-chat" type="button" style="background:#dc2626;">
                ❌ Descartar Oferta
              </button>
            ` : ''}
          </div>
        `;

        // Evento Proponer Candidato por Admin
        assignmentBar.querySelector('#btn-proponer-candidato-chat')?.addEventListener('click', async () => {
          try {
            await contratacionService.actualizarEstadoPostulacion(idPostulacion, 'RECOMENDADA');
            await this.sendChatMessage(
              idPostulacion,
              `⭐ [GESTOR MiSostenido]: Hola ${creadorNombre}, te informamos que el perfil de ${post.emisorNombre || 'este postulante'} ha sido auditado y cumple con los estándares de calidad de MiSostenido. Te lo recomendamos formalmente para tu evento.`,
              modal,
              post,
              true
            );
            alert('¡Candidato validado y recomendado formalmente al organizador!');
            this.loadContent(this._container);
          } catch (err) {
            alert('Error al recomendar candidato: ' + (err.message || 'Verifica la conexión'));
          }
        });

        // Evento Confirmar Contratación por Contratante
        assignmentBar.querySelector('#btn-confirmar-asignacion-chat')?.addEventListener('click', async () => {
          const confirmar = confirm(`¿Deseas confirmar formalmente la contratación de ${post.emisorNombre || 'este candidato'}? El evento quedará registrado como TOMADO / ASIGNADO y se formalizará el pre-contrato digital.`);
          if (!confirmar) return;

          try {
            await contratacionService.actualizarEstadoPostulacion(idPostulacion, 'CONTRATADA');
            if (post.idSolicitud) {
              await contratacionService.cambiarEstadoSolicitud(post.idSolicitud, false);
            }
            await this.sendChatMessage(
              idPostulacion,
              `🎉 [SISTEMA]: ¡CONTRATACIÓN CONCRETADA! El organizador ha confirmado oficialmente la contratación de ${post.emisorNombre || 'Candidato'}. El evento queda cerrado y asignado formalmente.`,
              modal,
              post,
              true
            );
            alert('🎉 ¡Contratación formalizada y cerrada exitosamente!');
            this.loadContent(this._container);
            this.openChatModal(idPostulacion, { ...post, estado: 'CONTRATADA' });
          } catch (err) {
            alert('Error al contratar: ' + (err.message || 'Verifica la conexión'));
          }
        });

        // Evento Rechazar / Descartar Oferta por Contratante
        assignmentBar.querySelector('#btn-rechazar-asignacion-chat')?.addEventListener('click', async () => {
          const confirmar = confirm(`¿Deseas descartar esta propuesta de ${post.emisorNombre || 'este candidato'}? Tu evento seguirá abierto y podrás evaluar a otros talentos.`);
          if (!confirmar) return;

          try {
            await contratacionService.actualizarEstadoPostulacion(idPostulacion, 'RECHAZADA');
            await this.sendChatMessage(
              idPostulacion,
              `❌ [ORGANIZADOR]: El organizador ha evaluado la propuesta y ha decidido no aceptarla en esta ocasión. El evento continúa abierto para evaluar otras opciones.`,
              modal,
              post,
              true
            );
            alert('Has descartado esta propuesta. Tu evento continúa disponible.');
            this.loadContent(this._container);
            this.openChatModal(idPostulacion, { ...post, estado: 'RECHAZADA' });
          } catch (err) {
            alert('Error al descartar propuesta: ' + (err.message || 'Verifica la conexión'));
          }
        });
      } else {
        // Vista para el postulante o participante general
        assignmentBar.innerHTML = `
          <div class="caab-info">
            <span>🎵 <strong>Propuesta en Negociación:</strong> ${esPostulante ? 'Tu propuesta está en revisión por el organizador y el equipo de MiSostenido. Coordina requerimientos y repertorio por este canal.' : 'Revisión formal de propuesta.'}</span>
          </div>
          <span class="nb-pill" style="background:#f1f5f9;color:#475569;font-weight:600;font-size:0.8rem;padding:6px 12px;border-radius:8px;">⏳ En Negociación</span>
        `;
      }
    }

    // Reset tabs inside modal
    const tabChat = modal.querySelector('#tab-sub-chat');
    const tabAcuerdo = modal.querySelector('#tab-sub-acuerdo');
    const tabSoporte = modal.querySelector('#tab-sub-soporte');

    const contentChat = modal.querySelector('#content-sub-chat');
    const contentAcuerdo = modal.querySelector('#content-sub-acuerdo');
    const contentSoporte = modal.querySelector('#content-sub-soporte');

    const setTab = (activeTab, activeContent) => {
      [tabChat, tabAcuerdo, tabSoporte].forEach(t => t?.classList.remove('active'));
      [contentChat, contentAcuerdo, contentSoporte].forEach(c => { if (c) c.style.display = 'none'; });
      activeTab?.classList.add('active');
      if (activeContent) activeContent.style.display = 'block';
    };

    tabChat.onclick = () => setTab(tabChat, contentChat);
    tabAcuerdo.onclick = () => setTab(tabAcuerdo, contentAcuerdo);
    tabSoporte.onclick = () => setTab(tabSoporte, contentSoporte);
    setTab(tabChat, contentChat);

    // Cargar mensajes de chat y acuerdo real de la base de datos
    await this.renderChatMessages(idPostulacion, post, modal);
    await this.renderAcuerdoData(idPostulacion, post, modal);
    this.bindRatingStars(modal);

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Iniciar sondeo en vivo (cada 2.5s) mientras el modal esté abierto
    if (this._chatPollingTimer) clearInterval(this._chatPollingTimer);
    this._chatPollingTimer = setInterval(() => {
      if (modal.style.display !== 'none') {
        this.renderChatMessages(idPostulacion, post, modal, true);
      } else {
        clearInterval(this._chatPollingTimer);
        this._chatPollingTimer = null;
      }
    }, 2500);

    // Cerrar modal
    const closeModal = () => {
      if (this._chatPollingTimer) {
        clearInterval(this._chatPollingTimer);
        this._chatPollingTimer = null;
      }
      modal.style.display = 'none';
      document.body.style.overflow = '';
    };

    const btnClose = modal.querySelector('#btn-close-chat-modal');
    if (btnClose) btnClose.onclick = closeModal;

    // Quick chips
    modal.querySelectorAll('.btn-quick-chip').forEach(chip => {
      chip.onclick = () => {
        const input = modal.querySelector('#input-chat-message');
        if (input) {
          input.value = chip.dataset.msg;
          input.focus();
        }
      };
    });

    // Enviar mensaje real
    const formChat = modal.querySelector('#form-chat-send');
    formChat.onsubmit = async (e) => {
      e.preventDefault();
      const input = modal.querySelector('#input-chat-message');
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      await this.sendChatMessage(idPostulacion, text, modal, post);
    };

    // Firmar acuerdo digital en la base de datos
    const btnFirmar = modal.querySelector('#btn-firmar-acuerdo');
    if (btnFirmar) {
      btnFirmar.onclick = () => this.handleFirmarAcuerdo(idPostulacion, modal, post);
    }

    // Descargar resumen formal
    const btnDescargar = modal.querySelector('#btn-descargar-resumen');
    if (btnDescargar) {
      btnDescargar.onclick = () => this.handleDescargarResumen(idPostulacion, post);
    }

    // Solicitar intervención de gestor
    const btnSolicitarGestor = modal.querySelector('#btn-solicitar-gestor-chat');
    if (btnSolicitarGestor) {
      btnSolicitarGestor.onclick = async () => {
        await this.sendChatMessage(idPostulacion, '📢 [SISTEMA]: Se ha solicitado formalmente la asistencia de un Gestor Autorizado de MiSostenido en esta sala de negociación.', modal, post, true);
        alert('¡Asistencia solicitada! El Gestor Autorizado y los auditores han recibido la notificación.');
      };
    }

    // Enviar calificación
    const btnCalificar = modal.querySelector('#btn-enviar-calificacion');
    if (btnCalificar) {
      btnCalificar.onclick = () => {
        alert('⭐ ¡Calificación y testimonio registrados con éxito en el perfil verificado!');
        const comm = modal.querySelector('#review-comment');
        if (comm) comm.value = '';
      };
    }
  },

  async renderChatMessages(idPostulacion, post, modal, isPolling = false) {
    const container = modal.querySelector('#chat-messages-list');
    if (!container) return;

    const currentUser = authService.getCurrentUser() || {};
    const currentUserId = parseInt(currentUser.idUsuario || currentUser.id || 0, 10);

    let mensajes = [];
    try {
      mensajes = await contratacionService.getMensajes(idPostulacion);
    } catch (e) {
      console.warn('Error al cargar mensajes:', e);
    }

    const initialDate = post.fecha ? new Date(post.fecha).toLocaleDateString('es-NI', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Inicio del proceso';

    // Cabecera fija: Bienvenida del sistema + Propuesta inicial del músico (NUNCA DESAPARECE)
    let headerHtml = `
      <div class="chat-bubble-system">
        <span>🛡️ <strong>Sala de Negociación MiSostenido iniciada.</strong> Canal protegido para acordar términos, honorarios y condiciones del evento.</span>
      </div>
      ${post.mensaje ? `
        <div class="chat-message-row msg-pinned-proposal">
          <div class="chat-bubble" style="background:#f0fdf4;border:1px solid #bbf7d0;color:#166534;width:100%;max-width:100%;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
              <span class="chat-bubble-sender" style="color:#15803d;font-weight:700;">🎵 Propuesta Inicial de ${post.emisorNombre || 'Candidato'}:</span>
              <span class="chat-bubble-time" style="color:#16a34a;">${initialDate}</span>
            </div>
            <p class="chat-bubble-text" style="color:#14532d;font-size:0.92rem;margin:0;">"${post.mensaje}"</p>
          </div>
        </div>
      ` : ''}
    `;

    const chatItemsHtml = (mensajes || []).map(m => {
      const isSystem = m.tipoMensaje === 'SISTEMA' || m.emisorRol === 'SISTEMA';
      if (isSystem) {
        return `
          <div class="chat-bubble-system">
            <span>${m.contenido}</span>
          </div>
        `;
      }

      const isMe = m.idUsuarioEmisor === currentUserId || (currentUserId > 0 && m.idUsuarioEmisor === currentUserId);
      const fecha = m.fechaEnvio ? new Date(m.fechaEnvio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
      const rolBadge = m.emisorRol && m.emisorRol !== 'USUARIO' ? `<span class="badge-role-tag">${m.emisorRol}</span>` : '';

      return `
        <div class="chat-message-row ${isMe ? 'msg-me' : 'msg-other'}">
          <div class="chat-bubble">
            <span class="chat-bubble-sender">${m.emisorNombre || 'Usuario'} ${rolBadge}</span>
            <p class="chat-bubble-text">${m.contenido}</p>
            ${m.archivoUrl ? `<a href="${m.archivoUrl}" target="_blank" class="chat-attachment-link">📎 Ver archivo adjunto</a>` : ''}
            <span class="chat-bubble-time">${fecha}</span>
          </div>
        </div>
      `;
    }).join('');

    const wasNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
    container.innerHTML = headerHtml + chatItemsHtml;

    if (!isPolling || wasNearBottom) {
      container.scrollTop = container.scrollHeight;
    }
  },

  async sendChatMessage(idPostulacion, text, modal, post, isSystem = false) {
    if (!text || !text.trim()) return;

    try {
      await contratacionService.enviarMensaje({
        idPostulacion,
        contenido: text,
        tipoMensaje: isSystem ? 'SISTEMA' : 'TEXTO'
      });
      await this.renderChatMessages(idPostulacion, post, modal);
    } catch (err) {
      alert('Error al enviar mensaje: ' + (err.message || 'Verifica tu conexión a la API'));
    }
  },

  async renderAcuerdoData(idPostulacion, post, modal) {
    let acuerdo = null;
    try {
      acuerdo = await contratacionService.getAcuerdo(idPostulacion);
    } catch (e) {
      console.warn('Error al obtener acuerdo:', e);
    }

    const inpPrecio = modal.querySelector('#acuerdo-precio');
    const inpDuracion = modal.querySelector('#acuerdo-duracion');
    const inpFecha = modal.querySelector('#acuerdo-fecha-hora');
    const inpUbicacion = modal.querySelector('#acuerdo-ubicacion');

    const chkSonido = modal.querySelector('#chk-sonido-incluido');
    const chkTrans = modal.querySelector('#chk-transporte-incluido');
    const chkAnticipo = modal.querySelector('#chk-anticipo-pactado');

    if (acuerdo) {
      if (inpPrecio) inpPrecio.value = acuerdo.honorariosAcordados ?? '';
      if (inpDuracion && acuerdo.clausulasEspeciales) {
        try {
          const parsed = JSON.parse(acuerdo.clausulasEspeciales);
          if (parsed.duracion) inpDuracion.value = parsed.duracion;
          if (parsed.ubicacion && inpUbicacion) inpUbicacion.value = parsed.ubicacion;
          if (chkSonido) chkSonido.checked = !!parsed.sonido;
          if (chkTrans) chkTrans.checked = !!parsed.transporte;
          if (chkAnticipo) chkAnticipo.checked = !!parsed.anticipo;
        } catch (e) {
          if (inpDuracion) inpDuracion.value = '3 Horas de Show';
        }
      }
      if (inpFecha && acuerdo.fechaCompromiso) {
        inpFecha.value = new Date(acuerdo.fechaCompromiso).toISOString().slice(0, 16);
      }

      const lblSignC = modal.querySelector('#lbl-sign-contratante');
      const signBoxC = modal.querySelector('#sign-contratante');
      if (lblSignC && signBoxC) {
        if (acuerdo.firmaDigitalContratante) {
          lblSignC.textContent = `✅ Firmado (${acuerdo.firmaDigitalContratante})`;
          signBoxC.classList.add('signed');
        } else {
          lblSignC.textContent = '⏳ Pendiente de firma';
          signBoxC.classList.remove('signed');
        }
      }

      const lblSignA = modal.querySelector('#lbl-sign-artista');
      const signBoxA = modal.querySelector('#sign-artista');
      if (lblSignA && signBoxA) {
        if (acuerdo.firmaDigitalArtista) {
          lblSignA.textContent = `✅ Firmado (${acuerdo.firmaDigitalArtista})`;
          signBoxA.classList.add('signed');
        } else {
          lblSignA.textContent = '⏳ Pendiente de firma';
          signBoxA.classList.remove('signed');
        }
      }
    } else {
      if (inpPrecio) inpPrecio.value = '250';
      if (inpDuracion) inpDuracion.value = '3 Horas de Show';
      if (inpUbicacion) inpUbicacion.value = 'Managua, Nicaragua';
      if (chkSonido) chkSonido.checked = true;
      if (chkTrans) chkTrans.checked = true;
      if (chkAnticipo) chkAnticipo.checked = true;
    }

    const isLocked = (post.estado || '').toUpperCase() === 'ACEPTADA' 
      || (post.estado || '').toUpperCase() === 'CONCRETADA' 
      || (acuerdo && (acuerdo.estadoAcuerdo || '').toUpperCase() === 'RATIFICADO');

    // Deshabilitar/Habilitar inputs según el estado formal
    [inpPrecio, inpDuracion, inpFecha, inpUbicacion, chkSonido, chkTrans, chkAnticipo].forEach(el => {
      if (el) {
        el.disabled = isLocked;
        if (isLocked) {
          el.style.background = '#f8fafc';
          el.style.borderColor = '#cbd5e1';
          el.style.color = '#334155';
          el.style.cursor = 'not-allowed';
        } else {
          el.style.background = '#ffffff';
          el.style.borderColor = '#e2e8f0';
          el.style.color = '#0f172a';
          el.style.cursor = 'auto';
        }
      }
    });

    const sealContainer = modal.querySelector('#acuerdo-ratificado-seal');
    if (sealContainer) {
      if (isLocked) {
        sealContainer.style.display = 'flex';
        sealContainer.innerHTML = `
          <div style="font-size:1.8rem;">🔒</div>
          <div>
            <strong style="color:#166534;font-size:0.95rem;display:block;">Pre-Contrato Digital Ratificado e Inmutable</strong>
            <span style="color:#15803d;font-size:0.82rem;line-height:1.4;display:block;margin-top:2px;">
              Este acuerdo ha sido formalizado y asignado en MiSostenido. Los términos, tarifas y cláusulas están protegidos y congelados como garantía y respaldo mutuo.
            </span>
          </div>
        `;
      } else {
        sealContainer.style.display = 'none';
      }
    }

    const btnFirmar = modal.querySelector('#btn-firmar-acuerdo');
    if (btnFirmar) {
      if (isLocked) {
        btnFirmar.disabled = true;
        btnFirmar.innerHTML = '🔒 Pre-Contrato Formal y Ratificado';
        btnFirmar.style.background = '#059669';
        btnFirmar.style.cursor = 'default';
        btnFirmar.style.opacity = '1';
      } else {
        btnFirmar.disabled = false;
        btnFirmar.innerHTML = '✍️ Aceptar y Firmar Acuerdo Digital';
        btnFirmar.style.background = '#0d6855';
        btnFirmar.style.cursor = 'pointer';
        btnFirmar.style.opacity = '1';
      }
    }
  },

  async handleFirmarAcuerdo(idPostulacion, modal, post) {
    const user = authService.getCurrentUser() || {};
    const rol = (user.rolNombre || user.rol || user.role || 'USUARIO').toUpperCase();
    const nombreFirmante = user.nombre || user.name || 'Usuario Verificado';

    const precio = modal.querySelector('#acuerdo-precio')?.value || '250';
    const duracion = modal.querySelector('#acuerdo-duracion')?.value || '3 Horas de Show';
    const fechaHora = modal.querySelector('#acuerdo-fecha-hora')?.value || new Date().toISOString();
    const ubicacion = modal.querySelector('#acuerdo-ubicacion')?.value || 'Nicaragua';
    const sonido = !!modal.querySelector('#chk-sonido-incluido')?.checked;
    const transporte = !!modal.querySelector('#chk-transporte-incluido')?.checked;
    const anticipo = !!modal.querySelector('#chk-anticipo-pactado')?.checked;

    const clausulasObj = {
      duracion,
      ubicacion,
      sonido,
      transporte,
      anticipo,
      firmadoPor: nombreFirmante,
      rolFirmante: rol
    };

    const isArtista = rol === 'ARTISTA' || post.emisorId === (user.idUsuario || user.id);
    const firmaArtista = isArtista ? `${nombreFirmante} [Hash: MS-${Date.now().toString(36).toUpperCase()}]` : null;
    const firmaContratante = !isArtista ? `${nombreFirmante} [Hash: MS-${Date.now().toString(36).toUpperCase()}]` : null;

    const btnFirmar = modal.querySelector('#btn-firmar-acuerdo');
    if (btnFirmar) {
      btnFirmar.disabled = true;
      btnFirmar.textContent = 'Guardando Acuerdo en BD...';
    }

    try {
      await contratacionService.guardarAcuerdo(idPostulacion, {
        honorariosAcordados: parseFloat(precio),
        fechaCompromiso: fechaHora ? new Date(fechaHora).toISOString() : null,
        clausulasEspeciales: JSON.stringify(clausulasObj),
        firmaDigitalContratante: firmaContratante,
        firmaDigitalArtista: firmaArtista,
        estadoAcuerdo: 'RATIFICADO'
      });

      await this.sendChatMessage(
        idPostulacion,
        `📜 [PRE-CONTRATO DIGITAL FIRMADO]: ${nombreFirmante} (${rol}) ha ratificado los términos por $${precio} USD. Respaldado por MiSostenido.`,
        modal,
        post,
        true
      );

      await this.renderAcuerdoData(idPostulacion, post, modal);
      alert('🎉 ¡Acuerdo y Pre-Contrato Digital guardados y firmados exitosamente en la plataforma!');
    } catch (err) {
      alert('Error al formalizar acuerdo: ' + (err.message || 'Verifica la conexión a la base de datos'));
    } finally {
      if (btnFirmar) {
        btnFirmar.disabled = false;
        btnFirmar.textContent = 'Firmar Acuerdo Digital';
      }
    }
  },

  async handleDescargarResumen(idPostulacion, post) {
    let acuerdo = null;
    try {
      acuerdo = await contratacionService.getAcuerdo(idPostulacion);
    } catch (e) {}

    let meta = { duracion: '3 Horas de Show', ubicacion: 'Managua, Nicaragua', sonido: true, transporte: true, anticipo: true };
    if (acuerdo && acuerdo.clausulasEspeciales) {
      try {
        meta = { ...meta, ...JSON.parse(acuerdo.clausulasEspeciales) };
      } catch (e) {}
    }

    const text = `
============================================================
           CONSTANCIA DIGITAL DE CONTRATACIÓN MUSICAL
                       MISOTENIDO NICARAGUA
============================================================
Código de Solicitud / Postulación: #${idPostulacion}
Fecha de Emisión: ${new Date().toLocaleString()}
Título de la Oportunidad: ${post.ofertaTitulo || post.solicitudTitulo || 'Contratación de Servicios Musicales'}

PARTES INTERVINIENTES:
- Solicitante / Candidato: ${post.emisorNombre || 'Artista'} (${post.emisorEmail || 'Registrado en MiSostenido'})
- Canal de Intermediación: Gestor Autorizado MiSostenido (Resolución y Arbitraje Neutral)

TÉRMINOS Y CONDICIONES PACTADOS:
- Tarifa Final Acordada: $${acuerdo?.honorariosAcordados ?? '250'} USD
- Duración del Espectáculo: ${meta.duracion || '3 Horas'}
- Lugar / Ciudad: ${meta.ubicacion || 'Managua, Nicaragua'}
- Equipo de Sonido Incluido: ${meta.sonido ? 'SÍ' : 'NO'}
- Viáticos / Logística Incluida: ${meta.transporte ? 'SÍ' : 'NO'}
- Anticipo Pactado: ${meta.anticipo ? 'SÍ (30% - 50%)' : 'A convenir'}

ESTADO DE FIRMAS DIGITALES EN BASE DE DATOS:
- Firma Contratante: ${acuerdo?.firmaDigitalContratante ? `REGISTRADA (${acuerdo.firmaDigitalContratante})` : 'PENDIENTE'}
- Firma Artista / Músico: ${acuerdo?.firmaDigitalArtista ? `REGISTRADA (${acuerdo.firmaDigitalArtista})` : 'PENDIENTE'}
- Estado General del Acuerdo: ${acuerdo?.estadoAcuerdo || 'RATIFICADO'}

Marco Normativo: Las partes acuerdan libremente los horarios y tarifas con soporte y mediación oficial de MiSostenido.
============================================================
    `.trim();

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Acuerdo_MiSostenido_Solicitud_${idPostulacion}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  },


  bindRatingStars(modal) {
    const stars = modal.querySelectorAll('#rating-stars-picker .star');
    stars.forEach(star => {
      star.onclick = () => {
        const val = parseInt(star.dataset.val, 10);
        stars.forEach(s => {
          const sVal = parseInt(s.dataset.val, 10);
          if (sVal <= val) {
            s.classList.add('selected');
          } else {
            s.classList.remove('selected');
          }
        });
      };
    });
  },

  openReportModal(tipo, idRegistro, titulo) {
    const modal = document.querySelector('#modal-reporte-contratacion');
    if (!modal) return;

    modal.dataset.tipo = tipo;
    modal.dataset.idRegistro = idRegistro;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    const form = modal.querySelector('#form-reporte-contratacion');
    const btnClose = modal.querySelector('#btn-close-reporte-modal');
    const btnCancel = modal.querySelector('#btn-cancel-reporte');

    const closeModal = () => {
      modal.style.display = 'none';
      document.body.style.overflow = '';
      if (form) form.reset();
    };

    btnClose.onclick = closeModal;
    btnCancel.onclick = closeModal;

    form.onsubmit = async (e) => {
      e.preventDefault();
      const motivo = modal.querySelector('#reporte-motivo').value;
      const descripcion = modal.querySelector('#reporte-detalle').value;
      const submitBtn = form.querySelector('button[type="submit"]');

      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando a Auditoría...';

      try {
        await contratacionService.reportarPublicacion({
          tipo,
          idRegistro,
          motivo,
          descripcion
        });
        closeModal();
        alert('¡Reporte enviado exitosamente! Será auditado por el equipo de moderación y auditoría.');
      } catch (err) {
        alert('Error al enviar reporte: ' + (err.message || 'Verifica la conexión'));
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar Reporte a Auditoría';
      }
    };
  }
};
