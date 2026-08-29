/**
 * api.js — Servicio base para consumir la API REST
 * Centraliza todos los fetch y manejo de errores HTTP
 */

const BASE_URL = import.meta.env?.VITE_API_URL ?? 'http://localhost:3000/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Adjuntar token si existe
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Error en la petición');
  }

  return response.json();
}

export const api = {
  get:    (endpoint, opts = {}) => request(endpoint, { method: 'GET', ...opts }),
  post:   (endpoint, body, opts = {}) => request(endpoint, { method: 'POST',   body: JSON.stringify(body), ...opts }),
  put:    (endpoint, body, opts = {}) => request(endpoint, { method: 'PUT',    body: JSON.stringify(body), ...opts }),
  patch:  (endpoint, body, opts = {}) => request(endpoint, { method: 'PATCH',  body: JSON.stringify(body), ...opts }),
  delete: (endpoint, opts = {}) => request(endpoint, { method: 'DELETE', ...opts }),
};
