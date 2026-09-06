using System.Security.Claims;
using Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Misostenido.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class SocialController : ControllerBase
{
    private readonly ISocialService _socialService;

    public SocialController(ISocialService socialService)
    {
        _socialService = socialService;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // POST /api/social/seguir/{idUsuario}
    // Requiere autenticación
    // ──────────────────────────────────────────────────────────────────────────
    /// <summary>Sigue o deja de seguir a un perfil (Toggle).</summary>
    [HttpPost("seguir/{idUsuario:int}")]
    [Authorize]
    public async Task<IActionResult> ToggleSeguir(int idUsuario)
    {
        int idSeguidor = ObtenerIdUsuarioActualRequerido();
        var resultado = await _socialService.ToggleSeguirAsync(idUsuario, idSeguidor);
        return resultado.Accion != "ERROR" ? Ok(resultado) : BadRequest(resultado);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // GET /api/social/es-seguidor/{idUsuario}
    // Requiere autenticación (compara el usuario logueado contra el idUsuario)
    // ──────────────────────────────────────────────────────────────────────────
    /// <summary>Verifica si el usuario autenticado sigue a un perfil específico.</summary>
    [HttpGet("es-seguidor/{idUsuario:int}")]
    [Authorize]
    public async Task<IActionResult> EsSeguidor(int idUsuario)
    {
        int idSeguidor = ObtenerIdUsuarioActualRequerido();
        var resultado = await _socialService.EsSeguidorAsync(idUsuario, idSeguidor);
        return Ok(resultado);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // GET /api/social/{idUsuario}/seguidores
    // Público
    // ──────────────────────────────────────────────────────────────────────────
    /// <summary>Obtiene la lista de seguidores que tiene un perfil.</summary>
    [HttpGet("{idUsuario:int}/seguidores")]
    [AllowAnonymous]
    public async Task<IActionResult> ObtenerSeguidores(int idUsuario)
    {
        var lista = await _socialService.ObtenerSeguidoresAsync(idUsuario);
        return Ok(lista);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // GET /api/social/{idUsuario}/seguidos
    // Público
    // ──────────────────────────────────────────────────────────────────────────
    /// <summary>Obtiene la lista de perfiles a los que sigue un usuario.</summary>
    [HttpGet("{idUsuario:int}/seguidos")]
    [AllowAnonymous]
    public async Task<IActionResult> ObtenerSeguidos(int idUsuario)
    {
        var lista = await _socialService.ObtenerSeguidosAsync(idUsuario);
        return Ok(lista);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Helpers privados para obtener id_usuario desde el JWT
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
