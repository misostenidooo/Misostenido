/**
 * homeService.js — Servicio para obtener información real desde Misostenido.Api
 */
import { api } from './api.js';

export const homeService = {
  /**
   * Obtiene los artistas destacados, publicaciones recientes y eventos próximos
   * desde GET /api/inicio/destacados
   */
  async getDestacados() {
    try {
      const data = await api.get('/inicio/destacados');
      return {
        artistasDestacados: data?.artistasDestacados || [],
        publicacionesRecientes: data?.publicacionesRecientes || [],
        eventosProximos: data?.eventosProximos || []
      };
    } catch (err) {
      console.error('Error al obtener destacados:', err);
      return { artistasDestacados: [], publicacionesRecientes: [], eventosProximos: [] };
    }
  },

  /**
   * Obtiene las ofertas de servicio de contrataciones desde GET /api/Contratacion/ofertas
   */
  async getOfertas() {
    try {
      const data = await api.get('/Contratacion/ofertas');
      return Array.isArray(data) ? data : (data?.items || []);
    } catch (err) {
      console.error('Error al obtener ofertas:', err);
      return [];
    }
  }
};
