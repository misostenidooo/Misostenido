/**
 * main.js — Bootstrap de la SPA Misostenido
 */
import { router } from './router/router.js';
import { Navbar } from './components/navbar/Navbar.js';
import { Footer } from './components/footer/Footer.js';
import { authService } from './services/authService.js';

// 1. Inicializar sesión previa guardada en localStorage
authService.initAuth();

// 2. Renderizar componentes globales
Navbar.render('#navbar-outlet');
Footer.render('#footer-outlet');

// 3. Inicializar enrutador
router.init();
