using Misostenido.Model.DTO;

namespace Interface;

public interface IUsuarioService
{
    /// <summary>Obtiene el perfil público o propio de un usuario.</summary>
    Task<PerfilResponseDto?> ObtenerPerfilAsync(int idUsuarioPerfil, int? idVisitante = null);

    /// <summary>Edita los datos del perfil del usuario autenticado.</summary>
    Task<MensajeResponseDto> ActualizarPerfilAsync(int idUsuario, ActualizarPerfilDto dto);

    /// <summary>Obtiene los permisos del usuario desde su rol en BD.</summary>
    Task<PermisosResponseDto> ObtenerPermisosAsync(int idUsuario);

    /// <summary>Verifica si el usuario tiene un permiso específico.</summary>
    Task<bool> TienePermisoAsync(int idUsuario, string codigoPermiso);

    // ── Admin ─────────────────────────────────────────────────────────────────
    /// <summary>Gestiona estado, verificación o rol de un usuario (solo ADMIN).</summary>
    Task<MensajeResponseDto> GestionarUsuarioAsync(int idAdmin, GestionarUsuarioDto dto);
}
