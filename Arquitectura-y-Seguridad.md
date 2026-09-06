# Arquitectura de Software — MiSostenido

**Proyecto:** MiSostenido — Plataforma Integral para Músicos y Artistas
**Grupo:** Código Da Vinci — Hackathon 2026

---

## Tipo de Arquitectura

- **Backend:** Arquitectura en capas con patrón MVC (Model–View–Controller).
- **Frontend:** Single Page Application (SPA) basada en módulos independientes con separación entre Presentación, Servicios y Estado.
- **Estilo de comunicación:** API RESTful (HTTP / JSON).
- **Despliegue:** Cliente–Servidor (Frontend Web ↔ API Backend .NET ↔ Base de Datos SQL Server + Supabase Cloud Storage).
- **Tecnologías principales:**
  - Backend: ASP.NET Core 9 (C#), SQL Server, Stored Procedures
  - Frontend: HTML5, JavaScript ES6+ (Módulos nativos), CSS3 Vanilla
  - Almacenamiento cloud: Supabase Storage (audio, video, imágenes)

---

## Objetivo de la Arquitectura

Proveer una estructura modular, mantenible y reproducible que permita:

- Separar responsabilidades (presentación, negocio, datos).
- Facilitar pruebas unitarias e integración continua.
- Entregar un prototipo evaluable con endpoints documentados vía Swagger, demo web y almacenamiento multimedia reproducible.
- Garantizar la seguridad de los datos del usuario mediante autenticación JWT y encriptación BCrypt.

---

## Capas Principales y Responsabilidades

### Backend — ASP.NET Core 9 (Arquitectura en Capas + MVC)

#### 1. Capa de Presentación (Misostenido.Api / Controllers)

- **Ubicación:** `Misostenido-backend/Misostenido.Api/Controllers/`
- **Función:** Exponer los endpoints REST de la plataforma.
- **Endpoints disponibles:**

| Controlador | Ruta Base | Descripción |
| :--- | :--- | :--- |
| `AuthController` | `/api/Auth` | Registro, login, refresh token, logout, recuperación de contraseña |
| `UsuarioController` | `/api/Usuario` | Perfil de usuario, edición, seguidores, configuración |
| `FeedController` | `/api/Feed` | Publicaciones, me gusta, comentarios, carrusel multimedia |
| `CreatividadController` | `/api/Creatividad` | Portafolios creativos, obras, audios, demos |
| `ContratacionController` | `/api/Contratacion` | Ofertas laborales, solicitudes, postulaciones |
| `EventoController` | `/api/Evento` | Creación y consulta de eventos culturales |
| `SocialController` | `/api/Social` | Seguir/dejar de seguir, red de conexiones |
| `AdminController` | `/api/Admin` | Estadísticas, reportes de contenido, gestión de usuarios, auditoría |
| `UploadController` | `/api/Upload` | Subida de archivos multimedia (respaldo local) |
| `InicioController` | `/api/Inicio` | Datos del inicio / dashboard del usuario |

- **Responsabilidades:** Recibir y validar solicitudes HTTP, proteger rutas con `[Authorize]` y roles, delegar lógica a la capa de servicios y devolver respuestas JSON estandarizadas.
- La cadena de conexión a la base de datos está definida en `Misostenido.Api/appsettings.json`. Los servicios la consumen vía `IConfiguration` inyectada en el constructor.

#### 2. Capa de Lógica de Negocio (Services)

- **Ubicación:** `Misostenido-backend/Services/Interface/` y `Misostenido-backend/Services/Implementation/`
- **Función:** Implementar las reglas de negocio, validaciones del dominio y acceso a datos mediante procedimientos almacenados (Stored Procedures).
- **Patrón utilizado:** Interfaces en `Interface/` — Implementaciones en `Implementation/`. Todos los servicios se registran con inyección de dependencias (`AddScoped`) en `Program.cs`.

| Servicio | Interfaz | Implementación |
| :--- | :--- | :--- |
| Autenticación | `IAuthService` | `AuthService` |
| Usuarios & Perfiles | `IUsuarioService` | `UsuarioService` |
| Feed | `IFeedService` | `FeedService` |
| Creatividad | `ICreatividadService` | `CreatividadService` |
| Contrataciones | `IContratacionService` | `ContratacionService` |
| Eventos | `IEventoService` | `EventoService` |
| Social | `ISocialService` | `SocialService` |
| Administración | `IAdminService` | `AdminService` |
| Inicio / Dashboard | `IInicioService` | `InicioService` |

#### 3. Capa de Modelos (Misostenido.Model)

- **Ubicación:** `Misostenido-backend/Misostenido.Model/DTO/`
- **Contenido:** Data Transfer Objects (DTOs) y respuestas estandarizadas para la comunicación entre capas.
- **Archivos DTO disponibles:** `AuthDtos`, `UsuarioDTO`, `UsuarioPerfilDtos`, `FeedDtos`, `CreatividadDtos`, `ContratacionDtos`, `EventoDtos`, `SocialDtos`, `AdminDtos`, `InicioDtos`.

---

### Frontend — JavaScript ES6+ SPA (Arquitectura Modular)

La aplicación frontend sigue una arquitectura de módulos desacoplados con separación de responsabilidades:

#### Estructura de Carpetas del Frontend

```text
Misostenido-Frontend/
├── index.html                          # Punto de entrada único de la SPA
└── src/
    ├── assets/
    │   └── images/                     # Recursos gráficos (logos, fondos, imágenes)
    │
    ├── components/                     # Componentes reutilizables en toda la app
    │   ├── footer/                     # Footer.js + footer.css
    │   ├── modal/                      # AuthModal.js + modal.css (login/registro)
    │   └── navbar/                     # Navbar.js + navbar.css (navegación dinámica)
    │
    ├── pages/                          # Vistas de cada módulo de la plataforma
    │   ├── home/                       # HomePage.js — Inicio y bienvenida
    │   ├── feed/                       # FeedPage.js — Muro multimedia
    │   ├── creatividad/                # CreatividadPage.js — Portafolios creativos
    │   ├── contrataciones/             # ContratacionesPage.js — Ofertas y solicitudes
    │   ├── eventos/                    # EventosPage.js — Cartelera de eventos
    │   ├── perfil/                     # PerfilPage.js — Perfil del artista
    │   ├── detalle/                    # DetallePage.js — Detalle de publicaciones
    │   ├── login/                      # LoginPage.js — Inicio de sesión
    │   ├── register/                   # RegisterPage.js — Registro de usuario
    │   ├── about/                      # AboutPage.js — Acerca del proyecto
    │   └── notFound/                   # NotFoundPage.js — Página 404
    │
    ├── router/
    │   └── router.js                   # Enrutador SPA del lado del cliente
    │
    ├── services/                       # Capa de acceso a datos y servicios externos
    │   ├── api.js                      # Cliente HTTP base (fetch + JWT automático)
    │   ├── authService.js              # Login, registro, sesión
    │   ├── feedService.js              # Publicaciones del feed
    │   ├── creatividadService.js       # Obras y portafolios
    │   ├── contratacionService.js      # Ofertas y postulaciones
    │   ├── eventoService.js            # Eventos culturales
    │   ├── perfilService.js            # Perfil y seguidores
    │   ├── homeService.js              # Datos del dashboard
    │   └── storageService.js           # Subida de archivos (Supabase, ImgBB, local)
    │
    ├── store/
    │   └── store.js                    # Estado global de sesión (usuario autenticado)
    │
    ├── styles/
    │   ├── base/
    │   │   ├── reset.css               # Reset de estilos del navegador
    │   │   ├── variables.css           # Variables CSS globales (colores, tipografía)
    │   │   └── global.css              # Estilos base del sistema
    │   └── components/                 # Estilos específicos por módulo
    │       ├── auth.css
    │       ├── home.css
    │       ├── feed.css
    │       ├── creatividad.css
    │       ├── contrataciones.css
    │       ├── eventos.css
    │       ├── perfil.css
    │       └── footer.css
    │
    └── utils/
        └── helpers.js                  # Funciones utilitarias reutilizables
```

---

## Seguridad y Buenas Prácticas

### Mecanismos de Seguridad Implementados

#### Autenticación con JWT (JSON Web Tokens)

El sistema utiliza autenticación basada en tokens JWT firmados, configurados en `Program.cs`:

- **Validación activa:** Issuer, Audience, firma de clave, vigencia del token.
- **Expiración:** 60 minutos por defecto (configurable en `appsettings.json`).
- **ClockSkew cero:** No se tolera ninguna diferencia de reloj entre cliente y servidor.
- **Revocación de sesiones:** El sistema soporta revocar todas las sesiones activas de un usuario desde `AuthService.RevocarTodasLasSesionesAsync`.
- **Recuperación de contraseña:** Generación de tokens de verificación con expiración de 24 horas almacenados en BD.

```csharp
// Program.cs — Configuración de validación del token JWT
options.TokenValidationParameters = new TokenValidationParameters
{
    ValidateIssuerSigningKey = true,
    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
    ValidateIssuer = true,
    ValidIssuer = issuer,
    ValidateAudience = true,
    ValidAudience = audience,
    ValidateLifetime = true,
    ClockSkew = TimeSpan.Zero
};
```

#### Encriptación de Contraseñas (BCrypt)

Las contraseñas nunca se almacenan en texto plano. Se utiliza BCrypt con su factor de costo integrado:

```csharp
// Registro — Hashear contraseña antes de guardar
string contrasenaHash = BCrypt.Net.BCrypt.HashPassword(dto.Contrasena);

// Login — Verificar contraseña ingresada contra el hash
bool valida = BCrypt.Net.BCrypt.Verify(dto.Contrasena, hashAlmacenado);
```

#### CORS — Cross-Origin Resource Sharing

Configurado en `Program.cs` para permitir el consumo desde el frontend local durante el desarrollo.

#### Protección de Rutas con Roles

Todos los endpoints sensibles utilizan el atributo `[Authorize]` con verificación de roles directamente en los controladores.

---

### Definición de Roles y Permisos

El sistema define **3 roles principales** en la plataforma:

#### Rol 1: `USUARIO` — Usuario Estándar de la Plataforma

Es el rol asignado por defecto al registrarse. Tiene acceso a todas las funcionalidades sociales y de contenido de la plataforma.

| Permiso | Acceso |
| :--- | :--- |
| Crear y editar su propio perfil | Si |
| Publicar en el Feed (fotos, videos, audios) | Si |
| Dar "me gusta" y comentar publicaciones | Si |
| Publicar obras en Creatividad / Portafolio | Si |
| Crear y postularse a ofertas de Contratación | Si |
| Crear y ver Eventos culturales | Si |
| Seguir y conectar con otros artistas | Si |
| Reportar contenido inadecuado | Si |
| Ver estadísticas globales de la plataforma | No |
| Gestionar o moderar otros usuarios | No |
| Consultar logs de auditoría | No |

```csharp
// Ejemplo de endpoint protegido solo para usuarios autenticados
[HttpPost("publicaciones")]
[Authorize]   // Cualquier usuario con token válido puede acceder
public async Task<IActionResult> CrearPublicacion([FromBody] CrearPublicacionDto dto) { ... }
```

---

#### Rol 2: `ADMIN` — Administrador del Sistema

Es el rol con mayor nivel de acceso y control. Puede gestionar usuarios, revisar y resolver reportes, y acceder al historial completo de auditoría del sistema.

| Permiso | Acceso |
| :--- | :--- |
| Todos los permisos del rol USUARIO | Si |
| Ver estadísticas globales de la plataforma | Si |
| Activar / desactivar / verificar cuentas de usuarios | Si |
| Cambiar el rol de cualquier usuario | Si |
| Ver y resolver reportes de contenido | Si |
| Consultar el log completo de auditoría del sistema | Si |
| Revocar sesiones de cualquier usuario | Si |

```csharp
// Endpoint exclusivo para ADMIN — Gestión de usuarios
[HttpPut("usuarios/{idUsuario:int}")]
[Authorize(Roles = "ADMIN")]
public async Task<IActionResult> GestionarUsuario(int idUsuario, [FromBody] GestionarUsuarioDto dto) { ... }

// Endpoint exclusivo para ADMIN — Log de auditoría
[HttpGet("auditoria")]
[Authorize(Roles = "ADMIN")]
public async Task<IActionResult> ObtenerLogAuditoria(...) { ... }
```

---

#### Rol 3: `MODERADOR` — Auditor / Moderador de Contenido

Rol intermedio con capacidad de supervisión y moderación de contenido, pero sin acceso a la gestión directa de usuarios ni al log de auditoría completo. Actúa como auditor de contenido publicado en la plataforma.

| Permiso | Acceso |
| :--- | :--- |
| Todos los permisos del rol USUARIO | Si |
| Ver estadísticas globales de la plataforma | Si |
| Ver reportes de contenido pendientes | Si |
| Resolver y cerrar reportes de contenido | Si |
| Gestionar cuentas de usuario | No |
| Consultar logs de auditoría completos | No |

```csharp
// Endpoints compartidos entre ADMIN y MODERADOR
[HttpGet("estadisticas")]
[Authorize(Roles = "ADMIN,MODERADOR")]
public async Task<IActionResult> ObtenerEstadisticas() { ... }

[HttpGet("reportes")]
[Authorize(Roles = "ADMIN,MODERADOR")]
public async Task<IActionResult> ObtenerReportes(...) { ... }

[HttpPut("reportes/{idReporte:int}/resolver")]
[Authorize(Roles = "ADMIN,MODERADOR")]
public async Task<IActionResult> ResolverReporte(...) { ... }
```

---

### Resumen de Matriz de Permisos por Rol

| Funcionalidad | USUARIO | MODERADOR | ADMIN |
| :--- | :---: | :---: | :---: |
| Acceso a la plataforma y contenido | Si | Si | Si |
| Publicar contenido (Feed, Creatividad) | Si | Si | Si |
| Contrataciones y Eventos | Si | Si | Si |
| Reportar contenido | Si | Si | Si |
| Ver estadísticas globales | No | Si | Si |
| Ver y resolver reportes | No | Si | Si |
| Gestionar cuentas de usuario | No | No | Si |
| Consultar log de auditoría | No | No | Si |
| Revocar sesiones | No | No | Si |

---

## Buenas Prácticas y Código Limpio

### Backend (C# / ASP.NET Core 9)

1. **Separación de responsabilidades:** Cada capa (Controladores, Servicios, Modelos) tiene una única responsabilidad bien definida.
2. **Inyección de dependencias:** Todos los servicios se registran mediante `AddScoped` en `Program.cs` y se consumen a través de interfaces, facilitando las pruebas unitarias.
3. **Uso de interfaces:** Las implementaciones dependen de contratos (`IAuthService`, `IFeedService`, etc.), no de clases concretas. Esto permite sustituir implementaciones sin modificar los controladores.
4. **Manejo de errores estructurado:** Todas las operaciones están envueltas en bloques `try/catch` con respuestas estandarizadas (`Exito`, `Mensaje`).
5. **DTOs en lugar de entidades de base de datos:** Los datos nunca se exponen directamente desde la BD; siempre se mapean a DTOs específicos para cada operación.
6. **Procedimientos almacenados:** La lógica de acceso a datos crítica (registro, login, auditoría) se maneja en Stored Procedures del lado de la base de datos, reduciendo el riesgo de inyección SQL.
7. **Validación de entrada:** Se valida la presencia de campos obligatorios antes de ejecutar cualquier operación de negocio.
8. **Nomenclatura coherente:** Variables, métodos y clases siguen la convención PascalCase (clases/métodos) y camelCase (variables locales) de C#.
9. **Async/Await en toda la capa de datos:** Todas las operaciones de base de datos son asíncronas para no bloquear el hilo del servidor.
10. **Comentarios de documentación XML:** Los endpoints públicos están documentados con `<summary>` para que Swagger los exponga correctamente.

### Frontend (JavaScript ES6+)

1. **Módulos ES6 nativos:** Cada archivo exporta solo lo que necesita (`export const`, `export class`), evitando la contaminación del scope global.
2. **Separación por responsabilidades:** `pages/` contiene vistas, `services/` contiene la lógica de acceso a datos, `store/` contiene el estado global y `utils/` las funciones reutilizables.
3. **Un único cliente HTTP (`api.js`):** Todas las llamadas a la API pasan por el mismo cliente centralizado, que inyecta el token JWT automáticamente desde `localStorage`.
4. **Variables CSS centralizadas:** Los colores, tipografías y espaciados se definen una sola vez en `styles/base/variables.css` y se reutilizan en todo el proyecto.
5. **Enrutador SPA del lado del cliente:** El `router.js` gestiona la navegación sin recargar la página, mejorando la experiencia del usuario.
6. **Manejo de errores en servicios:** Cada servicio captura errores de red y los propaga con mensajes descriptivos al usuario.
7. **Estado global centralizado:** El `store.js` gestiona la información del usuario autenticado en un solo lugar, evitando duplicación de lógica entre módulos.
8. **Compatibilidad de almacenamiento multimedia:** El `storageService.js` implementa una estrategia de fallback automático (Supabase → ImgBB → Backend local), garantizando que la subida de archivos siempre funcione.

---

## Sistema de Auditoría

El sistema incluye un módulo de auditoría que registra automáticamente las acciones administrativas críticas en la tabla `log_auditoria` de SQL Server. Esto permite trazabilidad completa de:

- Cambios de estado en cuentas de usuario (activar, desactivar, verificar).
- Cambios de rol.
- Resolución de reportes de contenido.
- Acciones de administración del sistema.

El log de auditoría es consultable exclusivamente por el rol `ADMIN` a través del endpoint `GET /api/Admin/auditoria`, con filtros por usuario, tipo de acción y límite de registros.

---

**Desarrollado por:** Equipo Código Da Vinci — Hackathon 2026.
