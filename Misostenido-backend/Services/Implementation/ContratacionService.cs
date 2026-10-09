using System.Data;
using Interface;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Misostenido.Model.DTO;

namespace Implementation;

public class ContratacionService : IContratacionService
{
    private readonly string _connectionString;

    public ContratacionService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("ConnectionString 'DefaultConnection' no configurada.");
    }

    // ──────────────────────────────────────────────────────────────────────────
    // OFERTAS DE SERVICIO
    // ──────────────────────────────────────────────────────────────────────────

    public async Task<IdMensajeResponseDto> CrearOfertaAsync(int idUsuario, CrearOfertaDto dto)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Contratacion_CrearOferta", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_usuario",         idUsuario);
        cmd.Parameters.AddWithValue("@titulo",             dto.Titulo);
        cmd.Parameters.AddWithValue("@descripcion",        (object?)dto.Descripcion       ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@genero_musical",     (object?)dto.GeneroMusical      ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@tarifa_aproximada",  (object?)dto.TarifaAproximada   ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@ubicacion",          (object?)dto.Ubicacion          ?? DBNull.Value);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            int id = Convert.ToInt32(reader["id_ofertaservicio"]);
            string msg = reader.GetString(reader.GetOrdinal("mensaje"));
            return new IdMensajeResponseDto { Id = id, Exito = id > 0, Mensaje = id > 0 ? "Oferta creada exitosamente" : msg };
        }
        return new IdMensajeResponseDto { Id = -1, Exito = false, Mensaje = "Sin respuesta del servidor" };
    }

    public async Task<MensajeResponseDto> ActualizarOfertaAsync(int idOferta, int idUsuario, ActualizarOfertaDto dto)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Contratacion_ActualizarOferta", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_ofertaservicio",  idOferta);
        cmd.Parameters.AddWithValue("@id_usuario",         idUsuario);
        cmd.Parameters.AddWithValue("@titulo",             dto.Titulo);
        cmd.Parameters.AddWithValue("@descripcion",        (object?)dto.Descripcion     ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@genero_musical",     (object?)dto.GeneroMusical   ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@tarifa_aproximada",  (object?)dto.TarifaAproximada ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@ubicacion",          (object?)dto.Ubicacion       ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@disponible",         dto.Disponible);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            string msg = reader.GetString(reader.GetOrdinal("mensaje"));
            return new MensajeResponseDto { Exito = msg == "OK", Mensaje = msg == "OK" ? "Oferta actualizada correctamente" : msg };
        }
        return new MensajeResponseDto { Exito = false, Mensaje = "Sin respuesta del servidor" };
    }

    public async Task<MensajeResponseDto> CambiarEstadoOfertaAsync(int idOferta, int idUsuario, bool disponible)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Contratacion_CambiarEstadoOferta", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_ofertaservicio", idOferta);
        cmd.Parameters.AddWithValue("@id_usuario",        idUsuario);
        cmd.Parameters.AddWithValue("@disponible",        disponible);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            string msg = reader.GetString(reader.GetOrdinal("mensaje"));
            return new MensajeResponseDto { Exito = msg == "OK", Mensaje = msg == "OK" ? $"Oferta marcada como {(disponible ? "disponible" : "no disponible")}" : msg };
        }
        return new MensajeResponseDto { Exito = false, Mensaje = "Sin respuesta del servidor" };
    }

    public async Task<MensajeResponseDto> EliminarOfertaAsync(int idOferta, int idUsuario)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Contratacion_EliminarOferta", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_ofertaservicio", idOferta);
        cmd.Parameters.AddWithValue("@id_usuario",        idUsuario);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            string msg = reader.GetString(reader.GetOrdinal("mensaje"));
            return new MensajeResponseDto { Exito = msg == "OK", Mensaje = msg == "OK" ? "Oferta eliminada correctamente" : msg };
        }
        return new MensajeResponseDto { Exito = false, Mensaje = "Sin respuesta del servidor" };
    }

    public async Task<List<OfertaResumenDto>> ObtenerOfertasAsync(FiltrosOfertaDto filtros)
    {
        var lista = new List<OfertaResumenDto>();
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Contratacion_ObtenerOfertas", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@busqueda",       (object?)filtros.Busqueda      ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@genero_musical", (object?)filtros.GeneroMusical  ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@ubicacion",      (object?)filtros.Ubicacion      ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@tarifa_max",     (object?)filtros.TarifaMax      ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@pagina",         filtros.Pagina);
        cmd.Parameters.AddWithValue("@tamano_pagina",  filtros.TamanoPagina);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            lista.Add(new OfertaResumenDto
            {
                IdOfertaServicio  = reader.GetInt32(reader.GetOrdinal("id_ofertaservicio")),
                Titulo            = reader.GetString(reader.GetOrdinal("titulo")),
                Descripcion       = reader.IsDBNull(reader.GetOrdinal("descripcion"))      ? null : reader.GetString(reader.GetOrdinal("descripcion")),
                GeneroMusical     = reader.IsDBNull(reader.GetOrdinal("genero_musical"))   ? null : reader.GetString(reader.GetOrdinal("genero_musical")),
                TarifaAproximada  = reader.IsDBNull(reader.GetOrdinal("tarifa_aproximada"))? null : reader.GetDecimal(reader.GetOrdinal("tarifa_aproximada")),
                Ubicacion         = reader.IsDBNull(reader.GetOrdinal("ubicacion"))        ? null : reader.GetString(reader.GetOrdinal("ubicacion")),
                Disponible        = Convert.ToBoolean(reader["disponible"]),
                FechaPublicacion  = reader.GetDateTime(reader.GetOrdinal("fecha_publicacion")),
                ArtistaId         = reader.GetInt32(reader.GetOrdinal("artista_id")),
                ArtistaNombre     = reader.GetString(reader.GetOrdinal("artista_nombre")),
                ArtistaTipo       = reader.GetString(reader.GetOrdinal("artista_tipo")),
                FotoPerfilUrl     = reader.IsDBNull(reader.GetOrdinal("foto_perfil_url")) ? null : reader.GetString(reader.GetOrdinal("foto_perfil_url")),
                ArtistaVerificado = Convert.ToBoolean(reader["artista_verificado"]),
                TotalMedia        = reader.GetInt32(reader.GetOrdinal("total_media"))
            });
        }
        return lista;
    }

    public async Task<OfertaDetalleDto?> ObtenerOfertaDetalleAsync(int idOferta)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Contratacion_ObtenerOfertaDetalle", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_ofertaservicio", idOferta);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();

        if (!await reader.ReadAsync()) return null;

        var detalle = new OfertaDetalleDto
        {
            IdOfertaServicio  = reader.GetInt32(reader.GetOrdinal("id_ofertaservicio")),
            Titulo            = reader.GetString(reader.GetOrdinal("titulo")),
            Descripcion       = reader.IsDBNull(reader.GetOrdinal("descripcion"))       ? null : reader.GetString(reader.GetOrdinal("descripcion")),
            GeneroMusical     = reader.IsDBNull(reader.GetOrdinal("genero_musical"))    ? null : reader.GetString(reader.GetOrdinal("genero_musical")),
            TarifaAproximada  = reader.IsDBNull(reader.GetOrdinal("tarifa_aproximada"))? null : reader.GetDecimal(reader.GetOrdinal("tarifa_aproximada")),
            Ubicacion         = reader.IsDBNull(reader.GetOrdinal("ubicacion"))         ? null : reader.GetString(reader.GetOrdinal("ubicacion")),
            Disponible        = Convert.ToBoolean(reader["disponible"]),
            FechaPublicacion  = reader.GetDateTime(reader.GetOrdinal("fecha_publicacion")),
            ArtistaId         = reader.GetInt32(reader.GetOrdinal("artista_id")),
            ArtistaNombre     = reader.GetString(reader.GetOrdinal("artista_nombre")),
            ArtistaEmail      = reader.IsDBNull(reader.GetOrdinal("artista_email"))     ? null : reader.GetString(reader.GetOrdinal("artista_email")),
            ArtistaTipo       = reader.GetString(reader.GetOrdinal("artista_tipo")),
            FotoPerfilUrl     = reader.IsDBNull(reader.GetOrdinal("foto_perfil_url"))   ? null : reader.GetString(reader.GetOrdinal("foto_perfil_url")),
            ArtistaVerificado = Convert.ToBoolean(reader["artista_verificado"])
        };

        await reader.NextResultAsync();
        while (await reader.ReadAsync())
        {
            detalle.Media.Add(new ContratacionMediaDto
            {
                IdContratacionMultimedia = reader.GetInt32(reader.GetOrdinal("id_contratacionmultimedia")),
                IdOferta   = reader.IsDBNull(reader.GetOrdinal("id_oferta"))    ? null : reader.GetInt32(reader.GetOrdinal("id_oferta")),
                Tipo       = reader.GetString(reader.GetOrdinal("tipo")),
                Url        = reader.GetString(reader.GetOrdinal("url")),
                Descripcion= reader.IsDBNull(reader.GetOrdinal("descripcion")) ? null : reader.GetString(reader.GetOrdinal("descripcion")),
                FechaSubida= reader.GetDateTime(reader.GetOrdinal("fecha_subida"))
            });
        }
        return detalle;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // SOLICITUDES DE CONTRATACIÓN
    // ──────────────────────────────────────────────────────────────────────────

    public async Task<IdMensajeResponseDto> CrearSolicitudAsync(int idUsuario, CrearSolicitudDto dto)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Contratacion_CrearSolicitud", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_usuario",   idUsuario);
        cmd.Parameters.AddWithValue("@titulo",       dto.Titulo);
        cmd.Parameters.AddWithValue("@descripcion",  (object?)dto.Descripcion  ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@fecha_evento", (object?)dto.FechaEvento  ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@presupuesto",  (object?)dto.Presupuesto  ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@ubicacion",    (object?)dto.Ubicacion    ?? DBNull.Value);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            int id = Convert.ToInt32(reader["id_solicitudcontratacion"]);
            string msg = reader.GetString(reader.GetOrdinal("mensaje"));
            return new IdMensajeResponseDto { Id = id, Exito = id > 0, Mensaje = id > 0 ? "Solicitud creada exitosamente" : msg };
        }
        return new IdMensajeResponseDto { Id = -1, Exito = false, Mensaje = "Sin respuesta del servidor" };
    }

    public async Task<MensajeResponseDto> ActualizarSolicitudAsync(int idSolicitud, int idUsuario, ActualizarSolicitudDto dto)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Contratacion_ActualizarSolicitud", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_solicitudcontratacion", idSolicitud);
        cmd.Parameters.AddWithValue("@id_usuario",   idUsuario);
        cmd.Parameters.AddWithValue("@titulo",       dto.Titulo);
        cmd.Parameters.AddWithValue("@descripcion",  (object?)dto.Descripcion  ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@fecha_evento", (object?)dto.FechaEvento  ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@presupuesto",  (object?)dto.Presupuesto  ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@ubicacion",    (object?)dto.Ubicacion    ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@abierta",      dto.Abierta);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            string msg = reader.GetString(reader.GetOrdinal("mensaje"));
            return new MensajeResponseDto { Exito = msg == "OK", Mensaje = msg == "OK" ? "Solicitud actualizada correctamente" : msg };
        }
        return new MensajeResponseDto { Exito = false, Mensaje = "Sin respuesta del servidor" };
    }

    public async Task<MensajeResponseDto> CambiarEstadoSolicitudAsync(int idSolicitud, int idUsuario, bool abierta)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Contratacion_CambiarEstadoSolicitud", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_solicitudcontratacion", idSolicitud);
        cmd.Parameters.AddWithValue("@id_usuario", idUsuario);
        cmd.Parameters.AddWithValue("@abierta",    abierta);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            string msg = reader.GetString(reader.GetOrdinal("mensaje"));
            return new MensajeResponseDto { Exito = msg == "OK", Mensaje = msg == "OK" ? $"Solicitud marcada como {(abierta ? "abierta" : "cerrada")}" : msg };
        }
        return new MensajeResponseDto { Exito = false, Mensaje = "Sin respuesta del servidor" };
    }

    public async Task<MensajeResponseDto> EliminarSolicitudAsync(int idSolicitud, int idUsuario)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Contratacion_EliminarSolicitud", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_solicitudcontratacion", idSolicitud);
        cmd.Parameters.AddWithValue("@id_usuario", idUsuario);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            string msg = reader.GetString(reader.GetOrdinal("mensaje"));
            return new MensajeResponseDto { Exito = msg == "OK", Mensaje = msg == "OK" ? "Solicitud eliminada correctamente" : msg };
        }
        return new MensajeResponseDto { Exito = false, Mensaje = "Sin respuesta del servidor" };
    }

    public async Task<List<SolicitudResumenDto>> ObtenerSolicitudesAsync(FiltrosSolicitudDto filtros)
    {
        var lista = new List<SolicitudResumenDto>();
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Contratacion_ObtenerSolicitudes", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@busqueda",        (object?)filtros.Busqueda      ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@ubicacion",       (object?)filtros.Ubicacion     ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@presupuesto_min", (object?)filtros.PresupuestoMin ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@pagina",          filtros.Pagina);
        cmd.Parameters.AddWithValue("@tamano_pagina",   filtros.TamanoPagina);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            lista.Add(new SolicitudResumenDto
            {
                IdSolicitudContratacion = reader.GetInt32(reader.GetOrdinal("id_solicitudcontratacion")),
                Titulo              = reader.GetString(reader.GetOrdinal("titulo")),
                Descripcion         = reader.IsDBNull(reader.GetOrdinal("descripcion"))   ? null : reader.GetString(reader.GetOrdinal("descripcion")),
                FechaEvento         = reader.IsDBNull(reader.GetOrdinal("fecha_evento"))  ? null : reader.GetDateTime(reader.GetOrdinal("fecha_evento")),
                Presupuesto         = reader.IsDBNull(reader.GetOrdinal("presupuesto"))   ? null : reader.GetDecimal(reader.GetOrdinal("presupuesto")),
                Ubicacion           = reader.IsDBNull(reader.GetOrdinal("ubicacion"))     ? null : reader.GetString(reader.GetOrdinal("ubicacion")),
                Abierta             = Convert.ToBoolean(reader["abierta"]),
                FechaPublicacion    = reader.GetDateTime(reader.GetOrdinal("fecha_publicacion")),
                ContratanteId       = reader.GetInt32(reader.GetOrdinal("contratante_id")),
                ContratanteNombre   = reader.GetString(reader.GetOrdinal("contratante_nombre")),
                ContratanteTipo     = reader.GetString(reader.GetOrdinal("contratante_tipo")),
                FotoPerfilUrl       = reader.IsDBNull(reader.GetOrdinal("foto_perfil_url")) ? null : reader.GetString(reader.GetOrdinal("foto_perfil_url")),
                TotalPostulaciones  = reader.GetInt32(reader.GetOrdinal("total_postulaciones"))
            });
        }
        return lista;
    }

    public async Task<SolicitudDetalleDto?> ObtenerSolicitudDetalleAsync(int idSolicitud)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Contratacion_ObtenerSolicitudDetalle", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_solicitudcontratacion", idSolicitud);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();

        if (!await reader.ReadAsync()) return null;

        var detalle = new SolicitudDetalleDto
        {
            IdSolicitudContratacion = reader.GetInt32(reader.GetOrdinal("id_solicitudcontratacion")),
            Titulo            = reader.GetString(reader.GetOrdinal("titulo")),
            Descripcion       = reader.IsDBNull(reader.GetOrdinal("descripcion"))  ? null : reader.GetString(reader.GetOrdinal("descripcion")),
            FechaEvento       = reader.IsDBNull(reader.GetOrdinal("fecha_evento")) ? null : reader.GetDateTime(reader.GetOrdinal("fecha_evento")),
            Presupuesto       = reader.IsDBNull(reader.GetOrdinal("presupuesto"))  ? null : reader.GetDecimal(reader.GetOrdinal("presupuesto")),
            Ubicacion         = reader.IsDBNull(reader.GetOrdinal("ubicacion"))    ? null : reader.GetString(reader.GetOrdinal("ubicacion")),
            Abierta           = Convert.ToBoolean(reader["abierta"]),
            FechaPublicacion  = reader.GetDateTime(reader.GetOrdinal("fecha_publicacion")),
            ContratanteId     = reader.GetInt32(reader.GetOrdinal("contratante_id")),
            ContratanteNombre = reader.GetString(reader.GetOrdinal("contratante_nombre")),
            ContratanteEmail  = reader.IsDBNull(reader.GetOrdinal("contratante_email")) ? null : reader.GetString(reader.GetOrdinal("contratante_email")),
            FotoPerfilUrl     = reader.IsDBNull(reader.GetOrdinal("foto_perfil_url"))   ? null : reader.GetString(reader.GetOrdinal("foto_perfil_url"))
        };

        await reader.NextResultAsync();
        while (await reader.ReadAsync())
        {
            detalle.Media.Add(new ContratacionMediaDto
            {
                IdContratacionMultimedia = reader.GetInt32(reader.GetOrdinal("id_contratacionmultimedia")),
                IdSolicitud = reader.IsDBNull(reader.GetOrdinal("id_solicitud")) ? null : reader.GetInt32(reader.GetOrdinal("id_solicitud")),
                Tipo        = reader.GetString(reader.GetOrdinal("tipo")),
                Url         = reader.GetString(reader.GetOrdinal("url")),
                Descripcion = reader.IsDBNull(reader.GetOrdinal("descripcion")) ? null : reader.GetString(reader.GetOrdinal("descripcion")),
                FechaSubida = reader.GetDateTime(reader.GetOrdinal("fecha_subida"))
            });
        }
        return detalle;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // POSTULACIONES
    // ──────────────────────────────────────────────────────────────────────────

    public async Task<IdMensajeResponseDto> CrearPostulacionAsync(int idUsuarioEmisor, CrearPostulacionDto dto)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Contratacion_CrearPostulacion", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_oferta",         (object?)dto.IdOferta     ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@id_solicitud",      (object?)dto.IdSolicitud  ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@id_usuario_emisor", idUsuarioEmisor);
        cmd.Parameters.AddWithValue("@mensaje",           (object?)dto.Mensaje      ?? DBNull.Value);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            int id = Convert.ToInt32(reader["id_postulacion"]);
            string msg = reader.GetString(reader.GetOrdinal("mensaje"));
            return new IdMensajeResponseDto { Id = id, Exito = id > 0, Mensaje = id > 0 ? "Postulación enviada correctamente" : msg };
        }
        return new IdMensajeResponseDto { Id = -1, Exito = false, Mensaje = "Sin respuesta del servidor" };
    }

    public async Task<MensajeResponseDto> ResponderPostulacionAsync(int idPostulacion, int idUsuarioReceptor, string nuevoEstado)
    {
        // Normalizar a los valores aceptados por el CHECK constraint de la BD (PENDIENTE, ACEPTADA, RECHAZADA)
        string estadoNormalizado = (nuevoEstado ?? string.Empty).Trim().ToUpper() switch
        {
            "RECOMENDADA" or "RECOMENDADO" or "VALIDADA" or "VALIDADO" or "APROBADO" or "APROBADA" or "COORDINACION" or "EN_COORDINACION" => "RECOMENDADA",
            "CONTRATADA" or "CONTRATADO" or "CONCRETADA" or "CONCRETADO" or "ACEPTADA" or "ACEPTADO" => "CONTRATADA",
            "EN_REVISION" or "REVISION" => "EN_REVISION",
            "RECHAZADA" or "RECHAZADO" or "CANCELADA" or "CERRADA" or "NO_APTO" => "RECHAZADA",
            _ => "PENDIENTE"
        };

        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Contratacion_ResponderPostulacion", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_postulacion",      idPostulacion);
        cmd.Parameters.AddWithValue("@id_usuario_receptor", idUsuarioReceptor);
        cmd.Parameters.AddWithValue("@nuevo_estado",        estadoNormalizado);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            string msg = reader.GetString(reader.GetOrdinal("mensaje"));
            return new MensajeResponseDto { Exito = msg == "OK", Mensaje = msg == "OK" ? $"Postulación marcada como {estadoNormalizado}" : msg };
        }
        return new MensajeResponseDto { Exito = false, Mensaje = "Sin respuesta del servidor" };
    }

    public async Task<List<PostulacionDto>> ObtenerPostulacionesAsync(int? idOferta, int? idSolicitud, int? idUsuarioEmisor, int? idPropietario = null)
    {
        var lista = new List<PostulacionDto>();
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Contratacion_ObtenerPostulaciones", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_oferta",         (object?)idOferta        ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@id_solicitud",      (object?)idSolicitud     ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@id_usuario_emisor", (object?)idUsuarioEmisor ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@id_propietario",    (object?)idPropietario   ?? DBNull.Value);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            lista.Add(new PostulacionDto
            {
                IdPostulacion   = reader.GetInt32(reader.GetOrdinal("id_postulacion")),
                IdOferta        = reader.IsDBNull(reader.GetOrdinal("id_oferta"))        ? null : reader.GetInt32(reader.GetOrdinal("id_oferta")),
                IdSolicitud     = reader.IsDBNull(reader.GetOrdinal("id_solicitud"))     ? null : reader.GetInt32(reader.GetOrdinal("id_solicitud")),
                Mensaje         = reader.IsDBNull(reader.GetOrdinal("mensaje"))          ? null : reader.GetString(reader.GetOrdinal("mensaje")),
                Estado          = reader.GetString(reader.GetOrdinal("estado")),
                Fecha           = reader.GetDateTime(reader.GetOrdinal("fecha")),
                EmisorId        = reader.GetInt32(reader.GetOrdinal("emisor_id")),
                EmisorNombre    = reader.GetString(reader.GetOrdinal("emisor_nombre")),
                EmisorEmail     = reader.IsDBNull(reader.GetOrdinal("emisor_email"))     ? null : reader.GetString(reader.GetOrdinal("emisor_email")),
                EmisorFoto      = reader.IsDBNull(reader.GetOrdinal("emisor_foto"))      ? null : reader.GetString(reader.GetOrdinal("emisor_foto")),
                EmisorTipo      = reader.GetString(reader.GetOrdinal("emisor_tipo")),
                OfertaTitulo    = reader.IsDBNull(reader.GetOrdinal("oferta_titulo"))    ? null : reader.GetString(reader.GetOrdinal("oferta_titulo")),
                SolicitudTitulo = reader.IsDBNull(reader.GetOrdinal("solicitud_titulo")) ? null : reader.GetString(reader.GetOrdinal("solicitud_titulo"))
            });
        }
        return lista;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // MULTIMEDIA DE CONTRATACIÓN
    // ──────────────────────────────────────────────────────────────────────────

    public async Task<IdMensajeResponseDto> AgregarMediaAsync(int idUsuario, AgregarContratacionMediaDto dto)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Contratacion_AgregarMedia", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_oferta",    (object?)dto.IdOferta    ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@id_solicitud", (object?)dto.IdSolicitud ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@tipo",         dto.Tipo);
        cmd.Parameters.AddWithValue("@url",          dto.Url);
        cmd.Parameters.AddWithValue("@descripcion",  (object?)dto.Descripcion ?? DBNull.Value);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            int id = Convert.ToInt32(reader["id_contratacionmultimedia"]);
            string msg = reader.GetString(reader.GetOrdinal("mensaje"));
            return new IdMensajeResponseDto { Id = id, Exito = id > 0, Mensaje = id > 0 ? "Media agregada correctamente" : msg };
        }
        return new IdMensajeResponseDto { Id = -1, Exito = false, Mensaje = "Sin respuesta del servidor" };
    }

    public async Task<MensajeResponseDto> EliminarMediaAsync(int idContratacionMultimedia, int idUsuario)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Contratacion_EliminarMedia", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_contratacionmultimedia", idContratacionMultimedia);
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

    // ──────────────────────────────────────────────────────────────────────────
    // CHAT & ACUERDOS DE CONTRATACIÓN
    // ──────────────────────────────────────────────────────────────────────────

    public async Task<IdMensajeResponseDto> EnviarMensajeAsync(int idPostulacion, int idUsuario, CrearMensajeContratacionDto dto)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Contratacion_EnviarMensaje", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_postulacion",    idPostulacion);
        cmd.Parameters.AddWithValue("@id_usuario_emisor", idUsuario);
        cmd.Parameters.AddWithValue("@contenido",         dto.Contenido);
        cmd.Parameters.AddWithValue("@tipo_mensaje",      string.IsNullOrWhiteSpace(dto.TipoMensaje) ? "TEXTO" : dto.TipoMensaje);
        cmd.Parameters.AddWithValue("@archivo_url",       (object?)dto.ArchivoUrl ?? DBNull.Value);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            int id = Convert.ToInt32(reader["id_mensaje"]);
            string msg = reader.GetString(reader.GetOrdinal("mensaje"));
            return new IdMensajeResponseDto { Id = id, Exito = id > 0, Mensaje = id > 0 ? "Mensaje enviado exitosamente" : msg };
        }
        return new IdMensajeResponseDto { Id = -1, Exito = false, Mensaje = "Sin respuesta del servidor" };
    }

    public async Task<List<MensajeContratacionDto>> ObtenerMensajesAsync(int idPostulacion, int idUsuario)
    {
        var lista = new List<MensajeContratacionDto>();
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Contratacion_ObtenerMensajes", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_postulacion",    idPostulacion);
        cmd.Parameters.AddWithValue("@id_usuario_lector", idUsuario);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            lista.Add(new MensajeContratacionDto
            {
                IdMensaje        = reader.GetInt32(reader.GetOrdinal("id_mensaje")),
                IdPostulacion    = reader.GetInt32(reader.GetOrdinal("id_postulacion")),
                IdUsuarioEmisor  = reader.GetInt32(reader.GetOrdinal("id_usuario_emisor")),
                EmisorNombre     = reader.GetString(reader.GetOrdinal("emisor_nombre")),
                EmisorFoto       = reader.IsDBNull(reader.GetOrdinal("emisor_foto")) ? null : reader.GetString(reader.GetOrdinal("emisor_foto")),
                EmisorRol        = reader.GetString(reader.GetOrdinal("emisor_rol")),
                Contenido        = reader.GetString(reader.GetOrdinal("contenido")),
                TipoMensaje      = reader.GetString(reader.GetOrdinal("tipo_mensaje")),
                ArchivoUrl       = reader.IsDBNull(reader.GetOrdinal("archivo_url")) ? null : reader.GetString(reader.GetOrdinal("archivo_url")),
                FechaEnvio       = reader.GetDateTime(reader.GetOrdinal("fecha_envio"))
            });
        }
        return lista;
    }

    public async Task<MensajeResponseDto> GuardarAcuerdoAsync(int idPostulacion, int idUsuario, GuardarAcuerdoDto dto)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Contratacion_GuardarAcuerdo", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_postulacion",             idPostulacion);
        cmd.Parameters.AddWithValue("@id_usuario_actor",          idUsuario);
        cmd.Parameters.AddWithValue("@honorarios_acordados",      (object?)dto.HonorariosAcordados ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@fecha_compromiso",          (object?)dto.FechaCompromiso ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@clausulas_especiales",      (object?)dto.ClausulasEspeciales ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@firma_digital_contratante", (object?)dto.FirmaDigitalContratante ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@firma_digital_artista",     (object?)dto.FirmaDigitalArtista ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@estado_acuerdo",            string.IsNullOrWhiteSpace(dto.EstadoAcuerdo) ? "BORRADOR" : dto.EstadoAcuerdo);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            string msg = reader.GetString(reader.GetOrdinal("mensaje"));
            return new MensajeResponseDto { Exito = msg == "OK", Mensaje = msg == "OK" ? "Acuerdo actualizado correctamente" : msg };
        }
        return new MensajeResponseDto { Exito = false, Mensaje = "Sin respuesta del servidor" };
    }

    public async Task<AcuerdoContratacionDto?> ObtenerAcuerdoAsync(int idPostulacion, int idUsuario)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Contratacion_ObtenerAcuerdo", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_postulacion",    idPostulacion);
        cmd.Parameters.AddWithValue("@id_usuario_lector", idUsuario);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return new AcuerdoContratacionDto
            {
                IdAcuerdo                = reader.GetInt32(reader.GetOrdinal("id_acuerdo")),
                IdPostulacion            = reader.GetInt32(reader.GetOrdinal("id_postulacion")),
                HonorariosAcordados      = reader.IsDBNull(reader.GetOrdinal("honorarios_acordados")) ? null : reader.GetDecimal(reader.GetOrdinal("honorarios_acordados")),
                FechaCompromiso          = reader.IsDBNull(reader.GetOrdinal("fecha_compromiso")) ? null : reader.GetDateTime(reader.GetOrdinal("fecha_compromiso")),
                ClausulasEspeciales      = reader.IsDBNull(reader.GetOrdinal("clausulas_especiales")) ? null : reader.GetString(reader.GetOrdinal("clausulas_especiales")),
                FirmaDigitalContratante  = reader.IsDBNull(reader.GetOrdinal("firma_digital_contratante")) ? null : reader.GetString(reader.GetOrdinal("firma_digital_contratante")),
                FechaFirmaContratante    = reader.IsDBNull(reader.GetOrdinal("fecha_firma_contratante")) ? null : reader.GetDateTime(reader.GetOrdinal("fecha_firma_contratante")),
                FirmaDigitalArtista      = reader.IsDBNull(reader.GetOrdinal("firma_digital_artista")) ? null : reader.GetString(reader.GetOrdinal("firma_digital_artista")),
                FechaFirmaArtista        = reader.IsDBNull(reader.GetOrdinal("fecha_firma_artista")) ? null : reader.GetDateTime(reader.GetOrdinal("fecha_firma_artista")),
                EstadoAcuerdo            = reader.GetString(reader.GetOrdinal("estado_acuerdo")),
                FechaCreacion            = reader.GetDateTime(reader.GetOrdinal("fecha_creacion")),
                FechaActualizacion       = reader.IsDBNull(reader.GetOrdinal("fecha_actualizacion")) ? null : reader.GetDateTime(reader.GetOrdinal("fecha_actualizacion"))
            };
        }
        return null;
    }
}

