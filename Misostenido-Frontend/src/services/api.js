/**
 * api.js — Cliente HTTP conectado a Misostenido.Api (.NET Backend)
 */

// Puerto por defecto de Misostenido.Api en .NET (launchSettings: http://localhost:5180)
const BASE_URL = window.__API_URL__ || 'http://localhost:5180/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers,
  };

  // Si existe token JWT guardado, se envía en el header Authorization
  const token = localStorage.getItem('misostenido_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.mensaje || data?.message || data?.error || `Error ${response.status}: ${response.statusText}`;
      const err = new Error(errorMsg);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (error) {
    // Si la API no está encendida o no hay conexión de red
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('No se pudo conectar con el servidor de la API (http://localhost:5180). Verifica que el backend esté en ejecución.');
    }
    throw error;
  }
}

async function upload(endpoint, formData) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {};

  const token = localStorage.getItem('misostenido_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.mensaje || data?.message || data?.error || `Error ${response.status}: ${response.statusText}`;
      const err = new Error(errorMsg);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('No se pudo conectar con el servidor de la API (http://localhost:5180).');
    }
    throw error;
  }
}

export const api = {
  get:    (endpoint, opts = {}) => request(endpoint, { method: 'GET', ...opts }),
  post:   (endpoint, body, opts = {}) => request(endpoint, { method: 'POST', body: JSON.stringify(body), ...opts }),
  put:    (endpoint, body, opts = {}) => request(endpoint, { method: 'PUT', body: JSON.stringify(body), ...opts }),
  delete: (endpoint, opts = {}) => request(endpoint, { method: 'DELETE', ...opts }),
  upload: (endpoint, formData) => upload(endpoint, formData),
  BASE_URL,
};

