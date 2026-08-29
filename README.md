# Misostenido — Frontend

Aplicación web SPA (Single Page Application) construida con **HTML, CSS y JavaScript Vanilla**, arquitectura por componentes.

---

## 📁 Estructura de carpetas

```
Misostenido-main/
├── index.html                  # Entry point HTML
├── public/                     # Assets estáticos (favicon, og-image, etc.)
└── src/
    ├── main.js                 # Bootstrap: monta componentes globales e inicia el router
    │
    ├── router/
    │   └── router.js           # SPA Router basado en hash (#)
    │
    ├── pages/                  # Una carpeta por página/vista
    │   ├── home/
    │   │   └── HomePage.js
    │   ├── about/
    │   │   └── AboutPage.js
    │   └── notFound/
    │       └── NotFoundPage.js
    │
    ├── components/             # Componentes reutilizables
    │   ├── navbar/
    │   │   ├── Navbar.js
    │   │   └── navbar.css
    │   ├── footer/
    │   │   ├── Footer.js
    │   │   └── footer.css
    │   └── modal/
    │       ├── Modal.js
    │       └── modal.css
    │
    ├── services/
    │   └── api.js              # HTTP client centralizado (fetch wrapper)
    │
    ├── store/
    │   └── store.js            # Estado global reactivo (patrón Observer)
    │
    ├── utils/
    │   └── helpers.js          # Funciones utilitarias reutilizables
    │
    ├── assets/
    │   ├── images/
    │   ├── icons/
    │   └── fonts/
    │
    └── styles/
        ├── base/
        │   ├── reset.css       # Normaliza estilos del navegador
        │   ├── variables.css   # Tokens de diseño (colores, fuentes, espaciado)
        │   └── global.css      # Estilos globales de la app
        ├── themes/
        │   └── dark.css        # Tema oscuro
        └── components/         # CSS específico por componente
```

---

## 🏛️ Convenciones de código limpio

| Elemento      | Convención               | Ejemplo                       |
|---------------|--------------------------|-------------------------------|
| Archivos JS   | PascalCase (componentes) | `Navbar.js`, `HomePage.js`    |
| Archivos JS   | camelCase (utilidades)   | `helpers.js`, `api.js`        |
| Archivos CSS  | kebab-case               | `navbar.css`, `reset.css`     |
| Carpetas      | camelCase                | `notFound/`, `services/`      |
| Variables CSS | kebab-case con prefijo   | `--color-primary`             |
| Clases CSS    | BEM                      | `.navbar__logo`, `.page--home`|

---

## 🔌 Conexión con la API

Edita la URL base en `src/services/api.js`:

```js
const BASE_URL = 'https://tu-api.com/api';
```

Úsala en cualquier página o componente:

```js
import { api } from '../../services/api.js';

const data = await api.get('/endpoint');
```

---

## 🚀 Cómo agregar una nueva página

1. Crea la carpeta `src/pages/miPagina/`
2. Crea `MiPagina.js` con el método `render()` que retorne un nodo DOM
3. Registra la ruta en `src/router/router.js`

## 🧩 Cómo agregar un nuevo componente

1. Crea la carpeta `src/components/miComponente/`
2. Crea `MiComponente.js` + `miComponente.css`
3. Importa y úsalo donde lo necesites
