using Misostenido.Model.DTO;

namespace Interface;

public interface IInicioService
{
    /// <summary>Obtiene los destacados de la página de inicio (sin necesidad de login).</summary>
    Task<InicioDestacadosResponseDto> ObtenerDestacadosAsync();

    /// <summary>Realiza una búsqueda global por texto, tipo de perfil o género musical.</summary>
    Task<InicioBusquedaGlobalResponseDto> BuscarGlobalAsync(BuscarGlobalRequestDto dto);
}
