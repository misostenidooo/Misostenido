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
      FotoPerfilUrl: dto.fotoPerfilUrl !== undefined ? dto.fotoPerfilUrl : null,
    };

    const response = await api.put('/usuario/me', payload);

    // Actualizar el estado global del store y localStorage
    const currentUser = store.getState().user || JSON.parse(localStorage.getItem('misostenido_user') || '{}');
    const updatedUser = {
      ...currentUser,
      name: dto.nombre || currentUser.name,
      photoUrl: dto.fotoPerfilUrl !== undefined ? dto.fotoPerfilUrl : currentUser.photoUrl,
      location: dto.ubicacion !== undefined ? dto.ubicacion : currentUser.location,
      generoMusical: dto.generoMusical !== undefined ? dto.generoMusical : currentUser.generoMusical,
      instrumento: dto.instrumento !== undefined ? dto.instrumento : currentUser.instrumento,
    };
    store.setState({ user: updatedUser });
    localStorage.setItem('misostenido_user', JSON.stringify(updatedUser));

    // Notificar a la aplicación para sincronizar Navbar, Feed y demás vistas
    window.dispatchEvent(new CustomEvent('user-profile-updated', { detail: updatedUser }));

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
   * Obtiene la lista de IDs de usuarios seguidos por el usuario actual
   */
  getSeguidosIds() {
    try {
      const stored = localStorage.getItem('misostenido_seguidos');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  },

  /**
   * Guarda o remueve un ID de usuario de la lista de seguidos local
   */
  guardarSeguidoLocal(idUsuario, isFollowing) {
    try {
      let list = this.getSeguidosIds();
      const idNum = parseInt(idUsuario, 10);
      if (isNaN(idNum)) return;
      if (isFollowing) {
        if (!list.includes(idNum)) list.push(idNum);
      } else {
        list = list.filter(id => id !== idNum);
      }
      localStorage.setItem('misostenido_seguidos', JSON.stringify(list));
    } catch (e) {}
  },

  /**
   * Seguir / Dejar de seguir a un usuario
   * @param {number} idUsuario
   */
  async toggleSeguir(idUsuario) {
    const idNum = parseInt(idUsuario, 10);
    try {
      const res = await api.post(`/social/seguir/${idUsuario}`, {});
      const isFollowing = res?.accion === 'SIGUIENDO' || res?.seguido === true || res?.isFollowing === true;
      const isUnfollowing = res?.accion === 'DEJADO_DE_SEGUIR' || res?.seguido === false;

      if (isFollowing) {
        this.guardarSeguidoLocal(idNum, true);
      } else if (isUnfollowing) {
        this.guardarSeguidoLocal(idNum, false);
      } else {
        const currentList = this.getSeguidosIds();
        const currentlyFollowing = currentList.includes(idNum);
        this.guardarSeguidoLocal(idNum, !currentlyFollowing);
      }
      return res;
    } catch (e) {
      const currentList = this.getSeguidosIds();
      const currentlyFollowing = currentList.includes(idNum);
      this.guardarSeguidoLocal(idNum, !currentlyFollowing);
      return { accion: currentlyFollowing ? 'DEJADO_DE_SEGUIR' : 'SIGUIENDO', local: true };
    }
  },

  /**
   * Verifica si el usuario actual sigue a otro usuario
   * @param {number} idUsuario
   */
  async esSeguidor(idUsuario) {
    const idNum = parseInt(idUsuario, 10);
    const localSeguidos = this.getSeguidosIds();
    if (localSeguidos.includes(idNum)) {
      return { esSeguidor: true };
    }

    try {
      const res = await api.get(`/social/es-seguidor/${idUsuario}`);
      if (res && (res.esSeguidor || res.siguiendo)) {
        this.guardarSeguidoLocal(idNum, true);
      }
      return res || { esSeguidor: false };
    } catch (e) {
      return { esSeguidor: localSeguidos.includes(idNum) };
    }
  },

  /**
   * Sube una imagen o archivo multimedia al servidor local
   * @param {File} file
   * @param {string} carpeta
   */
  async subirArchivo(file, carpeta = 'perfiles') {
    const { storageService } = await import('./storageService.js');
    return await storageService.uploadFile(file);
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
