namespace Misostenido.Model.DTO;

public class UsuarioDto
{
    public int IdUsuario { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string TipoPerfil { get; set; } = string.Empty; // INDIVIDUAL, GRUPO, ESCUELA
    public string? Biografia { get; set; }
    public string? Ubicacion { get; set; }
    public string? GeneroMusical { get; set; }
    public string? Instrumento { get; set; }
    public string? FotoPerfilUrl { get; set; }
    public bool EmailVerificado { get; set; }
    public bool Verificado { get; set; }
    public bool Estado { get; set; }
    public int IdRol { get; set; }
    public string RolNombre { get; set; } = string.Empty;
    public DateTime FechaCreacion { get; set; }
}
