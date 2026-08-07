namespace Misostenido.Model.DTO;

// ── Request: Crear publicación ────────────────────────────────────────────────
public class CrearPublicacionRequestDto
{
    public string? Texto { get; set; }
}

// ── Request: Agregar multimedia a publicación ─────────────────────────────────
public class AgregarPublicacionMediaDto
{
    /// <summary>FOTO | VIDEO</summary>
    public string Tipo { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
}

// ── DTO: Item multimedia de publicación ───────────────────────────────────────
public class PublicacionMediaDto
{
    public int IdPublicacionMultimedia { get; set; }
    public int IdPublicacion { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
}

// ── DTO: Post del feed ────────────────────────────────────────────────────────
public class PublicacionPostDto
{
    public int IdPublicacion { get; set; }
    public string? Texto { get; set; }
    public DateTime FechaPublicacion { get; set; }
    public int AutorId { get; set; }
    public string AutorNombre { get; set; } = string.Empty;
    public string AutorTipo { get; set; } = string.Empty;
    public string? AutorFoto { get; set; }
    public bool AutorVerificado { get; set; }
    public int TotalLikes { get; set; }
    public int TotalComentarios { get; set; }
    public int TotalMultimedia { get; set; }
    public bool DioLike { get; set; }
    public List<PublicacionMediaDto> Multimedia { get; set; } = [];
}

// ── DTO: Comentario de publicación ────────────────────────────────────────────
public class PublicacionComentarioDto
{
    public int IdPublicacionComentario { get; set; }
    public int IdPublicacion { get; set; }
    public string Texto { get; set; } = string.Empty;
    public DateTime Fecha { get; set; }
    public int UsuarioId { get; set; }
    public string UsuarioNombre { get; set; } = string.Empty;
    public string? UsuarioFoto { get; set; }
    public string? TipoPerfil { get; set; }
}

// ── Request: Agregar comentario ───────────────────────────────────────────────
public class AgregarComentarioDto
{
    public string Texto { get; set; } = string.Empty;
}

// ── Response: Detalle de post con multimedia y comentarios ─────────────────────
public class PublicacionDetalleDto
{
    public PublicacionPostDto Post { get; set; } = new();
    public List<PublicacionMediaDto> Multimedia { get; set; } = [];
    public List<PublicacionComentarioDto> Comentarios { get; set; } = [];
}

// ── Response: Toggle Like ─────────────────────────────────────────────────────
public class ToggleLikeResponseDto
{
    /// <summary>LIKED | UNLIKED | ERROR</summary>
    public string Accion { get; set; } = string.Empty;
    public int TotalLikes { get; set; }
    public string? Mensaje { get; set; }
}
