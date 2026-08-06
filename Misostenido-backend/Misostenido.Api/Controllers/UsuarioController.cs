using System.Security.Claims;
using Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Misostenido.Model.DTO;

namespace Misostenido.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class UsuarioController : ControllerBase
{
    private readonly IUsuarioService _usuarioService;

    public UsuarioController(IUsuarioService usuarioService)
    {
        _usuarioService = usuarioService;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/usuario/{id}
    // Público: cualquiera puede ver un perfil
    // ─────────────────────────────────────────────────────────────────────────
    /// <summary>Obtiene el perfil público de un artista, grupo o escuela.</summary>
    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> ObtenerPerfil(int id)
    {
        // Si hay sesión activa, pasamos el visitante para saber si ya lo sigue
        int? idVisitante = ObtenerIdUsuarioActual();

        var perfil = await _usuarioService.ObtenerPerfilAsync(id, idVisitante);
        if (perfil == null)
            return NotFound(new { exito = false, mensaje = "Usuario no encontrado" });

        return Ok(perfil);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/usuario/me
    // Requiere: estar autenticado (cualquier rol)
    // ─────────────────────────────────────────────────────────────────────────
    /// <summary>Obtiene el perfil completo del usuario autenticado.</summary>
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> ObtenerMiPerfil()
    {
        int idUsuario = ObtenerIdUsuarioActualRequerido();
        var perfil = await _usuarioService.ObtenerPerfilAsync(idUsuario, idUsuario);
        if (perfil == null)
            return NotFound(new { exito = false, mensaje = "Perfil no encontrado" });

        return Ok(perfil);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUT /api/usuario/me
    // Requiere: estar autenticado (cualquier rol)
    // ─────────────────────────────────────────────────────────────────────────
    /// <summary>Actualiza los datos del perfil del usuario autenticado.</summary>
    [HttpPut("me")]
    [Authorize]
    public async Task<IActionResult> ActualizarMiPerfil([FromBody] ActualizarPerfilDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        int idUsuario = ObtenerIdUsuarioActualRequerido();
        var resultado = await _usuarioService.ActualizarPerfilAsync(idUsuario, dto);

        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/usuario/me/permisos
    // Requiere: autenticado
    // ─────────────────────────────────────────────────────────────────────────
    /// <summary>Lista todos los permisos que tiene el usuario autenticado según su rol.</summary>
    [HttpGet("me/permisos")]
    [Authorize]
    public async Task<IActionResult> ObtenerMisPermisos()
    {
        int idUsuario = ObtenerIdUsuarioActualRequerido();
        var permisos = await _usuarioService.ObtenerPermisosAsync(idUsuario);
        return Ok(permisos);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/usuario/me/tiene-permiso/{codigo}
    // Requiere: autenticado
    // ─────────────────────────────────────────────────────────────────────────
    /// <summary>Verifica si el usuario autenticado tiene un permiso específico.</summary>
    [HttpGet("me/tiene-permiso/{codigo}")]
    [Authorize]
    public async Task<IActionResult> TienePermiso(string codigo)
    {
        int idUsuario = ObtenerIdUsuarioActualRequerido();
        bool tiene = await _usuarioService.TienePermisoAsync(idUsuario, codigo);
        return Ok(new { idUsuario, codigoPermiso = codigo, tienePermiso = tiene });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/usuario/zona-usuario  (Solo USUARIO)
    // ─────────────────────────────────────────────────────────────────────────
    /// <summary>Zona exclusiva para usuarios registrados. Verifica rol USUARIO.</summary>
    [HttpGet("zona-usuario")]
    [Authorize(Roles = "USUARIO,MODERADOR,ADMIN")]
    public IActionResult ZonaUsuario()
    {
        return Ok(new
        {
            exito = true,
            mensaje = "Bienvenido a tu zona de artista en MiSostenido 🎵",
            idUsuario = ObtenerIdUsuarioActual(),
            rol = User.FindFirstValue(ClaimTypes.Role)
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/usuario/zona-moderador  (Solo MODERADOR o ADMIN)
    // ─────────────────────────────────────────────────────────────────────────
    /// <summary>Zona exclusiva para moderadores. Prueba de control de acceso por rol.</summary>
    [HttpGet("zona-moderador")]
    [Authorize(Roles = "MODERADOR,ADMIN")]
    public IActionResult ZonaModerador()
    {
        return Ok(new
        {
            exito = true,
            mensaje = "Panel de Moderación MiSostenido 🛡️",
            idUsuario = ObtenerIdUsuarioActual(),
            rol = User.FindFirstValue(ClaimTypes.Role)
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/usuario/zona-admin  (Solo ADMIN)
    // ─────────────────────────────────────────────────────────────────────────
    /// <summary>Zona exclusiva para administradores. Prueba de control de acceso por rol ADMIN.</summary>
    [HttpGet("zona-admin")]
    [Authorize(Roles = "ADMIN")]
    public IActionResult ZonaAdmin()
    {
        return Ok(new
        {
            exito = true,
            mensaje = "Panel de Administración MiSostenido ⚙️",
            idUsuario = ObtenerIdUsuarioActual(),
            rol = User.FindFirstValue(ClaimTypes.Role)
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUT /api/usuario/admin/gestionar  (Solo ADMIN)
    // ─────────────────────────────────────────────────────────────────────────
    /// <summary>
    /// Permite a un ADMIN cambiar el estado, la verificación o el rol de otro usuario.
    /// Pasar solo los campos que se desean modificar (el resto en null).
    /// </summary>
    [HttpPut("admin/gestionar")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> GestionarUsuario([FromBody] GestionarUsuarioDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        int idAdmin = ObtenerIdUsuarioActualRequerido();
        var resultado = await _usuarioService.GestionarUsuarioAsync(idAdmin, dto);

        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PORTAFOLIO MULTIMEDIA
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>Sube una foto, video o audio al portafolio del usuario autenticado.</summary>
    [HttpPost("me/media")]
    [Authorize]
    public async Task<IActionResult> SubirMedia([FromBody] SubirMediaDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        int id = ObtenerIdUsuarioActualRequerido();
        var resultado = await _usuarioService.SubirMediaAsync(id, dto);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    /// <summary>Elimina un elemento multimedia del portafolio del usuario autenticado.</summary>
    [HttpDelete("me/media/{idMedia:int}")]
    [Authorize]
    public async Task<IActionResult> EliminarMedia(int idMedia)
    {
        int id = ObtenerIdUsuarioActualRequerido();
        var resultado = await _usuarioService.EliminarMediaAsync(idMedia, id);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    /// <summary>Obtiene todo el portafolio multimedia de un usuario (público).</summary>
    [HttpGet("{idUsuario:int}/media")]
    [AllowAnonymous]
    public async Task<IActionResult> ObtenerMedia(int idUsuario)
    {
        var media = await _usuarioService.ObtenerMediaAsync(idUsuario);
        return Ok(media);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INTEGRANTES DE GRUPO
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>Agrega un integrante al grupo del usuario autenticado (solo tipo GRUPO).</summary>
    [HttpPost("me/integrantes")]
    [Authorize]
    public async Task<IActionResult> AgregarIntegrante([FromBody] AgregarIntegranteDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        int id = ObtenerIdUsuarioActualRequerido();
        var resultado = await _usuarioService.AgregarIntegranteAsync(id, dto);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    /// <summary>Elimina un integrante del grupo del usuario autenticado.</summary>
    [HttpDelete("me/integrantes/{idIntegrante:int}")]
    [Authorize]
    public async Task<IActionResult> EliminarIntegrante(int idIntegrante)
    {
        int id = ObtenerIdUsuarioActualRequerido();
        var resultado = await _usuarioService.EliminarIntegranteAsync(id, idIntegrante);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    /// <summary>Obtiene todos los integrantes de un grupo (público).</summary>
    [HttpGet("{idGrupo:int}/integrantes")]
    [AllowAnonymous]
    public async Task<IActionResult> ObtenerIntegrantes(int idGrupo)
    {
        var integrantes = await _usuarioService.ObtenerIntegrantesAsync(idGrupo);
        return Ok(integrantes);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CURSOS DE ESCUELA
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>Crea un nuevo curso para la escuela del usuario autenticado (solo tipo ESCUELA).</summary>
    [HttpPost("me/cursos")]
    [Authorize]
    public async Task<IActionResult> CrearCurso([FromBody] CrearCursoDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        int id = ObtenerIdUsuarioActualRequerido();
        var resultado = await _usuarioService.CrearCursoAsync(id, dto);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    /// <summary>Actualiza un curso de la escuela del usuario autenticado.</summary>
    [HttpPut("me/cursos/{idCurso:int}")]
    [Authorize]
    public async Task<IActionResult> ActualizarCurso(int idCurso, [FromBody] ActualizarCursoDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        int id = ObtenerIdUsuarioActualRequerido();
        var resultado = await _usuarioService.ActualizarCursoAsync(idCurso, id, dto);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    /// <summary>Elimina un curso de la escuela del usuario autenticado.</summary>
    [HttpDelete("me/cursos/{idCurso:int}")]
    [Authorize]
    public async Task<IActionResult> EliminarCurso(int idCurso)
    {
        int id = ObtenerIdUsuarioActualRequerido();
        var resultado = await _usuarioService.EliminarCursoAsync(idCurso, id);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    /// <summary>Obtiene todos los cursos de una escuela (público).</summary>
    [HttpGet("{idEscuela:int}/cursos")]
    [AllowAnonymous]
    public async Task<IActionResult> ObtenerCursos(int idEscuela)
    {
        var cursos = await _usuarioService.ObtenerCursosAsync(idEscuela);
        return Ok(cursos);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers privados para extraer el id_usuario del JWT
    // ─────────────────────────────────────────────────────────────────────────

    private int? ObtenerIdUsuarioActual()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(claim, out int id) ? id : null;
    }

    private int ObtenerIdUsuarioActualRequerido()
    {
        var id = ObtenerIdUsuarioActual();
        if (id == null) throw new UnauthorizedAccessException("Token inválido: falta el claim de id_usuario.");
        return id.Value;
    }
}
