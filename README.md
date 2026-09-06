# MiSostenido — Backend y Base de Datos
> Proyecto Hackathon — Grupo Código Da Vinci

Este repositorio (rama `backend`) contiene exclusivamente la solución de **Backend (.NET 9 Web API)** y los scripts / backups de **Base de Datos (SQL Server)** para la plataforma MiSostenido.

---

## Estructura de la Rama

```text
Misostenido/ (rama: backend)
├── Base de datos de misostenido/
│   ├── Base de datos de misostenido.sql   # Script T-SQL completo con tablas y Stored Procedures
│   └── base de datos final                # Archivo Backup (.bak) de SQL Server
│
└── Misostenido-backend/                   # Solución .NET 9 Web API
    ├── Misostenido.sln
    ├── Misostenido.Api/                   # Controladores REST, Middleware, Program.cs y appsettings.json
    ├── Misostenido.Model/                 # Modelos de dominio y Data Transfer Objects (DTOs)
    └── Services/                          # Capa de lógica de negocio (Interfaces e Implementaciones)
```

---

## Tecnologías Utilizadas
- **Framework:** .NET 9.0 (ASP.NET Core Web API en C#)
- **Base de Datos:** Microsoft SQL Server (T-SQL, Procedimientos Almacenados)
- **Seguridad & Auth:** JSON Web Tokens (JWT Bearer) + Encriptación con `BCrypt.Net-Next`
- **Documentación:** Swagger / OpenAPI (`Swashbuckle.AspNetCore`)
- **Acceso a Datos:** `Microsoft.Data.SqlClient` / Entity Framework Core 9.0

---

## Pasos de Instalación y Ejecución

### 1. Base de Datos (SQL Server)
Antes de iniciar la API, asegúrate de tener la base de datos creada en SQL Server:
- **Opción A (Backup):** Restaura el archivo `Base de datos de misostenido/base de datos final` en SQL Server Management Studio (SSMS).
- **Opción B (Script):** Ejecuta el archivo `Base de datos de misostenido/Base de datos de misostenido.sql` en SSMS.

### 2. Cadena de Conexión
Edita el archivo `Misostenido-backend/Misostenido.Api/appsettings.json` y configura tu Server Name de SQL Server:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=TU_NOMBRE_DE_SERVIDOR\\SQLEXPRESS;Database=MisostenidoDB;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

### 3. Ejecutar la API
```bash
cd Misostenido-backend/Misostenido.Api
dotnet run
```
La API estará disponible en `http://localhost:5180` y la documentación Swagger en `http://localhost:5180/swagger`.
