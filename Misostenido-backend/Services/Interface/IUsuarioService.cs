using Misostenido.Model.DTO;

namespace Interface;

public interface IUsuarioService
{
    // ── Perfil ────────────────────────────────────────────────────────────────
    Task<PerfilResponseDto?> ObtenerPerfilAsync(int idUsuarioPerfil, int? idVisitante = null);
    Task<MensajeResponseDto> ActualizarPerfilAsync(int idUsuario, ActualizarPerfilDto dto);

    // ── Permisos ──────────────────────────────────────────────────────────────
    Task<PermisosResponseDto> ObtenerPermisosAsync(int idUsuario);
    Task<bool> TienePermisoAsync(int idUsuario, string codigoPermiso);

    // ── Portafolio multimedia ─────────────────────────────────────────────────
    Task<IdMensajeResponseDto> SubirMediaAsync(int idUsuario, SubirMediaDto dto);
    Task<MensajeResponseDto> EliminarMediaAsync(int idContenidoMultimedia, int idUsuario);
    Task<List<MediaDto>> ObtenerMediaAsync(int idUsuario);

    // ── Integrantes de grupo ──────────────────────────────────────────────────
    Task<IdMensajeResponseDto> AgregarIntegranteAsync(int idGrupo, AgregarIntegranteDto dto);
    Task<MensajeResponseDto> EliminarIntegranteAsync(int idGrupo, int idIntegrante);
    Task<List<IntegranteDetalleDto>> ObtenerIntegrantesAsync(int idGrupo);

    // ── Cursos de escuela ─────────────────────────────────────────────────────
    Task<IdMensajeResponseDto> CrearCursoAsync(int idEscuela, CrearCursoDto dto);
    Task<MensajeResponseDto> ActualizarCursoAsync(int idEscuelaCurso, int idEscuela, ActualizarCursoDto dto);
    Task<MensajeResponseDto> EliminarCursoAsync(int idEscuelaCurso, int idEscuela);
    Task<List<CursoDetalleDto>> ObtenerCursosAsync(int idEscuela);

    // ── Admin ─────────────────────────────────────────────────────────────────
    Task<MensajeResponseDto> GestionarUsuarioAsync(int idAdmin, GestionarUsuarioDto dto);
}

