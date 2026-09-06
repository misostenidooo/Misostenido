using Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Misostenido.Model.DTO;

namespace Misostenido.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto dto)
    {
        string ipAddress = GetClientIp();
        string userAgent = Request.Headers["User-Agent"].ToString() ?? "Unknown";

        AuthResponseDto response = await _authService.RegisterAsync(dto, ipAddress, userAgent);

        if (!response.Exito)
        {
            return BadRequest(response);
        }

        return Ok(response);
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
    {
        string ipAddress = GetClientIp();
        string userAgent = Request.Headers["User-Agent"].ToString() ?? "Unknown";

        AuthResponseDto response = await _authService.LoginAsync(dto, ipAddress, userAgent);

        if (!response.Exito)
        {
            return Unauthorized(response);
        }

        return Ok(response);
    }

    [HttpPost("refresh-token")]
    [AllowAnonymous]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequestDto dto)
    {
        string ipAddress = GetClientIp();
        string userAgent = Request.Headers["User-Agent"].ToString() ?? "Unknown";

        AuthResponseDto response = await _authService.RefreshTokenAsync(dto, ipAddress, userAgent);

        if (!response.Exito)
        {
            return Unauthorized(response);
        }

        return Ok(response);
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout([FromBody] RefreshTokenRequestDto dto)
    {
        bool resultado = await _authService.LogoutAsync(dto.RefreshToken);
        return Ok(new { exito = resultado, mensaje = "Sesión cerrada correctamente." });
    }

    [HttpPost("google")]
    [AllowAnonymous]
    public async Task<IActionResult> GoogleAuth([FromBody] GoogleAuthRequestDto dto)
    {
        string ipAddress = GetClientIp();
        string userAgent = Request.Headers["User-Agent"].ToString() ?? "Unknown";

        AuthResponseDto response = await _authService.GoogleAuthAsync(dto, ipAddress, userAgent);

        if (!response.Exito)
        {
            return BadRequest(response);
        }

        return Ok(response);
    }

    [HttpPost("cambiar-contrasena")]
    [Authorize]
    public async Task<IActionResult> CambiarContrasena([FromBody] CambiarContrasenaRequestDto dto)
    {
        var idClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(idClaim, out int idUsuario)) return Unauthorized();

        var resultado = await _authService.CambiarContrasenaAsync(idUsuario, dto);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    [HttpPost("revocar-sesiones")]
    [Authorize]
    public async Task<IActionResult> RevocarTodasLasSesiones()
    {
        var idClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(idClaim, out int idUsuario)) return Unauthorized();

        var resultado = await _authService.RevocarTodasLasSesionesAsync(idUsuario);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    [HttpPost("solicitar-recuperacion")]
    [AllowAnonymous]
    public async Task<IActionResult> SolicitarRecuperacion([FromBody] SolicitarRecuperacionRequestDto dto)
    {
        var resultado = await _authService.SolicitarRecuperacionContrasenaAsync(dto);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    [HttpPost("restablecer-contrasena")]
    [AllowAnonymous]
    public async Task<IActionResult> RestablecerContrasena([FromBody] RestablecerContrasenaRequestDto dto)
    {
        var resultado = await _authService.RestablecerContrasenaAsync(dto);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    [HttpPost("verificar-email")]
    [AllowAnonymous]
    public async Task<IActionResult> VerificarEmail([FromBody] VerificarEmailRequestDto dto)
    {
        var resultado = await _authService.VerificarEmailAsync(dto);
        return resultado.Exito ? Ok(resultado) : BadRequest(resultado);
    }

    private string GetClientIp()
    {
        if (Request.Headers.TryGetValue("X-Forwarded-For", out var forwardedFor))
        {
            return forwardedFor.ToString().Split(',')[0].Trim();
        }

        return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
    }
}
