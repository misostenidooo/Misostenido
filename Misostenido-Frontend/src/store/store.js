/**
 * store.js — Mini store reactivo (estado global)
 * Patrón Observer para compartir estado entre componentes
 */

function createStore(initialState = {}) {
  let state = { ...initialState };
  const subscribers = [];

  return {
    getState: () => ({ ...state }),

    setState(partial) {
      state = { ...state, ...partial };
      subscribers.forEach(fn => fn(state));
    },

    subscribe(fn) {
      subscribers.push(fn);
      return () => {
        const i = subscribers.indexOf(fn);
        if (i > -1) subscribers.splice(i, 1);
      };
    },
  };
}

// Estado global de la aplicación
export const store = createStore({
  user: null,
  isAuthenticated: false,
  theme: 'dark',
});
