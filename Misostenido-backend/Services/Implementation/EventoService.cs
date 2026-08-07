using System.Data;
using Interface;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Misostenido.Model.DTO;

namespace Implementation;

public class EventoService : IEventoService
{
    private readonly string _connectionString;

    public EventoService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("ConnectionString 'DefaultConnection' no configurada.");
    }

    // ──────────────────────────────────────────────────────────────────────────
    // CREAR EVENTO
    // ──────────────────────────────────────────────────────────────────────────
    public async Task<IdMensajeResponseDto> CrearEventoAsync(int idOrganizador, CrearEventoDto dto)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Evento_Crear", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_organizador",    idOrganizador);
        cmd.Parameters.AddWithValue("@titulo",            dto.Titulo);
        cmd.Parameters.AddWithValue("@descripcion",       (object?)dto.Descripcion      ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@tipo_evento",       (object?)dto.TipoEvento       ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@fecha_evento",      dto.FechaEvento);
        cmd.Parameters.AddWithValue("@ubicacion",         (object?)dto.Ubicacion        ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@info_inscripcion",  (object?)dto.InfoInscripcion ?? DBNull.Value);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            int id = Convert.ToInt32(reader["id_evento"]);
            string msg = reader.GetString(reader.GetOrdinal("mensaje"));
            return new IdMensajeResponseDto { Id = id, Exito = id > 0, Mensaje = id > 0 ? "Evento creado exitosamente" : msg };
        }
        return new IdMensajeResponseDto { Id = -1, Exito = false, Mensaje = "Sin respuesta del servidor" };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ACTUALIZAR EVENTO
    // ──────────────────────────────────────────────────────────────────────────
    public async Task<MensajeResponseDto> ActualizarEventoAsync(int idEvento, int idOrganizador, ActualizarEventoDto dto)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Evento_Actualizar", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_evento",         idEvento);
        cmd.Parameters.AddWithValue("@id_organizador",    idOrganizador);
        cmd.Parameters.AddWithValue("@titulo",            dto.Titulo);
        cmd.Parameters.AddWithValue("@descripcion",       (object?)dto.Descripcion      ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@tipo_evento",       (object?)dto.TipoEvento       ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@fecha_evento",      dto.FechaEvento);
        cmd.Parameters.AddWithValue("@ubicacion",         (object?)dto.Ubicacion        ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@info_inscripcion",  (object?)dto.InfoInscripcion ?? DBNull.Value);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            string msg = reader.GetString(reader.GetOrdinal("mensaje"));
            return new MensajeResponseDto { Exito = msg == "OK", Mensaje = msg == "OK" ? "Evento actualizado correctamente" : msg };
        }
        return new MensajeResponseDto { Exito = false, Mensaje = "Sin respuesta del servidor" };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ELIMINAR EVENTO
    // ──────────────────────────────────────────────────────────────────────────
    public async Task<MensajeResponseDto> EliminarEventoAsync(int idEvento, int idOrganizador)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Evento_Eliminar", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_evento",      idEvento);
        cmd.Parameters.AddWithValue("@id_organizador", idOrganizador);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            string msg = reader.GetString(reader.GetOrdinal("mensaje"));
            return new MensajeResponseDto { Exito = msg == "OK", Mensaje = msg == "OK" ? "Evento eliminado correctamente" : msg };
        }
        return new MensajeResponseDto { Exito = false, Mensaje = "Sin respuesta del servidor" };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // OBTENER EVENTOS (Lista Paginada)
    // ──────────────────────────────────────────────────────────────────────────
    public async Task<List<EventoResumenDto>> ObtenerEventosAsync(FiltrosEventoDto filtros)
    {
        var lista = new List<EventoResumenDto>();

        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Evento_ObtenerEventos", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@busqueda",      (object?)filtros.Busqueda    ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@tipo_evento",   (object?)filtros.TipoEvento  ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@ubicacion",     (object?)filtros.Ubicacion   ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@solo_proximos", filtros.SoloProximos);
        cmd.Parameters.AddWithValue("@pagina",        filtros.Pagina);
        cmd.Parameters.AddWithValue("@tamano_pagina", filtros.TamanoPagina);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            lista.Add(new EventoResumenDto
            {
                IdEvento          = reader.GetInt32(reader.GetOrdinal("id_evento")),
                Titulo            = reader.GetString(reader.GetOrdinal("titulo")),
                Descripcion       = reader.IsDBNull(reader.GetOrdinal("descripcion"))      ? null : reader.GetString(reader.GetOrdinal("descripcion")),
                TipoEvento        = reader.IsDBNull(reader.GetOrdinal("tipo_evento"))      ? null : reader.GetString(reader.GetOrdinal("tipo_evento")),
                FechaEvento       = reader.GetDateTime(reader.GetOrdinal("fecha_evento")),
                Ubicacion         = reader.IsDBNull(reader.GetOrdinal("ubicacion"))        ? null : reader.GetString(reader.GetOrdinal("ubicacion")),
                InfoInscripcion   = reader.IsDBNull(reader.GetOrdinal("info_inscripcion")) ? null : reader.GetString(reader.GetOrdinal("info_inscripcion")),
                FechaPublicacion  = reader.GetDateTime(reader.GetOrdinal("fecha_publicacion")),
                OrganizadorId     = reader.GetInt32(reader.GetOrdinal("organizador_id")),
                OrganizadorNombre = reader.GetString(reader.GetOrdinal("organizador_nombre")),
                OrganizadorTipo   = reader.GetString(reader.GetOrdinal("organizador_tipo")),
                FotoPerfilUrl     = reader.IsDBNull(reader.GetOrdinal("foto_perfil_url")) ? null : reader.GetString(reader.GetOrdinal("foto_perfil_url")),
                TotalMedia        = reader.GetInt32(reader.GetOrdinal("total_media"))
            });
        }
        return lista;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // OBTENER DETALLE DE UN EVENTO (Multi-Resultset)
    // ──────────────────────────────────────────────────────────────────────────
    public async Task<EventoDetalleDto?> ObtenerEventoDetalleAsync(int idEvento)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Evento_ObtenerDetalle", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_evento", idEvento);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();

        if (!await reader.ReadAsync()) return null;

        var detalle = new EventoDetalleDto
        {
            IdEvento          = reader.GetInt32(reader.GetOrdinal("id_evento")),
            Titulo            = reader.GetString(reader.GetOrdinal("titulo")),
            Descripcion       = reader.IsDBNull(reader.GetOrdinal("descripcion"))      ? null : reader.GetString(reader.GetOrdinal("descripcion")),
            TipoEvento        = reader.IsDBNull(reader.GetOrdinal("tipo_evento"))      ? null : reader.GetString(reader.GetOrdinal("tipo_evento")),
            FechaEvento       = reader.GetDateTime(reader.GetOrdinal("fecha_evento")),
            Ubicacion         = reader.IsDBNull(reader.GetOrdinal("ubicacion"))        ? null : reader.GetString(reader.GetOrdinal("ubicacion")),
            InfoInscripcion   = reader.IsDBNull(reader.GetOrdinal("info_inscripcion")) ? null : reader.GetString(reader.GetOrdinal("info_inscripcion")),
            FechaPublicacion  = reader.GetDateTime(reader.GetOrdinal("fecha_publicacion")),
            OrganizadorId     = reader.GetInt32(reader.GetOrdinal("organizador_id")),
            OrganizadorNombre = reader.GetString(reader.GetOrdinal("organizador_nombre")),
            OrganizadorEmail  = reader.IsDBNull(reader.GetOrdinal("organizador_email")) ? null : reader.GetString(reader.GetOrdinal("organizador_email")),
            FotoPerfilUrl     = reader.IsDBNull(reader.GetOrdinal("foto_perfil_url"))   ? null : reader.GetString(reader.GetOrdinal("foto_perfil_url")),
            OrganizadorTipo   = reader.GetString(reader.GetOrdinal("organizador_tipo"))
        };

        // ResultSet 2: Multimedia del evento
        await reader.NextResultAsync();
        while (await reader.ReadAsync())
        {
            detalle.Media.Add(new EventoMediaDto
            {
                IdEventoMultimedia = reader.GetInt32(reader.GetOrdinal("id_eventomultimedia")),
                IdEvento           = reader.GetInt32(reader.GetOrdinal("id_evento")),
                Tipo               = reader.GetString(reader.GetOrdinal("tipo")),
                Url                = reader.GetString(reader.GetOrdinal("url")),
                Descripcion        = reader.IsDBNull(reader.GetOrdinal("descripcion")) ? null : reader.GetString(reader.GetOrdinal("descripcion")),
                FechaSubida        = reader.GetDateTime(reader.GetOrdinal("fecha_subida"))
            });
        }

        return detalle;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // AGREGAR MEDIA AL EVENTO
    // ──────────────────────────────────────────────────────────────────────────
    public async Task<IdMensajeResponseDto> AgregarMediaAsync(int idEvento, int idOrganizador, AgregarEventoMediaDto dto)
    {
        await using SqlConnection conn = new(_connectionString);
        await conn.OpenAsync();

        // Verificar pertenencia del evento
        await using (SqlCommand checkCmd = new("SELECT id_organizador FROM dbo.Evento WHERE id_evento = @id_evento", conn))
        {
            checkCmd.Parameters.AddWithValue("@id_evento", idEvento);
            var result = await checkCmd.ExecuteScalarAsync();
            if (result == null || Convert.ToInt32(result) != idOrganizador)
            {
                return new IdMensajeResponseDto { Id = -1, Exito = false, Mensaje = "El evento no existe o no le pertenece" };
            }
        }

        await using (SqlCommand cmd = new("dbo.sp_Evento_AgregarMedia", conn))
        {
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@id_evento",   idEvento);
            cmd.Parameters.AddWithValue("@tipo",        dto.Tipo);
            cmd.Parameters.AddWithValue("@url",         dto.Url);
            cmd.Parameters.AddWithValue("@descripcion", (object?)dto.Descripcion ?? DBNull.Value);

            await using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                int id = Convert.ToInt32(reader["id_eventomultimedia"]);
                string msg = reader.GetString(reader.GetOrdinal("mensaje"));
                return new IdMensajeResponseDto { Id = id, Exito = id > 0, Mensaje = id > 0 ? "Media agregada al evento" : msg };
            }
        }

        return new IdMensajeResponseDto { Id = -1, Exito = false, Mensaje = "Sin respuesta del servidor" };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ELIMINAR MEDIA DEL EVENTO
    // ──────────────────────────────────────────────────────────────────────────
    public async Task<MensajeResponseDto> EliminarMediaAsync(int idEventoMultimedia, int idUsuario)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Evento_EliminarMedia", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_eventomultimedia", idEventoMultimedia);
        cmd.Parameters.AddWithValue("@id_usuario",           idUsuario);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            string msg = reader.GetString(reader.GetOrdinal("mensaje"));
            return new MensajeResponseDto { Exito = msg == "OK", Mensaje = msg == "OK" ? "Media del evento eliminada correctamente" : msg };
        }
        return new MensajeResponseDto { Exito = false, Mensaje = "Sin respuesta del servidor" };
    }
}
