/**
 * authService.js — Servicio de autenticación conectado con AuthController.cs de .NET
 */
import { api } from './api.js';
import { store } from '../store/store.js';

const TOKEN_KEY = 'misostenido_token';
const REFRESH_TOKEN_KEY = 'misostenido_refresh_token';
const USER_KEY = 'misostenido_user';

export const authService = {
  /**
   * Restaura la sesión del usuario al recargar la app
   */
  initAuth() {
    const token = localStorage.getItem(TOKEN_KEY);
    const userJson = localStorage.getItem(USER_KEY);

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson);
        store.setState({
          user,
          isAuthenticated: true,
          token,
        });
      } catch (e) {
        this.logout();
      }
    }
  },

  /**
   * Registrar un nuevo usuario conectando a POST /api/Auth/register
   * @param {Object} data - { fullName, email, password, profileType }
   */
  async register({ fullName, email, password, profileType }) {
    let tipoPerfilNorm = 'INDIVIDUAL';
    if (profileType) {
      const lower = profileType.toLowerCase();
      if (lower.includes('grupo') || lower.includes('banda')) tipoPerfilNorm = 'GRUPO';
      else if (lower.includes('escuela') || lower.includes('academia')) tipoPerfilNorm = 'ESCUELA';
    }

    // DTO exacto que espera RegisterRequestDto en Misostenido-backend:
    // Nombre, Email, Contrasena, TipoPerfil
    const payload = {
      Nombre: fullName ? fullName.trim() : '',
      Email: email ? email.trim() : '',
      Contrasena: password,
      TipoPerfil: tipoPerfilNorm,
    };

    const response = await api.post('/Auth/register', payload);

    if (response && response.accessToken) {
      const user = {
        id: response.idUsuario,
        name: response.nombre,
        email: response.email,
        profileType: response.tipoPerfil,
        role: response.rolNombre,
        photoUrl: response.fotoPerfilUrl,
      };

      this.saveSession(response.accessToken, response.refreshToken, user);
      return { success: true, user, message: response.mensaje };
    }

    throw new Error(response?.mensaje || 'Error al crear la cuenta');
  },

  /**
   * Iniciar Sesión conectando a POST /api/Auth/login
   * @param {Object} credentials - { email, password }
   */
  async login({ email, password }) {
    // DTO exacto que espera LoginRequestDto en Misostenido-backend:
    // public string Email { get; set; }
    // public string Contrasena { get; set; }
    const payload = {
      Email: email.trim(),
      Contrasena: password,
    };

    const response = await api.post('/Auth/login', payload);

    if (response && response.accessToken) {
      const user = {
        id: response.idUsuario,
        name: response.nombre,
        email: response.email,
        profileType: response.tipoPerfil,
        role: response.rolNombre,
        photoUrl: response.fotoPerfilUrl,
      };

      this.saveSession(response.accessToken, response.refreshToken, user);
      return { success: true, user, message: response.mensaje };
    }

    throw new Error(response?.mensaje || 'Error al iniciar sesión');
  },

  /**
   * Guarda el token y usuario en localStorage y store reactivo
   */
  saveSession(accessToken, refreshToken, user) {
    localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    store.setState({
      user,
      token: accessToken,
      isAuthenticated: true,
    });
  },

  /**
   * Cerrar Sesión
   */
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    store.setState({
      user: null,
      token: null,
      isAuthenticated: false,
    });

    window.location.hash = '#/';
  },

  /**
   * Verifica si está autenticado
   */
  isAuthenticated() {
    return !!store.getState().isAuthenticated;
  },

  /**
   * Obtiene datos del usuario logueado
   */
  getCurrentUser() {
    return store.getState().user;
  }
};
