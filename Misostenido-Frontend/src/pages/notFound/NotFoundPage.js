/**
 * NotFoundPage.js — Página 404
 */

export const NotFoundPage = {
  render() {
    const section = document.createElement('section');
    section.classList.add('page', 'page--404');
    section.innerHTML = `
      <h1>404 — Página no encontrada</h1>
      <a href="#/">Volver al inicio</a>
    `;
    return section;
  },
};
