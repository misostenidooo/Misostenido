namespace Misostenido.Model.DTO;

// ── Respuesta de perfil completo ──────────────────────────────────────────────
public class PerfilResponseDto
{
    public int IdUsuario { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string TipoPerfil { get; set; } = string.Empty;
    public string? Biografia { get; set; }
    public string? Ubicacion { get; set; }
    public string? GeneroMusical { get; set; }
    public string? Instrumento { get; set; }
    public string? FotoPerfilUrl { get; set; }
    public bool EmailVerificado { get; set; }
    public bool Verificado { get; set; }
    public bool Estado { get; set; }
    public DateTime FechaCreacion { get; set; }
    public string RolNombre { get; set; } = string.Empty;
    public int TotalSeguidores { get; set; }
    public int TotalSeguidos { get; set; }
    public int TotalPublicaciones { get; set; }
    public int TotalOfertasActivas { get; set; }
    public int TotalEventos { get; set; }
    public bool EsSeguidoPorVisitante { get; set; }
    public List<MediaDto> Portafolio { get; set; } = [];
    public List<IntegranteDto> Integrantes { get; set; } = [];
    public List<CursoDto> Cursos { get; set; } = [];
}

// ── Media (portafolio multimedia) ─────────────────────────────────────────────
public class MediaDto
{
    public int IdContenidoMultimedia { get; set; }
    public int IdUsuario { get; set; }
    public string Tipo { get; set; } = string.Empty;   // FOTO | VIDEO | AUDIO
    public string Url { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public DateTime FechaSubida { get; set; }
}

// ── Integrante de grupo ───────────────────────────────────────────────────────
public class IntegranteDto
{
    public int IdGrupoIntegrante { get; set; }
    public int IdIntegrante { get; set; }
    public string IntegranteNombre { get; set; } = string.Empty;
    public string? FotoPerfilUrl { get; set; }
    public string? Instrumento { get; set; }
    public string? RolEnGrupo { get; set; }
    public DateTime FechaUnion { get; set; }
}

// ── Curso de escuela ──────────────────────────────────────────────────────────
public class CursoDto
{
    public int IdEscuelaCurso { get; set; }
    public string NombreCurso { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string? Horario { get; set; }
    public decimal? Precio { get; set; }
    public bool Estado { get; set; }
    public DateTime FechaCreacion { get; set; }
}

// ── DTO para editar perfil propio ─────────────────────────────────────────────
public class ActualizarPerfilDto
{
    public string Nombre { get; set; } = string.Empty;
    public string? Biografia { get; set; }
    public string? Ubicacion { get; set; }
    public string? GeneroMusical { get; set; }
    public string? Instrumento { get; set; }
    public string? FotoPerfilUrl { get; set; }
}

// ── DTO para Admin: gestionar estado/rol/verificación de usuario ──────────────
public class GestionarUsuarioDto
{
    public int IdUsuarioDestino { get; set; }
    public bool? NuevoEstado { get; set; }
    public bool? NuevoVerificado { get; set; }
    public int? NuevoIdRol { get; set; }
}

// ── Respuesta genérica simple ─────────────────────────────────────────────────
public class MensajeResponseDto
{
    public bool Exito { get; set; }
    public string Mensaje { get; set; } = string.Empty;
}

// ── Lista de permisos del usuario ─────────────────────────────────────────────
public class PermisosResponseDto
{
    public int IdUsuario { get; set; }
    public List<string> Permisos { get; set; } = [];
}
