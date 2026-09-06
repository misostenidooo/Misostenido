using Misostenido.Model.DTO;

namespace Interface;

public interface ISocialService
{
    /// <summary>Sigue o deja de seguir a un usuario (Toggle).</summary>
    Task<ToggleSeguirResponseDto> ToggleSeguirAsync(int idUsuarioObjetivo, int idSeguidor);

    /// <summary>Verifica si el usuario seguidor sigue al usuario objetivo.</summary>
    Task<EsSeguidorResponseDto> EsSeguidorAsync(int idUsuarioObjetivo, int idSeguidor);

    /// <summary>Obtiene la lista de seguidores de un usuario.</summary>
    Task<List<UsuarioRedDto>> ObtenerSeguidoresAsync(int idUsuario);

    /// <summary>Obtiene la lista de usuarios seguidos por un usuario.</summary>
    Task<List<UsuarioRedDto>> ObtenerSeguidosAsync(int idSeguidor);
}
