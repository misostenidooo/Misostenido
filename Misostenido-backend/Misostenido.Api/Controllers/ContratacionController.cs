using System.Security.Claims;
using Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Misostenido.Model.DTO;

namespace Misostenido.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class ContratacionController : ControllerBase
{
    private readonly IContratacionService _contratacionService;

    public ContratacionController(IContratacionService contratacionService)
    {
        _contratacionService = contratacionService;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // OFERTAS DE SERVICIO
    // ══════════════════════════════════════════════════════════════════════════

    /// <summary>Obtiene la lista paginada de ofertas de servicio disponibles con filtros opcionales.</summary>
    [HttpGet("ofertas")]
    [AllowAnonymous]
    public async Task<IActionResult> ObtenerOfertas(
        [FromQuery] string? busqueda,
        [FromQuery] string? generoMusical,
        [FromQuery] string? ubicacion,
        [FromQuery] decimal? tarifaMax,
        [FromQuery] int pagina = 1,
        [FromQuery] int tamanoPagina = 10)
    {
        var filtros = new FiltrosOfertaDto
        {
            Busqueda = busqueda, GeneroMusical = generoMusical,
            Ubicacion = ubicacion, TarifaMax = tarifaMax,
            Pagina = pagina, TamanoPagina = tamanoPagina
        };
        var lista = await _contratacionService.ObtenerOfertasAsync(filtros);
        return Ok(lista);
    }

    /// <summary>Obtiene el detalle completo de una oferta de servicio con su multimedia adjunta.</summary>
    [HttpGet("ofertas/{idOferta:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> ObtenerOfertaDetalle(int idOferta)
    {
        var detalle = await _contratacionService.ObtenerOfertaDetalleAsync(idOferta);
        if (detalle == null) return NotFound(new { exito = false, mensaje = "Oferta no encontrada" });
        return Ok(detalle);
    }

    /// <summary>Crea una nueva oferta de servicio para el artista autenticado.</summary>
    [HttpPost("ofertas")]
    [Authorize]
    public async Task<IActionResult> CrearOferta([FromBody] CrearOfertaDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        int id = ObtenerIdUsuarioActualRequerido();
        var resultado = await _contratacionService.CrearOfertaAsync(id, dto);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    /// <summary>Actualiza los datos de una oferta de servicio propia.</summary>
    [HttpPut("ofertas/{idOferta:int}")]
    [Authorize]
    public async Task<IActionResult> ActualizarOferta(int idOferta, [FromBody] ActualizarOfertaDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        int id = ObtenerIdUsuarioActualRequerido();
        var resultado = await _contratacionService.ActualizarOfertaAsync(idOferta, id, dto);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    /// <summary>Activa o desactiva la disponibilidad de una oferta de servicio propia.</summary>
    [HttpPatch("ofertas/{idOferta:int}/estado")]
    [Authorize]
    public async Task<IActionResult> CambiarEstadoOferta(int idOferta, [FromBody] CambiarEstadoOfertaDto dto)
    {
        int id = ObtenerIdUsuarioActualRequerido();
        var resultado = await _contratacionService.CambiarEstadoOfertaAsync(idOferta, id, dto.Disponible);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    /// <summary>Elimina una oferta de servicio propia con toda su multimedia y postulaciones.</summary>
    [HttpDelete("ofertas/{idOferta:int}")]
    [Authorize]
    public async Task<IActionResult> EliminarOferta(int idOferta)
    {
        int id = ObtenerIdUsuarioActualRequerido();
        var resultado = await _contratacionService.EliminarOfertaAsync(idOferta, id);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // SOLICITUDES DE CONTRATACIÓN
    // ══════════════════════════════════════════════════════════════════════════

    /// <summary>Obtiene la lista paginada de solicitudes de contratación abiertas.</summary>
    [HttpGet("solicitudes")]
    [AllowAnonymous]
    public async Task<IActionResult> ObtenerSolicitudes(
        [FromQuery] string? busqueda,
        [FromQuery] string? ubicacion,
        [FromQuery] decimal? presupuestoMin,
        [FromQuery] int pagina = 1,
        [FromQuery] int tamanoPagina = 10)
    {
        var filtros = new FiltrosSolicitudDto
        {
            Busqueda = busqueda, Ubicacion = ubicacion,
            PresupuestoMin = presupuestoMin, Pagina = pagina, TamanoPagina = tamanoPagina
        };
        var lista = await _contratacionService.ObtenerSolicitudesAsync(filtros);
        return Ok(lista);
    }

    /// <summary>Obtiene el detalle completo de una solicitud de contratación con multimedia adjunta.</summary>
    [HttpGet("solicitudes/{idSolicitud:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> ObtenerSolicitudDetalle(int idSolicitud)
    {
        var detalle = await _contratacionService.ObtenerSolicitudDetalleAsync(idSolicitud);
        if (detalle == null) return NotFound(new { exito = false, mensaje = "Solicitud no encontrada" });
        return Ok(detalle);
    }

    /// <summary>Crea una nueva solicitud de contratación (el contratante busca artista).</summary>
    [HttpPost("solicitudes")]
    [Authorize]
    public async Task<IActionResult> CrearSolicitud([FromBody] CrearSolicitudDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        int id = ObtenerIdUsuarioActualRequerido();
        var resultado = await _contratacionService.CrearSolicitudAsync(id, dto);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    /// <summary>Actualiza los datos de una solicitud de contratación propia.</summary>
    [HttpPut("solicitudes/{idSolicitud:int}")]
    [Authorize]
    public async Task<IActionResult> ActualizarSolicitud(int idSolicitud, [FromBody] ActualizarSolicitudDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        int id = ObtenerIdUsuarioActualRequerido();
        var resultado = await _contratacionService.ActualizarSolicitudAsync(idSolicitud, id, dto);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    /// <summary>Abre o cierra una solicitud de contratación propia.</summary>
    [HttpPatch("solicitudes/{idSolicitud:int}/estado")]
    [Authorize]
    public async Task<IActionResult> CambiarEstadoSolicitud(int idSolicitud, [FromBody] CambiarEstadoSolicitudDto dto)
    {
        int id = ObtenerIdUsuarioActualRequerido();
        var resultado = await _contratacionService.CambiarEstadoSolicitudAsync(idSolicitud, id, dto.Abierta);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    /// <summary>Elimina una solicitud de contratación propia con toda su multimedia y postulaciones.</summary>
    [HttpDelete("solicitudes/{idSolicitud:int}")]
    [Authorize]
    public async Task<IActionResult> EliminarSolicitud(int idSolicitud)
    {
        int id = ObtenerIdUsuarioActualRequerido();
        var resultado = await _contratacionService.EliminarSolicitudAsync(idSolicitud, id);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // POSTULACIONES
    // ══════════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Envía una postulación/mensaje de interés a una oferta o solicitud.
    /// Especificar solo idOferta O idSolicitud, no ambos.
    /// </summary>
    [HttpPost("postulaciones")]
    [Authorize]
    public async Task<IActionResult> CrearPostulacion([FromBody] CrearPostulacionDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        int id = ObtenerIdUsuarioActualRequerido();
        var resultado = await _contratacionService.CrearPostulacionAsync(id, dto);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    /// <summary>
    /// El dueño de una oferta/solicitud acepta o rechaza una postulación recibida.
    /// NuevoEstado: ACEPTADA | RECHAZADA
    /// </summary>
    [HttpPut("postulaciones/{idPostulacion:int}/responder")]
    [Authorize]
    public async Task<IActionResult> ResponderPostulacion(int idPostulacion, [FromBody] ResponderPostulacionDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        int id = ObtenerIdUsuarioActualRequerido();
        var resultado = await _contratacionService.ResponderPostulacionAsync(idPostulacion, id, dto.NuevoEstado);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    /// <summary>
    /// Obtiene postulaciones filtradas.
    /// Pasa idOferta para ver las de tu oferta, idSolicitud para las de tu solicitud,
    /// o sin filtros para ver todas las tuyas como emisor.
    /// </summary>
    [HttpGet("postulaciones")]
    [Authorize]
    public async Task<IActionResult> ObtenerPostulaciones(
        [FromQuery] int? idOferta,
        [FromQuery] int? idSolicitud,
        [FromQuery] int? idEmisor)
    {
        int idActual = ObtenerIdUsuarioActualRequerido();
        string rol = User.FindFirstValue(ClaimTypes.Role) ?? "";
        bool esGestorOAuditor = rol.Equals("ADMIN", StringComparison.OrdinalIgnoreCase) 
                             || rol.Equals("MODERADOR", StringComparison.OrdinalIgnoreCase) 
                             || rol.Equals("AUDITOR", StringComparison.OrdinalIgnoreCase);

        if (esGestorOAuditor)
        {
            // Admin/Moderador/Auditor: ver todas
            var lista = await _contratacionService.ObtenerPostulacionesAsync(idOferta, idSolicitud, idEmisor, null);
            return Ok(lista);
        }

        // Usuario regular sin filtros específicos: mostrar TANTO las enviadas COMO las recibidas en sus publicaciones
        if (idOferta == null && idSolicitud == null && idEmisor == null)
        {
            // Postulaciones enviadas por este usuario
            var enviadas = await _contratacionService.ObtenerPostulacionesAsync(null, null, idActual, null);
            // Postulaciones recibidas en sus propias solicitudes/ofertas
            var recibidas = await _contratacionService.ObtenerPostulacionesAsync(null, null, null, idActual);

            // Combinar sin duplicados por id_postulacion
            var combinadas = enviadas
                .Concat(recibidas)
                .GroupBy(p => p.IdPostulacion)
                .Select(g => g.First())
                .OrderByDescending(p => p.Fecha)
                .ToList();

            return Ok(combinadas);
        }

        // Si viene filtro específico, usarlo directamente
        var resultado = await _contratacionService.ObtenerPostulacionesAsync(idOferta, idSolicitud, idEmisor, null);
        return Ok(resultado);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // MULTIMEDIA DE CONTRATACIÓN
    // ══════════════════════════════════════════════════════════════════════════

    /// <summary>Adjunta una foto o video a una oferta o solicitud de contratación propia.</summary>
    [HttpPost("media")]
    [Authorize]
    public async Task<IActionResult> AgregarMedia([FromBody] AgregarContratacionMediaDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        int id = ObtenerIdUsuarioActualRequerido();
        var resultado = await _contratacionService.AgregarMediaAsync(id, dto);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    /// <summary>Elimina un elemento multimedia adjunto a una oferta o solicitud de contratación propia.</summary>
    [HttpDelete("media/{idMedia:int}")]
    [Authorize]
    public async Task<IActionResult> EliminarMedia(int idMedia)
    {
        int id = ObtenerIdUsuarioActualRequerido();
        var resultado = await _contratacionService.EliminarMediaAsync(idMedia, id);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // CHAT & ACUERDOS EN VIVO DE NEGOCIACIÓN
    // ══════════════════════════════════════════════════════════════════════════

    /// <summary>Envía un mensaje de chat dentro del contexto de una postulación.</summary>
    [HttpPost("postulaciones/{idPostulacion:int}/mensajes")]
    [Authorize]
    public async Task<IActionResult> EnviarMensaje(int idPostulacion, [FromBody] CrearMensajeContratacionDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        if (string.IsNullOrWhiteSpace(dto.Contenido))
            return BadRequest(new { exito = false, mensaje = "El contenido del mensaje no puede estar vacío." });

        int idUsuario = ObtenerIdUsuarioActualRequerido();
        var resultado = await _contratacionService.EnviarMensajeAsync(idPostulacion, idUsuario, dto);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    /// <summary>Obtiene el historial completo de mensajes de una postulación.</summary>
    [HttpGet("postulaciones/{idPostulacion:int}/mensajes")]
    [Authorize]
    public async Task<IActionResult> ObtenerMensajes(int idPostulacion)
    {
        int idUsuario = ObtenerIdUsuarioActualRequerido();
        var mensajes = await _contratacionService.ObtenerMensajesAsync(idPostulacion, idUsuario);
        return Ok(mensajes);
    }

    /// <summary>Guarda o actualiza el pre-contrato/acuerdo digital de una postulación.</summary>
    [HttpPut("postulaciones/{idPostulacion:int}/acuerdo")]
    [Authorize]
    public async Task<IActionResult> GuardarAcuerdo(int idPostulacion, [FromBody] GuardarAcuerdoDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        int idUsuario = ObtenerIdUsuarioActualRequerido();
        var resultado = await _contratacionService.GuardarAcuerdoAsync(idPostulacion, idUsuario, dto);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    /// <summary>Obtiene los términos y firmas del acuerdo digital de una postulación.</summary>
    [HttpGet("postulaciones/{idPostulacion:int}/acuerdo")]
    [Authorize]
    public async Task<IActionResult> ObtenerAcuerdo(int idPostulacion)
    {
        int idUsuario = ObtenerIdUsuarioActualRequerido();
        var acuerdo = await _contratacionService.ObtenerAcuerdoAsync(idPostulacion, idUsuario);
        return Ok(acuerdo);
    }


    // ──────────────────────────────────────────────────────────────────────────
    // Helpers privados
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
