/**
 * Navbar.js — Componente de navegación global
 * Se monta una sola vez en #navbar-outlet
 */

export const Navbar = {
  render(selector) {
    const el = document.querySelector(selector);
    if (!el) return;

    el.innerHTML = `
      <nav class="navbar" role="navigation" aria-label="Navegación principal">
        <a class="navbar__logo" href="#/">Misostenido</a>
        <ul class="navbar__links">
          <li><a href="#/">Inicio</a></li>
          <li><a href="#/about">Acerca de</a></li>
        </ul>
      </nav>
    `;
  },
};
