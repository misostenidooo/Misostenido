/**
 * Footer.js — Componente de pie de página global
 */

export const Footer = {
  render(selector) {
    const el = document.querySelector(selector);
    if (!el) return;

    el.innerHTML = `
      <footer class="footer" role="contentinfo">
        <p>&copy; ${new Date().getFullYear()} Misostenido. Todos los derechos reservados.</p>
      </footer>
    `;
  },
};
