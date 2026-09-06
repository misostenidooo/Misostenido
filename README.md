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

Este proyecto está organizado en **3 ramas**, cada una con un propósito específico y bien definido:

---

### `main` — Rama Principal (Producción)

Esta es la rama **oficial y estable** del proyecto. Contiene el sistema completo e integrado, listo para ser presentado o desplegado. Aquí se unen el trabajo del backend, el frontend y los scripts de base de datos en una sola versión funcional. **No se trabaja directamente en esta rama**, solo se integran los cambios desde `backend` y `frontend` cuando están listos.

---

### `backend` — Rama de Desarrollo del Servidor

Esta rama contiene todo lo relacionado con el **lado del servidor** del proyecto:
- La API REST desarrollada en **.NET 9 (C#)**, con todos sus controladores (Auth, Feed, Creatividad, Contrataciones, Eventos, Social, Admin, Usuario).
- La capa de servicios con la lógica de negocio.
- Los modelos de datos y DTOs para la comunicación entre capas.
- La configuración de seguridad con **JWT** y encriptación **BCrypt**.
- Los scripts y backups de la **base de datos SQL Server**.

Es la rama donde el equipo de backend realiza sus cambios, pruebas y mejoras antes de integrarlos a `main`.

---

### `frontend` — Rama de Desarrollo de la Interfaz

Esta rama contiene todo lo relacionado con la **experiencia visual y la interacción del usuario**:
- La aplicación web SPA (Single Page Application) construida con **HTML5, JavaScript ES6+ y CSS3 Vanilla**.
- Todos los módulos visuales: Home, Feed, Creatividad, Contrataciones, Eventos, Perfil, Login y Registro.
- Los componentes reutilizables como Navbar, Footer y modales.
- La integración con el almacenamiento multimedia en la nube (**Supabase Storage**) para subir y mostrar audios, videos e imágenes.
- Los estilos, animaciones y diseño general de la plataforma.

Es la rama donde el equipo de frontend trabaja de forma independiente sin afectar el servidor.

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
