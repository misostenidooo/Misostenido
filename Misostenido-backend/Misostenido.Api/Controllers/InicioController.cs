using Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Misostenido.Model.DTO;

namespace Misostenido.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class InicioController : ControllerBase
{
    private readonly IInicioService _inicioService;

    public InicioController(IInicioService inicioService)
    {
        _inicioService = inicioService;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/inicio/destacados
    // Público / Cero Fricción (sin cuenta ni token necesario)
    // ─────────────────────────────────────────────────────────────────────────
    /// <summary>
    /// Puerta de entrada. Devuelve artistas destacados, publicaciones recientes y próximos eventos.
    /// No requiere estar autenticado.
    /// </summary>
    [HttpGet("destacados")]
    [AllowAnonymous]
    public async Task<IActionResult> ObtenerDestacados()
    {
        var destacados = await _inicioService.ObtenerDestacadosAsync();
        return Ok(destacados);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/inicio/buscar
    // Público / Cero Fricción
    // ─────────────────────────────────────────────────────────────────────────
    /// <summary>
    /// Búsqueda global de artistas, eventos y ofertas de servicios con filtros opcionales.
    /// </summary>
    /// <param name="busqueda">Texto libre para buscar por nombre, biografía, instrumento o título</param>
    /// <param name="tipoPerfil">Filtro por tipo de perfil: INDIVIDUAL, GRUPO o ESCUELA</param>
    /// <param name="generoMusical">Filtro por género musical (ej. Rock, Marimba, Cumbia)</param>
    [HttpGet("buscar")]
    [AllowAnonymous]
    public async Task<IActionResult> BuscarGlobal(
        [FromQuery] string? busqueda,
        [FromQuery] string? tipoPerfil,
        [FromQuery] string? generoMusical)
    {
        var dto = new BuscarGlobalRequestDto
        {
            Busqueda = busqueda,
            TipoPerfil = tipoPerfil,
            GeneroMusical = generoMusical
        };

        var resultados = await _inicioService.BuscarGlobalAsync(dto);
        return Ok(resultados);
    }
}
