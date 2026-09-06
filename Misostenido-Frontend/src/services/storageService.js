/**
 * storageService.js — Servicio universal de almacenamiento multimedia
 * Soporta AUDIO, VIDEO e IMÁGENES sin tarjeta de crédito.
 * 
 * Proveedores:
 * 1. Supabase Storage (Audio + Video + Fotos — 1GB gratis, sin tarjeta, disponible en Nicaragua)
 * 2. ImgBB (Fotos ilimitadas — CDN global rápido, sin tarjeta)
 * 3. Backend Local (.NET /api/Upload — Guarda en wwwroot/uploads/, 0 dependencias)
 */
import { api } from './api.js';

export const storageService = {
  // Configuración de Supabase del usuario
  SUPABASE_URL: 'https://uaglntzddpcowvuajmae.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZ2xudHpkZHBjb3d2dWFqbWFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzODk2MDUsImV4cCI6MjEwMzk2NTYwNX0.dwKrD3qcmrUDpyo4xWO7obIMQotb_3ATSREytzyMNrA',
  SUPABASE_BUCKET: 'misostenido-media', // Bucket público creado por el usuario

  // API Key pública de ImgBB para imágenes
  IMGBB_API_KEY: '6d207e02198a847aa5a0a0a33ea25e3b',

  /**
   * Sube cualquier archivo (Audio, Video o Foto) automáticamente
   * @param {File} file 
   * @returns {Promise<{ url: string, tipo: 'FOTO' | 'VIDEO' | 'AUDIO', nombreOriginal?: string }>}
   */
  async uploadFile(file) {
    const isVideo = file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov|mkv|avi)$/i);
    const isAudio = file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|ogg|m4a|aac|flac)$/i);
    const tipo = isVideo ? 'VIDEO' : (isAudio ? 'AUDIO' : 'FOTO');

    // 1. Si Supabase está configurado, sube cualquier formato a Supabase Storage
    if (this.SUPABASE_URL && this.SUPABASE_ANON_KEY) {
      try {
        const res = await this.uploadToSupabase(file, tipo);
        return { url: res.url, tipo };
      } catch (err) {
        console.warn('[storageService] Error en Supabase, intentando fallback:', err.message);
      }
    }

    // 2. Si es una FOTO, intentamos ImgBB primero (CDN global gratis)
    if (tipo === 'FOTO' && this.IMGBB_API_KEY) {
      try {
        const res = await this.uploadToImgBB(file);
        return { url: res.url, tipo: 'FOTO' };
      } catch (err) {
        console.warn('[storageService] Error en ImgBB, intentando fallback al backend local:', err.message);
      }
    }

    // 3. Fallback garantizado: Backend Local (.NET /api/Upload)
    // Funciona para AUDIO, VIDEO y FOTOS sin ninguna tarjeta ni servicio externo
    return await this.uploadToLocalBackend(file, tipo);
  },

  /**
   * Sube imágenes a ImgBB (Gratis, sin tarjeta)
   */
  async uploadToImgBB(file) {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${this.IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (data && data.success && data.data) {
      return {
        url: data.data.url || data.data.display_url,
        tipo: 'FOTO'
      };
    }

    throw new Error(data?.error?.message || 'Error al subir imagen a ImgBB');
  },

  /**
   * Sube Audios, Videos o Fotos a Supabase Storage (1GB gratis, sin tarjeta)
   */
  async uploadToSupabase(file, tipo) {
    const carpeta = tipo.toLowerCase();
    const ext = file.name.split('.').pop()?.toLowerCase() || 'dat';
    const fileName = `${carpeta}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;

    let contentType = file.type;
    if (!contentType || contentType === 'application/octet-stream') {
      if (ext === 'mp3') contentType = 'audio/mpeg';
      else if (ext === 'wav') contentType = 'audio/wav';
      else if (ext === 'ogg') contentType = 'audio/ogg';
      else if (ext === 'm4a') contentType = 'audio/mp4';
      else if (ext === 'mp4') contentType = 'video/mp4';
      else if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
      else if (ext === 'png') contentType = 'image/png';
      else if (ext === 'webp') contentType = 'image/webp';
    }

    const endpoint = `${this.SUPABASE_URL}/storage/v1/object/${this.SUPABASE_BUCKET}/${fileName}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
        'apikey': this.SUPABASE_ANON_KEY,
        'Content-Type': contentType || 'application/octet-stream',
        'x-upsert': 'true',
      },
      body: file
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `Error ${response.status} en Supabase Storage`);
    }

    // URL pública directa de Supabase
    const publicUrl = `${this.SUPABASE_URL}/storage/v1/object/public/${this.SUPABASE_BUCKET}/${fileName}`;
    return { url: publicUrl, tipo };
  },

  /**
   * Sube Audio, Video o Foto al backend propio de Misostenido (/api/Upload)
   * Guarda en wwwroot/uploads/ y genera el link automáticamente
   */
  async uploadToLocalBackend(file, tipo) {
    const formData = new FormData();
    formData.append('archivos', file);

    const res = await api.upload('/Upload', formData);
    if (res && res.archivos && res.archivos.length > 0) {
      return {
        url: res.archivos[0].url,
        tipo: res.archivos[0].tipo || tipo
      };
    } else if (res && res.url) {
      return {
        url: res.url,
        tipo: res.tipo || tipo
      };
    }

    throw new Error(res?.mensaje || 'Error al subir archivo al servidor');
  }
};
