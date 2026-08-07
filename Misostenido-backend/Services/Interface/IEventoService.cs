using Misostenido.Model.DTO;

namespace Interface;

public interface IEventoService
{
    /// <summary>Crea un nuevo evento o concierto.</summary>
    Task<IdMensajeResponseDto> CrearEventoAsync(int idOrganizador, CrearEventoDto dto);

    /// <summary>Actualiza los datos de un evento propio.</summary>
    Task<MensajeResponseDto> ActualizarEventoAsync(int idEvento, int idOrganizador, ActualizarEventoDto dto);

    /// <summary>Elimina un evento (organizador, moderador o admin).</summary>
    Task<MensajeResponseDto> EliminarEventoAsync(int idEvento, int idOrganizador);

    /// <summary>Obtiene la lista paginada de eventos con filtros opcionales.</summary>
    Task<List<EventoResumenDto>> ObtenerEventosAsync(FiltrosEventoDto filtros);

    /// <summary>Obtiene el detalle completo de un evento con su multimedia adjunta.</summary>
    Task<EventoDetalleDto?> ObtenerEventoDetalleAsync(int idEvento);

    /// <summary>Adjunta una foto o video a un evento propio.</summary>
    Task<IdMensajeResponseDto> AgregarMediaAsync(int idEvento, int idOrganizador, AgregarEventoMediaDto dto);

    /// <summary>Elimina un archivo multimedia adjunto a un evento propio.</summary>
    Task<MensajeResponseDto> EliminarMediaAsync(int idEventoMultimedia, int idUsuario);
}
