/**
 * AboutPage.js — Página Acerca de
 */

export const AboutPage = {
  render() {
    const section = document.createElement('section');
    section.classList.add('page', 'page--about');
    section.innerHTML = `
      <h1>Acerca de Misostenido</h1>
      <p>Conoce más sobre nuestro proyecto.</p>
    `;
    return section;
  },
};
