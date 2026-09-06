/**
 * DetallePage.js — Página de detalle universal para Post, Evento, Contratación
 * Soporta tipo=post|evento|contratacion con id desde el hash
 */
import { api } from '../../services/api.js';
import { feedService } from '../../services/feedService.js';
import { authService } from '../../services/authService.js';
import { router } from '../../router/router.js';

export const DetallePage = {
  render() {
    const container = document.createElement('div');
    container.className = 'detalle-page animate-fade';
    container.innerHTML = `<div class="detalle-loading"><div class="spinner-ring"></div><p>Cargando contenido...</p></div>`;

    setTimeout(() => this._load(container), 0);
    return container;
  },

  async _load(container) {
    const hash = window.location.hash; // e.g. #/detalle?tipo=post&id=5
    const queryStr = hash.includes('?') ? hash.split('?')[1] : '';
    const params = new URLSearchParams(queryStr);
    const tipo = params.get('tipo');
    const id = params.get('id');

    if (!tipo || !id) {
      container.innerHTML = this._renderError('Parámetros inválidos. Vuelve atrás.');
      return;
    }

    try {
      if (tipo === 'post') {
        await this._renderPost(container, id);
      } else if (tipo === 'evento') {
        await this._renderEvento(container, id);
      } else if (tipo === 'contratacion' || tipo === 'oferta') {
        await this._renderContratacion(container, id);
      } else if (tipo === 'solicitud') {
        await this._renderSolicitud(container, id);
      } else if (tipo === 'negocio') {
        await this._renderNegocio(container, id);
      } else {
        container.innerHTML = this._renderError('Tipo de contenido no reconocido.');
      }
    } catch (err) {
      console.error('[DetallePage] Error cargando detalle:', err);
      container.innerHTML = this._renderError('Error al cargar el contenido. Intenta de nuevo.');
    }
  },

  async _renderPost(container, id) {
    const data = await api.get(`/Feed/posts/${id}`);
    if (!data) { container.innerHTML = this._renderError('Publicación no encontrada.'); return; }

    const user = authService.getCurrentUser() || {};
    const isAuth = authService.isAuthenticated();
    const avatar = data.autorFoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.autorNombre || 'U')}&background=0d6855&color=fff`;

    // Renderizar media
    const mediaHtml = (data.media || []).map(m => {
      if (m.tipo === 'FOTO') return `<img src="${m.url}" alt="Foto del post" class="detalle-media-img" />`;
      if (m.tipo === 'VIDEO') {
        const isYT = m.url.includes('youtube.com') || m.url.includes('youtu.be');
        if (isYT) {
          const ytId = this._extractYouTubeId(m.url);
          return `<div class="detalle-video-wrap"><iframe src="https://www.youtube.com/embed/${ytId}" allowfullscreen class="detalle-iframe"></iframe></div>`;
        }
        return `<video src="${m.url}" controls class="detalle-video"></video>`;
      }
      if (m.tipo === 'AUDIO') return `<audio src="${m.url}" controls class="detalle-audio"></audio>`;
      return '';
    }).join('');

    const comentariosHtml = await this._loadComentarios(id);

    container.innerHTML = `
      <div class="detalle-container">
        <button class="btn-detalle-back" id="btn-back">← Volver</button>
        <article class="detalle-card">
          <div class="detalle-author-row">
            <img src="${avatar}" alt="${data.autorNombre}" class="detalle-avatar" />
            <div>
              <h2 class="detalle-author-name">${data.autorNombre || 'Músico'}</h2>
              <small class="detalle-date">${data.autorTipo || 'Músico'} · ${this._formatDate(data.fechaCreacion)}</small>
            </div>
          </div>
          ${data.texto ? `<p class="detalle-text">${data.texto}</p>` : ''}
          ${mediaHtml ? `<div class="detalle-media-grid">${mediaHtml}</div>` : ''}
          <div class="detalle-stats">
            <span class="detalle-stat-item">❤️ ${data.totalLikes || 0} likes</span>
            <span class="detalle-stat-item">💬 ${data.totalComentarios || 0} comentarios</span>
            ${isAuth ? `<button class="btn-detalle-like" id="btn-like-post" data-id="${id}">❤️ Me gusta</button>` : ''}
          </div>
          <section class="detalle-comments">
            <h3>Comentarios</h3>
            <div id="comments-list">${comentariosHtml}</div>
            ${isAuth ? `
              <div class="detalle-comment-form">
                <img src="${user.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name||'U')}&background=0d6855&color=fff`}" class="detalle-avatar-sm" />
                <div class="comment-input-wrap">
                  <textarea id="comment-input" placeholder="Escribe un comentario..." class="detalle-comment-input" rows="2"></textarea>
                  <button class="btn-submit-comment" id="btn-submit-comment">Publicar</button>
                </div>
              </div>
            ` : `<p class="detalle-login-hint"><a href="#/login">Inicia sesión</a> para comentar.</p>`}
          </section>
        </article>
      </div>
    `;
    this._attachPostEvents(container, id);
  },

  async _loadComentarios(idPost) {
    try {
      const comentarios = await feedService.getComentarios(idPost);
      if (!comentarios || comentarios.length === 0) return '<p class="no-comments">Sé el primero en comentar.</p>';
      return comentarios.map(c => {
        const av = c.autorFoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.autorNombre||'U')}&background=555&color=fff`;
        return `
          <div class="detalle-comment">
            <img src="${av}" class="detalle-avatar-sm" />
            <div class="comment-bubble">
              <strong>${c.autorNombre || 'Usuario'}</strong>
              <p>${c.texto}</p>
              <small>${this._formatDate(c.fechaCreacion)}</small>
            </div>
          </div>
        `;
      }).join('');
    } catch { return '<p class="no-comments">No se pudieron cargar los comentarios.</p>'; }
  },

  _attachPostEvents(container, idPost) {
    container.querySelector('#btn-back')?.addEventListener('click', () => history.back());

    const likeBtn = container.querySelector('#btn-like-post');
    likeBtn?.addEventListener('click', async () => {
      try {
        await feedService.toggleLike(idPost);
        likeBtn.classList.toggle('liked');
      } catch(e) { console.warn('Error like:', e); }
    });

    const submitBtn = container.querySelector('#btn-submit-comment');
    submitBtn?.addEventListener('click', async () => {
      const input = container.querySelector('#comment-input');
      const texto = input?.value?.trim();
      if (!texto) return;
      try {
        await feedService.comentar(idPost, texto);
        input.value = '';
        const list = container.querySelector('#comments-list');
        const user = authService.getCurrentUser() || {};
        const av = user.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name||'U')}&background=0d6855&color=fff`;
        list.insertAdjacentHTML('beforeend', `
          <div class="detalle-comment animate-fade">
            <img src="${av}" class="detalle-avatar-sm" />
            <div class="comment-bubble">
              <strong>${user.name || 'Tú'}</strong>
              <p>${texto}</p>
              <small>Ahora mismo</small>
            </div>
          </div>
        `);
      } catch(e) { alert('Error al comentar: ' + e.message); }
    });
  },

  async _renderEvento(container, id) {
    const data = await api.get(`/Evento/${id}`);
    if (!data) { container.innerHTML = this._renderError('Evento no encontrado.'); return; }

    const fecha = data.fechaEvento ? new Date(data.fechaEvento) : null;
    const fechaStr = fecha ? fecha.toLocaleDateString('es-ES', { weekday:'long', year:'numeric', month:'long', day:'numeric' }) : 'Fecha por confirmar';
    const mediaHtml = (data.multimedia || data.media || []).map(m => {
      if (m.tipo === 'FOTO') return `<img src="${m.url}" alt="${data.titulo}" class="detalle-media-img" />`;
      if (m.tipo === 'VIDEO') return `<video src="${m.url}" controls class="detalle-video"></video>`;
      return '';
    }).join('');

    container.innerHTML = `
      <div class="detalle-container">
        <button class="btn-detalle-back" id="btn-back">← Volver</button>
        <article class="detalle-card">
          ${mediaHtml ? `<div class="detalle-media-grid detalle-hero-media">${mediaHtml}</div>` : ''}
          <div class="detalle-evento-header">
            <span class="detalle-tipo-badge">🎟️ ${data.tipoEvento || 'Evento Musical'}</span>
            <h1 class="detalle-title">${data.titulo}</h1>
            <p class="detalle-evento-meta">📅 ${fechaStr}</p>
            <p class="detalle-evento-meta">📍 ${data.ubicacion || 'Ubicación por confirmar'}</p>
            <p class="detalle-evento-meta">👤 Organizado por ${data.organizadorNombre || 'Misostenido'}</p>
          </div>
          ${data.descripcion ? `<p class="detalle-descripcion">${data.descripcion}</p>` : ''}
          ${data.infoInscripcion ? `<div class="detalle-info-box"><h4>📋 Información de inscripción</h4><p>${data.infoInscripcion}</p></div>` : ''}
        </article>
      </div>
    `;
    container.querySelector('#btn-back')?.addEventListener('click', () => history.back());
  },

  async _renderContratacion(container, id) {
    const data = await api.get(`/Contratacion/ofertas/${id}`);
    if (!data) { container.innerHTML = this._renderError('Oferta no encontrada.'); return; }

    const mediaHtml = (data.multimedia || data.media || []).map(m => {
      if (m.tipo === 'FOTO') return `<img src="${m.url}" alt="${data.titulo}" class="detalle-media-img" />`;
      if (m.tipo === 'AUDIO') return `<audio src="${m.url}" controls class="detalle-audio"></audio>`;
      if (m.tipo === 'VIDEO') return `<video src="${m.url}" controls class="detalle-video"></video>`;
      return '';
    }).join('');

    const tarifa = data.tarifaAproximada ? `$${data.tarifaAproximada} USD` : 'A convenir';
    const isAuth = authService.isAuthenticated();

    container.innerHTML = `
      <div class="detalle-container">
        <button class="btn-detalle-back" id="btn-back">← Volver</button>
        <article class="detalle-card">
          ${mediaHtml ? `<div class="detalle-media-grid">${mediaHtml}</div>` : ''}
          <div class="detalle-evento-header">
            <span class="detalle-tipo-badge">💼 Oferta de Servicio</span>
            <h1 class="detalle-title">${data.titulo}</h1>
            <p class="detalle-evento-meta">💰 Tarifa: ${tarifa}</p>
            <p class="detalle-evento-meta">📍 ${data.ubicacion || 'Nicaragua'}</p>
            <p class="detalle-evento-meta">🎵 Género: ${data.generoMusical || 'General'}</p>
            <p class="detalle-evento-meta">👤 Publicado por: ${data.artistaNombre || 'Artista'}</p>
          </div>
          ${data.descripcion ? `<p class="detalle-descripcion">${data.descripcion}</p>` : ''}
          ${isAuth ? `
            <button class="btn-detalle-action" id="btn-postular">💼 Postularme a esta oferta</button>
          ` : `<p class="detalle-login-hint"><a href="#/login">Inicia sesión</a> para postularte.</p>`}
        </article>
      </div>
    `;
    container.querySelector('#btn-back')?.addEventListener('click', () => history.back());
    container.querySelector('#btn-postular')?.addEventListener('click', () => {
      router.navigate('#/contrataciones');
    });
  },

  async _renderSolicitud(container, id) {
    const data = await api.get(`/Contratacion/solicitudes/${id}`);
    if (!data) { container.innerHTML = this._renderError('Solicitud no encontrada.'); return; }

    const mediaHtml = (data.multimedia || data.media || []).map(m => {
      if (m.tipo === 'FOTO') return `<img src="${m.url}" alt="${data.titulo}" class="detalle-media-img" />`;
      if (m.tipo === 'AUDIO') return `<audio src="${m.url}" controls class="detalle-audio"></audio>`;
      if (m.tipo === 'VIDEO') return `<video src="${m.url}" controls class="detalle-video"></video>`;
      return '';
    }).join('');

    const presupuesto = data.presupuesto ? `$${data.presupuesto} USD` : 'A convenir';
    const isAuth = authService.isAuthenticated();

    container.innerHTML = `
      <div class="detalle-container">
        <button class="btn-detalle-back" id="btn-back">← Volver</button>
        <article class="detalle-card">
          ${mediaHtml ? `<div class="detalle-media-grid">${mediaHtml}</div>` : ''}
          <div class="detalle-evento-header">
            <span class="detalle-tipo-badge">💼 Solicitud de Evento</span>
            <h1 class="detalle-title">${data.titulo}</h1>
            <p class="detalle-evento-meta">💰 Presupuesto: ${presupuesto}</p>
            <p class="detalle-evento-meta">📍 ${data.ubicacion || 'Nicaragua'}</p>
            ${data.fechaEvento ? `<p class="detalle-evento-meta">📅 Fecha: ${new Date(data.fechaEvento).toLocaleDateString('es-NI')}</p>` : ''}
            <p class="detalle-evento-meta">👤 Publicado por: ${data.contratanteNombre || 'Organizador'}</p>
          </div>
          ${data.descripcion ? `<p class="detalle-descripcion">${data.descripcion}</p>` : ''}
          ${isAuth ? `
            <button class="btn-detalle-action" id="btn-postular">💼 Postularme a este evento</button>
          ` : `<p class="detalle-login-hint"><a href="#/login">Inicia sesión</a> para postularte.</p>`}
        </article>
      </div>
    `;
    container.querySelector('#btn-back')?.addEventListener('click', () => history.back());
    container.querySelector('#btn-postular')?.addEventListener('click', () => {
      router.navigate('#/contrataciones');
    });
  },

  async _renderNegocio(container, id) {
    const data = await api.get(`/creatividad/negocios/${id}`);
    if (!data) { container.innerHTML = this._renderError('Negocio no encontrado.'); return; }

    const mediaHtml = (data.multimedia || []).map(m => {
      if (m.tipo === 'FOTO') return `<img src="${m.url}" alt="${data.nombre}" class="detalle-media-img" />`;
      if (m.tipo === 'VIDEO') return `<video src="${m.url}" controls class="detalle-video"></video>`;
      return '';
    }).join('');

    container.innerHTML = `
      <div class="detalle-container">
        <button class="btn-detalle-back" id="btn-back">← Volver</button>
        <article class="detalle-card">
          ${data.fotoPerfilUrl ? `<img src="${data.fotoPerfilUrl}" alt="${data.nombre}" class="detalle-negocio-avatar" />` : ''}
          <div class="detalle-evento-header">
            <span class="detalle-tipo-badge">🎨 ${data.categoriaNombre || 'Creatividad'}</span>
            <h1 class="detalle-title">${data.nombre}</h1>
            ${data.ciudad ? `<p class="detalle-evento-meta">📍 ${data.ciudad}</p>` : ''}
            ${data.calificacionPromedio ? `<p class="detalle-evento-meta">⭐ ${data.calificacionPromedio.toFixed(1)} / 5</p>` : ''}
          </div>
          ${data.descripcion ? `<p class="detalle-descripcion">${data.descripcion}</p>` : ''}
          ${mediaHtml ? `<div class="detalle-media-grid">${mediaHtml}</div>` : ''}
        </article>
      </div>
    `;
    container.querySelector('#btn-back')?.addEventListener('click', () => history.back());
  },

  _renderError(msg) {
    return `
      <div class="detalle-container">
        <div class="detalle-error">
          <span>😕</span>
          <h2>${msg}</h2>
          <button class="btn-detalle-back" onclick="history.back()">← Volver atrás</button>
        </div>
      </div>
    `;
  },

  _extractYouTubeId(url) {
    const match = url.match(/(?:v=|youtu\.be\/|embed\/)([^&?/]+)/);
    return match ? match[1] : '';
  },

  _formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('es-ES', { day:'numeric', month:'short', year:'numeric' });
    } catch { return dateStr; }
  }
};
