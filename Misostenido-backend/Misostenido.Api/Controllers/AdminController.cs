using System.Security.Claims;
using Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Misostenido.Model.DTO;

namespace Misostenido.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // GET /api/admin/estadisticas
    // Requiere rol ADMIN o MODERADOR
    // ──────────────────────────────────────────────────────────────────────────
    /// <summary>Obtiene las estadísticas globales de la plataforma (usuarios, publicaciones, ofertas, eventos, reportes).</summary>
    [HttpGet("estadisticas")]
    [Authorize(Roles = "ADMIN,MODERADOR")]
    public async Task<IActionResult> ObtenerEstadisticas()
    {
        var stats = await _adminService.ObtenerEstadisticasAsync();
        return Ok(stats);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // PUT /api/admin/usuarios/{idUsuario}
    // Requiere rol ADMIN
    // ──────────────────────────────────────────────────────────────────────────
    /// <summary>Permite a un Administrador activar/desactivar, verificar o cambiar el rol a un usuario.</summary>
    [HttpPut("usuarios/{idUsuario:int}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> GestionarUsuario(int idUsuario, [FromBody] GestionarUsuarioDto dto)
    {
        int idAdmin = ObtenerIdUsuarioActualRequerido();
        var resultado = await _adminService.GestionarUsuarioAsync(idAdmin, idUsuario, dto);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // POST /api/admin/reportes
    // Requiere Autenticación (Cualquier usuario logueado puede enviar un reporte)
    // ──────────────────────────────────────────────────────────────────────────
    /// <summary>Envía un reporte sobre una publicación, perfil, evento, oferta o solicitud inadecuada.</summary>
    [HttpPost("reportes")]
    [Authorize]
    public async Task<IActionResult> CrearReporte([FromBody] CrearReporteDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        int idUsuario = ObtenerIdUsuarioActualRequerido();

        var resultado = await _adminService.CrearReporteAsync(idUsuario, dto);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // GET /api/admin/reportes
    // Requiere rol ADMIN o MODERADOR
    // ──────────────────────────────────────────────────────────────────────────
    /// <summary>Obtiene la lista de reportes de contenido generados por los usuarios.</summary>
    [HttpGet("reportes")]
    [Authorize(Roles = "ADMIN,MODERADOR")]
    public async Task<IActionResult> ObtenerReportes([FromQuery] bool soloPendientes = true)
    {
        var reportes = await _adminService.ObtenerReportesAsync(soloPendientes);
        return Ok(reportes);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // PUT /api/admin/reportes/{idReporte}/resolver
    // Requiere rol ADMIN o MODERADOR
    // ──────────────────────────────────────────────────────────────────────────
    /// <summary>Marca un reporte como resuelto y registra la acción en el log de auditoría.</summary>
    [HttpPut("reportes/{idReporte:int}/resolver")]
    [Authorize(Roles = "ADMIN,MODERADOR")]
    public async Task<IActionResult> ResolverReporte(int idReporte, [FromBody] ResolverReporteDto dto)
    {
        int idAdmin = ObtenerIdUsuarioActualRequerido();
        var resultado = await _adminService.ResolverReporteAsync(idAdmin, idReporte, dto);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // GET /api/admin/auditoria
    // Requiere rol ADMIN
    // ──────────────────────────────────────────────────────────────────────────
    /// <summary>Consulta el historial de auditoría de acciones administrativas y del sistema.</summary>
    [HttpGet("auditoria")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> ObtenerLogAuditoria(
        [FromQuery] int? idUsuario,
        [FromQuery] string? accion,
        [FromQuery] int limite = 100)
    {
        var filtros = new FiltrosAuditoriaDto
        {
            IdUsuario = idUsuario,
            Accion = accion,
            Limite = limite
        };
        var logs = await _adminService.ObtenerLogAuditoriaAsync(filtros);
        return Ok(logs);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Helpers privados para extraer el id_usuario del JWT
    // ──────────────────────────────────────────────────────────────────────────
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
