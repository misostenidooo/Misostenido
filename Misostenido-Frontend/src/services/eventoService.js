/**
 * eventoService.js — Servicio de Eventos conectado a la API .NET
 * Endpoints: /api/Evento/...
 * DTOs usados: CrearEventoDto, ActualizarEventoDto, FiltrosEventoDto,
 *              AgregarEventoMediaDto, EventoResumenDto, EventoDetalleDto
 */
import { api } from './api.js';
import { authService } from './authService.js';
import { storageService } from './storageService.js';

export const eventoService = {

  /**
   * Obtiene la lista paginada de eventos con filtros opcionales.
   * GET /api/Evento?busqueda=&tipoEvento=&ubicacion=&soloProximos=true&pagina=1&tamanoPagina=10
   */
  async getEventos({ busqueda = '', tipoEvento = '', ubicacion = '', soloProximos = false, pagina = 1, tamanoPagina = 12 } = {}) {
    try {
      const q = new URLSearchParams();
      if (busqueda) q.append('busqueda', busqueda);
      if (tipoEvento) q.append('tipoEvento', tipoEvento);
      if (ubicacion) q.append('ubicacion', ubicacion);
      q.append('soloProximos', soloProximos);
      q.append('pagina', pagina);
      q.append('tamanoPagina', tamanoPagina);

      const data = await api.get(`/Evento?${q.toString()}`);
      const lista = Array.isArray(data) ? data : (data?.eventos || []);
      return { eventos: lista, isApiOnline: true };
    } catch (error) {
      console.warn('[eventoService] Error al cargar eventos:', error.message);
      return { eventos: [], isApiOnline: false, error: error.message };
    }
  },

  /**
   * Obtiene el detalle completo de un evento con su multimedia adjunta.
   * GET /api/Evento/{idEvento}
   */
  async getEventoDetalle(idEvento) {
    try {
      return await api.get(`/Evento/${idEvento}`);
    } catch (error) {
      console.warn(`[eventoService] Error al cargar evento ${idEvento}:`, error.message);
      return null;
    }
  },

  /**
   * Crea un nuevo evento y adjunta archivos multimedia.
   * POST /api/Evento
   * POST /api/Evento/{idEvento}/media  (para cada archivo)
   */
  async crearEvento({ titulo, descripcion, tipoEvento, fechaEvento, ubicacion, infoInscripcion, files = [] }) {
    if (!authService.isAuthenticated()) {
      throw new Error('Debes iniciar sesión para crear un evento.');
    }

    const resEvento = await api.post('/Evento', {
      Titulo: titulo.trim(),
      Descripcion: descripcion ? descripcion.trim() : null,
      TipoEvento: tipoEvento || null,
      FechaEvento: new Date(fechaEvento).toISOString(),
      Ubicacion: ubicacion ? ubicacion.trim() : null,
      InfoInscripcion: infoInscripcion ? infoInscripcion.trim() : null,
    });

    const idEvento = resEvento?.id ?? resEvento?.Id ?? resEvento?.idEvento ?? resEvento?.IdEvento;

    // Subir archivos multimedia (fotos/videos) a Storage y asociarlos al evento
    if (idEvento && files && files.length > 0) {
      for (const file of files) {
        try {
          const resUp = await storageService.uploadFile(file);
          if (resUp && resUp.url) {
            await api.post(`/Evento/${idEvento}/media`, {
              Tipo: resUp.tipo || 'FOTO',
              Url: resUp.url,
              Descripcion: file.name,
            });
          }
        } catch (e) {
          console.error('[eventoService] Error al adjuntar media al evento:', e);
        }
      }
    }

    return { ...resEvento, idEvento };
  },

  /**
   * Actualiza los datos de un evento propio.
   * PUT /api/Evento/{idEvento}
   */
  async actualizarEvento(idEvento, { titulo, descripcion, tipoEvento, fechaEvento, ubicacion, infoInscripcion }) {
    if (!authService.isAuthenticated()) {
      throw new Error('Debes iniciar sesión para editar un evento.');
    }
    return await api.put(`/Evento/${idEvento}`, {
      Titulo: titulo.trim(),
      Descripcion: descripcion ? descripcion.trim() : null,
      TipoEvento: tipoEvento || null,
      FechaEvento: new Date(fechaEvento).toISOString(),
      Ubicacion: ubicacion ? ubicacion.trim() : null,
      InfoInscripcion: infoInscripcion ? infoInscripcion.trim() : null,
    });
  },

  /**
   * Elimina un evento.
   * DELETE /api/Evento/{idEvento}
   */
  async eliminarEvento(idEvento) {
    if (!authService.isAuthenticated()) {
      throw new Error('Debes iniciar sesión para eliminar un evento.');
    }
    return await api.delete(`/Evento/${idEvento}`);
  },

  /**
   * Adjunta una foto o video a un evento.
   * POST /api/Evento/{idEvento}/media
   */
  async agregarMedia(idEvento, { tipo, url, descripcion }) {
    return await api.post(`/Evento/${idEvento}/media`, {
      Tipo: tipo,
      Url: url,
      Descripcion: descripcion || null,
    });
  },

  /**
   * Elimina un archivo multimedia de un evento.
   * DELETE /api/Evento/media/{idMedia}
   */
  async eliminarMedia(idMedia) {
    return await api.delete(`/Evento/media/${idMedia}`);
  },
};
