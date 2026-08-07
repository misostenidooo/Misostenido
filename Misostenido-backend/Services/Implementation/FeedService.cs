using System.Data;
using Interface;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Misostenido.Model.DTO;

namespace Implementation;

public class FeedService : IFeedService
{
    private readonly string _connectionString;

    public FeedService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("ConnectionString 'DefaultConnection' no configurada.");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CREAR PUBLICACIÓN
    // ─────────────────────────────────────────────────────────────────────────
    public async Task<IdMensajeResponseDto> CrearPublicacionAsync(int idUsuario, CrearPublicacionRequestDto dto)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Feed_CrearPublicacion", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_usuario", idUsuario);
        cmd.Parameters.AddWithValue("@texto",      (object?)dto.Texto ?? DBNull.Value);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            int id = Convert.ToInt32(reader["id_publicacion"]);
            string msg = reader.GetString(reader.GetOrdinal("mensaje"));
            return new IdMensajeResponseDto { Id = id, Exito = id > 0, Mensaje = id > 0 ? "Publicación creada exitosamente" : msg };
        }
        return new IdMensajeResponseDto { Id = -1, Exito = false, Mensaje = "Sin respuesta del servidor" };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AGREGAR MEDIA A PUBLICACIÓN
    // ─────────────────────────────────────────────────────────────────────────
    public async Task<IdMensajeResponseDto> AgregarMediaAsync(int idPublicacion, int idUsuario, AgregarPublicacionMediaDto dto)
    {
        await using SqlConnection conn = new(_connectionString);
        await conn.OpenAsync();

        // Verificar autoría antes de insertar media
        await using (SqlCommand checkCmd = new("SELECT id_usuario FROM dbo.Publicacion WHERE id_publicacion = @id_publicacion", conn))
        {
            checkCmd.Parameters.AddWithValue("@id_publicacion", idPublicacion);
            var result = await checkCmd.ExecuteScalarAsync();
            if (result == null || Convert.ToInt32(result) != idUsuario)
            {
                return new IdMensajeResponseDto { Id = -1, Exito = false, Mensaje = "La publicación no pertenece al usuario autenticado" };
            }
        }

        await using (SqlCommand cmd = new("dbo.sp_Feed_AgregarMedia", conn))
        {
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@id_publicacion", idPublicacion);
            cmd.Parameters.AddWithValue("@tipo",           dto.Tipo);
            cmd.Parameters.AddWithValue("@url",            dto.Url);
            cmd.Parameters.AddWithValue("@descripcion",    (object?)dto.Descripcion ?? DBNull.Value);

            await using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                int id = Convert.ToInt32(reader["id_publicacionmultimedia"]);
                string msg = reader.GetString(reader.GetOrdinal("mensaje"));
                return new IdMensajeResponseDto { Id = id, Exito = id > 0, Mensaje = id > 0 ? "Media agregada a la publicación" : msg };
            }
        }

        return new IdMensajeResponseDto { Id = -1, Exito = false, Mensaje = "Sin respuesta del servidor" };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ELIMINAR MEDIA
    // ─────────────────────────────────────────────────────────────────────────
    public async Task<MensajeResponseDto> EliminarMediaAsync(int idPublicacionMultimedia, int idUsuario)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Feed_EliminarMedia", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_publicacionmultimedia", idPublicacionMultimedia);
        cmd.Parameters.AddWithValue("@id_usuario",                 idUsuario);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            string msg = reader.GetString(reader.GetOrdinal("mensaje"));
            return new MensajeResponseDto { Exito = msg == "OK", Mensaje = msg == "OK" ? "Media eliminada correctamente" : msg };
        }
        return new MensajeResponseDto { Exito = false, Mensaje = "Sin respuesta del servidor" };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ELIMINAR PUBLICACIÓN
    // ─────────────────────────────────────────────────────────────────────────
    public async Task<MensajeResponseDto> EliminarPublicacionAsync(int idPublicacion, int idUsuario)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Feed_EliminarPublicacion", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_publicacion", idPublicacion);
        cmd.Parameters.AddWithValue("@id_usuario",     idUsuario);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            string msg = reader.GetString(reader.GetOrdinal("mensaje"));
            return new MensajeResponseDto { Exito = msg == "OK", Mensaje = msg == "OK" ? "Publicación eliminada correctamente" : msg };
        }
        return new MensajeResponseDto { Exito = false, Mensaje = "Sin respuesta del servidor" };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // OBTENER POSTS DEL FEED (Paginado + Multi-Resultset)
    // ─────────────────────────────────────────────────────────────────────────
    public async Task<List<PublicacionPostDto>> ObtenerPostsAsync(int? idUsuarioVisitante, int pagina = 1, int tamanoPagina = 10)
    {
        var posts = new List<PublicacionPostDto>();
        var mediaDict = new Dictionary<int, List<PublicacionMediaDto>>();

        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Feed_ObtenerPosts", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_usuario_visitante", (object?)idUsuarioVisitante ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@pagina",               pagina);
        cmd.Parameters.AddWithValue("@tamano_pagina",        tamanoPagina);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();

        // ── ResultSet 1: Publicaciones ───────────────────────────────────────
        while (await reader.ReadAsync())
        {
            var post = new PublicacionPostDto
            {
                IdPublicacion    = reader.GetInt32(reader.GetOrdinal("id_publicacion")),
                Texto            = reader.IsDBNull(reader.GetOrdinal("texto")) ? null : reader.GetString(reader.GetOrdinal("texto")),
                FechaPublicacion = reader.GetDateTime(reader.GetOrdinal("fecha_publicacion")),
                AutorId          = reader.GetInt32(reader.GetOrdinal("autor_id")),
                AutorNombre      = reader.GetString(reader.GetOrdinal("autor_nombre")),
                AutorTipo        = reader.GetString(reader.GetOrdinal("autor_tipo")),
                AutorFoto        = reader.IsDBNull(reader.GetOrdinal("autor_foto")) ? null : reader.GetString(reader.GetOrdinal("autor_foto")),
                AutorVerificado  = Convert.ToBoolean(reader["autor_verificado"]),
                TotalLikes       = reader.GetInt32(reader.GetOrdinal("total_likes")),
                TotalComentarios = reader.GetInt32(reader.GetOrdinal("total_comentarios")),
                TotalMultimedia  = reader.GetInt32(reader.GetOrdinal("total_multimedia")),
                DioLike          = Convert.ToBoolean(reader["dio_like"])
            };
            posts.Add(post);
        }

        // ── ResultSet 2: Multimedia asociada ─────────────────────────────────
        await reader.NextResultAsync();
        while (await reader.ReadAsync())
        {
            int idPub = reader.GetInt32(reader.GetOrdinal("id_publicacion"));
            var media = new PublicacionMediaDto
            {
                IdPublicacionMultimedia = reader.GetInt32(reader.GetOrdinal("id_publicacionmultimedia")),
                IdPublicacion           = idPub,
                Tipo                    = reader.GetString(reader.GetOrdinal("tipo")),
                Url                     = reader.GetString(reader.GetOrdinal("url")),
                Descripcion             = reader.IsDBNull(reader.GetOrdinal("descripcion")) ? null : reader.GetString(reader.GetOrdinal("descripcion"))
            };

            if (!mediaDict.ContainsKey(idPub))
                mediaDict[idPub] = [];
            mediaDict[idPub].Add(media);
        }

        // Asociar la multimedia a cada post
        foreach (var p in posts)
        {
            if (mediaDict.TryGetValue(p.IdPublicacion, out var mediaList))
            {
                p.Multimedia = mediaList;
            }
        }

        return posts;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // OBTENER DETALLE DE UN POST (Post + Media + Comentarios)
    // ─────────────────────────────────────────────────────────────────────────
    public async Task<PublicacionDetalleDto?> ObtenerPostDetalleAsync(int idPublicacion, int? idUsuarioVisitante)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Feed_ObtenerPostDetalle", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_publicacion",         idPublicacion);
        cmd.Parameters.AddWithValue("@id_usuario_visitante", (object?)idUsuarioVisitante ?? DBNull.Value);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();

        // ── ResultSet 1: Detalle del post ────────────────────────────────────
        if (!await reader.ReadAsync()) return null;

        var detalle = new PublicacionDetalleDto
        {
            Post = new PublicacionPostDto
            {
                IdPublicacion    = reader.GetInt32(reader.GetOrdinal("id_publicacion")),
                Texto            = reader.IsDBNull(reader.GetOrdinal("texto")) ? null : reader.GetString(reader.GetOrdinal("texto")),
                FechaPublicacion = reader.GetDateTime(reader.GetOrdinal("fecha_publicacion")),
                AutorId          = reader.GetInt32(reader.GetOrdinal("autor_id")),
                AutorNombre      = reader.GetString(reader.GetOrdinal("autor_nombre")),
                AutorTipo        = reader.GetString(reader.GetOrdinal("autor_tipo")),
                AutorFoto        = reader.IsDBNull(reader.GetOrdinal("autor_foto")) ? null : reader.GetString(reader.GetOrdinal("autor_foto")),
                AutorVerificado  = Convert.ToBoolean(reader["autor_verificado"]),
                TotalLikes       = reader.GetInt32(reader.GetOrdinal("total_likes")),
                TotalComentarios = reader.GetInt32(reader.GetOrdinal("total_comentarios")),
                DioLike          = Convert.ToBoolean(reader["dio_like"])
            }
        };

        // ── ResultSet 2: Fotos/videos del post ───────────────────────────────
        await reader.NextResultAsync();
        while (await reader.ReadAsync())
        {
            var media = new PublicacionMediaDto
            {
                IdPublicacionMultimedia = reader.GetInt32(reader.GetOrdinal("id_publicacionmultimedia")),
                IdPublicacion           = reader.GetInt32(reader.GetOrdinal("id_publicacion")),
                Tipo                    = reader.GetString(reader.GetOrdinal("tipo")),
                Url                     = reader.GetString(reader.GetOrdinal("url")),
                Descripcion             = reader.IsDBNull(reader.GetOrdinal("descripcion")) ? null : reader.GetString(reader.GetOrdinal("descripcion"))
            };
            detalle.Multimedia.Add(media);
            detalle.Post.Multimedia.Add(media);
        }

        // ── ResultSet 3: Comentarios del post ────────────────────────────────
        await reader.NextResultAsync();
        while (await reader.ReadAsync())
        {
            detalle.Comentarios.Add(new PublicacionComentarioDto
            {
                IdPublicacionComentario = reader.GetInt32(reader.GetOrdinal("id_publicacioncomentario")),
                IdPublicacion           = idPublicacion,
                Texto                   = reader.GetString(reader.GetOrdinal("texto")),
                Fecha                   = reader.GetDateTime(reader.GetOrdinal("fecha")),
                UsuarioId               = reader.GetInt32(reader.GetOrdinal("usuario_id")),
                UsuarioNombre           = reader.GetString(reader.GetOrdinal("usuario_nombre")),
                UsuarioFoto             = reader.IsDBNull(reader.GetOrdinal("usuario_foto")) ? null : reader.GetString(reader.GetOrdinal("usuario_foto"))
            });
        }

        return detalle;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TOGGLE LIKE
    // ─────────────────────────────────────────────────────────────────────────
    public async Task<ToggleLikeResponseDto> ToggleLikeAsync(int idPublicacion, int idUsuario)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Feed_ToggleLike", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_publicacion", idPublicacion);
        cmd.Parameters.AddWithValue("@id_usuario",     idUsuario);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            string accion = reader.GetString(reader.GetOrdinal("accion"));
            if (accion == "ERROR")
            {
                string msg = reader.GetString(reader.GetOrdinal("mensaje"));
                return new ToggleLikeResponseDto { Accion = "ERROR", TotalLikes = 0, Mensaje = msg };
            }
            int likes = reader.GetInt32(reader.GetOrdinal("total_likes"));
            return new ToggleLikeResponseDto { Accion = accion, TotalLikes = likes, Mensaje = $"Like {accion.ToLower()} correctamente" };
        }
        return new ToggleLikeResponseDto { Accion = "ERROR", TotalLikes = 0, Mensaje = "Sin respuesta del servidor" };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AGREGAR COMENTARIO
    // ─────────────────────────────────────────────────────────────────────────
    public async Task<IdMensajeResponseDto> AgregarComentarioAsync(int idPublicacion, int idUsuario, AgregarComentarioDto dto)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Feed_AgregarComentario", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_publicacion", idPublicacion);
        cmd.Parameters.AddWithValue("@id_usuario",     idUsuario);
        cmd.Parameters.AddWithValue("@texto",          dto.Texto);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            int id = Convert.ToInt32(reader["id_publicacioncomentario"]);
            string msg = reader.GetString(reader.GetOrdinal("mensaje"));
            return new IdMensajeResponseDto { Id = id, Exito = id > 0, Mensaje = id > 0 ? "Comentario publicado correctamente" : msg };
        }
        return new IdMensajeResponseDto { Id = -1, Exito = false, Mensaje = "Sin respuesta del servidor" };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ELIMINAR COMENTARIO
    // ─────────────────────────────────────────────────────────────────────────
    public async Task<MensajeResponseDto> EliminarComentarioAsync(int idPublicacionComentario, int idUsuario)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Feed_EliminarComentario", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_publicacioncomentario", idPublicacionComentario);
        cmd.Parameters.AddWithValue("@id_usuario",                 idUsuario);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            string msg = reader.GetString(reader.GetOrdinal("mensaje"));
            return new MensajeResponseDto { Exito = msg == "OK", Mensaje = msg == "OK" ? "Comentario eliminado correctamente" : msg };
        }
        return new MensajeResponseDto { Exito = false, Mensaje = "Sin respuesta del servidor" };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // OBTENER COMENTARIOS
    // ─────────────────────────────────────────────────────────────────────────
    public async Task<List<PublicacionComentarioDto>> ObtenerComentariosAsync(int idPublicacion)
    {
        var comentarios = new List<PublicacionComentarioDto>();

        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Feed_ObtenerComentarios", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_publicacion", idPublicacion);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            comentarios.Add(new PublicacionComentarioDto
            {
                IdPublicacionComentario = reader.GetInt32(reader.GetOrdinal("id_publicacioncomentario")),
                IdPublicacion           = reader.GetInt32(reader.GetOrdinal("id_publicacion")),
                Texto                   = reader.GetString(reader.GetOrdinal("texto")),
                Fecha                   = reader.GetDateTime(reader.GetOrdinal("fecha")),
                UsuarioId               = reader.GetInt32(reader.GetOrdinal("id_usuario")),
                UsuarioNombre           = reader.GetString(reader.GetOrdinal("nombre")),
                UsuarioFoto             = reader.IsDBNull(reader.GetOrdinal("foto_perfil_url")) ? null : reader.GetString(reader.GetOrdinal("foto_perfil_url")),
                TipoPerfil              = reader.IsDBNull(reader.GetOrdinal("tipo_perfil")) ? null : reader.GetString(reader.GetOrdinal("tipo_perfil"))
            });
        }
        return comentarios;
    }
}
