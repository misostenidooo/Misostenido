namespace Misostenido.Model.DTO;

// ── DTO: Crear Evento ─────────────────────────────────────────────────────────
public class CrearEventoDto
{
    public string Titulo { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string? TipoEvento { get; set; }
    public DateTime FechaEvento { get; set; }
    public string? Ubicacion { get; set; }
    public string? InfoInscripcion { get; set; }
}

// ── DTO: Actualizar Evento ────────────────────────────────────────────────────
public class ActualizarEventoDto
{
    public string Titulo { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string? TipoEvento { get; set; }
    public DateTime FechaEvento { get; set; }
    public string? Ubicacion { get; set; }
    public string? InfoInscripcion { get; set; }
}

// ── DTO: Filtros para listar eventos ─────────────────────────────────────────
public class FiltrosEventoDto
{
    public string? Busqueda { get; set; }
    public string? TipoEvento { get; set; }
    public string? Ubicacion { get; set; }
    public bool SoloProximos { get; set; } = true;
    public int Pagina { get; set; } = 1;
    public int TamanoPagina { get; set; } = 10;
}

// ── DTO: Multimedia adjunta a un evento ──────────────────────────────────────
public class EventoMediaDto
{
    public int IdEventoMultimedia { get; set; }
    public int IdEvento { get; set; }
    public string Tipo { get; set; } = string.Empty; // FOTO o VIDEO
    public string Url { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public DateTime FechaSubida { get; set; }
}

// ── DTO: Resumen de evento en lista ──────────────────────────────────────────
public class EventoResumenDto
{
    public int IdEvento { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string? TipoEvento { get; set; }
    public DateTime FechaEvento { get; set; }
    public string? Ubicacion { get; set; }
    public string? InfoInscripcion { get; set; }
    public DateTime FechaPublicacion { get; set; }
    public int OrganizadorId { get; set; }
    public string OrganizadorNombre { get; set; } = string.Empty;
    public string OrganizadorTipo { get; set; } = string.Empty;
    public string? FotoPerfilUrl { get; set; }
    public int TotalMedia { get; set; }
}

// ── DTO: Detalle completo del evento (con multimedia) ───────────────────────
public class EventoDetalleDto
{
    public int IdEvento { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string? TipoEvento { get; set; }
    public DateTime FechaEvento { get; set; }
    public string? Ubicacion { get; set; }
    public string? InfoInscripcion { get; set; }
    public DateTime FechaPublicacion { get; set; }
    public int OrganizadorId { get; set; }
    public string OrganizadorNombre { get; set; } = string.Empty;
    public string? OrganizadorEmail { get; set; }
    public string? FotoPerfilUrl { get; set; }
    public string OrganizadorTipo { get; set; } = string.Empty;
    public List<EventoMediaDto> Media { get; set; } = [];
}

// ── DTO: Agregar Multimedia al Evento ─────────────────────────────────────────
public class AgregarEventoMediaDto
{
    /// <summary>FOTO | VIDEO</summary>
    public string Tipo { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
}
