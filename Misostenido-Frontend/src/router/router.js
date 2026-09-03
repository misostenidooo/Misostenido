/**
 * router.js — Router SPA para Misostenido con soporte para rutas públicas y protegidas
 */
import { HomePage } from '../pages/home/HomePage.js';
import { LoginPage } from '../pages/login/LoginPage.js';
import { RegisterPage } from '../pages/register/RegisterPage.js';
import { NotFoundPage } from '../pages/notFound/NotFoundPage.js';
import { FeedPage } from '../pages/feed/FeedPage.js';
import { authService } from '../services/authService.js';
import { AuthModal } from '../components/modal/AuthModal.js';

// Mapeo de rutas
const routes = {
  '#/':           { component: HomePage, protected: false, hideLayout: false },
  '#/login':      { component: LoginPage, protected: false, hideLayout: true },
  '#/register':   { component: RegisterPage, protected: false, hideLayout: true },
  '#/feed':       { component: FeedPage, protected: true, hideLayout: false },
  '#/creatividad':{ component: HomePage, protected: true, hideLayout: false },
  '#/contrataciones': { component: HomePage, protected: true, hideLayout: false },
  '#/eventos':    { component: HomePage, protected: true, hideLayout: false },
  '#/404':        { component: NotFoundPage, protected: false, hideLayout: false },
};

function resolveRoute() {
  const outlet = document.querySelector('#page-outlet');
  const navbarOutlet = document.querySelector('#navbar-outlet');
  const footerOutlet = document.querySelector('#footer-outlet');

  const rawHash = window.location.hash || '#/';
  const cleanHash = rawHash.split('?')[0];

  let routeConfig = routes[cleanHash];

  // Si no existe la ruta
  if (!routeConfig) {
    routeConfig = routes['#/404'];
  }

  // Verificación de protección de ruta
  if (routeConfig.protected && !authService.isAuthenticated()) {
    // Redirigir suavemente a home y disparar el modal de aviso
    window.location.hash = '#/';
    setTimeout(() => {
      AuthModal.show('Autenticación Requerida', 'Debes iniciar sesión para ingresar a esta sección.');
    }, 100);
    return;
  }

  // Manejo de visibilidad de Navbar y Footer (se ocultan en login y register según Figma)
  if (routeConfig.hideLayout) {
    if (navbarOutlet) navbarOutlet.style.display = 'none';
    if (footerOutlet) footerOutlet.style.display = 'none';
    if (outlet) outlet.style.paddingTop = '0';
  } else {
    if (navbarOutlet) navbarOutlet.style.display = 'block';
    if (footerOutlet) footerOutlet.style.display = 'block';
    if (outlet) outlet.style.paddingTop = '0';
  }

  // Renderizar la página
  if (outlet) {
    outlet.innerHTML = '';
    outlet.appendChild(routeConfig.component.render());
  }

  window.scrollTo(0, 0);
}

export const router = {
  init() {
    window.addEventListener('hashchange', resolveRoute);
    window.addEventListener('load', resolveRoute);
    resolveRoute();
  },

  navigate(path) {
    window.location.hash = path;
  },
};
