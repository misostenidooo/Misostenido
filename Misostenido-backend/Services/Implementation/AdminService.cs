using System.Data;
using Interface;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Misostenido.Model.DTO;

namespace Implementation;

public class AdminService : IAdminService
{
    private readonly string _connectionString;

    public AdminService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("ConnectionString 'DefaultConnection' no configurada.");
    }

    // ──────────────────────────────────────────────────────────────────────────
    // OBTENER ESTADÍSTICAS DEL SISTEMA
    // ──────────────────────────────────────────────────────────────────────────
    public async Task<EstadisticasAdminDto> ObtenerEstadisticasAsync()
    {
        var stats = new EstadisticasAdminDto();

        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Admin_ObtenerEstadisticas", conn);
        cmd.CommandType = CommandType.StoredProcedure;

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            stats.TotalUsuarios           = reader.GetInt32(reader.GetOrdinal("total_usuarios"));
            stats.TotalIndividuales       = reader.GetInt32(reader.GetOrdinal("total_individuales"));
            stats.TotalGrupos             = reader.GetInt32(reader.GetOrdinal("total_grupos"));
            stats.TotalEscuelas           = reader.GetInt32(reader.GetOrdinal("total_escuelas"));
            stats.TotalVerificados        = reader.GetInt32(reader.GetOrdinal("total_verificados"));
            stats.TotalPublicaciones      = reader.GetInt32(reader.GetOrdinal("total_publicaciones"));
            stats.TotalOfertasActivas     = reader.GetInt32(reader.GetOrdinal("total_ofertas_activas"));
            stats.TotalSolicitudesAbiertas = reader.GetInt32(reader.GetOrdinal("total_solicitudes_abiertas"));
            stats.TotalEventosProximos    = reader.GetInt32(reader.GetOrdinal("total_eventos_proximos"));
            stats.TotalReportesPendientes = reader.GetInt32(reader.GetOrdinal("total_reportes_pendientes"));
        }

        return stats;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // GESTIONAR USUARIO (Cambiar Estado, Verificado o Rol)
    // ──────────────────────────────────────────────────────────────────────────
    public async Task<MensajeResponseDto> GestionarUsuarioAsync(int idAdmin, int idUsuarioDestino, GestionarUsuarioDto dto)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Admin_GestionarUsuario", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_admin",           idAdmin);
        cmd.Parameters.AddWithValue("@id_usuario_destino", idUsuarioDestino);
        cmd.Parameters.AddWithValue("@nuevo_estado",       (object?)dto.NuevoEstado     ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@nuevo_verificado",   (object?)dto.NuevoVerificado ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@nuevo_id_rol",       (object?)dto.NuevoIdRol      ?? DBNull.Value);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            string msg = reader.GetString(reader.GetOrdinal("mensaje"));
            return new MensajeResponseDto { Exito = msg == "OK", Mensaje = msg == "OK" ? "Usuario actualizado correctamente" : msg };
        }
        return new MensajeResponseDto { Exito = false, Mensaje = "Sin respuesta del servidor" };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // CREAR REPORTE DE CONTENIDO
    // ──────────────────────────────────────────────────────────────────────────
    public async Task<IdMensajeResponseDto> CrearReporteAsync(int idUsuarioReporta, CrearReporteDto dto)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Admin_CrearReporte", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_usuario_reporta",    idUsuarioReporta);
        cmd.Parameters.AddWithValue("@tipo_contenido",        dto.TipoContenido);
        cmd.Parameters.AddWithValue("@id_contenido_reportado", dto.IdContenidoReportado);
        cmd.Parameters.AddWithValue("@motivo",                 dto.Motivo);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            int id = Convert.ToInt32(reader["id_reporte"]);
            string msg = reader.GetString(reader.GetOrdinal("mensaje"));
            return new IdMensajeResponseDto { Id = id, Exito = id > 0, Mensaje = id > 0 ? "Reporte enviado correctamente" : msg };
        }
        return new IdMensajeResponseDto { Id = -1, Exito = false, Mensaje = "Sin respuesta del servidor" };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // OBTENER REPORTES
    // ──────────────────────────────────────────────────────────────────────────
    public async Task<List<ReporteDto>> ObtenerReportesAsync(bool soloPendientes = true)
    {
        var lista = new List<ReporteDto>();

        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Admin_ObtenerReportes", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@solo_pendientes", soloPendientes);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            lista.Add(new ReporteDto
            {
                IdReporte            = reader.GetInt32(reader.GetOrdinal("id_reporte")),
                TipoContenido        = reader.GetString(reader.GetOrdinal("tipo_contenido")),
                IdContenidoReportado = reader.GetInt32(reader.GetOrdinal("id_contenido_reportado")),
                Motivo               = reader.GetString(reader.GetOrdinal("motivo")),
                Resuelto             = Convert.ToBoolean(reader["resuelto"]),
                Fecha                = reader.GetDateTime(reader.GetOrdinal("fecha")),
                ReportadorId         = reader.GetInt32(reader.GetOrdinal("reportador_id")),
                ReportadorNombre     = reader.GetString(reader.GetOrdinal("reportador_nombre")),
                ReportadorEmail      = reader.GetString(reader.GetOrdinal("reportador_email"))
            });
        }
        return lista;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // RESOLVER REPORTE
    // ──────────────────────────────────────────────────────────────────────────
    public async Task<MensajeResponseDto> ResolverReporteAsync(int idAdmin, int idReporte, ResolverReporteDto dto)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Admin_ResolverReporte", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_admin",      idAdmin);
        cmd.Parameters.AddWithValue("@id_reporte",    idReporte);
        cmd.Parameters.AddWithValue("@accion_tomada", (object?)dto.AccionTomada ?? DBNull.Value);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            string msg = reader.GetString(reader.GetOrdinal("mensaje"));
            return new MensajeResponseDto { Exito = msg == "OK", Mensaje = msg == "OK" ? "Reporte resuelto correctamente" : msg };
        }
        return new MensajeResponseDto { Exito = false, Mensaje = "Sin respuesta del servidor" };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // OBTENER LOG DE AUDITORÍA
    // ──────────────────────────────────────────────────────────────────────────
    public async Task<List<LogAuditoriaDto>> ObtenerLogAuditoriaAsync(FiltrosAuditoriaDto filtros)
    {
        var lista = new List<LogAuditoriaDto>();

        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Admin_ObtenerLogAuditoria", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_usuario", (object?)filtros.IdUsuario ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@accion",     (object?)filtros.Accion    ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@limite",     filtros.Limite);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            lista.Add(new LogAuditoriaDto
            {
                IdLogAuditoria = reader.GetInt32(reader.GetOrdinal("id_logauditoria")),
                IdUsuario      = reader.IsDBNull(reader.GetOrdinal("id_usuario"))     ? null : reader.GetInt32(reader.GetOrdinal("id_usuario")),
                UsuarioNombre  = reader.IsDBNull(reader.GetOrdinal("usuario_nombre")) ? null : reader.GetString(reader.GetOrdinal("usuario_nombre")),
                Accion         = reader.GetString(reader.GetOrdinal("accion")),
                TablaAfectada  = reader.IsDBNull(reader.GetOrdinal("tabla_afectada")) ? null : reader.GetString(reader.GetOrdinal("tabla_afectada")),
                IdRegistro     = reader.IsDBNull(reader.GetOrdinal("id_registro"))    ? null : reader.GetInt32(reader.GetOrdinal("id_registro")),
                Detalle        = reader.IsDBNull(reader.GetOrdinal("detalle"))        ? null : reader.GetString(reader.GetOrdinal("detalle")),
                Fecha          = reader.GetDateTime(reader.GetOrdinal("fecha"))
            });
        }
        return lista;
    }
}
