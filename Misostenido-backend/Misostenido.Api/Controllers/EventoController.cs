using System.Security.Claims;
using Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Misostenido.Model.DTO;

namespace Misostenido.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class EventoController : ControllerBase
{
    private readonly IEventoService _eventoService;

    public EventoController(IEventoService eventoService)
    {
        _eventoService = eventoService;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // GET /api/evento
    // Público
    // ──────────────────────────────────────────────────────────────────────────
    /// <summary>Obtiene la lista paginada de eventos con filtros opcionales.</summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> ObtenerEventos(
        [FromQuery] string? busqueda,
        [FromQuery] string? tipoEvento,
        [FromQuery] string? ubicacion,
        [FromQuery] bool soloProximos = true,
        [FromQuery] int pagina = 1,
        [FromQuery] int tamanoPagina = 10)
    {
        var filtros = new FiltrosEventoDto
        {
            Busqueda = busqueda,
            TipoEvento = tipoEvento,
            Ubicacion = ubicacion,
            SoloProximos = soloProximos,
            Pagina = pagina,
            TamanoPagina = tamanoPagina
        };
        var eventos = await _eventoService.ObtenerEventosAsync(filtros);
        return Ok(eventos);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // GET /api/evento/{idEvento}
    // Público
    // ──────────────────────────────────────────────────────────────────────────
    /// <summary>Obtiene el detalle completo de un evento con su multimedia adjunta.</summary>
    [HttpGet("{idEvento:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> ObtenerDetalle(int idEvento)
    {
        var detalle = await _eventoService.ObtenerEventoDetalleAsync(idEvento);
        if (detalle == null) return NotFound(new { exito = false, mensaje = "Evento no encontrado" });
        return Ok(detalle);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // POST /api/evento
    // Requiere autenticación
    // ──────────────────────────────────────────────────────────────────────────
    /// <summary>Crea un nuevo evento o concierto.</summary>
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Crear([FromBody] CrearEventoDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        int idOrganizador = ObtenerIdUsuarioActualRequerido();

        var resultado = await _eventoService.CrearEventoAsync(idOrganizador, dto);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // PUT /api/evento/{idEvento}
    // Requiere autenticación (debe ser el organizador)
    // ──────────────────────────────────────────────────────────────────────────
    /// <summary>Actualiza la información de un evento propio.</summary>
    [HttpPut("{idEvento:int}")]
    [Authorize]
    public async Task<IActionResult> Actualizar(int idEvento, [FromBody] ActualizarEventoDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        int idOrganizador = ObtenerIdUsuarioActualRequerido();

        var resultado = await _eventoService.ActualizarEventoAsync(idEvento, idOrganizador, dto);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // DELETE /api/evento/{idEvento}
    // Requiere autenticación (organizador, moderador o admin)
    // ──────────────────────────────────────────────────────────────────────────
    /// <summary>Elimina un evento y su multimedia adjunta.</summary>
    [HttpDelete("{idEvento:int}")]
    [Authorize]
    public async Task<IActionResult> Eliminar(int idEvento)
    {
        int idOrganizador = ObtenerIdUsuarioActualRequerido();
        var resultado = await _eventoService.EliminarEventoAsync(idEvento, idOrganizador);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // POST /api/evento/{idEvento}/media
    // Requiere autenticación (debe ser el organizador)
    // ──────────────────────────────────────────────────────────────────────────
    /// <summary>Adjunta una foto o video a un evento propio.</summary>
    [HttpPost("{idEvento:int}/media")]
    [Authorize]
    public async Task<IActionResult> AgregarMedia(int idEvento, [FromBody] AgregarEventoMediaDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        int idOrganizador = ObtenerIdUsuarioActualRequerido();

        var resultado = await _eventoService.AgregarMediaAsync(idEvento, idOrganizador, dto);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // DELETE /api/evento/media/{idMedia}
    // Requiere autenticación (debe ser el organizador del evento)
    // ──────────────────────────────────────────────────────────────────────────
    /// <summary>Elimina un archivo multimedia de un evento propio.</summary>
    [HttpDelete("media/{idMedia:int}")]
    [Authorize]
    public async Task<IActionResult> EliminarMedia(int idMedia)
    {
        int idUsuario = ObtenerIdUsuarioActualRequerido();
        var resultado = await _eventoService.EliminarMediaAsync(idMedia, idUsuario);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Helpers privados para el id_usuario del JWT
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
