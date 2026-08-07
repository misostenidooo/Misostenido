namespace Misostenido.Model.DTO;

// ──────────────────────────────────────────────────────────────────────────────
// OFERTAS DE SERVICIO
// ──────────────────────────────────────────────────────────────────────────────

public class CrearOfertaDto
{
    public string Titulo { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string? GeneroMusical { get; set; }
    public decimal? TarifaAproximada { get; set; }
    public string? Ubicacion { get; set; }
}

public class ActualizarOfertaDto
{
    public string Titulo { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string? GeneroMusical { get; set; }
    public decimal? TarifaAproximada { get; set; }
    public string? Ubicacion { get; set; }
    public bool Disponible { get; set; } = true;
}

public class CambiarEstadoOfertaDto
{
    public bool Disponible { get; set; }
}

public class FiltrosOfertaDto
{
    public string? Busqueda { get; set; }
    public string? GeneroMusical { get; set; }
    public string? Ubicacion { get; set; }
    public decimal? TarifaMax { get; set; }
    public int Pagina { get; set; } = 1;
    public int TamanoPagina { get; set; } = 10;
}

public class OfertaResumenDto
{
    public int IdOfertaServicio { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string? GeneroMusical { get; set; }
    public decimal? TarifaAproximada { get; set; }
    public string? Ubicacion { get; set; }
    public bool Disponible { get; set; }
    public DateTime FechaPublicacion { get; set; }
    public int ArtistaId { get; set; }
    public string ArtistaNombre { get; set; } = string.Empty;
    public string ArtistaTipo { get; set; } = string.Empty;
    public string? FotoPerfilUrl { get; set; }
    public bool ArtistaVerificado { get; set; }
    public int TotalMedia { get; set; }
}

public class ContratacionMediaDto
{
    public int IdContratacionMultimedia { get; set; }
    public int? IdOferta { get; set; }
    public int? IdSolicitud { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public DateTime FechaSubida { get; set; }
}

public class OfertaDetalleDto
{
    public int IdOfertaServicio { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string? GeneroMusical { get; set; }
    public decimal? TarifaAproximada { get; set; }
    public string? Ubicacion { get; set; }
    public bool Disponible { get; set; }
    public DateTime FechaPublicacion { get; set; }
    public int ArtistaId { get; set; }
    public string ArtistaNombre { get; set; } = string.Empty;
    public string? ArtistaEmail { get; set; }
    public string ArtistaTipo { get; set; } = string.Empty;
    public string? FotoPerfilUrl { get; set; }
    public bool ArtistaVerificado { get; set; }
    public List<ContratacionMediaDto> Media { get; set; } = [];
}

// ──────────────────────────────────────────────────────────────────────────────
// SOLICITUDES DE CONTRATACIÓN
// ──────────────────────────────────────────────────────────────────────────────

public class CrearSolicitudDto
{
    public string Titulo { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public DateTime? FechaEvento { get; set; }
    public decimal? Presupuesto { get; set; }
    public string? Ubicacion { get; set; }
}

public class ActualizarSolicitudDto
{
    public string Titulo { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public DateTime? FechaEvento { get; set; }
    public decimal? Presupuesto { get; set; }
    public string? Ubicacion { get; set; }
    public bool Abierta { get; set; } = true;
}

public class CambiarEstadoSolicitudDto
{
    public bool Abierta { get; set; }
}

public class FiltrosSolicitudDto
{
    public string? Busqueda { get; set; }
    public string? Ubicacion { get; set; }
    public decimal? PresupuestoMin { get; set; }
    public int Pagina { get; set; } = 1;
    public int TamanoPagina { get; set; } = 10;
}

public class SolicitudResumenDto
{
    public int IdSolicitudContratacion { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public DateTime? FechaEvento { get; set; }
    public decimal? Presupuesto { get; set; }
    public string? Ubicacion { get; set; }
    public bool Abierta { get; set; }
    public DateTime FechaPublicacion { get; set; }
    public int ContratanteId { get; set; }
    public string ContratanteNombre { get; set; } = string.Empty;
    public string ContratanteTipo { get; set; } = string.Empty;
    public string? FotoPerfilUrl { get; set; }
    public int TotalPostulaciones { get; set; }
}

public class SolicitudDetalleDto
{
    public int IdSolicitudContratacion { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public DateTime? FechaEvento { get; set; }
    public decimal? Presupuesto { get; set; }
    public string? Ubicacion { get; set; }
    public bool Abierta { get; set; }
    public DateTime FechaPublicacion { get; set; }
    public int ContratanteId { get; set; }
    public string ContratanteNombre { get; set; } = string.Empty;
    public string? ContratanteEmail { get; set; }
    public string? FotoPerfilUrl { get; set; }
    public List<ContratacionMediaDto> Media { get; set; } = [];
}

// ──────────────────────────────────────────────────────────────────────────────
// POSTULACIONES
// ──────────────────────────────────────────────────────────────────────────────

public class CrearPostulacionDto
{
    public int? IdOferta { get; set; }
    public int? IdSolicitud { get; set; }
    public string? Mensaje { get; set; }
}

public class ResponderPostulacionDto
{
    /// <summary>ACEPTADA | RECHAZADA</summary>
    public string NuevoEstado { get; set; } = string.Empty;
}

public class PostulacionDto
{
    public int IdPostulacion { get; set; }
    public int? IdOferta { get; set; }
    public int? IdSolicitud { get; set; }
    public string? Mensaje { get; set; }
    public string Estado { get; set; } = string.Empty;
    public DateTime Fecha { get; set; }
    public int EmisorId { get; set; }
    public string EmisorNombre { get; set; } = string.Empty;
    public string? EmisorEmail { get; set; }
    public string? EmisorFoto { get; set; }
    public string EmisorTipo { get; set; } = string.Empty;
    public string? OfertaTitulo { get; set; }
    public string? SolicitudTitulo { get; set; }
}

// ──────────────────────────────────────────────────────────────────────────────
// MULTIMEDIA DE CONTRATACIÓN
// ──────────────────────────────────────────────────────────────────────────────

public class AgregarContratacionMediaDto
{
    public int? IdOferta { get; set; }
    public int? IdSolicitud { get; set; }
    /// <summary>FOTO | VIDEO</summary>
    public string Tipo { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
}
