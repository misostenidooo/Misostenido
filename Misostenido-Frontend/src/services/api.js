/**
 * api.js — Cliente HTTP conectado a Misostenido.Api (.NET Backend)
 */

// URL de la API en Azure
const AZURE_API_URL = 'https://misostenidoapi20261008234533-g4f9e9acb0fze7as.mexicocentral-01.azurewebsites.net/api';
const BASE_URL = window.__API_URL__ || AZURE_API_URL;

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
    // Si la API no responde o no hay conexión de red
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error(`No se pudo conectar con el servidor de la API (${BASE_URL}). Verifica la conexión con Azure.`);
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
      throw new Error(`No se pudo conectar con el servidor de la API (${BASE_URL}).`);
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

