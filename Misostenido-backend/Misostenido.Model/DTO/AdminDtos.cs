namespace Misostenido.Model.DTO;

// ── DTO: Estadísticas Generales de Administración ──────────────────────────────
public class EstadisticasAdminDto
{
    public int TotalUsuarios { get; set; }
    public int TotalIndividuales { get; set; }
    public int TotalGrupos { get; set; }
    public int TotalEscuelas { get; set; }
    public int TotalVerificados { get; set; }
    public int TotalPublicaciones { get; set; }
    public int TotalOfertasActivas { get; set; }
    public int TotalSolicitudesAbiertas { get; set; }
    public int TotalEventosProximos { get; set; }
    public int TotalReportesPendientes { get; set; }
}

// ── DTO: Crear Reporte de Contenido ────────────────────────────────────────────
public class CrearReporteDto
{
    /// <summary>PUBLICACION | USUARIO | EVENTO | OFERTA | SOLICITUD</summary>
    public string TipoContenido { get; set; } = string.Empty;
    public int IdContenidoReportado { get; set; }
    public string Motivo { get; set; } = string.Empty;
}

// ── DTO: Reporte de Contenido ──────────────────────────────────────────────────
public class ReporteDto
{
    public int IdReporte { get; set; }
    public string TipoContenido { get; set; } = string.Empty;
    public int IdContenidoReportado { get; set; }
    public string Motivo { get; set; } = string.Empty;
    public bool Resuelto { get; set; }
    public DateTime Fecha { get; set; }
    public int ReportadorId { get; set; }
    public string ReportadorNombre { get; set; } = string.Empty;
    public string ReportadorEmail { get; set; } = string.Empty;
}

// ── DTO: Resolver Reporte ──────────────────────────────────────────────────────
public class ResolverReporteDto
{
    public string? AccionTomada { get; set; }
}

// ── DTO: Registro de Log de Auditoría ─────────────────────────────────────────
public class LogAuditoriaDto
{
    public int IdLogAuditoria { get; set; }
    public int? IdUsuario { get; set; }
    public string? UsuarioNombre { get; set; }
    public string Accion { get; set; } = string.Empty;
    public string? TablaAfectada { get; set; }
    public int? IdRegistro { get; set; }
    public string? Detalle { get; set; }
    public DateTime Fecha { get; set; }
}

// ── DTO: Filtros para consulta de Log de Auditoría ────────────────────────────
public class FiltrosAuditoriaDto
{
    public int? IdUsuario { get; set; }
    public string? Accion { get; set; }
    public int Limite { get; set; } = 100;
}
