using System.Data;
using Interface;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Misostenido.Model.DTO;

namespace Implementation;

public class InicioService : IInicioService
{
    private readonly string _connectionString;

    public InicioService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("ConnectionString 'DefaultConnection' no configurada.");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // OBTENER DESTACADOS (Artistas, Posts recientes, Eventos próximos)
    // ─────────────────────────────────────────────────────────────────────────
    public async Task<InicioDestacadosResponseDto> ObtenerDestacadosAsync()
    {
        var response = new InicioDestacadosResponseDto();

        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Inicio_ObtenerDestacados", conn);
        cmd.CommandType = CommandType.StoredProcedure;

        await conn.OpenAsync();
        await using SqlDataReader reader = await cmd.ExecuteReaderAsync();

        // ── ResultSet 1: Artistas / Grupos / Escuelas destacados ─────────────
        while (await reader.ReadAsync())
        {
            response.ArtistasDestacados.Add(new ArtistaDestacadoDto
            {
                IdUsuario       = reader.GetInt32(reader.GetOrdinal("id_usuario")),
                Nombre          = reader.GetString(reader.GetOrdinal("nombre")),
                TipoPerfil      = reader.GetString(reader.GetOrdinal("tipo_perfil")),
                Biografia       = reader.IsDBNull(reader.GetOrdinal("biografia"))      ? null : reader.GetString(reader.GetOrdinal("biografia")),
                Ubicacion       = reader.IsDBNull(reader.GetOrdinal("ubicacion"))      ? null : reader.GetString(reader.GetOrdinal("ubicacion")),
                GeneroMusical   = reader.IsDBNull(reader.GetOrdinal("genero_musical")) ? null : reader.GetString(reader.GetOrdinal("genero_musical")),
                Instrumento     = reader.IsDBNull(reader.GetOrdinal("instrumento"))    ? null : reader.GetString(reader.GetOrdinal("instrumento")),
                FotoPerfilUrl   = reader.IsDBNull(reader.GetOrdinal("foto_perfil_url"))? null : reader.GetString(reader.GetOrdinal("foto_perfil_url")),
                Verificado      = Convert.ToBoolean(reader["verificado"]),
                TotalSeguidores = reader.GetInt32(reader.GetOrdinal("total_seguidores"))
            });
        }

        // ── ResultSet 2: Publicaciones recientes ──────────────────────────────
        await reader.NextResultAsync();
        while (await reader.ReadAsync())
        {
            response.PublicacionesRecientes.Add(new PublicacionInicioDto
            {
                IdPublicacion    = reader.GetInt32(reader.GetOrdinal("id_publicacion")),
                Texto            = reader.IsDBNull(reader.GetOrdinal("texto")) ? null : reader.GetString(reader.GetOrdinal("texto")),
                FechaPublicacion = reader.GetDateTime(reader.GetOrdinal("fecha_publicacion")),
                IdUsuario        = reader.GetInt32(reader.GetOrdinal("id_usuario")),
                AutorNombre      = reader.GetString(reader.GetOrdinal("autor_nombre")),
                AutorTipo        = reader.GetString(reader.GetOrdinal("autor_tipo")),
                AutorFoto        = reader.IsDBNull(reader.GetOrdinal("autor_foto")) ? null : reader.GetString(reader.GetOrdinal("autor_foto")),
                AutorVerificado  = Convert.ToBoolean(reader["autor_verificado"]),
                TotalLikes       = reader.GetInt32(reader.GetOrdinal("total_likes")),
                TotalComentarios = reader.GetInt32(reader.GetOrdinal("total_comentarios"))
            });
        }

        // ── ResultSet 3: Próximos eventos destacados ──────────────────────────
        await reader.NextResultAsync();
        while (await reader.ReadAsync())
        {
            response.EventosProximos.Add(new EventoInicioDto
            {
                IdEvento         = reader.GetInt32(reader.GetOrdinal("id_evento")),
                Titulo           = reader.GetString(reader.GetOrdinal("titulo")),
                TipoEvento       = reader.IsDBNull(reader.GetOrdinal("tipo_evento")) ? null : reader.GetString(reader.GetOrdinal("tipo_evento")),
                FechaEvento      = reader.GetDateTime(reader.GetOrdinal("fecha_evento")),
                Ubicacion        = reader.IsDBNull(reader.GetOrdinal("ubicacion")) ? null : reader.GetString(reader.GetOrdinal("ubicacion")),
                OrganizadorId    = reader.GetInt32(reader.GetOrdinal("organizador_id")),
                OrganizadorNombre= reader.GetString(reader.GetOrdinal("organizador_nombre")),
                OrganizadorFoto  = reader.IsDBNull(reader.GetOrdinal("organizador_foto")) ? null : reader.GetString(reader.GetOrdinal("organizador_foto"))
            });
        }

        return response;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // BÚSQUEDA GLOBAL (Usuarios, Eventos, Ofertas de Servicio)
    // ─────────────────────────────────────────────────────────────────────────
    public async Task<InicioBusquedaGlobalResponseDto> BuscarGlobalAsync(BuscarGlobalRequestDto dto)
    {
        var response = new InicioBusquedaGlobalResponseDto();

        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Inicio_BuscarGlobal", conn);
        cmd.CommandType = CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@busqueda",       (object?)dto.Busqueda      ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@tipo_perfil",   (object?)dto.TipoPerfil    ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@genero_musical", (object?)dto.GeneroMusical ?? DBNull.Value);

        await conn.OpenAsync();
        await using SqlDataReader reader = await cmd.ExecuteReaderAsync();

        // ── ResultSet 1: Usuarios ─────────────────────────────────────────────
        while (await reader.ReadAsync())
        {
            response.Usuarios.Add(new ArtistaDestacadoDto
            {
                IdUsuario       = reader.GetInt32(reader.GetOrdinal("id_usuario")),
                Nombre          = reader.GetString(reader.GetOrdinal("nombre")),
                TipoPerfil      = reader.GetString(reader.GetOrdinal("tipo_perfil")),
                Biografia       = reader.IsDBNull(reader.GetOrdinal("biografia"))      ? null : reader.GetString(reader.GetOrdinal("biografia")),
                Ubicacion       = reader.IsDBNull(reader.GetOrdinal("ubicacion"))      ? null : reader.GetString(reader.GetOrdinal("ubicacion")),
                GeneroMusical   = reader.IsDBNull(reader.GetOrdinal("genero_musical")) ? null : reader.GetString(reader.GetOrdinal("genero_musical")),
                Instrumento     = reader.IsDBNull(reader.GetOrdinal("instrumento"))    ? null : reader.GetString(reader.GetOrdinal("instrumento")),
                FotoPerfilUrl   = reader.IsDBNull(reader.GetOrdinal("foto_perfil_url"))? null : reader.GetString(reader.GetOrdinal("foto_perfil_url")),
                Verificado      = Convert.ToBoolean(reader["verificado"]),
                TotalSeguidores = reader.GetInt32(reader.GetOrdinal("total_seguidores"))
            });
        }

        // ── ResultSet 2: Eventos Próximos ─────────────────────────────────────
        await reader.NextResultAsync();
        while (await reader.ReadAsync())
        {
            response.Eventos.Add(new EventoInicioDto
            {
                IdEvento         = reader.GetInt32(reader.GetOrdinal("id_evento")),
                Titulo           = reader.GetString(reader.GetOrdinal("titulo")),
                Descripcion      = reader.IsDBNull(reader.GetOrdinal("descripcion")) ? null : reader.GetString(reader.GetOrdinal("descripcion")),
                TipoEvento       = reader.IsDBNull(reader.GetOrdinal("tipo_evento")) ? null : reader.GetString(reader.GetOrdinal("tipo_evento")),
                FechaEvento      = reader.GetDateTime(reader.GetOrdinal("fecha_evento")),
                Ubicacion        = reader.IsDBNull(reader.GetOrdinal("ubicacion")) ? null : reader.GetString(reader.GetOrdinal("ubicacion")),
                OrganizadorId    = reader.GetInt32(reader.GetOrdinal("organizador_id")),
                OrganizadorNombre= reader.GetString(reader.GetOrdinal("organizador_nombre"))
            });
        }

        // ── ResultSet 3: Ofertas de Servicio ──────────────────────────────────
        await reader.NextResultAsync();
        while (await reader.ReadAsync())
        {
            response.OfertasServicio.Add(new OfertaServicioInicioDto
            {
                IdOfertaServicio = reader.GetInt32(reader.GetOrdinal("id_ofertaservicio")),
                Titulo           = reader.GetString(reader.GetOrdinal("titulo")),
                Descripcion      = reader.IsDBNull(reader.GetOrdinal("descripcion")) ? null : reader.GetString(reader.GetOrdinal("descripcion")),
                GeneroMusical    = reader.IsDBNull(reader.GetOrdinal("genero_musical")) ? null : reader.GetString(reader.GetOrdinal("genero_musical")),
                TarifaAproximada = reader.IsDBNull(reader.GetOrdinal("tarifa_aproximada")) ? null : reader.GetDecimal(reader.GetOrdinal("tarifa_aproximada")),
                Ubicacion        = reader.IsDBNull(reader.GetOrdinal("ubicacion")) ? null : reader.GetString(reader.GetOrdinal("ubicacion")),
                FechaPublicacion = reader.GetDateTime(reader.GetOrdinal("fecha_publicacion")),
                IdUsuario        = reader.GetInt32(reader.GetOrdinal("id_usuario")),
                ArtistaNombre    = reader.GetString(reader.GetOrdinal("artista_nombre")),
                FotoPerfilUrl    = reader.IsDBNull(reader.GetOrdinal("foto_perfil_url")) ? null : reader.GetString(reader.GetOrdinal("foto_perfil_url"))
            });
        }

        return response;
    }
}
