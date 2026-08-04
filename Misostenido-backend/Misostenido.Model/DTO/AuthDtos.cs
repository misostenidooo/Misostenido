namespace Misostenido.Model.DTO;

public class RegisterRequestDto
{
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Contrasena { get; set; } = string.Empty;
    public string TipoPerfil { get; set; } = "INDIVIDUAL"; // INDIVIDUAL, GRUPO, ESCUELA
}

public class LoginRequestDto
{
    public string Email { get; set; } = string.Empty;
    public string Contrasena { get; set; } = string.Empty;
}

public class RefreshTokenRequestDto
{
    public string RefreshToken { get; set; } = string.Empty;
}

public class GoogleAuthRequestDto
{
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? FotoPerfilUrl { get; set; }
    public string TipoPerfil { get; set; } = "INDIVIDUAL";
}

public class AuthResponseDto
{
    public bool Exito { get; set; }
    public string Mensaje { get; set; } = string.Empty;
    public int IdUsuario { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string TipoPerfil { get; set; } = string.Empty;
    public string? FotoPerfilUrl { get; set; }
    public string RolNombre { get; set; } = string.Empty;
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime FechaExpiracion { get; set; }
}
