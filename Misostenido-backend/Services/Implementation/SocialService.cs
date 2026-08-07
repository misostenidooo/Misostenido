using System.Data;
using Interface;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Misostenido.Model.DTO;

namespace Implementation;

public class SocialService : ISocialService
{
    private readonly string _connectionString;

    public SocialService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("ConnectionString 'DefaultConnection' no configurada.");
    }

    // ──────────────────────────────────────────────────────────────────────────
    // TOGGLE SEGUIR
    // ──────────────────────────────────────────────────────────────────────────
    public async Task<ToggleSeguirResponseDto> ToggleSeguirAsync(int idUsuarioObjetivo, int idSeguidor)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Social_ToggleSeguir", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_usuario",  idUsuarioObjetivo);
        cmd.Parameters.AddWithValue("@id_seguidor", idSeguidor);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            string accion = reader.GetString(reader.GetOrdinal("accion"));
            string mensaje = reader.GetString(reader.GetOrdinal("mensaje"));
            return new ToggleSeguirResponseDto { Accion = accion, Mensaje = mensaje };
        }
        return new ToggleSeguirResponseDto { Accion = "ERROR", Mensaje = "Sin respuesta del servidor" };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ES SEGUIDOR
    // ──────────────────────────────────────────────────────────────────────────
    public async Task<EsSeguidorResponseDto> EsSeguidorAsync(int idUsuarioObjetivo, int idSeguidor)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Social_EsSeguidor", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_usuario",  idUsuarioObjetivo);
        cmd.Parameters.AddWithValue("@id_seguidor", idSeguidor);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            bool loSigue = Convert.ToBoolean(reader["lo_sigue"]);
            return new EsSeguidorResponseDto { LoSigue = loSigue };
        }
        return new EsSeguidorResponseDto { LoSigue = false };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // OBTENER SEGUIDORES DE UN USUARIO
    // ──────────────────────────────────────────────────────────────────────────
    public async Task<List<UsuarioRedDto>> ObtenerSeguidoresAsync(int idUsuario)
    {
        var lista = new List<UsuarioRedDto>();

        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Social_ObtenerSeguidores", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_usuario", idUsuario);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            lista.Add(new UsuarioRedDto
            {
                IdSeguidorRel    = reader.GetInt32(reader.GetOrdinal("id_seguidor_rel")),
                IdUsuario        = reader.GetInt32(reader.GetOrdinal("id_usuario")),
                Nombre           = reader.GetString(reader.GetOrdinal("nombre")),
                FotoPerfilUrl    = reader.IsDBNull(reader.GetOrdinal("foto_perfil_url")) ? null : reader.GetString(reader.GetOrdinal("foto_perfil_url")),
                TipoPerfil       = reader.GetString(reader.GetOrdinal("tipo_perfil")),
                GeneroMusical    = reader.IsDBNull(reader.GetOrdinal("genero_musical"))  ? null : reader.GetString(reader.GetOrdinal("genero_musical")),
                FechaSeguimiento = reader.GetDateTime(reader.GetOrdinal("fecha_seguimiento"))
            });
        }
        return lista;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // OBTENER USUARIOS SEGUIDOS POR UN USUARIO
    // ──────────────────────────────────────────────────────────────────────────
    public async Task<List<UsuarioRedDto>> ObtenerSeguidosAsync(int idSeguidor)
    {
        var lista = new List<UsuarioRedDto>();

        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Social_ObtenerSeguidos", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_seguidor", idSeguidor);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            lista.Add(new UsuarioRedDto
            {
                IdSeguidorRel    = reader.GetInt32(reader.GetOrdinal("id_seguidor_rel")),
                IdUsuario        = reader.GetInt32(reader.GetOrdinal("id_usuario")),
                Nombre           = reader.GetString(reader.GetOrdinal("nombre")),
                FotoPerfilUrl    = reader.IsDBNull(reader.GetOrdinal("foto_perfil_url")) ? null : reader.GetString(reader.GetOrdinal("foto_perfil_url")),
                TipoPerfil       = reader.GetString(reader.GetOrdinal("tipo_perfil")),
                GeneroMusical    = reader.IsDBNull(reader.GetOrdinal("genero_musical"))  ? null : reader.GetString(reader.GetOrdinal("genero_musical")),
                FechaSeguimiento = reader.GetDateTime(reader.GetOrdinal("fecha_seguimiento"))
            });
        }
        return lista;
    }
}
