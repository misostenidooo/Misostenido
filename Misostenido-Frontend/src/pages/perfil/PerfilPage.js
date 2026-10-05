/**
 * PerfilPage.js — Vista Principal del Perfil de Músico / Artista en MiSostenido Nicaragua
 * Conectado con Misostenido.Api (.NET), Soporte para Portafolio, Edición con Tabs, Subida de Archivos y Redes Sociales
 */
import { authService } from '../../services/authService.js';
import { perfilService } from '../../services/perfilService.js';
import { feedService } from '../../services/feedService.js';
import { AuthModal } from '../../components/modal/AuthModal.js';
import { store } from '../../store/store.js';

export const PerfilPage = {
  _perfilData: null,
  _metaExtendida: null,
  _activeTab: 'publicaciones',
  _isOwner: true,
  _targetUserId: null,
  _container: null,
  _publicaciones: [],
  _eventos: [],
  _ofertas: [],
  _solicitudes: [],

  formatMediaUrl(url) {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
      return url;
    }
    const backendOrigin = api.BASE_URL.replace('/api', '');
    return `${backendOrigin}${url.startsWith('/') ? '' : '/'}${url}`;
  },

  render() {
    const container = document.createElement('div');
    container.className = 'perfil-page animate-fade';
    this._container = container;

    // Loading State
    container.innerHTML = `
      <div style="min-height:70vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px">
        <div style="width:48px;height:48px;border:4px solid #e2e8f0;border-top-color:#0d6855;border-radius:50%;animation:spin 0.8s linear infinite"></div>
        <p style="color:#64748b;font-weight:600;font-size:0.95rem">Cargando perfil musical...</p>
      </div>
      <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>
    `;

    // Cargar datos en background
    setTimeout(() => this._initProfile(container), 0);

    return container;
  },

  async _initProfile(container) {
    const currentUser = authService.getCurrentUser() || {};
    const isAdmin = currentUser.role && (currentUser.role.toUpperCase().includes('ADMIN'));

    // Determinar si estamos viendo un ID específico por query param (e.g. #/perfil?id=3)
    const hash = window.location.hash || '';
    const params = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
    const queryId = params.get('id');

    let idUsuario = currentUser.id ? parseInt(currentUser.id, 10) : null;
    let isSelf = true;

    if (queryId && parseInt(queryId, 10)) {
      idUsuario = parseInt(queryId, 10);
      isSelf = currentUser.id ? (parseInt(currentUser.id, 10) === idUsuario) : false;
    } else {
      isSelf = true;
    }

    // Es dueño si es su propio perfil o si es Administrador del sistema
    this._isOwner = isSelf || isAdmin;
    this._targetUserId = idUsuario;

    // Sin usuario autenticado ni ID en URL
    if (!idUsuario) {
      container.innerHTML = `
        <div style="min-height:60vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:#64748b">
          <span style="font-size:3rem">🔒</span>
          <p style="font-weight:600;font-size:1.1rem">Inicia sesión para ver tu perfil</p>
          <a href="#/login" style="margin-top:8px;padding:10px 24px;background:#0d6855;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;text-decoration:none">Iniciar sesión</a>
        </div>
      `;
      return;
    }

    // Cargar perfil + publicaciones + eventos + contrataciones + media + estado de seguimiento EN PARALELO
    const [perfil, publicaciones, eventos, ofertas, solicitudes, extraMedia, followStatus] = await Promise.all([
      isSelf && authService.isAuthenticated()
        ? perfilService.getMiPerfil()
        : perfilService.getPerfil(idUsuario),
      perfilService.getPublicacionesDeUsuario(idUsuario),
      perfilService.getEventosDeUsuario(idUsuario),
      perfilService.getOfertasDeUsuario(idUsuario),
      perfilService.getSolicitudesDeUsuario(idUsuario),
      perfilService.obtenerMedia(idUsuario),
      !isSelf && authService.isAuthenticated() ? perfilService.esSeguidor(idUsuario) : Promise.resolve(null),
    ]);

    // Si el API no devuelve perfil, mostrar error en pantalla
    if (!perfil) {
      container.innerHTML = `
        <div style="min-height:60vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:#64748b">
          <span style="font-size:3rem">😕</span>
          <p style="font-weight:600;font-size:1.1rem">No se pudo cargar el perfil</p>
          <p style="font-size:0.9rem">El usuario no existe o no se encuentra disponible actualmente.</p>
          <button onclick="window.history.back()" style="margin-top:8px;padding:10px 24px;background:#0d6855;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600">Volver atrás</button>
        </div>
      `;
      return;
    }

    // Normalizar si es seguido por visitante
    if (followStatus && (followStatus.esSeguidor || followStatus.siguiendo || followStatus.isFollowing)) {
      perfil.esSeguidoPorVisitante = true;
    }

    // Normalizar portafolio (combinar con extraMedia si aplica)
    if (!perfil.portafolio || perfil.portafolio.length === 0) {
      perfil.portafolio = Array.isArray(extraMedia) ? extraMedia : [];
    }

    this._perfilData = perfil;
    this._metaExtendida = perfilService.getMetadatosExtendidos(idUsuario);
    this._publicaciones = publicaciones || [];
    this._eventos = eventos || [];
    this._ofertas = ofertas || [];
    this._solicitudes = solicitudes || [];

    this._renderProfileView(container);
  },

  _renderProfileView(container) {
    const p = this._perfilData;
    const m = this._metaExtendida;

    const avatarUrl = p.fotoPerfilUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.nombre || 'U')}&background=0d6855&color=fff`;
    const coverUrl = (m && m.fotoPortadaUrl) ? m.fotoPortadaUrl : null;
    const ubicacion = p.ubicacion || null;
    const genero = p.generoMusical || null;
    const instrumento = p.instrumento || null;
    const tipoPerfil = p.tipoPerfil || 'INDIVIDUAL';
    const biografia = p.biografia || null;

    const formatCount = (n) => {
      if (!n) return '0';
      if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
      return n.toString();
    };

    container.innerHTML = `
      <!-- =================== PORTADA / HERO BANNER =================== -->
      <section class="perfil-cover" style="${coverUrl ? `background-image: url('${coverUrl}'); background-size: cover; background-position: center;` : 'background: linear-gradient(135deg, #0d6855 0%, #0f2e26 100%)'}">
        <div class="perfil-cover-gradient"></div>
        ${this._isOwner ? `
          <button class="btn-cover-edit" id="btn-open-edit-cover" title="Cambiar foto de portada">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            <span>Cambiar Portada</span>
          </button>
        ` : ''}
      </section>

      <!-- =================== BARRA DE INFORMACIÓN PRINCIPAL =================== -->
      <section class="perfil-info-strip">
        <div class="perfil-info-inner">
          <div class="perfil-avatar-wrap">
            <img src="${avatarUrl}" alt="${p.nombre}" class="perfil-avatar" id="perfil-avatar-main" />
            ${this._isOwner ? `
              <button class="perfil-avatar-edit-btn" id="btn-open-edit-avatar" title="Cambiar foto de perfil">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              </button>
            ` : ''}
          </div>

          <div class="perfil-info-text">
            <div class="perfil-name-row">
              <h1 class="perfil-name">${p.nombre}</h1>
              ${p.verificado ? `
                <span class="perfil-verified-badge" title="Músico Verificado">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                  Verificado
                </span>
              ` : ''}
              <span class="perfil-type-badge">${tipoPerfil}</span>
            </div>

            <div class="perfil-meta">
              ${ubicacion ? `
              <span class="perfil-meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
                ${ubicacion}
              </span>` : ''}
              ${genero ? `
              <span class="perfil-meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                ${genero}
              </span>` : ''}
            </div>

            ${biografia ? `<p class="perfil-bio">${biografia}</p>` : ''}

            <div class="perfil-stats-row">
              <div class="perfil-stat" id="stat-seguidores">
                <strong>${formatCount(p.totalSeguidores)}</strong> Seguidores
              </div>
              <span class="perfil-stat-dot"></span>
              <div class="perfil-stat" id="stat-seguidos">
                <strong>${formatCount(p.totalSeguidos)}</strong> Seguidos
              </div>
              <span class="perfil-stat-dot"></span>
              <div class="perfil-stat" id="stat-publicaciones">
                <strong>${this._publicaciones.length}</strong> Publicaciones
              </div>
            </div>
          </div>

          <!-- BOTONES DE ACCIÓN SUPERIOR -->
          <div class="perfil-actions">
            ${this._isOwner ? `
              <button class="btn-perfil-primary" id="btn-open-edit-profile">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Editar
              </button>
              <button class="btn-perfil-outline" id="btn-quick-portfolio">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                Portafolio
              </button>
              <button class="btn-perfil-outline" id="btn-quick-events">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Eventos
              </button>
            ` : `
              <button class="btn-perfil-primary ${p.esSeguidoPorVisitante ? 'following' : ''}" id="btn-toggle-follow-main">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                <span>${p.esSeguidoPorVisitante ? 'Siguiendo' : 'Seguir'}</span>
              </button>
              <button class="btn-perfil-outline" id="btn-contact-artist">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                Contratar / Mensaje
              </button>
            `}
          </div>
        </div>
      </section>

      <!-- =================== NAVEGACIÓN DE PESTAÑAS =================== -->
      <nav class="perfil-tabs-bar">
        <div class="perfil-tabs-inner">
          <button class="perfil-tab ${this._activeTab === 'publicaciones' ? 'active' : ''}" data-tab="publicaciones">
            📝 Publicaciones (${this._publicaciones.length})
          </button>
          <button class="perfil-tab ${this._activeTab === 'portafolio' ? 'active' : ''}" data-tab="portafolio">
            🎸 Portafolio Musical (${p.portafolio?.length || 0})
          </button>
          <button class="perfil-tab ${this._activeTab === 'eventos' ? 'active' : ''}" data-tab="eventos">
            🎟️ Eventos (${this._eventos.length})
          </button>
          <button class="perfil-tab ${this._activeTab === 'contrataciones' ? 'active' : ''}" data-tab="contrataciones">
            💼 Servicios y Ofertas (${this._ofertas.length + this._solicitudes.length})
          </button>
        </div>
      </nav>

      <!-- =================== CUERPO PRINCIPAL (DOS COLUMNAS) =================== -->
      <div class="perfil-body">

        <!-- ============ COLUMNA IZQUIERDA (INFORMACIÓN BÁSICA & WIDGETS) ============ -->
        <aside class="perfil-sidebar">

          <!-- WIDGET 1: INFORMACIÓN BÁSICA -->
          <div class="perfil-card">
            <div class="perfil-card-header">
              <span class="perfil-card-title">Información Básica 📋</span>
            </div>
            <div class="perfil-card-body">
              <div class="perfil-info-item">
                <div class="perfil-info-icon">🎸</div>
                <div>
                  <span class="perfil-info-label">Instrumento principal</span>
                  <span class="perfil-info-value">${instrumento || '<em style="color:#94a3b8;font-style:italic">No especificado</em>'}</span>
                </div>
              </div>

              <div class="perfil-info-item">
                <div class="perfil-info-icon">💼</div>
                <div>
                  <span class="perfil-info-label">Años de experiencia</span>
                  <span class="perfil-info-value">${(m && m.experienciaAnios) ? m.experienciaAnios + ' años' : '<em style="color:#94a3b8;font-style:italic">No especificado</em>'}</span>
                </div>
              </div>

              <div class="perfil-info-item">
                <div class="perfil-info-icon">🎵</div>
                <div style="flex:1">
                  <span class="perfil-info-label" style="margin-bottom:6px">Géneros destacados</span>
                  <div class="perfil-tags">
                    ${genero
                      ? `<span class="perfil-tag">${genero}</span>`
                      : '<em style="color:#94a3b8;font-style:italic;font-size:0.85rem">No especificado</em>'}
                    ${(m && m.generosAdicionales && m.generosAdicionales.length > 0)
                      ? m.generosAdicionales.map(g => `<span class="perfil-tag">${g}</span>`).join('')
                      : ''}
                  </div>
                </div>
              </div>

              <div class="perfil-info-item">
                <div class="perfil-info-icon">✅</div>
                <div>
                  <span class="perfil-info-label">Disponibilidad laboral</span>
                  <span class="perfil-disponible-badge">
                    <span class="perfil-disponible-dot"></span>
                    ${(m && m.disponibilidad) ? m.disponibilidad : 'No especificado'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- WIDGET 2: HABILIDADES DESTACADAS -->
          <div class="perfil-card">
            <div class="perfil-card-header">
              <span class="perfil-card-title">Habilidades destacadas 💪</span>
            </div>
            <div class="perfil-card-body">
              <div class="perfil-tags">
                ${(m && m.habilidades && m.habilidades.length > 0)
                  ? m.habilidades.map(h => `<span class="perfil-tag">${h}</span>`).join('')
                  : '<em style="color:#94a3b8;font-style:italic;font-size:0.85rem">Sin habilidades registradas</em>'}
              </div>
            </div>
          </div>

          <!-- WIDGET 3: MÚSICOS SIMILARES EN NICARAGUA -->
          <div class="perfil-card">
            <div class="perfil-card-header">
              <span class="perfil-card-title">Músicos similares 👥</span>
              <a href="#/feed" style="font-size:0.78rem;color:#0d6855;font-weight:700;text-decoration:none">Ver todos</a>
            </div>
            <div class="perfil-card-body">
              <p style="color:#94a3b8;font-size:0.85rem;text-align:center;padding:12px 0">Explora músicos en el <a href="#/feed" style="color:#0d6855;font-weight:600">Feed</a></p>
            </div>
          </div>

        </aside>

        <!-- ============ COLUMNA DERECHA (CONTENIDO PRINCIPAL SUBIDO) ============ -->
        <main class="perfil-main" id="perfil-tab-content">
          ${this._renderTabContent()}
        </main>
      </div>

      <!-- ================================================================= -->
      <!-- MODAL / SLIDE-OVER: EDITAR PERFIL (Exacto como las imágenes de diseño) -->
      <!-- ================================================================= -->
      <div class="perfil-modal-overlay" id="modal-editar-perfil">
        <div class="perfil-modal">
          <div class="perfil-modal-header">
            <h3 class="perfil-modal-title">Editar perfil</h3>
            <button class="btn-modal-close" id="btn-close-edit-modal">&times;</button>
          </div>

          <!-- Pestañas del Modal -->
          <div class="perfil-modal-tabs">
            <button class="perfil-modal-tab active" data-modaltab="tab-info">Información</button>
            <button class="perfil-modal-tab" data-modaltab="tab-fotos">Foto y Portada</button>
            <button class="perfil-modal-tab" data-modaltab="tab-redes">Redes Sociales</button>
          </div>

          <!-- Cuerpo del Modal -->
          <div class="perfil-modal-body">
            
            <!-- PANEL 1: INFORMACIÓN -->
            <div class="perfil-modal-panel active" id="panel-tab-info">
              <div class="perfil-form-group">
                <label class="perfil-form-label">Nombre Completo</label>
                <input type="text" id="edit-input-nombre" class="perfil-form-input" value="${p.nombre}" placeholder="Tu nombre artístico" />
              </div>

              <div class="perfil-form-group">
                <label class="perfil-form-label">Biografía Profesional</label>
                <textarea id="edit-input-bio" class="perfil-form-textarea" placeholder="Cuéntale al ecosistema sobre tu trayectoria musical...">${p.biografia || ''}</textarea>
              </div>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                <div class="perfil-form-group">
                  <label class="perfil-form-label">Instrumento Principal</label>
                  <input type="text" id="edit-input-instrumento" class="perfil-form-input" value="${p.instrumento || ''}" placeholder="Ej. Batería, Saxofón..." />
                </div>
                <div class="perfil-form-group">
                  <label class="perfil-form-label">Género Principal</label>
                  <input type="text" id="edit-input-genero" class="perfil-form-input" value="${p.generoMusical || ''}" placeholder="Ej. Jazz, Rock, Salsa..." />
                </div>
              </div>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                <div class="perfil-form-group">
                  <label class="perfil-form-label">Ciudad (Nicaragua)</label>
                  <select id="edit-input-ubicacion" class="perfil-form-select">
                    <option value="" ${!ubicacion ? 'selected' : ''}>-- Sin especificar --</option>
                    <option value="Managua, Nicaragua" ${ubicacion && ubicacion.includes('Managua') ? 'selected' : ''}>Managua, Nicaragua</option>
                    <option value="León, Nicaragua" ${ubicacion && ubicacion.includes('León') ? 'selected' : ''}>León, Nicaragua</option>
                    <option value="Granada, Nicaragua" ${ubicacion && ubicacion.includes('Granada') ? 'selected' : ''}>Granada, Nicaragua</option>
                    <option value="Masaya, Nicaragua" ${ubicacion && ubicacion.includes('Masaya') ? 'selected' : ''}>Masaya, Nicaragua</option>
                    <option value="Matagalpa, Nicaragua" ${ubicacion && ubicacion.includes('Matagalpa') ? 'selected' : ''}>Matagalpa, Nicaragua</option>
                    <option value="Estelí, Nicaragua" ${ubicacion && ubicacion.includes('Estelí') ? 'selected' : ''}>Estelí, Nicaragua</option>
                    <option value="Chinandega, Nicaragua" ${ubicacion && ubicacion.includes('Chinandega') ? 'selected' : ''}>Chinandega, Nicaragua</option>
                    <option value="Rivas, Nicaragua" ${ubicacion && ubicacion.includes('Rivas') ? 'selected' : ''}>Rivas, Nicaragua</option>
                    <option value="Carazo, Nicaragua" ${ubicacion && ubicacion.includes('Carazo') ? 'selected' : ''}>Carazo, Nicaragua</option>
                    <option value="Jinotega, Nicaragua" ${ubicacion && ubicacion.includes('Jinotega') ? 'selected' : ''}>Jinotega, Nicaragua</option>
                    <option value="Chontales, Nicaragua" ${ubicacion && ubicacion.includes('Chontales') ? 'selected' : ''}>Chontales, Nicaragua</option>
                    <option value="Boaco, Nicaragua" ${ubicacion && ubicacion.includes('Boaco') ? 'selected' : ''}>Boaco, Nicaragua</option>
                    <option value="Madriz, Nicaragua" ${ubicacion && ubicacion.includes('Madriz') ? 'selected' : ''}>Madriz, Nicaragua</option>
                    <option value="Nueva Segovia, Nicaragua" ${ubicacion && ubicacion.includes('Nueva Segovia') ? 'selected' : ''}>Nueva Segovia, Nicaragua</option>
                    <option value="Río San Juan, Nicaragua" ${ubicacion && ubicacion.includes('Río San Juan') ? 'selected' : ''}>Río San Juan, Nicaragua</option>
                    <option value="Costa Caribe Norte, Nicaragua" ${ubicacion && ubicacion.includes('Costa Caribe Norte') ? 'selected' : ''}>Costa Caribe Norte, Nicaragua</option>
                    <option value="Costa Caribe Sur, Nicaragua" ${ubicacion && ubicacion.includes('Costa Caribe Sur') ? 'selected' : ''}>Costa Caribe Sur, Nicaragua</option>
                  </select>
                </div>
                <div class="perfil-form-group">
                  <label class="perfil-form-label">Años de Experiencia</label>
                  <input type="number" id="edit-input-exp" class="perfil-form-input" value="${(m && m.experienciaAnios) ? m.experienciaAnios : ''}" min="0" max="60" placeholder="Ej. 5" />
                </div>
              </div>

              <div class="perfil-form-group">
                <label class="perfil-form-label">Disponibilidad Laboral</label>
                <select id="edit-input-disponibilidad" class="perfil-form-select">
                  <option value="Disponible" ${(m.disponibilidad || '').includes('Disponible') ? 'selected' : ''}>🟢 Disponible para proyectos</option>
                  <option value="En proyectos" ${(m.disponibilidad || '').includes('En proyectos') ? 'selected' : ''}>🟡 En proyectos actualmente</option>
                  <option value="No disponible" ${(m.disponibilidad || '').includes('No disponible') ? 'selected' : ''}>🔴 No disponible por el momento</option>
                </select>
              </div>

              <div class="perfil-form-group">
                <label class="perfil-form-label">Habilidades (separadas por comas)</label>
                <input type="text" id="edit-input-habilidades" class="perfil-form-input" value="${(m.habilidades || []).join(', ')}" placeholder="Composición, Arreglos, Improvisación, Lectura a primera vista" />
              </div>
            </div>

            <!-- PANEL 2: FOTO Y PORTADA -->
            <div class="perfil-modal-panel" id="panel-tab-fotos">
              
              <!-- Foto de Perfil -->
              <div class="perfil-form-group">
                <label class="perfil-form-label">Foto de perfil</label>
                <div class="perfil-avatar-upload-row">
                  <div class="perfil-avatar-preview-wrap">
                    <img src="${avatarUrl}" id="edit-avatar-preview" class="perfil-avatar-preview" alt="Preview Avatar" />
                    <label class="perfil-avatar-upload-btn" for="file-avatar-input" title="Subir foto">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    </label>
                    <input type="file" id="file-avatar-input" accept="image/*" style="display:none" />
                  </div>
                  <div>
                    <strong style="color:#0f2e26;display:block;font-size:0.95rem;margin-bottom:2px">Foto actual</strong>
                    <span style="color:#64748b;font-size:0.82rem">Tamaño recomendado: 400×400 px</span>
                  </div>
                </div>
              </div>

              <!-- Foto de Portada -->
              <div class="perfil-form-group" style="margin-top:12px">
                <label class="perfil-form-label">Foto de portada</label>
                <div class="perfil-cover-upload-box" id="cover-upload-dropzone">
                  <img src="${coverUrl}" id="edit-cover-preview" alt="Preview Portada" />
                  <div class="perfil-cover-upload-actions">
                    <label class="perfil-cover-action-btn" for="file-cover-input" title="Cambiar portada">
                      ✏️
                    </label>
                    <button type="button" class="perfil-cover-action-btn" id="btn-delete-cover" title="Restablecer portada">
                      🗑️
                    </button>
                    <input type="file" id="file-cover-input" accept="image/*" style="display:none" />
                  </div>
                </div>
              </div>

              <div class="perfil-format-hint">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0d6855" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <span>Formatos aceptados: JPG, PNG, WEBP • Máx. 5MB</span>
              </div>
            </div>

            <!-- PANEL 3: REDES SOCIALES -->
            <div class="perfil-modal-panel" id="panel-tab-redes">
              
              <!-- Instagram -->
              <div class="perfil-form-group">
                <label class="perfil-form-label">Instagram</label>
                <div class="perfil-input-with-prefix">
                  <span class="perfil-input-prefix" style="background:#fce7f3;color:#be185d">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                    instagram.com/
                  </span>
                  <input type="text" id="edit-red-instagram" value="${m.redesSociales?.instagram || ''}" placeholder="usuario" />
                </div>
              </div>

              <!-- YouTube -->
              <div class="perfil-form-group">
                <label class="perfil-form-label">YouTube</label>
                <div class="perfil-input-with-prefix">
                  <span class="perfil-input-prefix" style="background:#fee2e2;color:#b91c1c">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                    youtube.com/@
                  </span>
                  <input type="text" id="edit-red-youtube" value="${m.redesSociales?.youtube || ''}" placeholder="canal" />
                </div>
              </div>

              <!-- Spotify -->
              <div class="perfil-form-group">
                <label class="perfil-form-label">Spotify</label>
                <div class="perfil-input-with-prefix">
                  <span class="perfil-input-prefix" style="background:#d1fae5;color:#047857">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14.5c2.5-1 5.5-1 8 0"/><path d="M7 11.5c3-1.2 7-1.2 10 0"/><path d="M6 8.5c3.5-1.5 8.5-1.5 12 0"/></svg>
                    open.spotify.com/artist/
                  </span>
                  <input type="text" id="edit-red-spotify" value="${m.redesSociales?.spotify || ''}" placeholder="id-artista" />
                </div>
              </div>

              <!-- SoundCloud -->
              <div class="perfil-form-group">
                <label class="perfil-form-label">SoundCloud</label>
                <div class="perfil-input-with-prefix">
                  <span class="perfil-input-prefix" style="background:#ffedd5;color:#c2410c">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4v16m-4-12v8m-4-6v4m12-10v12m4-8v4"/></svg>
                    soundcloud.com/
                  </span>
                  <input type="text" id="edit-red-soundcloud" value="${m.redesSociales?.soundcloud || ''}" placeholder="usuario" />
                </div>
              </div>

              <!-- TikTok -->
              <div class="perfil-form-group">
                <label class="perfil-form-label">TikTok</label>
                <div class="perfil-input-with-prefix">
                  <span class="perfil-input-prefix" style="background:#f1f5f9;color:#0f172a">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.86 4.46V11.8a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-3.04-3.23z"/></svg>
                    tiktok.com/@
                  </span>
                  <input type="text" id="edit-red-tiktok" value="${m.redesSociales?.tiktok || ''}" placeholder="usuario" />
                </div>
              </div>

              <!-- Facebook -->
              <div class="perfil-form-group">
                <label class="perfil-form-label">Facebook</label>
                <div class="perfil-input-with-prefix">
                  <span class="perfil-input-prefix" style="background:#dbeafe;color:#1d4ed8">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                    facebook.com/
                  </span>
                  <input type="text" id="edit-red-facebook" value="${m.redesSociales?.facebook || ''}" placeholder="usuario" />
                </div>
              </div>

            </div>

          </div>

          <!-- Footer del Modal -->
          <div class="perfil-modal-footer">
            <button class="btn-modal-cancel" id="btn-cancel-edit-modal">Cancelar</button>
            <button class="btn-modal-save" id="btn-save-edit-modal">Guardar cambios</button>
          </div>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- MODAL: SUBIR CONTENIDO AL PORTAFOLIO MULTIMEDIA -->
      <!-- ================================================================= -->
      <div class="perfil-modal-overlay" id="modal-subir-media">
        <div class="perfil-modal" style="max-width:500px">
          <div class="perfil-modal-header">
            <h3 class="perfil-modal-title">Subir al Portafolio 🎸</h3>
            <button class="btn-modal-close" id="btn-close-subir-media">&times;</button>
          </div>
          <div class="perfil-modal-body">
            <div class="perfil-form-group">
              <label class="perfil-form-label">Tipo de Contenido</label>
              <select id="subir-media-tipo" class="perfil-form-select">
                <option value="VIDEO">🎬 Video (YouTube o Archivo MP4)</option>
                <option value="FOTO">📸 Fotografía / Imagen de Show</option>
                <option value="AUDIO">🎧 Pista de Audio (MP3 / WAV)</option>
              </select>
            </div>

            <div class="perfil-form-group">
              <label class="perfil-form-label">Título / Descripción del Trabajo</label>
              <input type="text" id="subir-media-desc" class="perfil-form-input" placeholder="Ej. Solo de Guitarra en Vivo @ Managua" />
            </div>

            <div class="perfil-form-group">
              <label class="perfil-form-label">Enlace URL (YouTube o Web) o Subir Archivo</label>
              <input type="text" id="subir-media-url" class="perfil-form-input" placeholder="https://www.youtube.com/watch?v=..." />
            </div>

            <div style="text-align:center;color:#64748b;font-size:0.85rem;margin:4px 0">— O sube un archivo desde tu dispositivo —</div>

            <div class="perfil-form-group">
              <input type="file" id="subir-media-file" class="perfil-form-input" accept="image/*,video/*,audio/*" />
            </div>
          </div>
          <div class="perfil-modal-footer">
            <button class="btn-modal-cancel" id="btn-cancel-subir-media">Cancelar</button>
            <button class="btn-modal-save" id="btn-confirm-subir-media">Publicar en Portafolio</button>
          </div>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- MODAL: REPRODUCTOR MULTIMEDIA (Videos, Fotos y Audios) -->
      <!-- ================================================================= -->
      <div class="perfil-modal-overlay" id="modal-player-media">
        <div class="perfil-modal" style="max-width:760px;background:#0f172a;color:#fff">
          <div class="perfil-modal-header" style="border-color:#334155">
            <h3 class="perfil-modal-title" style="color:#fff" id="player-modal-title">Reproductor Multimedia</h3>
            <button class="btn-modal-close" style="background:#1e293b;color:#cbd5e1" id="btn-close-player-modal">&times;</button>
          </div>
          <div class="perfil-modal-body" style="padding:16px" id="player-modal-body">
            <!-- El reproductor se inserta dinámicamente -->
          </div>
        </div>
      </div>
    `;

    this._moveModalsToBody(container);
    this._attachEvents(container);
  },

  _moveModalsToBody(container) {
    document.querySelectorAll('body > #modal-editar-perfil, body > #modal-subir-media, body > #modal-player-media').forEach(old => old.remove());
    const modals = container.querySelectorAll('.perfil-modal-overlay');
    modals.forEach(m => document.body.appendChild(m));
  },

  _renderTabContent() {
    if (this._activeTab === 'portafolio') {
      return this._renderPortafolioTab();
    } else if (this._activeTab === 'publicaciones') {
      return this._renderPublicacionesTab();
    } else if (this._activeTab === 'eventos') {
      return this._renderEventosTab();
    } else if (this._activeTab === 'contrataciones') {
      return this._renderContratacionesTab();
    }
    return '';
  },

  // ─────────────────────────────────────────────────────────────
  // TAB 1: PORTAFOLIO MULTIMEDIA
  // ─────────────────────────────────────────────────────────────
  _renderPortafolioTab() {
    const items = this._perfilData.portafolio || [];

    return `
      <div class="perfil-portfolio-header">
        <div class="perfil-portfolio-title">
          <span>🎸 Portafolio Musical</span>
          <span class="perfil-portfolio-count">${items.length} ${items.length === 1 ? 'elemento' : 'elementos'}</span>
        </div>
        ${this._isOwner ? `
          <button class="btn-see-all" id="btn-open-add-media">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            + Subir al Portafolio
          </button>
        ` : ''}
      </div>

      ${items.length === 0 ? `
        <div class="perfil-empty-state">
          <div class="perfil-empty-icon">🎨</div>
          <div class="perfil-empty-title">Sin contenido en el portafolio</div>
          <p class="perfil-empty-desc">Este artista aún no ha subido fotos, pistas de audio o videos a su portafolio.</p>
          ${this._isOwner ? `<button class="btn-perfil-primary" id="btn-empty-add-media" style="margin:0 auto">+ Subir mi primer trabajo</button>` : ''}
        </div>
      ` : `
        <div class="perfil-portfolio-grid">
          ${items.map(item => {
            const rawUrl = item.url || '';
            const fullUrl = this.formatMediaUrl(rawUrl);
            const isVideo = item.tipo === 'VIDEO' || (rawUrl && (rawUrl.includes('youtube') || rawUrl.includes('youtu.be') || rawUrl.endsWith('.mp4')));
            const isAudio = item.tipo === 'AUDIO' || (rawUrl && (rawUrl.endsWith('.mp3') || rawUrl.endsWith('.wav') || rawUrl.endsWith('.ogg') || rawUrl.endsWith('.m4a')));
            const typeBadge = isVideo ? 'VIDEO' : isAudio ? 'AUDIO' : 'FOTO';

            let bgImg = item.thumbnail || fullUrl;
            if (rawUrl) {
              const ytMatch = rawUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
              if (ytMatch && ytMatch[1]) {
                bgImg = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
              }
            }
            if (!bgImg || bgImg.trim() === '' || isAudio) {
              bgImg = isAudio ? 'https://ui-avatars.com/api/?name=Audio&background=0d6855&color=fff' : 'https://ui-avatars.com/api/?name=Media&background=1e293b&color=fff';
            }

            const sub = item.sublabel || (isVideo ? '🎥 Video' : isAudio ? '🎧 Audio' : '📸 Fotografía');

            return `
              <div class="perfil-portfolio-item" 
                   data-id="${item.idContenidoMultimedia || item.id || ''}" 
                   data-tipo="${typeBadge}" 
                   data-url="${fullUrl}" 
                   data-title="${item.descripcion || 'Trabajo Artístico'}">
                <img src="${bgImg}" alt="${item.descripcion || 'Trabajo'}" class="perfil-portfolio-img" 
                     onerror="this.src='https://ui-avatars.com/api/?name=Media&background=0d6855&color=fff'" />
                <span class="perfil-portfolio-type-badge">${typeBadge}</span>
                <div class="perfil-portfolio-overlay">
                  <span class="perfil-portfolio-label">${item.descripcion || 'Trabajo Artístico'}</span>
                  <span class="perfil-portfolio-sub">${sub}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    `;
  },

  // ─────────────────────────────────────────────────────────────
  // TAB 2: PUBLICACIONES DEL USUARIO EN EL FEED (ESTILO RED SOCIAL)
  // ─────────────────────────────────────────────────────────────
  _renderPublicacionesTab() {
    const posts = this._publicaciones || [];
    const p = this._perfilData;
    const avatarUrl = p.fotoPerfilUrl 
      ? this.formatMediaUrl(p.fotoPerfilUrl)
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(p.nombre || 'U')}&background=0d6855&color=fff`;

    if (posts.length === 0) {
      return `
        <div class="perfil-empty-state">
          <div class="perfil-empty-icon">📝</div>
          <div class="perfil-empty-title">Sin publicaciones</div>
          <p class="perfil-empty-desc">Este artista no ha compartido publicaciones en su muro todavía.</p>
          ${this._isOwner ? `
            <a href="#/feed" class="btn-perfil-primary" style="text-decoration:none;display:inline-flex;align-items:center;gap:6px;margin:0 auto">
              + Crear mi primera publicación
            </a>
          ` : ''}
        </div>
      `;
    }

    const formatDate = (dateStr) => {
      if (!dateStr) return 'Reciente';
      try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-NI', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      } catch (e) {
        return dateStr;
      }
    };

    return `
      <div style="display:flex;flex-direction:column;gap:18px">
        <div class="perfil-portfolio-header">
          <div class="perfil-portfolio-title">
            <span>📝 Publicaciones (${posts.length})</span>
          </div>
          ${this._isOwner ? `
            <a href="#/feed" class="btn-see-all" style="text-decoration:none">
              + Nueva Publicación
            </a>
          ` : ''}
        </div>

        ${posts.map(post => {
          const authorPhoto = post.autorFoto ? this.formatMediaUrl(post.autorFoto) : avatarUrl;
          const authorName = post.autorNombre || p.nombre;
          const mediaList = post.multimedia || (post.imagenes ? post.imagenes.map(u => ({ tipo: 'FOTO', url: u })) : []);

          return `
            <article class="perfil-post-card" style="background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:20px;box-shadow:0 2px 6px rgba(0,0,0,0.04)">
              <div class="perfil-post-header" style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
                <img src="${authorPhoto}" alt="${authorName}" class="perfil-post-avatar" style="width:46px;height:46px;border-radius:50%;object-fit:cover;border:2px solid #e2e8f0" onerror="this.src='https://ui-avatars.com/api/?name=U&background=0d6855&color=fff'" />
                <div>
                  <div class="perfil-post-author" style="font-weight:700;color:#0f2e26;font-size:1rem">${authorName}</div>
                  <div class="perfil-post-date" style="font-size:0.82rem;color:#64748b">📅 ${formatDate(post.fechaPublicacion)} · 🌍 Público</div>
                </div>
              </div>

              ${post.texto ? `<div class="perfil-post-body" style="font-size:0.95rem;color:#1e293b;line-height:1.6;margin-bottom:14px;white-space:pre-wrap">${post.texto}</div>` : ''}

              ${mediaList.length > 0 ? `
                <div class="perfil-post-media-wrap" style="display:grid;grid-template-columns:${mediaList.length > 1 ? 'repeat(auto-fit, minmax(240px, 1fr))' : '1fr'};gap:10px;margin-bottom:14px;border-radius:12px;overflow:hidden">
                  ${mediaList.map(m => {
                    const fullMediaUrl = this.formatMediaUrl(m.url);
                    const isAudio = m.tipo === 'AUDIO' || (m.url && m.url.match(/\.(mp3|wav|ogg|m4a|aac|flac)$/i));
                    const isVideo = m.tipo === 'VIDEO' || (m.url && (m.url.includes('youtube') || m.url.includes('youtu.be') || m.url.match(/\.(mp4|webm|mov)$/i)));
                    const ytMatch = m.url ? m.url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/) : null;

                    if (isAudio) {
                      const audioTitle = m.descripcion || 'Pista de Audio';
                      return `
                        <div style="background:#f8fafc;border:1.5px solid #cbd5e1;border-radius:10px;padding:14px;display:flex;flex-direction:column;gap:8px;grid-column:1/-1">
                          <div style="font-size:0.88rem;font-weight:700;color:#0f2e26;display:flex;align-items:center;gap:6px">
                            <span>🎵</span> ${audioTitle}
                          </div>
                          <audio controls src="${fullMediaUrl}" style="width:100%;height:38px;border-radius:6px"></audio>
                        </div>
                      `;
                    }

                    if (ytMatch && ytMatch[1]) {
                      return `
                        <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:10px;background:#000;grid-column:${mediaList.length === 1 ? 'auto' : '1 / -1'}">
                          <iframe 
                            style="position:absolute;top:0;left:0;width:100%;height:100%;border:none" 
                            src="https://www.youtube-nocookie.com/embed/${ytMatch[1]}" 
                            title="Video del post" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowfullscreen>
                          </iframe>
                        </div>
                      `;
                    } else if (isVideo) {
                      return `
                        <video src="${fullMediaUrl}" controls playsinline style="width:100%;max-height:380px;border-radius:10px;background:#000"></video>
                      `;
                    } else {
                      return `
                        <img src="${fullMediaUrl}" alt="Foto publicación" style="width:100%;max-height:420px;object-fit:cover;border-radius:10px;cursor:pointer" onerror="this.style.display='none'" onclick="window.open('${fullMediaUrl}', '_blank')" />
                      `;
                    }
                  }).join('')}
                </div>
              ` : ''}

              <div class="perfil-post-actions" style="display:flex;align-items:center;justify-content:space-between;padding-top:14px;border-top:1px solid #f1f5f9;color:#64748b;font-size:0.88rem">
                <div style="display:flex;align-items:center;gap:18px">
                  <span style="display:flex;align-items:center;gap:5px;font-weight:600;color:#e11d48">
                    ❤️ <strong>${post.totalLikes || 0}</strong> Me gusta
                  </span>
                  <span style="display:flex;align-items:center;gap:5px;font-weight:600;color:#0d6855">
                    💬 <strong>${post.totalComentarios || 0}</strong> Comentarios
                  </span>
                </div>
                <div style="display:flex;align-items:center;gap:12px">
                  ${this._isOwner ? `
                    <button class="btn-delete-profile-post" data-post-id="${post.idPublicacion || post.id}" style="background:transparent;border:none;color:#ef4444;font-size:0.85rem;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px;padding:4px 8px;border-radius:6px;transition:background 0.2s" title="Eliminar publicación">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      Eliminar
                    </button>
                  ` : ''}
                  <a href="#/detalle?tipo=post&id=${post.idPublicacion || post.id}" style="color:#0d6855;font-weight:700;text-decoration:none;font-size:0.88rem;display:inline-flex;align-items:center;gap:4px">
                    Ver publicación completa →
                  </a>
                </div>
              </div>
            </article>
          `;
        }).join('')}
      </div>
    `;
  },

  // ─────────────────────────────────────────────────────────────
  // TAB 3: EVENTOS ORGANIZADOS POR EL USUARIO
  // ─────────────────────────────────────────────────────────────
  _renderEventosTab() {
    const eventos = this._eventos || [];

    if (eventos.length === 0) {
      return `
        <div class="perfil-empty-state">
          <div class="perfil-empty-icon">📅</div>
          <div class="perfil-empty-title">Sin eventos registrados</div>
          <p class="perfil-empty-desc">Este usuario no tiene eventos organizados o programados por el momento.</p>
          ${this._isOwner ? `
            <a href="#/eventos" class="btn-perfil-primary" style="text-decoration:none;display:inline-flex;align-items:center;gap:6px;margin:0 auto">
              + Crear un Evento
            </a>
          ` : ''}
        </div>
      `;
    }

    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-NI', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
      } catch (e) {
        return dateStr;
      }
    };

    return `
      <div style="display:flex;flex-direction:column;gap:18px">
        <div class="perfil-portfolio-header">
          <div class="perfil-portfolio-title">
            <span>📅 Eventos Organizados</span>
            <span class="perfil-portfolio-count">${eventos.length} ${eventos.length === 1 ? 'evento' : 'eventos'}</span>
          </div>
          ${this._isOwner ? `
            <a href="#/eventos" class="btn-see-all" style="text-decoration:none">
              + Crear Evento
            </a>
          ` : ''}
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(320px, 1fr));gap:16px">
          ${eventos.map(ev => {
            const mediaList = ev.media || [];
            const fotoObj = mediaList.find(m => (m.tipo || m.Tipo || '').toUpperCase() === 'FOTO' || (m.url && m.url.match(/\.(jpg|jpeg|png|webp|gif)/i)));
            const imgUrl = fotoObj?.url ? (fotoObj.url.startsWith('http') ? fotoObj.url : `${api.BASE_URL.replace('/api', '')}/${fotoObj.url}`) : null;

            return `
            <div class="perfil-card" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);background:#fff;display:flex;flex-direction:column">
              ${imgUrl ? `
                <div style="height:160px;overflow:hidden;position:relative">
                  <img src="${imgUrl}" alt="${ev.titulo}" style="width:100%;height:100%;object-fit:cover" />
                </div>
              ` : ''}
              <div style="padding:14px 20px;background:#f8fafc;border-bottom:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:center">
                <span style="font-size:0.78rem;font-weight:700;color:#0d6855;text-transform:uppercase;letter-spacing:0.5px">
                  ${ev.tipoEvento || 'EVENTO'}
                </span>
                <span style="font-size:0.8rem;color:#64748b">
                  ${formatDate(ev.fechaEvento)}
                </span>
              </div>
              <div style="padding:20px;flex:1;display:flex;flex-direction:column;justify-content:space-between">
                <div>
                  <h4 style="margin:0 0 8px;font-size:1.1rem;color:#0f2e26;font-weight:700">${ev.titulo}</h4>
                  ${ev.descripcion ? `<p style="color:#475569;font-size:0.9rem;line-height:1.5;margin:0 0 14px">${ev.descripcion}</p>` : ''}
                  
                  <div style="display:flex;flex-direction:column;gap:6px;font-size:0.85rem;color:#64748b">
                    ${ev.ubicacion ? `
                      <div style="display:flex;align-items:center;gap:6px">
                        📍 <span>${ev.ubicacion}</span>
                      </div>
                    ` : ''}
                    ${ev.infoInscripcion ? `
                      <div style="display:flex;align-items:center;gap:6px">
                        🎟️ <span>${ev.infoInscripcion}</span>
                      </div>
                    ` : ''}
                  </div>
                </div>

                <div style="margin-top:16px;padding-top:14px;border-top:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:center">
                  <a href="#/detalle?tipo=evento&id=${ev.idEvento || ev.id}" style="color:#0d6855;font-weight:700;font-size:0.85rem;text-decoration:none;display:inline-flex;align-items:center;gap:4px">
                    Ver Detalle del Evento →
                  </a>
                  <a href="#/eventos" style="color:#64748b;font-weight:500;font-size:0.8rem;text-decoration:none">
                    Cartelera
                  </a>
                </div>
              </div>
            </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  // ─────────────────────────────────────────────────────────────
  // TAB 4: CONTRATACIONES (OFERTAS Y SOLICITUDES DEL USUARIO)
  // ─────────────────────────────────────────────────────────────
  _renderContratacionesTab() {
    const ofertas = this._ofertas || [];
    const solicitudes = this._solicitudes || [];
    const total = ofertas.length + solicitudes.length;

    if (total === 0) {
      return `
        <div class="perfil-empty-state">
          <div class="perfil-empty-icon">💼</div>
          <div class="perfil-empty-title">Sin ofertas ni solicitudes</div>
          <p class="perfil-empty-desc">Este perfil no tiene servicios de contratación ni solicitudes publicadas actualmente.</p>
          ${this._isOwner ? `
            <a href="#/contrataciones" class="btn-perfil-primary" style="text-decoration:none;display:inline-flex;align-items:center;gap:6px;margin:0 auto">
              Ir a Contrataciones
            </a>
          ` : ''}
        </div>
      `;
    }

    return `
      <div style="display:flex;flex-direction:column;gap:20px">
        <div class="perfil-portfolio-header">
          <div class="perfil-portfolio-title">
            <span>💼 Servicios y Solicitudes de Contratación</span>
            <span class="perfil-portfolio-count">${total} elementos</span>
          </div>
          ${this._isOwner ? `
            <a href="#/contrataciones" class="btn-see-all" style="text-decoration:none">
              + Publicar Servicio / Solicitud
            </a>
          ` : ''}
        </div>

        ${ofertas.length > 0 ? `
          <div>
            <h4 style="color:#0f2e26;margin:0 0 14px;font-size:1rem;display:flex;align-items:center;gap:8px">
              🎸 Servicios Ofrecidos como Artista (${ofertas.length})
            </h4>
            <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(320px, 1fr));gap:16px">
              ${ofertas.map(of => `
                <div class="perfil-oferta-card" style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:18px;display:flex;align-items:flex-start;gap:16px;box-shadow:0 1px 3px rgba(0,0,0,0.05)">
                  <div style="font-size:2rem;line-height:1">🎵</div>
                  <div style="flex:1">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px">
                      <h5 style="margin:0;font-size:1.05rem;color:#0f2e26;font-weight:700">${of.titulo}</h5>
                      <span style="font-size:0.75rem;padding:3px 10px;border-radius:20px;font-weight:600;background:${of.disponible ? '#ecfdf5;color:#047857' : '#f1f5f9;color:#64748b'}">
                        ${of.disponible ? '🟢 Disponible' : '⚪ No disponible'}
                      </span>
                    </div>
                    ${of.descripcion ? `<p style="margin:6px 0 10px;color:#475569;font-size:0.9rem;line-height:1.5">${of.descripcion}</p>` : ''}
                    <div style="display:flex;gap:16px;flex-wrap:wrap;font-size:0.85rem;color:#64748b;margin-bottom:12px">
                      ${of.generoMusical ? `<span>🎼 ${of.generoMusical}</span>` : ''}
                      ${of.ubicacion ? `<span>📍 ${of.ubicacion}</span>` : ''}
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;padding-top:10px;border-top:1px solid #f1f5f9">
                      <div style="font-weight:800;color:#0d6855;font-size:1.1rem">
                        ${of.tarifaAproximada ? `C$ ${Number(of.tarifaAproximada).toLocaleString()}` : 'Tarifa a convenir'}
                      </div>
                      <a href="#/detalle?tipo=contratacion&id=${of.idOfertaServicio || of.id}" style="padding:7px 18px;background:#0d6855;color:#fff;border-radius:8px;text-decoration:none;font-size:0.85rem;font-weight:600">
                        Ver Detalle Oferta
                      </a>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${solicitudes.length > 0 ? `
          <div style="margin-top:12px">
            <h4 style="color:#0f2e26;margin:0 0 14px;font-size:1rem;display:flex;align-items:center;gap:8px">
              📢 Solicitudes de Artistas / Músicos (${solicitudes.length})
            </h4>
            <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(320px, 1fr));gap:16px">
              ${solicitudes.map(sol => `
                <div class="perfil-oferta-card" style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:18px;display:flex;align-items:flex-start;gap:16px;box-shadow:0 1px 3px rgba(0,0,0,0.05)">
                  <div style="font-size:2rem;line-height:1">📋</div>
                  <div style="flex:1">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px">
                      <h5 style="margin:0;font-size:1.05rem;color:#0f2e26;font-weight:700">${sol.titulo}</h5>
                      <span style="font-size:0.75rem;padding:3px 10px;border-radius:20px;font-weight:600;background:${sol.abierta ? '#eff6ff;color:#1d4ed8' : '#f1f5f9;color:#64748b'}">
                        ${sol.abierta ? '🔵 Abierta' : '⚪ Cerrada'}
                      </span>
                    </div>
                    ${sol.descripcion ? `<p style="margin:6px 0 10px;color:#475569;font-size:0.9rem;line-height:1.5">${sol.descripcion}</p>` : ''}
                    <div style="display:flex;gap:16px;flex-wrap:wrap;font-size:0.85rem;color:#64748b;margin-bottom:12px">
                      ${sol.ubicacion ? `<span>📍 ${sol.ubicacion}</span>` : ''}
                      ${sol.fechaEvento ? `<span>📅 ${new Date(sol.fechaEvento).toLocaleDateString('es-NI')}</span>` : ''}
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;padding-top:10px;border-top:1px solid #f1f5f9">
                      <div style="font-weight:800;color:#0d6855;font-size:1.1rem">
                        ${sol.presupuesto ? `Presupuesto: C$ ${Number(sol.presupuesto).toLocaleString()}` : 'Presupuesto a convenir'}
                      </div>
                      <a href="#/contrataciones" style="padding:7px 18px;background:#0d6855;color:#fff;border-radius:8px;text-decoration:none;font-size:0.85rem;font-weight:600">
                        Ver Solicitud
                      </a>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  },

  // ─────────────────────────────────────────────────────────────
  // EVENT LISTENERS & LOGIC INTERACTIVA
  // ─────────────────────────────────────────────────────────────
  _attachEvents(container) {
    const isAuth = authService.isAuthenticated();

    // ── CAMBIO DE TABS PRINCIPALES ──────────────────────────────
    const tabs = container.querySelectorAll('.perfil-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this._activeTab = tab.getAttribute('data-tab');
        const mainContent = container.querySelector('#perfil-tab-content');
        if (mainContent) {
          mainContent.innerHTML = this._renderTabContent();
          this._attachTabEvents(container);
        }
      });
    });

    // ── APERTURA DEL MODAL DE EDICIÓN ───────────────────────────
    const modalEdit = document.querySelector('#modal-editar-perfil');
    const openEditBtn = container.querySelector('#btn-open-edit-profile');
    const openAvatarBtn = container.querySelector('#btn-open-edit-avatar');
    const openCoverBtn = container.querySelector('#btn-open-edit-cover');
    const closeEditBtn = modalEdit?.querySelector('#btn-close-edit-modal');
    const cancelEditBtn = modalEdit?.querySelector('#btn-cancel-edit-modal');

    const openEditModal = (targetTab = 'tab-info') => {
      if (!modalEdit) return;
      modalEdit.classList.add('open');
      document.body.style.overflow = 'hidden';

      // Cambiar a la pestaña especificada
      const modalTabs = modalEdit.querySelectorAll('.perfil-modal-tab');
      const modalPanels = modalEdit.querySelectorAll('.perfil-modal-panel');
      modalTabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-modaltab') === targetTab));
      modalPanels.forEach(p => p.classList.toggle('active', p.id === `panel-${targetTab}`));
    };

    const closeEditModal = () => {
      if (!modalEdit) return;
      modalEdit.classList.remove('open');
      document.body.style.overflow = '';
    };

    openEditBtn?.addEventListener('click', () => openEditModal('tab-info'));
    openAvatarBtn?.addEventListener('click', () => openEditModal('tab-fotos'));
    openCoverBtn?.addEventListener('click', () => openEditModal('tab-fotos'));
    closeEditBtn?.addEventListener('click', closeEditModal);
    cancelEditBtn?.addEventListener('click', closeEditModal);

    // Click fuera del modal para cerrar
    modalEdit?.addEventListener('click', (e) => {
      if (e.target === modalEdit) closeEditModal();
    });

    // ── TABS DEL MODAL DE EDICIÓN ───────────────────────────────
    const modalTabs = modalEdit ? modalEdit.querySelectorAll('.perfil-modal-tab') : [];
    modalTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        modalTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const targetId = `panel-${tab.getAttribute('data-modaltab')}`;
        const panels = modalEdit.querySelectorAll('.perfil-modal-panel');
        panels.forEach(p => p.classList.toggle('active', p.id === targetId));
      });
    });

    // ── SUBIDA DE FOTO DE PERFIL ────────────────────────────────
    const avatarInput = modalEdit?.querySelector('#file-avatar-input');
    const avatarPreview = modalEdit?.querySelector('#edit-avatar-preview');
    let newAvatarUrl = this._perfilData.fotoPerfilUrl;
    let selectedAvatarFile = null;

    avatarInput?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      selectedAvatarFile = file;

      // Preview local instantáneo
      const reader = new FileReader();
      reader.onload = (re) => {
        if (avatarPreview) avatarPreview.src = re.target.result;
      };
      reader.readAsDataURL(file);
    });

    // ── SUBIDA DE FOTO DE PORTADA ───────────────────────────────
    const coverInput = modalEdit?.querySelector('#file-cover-input');
    const coverPreview = modalEdit?.querySelector('#edit-cover-preview');
    const deleteCoverBtn = modalEdit?.querySelector('#btn-delete-cover');
    let newCoverUrl = this._metaExtendida?.fotoPortadaUrl;
    let selectedCoverFile = null;

    coverInput?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      selectedCoverFile = file;

      const reader = new FileReader();
      reader.onload = (re) => {
        if (coverPreview) coverPreview.src = re.target.result;
      };
      reader.readAsDataURL(file);
    });

    deleteCoverBtn?.addEventListener('click', () => {
      newCoverUrl = null;
      selectedCoverFile = null;
      if (coverPreview) coverPreview.src = '';
    });

    // ── GUARDAR CAMBIOS DE PERFIL ───────────────────────────────
    const saveEditBtn = modalEdit?.querySelector('#btn-save-edit-modal');
    saveEditBtn?.addEventListener('click', async () => {
      saveEditBtn.disabled = true;
      saveEditBtn.textContent = 'Guardando...';

      const nombre = modalEdit?.querySelector('#edit-input-nombre')?.value || this._perfilData.nombre;
      const biografia = modalEdit?.querySelector('#edit-input-bio')?.value || null;
      const instrumento = modalEdit?.querySelector('#edit-input-instrumento')?.value || null;
      const generoMusical = modalEdit?.querySelector('#edit-input-genero')?.value || null;
      const ubicacion = modalEdit?.querySelector('#edit-input-ubicacion')?.value || null;
      const experienciaAnios = modalEdit?.querySelector('#edit-input-exp')?.value || null;
      const disponibilidad = modalEdit?.querySelector('#edit-input-disponibilidad')?.value || null;
      const habilidadesStr = modalEdit?.querySelector('#edit-input-habilidades')?.value || '';
      const habilidades = habilidadesStr ? habilidadesStr.split(',').map(s => s.trim()).filter(Boolean) : [];

      // Redes sociales
      const redesSociales = {
        instagram: modalEdit?.querySelector('#edit-red-instagram')?.value || '',
        youtube: modalEdit?.querySelector('#edit-red-youtube')?.value || '',
        spotify: modalEdit?.querySelector('#edit-red-spotify')?.value || '',
        soundcloud: modalEdit?.querySelector('#edit-red-soundcloud')?.value || '',
        tiktok: modalEdit?.querySelector('#edit-red-tiktok')?.value || '',
        facebook: modalEdit?.querySelector('#edit-red-facebook')?.value || '',
      };

      try {
        // Si seleccionó nuevo archivo de foto de perfil, subirlo primero
        if (selectedAvatarFile) {
          saveEditBtn.textContent = 'Subiendo foto de perfil...';
          const upAvatar = await perfilService.subirArchivo(selectedAvatarFile, 'perfiles');
          if (upAvatar && upAvatar.url) {
            newAvatarUrl = upAvatar.url;
          }
        }

        // Si seleccionó nuevo archivo de portada, subirlo primero
        if (selectedCoverFile) {
          saveEditBtn.textContent = 'Subiendo foto de portada...';
          const upCover = await perfilService.subirArchivo(selectedCoverFile, 'portadas');
          if (upCover && upCover.url) {
            newCoverUrl = upCover.url;
          }
        }

        saveEditBtn.textContent = 'Actualizando información...';

        const finalAvatarUrl = newAvatarUrl || this._perfilData.fotoPerfilUrl || null;
        const finalCoverUrl = newCoverUrl || this._metaExtendida?.fotoPortadaUrl || null;

        // 1. Guardar datos principales en .NET Backend API (/api/usuario/me)
        await perfilService.actualizarPerfil({
          nombre,
          biografia,
          ubicacion,
          generoMusical,
          instrumento,
          fotoPerfilUrl: finalAvatarUrl,
        });

        // 2. Guardar portada y metadatos extendidos por usuario
        perfilService.saveMetadatosExtendidos(this._perfilData.idUsuario, {
          fotoPortadaUrl: finalCoverUrl,
          experienciaAnios,
          disponibilidad,
          habilidades,
          redesSociales,
        });

        // 3. Actualizar datos locales y re-renderizar vista
        this._perfilData.nombre = nombre;
        this._perfilData.biografia = biografia;
        this._perfilData.ubicacion = ubicacion;
        this._perfilData.generoMusical = generoMusical;
        this._perfilData.instrumento = instrumento;
        if (finalAvatarUrl) this._perfilData.fotoPerfilUrl = finalAvatarUrl;

        this._metaExtendida = perfilService.getMetadatosExtendidos(this._perfilData.idUsuario);

        closeEditModal();
        this._renderProfileView(container);
      } catch (err) {
        console.error('Error al guardar perfil:', err);
        alert('Error al guardar el perfil: ' + (err.message || 'Error del servidor'));
      } finally {
        saveEditBtn.disabled = false;
        saveEditBtn.textContent = 'Guardar cambios';
      }
    });

    // ── BOTONES DE NAVEGACIÓN RÁPIDA ────────────────────────────
    container.querySelector('#btn-quick-portfolio')?.addEventListener('click', () => {
      const tabPort = container.querySelector('.perfil-tab[data-tab="portafolio"]');
      tabPort?.click();
    });

    container.querySelector('#btn-quick-events')?.addEventListener('click', () => {
      window.location.hash = '#/eventos';
    });

    // ── SEGUIR ARTISTA (SI ES PERFIL DE OTRO) ───────────────────
    const followMainBtn = container.querySelector('#btn-toggle-follow-main');
    followMainBtn?.addEventListener('click', async () => {
      if (!isAuth) {
        AuthModal.show('Seguir Artista', 'Inicia sesión para seguir a este artista y ver sus publicaciones.');
        return;
      }
      followMainBtn.disabled = true;
      try {
        const res = await perfilService.toggleSeguir(this._targetUserId);
        const isFollowing = res?.accion === 'SIGUIENDO' || res?.seguido === true || res?.isFollowing === true || !followMainBtn.classList.contains('following');

        if (isFollowing) {
          followMainBtn.classList.add('following');
          const span = followMainBtn.querySelector('span');
          if (span) span.textContent = 'Siguiendo';
          this._perfilData.totalSeguidores = (this._perfilData.totalSeguidores || 0) + 1;
        } else {
          followMainBtn.classList.remove('following');
          const span = followMainBtn.querySelector('span');
          if (span) span.textContent = 'Seguir';
          this._perfilData.totalSeguidores = Math.max(0, (this._perfilData.totalSeguidores || 1) - 1);
        }
        const statSeg = container.querySelector('#stat-seguidores strong');
        if (statSeg) statSeg.textContent = this._perfilData.totalSeguidores;
      } catch (err) {
        console.error('Error al seguir usuario:', err);
      } finally {
        followMainBtn.disabled = false;
      }
    });

    // ── BOTONES DE SEGUIR EN WIDGET "MÚSICOS SIMILARES" ────────
    container.querySelectorAll('.btn-follow-small').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!isAuth) {
          AuthModal.show('Seguir Artista', 'Debes iniciar sesión para conectar con otros músicos.');
          return;
        }
        btn.classList.toggle('following');
        btn.textContent = btn.classList.contains('following') ? 'Siguiendo' : 'Seguir';
      });
    });

    // ── MODAL SUBIR CONTENIDO AL PORTAFOLIO ─────────────────────
    const modalSubir = document.querySelector('#modal-subir-media');
    const closeSubirBtn = modalSubir?.querySelector('#btn-close-subir-media');
    const cancelSubirBtn = modalSubir?.querySelector('#btn-cancel-subir-media');
    const confirmSubirBtn = modalSubir?.querySelector('#btn-confirm-subir-media');

    const openSubirModal = () => {
      if (!modalSubir) return;
      modalSubir.classList.add('open');
      document.body.style.overflow = 'hidden';
    };

    const closeSubirModal = () => {
      if (!modalSubir) return;
      modalSubir.classList.remove('open');
      document.body.style.overflow = '';
    };

    closeSubirBtn?.addEventListener('click', closeSubirModal);
    cancelSubirBtn?.addEventListener('click', closeSubirModal);
    modalSubir?.addEventListener('click', (e) => {
      if (e.target === modalSubir) closeSubirModal();
    });

    confirmSubirBtn?.addEventListener('click', async () => {
      const tipo = modalSubir?.querySelector('#subir-media-tipo')?.value || 'FOTO';
      const desc = modalSubir?.querySelector('#subir-media-desc')?.value || 'Nuevo trabajo';
      let url = modalSubir?.querySelector('#subir-media-url')?.value || '';
      const fileInput = modalSubir?.querySelector('#subir-media-file');

      confirmSubirBtn.disabled = true;
      confirmSubirBtn.textContent = 'Subiendo...';

      try {
        if (fileInput?.files?.[0]) {
          const uploadRes = await perfilService.subirArchivo(fileInput.files[0], 'portafolio');
          if (uploadRes && uploadRes.url) {
            url = uploadRes.url;
          }
        }

        if (!url) {
          alert('Por favor ingresa un link o selecciona un archivo para subir.');
          confirmSubirBtn.disabled = false;
          confirmSubirBtn.textContent = 'Publicar en Portafolio';
          return;
        }

        await perfilService.subirMedia({
          tipo,
          url,
          descripcion: desc,
        });

        // Agregar localmente al portafolio
        this._perfilData.portafolio.unshift({
          idContenidoMultimedia: Date.now(),
          tipo,
          url,
          descripcion: desc,
          sublabel: tipo === 'VIDEO' ? '🎥 Video Performance' : tipo === 'AUDIO' ? '🎧 Pista de Audio' : '📸 Fotografía de Show',
          thumbnail: tipo === 'FOTO' ? url : 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
        });

        closeSubirModal();
        const mainContent = container.querySelector('#perfil-tab-content');
        if (mainContent) {
          mainContent.innerHTML = this._renderTabContent();
          this._attachTabEvents(container);
        }
        alert('¡Contenido agregado a tu portafolio con éxito!');
      } catch (e) {
        alert('Error al subir media: ' + (e.message || 'Error del servidor'));
      } finally {
        confirmSubirBtn.disabled = false;
        confirmSubirBtn.textContent = 'Publicar en Portafolio';
      }
    });

    // ── MODAL REPRODUCTOR MULTIMEDIA ────────────────────────────
    const modalPlayer = document.querySelector('#modal-player-media');
    const closePlayerBtn = modalPlayer?.querySelector('#btn-close-player-modal');
    closePlayerBtn?.addEventListener('click', () => {
      if (modalPlayer) {
        modalPlayer.classList.remove('open');
        const pBody = modalPlayer.querySelector('#player-modal-body');
        if (pBody) pBody.innerHTML = '';
        document.body.style.overflow = '';
      }
    });

    modalPlayer?.addEventListener('click', (e) => {
      if (e.target === modalPlayer) {
        modalPlayer.classList.remove('open');
        const pBody = modalPlayer.querySelector('#player-modal-body');
        if (pBody) pBody.innerHTML = '';
        document.body.style.overflow = '';
      }
    });

    this._attachTabEvents(container);
  },

  _attachTabEvents(container) {
    // Botón para abrir el modal de subida de media
    const openAddMediaBtn = container.querySelector('#btn-open-add-media');
    const openEmptyMediaBtn = container.querySelector('#btn-empty-add-media');
    const modalSubir = document.querySelector('#modal-subir-media');

    const openSubirModal = () => {
      if (modalSubir) {
        modalSubir.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    };

    openAddMediaBtn?.addEventListener('click', openSubirModal);
    openEmptyMediaBtn?.addEventListener('click', openSubirModal);

    // Clics en items del portafolio para reproducir / ver en grande
    const portfolioItems = container.querySelectorAll('.perfil-portfolio-item');
    const modalPlayer = document.querySelector('#modal-player-media');
    const playerTitle = modalPlayer?.querySelector('#player-modal-title');
    const playerBody = modalPlayer?.querySelector('#player-modal-body');

    portfolioItems.forEach(item => {
      item.addEventListener('click', () => {
        const tipo = item.getAttribute('data-tipo');
        const url = item.getAttribute('data-url');
        const title = item.getAttribute('data-title') || 'Trabajo Artístico';

        if (!modalPlayer || !playerBody) return;
        if (playerTitle) playerTitle.textContent = title;

        // Parseador de URL de YouTube
        const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);

        if (ytMatch && ytMatch[1]) {
          const ytId = ytMatch[1];
          playerBody.innerHTML = `
            <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;background:#000">
              <iframe 
                style="position:absolute;top:0;left:0;width:100%;height:100%;border:none" 
                src="https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0" 
                title="${title}" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
              </iframe>
            </div>
            <div style="margin-top:12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
              <span style="font-size:0.9rem;color:#94a3b8">${title}</span>
              <a href="https://www.youtube.com/watch?v=${ytId}" target="_blank" rel="noopener noreferrer" style="color:#ef4444;font-weight:700;text-decoration:none;font-size:0.85rem">Abrir en YouTube ↗</a>
            </div>
          `;
        } else if (tipo === 'VIDEO' || url.endsWith('.mp4') || url.endsWith('.webm')) {
          playerBody.innerHTML = `
            <video src="${url}" controls autoplay playsinline style="width:100%;max-height:480px;border-radius:12px;background:#000;display:block"></video>
            <p style="margin-top:12px;font-size:0.9rem;color:#94a3b8">${title}</p>
          `;
        } else if (tipo === 'AUDIO' || url.endsWith('.mp3') || url.endsWith('.wav')) {
          playerBody.innerHTML = `
            <div style="padding:24px;text-align:center;background:#1e293b;border-radius:12px">
              <div style="font-size:3rem;margin-bottom:12px">🎧</div>
              <h4 style="margin:0 0 16px;color:#fff;font-size:1.1rem">${title}</h4>
              <audio src="${url}" controls autoplay style="width:100%"></audio>
            </div>
          `;
        } else {
          playerBody.innerHTML = `
            <img src="${url}" alt="${title}" style="width:100%;max-height:540px;object-fit:contain;border-radius:12px;display:block" />
            <p style="margin-top:12px;font-size:0.9rem;color:#94a3b8">${title}</p>
          `;
        }

        modalPlayer.classList.add('open');
        document.body.style.overflow = 'hidden';
      });
    });

    // Eliminar publicaciones desde la pestaña de publicaciones del perfil
    container.querySelectorAll('.btn-delete-profile-post').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const idPost = btn.dataset.postId;
        const confirmed = window.confirm('¿Estás seguro de que deseas eliminar esta publicación?');
        if (!confirmed) return;

        const postArticle = btn.closest('.perfil-post-card');
        try {
          if (postArticle) {
            postArticle.style.opacity = '0.4';
            postArticle.style.pointerEvents = 'none';
          }
          await feedService.eliminarPublicacion(idPost);
          this._publicaciones = (this._publicaciones || []).filter(p => (p.idPublicacion != idPost && p.id != idPost));
          
          // Actualizar conteos
          const statPub = container.querySelector('#stat-publicaciones strong');
          if (statPub) statPub.textContent = this._publicaciones.length;
          const tabPubBtn = container.querySelector('.perfil-tab[data-tab="publicaciones"]');
          if (tabPubBtn) tabPubBtn.textContent = `Publicaciones (${this._publicaciones.length})`;

          if (postArticle) {
            postArticle.style.transition = 'all 0.35s ease';
            postArticle.style.transform = 'scale(0.95)';
            postArticle.style.opacity = '0';
            setTimeout(() => {
              postArticle.remove();
            }, 350);
          }
        } catch (err) {
          if (postArticle) {
            postArticle.style.opacity = '1';
            postArticle.style.pointerEvents = '';
          }
          alert('Error al eliminar publicación: ' + (err.message || 'Error del servidor'));
        }
      });
    });
  }
};
