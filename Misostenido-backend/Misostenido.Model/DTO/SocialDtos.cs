namespace Misostenido.Model.DTO;

// ── DTO: Respuesta de Toggle Seguir ─────────────────────────────────────────
public class ToggleSeguirResponseDto
{
    /// <summary>FOLLOWED | UNFOLLOWED | ERROR</summary>
    public string Accion { get; set; } = string.Empty;
    public string Mensaje { get; set; } = string.Empty;
}

// ── DTO: Respuesta de Verificación de Seguimiento ────────────────────────────
public class EsSeguidorResponseDto
{
    public bool LoSigue { get; set; }
}

// ── DTO: Usuario en lista de Seguidores / Seguidos ───────────────────────────
public class UsuarioRedDto
{
    public int IdSeguidorRel { get; set; }
    public int IdUsuario { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? FotoPerfilUrl { get; set; }
    public string TipoPerfil { get; set; } = string.Empty;
    public string? GeneroMusical { get; set; }
    public DateTime FechaSeguimiento { get; set; }
}
