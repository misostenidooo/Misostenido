/**
 * HomePage.js — Página principal
 * Cada página expone un método render() que retorna un nodo DOM
 */

export const HomePage = {
  render() {
    const section = document.createElement('section');
    section.classList.add('page', 'page--home');
    section.innerHTML = `
      <h1>Bienvenido a Misostenido</h1>
      <p>Tu plataforma musical favorita.</p>
    `;
    return section;
  },
};
