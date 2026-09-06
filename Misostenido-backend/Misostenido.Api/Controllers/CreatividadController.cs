using System.Security.Claims;
using Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Misostenido.Model.DTO;

namespace Misostenido.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class CreatividadController : ControllerBase
{
    private readonly ICreatividadService _creatividadService;

    public CreatividadController(ICreatividadService creatividadService)
    {
        _creatividadService = creatividadService;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 1. GET /api/creatividad/categorias
    // Público
    // ──────────────────────────────────────────────────────────────────────────
    /// <summary>Obtiene la lista de categorías activas del módulo de Creatividad.</summary>
    [HttpGet("categorias")]
    [AllowAnonymous]
    public async Task<IActionResult> ObtenerCategorias()
    {
        var categorias = await _creatividadService.ObtenerCategoriasAsync();
        return Ok(categorias);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 2. GET /api/creatividad/negocios
    // Público
    // ──────────────────────────────────────────────────────────────────────────
    /// <summary>Lista los negocios con filtros opcionales de categoría, ciudad, búsqueda, verificación, destacados y orden.</summary>
    [HttpGet("negocios")]
    [AllowAnonymous]
    public async Task<IActionResult> ListarNegocios(
        [FromQuery] int? idCategoria,
        [FromQuery] string? ciudad,
        [FromQuery] string? busqueda,
        [FromQuery] bool soloVerificados = false,
        [FromQuery] bool soloDestacados = false,
        [FromQuery] string orden = "RECIENTES",
        [FromQuery] int pagina = 1,
        [FromQuery] int tamPagina = 12)
    {
        var filtros = new FiltrosNegocioDto
        {
            IdCategoria     = idCategoria,
            Ciudad          = ciudad,
            Busqueda        = busqueda,
            SoloVerificados = soloVerificados,
            SoloDestacados  = soloDestacados,
            Orden           = orden,
            Pagina          = pagina,
            TamPagina       = tamPagina
        };
        var negocios = await _creatividadService.ListarNegociosAsync(filtros);
        return Ok(negocios);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 3. GET /api/creatividad/negocios/{idNegocio}
    // Público (con soporte de token opcional para 'es_favorito')
    // ──────────────────────────────────────────────────────────────────────────
    /// <summary>Obtiene el detalle completo de un negocio (incluyendo multimedia, cursos y tags).</summary>
    [HttpGet("negocios/{idNegocio:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> ObtenerDetalle(int idNegocio)
    {
        int? idUsuario = ObtenerIdUsuarioActual();
        var detalle = await _creatividadService.ObtenerNegocioDetalleAsync(idNegocio, idUsuario);
        if (detalle == null) return NotFound(new { exito = false, mensaje = "Negocio no encontrado" });
        return Ok(detalle);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 4. POST /api/creatividad/negocios
    // Requiere autenticación
    // ──────────────────────────────────────────────────────────────────────────
    /// <summary>Registra un nuevo negocio asignando al usuario autenticado como dueño.</summary>
    [HttpPost("negocios")]
    [Authorize]
    public async Task<IActionResult> Crear([FromBody] CrearNegocioDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        int idUsuario = ObtenerIdUsuarioActualRequerido();

        var resultado = await _creatividadService.CrearNegocioAsync(idUsuario, dto);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 5. PUT /api/creatividad/negocios/{idNegocio}
    // Requiere autenticación (dueño o admin)
    // ──────────────────────────────────────────────────────────────────────────
    /// <summary>Actualiza la información de un negocio propio (o por un Administrador).</summary>
    [HttpPut("negocios/{idNegocio:int}")]
    [Authorize]
    public async Task<IActionResult> Actualizar(int idNegocio, [FromBody] ActualizarNegocioDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        int idUsuario = ObtenerIdUsuarioActualRequerido();

        var resultado = await _creatividadService.ActualizarNegocioAsync(idNegocio, idUsuario, dto);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 6. DELETE /api/creatividad/negocios/{idNegocio}
    // Requiere autenticación (dueño o admin)
    // ──────────────────────────────────────────────────────────────────────────
    /// <summary>Desactiva / elimina un negocio propio (o por un Administrador).</summary>
    [HttpDelete("negocios/{idNegocio:int}")]
    [Authorize]
    public async Task<IActionResult> Eliminar(int idNegocio)
    {
        int idUsuario = ObtenerIdUsuarioActualRequerido();
        var resultado = await _creatividadService.EliminarNegocioAsync(idNegocio, idUsuario);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 7. POST /api/creatividad/negocios/{idNegocio}/favorito
    // Requiere autenticación
    // ──────────────────────────────────────────────────────────────────────────
    /// <summary>Alterna el estado de favorito (guarda o elimina de favoritos) para el usuario autenticado.</summary>
    [HttpPost("negocios/{idNegocio:int}/favorito")]
    [Authorize]
    public async Task<IActionResult> ToggleFavorito(int idNegocio)
    {
        int idUsuario = ObtenerIdUsuarioActualRequerido();
        var resultado = await _creatividadService.ToggleFavoritoAsync(idUsuario, idNegocio);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 8. GET /api/creatividad/favoritos
    // Requiere autenticación
    // ──────────────────────────────────────────────────────────────────────────
    /// <summary>Obtiene la lista de negocios guardados en favoritos por el usuario autenticado.</summary>
    [HttpGet("favoritos")]
    [Authorize]
    public async Task<IActionResult> ObtenerFavoritos()
    {
        int idUsuario = ObtenerIdUsuarioActualRequerido();
        var favoritos = await _creatividadService.ObtenerFavoritosAsync(idUsuario);
        return Ok(favoritos);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 9. POST /api/creatividad/negocios/{idNegocio}/resenas
    // Requiere autenticación
    // ──────────────────────────────────────────────────────────────────────────
    /// <summary>Agrega una reseña y calificación (1-5) a un negocio.</summary>
    [HttpPost("negocios/{idNegocio:int}/resenas")]
    [Authorize]
    public async Task<IActionResult> CrearResena(int idNegocio, [FromBody] CrearResenaDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        int idUsuario = ObtenerIdUsuarioActualRequerido();

        var resultado = await _creatividadService.CrearResenaAsync(idNegocio, idUsuario, dto);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 10. GET /api/creatividad/negocios/{idNegocio}/resenas
    // Público
    // ──────────────────────────────────────────────────────────────────────────
    /// <summary>Obtiene las reseñas paginadas de un negocio.</summary>
    [HttpGet("negocios/{idNegocio:int}/resenas")]
    [AllowAnonymous]
    public async Task<IActionResult> ObtenerResenas(
        int idNegocio,
        [FromQuery] int pagina = 1,
        [FromQuery] int tamPagina = 10)
    {
        var resenas = await _creatividadService.ObtenerResenasAsync(idNegocio, pagina, tamPagina);
        return Ok(resenas);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 11. POST /api/creatividad/negocios/{idNegocio}/multimedia
    // Requiere autenticación
    // ──────────────────────────────────────────────────────────────────────────
    /// <summary>Agrega una foto o video a la galería del negocio.</summary>
    [HttpPost("negocios/{idNegocio:int}/multimedia")]
    [Authorize]
    public async Task<IActionResult> AgregarMultimedia(int idNegocio, [FromBody] AgregarNegocioMultimediaDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var resultado = await _creatividadService.AgregarMultimediaAsync(idNegocio, dto);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 12. POST /api/creatividad/negocios/{idNegocio}/tags
    // Requiere autenticación
    // ──────────────────────────────────────────────────────────────────────────
    /// <summary>Agrega una etiqueta/tag a un negocio para mejorar su búsqueda.</summary>
    [HttpPost("negocios/{idNegocio:int}/tags")]
    [Authorize]
    public async Task<IActionResult> AgregarTag(int idNegocio, [FromBody] AgregarTagDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Tag)) return BadRequest(new { exito = false, mensaje = "El tag es requerido" });
        var resultado = await _creatividadService.AgregarTagAsync(idNegocio, dto.Tag.Trim());
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 13. POST /api/creatividad/negocios/{idNegocio}/cursos
    // Requiere autenticación
    // ──────────────────────────────────────────────────────────────────────────
    /// <summary>Crea un nuevo curso ofertado por un negocio educativo o academia.</summary>
    [HttpPost("negocios/{idNegocio:int}/cursos")]
    [Authorize]
    public async Task<IActionResult> CrearCurso(int idNegocio, [FromBody] CrearCursoCreatividadDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var resultado = await _creatividadService.CrearCursoAsync(idNegocio, dto);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    /// <summary>Crea un curso / video clase independiente (sin necesidad de negocio asociado).</summary>
    [HttpPost("cursos")]
    [Authorize]
    public async Task<IActionResult> CrearCursoIndependiente([FromBody] CrearCursoCreatividadDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var resultado = await _creatividadService.CrearCursoAsync(dto.IdNegocio, dto);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    /// <summary>Lista todos los cursos y video clases (incluye independientes y de negocios educativos).</summary>
    [HttpGet("cursos")]
    [AllowAnonymous]
    public async Task<IActionResult> ListarCursos(
        [FromQuery] string? busqueda = null,
        [FromQuery] bool soloGratis = false,
        [FromQuery] string? nivel = null)
    {
        var cursos = await _creatividadService.ListarCursosAsync(busqueda, soloGratis, nivel);
        return Ok(cursos);
    }



    // ──────────────────────────────────────────────────────────────────────────
    // 14. GET /api/creatividad/buscar
    // Público
    // ──────────────────────────────────────────────────────────────────────────
    /// <summary>Búsqueda global predictiva por nombre, tags, servicios, instrumentos o cursos.</summary>
    [HttpGet("buscar")]
    [AllowAnonymous]
    public async Task<IActionResult> Buscar(
        [FromQuery] string termino,
        [FromQuery] int limite = 20)
    {
        if (string.IsNullOrWhiteSpace(termino)) return Ok(new List<NegocioBusquedaDto>());
        var resultados = await _creatividadService.BusquedaGlobalAsync(termino.Trim(), limite);
        return Ok(resultados);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 15. GET /api/creatividad/categoria/{slug}
    // Público
    // ──────────────────────────────────────────────────────────────────────────
    /// <summary>Obtiene los negocios de una categoría filtrando directamente por su slug (ej: 'tiendas', 'estudios', 'educacion').</summary>
    [HttpGet("categoria/{slug}")]
    [AllowAnonymous]
    public async Task<IActionResult> ObtenerPorSlug(
        string slug,
        [FromQuery] int pagina = 1,
        [FromQuery] int tamPagina = 12)
    {
        var resultados = await _creatividadService.ObtenerPorSlugAsync(slug, pagina, tamPagina);
        return Ok(resultados);
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
