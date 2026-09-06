using Misostenido.Model.DTO;

namespace Interface;

public interface ICreatividadService
{
    Task<List<CategoriaCreatividadDto>> ObtenerCategoriasAsync();
    Task<List<NegocioResumenDto>> ListarNegociosAsync(FiltrosNegocioDto filtros);
    Task<NegocioDetalleDto?> ObtenerNegocioDetalleAsync(int idNegocio, int? idUsuario);
    Task<IdMensajeResponseDto> CrearNegocioAsync(int? idUsuarioDueno, CrearNegocioDto dto);
    Task<MensajeResponseDto> ActualizarNegocioAsync(int idNegocio, int idUsuario, ActualizarNegocioDto dto);
    Task<MensajeResponseDto> EliminarNegocioAsync(int idNegocio, int idUsuario);
    Task<ToggleFavoritoResponseDto> ToggleFavoritoAsync(int idUsuario, int idNegocio);
    Task<List<NegocioFavoritoDto>> ObtenerFavoritosAsync(int idUsuario);
    Task<IdMensajeResponseDto> CrearResenaAsync(int idNegocio, int idUsuario, CrearResenaDto dto);
    Task<List<NegocioResenaDto>> ObtenerResenasAsync(int idNegocio, int pagina = 1, int tamPagina = 10);
    Task<IdMensajeResponseDto> AgregarMultimediaAsync(int idNegocio, AgregarNegocioMultimediaDto dto);
    Task<MensajeResponseDto> AgregarTagAsync(int idNegocio, string tag);
    Task<IdMensajeResponseDto> CrearCursoAsync(int? idNegocio, CrearCursoCreatividadDto dto);
    Task<List<CursoCreatividadDto>> ListarCursosAsync(string? busqueda, bool soloGratis, string? nivel);
    Task<List<NegocioBusquedaDto>> BusquedaGlobalAsync(string termino, int limite = 20);
    Task<List<NegocioPorSlugDto>> ObtenerPorSlugAsync(string slug, int pagina = 1, int tamPagina = 12);
}
