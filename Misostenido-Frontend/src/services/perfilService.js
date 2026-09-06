/**
 * perfilService.js — Servicio para el módulo de Perfil de Usuario en Misostenido
 * Conectado a UsuarioController, SocialController, UploadController y FeedController
 */
import { api } from './api.js';
import { store } from '../store/store.js';

export const perfilService = {
  /**
   * Obtiene el perfil completo del usuario autenticado
   */
  async getMiPerfil() {
    try {
      const response = await api.get('/usuario/me');
      return response;
    } catch (error) {
      console.warn('Error al obtener perfil propio desde API:', error);
      return null;
    }
  },

  /**
   * Obtiene el perfil público de un usuario por ID
   * @param {number} idUsuario
   */
  async getPerfil(idUsuario) {
    try {
      const response = await api.get(`/usuario/${idUsuario}`);
      return response;
    } catch (error) {
      console.warn(`Error al obtener perfil ${idUsuario}:`, error);
      return null;
    }
  },

  /**
   * Actualiza los datos del perfil del usuario autenticado
   * @param {Object} dto - { nombre, biografia, ubicacion, generoMusical, instrumento, fotoPerfilUrl }
   */
  async actualizarPerfil(dto) {
    const payload = {
      Nombre: dto.nombre || '',
      Biografia: dto.biografia || null,
      Ubicacion: dto.ubicacion || null,
      GeneroMusical: dto.generoMusical || null,
      Instrumento: dto.instrumento || null,
      FotoPerfilUrl: dto.fotoPerfilUrl || null,
    };

    const response = await api.put('/usuario/me', payload);

    // Actualizar el estado global del store
    const currentUser = store.getState().user || {};
    const updatedUser = {
      ...currentUser,
      name: dto.nombre || currentUser.name,
      photoUrl: dto.fotoPerfilUrl || currentUser.photoUrl,
    };
    store.setState({ user: updatedUser });
    localStorage.setItem('misostenido_user', JSON.stringify(updatedUser));

    return response;
  },

  /**
   * Sube un elemento multimedia al portafolio del usuario autenticado
   * @param {Object} dto - { tipo: 'FOTO'|'VIDEO'|'AUDIO', url: string, descripcion: string }
   */
  async subirMedia(dto) {
    const payload = {
      Tipo: dto.tipo || 'FOTO',
      Url: dto.url || '',
      Descripcion: dto.descripcion || '',
    };
    return await api.post('/usuario/me/media', payload);
  },

  /**
   * Elimina un elemento del portafolio multimedia
   * @param {number} idMedia
   */
  async eliminarMedia(idMedia) {
    return await api.delete(`/usuario/me/media/${idMedia}`);
  },

  /**
   * Obtiene el portafolio multimedia de un usuario
   * @param {number} idUsuario
   */
  async obtenerMedia(idUsuario) {
    try {
      return await api.get(`/usuario/${idUsuario}/media`);
    } catch (e) {
      return [];
    }
  },

  /**
   * Obtiene las publicaciones del feed filtradas por idUsuario
   * El backend no tiene filtro por autor en GET /api/Feed/posts,
   * así que traemos un lote grande y filtramos en frontend.
   * @param {number} idUsuario
   */
  async getPublicacionesDeUsuario(idUsuario) {
    try {
      const data = await api.get(`/Feed/posts?pagina=1&tamanoPagina=100`);
      const todos = Array.isArray(data) ? data : (data?.posts || data?.publicaciones || []);
      return todos.filter(p => {
        const autorId = p.autorId ?? p.AutorId ?? p.idUsuario ?? p.IdUsuario ?? p.autor?.idUsuario ?? p.autor?.id;
        return parseInt(autorId, 10) === parseInt(idUsuario, 10);
      });
    } catch (e) {
      console.warn('[perfilService] Error al obtener publicaciones del usuario:', e);
      return [];
    }
  },

  /**
   * Obtiene los eventos del usuario (como organizador)
   * Filtra en frontend por organizadorId / idOrganizador
   * @param {number} idUsuario
   */
  async getEventosDeUsuario(idUsuario) {
    try {
      const data = await api.get(`/Evento?soloProximos=false&pagina=1&tamanoPagina=100`);
      const todos = Array.isArray(data) ? data : (data?.eventos || []);
      const userEventos = todos.filter(e => {
        const orgId = e.organizadorId ?? e.OrganizadorId ?? e.idOrganizador ?? e.IdOrganizador ?? e.organizador?.idUsuario;
        return parseInt(orgId, 10) === parseInt(idUsuario, 10);
      });

      return await Promise.all(
        userEventos.map(async (ev) => {
          const id = ev.idEvento || ev.id;
          try {
            const det = await api.get(`/Evento/${id}`);
            if (det) return { ...ev, ...det, media: det.media || [] };
          } catch (err) {}
          return ev;
        })
      );
    } catch (e) {
      console.warn('[perfilService] Error al obtener eventos del usuario:', e);
      return [];
    }
  },

  /**
   * Obtiene las ofertas de contratación del usuario (como artista)
   * @param {number} idUsuario
   */
  async getOfertasDeUsuario(idUsuario) {
    try {
      const data = await api.get(`/Contratacion/ofertas?pagina=1&tamanoPagina=100`);
      const todas = Array.isArray(data) ? data : (data?.ofertas || []);
      return todas.filter(o => {
        const artId = o.artistaId ?? o.ArtistaId ?? o.idArtista ?? o.IdArtista ?? o.artista?.idUsuario ?? o.idUsuario;
        return parseInt(artId, 10) === parseInt(idUsuario, 10);
      });
    } catch (e) {
      console.warn('[perfilService] Error al obtener ofertas del usuario:', e);
      return [];
    }
  },

  /**
   * Obtiene las solicitudes de contratación del usuario (como contratante)
   * @param {number} idUsuario
   */
  async getSolicitudesDeUsuario(idUsuario) {
    try {
      const data = await api.get(`/Contratacion/solicitudes?pagina=1&tamanoPagina=100`);
      const todas = Array.isArray(data) ? data : (data?.solicitudes || []);
      return todas.filter(s => {
        const contId = s.contratanteId ?? s.ContratanteId ?? s.idContratante ?? s.IdContratante ?? s.contratante?.idUsuario ?? s.idUsuario;
        return parseInt(contId, 10) === parseInt(idUsuario, 10);
      });
    } catch (e) {
      console.warn('[perfilService] Error al obtener solicitudes del usuario:', e);
      return [];
    }
  },

  /**
   * Obtiene los cursos o contenido de entretenimiento/creatividad
   */
  async getCursosDeUsuario() {
    try {
      const data = await api.get('/creatividad/cursos');
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.warn('[perfilService] Error al obtener cursos de creatividad:', e);
      return [];
    }
  },

  /**
   * Seguir / Dejar de seguir a un usuario
   * @param {number} idUsuario
   */
  async toggleSeguir(idUsuario) {
    try {
      return await api.post(`/social/seguir/${idUsuario}`, {});
    } catch (e) {
      return { accion: 'ERROR', mensaje: e.message };
    }
  },

  /**
   * Verifica si el usuario actual sigue a otro usuario
   * @param {number} idUsuario
   */
  async esSeguidor(idUsuario) {
    try {
      return await api.get(`/social/es-seguidor/${idUsuario}`);
    } catch (e) {
      return { esSeguidor: false };
    }
  },

  /**
   * Sube una imagen o archivo multimedia al servidor local
   * @param {File} file
   * @param {string} carpeta
   */
  async subirArchivo(file, carpeta = 'perfiles') {
    const formData = new FormData();
    formData.append('archivos', file);

    const token = localStorage.getItem('misostenido_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`http://localhost:5000/api/Upload?carpeta=${carpeta}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.mensaje || 'Error al subir archivo');
    }

    return await res.json();
  },

  /**
   * Guarda metadatos extendidos del perfil en LocalStorage
   * Solo persiste lo que el usuario ingresa — sin datos inventados por defecto
   */
  getMetadatosExtendidos(idUsuario) {
    try {
      const key = `perfil_meta_${idUsuario}`;
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    // Retorna objeto vacío real — SIN datos inventados
    return {
      fotoPortadaUrl: null,
      experienciaAnios: null,
      disponibilidad: null,
      habilidades: [],
      redesSociales: {
        instagram: '',
        youtube: '',
        spotify: '',
        soundcloud: '',
        tiktok: '',
        facebook: ''
      }
    };
  },

  saveMetadatosExtendidos(idUsuario, data) {
    try {
      const key = `perfil_meta_${idUsuario}`;
      const existing = this.getMetadatosExtendidos(idUsuario);
      const merged = { ...existing, ...data };
      localStorage.setItem(key, JSON.stringify(merged));
      return merged;
    } catch (e) {
      return data;
    }
  }
};
