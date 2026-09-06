# MiSostenido — Backend (.NET 9 Web API)
> Proyecto Hackathon — Grupo Código Da Vinci

Este directorio contiene la solución y servicios de backend para la plataforma **MiSostenido**.

---

## Estructura de Ramas del Repositorio

| Rama | Propósito |
| :--- | :--- |
| **`main`** | Versión unificada y lista para producción (Backend + Frontend + Base de Datos). |
| **`backend`** | Rama activa para el desarrollo de la API .NET 9, controladores, servicios y base de datos. |
| **`frontend`** | Rama para el desarrollo de la interfaz de usuario en JavaScript / CSS. |

---

## Tecnologías y Arquitectura
- **Framework:** .NET 9.0 (ASP.NET Core Web API)
- **Base de Datos:** Microsoft SQL Server (T-SQL, Stored Procedures)
- **Seguridad:** JWT Bearer Authentication (`Microsoft.AspNetCore.Authentication.JwtBearer`) + Encriptación de contraseñas con `BCrypt.Net-Next`
- **Documentación de Endpoints:** Swagger UI (`Swashbuckle.AspNetCore`)
- **Arquitectura en Capas:**
  - `Misostenido.Api`: Controladores REST, filtros, middleware y configuración.
  - `Misostenido.Model`: DTOs (Data Transfer Objects) y modelos de entidad.
  - `Services/Interface`: Contratos de servicio.
  - `Services/Implementation`: Lógica de negocio y consultas con procedimientos almacenados.

---

## Pasos de Instalación y Ejecución

### 1. Base de Datos (SQL Server)
Asegúrate de restaurar el backup o ejecutar el script ubicado en la carpeta `Base de datos de misostenido/` antes de iniciar la API.

### 2. Configurar Cadena de Conexión
En el archivo [`Misostenido.Api/appsettings.json`](file:///Misostenido.Api/appsettings.json), edita tu nombre de servidor SQL:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=TU_SERVIDOR\\SQLEXPRESS;Database=MisostenidoDB;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

### 3. Ejecutar la API
```bash
cd Misostenido.Api
dotnet run
```
Accede a Swagger para probar los endpoints en: `http://localhost:5180/swagger`
