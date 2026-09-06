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
  _activeTab: 'portafolio',
  _isOwner: true,
  _targetUserId: null,
  _container: null,
  _publicaciones: [],
  _eventos: [],
  _ofertas: [],
  _solicitudes: [],
  _cursos: [],

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

    // Determinar si estamos viendo un ID específico por query param (e.g. #/perfil?id=3)
    const hash = window.location.hash || '';
    const params = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
    const queryId = params.get('id');

    let idUsuario = currentUser.id ? parseInt(currentUser.id, 10) : null;
    if (queryId && parseInt(queryId, 10)) {
      idUsuario = parseInt(queryId, 10);
      this._isOwner = currentUser.id ? (parseInt(currentUser.id, 10) === idUsuario) : false;
    } else {
      this._isOwner = true;
    }
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

    // Cargar perfil + publicaciones + eventos + contrataciones + cursos EN PARALELO
    const [perfil, publicaciones, eventos, ofertas, solicitudes, cursos] = await Promise.all([
      this._isOwner && authService.isAuthenticated()
        ? perfilService.getMiPerfil()
        : perfilService.getPerfil(idUsuario),
      perfilService.getPublicacionesDeUsuario(idUsuario),
      perfilService.getEventosDeUsuario(idUsuario),
      perfilService.getOfertasDeUsuario(idUsuario),
      perfilService.getSolicitudesDeUsuario(idUsuario),
      perfilService.getCursosDeUsuario(),
    ]);

    // Si el API no devuelve perfil, mostrar error en pantalla
    if (!perfil) {
      container.innerHTML = `
        <div style="min-height:60vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:#64748b">
          <span style="font-size:3rem">😕</span>
          <p style="font-weight:600;font-size:1.1rem">No se pudo cargar el perfil</p>
          <p style="font-size:0.9rem">Verifica tu conexión o intenta nuevamente más tarde.</p>
          <button onclick="window.location.reload()" style="margin-top:8px;padding:10px 24px;background:#0d6855;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600">Reintentar</button>
        </div>
      `;
      return;
    }

    // Normalizar portafolio
    if (!perfil.portafolio) perfil.portafolio = [];

    this._perfilData = perfil;
    this._metaExtendida = perfilService.getMetadatosExtendidos(idUsuario);
    this._publicaciones = publicaciones || [];
    this._eventos = eventos || [];
    this._ofertas = ofertas || [];
    this._solicitudes = solicitudes || [];
    this._cursos = cursos || [];

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
          <button class="perfil-tab ${this._activeTab === 'portafolio' ? 'active' : ''}" data-tab="portafolio">
            Portafolio y Entretenimiento (${(p.portafolio?.length || 0) + (this._cursos?.length || 0)})
          </button>
          <button class="perfil-tab ${this._activeTab === 'publicaciones' ? 'active' : ''}" data-tab="publicaciones">
            Publicaciones (${this._publicaciones.length})
          </button>
          <button class="perfil-tab ${this._activeTab === 'eventos' ? 'active' : ''}" data-tab="eventos">
            Eventos (${this._eventos.length})
          </button>
          <button class="perfil-tab ${this._activeTab === 'contrataciones' ? 'active' : ''}" data-tab="contrataciones">
            Contrataciones (${this._ofertas.length + this._solicitudes.length})
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
  // TAB 1: PORTAFOLIO MULTIMEDIA & ENTRETENIMIENTO
  // ─────────────────────────────────────────────────────────────
  _renderPortafolioTab() {
    const items = this._perfilData.portafolio || [];
    const cursos = this._cursos || [];

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
          <p class="perfil-empty-desc">Sube videos de tus presentaciones (incluyendo YouTube o archivos MP4), audios o fotos a tu portafolio.</p>
          ${this._isOwner ? `<button class="btn-perfil-primary" id="btn-empty-add-media" style="margin:0 auto">+ Subir mi primer trabajo</button>` : ''}
        </div>
      ` : `
        <div class="perfil-portfolio-grid">
          ${items.map(item => {
            const isVideo = item.tipo === 'VIDEO' || (item.url && (item.url.includes('youtube') || item.url.includes('youtu.be') || item.url.endsWith('.mp4')));
            const isAudio = item.tipo === 'AUDIO' || (item.url && (item.url.endsWith('.mp3') || item.url.endsWith('.wav')));
            const typeBadge = isVideo ? 'VIDEO' : isAudio ? 'AUDIO' : 'FOTO';

            let bgImg = item.thumbnail || item.url;
            if (item.url) {
              const ytMatch = item.url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
              if (ytMatch && ytMatch[1]) {
                bgImg = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
              }
            }
            if (!bgImg || bgImg.trim() === '') {
              bgImg = isAudio ? 'https://ui-avatars.com/api/?name=Audio&background=0d6855&color=fff' : 'https://ui-avatars.com/api/?name=Media&background=1e293b&color=fff';
            }

            const sub = item.sublabel || (isVideo ? '🎥 Video' : isAudio ? '🎧 Audio' : '📸 Fotografía');

            return `
              <div class="perfil-portfolio-item" 
                   data-id="${item.idContenidoMultimedia || item.id || ''}" 
                   data-tipo="${typeBadge}" 
                   data-url="${item.url}" 
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

      ${cursos.length > 0 ? `
        <div style="margin-top:36px">
          <div class="perfil-portfolio-header">
            <div class="perfil-portfolio-title">
              <span>🎭 Cursos y Entretenimiento Musical</span>
              <span class="perfil-portfolio-count">${cursos.length} ${cursos.length === 1 ? 'curso disponible' : 'cursos disponibles'}</span>
            </div>
            <a href="#/creatividad" class="btn-see-all" style="text-decoration:none">Ver Catálogo Completo →</a>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:16px;margin-top:12px">
            ${cursos.map(c => `
              <div class="perfil-card" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.05)">
                ${c.imagenUrl ? `
                  <img src="${c.imagenUrl}" alt="${c.nombreCurso}" style="width:100%;height:140px;object-fit:cover" onerror="this.style.display='none'" />
                ` : ''}
                <div style="padding:16px">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                    <span style="font-size:0.75rem;padding:2px 8px;border-radius:6px;background:#ecfdf5;color:#047857;font-weight:600">
                      ${c.nivel || 'Nivel General'}
                    </span>
                    <span style="font-weight:700;color:#0d6855;font-size:0.9rem">
                      ${c.precio && c.precio > 0 ? `C$ ${Number(c.precio).toLocaleString()}` : 'Gratuito'}
                    </span>
                  </div>
                  <h5 style="margin:0 0 6px;color:#0f2e26;font-size:0.98rem;font-weight:700">${c.nombreCurso}</h5>
                  ${c.descripcion ? `<p style="margin:0 0 10px;font-size:0.85rem;color:#64748b;line-height:1.4">${c.descripcion}</p>` : ''}
                  ${c.videoUrl ? `
                    <button class="btn-perfil-outline perfil-portfolio-item" 
                            data-tipo="VIDEO" 
                            data-url="${c.videoUrl}" 
                            data-title="${c.nombreCurso}"
                            style="width:100%;justify-content:center;padding:7px;font-size:0.85rem">
                      ▶ Ver Video Clase
                    </button>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;
  },

  // ─────────────────────────────────────────────────────────────
  // TAB 2: PUBLICACIONES DEL USUARIO EN EL FEED
  // ─────────────────────────────────────────────────────────────
  _renderPublicacionesTab() {
    const posts = this._publicaciones || [];
    const p = this._perfilData;
    const avatarUrl = p.fotoPerfilUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.nombre || 'U')}&background=0d6855&color=fff`;

    if (posts.length === 0) {
      return `
        <div class="perfil-empty-state">
          <div class="perfil-empty-icon">📝</div>
          <div class="perfil-empty-title">Sin publicaciones en el feed</div>
          <p class="perfil-empty-desc">Este usuario no ha compartido publicaciones en el feed comunitario todavía.</p>
          ${this._isOwner ? `
            <a href="#/feed" class="btn-perfil-primary" style="text-decoration:none;display:inline-flex;align-items:center;gap:6px;margin:0 auto">
              Ir al Feed a publicar
            </a>
          ` : ''}
        </div>
      `;
    }

    const formatDate = (dateStr) => {
      if (!dateStr) return '';
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
            <span>📝 Publicaciones en el Feed</span>
            <span class="perfil-portfolio-count">${posts.length} ${posts.length === 1 ? 'publicación' : 'publicaciones'}</span>
          </div>
          ${this._isOwner ? `
            <a href="#/feed" class="btn-see-all" style="text-decoration:none">
              + Nueva Publicación
            </a>
          ` : ''}
        </div>

        ${posts.map(post => {
          const authorPhoto = post.autorFoto || avatarUrl;
          const authorName = post.autorNombre || p.nombre;
          const mediaList = post.multimedia || [];

          return `
            <article class="perfil-post-card" style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,0.05)">
              <div class="perfil-post-header" style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
                <img src="${authorPhoto}" alt="${authorName}" class="perfil-post-avatar" style="width:44px;height:44px;border-radius:50%;object-fit:cover" onerror="this.src='https://ui-avatars.com/api/?name=U&background=0d6855&color=fff'" />
                <div>
                  <div class="perfil-post-author" style="font-weight:700;color:#0f2e26;font-size:0.98rem">${authorName}</div>
                  <div class="perfil-post-date" style="font-size:0.8rem;color:#64748b">${formatDate(post.fechaPublicacion)}</div>
                </div>
              </div>

              ${post.texto ? `<div class="perfil-post-body" style="font-size:0.95rem;color:#1e293b;line-height:1.6;margin-bottom:14px;white-space:pre-wrap">${post.texto}</div>` : ''}

              ${mediaList.length > 0 ? `
                <div class="perfil-post-media-wrap" style="display:grid;grid-template-columns:${mediaList.length > 1 ? '1fr 1fr' : '1fr'};gap:8px;margin-bottom:14px;border-radius:10px;overflow:hidden">
                  ${mediaList.map(m => {
                    const isVideo = m.tipo === 'VIDEO' || (m.url && (m.url.includes('youtube') || m.url.includes('youtu.be') || m.url.endsWith('.mp4')));
                    const ytMatch = m.url ? m.url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/) : null;

                    if (ytMatch && ytMatch[1]) {
                      return `
                        <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:8px;background:#000;grid-column:${mediaList.length === 1 ? 'auto' : '1 / -1'}">
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
                        <video src="${m.url}" controls playsinline style="width:100%;max-height:360px;border-radius:8px;background:#000"></video>
                      `;
                    } else {
                      return `
                        <img src="${m.url}" alt="Post media" style="width:100%;max-height:400px;object-fit:cover;border-radius:8px" onerror="this.style.display='none'" />
                      `;
                    }
                  }).join('')}
                </div>
              ` : ''}

              <div class="perfil-post-actions" style="display:flex;align-items:center;justify-content:space-between;padding-top:12px;border-top:1px solid #f1f5f9;color:#64748b;font-size:0.88rem">
                <div style="display:flex;align-items:center;gap:16px">
                  <span style="display:flex;align-items:center;gap:4px">
                    ❤️ <strong>${post.totalLikes || 0}</strong> Me gusta
                  </span>
                  <span style="display:flex;align-items:center;gap:4px">
                    💬 <strong>${post.totalComentarios || 0}</strong> Comentarios
                  </span>
                </div>
                <a href="#/detalle?tipo=post&id=${post.idPublicacion || post.id}" style="color:#0d6855;font-weight:700;text-decoration:none;font-size:0.85rem;display:inline-flex;align-items:center;gap:4px">
                  Ver detalle →
                </a>
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

    avatarInput?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Preview local instantáneo
      const reader = new FileReader();
      reader.onload = (re) => {
        if (avatarPreview) avatarPreview.src = re.target.result;
      };
      reader.readAsDataURL(file);

      // Subir al backend
      try {
        const uploadRes = await perfilService.subirArchivo(file, 'perfiles');
        if (uploadRes && uploadRes.url) {
          newAvatarUrl = uploadRes.url;
        }
      } catch (err) {
        console.warn('Subiendo fallback para avatar:', err);
      }
    });

    // ── SUBIDA DE FOTO DE PORTADA ───────────────────────────────
    const coverInput = modalEdit?.querySelector('#file-cover-input');
    const coverPreview = modalEdit?.querySelector('#edit-cover-preview');
    const deleteCoverBtn = modalEdit?.querySelector('#btn-delete-cover');
    let newCoverUrl = this._metaExtendida?.fotoPortadaUrl;

    coverInput?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (re) => {
        if (coverPreview) coverPreview.src = re.target.result;
      };
      reader.readAsDataURL(file);

      try {
        const uploadRes = await perfilService.subirArchivo(file, 'portadas');
        if (uploadRes && uploadRes.url) {
          newCoverUrl = uploadRes.url;
        }
      } catch (err) {
        console.warn('Subiendo portada fallback:', err);
      }
    });

    deleteCoverBtn?.addEventListener('click', () => {
      newCoverUrl = null;
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
        // 1. Guardar datos principales en .NET Backend API
        await perfilService.actualizarPerfil({
          nombre,
          biografia,
          ubicacion,
          generoMusical,
          instrumento,
          fotoPerfilUrl: newAvatarUrl || this._perfilData.fotoPerfilUrl,
        });

        // 2. Guardar metadatos extendidos
        perfilService.saveMetadatosExtendidos(this._perfilData.idUsuario, {
          fotoPortadaUrl: newCoverUrl || this._metaExtendida.fotoPortadaUrl,
          experienciaAnios,
          disponibilidad,
          habilidades,
          redesSociales,
        });

        // Actualizar datos locales y re-renderizar
        this._perfilData.nombre = nombre;
        this._perfilData.biografia = biografia;
        this._perfilData.ubicacion = ubicacion;
        this._perfilData.generoMusical = generoMusical;
        this._perfilData.instrumento = instrumento;
        if (newAvatarUrl) this._perfilData.fotoPerfilUrl = newAvatarUrl;

        this._metaExtendida = perfilService.getMetadatosExtendidos(this._perfilData.idUsuario);

        closeEditModal();
        this._renderProfileView(container);
        alert('¡Perfil actualizado con éxito!');
      } catch (err) {
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
      const res = await perfilService.toggleSeguir(this._targetUserId);
      if (res.accion === 'SIGUIENDO') {
        followMainBtn.classList.add('following');
        followMainBtn.querySelector('span').textContent = 'Siguiendo';
        this._perfilData.totalSeguidores = (this._perfilData.totalSeguidores || 0) + 1;
      } else if (res.accion === 'DEJADO_DE_SEGUIR') {
        followMainBtn.classList.remove('following');
        followMainBtn.querySelector('span').textContent = 'Seguir';
        this._perfilData.totalSeguidores = Math.max(0, (this._perfilData.totalSeguidores || 1) - 1);
      }
      const statSeg = container.querySelector('#stat-seguidores strong');
      if (statSeg) statSeg.textContent = this._perfilData.totalSeguidores;
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
  }
};
