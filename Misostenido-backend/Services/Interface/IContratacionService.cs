using Misostenido.Model.DTO;

namespace Interface;

public interface IContratacionService
{
    // ── Ofertas de Servicio ───────────────────────────────────────────────────
    Task<IdMensajeResponseDto> CrearOfertaAsync(int idUsuario, CrearOfertaDto dto);
    Task<MensajeResponseDto> ActualizarOfertaAsync(int idOferta, int idUsuario, ActualizarOfertaDto dto);
    Task<MensajeResponseDto> CambiarEstadoOfertaAsync(int idOferta, int idUsuario, bool disponible);
    Task<MensajeResponseDto> EliminarOfertaAsync(int idOferta, int idUsuario);
    Task<List<OfertaResumenDto>> ObtenerOfertasAsync(FiltrosOfertaDto filtros);
    Task<OfertaDetalleDto?> ObtenerOfertaDetalleAsync(int idOferta);

    // ── Solicitudes de Contratación ───────────────────────────────────────────
    Task<IdMensajeResponseDto> CrearSolicitudAsync(int idUsuario, CrearSolicitudDto dto);
    Task<MensajeResponseDto> ActualizarSolicitudAsync(int idSolicitud, int idUsuario, ActualizarSolicitudDto dto);
    Task<MensajeResponseDto> CambiarEstadoSolicitudAsync(int idSolicitud, int idUsuario, bool abierta);
    Task<MensajeResponseDto> EliminarSolicitudAsync(int idSolicitud, int idUsuario);
    Task<List<SolicitudResumenDto>> ObtenerSolicitudesAsync(FiltrosSolicitudDto filtros);
    Task<SolicitudDetalleDto?> ObtenerSolicitudDetalleAsync(int idSolicitud);

    // ── Postulaciones ─────────────────────────────────────────────────────────
    Task<IdMensajeResponseDto> CrearPostulacionAsync(int idUsuarioEmisor, CrearPostulacionDto dto);
    Task<MensajeResponseDto> ResponderPostulacionAsync(int idPostulacion, int idUsuarioReceptor, string nuevoEstado);
    Task<List<PostulacionDto>> ObtenerPostulacionesAsync(int? idOferta, int? idSolicitud, int? idUsuarioEmisor);

    // ── Multimedia ────────────────────────────────────────────────────────────
    Task<IdMensajeResponseDto> AgregarMediaAsync(int idUsuario, AgregarContratacionMediaDto dto);
    Task<MensajeResponseDto> EliminarMediaAsync(int idContratacionMultimedia, int idUsuario);
}
