/**
 * router.js — Router SPA basado en hash (#)
 * Maneja la navegación sin recargar la página
 */

import { HomePage } from '../pages/home/HomePage.js';
import { AboutPage } from '../pages/about/AboutPage.js';
import { NotFoundPage } from '../pages/notFound/NotFoundPage.js';

const routes = {
  '#/':       HomePage,
  '#/about':  AboutPage,
  '#/404':    NotFoundPage,
};

const outlet = document.querySelector('#page-outlet');

function resolveRoute() {
  const hash = window.location.hash || '#/';
  const Page = routes[hash] || NotFoundPage;
  outlet.innerHTML = '';
  outlet.appendChild(Page.render());
}

export const router = {
  init() {
    window.addEventListener('hashchange', resolveRoute);
    window.addEventListener('load', resolveRoute);
  },

  navigate(path) {
    window.location.hash = path;
  },
};
