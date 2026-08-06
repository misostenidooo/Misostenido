namespace Misostenido.Model.DTO;

// ── DTOs para Artista/Usuario destacado o buscado ────────────────────────────
public class ArtistaDestacadoDto
{
    public int IdUsuario { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string TipoPerfil { get; set; } = string.Empty;
    public string? Biografia { get; set; }
    public string? Ubicacion { get; set; }
    public string? GeneroMusical { get; set; }
    public string? Instrumento { get; set; }
    public string? FotoPerfilUrl { get; set; }
    public bool Verificado { get; set; }
    public int TotalSeguidores { get; set; }
}

// ── DTO para Publicación en la página de inicio ───────────────────────────────
public class PublicacionInicioDto
{
    public int IdPublicacion { get; set; }
    public string? Texto { get; set; }
    public DateTime FechaPublicacion { get; set; }
    public int IdUsuario { get; set; }
    public string AutorNombre { get; set; } = string.Empty;
    public string AutorTipo { get; set; } = string.Empty;
    public string? AutorFoto { get; set; }
    public bool AutorVerificado { get; set; }
    public int TotalLikes { get; set; }
    public int TotalComentarios { get; set; }
}

// ── DTO para Evento destacado o buscado ───────────────────────────────────────
public class EventoInicioDto
{
    public int IdEvento { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string? TipoEvento { get; set; }
    public DateTime FechaEvento { get; set; }
    public string? Ubicacion { get; set; }
    public int OrganizadorId { get; set; }
    public string OrganizadorNombre { get; set; } = string.Empty;
    public string? OrganizadorFoto { get; set; }
}

// ── DTO para Oferta de Servicio buscada ───────────────────────────────────────
public class OfertaServicioInicioDto
{
    public int IdOfertaServicio { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string? GeneroMusical { get; set; }
    public decimal? TarifaAproximada { get; set; }
    public string? Ubicacion { get; set; }
    public DateTime FechaPublicacion { get; set; }
    public int IdUsuario { get; set; }
    public string ArtistaNombre { get; set; } = string.Empty;
    public string? FotoPerfilUrl { get; set; }
}

// ── Respuesta completa de GET /api/inicio/destacados ─────────────────────────
public class InicioDestacadosResponseDto
{
    public List<ArtistaDestacadoDto> ArtistasDestacados { get; set; } = [];
    public List<PublicacionInicioDto> PublicacionesRecientes { get; set; } = [];
    public List<EventoInicioDto> EventosProximos { get; set; } = [];
}

// ── Parámetros de búsqueda para GET /api/inicio/buscar ───────────────────────
public class BuscarGlobalRequestDto
{
    public string? Busqueda { get; set; }
    public string? TipoPerfil { get; set; }
    public string? GeneroMusical { get; set; }
}

// ── Respuesta completa de GET /api/inicio/buscar ─────────────────────────────
public class InicioBusquedaGlobalResponseDto
{
    public List<ArtistaDestacadoDto> Usuarios { get; set; } = [];
    public List<EventoInicioDto> Eventos { get; set; } = [];
    public List<OfertaServicioInicioDto> OfertasServicio { get; set; } = [];
}
