/**
 * feedService.js — Servicio de publicaciones del Feed conectado al Backend .NET
 * Endpoints: Misostenido.Api / Controllers / FeedController.cs
 */
import { api } from './api.js';
import { authService } from './authService.js';
import { storageService } from './storageService.js';

export const feedService = {
  /**
   * Sube uno o varios archivos usando el storageService (ImgBB / CDN / Backend)
   * @param {File[]|FileList} files 
   * @returns {Promise<Array<{ url: string, tipo: string }>>}
   */
  async uploadFiles(files) {
    if (!files || files.length === 0) return [];

    const fileArray = Array.from(files);
    const uploadPromises = fileArray.map(file => storageService.uploadFile(file));
    const results = await Promise.all(uploadPromises);
    return results.filter(r => r && r.url);
  },

  /**
   * Obtiene la lista de publicaciones desde GET /api/Feed/posts
   * @param {Object} params - { page: 1, pageSize: 10 }
   */
  async getPosts({ page = 1, pageSize = 10 } = {}) {
    try {
      const data = await api.get(`/Feed/posts?pagina=${page}&tamanoPagina=${pageSize}`);
      const postsArray = Array.isArray(data) ? data : (data?.posts || data?.publicaciones || []);
      
      return {
        posts: postsArray,
        hasMore: postsArray.length === pageSize,
        isApiOnline: true,
      };
    } catch (error) {
      console.warn('[feedService] Error al obtener posts desde el backend:', error.message);
      return {
        posts: [],
        hasMore: false,
        error: error.message,
        isApiOnline: false,
      };
    }
  },

  /**
   * Crea una nueva publicación en POST /api/Feed/posts con archivos locales o URLs
   * @param {Object} data - { texto, files, mediaUrls, tipoMedia }
   */
  async crearPublicacion({ texto, files = [], mediaUrls = [], tipoMedia = 'FOTO' }) {
    if (!authService.isAuthenticated()) {
      throw new Error('Debes iniciar sesión para publicar.');
    }

    // 1. Si hay archivos físicos seleccionados, subirlos primero a Supabase
    let finalMediaItems = [];

    if (files && files.length > 0) {
      const uploaded = await this.uploadFiles(files);
      // Preservar el tipo exacto que devuelve storageService (FOTO, VIDEO o AUDIO)
      finalMediaItems = uploaded.map(u => ({
        url: u.url,
        tipo: u.tipo || this._detectTipoFromUrl(u.url)
      }));
    }

    // 2. Agregar URLs adicionales si las hubiera
    if (mediaUrls && mediaUrls.length > 0) {
      for (const url of mediaUrls) {
        if (url && url.trim()) {
          finalMediaItems.push({
            url: url.trim(),
            tipo: tipoMedia
          });
        }
      }
    }

    // 3. Crear el post base en /api/Feed/posts
    const payload = {
      Texto: texto ? texto.trim() : ''
    };

    const resPost = await api.post('/Feed/posts', payload);
    const idPost = resPost?.idPublicacion || resPost?.id || resPost?.data?.idPublicacion;

    // 4. Asociar cada multimedia subida al post con su TIPO CORRECTO
    if (idPost && finalMediaItems.length > 0) {
      for (const item of finalMediaItems) {
        try {
          console.log(`[feedService] Asociando ${item.tipo} → ${item.url}`);
          await api.post(`/Feed/posts/${idPost}/media`, {
            Tipo: item.tipo,   // 'FOTO', 'VIDEO' o 'AUDIO'
            Url: item.url,
            Descripcion: item.tipo === 'AUDIO' ? item.url.split('/').pop() : null
          });
        } catch (e) {
          console.warn('[feedService] Error al adjuntar media al post:', e);
        }
      }
    }

    return resPost;
  },

  /**
   * Detecta el tipo de media por la URL (fallback cuando el storageService no devuelve tipo)
   */
  _detectTipoFromUrl(url) {
    if (!url) return 'FOTO';
    const u = url.toLowerCase();
    if (u.match(/\.(mp3|wav|ogg|m4a|aac|flac)([?#]|$)/)) return 'AUDIO';
    if (u.match(/\.(mp4|webm|mov|mkv|avi)([?#]|$)/)) return 'VIDEO';
    return 'FOTO';
  },

  /**
   * Da o quita Like en POST /api/Feed/posts/{idPost}/like
   */
  async toggleLike(idPost) {
    if (!authService.isAuthenticated()) {
      throw new Error('Debes iniciar sesión para dar like.');
    }
    return await api.post(`/Feed/posts/${idPost}/like`, {});
  },

  /**
   * Obtiene los comentarios de una publicación en GET /api/Feed/posts/{idPost}/comentarios
   */
  async getComentarios(idPost) {
    try {
      const data = await api.get(`/Feed/posts/${idPost}/comentarios`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn(`[feedService] Error al cargar comentarios del post ${idPost}:`, error);
      return [];
    }
  },

  /**
   * Agrega un comentario en POST /api/Feed/posts/{idPost}/comentarios
   */
  async comentar(idPost, texto) {
    if (!authService.isAuthenticated()) {
      throw new Error('Debes iniciar sesión para comentar.');
    }
    return await api.post(`/Feed/posts/${idPost}/comentarios`, {
      Texto: texto.trim()
    });
  },

  /**
   * Elimina una publicación en DELETE /api/Feed/posts/{idPost}
   */
  async eliminarPublicacion(idPost) {
    return await api.delete(`/Feed/posts/${idPost}`);
  },

  /**
   * Obtiene eventos reales desde GET /api/Evento
   */
  async getEventosSidebar() {
    try {
      const data = await api.get('/Evento?soloProximos=true&tamanoPagina=3');
      return Array.isArray(data) ? data : (data?.eventos || []);
    } catch {
      return [];
    }
  },

  /**
   * Obtiene contrataciones/ofertas desde GET /api/Contratacion/ofertas
   */
  async getOportunidadesSidebar() {
    try {
      const data = await api.get('/Contratacion/ofertas?tamanoPagina=3');
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  /**
   * Obtiene artistas destacados de la comunidad desde GET /api/Inicio/destacados
   */
  async getMusicosSugeridosSidebar() {
    try {
      const data = await api.get('/Inicio/destacados');
      return data?.artistasDestacados || [];
    } catch {
      return [];
    }
  }
};
