# MiSostenido — Plataforma Integral para Músicos y Artistas
> Proyecto Hackathon — Grupo Código Da Vinci

---

## Descripción General del Proyecto

**MiSostenido** es una plataforma web y ecosistema digital diseñado para impulsar a la comunidad musical y artística en Nicaragua y Latinoamérica. Permite a artistas, bandas, productores y entusiastas conectar, publicar contenido multimedia (audio, video, fotos), gestionar ofertas de contratación para eventos y servicios, exhibir portafolios creativos y difundir eventos culturales.

La solución está construida con una arquitectura desacoplada que integra:
- **Backend:** API RESTful en **.NET 9 (C#)** con seguridad basada en **JWT** y acceso a datos mediante **SQL Server** y procedimientos almacenados.
- **Frontend:** Single Page Application (SPA) en **JavaScript moderno (ES6+)** con diseño modular, reproductor de audio/video integrado y modo oscuro.
- **Almacenamiento Multimedia:** Integración con **Supabase Storage** y CDN para archivos de audio, video e imágenes sin límite de almacenamiento.

---

## Ramas del Repositorio

El proyecto está dividido en tres ramas, cada una con un propósito específico:

**`main` — Rama Principal**
Es la rama de producción y entrega final. Contiene el proyecto completo integrado: backend, frontend y base de datos juntos. Todo lo que se quiera presentar o entregar oficialmente debe estar aquí.

**`backend` — Desarrollo del Backend**
Esta rama fue creada exclusivamente para el desarrollo de la API en .NET 9. Aquí se trabaja todo lo relacionado con el servidor: los controladores que manejan las peticiones, los servicios con la lógica del negocio, los modelos de datos, la autenticación con JWT y la conexión a SQL Server mediante procedimientos almacenados.

**`frontend` — Desarrollo del Frontend**
Esta rama contiene todo el trabajo de la interfaz de usuario. Se desarrolló aquí la aplicación web (SPA) en JavaScript, con todas las vistas y módulos del sistema: el feed, creatividad, contrataciones, eventos, perfiles y más. También incluye los estilos CSS, los componentes reutilizables y la integración con Supabase para el almacenamiento de archivos multimedia.

---

## Módulos y Funcionalidades del Sistema

| Módulo | Descripción |
| :--- | :--- |
| **Autenticación & Perfiles** | Registro, inicio de sesión seguro con JWT y BCrypt, edición de perfiles de artistas, avatar y biografía. |
| **Feed Multimedia** | Muro interactivo con publicaciones, carruseles de fotos/videos/audios, "me gusta" y comentarios. |
| **Creatividad & Portafolio** | Espacio para que los artistas publiquen sus obras, pistas demo, composiciones y piezas de portafolio. |
| **Contrataciones & Ofertas** | Tablero de ofertas laborales y solicitudes de contratación para conciertos, eventos privados y grabaciones. |
| **Eventos Culturales** | Cartelera de conciertos, festivales y presentaciones en vivo con detalles de fechas y ubicación. |
| **Apartado Social** | Conexión e interacción comunitaria entre músicos, bandas y seguidores. |
| **Módulo Administrativo** | Supervisión, control y métricas de la plataforma. |

---

## Tecnologías Utilizadas

### Backend
- **Lenguaje / Framework:** C# con .NET 9.0 Web API (ASP.NET Core)
- **Base de Datos:** Microsoft SQL Server (T-SQL, Procedimientos Almacenados)
- **Autenticación:** JSON Web Tokens (JWT Bearer) + Encriptación BCrypt (`BCrypt.Net-Next`)
- **Acceso a Datos:** `Microsoft.Data.SqlClient` / Entity Framework Core 9.0
- **Documentación API:** Swagger / OpenAPI (`Swashbuckle.AspNetCore`)

### Frontend
- **Estructura & Lógica:** HTML5 Semántico + JavaScript ES6+ (Módulos nativos, enrutador cliente)
- **Estilos & UI:** CSS3 Vanilla (Variables CSS, Flexbox/Grid, transiciones suaves)
- **Iconografía & Fuentes:** FontAwesome + Google Fonts

### Cloud & Almacenamiento Multimedia
- **Supabase Storage:** Almacenamiento y streaming público de audios, videos e imágenes en la nube.
- **ImgBB CDN:** Red de entrega de imágenes.
- **Fallback Local:** Almacenamiento en servidor local (`wwwroot/uploads/`) a través del controlador `/api/Upload`.

---

## Requisitos Previos

Antes de iniciar el proyecto, asegúrate de tener instalado en tu equipo:

1. **.NET 9 SDK** (o .NET 8+).
2. **Microsoft SQL Server** (Express, Developer o Standard) junto con **SQL Server Management Studio (SSMS)** o **Azure Data Studio**.
3. **Visual Studio Code** (con la extensión **Live Server** instalada) o cualquier editor de código.
4. **Conexión a Internet:** Necesaria para la carga y reproducción multimedia en la nube (Supabase Storage y CDNs).

---

## Guía de Instalación y Ejecución Paso a Paso

### Paso 1: Configuración de la Base de Datos (SQL Server)

Tienes dos opciones disponibles en la carpeta `Base de datos de misostenido/`:

* **Opción A (Restaurar archivo Backup):**
  1. Abre **SQL Server Management Studio (SSMS)**.
  2. Haz clic derecho en **Databases** > **Restore Database...**.
  3. Selecciona **Device**, busca y selecciona el archivo `Base de datos de misostenido/base de datos final`.
  4. Restaura la base de datos con el nombre `MisostenidoDB`.

* **Opción B (Ejecutar Script SQL):**
  1. Abre SSMS y conéctate a tu servidor local de SQL Server.
  2. Abre el archivo `Base de datos de misostenido/Base de datos de misostenido.sql`.
  3. Ejecuta el script completo (F5) para crear la base de datos, tablas y procedimientos almacenados.

---

### Paso 2: Configurar la Cadena de Conexión en el Backend

1. Dirígete al archivo de configuración del Backend:
   `Misostenido-backend/Misostenido.Api/appsettings.json`
2. Modifica la propiedad `DefaultConnection` reemplazando el nombre del servidor por el de tu propia máquina / instancia de SQL Server:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=TU_NOMBRE_DE_SERVIDOR\\SQLEXPRESS;Database=MisostenidoDB;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

> **Nota:** Reemplaza `TU_NOMBRE_DE_SERVIDOR\\SQLEXPRESS` por el Server Name de tu SQL Server (por ejemplo: `localhost`, `localhost\\SQLEXPRESS`, `(localdb)\\MSSQLLocalDB`, o el nombre de tu equipo).

---

### Paso 3: Ejecución de la API Backend (.NET)

1. Abre una terminal en la carpeta de la API:
   ```bash
   cd Misostenido-backend/Misostenido.Api
   ```
2. Restaura paquetes y ejecuta el proyecto:
   ```bash
   dotnet run
   ```
   *(Opcional con recarga en vivo: `dotnet watch run`)*
3. La API iniciará en la dirección por defecto:
   - **API Base:** `http://localhost:5180`
   - **Documentación Swagger:** `http://localhost:5180/swagger`

---

### Paso 4: Ejecución del Frontend

1. Abre la carpeta del proyecto en **Visual Studio Code**.
2. Navega a la carpeta `Misostenido-Frontend/`.
3. Haz clic derecho sobre el archivo `index.html` y selecciona **"Open with Live Server"** (o usa el botón **Go Live** en la barra inferior de VS Code).
4. Tu navegador abrirá automáticamente la aplicación en `http://127.0.0.1:5500`.

---

## Estructura del Repositorio

```text
Misostenido/
├── Base de datos de misostenido/
│   ├── Base de datos de misostenido.sql   # Script T-SQL completo con tablas y Stored Procedures
│   └── base de datos final                # Archivo Backup (.bak) de SQL Server
│
├── Misostenido-backend/                   # Solución .NET 9 Web API
│   ├── Misostenido.sln
│   ├── Misostenido.Api/                   # Controladores REST, Middleware, Program.cs y appsettings.json
│   │   ├── Controllers/                   # Auth, Feed, Creatividad, Contratacion, Evento, Social, etc.
│   │   └── wwwroot/                       # Archivos estáticos y subidas locales de respaldo
│   ├── Misostenido.Model/                 # Modelos de dominio y Data Transfer Objects (DTOs)
│   └── Services/                          # Capa de lógica de negocio (Interfaces e Implementaciones)
│
└── Misostenido-Frontend/                  # Single Page Application (Frontend)
    ├── index.html                         # Punto de entrada de la aplicación
    └── src/
        ├── assets/                        # Imágenes, logos y recursos gráficos
        ├── components/                    # Componentes reutilizables (Navbar, Footer, Modales)
        ├── pages/                         # Vistas (Home, Feed, Creatividad, Contrataciones, Eventos, Perfil, etc.)
        ├── router/                        # Enrutador SPA del cliente
        ├── services/                      # Consumo de endpoints de la API y Supabase Storage
        ├── store/                         # Gestión del estado global (usuario autenticado, sesión)
        └── styles/                        # Estilos CSS modulares y variables globales
```

---

## Seguridad y Variables

- **Tokens JWT:** Configurados en `appsettings.json` bajo la sección `JwtSettings`.
- **CORS:** Configurado en `Program.cs` para permitir peticiones locales desde el Frontend.
- **Supabase Storage:** Claves públicas y buckets configurados en `Misostenido-Frontend/src/services/storageService.js` para la gestión directa de audio y video.

---

## Desarrollado por
**Equipo Código Da Vinci** — Proyecto Hackathon 2026.
