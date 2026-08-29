/**
 * main.js — Entry point de la aplicación SPA
 * Inicializa el router y monta los componentes globales
 */

import { router } from './router/router.js';
import { Navbar } from './components/navbar/Navbar.js';
import { Footer } from './components/footer/Footer.js';

// Montar componentes globales
Navbar.render('#navbar-outlet');
Footer.render('#footer-outlet');

// Iniciar el router
router.init();
