using System.Data;
using Interface;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Misostenido.Model.DTO;

namespace Implementation;

public class UsuarioService : IUsuarioService
{
    private readonly string _connectionString;

    public UsuarioService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("ConnectionString 'DefaultConnection' no configurada.");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // OBTENER PERFIL COMPLETO
    // ─────────────────────────────────────────────────────────────────────────
    public async Task<PerfilResponseDto?> ObtenerPerfilAsync(int idUsuarioPerfil, int? idVisitante = null)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Perfil_ObtenerDetalle", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_usuario_perfil", idUsuarioPerfil);
        cmd.Parameters.AddWithValue("@id_usuario_visitante", (object?)idVisitante ?? DBNull.Value);

        await conn.OpenAsync();
        await using SqlDataReader reader = await cmd.ExecuteReaderAsync();

        // ── ResultSet 1: datos del usuario ───────────────────────────────────
        if (!await reader.ReadAsync()) return null;

        var perfil = new PerfilResponseDto
        {
            IdUsuario         = reader.GetInt32(reader.GetOrdinal("id_usuario")),
            Nombre            = reader.GetString(reader.GetOrdinal("nombre")),
            Email             = reader.GetString(reader.GetOrdinal("email")),
            TipoPerfil        = reader.GetString(reader.GetOrdinal("tipo_perfil")),
            Biografia         = reader.IsDBNull(reader.GetOrdinal("biografia"))       ? null : reader.GetString(reader.GetOrdinal("biografia")),
            Ubicacion         = reader.IsDBNull(reader.GetOrdinal("ubicacion"))       ? null : reader.GetString(reader.GetOrdinal("ubicacion")),
            GeneroMusical     = reader.IsDBNull(reader.GetOrdinal("genero_musical"))  ? null : reader.GetString(reader.GetOrdinal("genero_musical")),
            Instrumento       = reader.IsDBNull(reader.GetOrdinal("instrumento"))     ? null : reader.GetString(reader.GetOrdinal("instrumento")),
            FotoPerfilUrl     = reader.IsDBNull(reader.GetOrdinal("foto_perfil_url")) ? null : reader.GetString(reader.GetOrdinal("foto_perfil_url")),
            EmailVerificado   = Convert.ToBoolean(reader["email_verificado"]),
            Verificado        = Convert.ToBoolean(reader["verificado"]),
            Estado            = Convert.ToBoolean(reader["estado"]),
            FechaCreacion     = reader.GetDateTime(reader.GetOrdinal("fecha_creacion")),
            RolNombre         = reader.GetString(reader.GetOrdinal("rol_nombre")),
            TotalSeguidores   = reader.GetInt32(reader.GetOrdinal("total_seguidores")),
            TotalSeguidos     = reader.GetInt32(reader.GetOrdinal("total_seguidos")),
            TotalPublicaciones= reader.GetInt32(reader.GetOrdinal("total_publicaciones")),
            TotalOfertasActivas= reader.GetInt32(reader.GetOrdinal("total_ofertas_activas")),
            TotalEventos      = reader.GetInt32(reader.GetOrdinal("total_eventos")),
            EsSeguidoPorVisitante = Convert.ToBoolean(reader["es_seguido_por_visitante"])
        };

        // ── ResultSet 2: portafolio multimedia ────────────────────────────────
        await reader.NextResultAsync();
        while (await reader.ReadAsync())
        {
            perfil.Portafolio.Add(new MediaDto
            {
                IdContenidoMultimedia = reader.GetInt32(reader.GetOrdinal("id_contenidomultimedia")),
                IdUsuario    = reader.GetInt32(reader.GetOrdinal("id_usuario")),
                Tipo         = reader.GetString(reader.GetOrdinal("tipo")),
                Url          = reader.GetString(reader.GetOrdinal("url")),
                Descripcion  = reader.IsDBNull(reader.GetOrdinal("descripcion")) ? null : reader.GetString(reader.GetOrdinal("descripcion")),
                FechaSubida  = reader.GetDateTime(reader.GetOrdinal("fecha_subida"))
            });
        }

        // ── ResultSet 3: integrantes del grupo ────────────────────────────────
        await reader.NextResultAsync();
        while (await reader.ReadAsync())
        {
            perfil.Integrantes.Add(new IntegranteDto
            {
                IdGrupoIntegrante = reader.GetInt32(reader.GetOrdinal("id_grupointegrante")),
                IdIntegrante      = reader.GetInt32(reader.GetOrdinal("id_integrante")),
                IntegranteNombre  = reader.GetString(reader.GetOrdinal("integrante_nombre")),
                FotoPerfilUrl     = reader.IsDBNull(reader.GetOrdinal("foto_perfil_url")) ? null : reader.GetString(reader.GetOrdinal("foto_perfil_url")),
                Instrumento       = reader.IsDBNull(reader.GetOrdinal("instrumento")) ? null : reader.GetString(reader.GetOrdinal("instrumento")),
                RolEnGrupo        = reader.IsDBNull(reader.GetOrdinal("rol_en_grupo")) ? null : reader.GetString(reader.GetOrdinal("rol_en_grupo")),
                FechaUnion        = reader.GetDateTime(reader.GetOrdinal("fecha_union"))
            });
        }

        // ── ResultSet 4: cursos de escuela ────────────────────────────────────
        await reader.NextResultAsync();
        while (await reader.ReadAsync())
        {
            perfil.Cursos.Add(new CursoDto
            {
                IdEscuelaCurso = reader.GetInt32(reader.GetOrdinal("id_escuelacurso")),
                NombreCurso    = reader.GetString(reader.GetOrdinal("nombre_curso")),
                Descripcion    = reader.IsDBNull(reader.GetOrdinal("descripcion")) ? null : reader.GetString(reader.GetOrdinal("descripcion")),
                Horario        = reader.IsDBNull(reader.GetOrdinal("horario")) ? null : reader.GetString(reader.GetOrdinal("horario")),
                Precio         = reader.IsDBNull(reader.GetOrdinal("precio")) ? null : reader.GetDecimal(reader.GetOrdinal("precio")),
                Estado         = Convert.ToBoolean(reader["estado"]),
                FechaCreacion  = reader.GetDateTime(reader.GetOrdinal("fecha_creacion"))
            });
        }

        return perfil;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTUALIZAR PERFIL PROPIO
    // ─────────────────────────────────────────────────────────────────────────
    public async Task<MensajeResponseDto> ActualizarPerfilAsync(int idUsuario, ActualizarPerfilDto dto)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Perfil_Actualizar", conn);
        cmd.CommandType = CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@id_usuario",      idUsuario);
        cmd.Parameters.AddWithValue("@nombre",          dto.Nombre);
        cmd.Parameters.AddWithValue("@biografia",       (object?)dto.Biografia      ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@ubicacion",       (object?)dto.Ubicacion      ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@genero_musical",  (object?)dto.GeneroMusical  ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@instrumento",     (object?)dto.Instrumento    ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@foto_perfil_url", (object?)dto.FotoPerfilUrl  ?? DBNull.Value);

        await conn.OpenAsync();
        await using SqlDataReader reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            string msg = reader.GetString(reader.GetOrdinal("mensaje"));
            return new MensajeResponseDto { Exito = msg == "OK", Mensaje = msg == "OK" ? "Perfil actualizado correctamente" : msg };
        }
        return new MensajeResponseDto { Exito = false, Mensaje = "Sin respuesta del servidor" };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // OBTENER PERMISOS DEL USUARIO
    // ─────────────────────────────────────────────────────────────────────────
    public async Task<PermisosResponseDto> ObtenerPermisosAsync(int idUsuario)
    {
        var result = new PermisosResponseDto { IdUsuario = idUsuario };

        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_ObtenerPermisosUsuario", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_usuario", idUsuario);

        await conn.OpenAsync();
        await using SqlDataReader reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            result.Permisos.Add(reader.GetString(reader.GetOrdinal("codigo")));
        }

        return result;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // VERIFICAR PERMISO PUNTUAL
    // ─────────────────────────────────────────────────────────────────────────
    public async Task<bool> TienePermisoAsync(int idUsuario, string codigoPermiso)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_UsuarioTienePermiso", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_usuario",      idUsuario);
        cmd.Parameters.AddWithValue("@codigo_permiso",  codigoPermiso);

        await conn.OpenAsync();
        await using SqlDataReader reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
            return reader.GetInt32(reader.GetOrdinal("tiene_permiso")) == 1;

        return false;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ADMIN: GESTIONAR USUARIO (estado / verificado / rol)
    // ─────────────────────────────────────────────────────────────────────────
    public async Task<MensajeResponseDto> GestionarUsuarioAsync(int idAdmin, GestionarUsuarioDto dto)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Admin_GestionarUsuario", conn);
        cmd.CommandType = CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@id_admin",              idAdmin);
        cmd.Parameters.AddWithValue("@id_usuario_destino",    dto.IdUsuarioDestino);
        cmd.Parameters.AddWithValue("@nuevo_estado",          (object?)dto.NuevoEstado     ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@nuevo_verificado",      (object?)dto.NuevoVerificado ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@nuevo_id_rol",          (object?)dto.NuevoIdRol      ?? DBNull.Value);

        await conn.OpenAsync();
        await using SqlDataReader reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            string msg = reader.GetString(reader.GetOrdinal("mensaje"));
            return new MensajeResponseDto { Exito = msg == "OK", Mensaje = msg == "OK" ? "Usuario actualizado correctamente" : msg };
        }
        return new MensajeResponseDto { Exito = false, Mensaje = "Sin respuesta del servidor" };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PORTAFOLIO MULTIMEDIA
    // ─────────────────────────────────────────────────────────────────────────
    public async Task<IdMensajeResponseDto> SubirMediaAsync(int idUsuario, SubirMediaDto dto)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Perfil_SubirMedia", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_usuario",   idUsuario);
        cmd.Parameters.AddWithValue("@tipo",         dto.Tipo);
        cmd.Parameters.AddWithValue("@url",          dto.Url);
        cmd.Parameters.AddWithValue("@descripcion",  (object?)dto.Descripcion ?? DBNull.Value);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            int id = Convert.ToInt32(reader["id_contenidomultimedia"]);
            string msg = reader.GetString(reader.GetOrdinal("mensaje"));
            return new IdMensajeResponseDto { Id = id, Exito = id > 0, Mensaje = id > 0 ? "Media subida correctamente" : msg };
        }
        return new IdMensajeResponseDto { Id = -1, Exito = false, Mensaje = "Sin respuesta del servidor" };
    }

    public async Task<MensajeResponseDto> EliminarMediaAsync(int idContenidoMultimedia, int idUsuario)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Perfil_EliminarMedia", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_contenidomultimedia", idContenidoMultimedia);
        cmd.Parameters.AddWithValue("@id_usuario",             idUsuario);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            string msg = reader.GetString(reader.GetOrdinal("mensaje"));
            return new MensajeResponseDto { Exito = msg == "OK", Mensaje = msg == "OK" ? "Media eliminada correctamente" : msg };
        }
        return new MensajeResponseDto { Exito = false, Mensaje = "Sin respuesta del servidor" };
    }

    public async Task<List<MediaDto>> ObtenerMediaAsync(int idUsuario)
    {
        var result = new List<MediaDto>();
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Perfil_ObtenerMedia", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_usuario", idUsuario);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            result.Add(new MediaDto
            {
                IdContenidoMultimedia = reader.GetInt32(reader.GetOrdinal("id_contenidomultimedia")),
                IdUsuario    = reader.GetInt32(reader.GetOrdinal("id_usuario")),
                Tipo         = reader.GetString(reader.GetOrdinal("tipo")),
                Url          = reader.GetString(reader.GetOrdinal("url")),
                Descripcion  = reader.IsDBNull(reader.GetOrdinal("descripcion")) ? null : reader.GetString(reader.GetOrdinal("descripcion")),
                FechaSubida  = reader.GetDateTime(reader.GetOrdinal("fecha_subida"))
            });
        }
        return result;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INTEGRANTES DE GRUPO
    // ─────────────────────────────────────────────────────────────────────────
    public async Task<IdMensajeResponseDto> AgregarIntegranteAsync(int idGrupo, AgregarIntegranteDto dto)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Perfil_AgregarIntegrante", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_grupo",      idGrupo);
        cmd.Parameters.AddWithValue("@id_integrante", dto.IdIntegrante);
        cmd.Parameters.AddWithValue("@rol_en_grupo",  (object?)dto.RolEnGrupo ?? DBNull.Value);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            int id = Convert.ToInt32(reader["id_grupointegrante"]);
            string msg = reader.GetString(reader.GetOrdinal("mensaje"));
            return new IdMensajeResponseDto { Id = id, Exito = id > 0, Mensaje = id > 0 ? "Integrante agregado correctamente" : msg };
        }
        return new IdMensajeResponseDto { Id = -1, Exito = false, Mensaje = "Sin respuesta del servidor" };
    }

    public async Task<MensajeResponseDto> EliminarIntegranteAsync(int idGrupo, int idIntegrante)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Perfil_EliminarIntegrante", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_grupo",      idGrupo);
        cmd.Parameters.AddWithValue("@id_integrante", idIntegrante);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            string msg = reader.GetString(reader.GetOrdinal("mensaje"));
            return new MensajeResponseDto { Exito = msg == "OK", Mensaje = msg == "OK" ? "Integrante eliminado correctamente" : msg };
        }
        return new MensajeResponseDto { Exito = false, Mensaje = "Sin respuesta del servidor" };
    }

    public async Task<List<IntegranteDetalleDto>> ObtenerIntegrantesAsync(int idGrupo)
    {
        var result = new List<IntegranteDetalleDto>();
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Perfil_ObtenerIntegrantes", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_grupo", idGrupo);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            result.Add(new IntegranteDetalleDto
            {
                IdGrupoIntegrante = reader.GetInt32(reader.GetOrdinal("id_grupointegrante")),
                IdGrupo           = reader.GetInt32(reader.GetOrdinal("id_grupo")),
                IdIntegrante      = reader.GetInt32(reader.GetOrdinal("id_integrante")),
                Nombre            = reader.GetString(reader.GetOrdinal("nombre")),
                Email             = reader.IsDBNull(reader.GetOrdinal("email")) ? null : reader.GetString(reader.GetOrdinal("email")),
                FotoPerfilUrl     = reader.IsDBNull(reader.GetOrdinal("foto_perfil_url")) ? null : reader.GetString(reader.GetOrdinal("foto_perfil_url")),
                Instrumento       = reader.IsDBNull(reader.GetOrdinal("instrumento")) ? null : reader.GetString(reader.GetOrdinal("instrumento")),
                RolEnGrupo        = reader.IsDBNull(reader.GetOrdinal("rol_en_grupo")) ? null : reader.GetString(reader.GetOrdinal("rol_en_grupo")),
                FechaUnion        = reader.GetDateTime(reader.GetOrdinal("fecha_union"))
            });
        }
        return result;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CURSOS DE ESCUELA
    // ─────────────────────────────────────────────────────────────────────────
    public async Task<IdMensajeResponseDto> CrearCursoAsync(int idEscuela, CrearCursoDto dto)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Perfil_CrearCurso", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_escuela",    idEscuela);
        cmd.Parameters.AddWithValue("@nombre_curso",  dto.NombreCurso);
        cmd.Parameters.AddWithValue("@descripcion",   (object?)dto.Descripcion ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@horario",       (object?)dto.Horario     ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@precio",        (object?)dto.Precio      ?? DBNull.Value);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            int id = Convert.ToInt32(reader["id_escuelacurso"]);
            string msg = reader.GetString(reader.GetOrdinal("mensaje"));
            return new IdMensajeResponseDto { Id = id, Exito = id > 0, Mensaje = id > 0 ? "Curso creado correctamente" : msg };
        }
        return new IdMensajeResponseDto { Id = -1, Exito = false, Mensaje = "Sin respuesta del servidor" };
    }

    public async Task<MensajeResponseDto> ActualizarCursoAsync(int idEscuelaCurso, int idEscuela, ActualizarCursoDto dto)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Perfil_ActualizarCurso", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_escuelacurso", idEscuelaCurso);
        cmd.Parameters.AddWithValue("@id_escuela",      idEscuela);
        cmd.Parameters.AddWithValue("@nombre_curso",    dto.NombreCurso);
        cmd.Parameters.AddWithValue("@descripcion",     (object?)dto.Descripcion ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@horario",         (object?)dto.Horario     ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@precio",          (object?)dto.Precio      ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@estado",          dto.Estado);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            string msg = reader.GetString(reader.GetOrdinal("mensaje"));
            return new MensajeResponseDto { Exito = msg == "OK", Mensaje = msg == "OK" ? "Curso actualizado correctamente" : msg };
        }
        return new MensajeResponseDto { Exito = false, Mensaje = "Sin respuesta del servidor" };
    }

    public async Task<MensajeResponseDto> EliminarCursoAsync(int idEscuelaCurso, int idEscuela)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Perfil_EliminarCurso", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_escuelacurso", idEscuelaCurso);
        cmd.Parameters.AddWithValue("@id_escuela",      idEscuela);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            string msg = reader.GetString(reader.GetOrdinal("mensaje"));
            return new MensajeResponseDto { Exito = msg == "OK", Mensaje = msg == "OK" ? "Curso eliminado correctamente" : msg };
        }
        return new MensajeResponseDto { Exito = false, Mensaje = "Sin respuesta del servidor" };
    }

    public async Task<List<CursoDetalleDto>> ObtenerCursosAsync(int idEscuela)
    {
        var result = new List<CursoDetalleDto>();
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Perfil_ObtenerCursos", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_escuela", idEscuela);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            result.Add(new CursoDetalleDto
            {
                IdEscuelaCurso = reader.GetInt32(reader.GetOrdinal("id_escuelacurso")),
                IdEscuela      = reader.GetInt32(reader.GetOrdinal("id_escuela")),
                NombreCurso    = reader.GetString(reader.GetOrdinal("nombre_curso")),
                Descripcion    = reader.IsDBNull(reader.GetOrdinal("descripcion")) ? null : reader.GetString(reader.GetOrdinal("descripcion")),
                Horario        = reader.IsDBNull(reader.GetOrdinal("horario")) ? null : reader.GetString(reader.GetOrdinal("horario")),
                Precio         = reader.IsDBNull(reader.GetOrdinal("precio")) ? null : reader.GetDecimal(reader.GetOrdinal("precio")),
                Estado         = Convert.ToBoolean(reader["estado"]),
                FechaCreacion  = reader.GetDateTime(reader.GetOrdinal("fecha_creacion"))
            });
        }
        return result;
    }
}
