/**
 * helpers.js — Utilidades reutilizables
 */

/**
 * Selecciona un elemento del DOM de forma segura
 * @param {string} selector
 * @param {Element} [context=document]
 */
export const $ = (selector, context = document) => context.querySelector(selector);

/**
 * Selecciona múltiples elementos del DOM
 */
export const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];

/**
 * Crea un elemento HTML con atributos y contenido
 * @param {string} tag
 * @param {object} [attrs={}]
 * @param {string} [innerHTML='']
 */
export function createElement(tag, attrs = {}, innerHTML = '') {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  el.innerHTML = innerHTML;
  return el;
}

/**
 * Formatea una fecha a locale español
 * @param {string|Date} date
 */
export const formatDate = (date) =>
  new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' }).format(new Date(date));

/**
 * Debounce: retrasa la ejecución de una función
 */
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
