using Misostenido.Model.DTO;

namespace Interface;

public interface IAdminService
{
    /// <summary>Obtiene las estadísticas generales del sistema para el panel de administración.</summary>
    Task<EstadisticasAdminDto> ObtenerEstadisticasAsync();

    /// <summary>Modifica el estado, verificación o rol de un usuario (solo Administradores).</summary>
    Task<MensajeResponseDto> GestionarUsuarioAsync(int idAdmin, int idUsuarioDestino, GestionarUsuarioDto dto);

    /// <summary>Crea un reporte sobre una publicación, usuario, evento, oferta o solicitud.</summary>
    Task<IdMensajeResponseDto> CrearReporteAsync(int idUsuarioReporta, CrearReporteDto dto);

    /// <summary>Obtiene la lista de reportes recibidos (moderadores y administradores).</summary>
    Task<List<ReporteDto>> ObtenerReportesAsync(bool soloPendientes = true);

    /// <summary>Marca un reporte como resuelto y registra la acción en auditoría.</summary>
    Task<MensajeResponseDto> ResolverReporteAsync(int idAdmin, int idReporte, ResolverReporteDto dto);

    /// <summary>Consulta la bitácora / log de auditoría del sistema.</summary>
    Task<List<LogAuditoriaDto>> ObtenerLogAuditoriaAsync(FiltrosAuditoriaDto filtros);
}
