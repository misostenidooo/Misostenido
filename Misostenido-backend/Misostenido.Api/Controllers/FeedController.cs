using System.Security.Claims;
using Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Misostenido.Model.DTO;

namespace Misostenido.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class FeedController : ControllerBase
{
    private readonly IFeedService _feedService;

    public FeedController(IFeedService feedService)
    {
        _feedService = feedService;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/feed/posts
    // Requiere autenticación
    // ─────────────────────────────────────────────────────────────────────────
    /// <summary>Crea una nueva publicación en el feed público.</summary>
    [HttpPost("posts")]
    [Authorize]
    public async Task<IActionResult> CrearPublicacion([FromBody] CrearPublicacionRequestDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        int idUsuario = ObtenerIdUsuarioActualRequerido();

        var resultado = await _feedService.CrearPublicacionAsync(idUsuario, dto);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/feed/posts/{idPost}/media
    // Requiere autenticación (debe ser el autor del post)
    // ─────────────────────────────────────────────────────────────────────────
    /// <summary>Adjunta una foto o video a una publicación del feed.</summary>
    [HttpPost("posts/{idPost:int}/media")]
    [Authorize]
    public async Task<IActionResult> AgregarMedia(int idPost, [FromBody] AgregarPublicacionMediaDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        int idUsuario = ObtenerIdUsuarioActualRequerido();

        var resultado = await _feedService.AgregarMediaAsync(idPost, idUsuario, dto);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DELETE /api/feed/media/{idMedia}
    // Requiere autenticación (debe ser el autor)
    // ─────────────────────────────────────────────────────────────────────────
    /// <summary>Elimina un archivo multimedia de una publicación.</summary>
    [HttpDelete("media/{idMedia:int}")]
    [Authorize]
    public async Task<IActionResult> EliminarMedia(int idMedia)
    {
        int idUsuario = ObtenerIdUsuarioActualRequerido();
        var resultado = await _feedService.EliminarMediaAsync(idMedia, idUsuario);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DELETE /api/feed/posts/{idPost}
    // Requiere autenticación (autor, moderador o admin)
    // ─────────────────────────────────────────────────────────────────────────
    /// <summary>Elimina una publicación y todo su contenido asociado.</summary>
    [HttpDelete("posts/{idPost:int}")]
    [Authorize]
    public async Task<IActionResult> EliminarPublicacion(int idPost)
    {
        int idUsuario = ObtenerIdUsuarioActualRequerido();
        var resultado = await _feedService.EliminarPublicacionAsync(idPost, idUsuario);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/feed/posts
    // Público / Opcional Token para saber si dio like
    // ─────────────────────────────────────────────────────────────────────────
    /// <summary>Obtiene la lista paginada de publicaciones del feed con multimedia y contadores.</summary>
    [HttpGet("posts")]
    [AllowAnonymous]
    public async Task<IActionResult> ObtenerPosts(
        [FromQuery] int pagina = 1,
        [FromQuery] int tamanoPagina = 10)
    {
        int? idVisitante = ObtenerIdUsuarioActual();
        var posts = await _feedService.ObtenerPostsAsync(idVisitante, pagina, tamanoPagina);
        return Ok(posts);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/feed/posts/{idPost}
    // Público / Opcional Token
    // ─────────────────────────────────────────────────────────────────────────
    /// <summary>Obtiene el detalle completo de un post (información, fotos/videos y comentarios).</summary>
    [HttpGet("posts/{idPost:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> ObtenerPostDetalle(int idPost)
    {
        int? idVisitante = ObtenerIdUsuarioActual();
        var detalle = await _feedService.ObtenerPostDetalleAsync(idPost, idVisitante);
        if (detalle == null)
            return NotFound(new { exito = false, mensaje = "Publicación no encontrada" });

        return Ok(detalle);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/feed/posts/{idPost}/like
    // Requiere autenticación
    // ─────────────────────────────────────────────────────────────────────────
    /// <summary>Da o quita 'Me gusta' a una publicación (Toggle).</summary>
    [HttpPost("posts/{idPost:int}/like")]
    [Authorize]
    public async Task<IActionResult> ToggleLike(int idPost)
    {
        int idUsuario = ObtenerIdUsuarioActualRequerido();
        var resultado = await _feedService.ToggleLikeAsync(idPost, idUsuario);
        return resultado.Accion != "ERROR" ? Ok(resultado) : BadRequest(resultado);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/feed/posts/{idPost}/comentarios
    // Requiere autenticación
    // ─────────────────────────────────────────────────────────────────────────
    /// <summary>Publica un comentario en un post.</summary>
    [HttpPost("posts/{idPost:int}/comentarios")]
    [Authorize]
    public async Task<IActionResult> AgregarComentario(int idPost, [FromBody] AgregarComentarioDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        int idUsuario = ObtenerIdUsuarioActualRequerido();

        var resultado = await _feedService.AgregarComentarioAsync(idPost, idUsuario, dto);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DELETE /api/feed/comentarios/{idComentario}
    // Requiere autenticación (autor del comentario o dueño del post)
    // ─────────────────────────────────────────────────────────────────────────
    /// <summary>Elimina un comentario.</summary>
    [HttpDelete("comentarios/{idComentario:int}")]
    [Authorize]
    public async Task<IActionResult> EliminarComentario(int idComentario)
    {
        int idUsuario = ObtenerIdUsuarioActualRequerido();
        var resultado = await _feedService.EliminarComentarioAsync(idComentario, idUsuario);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/feed/posts/{idPost}/comentarios
    // Público
    // ─────────────────────────────────────────────────────────────────────────
    /// <summary>Obtiene la lista de comentarios de una publicación.</summary>
    [HttpGet("posts/{idPost:int}/comentarios")]
    [AllowAnonymous]
    public async Task<IActionResult> ObtenerComentarios(int idPost)
    {
        var comentarios = await _feedService.ObtenerComentariosAsync(idPost);
        return Ok(comentarios);
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
