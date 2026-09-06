/**
 * creatividadService.js — Servicio del módulo Creatividad conectado a la API .NET
 * Endpoints: /api/Creatividad/...
 * Conecta con los 15 Stored Procedures de Creatividad
 */
import { api } from './api.js';
import { authService } from './authService.js';
import { storageService } from './storageService.js';

export const creatividadService = {

  /**
   * Obtiene la lista de categorías activas con sus íconos y slugs.
   * GET /api/Creatividad/categorias
   */
  async getCategorias() {
    try {
      const data = await api.get('/Creatividad/categorias');
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn('[creatividadService] Error al cargar categorías:', error.message);
      return [];
    }
  },

  /**
   * Lista los negocios del directorio con filtros y paginación.
   * GET /api/Creatividad/negocios?...
   */
  async getNegocios({
    idCategoria = null,
    ciudad = '',
    busqueda = '',
    soloVerificados = false,
    soloDestacados = false,
    orden = 'RECIENTES',
    pagina = 1,
    tamPagina = 12
  } = {}) {
    try {
      const q = new URLSearchParams();
      if (idCategoria) q.append('idCategoria', idCategoria);
      if (ciudad) q.append('ciudad', ciudad);
      if (busqueda) q.append('busqueda', busqueda);
      if (soloVerificados) q.append('soloVerificados', 'true');
      if (soloDestacados) q.append('soloDestacados', 'true');
      if (orden) q.append('orden', orden);
      q.append('pagina', pagina);
      q.append('tamPagina', tamPagina);

      const data = await api.get(`/Creatividad/negocios?${q.toString()}`);
      const lista = Array.isArray(data) ? data : (data?.negocios || []);
      return { negocios: lista, isApiOnline: true };
    } catch (error) {
      console.warn('[creatividadService] Error al cargar negocios:', error.message);
      return { negocios: [], isApiOnline: false, error: error.message };
    }
  },

  /**
   * Obtiene el detalle completo de un negocio (multi-resultset: negocio, tags, multimedia, cursos, es_favorito).
   * GET /api/Creatividad/negocios/{idNegocio}
   */
  async getNegocioDetalle(idNegocio) {
    try {
      return await api.get(`/Creatividad/negocios/${idNegocio}`);
    } catch (error) {
      console.warn(`[creatividadService] Error al cargar detalle del negocio ${idNegocio}:`, error.message);
      return null;
    }
  },

  /**
   * Registra un nuevo negocio en el directorio.
   * POST /api/Creatividad/negocios
   */
  async crearNegocio(dto, files = []) {
    if (!authService.isAuthenticated()) {
      throw new Error('Debes iniciar sesión para publicar un negocio.');
    }

    const payload = {
      IdCategoria: parseInt(dto.idCategoria, 10),
      Nombre: dto.nombre.trim(),
      Descripcion: dto.descripcion ? dto.descripcion.trim() : null,
      Slogan: dto.slogan ? dto.slogan.trim() : null,
      LogoUrl: dto.logoUrl ? dto.logoUrl.trim() : null,
      ImagenPortadaUrl: dto.imagenPortadaUrl ? dto.imagenPortadaUrl.trim() : null,
      Direccion: dto.direccion ? dto.direccion.trim() : null,
      Ciudad: dto.ciudad ? dto.ciudad.trim() : null,
      Pais: dto.pais ? dto.pais.trim() : null,
      Telefono: dto.telefono ? dto.telefono.trim() : null,
      Whatsapp: dto.whatsapp ? dto.whatsapp.trim() : null,
      EmailContacto: dto.emailContacto ? dto.emailContacto.trim() : null,
      SitioWeb: dto.sitioWeb ? dto.sitioWeb.trim() : null,
      Instagram: dto.instagram ? dto.instagram.trim() : null,
      Facebook: dto.facebook ? dto.facebook.trim() : null,
      Tiktok: dto.tiktok ? dto.tiktok.trim() : null,
      Youtube: dto.youtube ? dto.youtube.trim() : null,
      Horario: dto.horario ? dto.horario.trim() : null,
      PrecioDesde: dto.precioDesde ? parseFloat(dto.precioDesde) : null,
      PrecioHasta: dto.precioHasta ? parseFloat(dto.precioHasta) : null,
      Moneda: dto.moneda || 'MXN'
    };

    const res = await api.post('/Creatividad/negocios', payload);
    const idNegocio = res?.id ?? res?.Id ?? res?.idNegocio;

    // Subir archivos multimedia adicionales si se adjuntaron
    if (idNegocio && files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        try {
          const resUp = await storageService.uploadFile(files[i]);
          if (resUp && resUp.url) {
            await this.agregarMultimedia(idNegocio, {
              tipo: resUp.tipo || 'FOTO',
              url: resUp.url,
              descripcion: files[i].name,
              esPrincipal: i === 0 && !payload.ImagenPortadaUrl,
              orden: i + 1
            });
          }
        } catch (e) {
          console.error('[creatividadService] Error al adjuntar multimedia:', e);
        }
      }
    }

    return { ...res, idNegocio };
  },

  /**
   * Actualiza los datos de un negocio propio.
   * PUT /api/Creatividad/negocios/{idNegocio}
   */
  async actualizarNegocio(idNegocio, dto) {
    if (!authService.isAuthenticated()) {
      throw new Error('Debes iniciar sesión para editar tu negocio.');
    }
    return await api.put(`/Creatividad/negocios/${idNegocio}`, {
      Nombre: dto.nombre ? dto.nombre.trim() : null,
      Descripcion: dto.descripcion ? dto.descripcion.trim() : null,
      Slogan: dto.slogan ? dto.slogan.trim() : null,
      LogoUrl: dto.logoUrl ? dto.logoUrl.trim() : null,
      ImagenPortadaUrl: dto.imagenPortadaUrl ? dto.imagenPortadaUrl.trim() : null,
      Direccion: dto.direccion ? dto.direccion.trim() : null,
      Ciudad: dto.ciudad ? dto.ciudad.trim() : null,
      Pais: dto.pais ? dto.pais.trim() : null,
      Telefono: dto.telefono ? dto.telefono.trim() : null,
      Whatsapp: dto.whatsapp ? dto.whatsapp.trim() : null,
      EmailContacto: dto.emailContacto ? dto.emailContacto.trim() : null,
      SitioWeb: dto.sitioWeb ? dto.sitioWeb.trim() : null,
      Instagram: dto.instagram ? dto.instagram.trim() : null,
      Facebook: dto.facebook ? dto.facebook.trim() : null,
      Tiktok: dto.tiktok ? dto.tiktok.trim() : null,
      Youtube: dto.youtube ? dto.youtube.trim() : null,
      Horario: dto.horario ? dto.horario.trim() : null,
      PrecioDesde: dto.precioDesde ? parseFloat(dto.precioDesde) : null,
      PrecioHasta: dto.precioHasta ? parseFloat(dto.precioHasta) : null,
      Moneda: dto.moneda || null
    });
  },

  /**
   * Elimina/desactiva un negocio (soft-delete).
   * DELETE /api/Creatividad/negocios/{idNegocio}
   */
  async eliminarNegocio(idNegocio) {
    if (!authService.isAuthenticated()) {
      throw new Error('Debes iniciar sesión para eliminar este negocio.');
    }
    return await api.delete(`/Creatividad/negocios/${idNegocio}`);
  },

  /**
   * Alterna estado de favorito de un negocio para el usuario actual.
   * POST /api/Creatividad/negocios/{idNegocio}/favorito
   */
  async toggleFavorito(idNegocio) {
    if (!authService.isAuthenticated()) {
      throw new Error('Debes iniciar sesión para guardar en favoritos.');
    }
    return await api.post(`/Creatividad/negocios/${idNegocio}/favorito`, {});
  },

  /**
   * Obtiene la lista de favoritos del usuario autenticado.
   * GET /api/Creatividad/favoritos
   */
  async getFavoritos() {
    if (!authService.isAuthenticated()) return [];
    try {
      const data = await api.get('/Creatividad/favoritos');
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn('[creatividadService] Error al cargar favoritos:', error.message);
      return [];
    }
  },

  /**
   * Publica una reseña de 1 a 5 estrellas con comentario.
   * POST /api/Creatividad/negocios/{idNegocio}/resenas
   */
  async crearResena(idNegocio, { calificacion, comentario }) {
    if (!authService.isAuthenticated()) {
      throw new Error('Debes iniciar sesión para dejar una reseña.');
    }
    return await api.post(`/Creatividad/negocios/${idNegocio}/resenas`, {
      Calificacion: parseInt(calificacion, 10),
      Comentario: comentario ? comentario.trim() : null
    });
  },

  /**
   * Obtiene reseñas paginadas de un negocio.
   * GET /api/Creatividad/negocios/{idNegocio}/resenas?pagina=1&tamPagina=10
   */
  async getResenas(idNegocio, pagina = 1, tamPagina = 10) {
    try {
      const data = await api.get(`/Creatividad/negocios/${idNegocio}/resenas?pagina=${pagina}&tamPagina=${tamPagina}`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn(`[creatividadService] Error al cargar reseñas de ${idNegocio}:`, error.message);
      return [];
    }
  },

  /**
   * Agrega multimedia a la galería de un negocio.
   * POST /api/Creatividad/negocios/{idNegocio}/multimedia
   */
  async agregarMultimedia(idNegocio, { tipo = 'FOTO', url, descripcion, esPrincipal = false, orden = 0 }) {
    return await api.post(`/Creatividad/negocios/${idNegocio}/multimedia`, {
      Tipo: tipo,
      Url: url,
      Descripcion: descripcion || null,
      EsPrincipal: esPrincipal,
      Orden: orden
    });
  },

  /**
   * Agrega un tag/etiqueta a un negocio.
   * POST /api/Creatividad/negocios/{idNegocio}/tags
   */
  async agregarTag(idNegocio, tag) {
    return await api.post(`/Creatividad/negocios/${idNegocio}/tags`, {
      Tag: tag.trim()
    });
  },

  /**
   * Crea un curso o video clase (asociado a negocio o como instructor independiente).
   * POST /api/Creatividad/negocios/{idNegocio}/cursos o POST /api/Creatividad/cursos
   */
  async crearCurso(idNegocio, dto, files = []) {
    if (!authService.isAuthenticated()) {
      throw new Error('Debes iniciar sesión para publicar un curso o video clase.');
    }

    let videoUrl = dto.videoUrl ? dto.videoUrl.trim() : null;
    let audioUrl = dto.audioUrl ? dto.audioUrl.trim() : null;
    let imagenUrl = dto.imagenUrl ? dto.imagenUrl.trim() : null;

    // Subir archivos multimedia si se adjuntaron
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const resUp = await storageService.uploadFile(file);
          if (resUp && resUp.url) {
            if (resUp.tipo === 'VIDEO' && !videoUrl) videoUrl = resUp.url;
            else if (resUp.tipo === 'AUDIO' && !audioUrl) audioUrl = resUp.url;
            else if (!imagenUrl) imagenUrl = resUp.url;
          }
        } catch (e) {
          console.error('[creatividadService] Error subiendo archivo de curso:', e);
        }
      }
    }

    const payload = {
      IdNegocio: (idNegocio && parseInt(idNegocio, 10) > 0) ? parseInt(idNegocio, 10) : null,
      NombreCurso: dto.nombreCurso.trim(),
      Descripcion: dto.descripcion ? dto.descripcion.trim() : null,
      Nivel: dto.nivel || null,
      Modalidad: dto.modalidad || null,
      Duracion: dto.duracion || null,
      Horario: dto.horario || null,
      Precio: dto.precio !== undefined && dto.precio !== null ? parseFloat(dto.precio) : null,
      ImagenUrl: imagenUrl,
      VideoUrl: videoUrl,
      AudioUrl: audioUrl,
      CuposDisponibles: dto.cuposDisponibles ? parseInt(dto.cuposDisponibles, 10) : null
    };

    if (payload.IdNegocio) {
      return await api.post(`/Creatividad/negocios/${payload.IdNegocio}/cursos`, payload);
    } else {
      return await api.post('/Creatividad/cursos', payload);
    }
  },

  /**
   * Obtiene la lista de todos los cursos y video clases (independientes y de academias).
   * GET /api/Creatividad/cursos
   */
  async getCursos({ busqueda = '', soloGratis = false, nivel = '' } = {}) {
    try {
      const q = new URLSearchParams();
      if (busqueda) q.append('busqueda', busqueda);
      if (soloGratis) q.append('soloGratis', 'true');
      if (nivel) q.append('nivel', nivel);

      const data = await api.get(`/Creatividad/cursos?${q.toString()}`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn('[creatividadService] Error al cargar cursos:', error.message);
      return [];
    }
  },

  /**
   * Búsqueda predictiva global en Creatividad.
   * GET /api/Creatividad/buscar?termino=...&limite=20
   */
  async buscarGlobal(termino, limite = 20) {
    if (!termino || !termino.trim()) return [];
    try {
      const q = new URLSearchParams({ termino: termino.trim(), limite });
      const data = await api.get(`/Creatividad/buscar?${q.toString()}`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn('[creatividadService] Error en búsqueda global:', error.message);
      return [];
    }
  },

  /**
   * Obtiene negocios por slug de categoría.
   * GET /api/Creatividad/categoria/{slug}?pagina=1&tamPagina=12
   */
  async getPorSlug(slug, pagina = 1, tamPagina = 12) {
    try {
      const data = await api.get(`/Creatividad/categoria/${slug}?pagina=${pagina}&tamPagina=${tamPagina}`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn(`[creatividadService] Error al obtener por slug ${slug}:`, error.message);
      return [];
    }
  }
};
