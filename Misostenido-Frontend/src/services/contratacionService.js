/**
 * contratacionService.js — Servicio de Oportunidades y Contrataciones conectado a la API .NET
 * Endpoints: /api/Contratacion/...
 */
import { api } from './api.js';
import { authService } from './authService.js';
import { storageService } from './storageService.js';

export const contratacionService = {
  /**
   * Obtiene la lista de ofertas de servicios musicales con filtros opcionales
   */
  async getOfertas({ busqueda = '', generoMusical = '', ubicacion = '', tarifaMax = null, pagina = 1, tamanoPagina = 12 } = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (busqueda) queryParams.append('busqueda', busqueda);
      if (generoMusical) queryParams.append('generoMusical', generoMusical);
      if (ubicacion) queryParams.append('ubicacion', ubicacion);
      if (tarifaMax) queryParams.append('tarifaMax', tarifaMax);
      queryParams.append('pagina', pagina);
      queryParams.append('tamanoPagina', tamanoPagina);

      const data = await api.get(`/Contratacion/ofertas?${queryParams.toString()}`);
      const lista = Array.isArray(data) ? data : (data?.ofertas || []);
      return { ofertas: lista, isApiOnline: true };
    } catch (error) {
      console.warn('[contratacionService] Error al cargar ofertas:', error.message);
      return { ofertas: [], isApiOnline: false, error: error.message };
    }
  },

  /**
   * Obtiene el detalle completo de una oferta de servicio
   */
  async getOfertaDetalle(idOferta) {
    try {
      return await api.get(`/Contratacion/ofertas/${idOferta}`);
    } catch (error) {
      console.warn(`[contratacionService] Error al cargar oferta ${idOferta}:`, error.message);
      return null;
    }
  },

  /**
   * Crea una nueva oferta de servicios musicales con subida de multimedia a Supabase
   */
  async crearOferta({ titulo, descripcion, generoMusical, tarifaAproximada, ubicacion, files = [] }) {
    if (!authService.isAuthenticated()) {
      throw new Error('Debes iniciar sesión para publicar una oferta de servicio.');
    }

    // 1. Crear oferta base
    const resOferta = await api.post('/Contratacion/ofertas', {
      Titulo: titulo.trim(),
      Descripcion: descripcion ? descripcion.trim() : null,
      GeneroMusical: generoMusical || 'Varios',
      TarifaAproximada: tarifaAproximada ? parseFloat(tarifaAproximada) : null,
      Ubicacion: ubicacion ? ubicacion.trim() : 'Nicaragua'
    });

    const idOferta = resOferta?.id ?? resOferta?.Id ?? resOferta?.idOfertaServicio ?? resOferta?.IdOfertaServicio;

    // 2. Subir archivos multimedia (Audio, Video, Fotos) y asociarlos a la oferta
    if (idOferta && files && files.length > 0) {
      for (const file of files) {
        try {
          const resUp = await storageService.uploadFile(file);
          if (resUp && resUp.url) {
            await api.post('/Contratacion/media', {
              IdOferta: parseInt(idOferta, 10),
              Tipo: resUp.tipo || 'FOTO',
              Url: resUp.url,
              Descripcion: file.name
            });
          }
        } catch (e) {
          console.error('[contratacionService] Error al adjuntar media a la oferta:', e);
        }
      }
    }

    return resOferta;
  },

  /**
   * Obtiene la lista de solicitudes de eventos (contratantes buscando artistas)
   */
  async getSolicitudes({ busqueda = '', ubicacion = '', presupuestoMin = null, pagina = 1, tamanoPagina = 12 } = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (busqueda) queryParams.append('busqueda', busqueda);
      if (ubicacion) queryParams.append('ubicacion', ubicacion);
      if (presupuestoMin) queryParams.append('presupuestoMin', presupuestoMin);
      queryParams.append('pagina', pagina);
      queryParams.append('tamanoPagina', tamanoPagina);

      const data = await api.get(`/Contratacion/solicitudes?${queryParams.toString()}`);
      const lista = Array.isArray(data) ? data : (data?.solicitudes || []);
      return { solicitudes: lista, isApiOnline: true };
    } catch (error) {
      console.warn('[contratacionService] Error al cargar solicitudes:', error.message);
      return { solicitudes: [], isApiOnline: false, error: error.message };
    }
  },

  /**
   * Obtiene el detalle completo de una solicitud
   */
  async getSolicitudDetalle(idSolicitud) {
    try {
      return await api.get(`/Contratacion/solicitudes/${idSolicitud}`);
    } catch (error) {
      console.warn(`[contratacionService] Error al cargar solicitud ${idSolicitud}:`, error.message);
      return null;
    }
  },

  /**
   * Crea una nueva solicitud de contratación para eventos
   */
  async crearSolicitud({ titulo, descripcion, fechaEvento, presupuesto, ubicacion, files = [] }) {
    if (!authService.isAuthenticated()) {
      throw new Error('Debes iniciar sesión para publicar una solicitud.');
    }

    const resSol = await api.post('/Contratacion/solicitudes', {
      Titulo: titulo.trim(),
      Descripcion: descripcion ? descripcion.trim() : null,
      FechaEvento: fechaEvento ? new Date(fechaEvento).toISOString() : null,
      Presupuesto: presupuesto ? parseFloat(presupuesto) : null,
      Ubicacion: ubicacion ? ubicacion.trim() : 'Nicaragua'
    });

    const idSolicitud = resSol?.id ?? resSol?.Id ?? resSol?.idSolicitudContratacion ?? resSol?.IdSolicitudContratacion;

    if (idSolicitud && files && files.length > 0) {
      for (const file of files) {
        try {
          const resUp = await storageService.uploadFile(file);
          if (resUp && resUp.url) {
            await api.post('/Contratacion/media', {
              IdSolicitud: parseInt(idSolicitud, 10),
              Tipo: resUp.tipo || 'FOTO',
              Url: resUp.url,
              Descripcion: file.name
            });
          }
        } catch (e) {
          console.error('[contratacionService] Error al adjuntar media a la solicitud:', e);
        }
      }
    }

    return resSol;
  },

  /**
   * Envía una propuesta o solicitud de contratación canalizada por gestor
   */
  async solicitarContratacion({ idOferta = null, idSolicitud = null, mensaje }) {
    if (!authService.isAuthenticated()) {
      throw new Error('Debes iniciar sesión para enviar una solicitud.');
    }

    return await api.post('/Contratacion/postulaciones', {
      IdOferta: idOferta ? parseInt(idOferta, 10) : null,
      IdSolicitud: idSolicitud ? parseInt(idSolicitud, 10) : null,
      Mensaje: mensaje ? mensaje.trim() : 'Hola, solicito intermediación para propuesta musical.'
    });
  },

  /**
   * Obtiene las solicitudes de intermediación / postulaciones activas
   */
  async getPostulaciones({ idOferta = null, idSolicitud = null, idEmisor = null } = {}) {
    if (!authService.isAuthenticated()) return [];
    try {
      const q = new URLSearchParams();
      if (idOferta) q.append('idOferta', idOferta);
      if (idSolicitud) q.append('idSolicitud', idSolicitud);
      if (idEmisor) q.append('idEmisor', idEmisor);
      const queryStr = q.toString();
      const url = `/Contratacion/postulaciones${queryStr ? `?${queryStr}` : ''}`;
      const data = await api.get(url);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn('[contratacionService] Error al obtener postulaciones:', err.message);
      return [];
    }
  },

  /**
   * Actualiza el estado de la solicitud en el proceso de intermediación
   * Estados: EN_REVISION | COORDINACION | CONCRETADA | RECHAZADA | CERRADA | CANCELADA
   */
  async actualizarEstadoPostulacion(idPostulacion, nuevoEstado) {
    if (!authService.isAuthenticated()) {
      throw new Error('Debes iniciar sesión para gestionar la solicitud.');
    }
    return await api.put(`/Contratacion/postulaciones/${idPostulacion}/responder`, {
      NuevoEstado: nuevoEstado
    });
  },

  /**
   * Envía un reporte formal sobre una oferta o solicitud que incumpla la normativa
   */
  async reportarPublicacion({ tipo, idRegistro, motivo, descripcion }) {
    if (!authService.isAuthenticated()) {
      throw new Error('Debes iniciar sesión para enviar un reporte.');
    }
    return await api.post('/Admin/reportes', {
      TipoContenido: tipo,
      IdRegistro: parseInt(idRegistro, 10),
      Motivo: motivo,
      Descripcion: descripcion
    });
  },

  /**
   * Obtiene todos los mensajes en tiempo real de una postulación
   */
  async getMensajes(idPostulacion) {
    if (!authService.isAuthenticated()) return [];
    try {
      const data = await api.get(`/Contratacion/postulaciones/${idPostulacion}/mensajes`);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn(`[contratacionService] Error al obtener mensajes para postulación ${idPostulacion}:`, err.message);
      return [];
    }
  },

  /**
   * Envía un mensaje real al chat de negociación de la postulación
   */
  async enviarMensaje({ idPostulacion, contenido, tipoMensaje = 'TEXTO', archivoUrl = null }) {
    if (!authService.isAuthenticated()) {
      throw new Error('Debes iniciar sesión para enviar mensajes.');
    }
    return await api.post(`/Contratacion/postulaciones/${idPostulacion}/mensajes`, {
      Contenido: contenido.trim(),
      TipoMensaje: tipoMensaje,
      ArchivoUrl: archivoUrl
    });
  },

  /**
   * Obtiene los datos del acuerdo o pre-contrato digital de una postulación
   */
  async getAcuerdo(idPostulacion) {
    if (!authService.isAuthenticated()) return null;
    try {
      return await api.get(`/Contratacion/postulaciones/${idPostulacion}/acuerdo`);
    } catch (err) {
      console.warn(`[contratacionService] Error al obtener acuerdo para postulación ${idPostulacion}:`, err.message);
      return null;
    }
  },

  /**
   * Guarda o actualiza el acuerdo digital y firmas de la postulación
   */
  async guardarAcuerdo(idPostulacion, { honorariosAcordados, fechaCompromiso, clausulasEspeciales, firmaDigitalContratante, firmaDigitalArtista, estadoAcuerdo = 'BORRADOR' }) {
    if (!authService.isAuthenticated()) {
      throw new Error('Debes iniciar sesión para formalizar acuerdos.');
    }
    return await api.put(`/Contratacion/postulaciones/${idPostulacion}/acuerdo`, {
      HonorariosAcordados: honorariosAcordados ? parseFloat(honorariosAcordados) : null,
      FechaCompromiso: fechaCompromiso ? new Date(fechaCompromiso).toISOString() : null,
      ClausulasEspeciales: clausulasEspeciales ? clausulasEspeciales.trim() : null,
      FirmaDigitalContratante: firmaDigitalContratante ? firmaDigitalContratante.trim() : null,
      FirmaDigitalArtista: firmaDigitalArtista ? firmaDigitalArtista.trim() : null,
      EstadoAcuerdo: estadoAcuerdo
    });
  },

  /**
   * Cambia el estado de una solicitud (ej. abierta o cerrada/asignada)
   */
  async cambiarEstadoSolicitud(idSolicitud, abierta) {
    if (!authService.isAuthenticated()) return null;
    return await api.put(`/Contratacion/solicitudes/${idSolicitud}/estado`, { Abierta: abierta });
  },

  /**
   * Cambia el estado de una oferta (ej. disponible o pausada)
   */
  async cambiarEstadoOferta(idOferta, disponible) {
    if (!authService.isAuthenticated()) return null;
    return await api.put(`/Contratacion/ofertas/${idOferta}/estado`, { Disponible: disponible });
  }
};

