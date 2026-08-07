using Misostenido.Model.DTO;

namespace Interface;

public interface IFeedService
{
    /// <summary>Crea una nueva publicación en el feed.</summary>
    Task<IdMensajeResponseDto> CrearPublicacionAsync(int idUsuario, CrearPublicacionRequestDto dto);

    /// <summary>Adjunta una foto o video a una publicación existente.</summary>
    Task<IdMensajeResponseDto> AgregarMediaAsync(int idPublicacion, int idUsuario, AgregarPublicacionMediaDto dto);

    /// <summary>Elimina un archivo multimedia de una publicación.</summary>
    Task<MensajeResponseDto> EliminarMediaAsync(int idPublicacionMultimedia, int idUsuario);

    /// <summary>Elimina una publicación (solo el autor, moderador o admin).</summary>
    Task<MensajeResponseDto> EliminarPublicacionAsync(int idPublicacion, int idUsuario);

    /// <summary>Obtiene la lista paginada de publicaciones del feed público con multimedia.</summary>
    Task<List<PublicacionPostDto>> ObtenerPostsAsync(int? idUsuarioVisitante, int pagina = 1, int tamanoPagina = 10);

    /// <summary>Obtiene el detalle completo de un post (datos, multimedia y comentarios).</summary>
    Task<PublicacionDetalleDto?> ObtenerPostDetalleAsync(int idPublicacion, int? idUsuarioVisitante);

    /// <summary>Dar o quitar Like a una publicación (Toggle).</summary>
    Task<ToggleLikeResponseDto> ToggleLikeAsync(int idPublicacion, int idUsuario);

    /// <summary>Agrega un comentario a una publicación.</summary>
    Task<IdMensajeResponseDto> AgregarComentarioAsync(int idPublicacion, int idUsuario, AgregarComentarioDto dto);

    /// <summary>Elimina un comentario (el autor del comentario o el dueño del post).</summary>
    Task<MensajeResponseDto> EliminarComentarioAsync(int idPublicacionComentario, int idUsuario);

    /// <summary>Obtiene todos los comentarios de una publicación.</summary>
    Task<List<PublicacionComentarioDto>> ObtenerComentariosAsync(int idPublicacion);
}
