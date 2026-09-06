using System.Data;
using Interface;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Misostenido.Model.DTO;

namespace Implementation;

public class CreatividadService : ICreatividadService
{
    private readonly string _connectionString;

    public CreatividadService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("ConnectionString 'DefaultConnection' no configurada.");
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 1. OBTENER CATEGORÍAS
    // ──────────────────────────────────────────────────────────────────────────
    public async Task<List<CategoriaCreatividadDto>> ObtenerCategoriasAsync()
    {
        var lista = new List<CategoriaCreatividadDto>();
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Creatividad_ObtenerCategorias", conn);
        cmd.CommandType = CommandType.StoredProcedure;

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            lista.Add(new CategoriaCreatividadDto
            {
                IdCategoria   = reader.GetInt32(reader.GetOrdinal("id_categoria")),
                Nombre        = reader.GetString(reader.GetOrdinal("nombre")),
                Descripcion   = reader.IsDBNull(reader.GetOrdinal("descripcion")) ? null : reader.GetString(reader.GetOrdinal("descripcion")),
                Icono         = reader.IsDBNull(reader.GetOrdinal("icono")) ? null : reader.GetString(reader.GetOrdinal("icono")),
                Slug          = reader.GetString(reader.GetOrdinal("slug")),
                OrdenDisplay  = reader.GetInt32(reader.GetOrdinal("orden_display"))
            });
        }
        return lista;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 2. LISTAR NEGOCIOS (Filtros y Paginación)
    // ──────────────────────────────────────────────────────────────────────────
    public async Task<List<NegocioResumenDto>> ListarNegociosAsync(FiltrosNegocioDto filtros)
    {
        var lista = new List<NegocioResumenDto>();
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Creatividad_ListarNegocios", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_categoria",     (object?)filtros.IdCategoria ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@ciudad",           (object?)filtros.Ciudad ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@busqueda",         (object?)filtros.Busqueda ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@solo_verificados", filtros.SoloVerificados);
        cmd.Parameters.AddWithValue("@solo_destacados",  filtros.SoloDestacados);
        cmd.Parameters.AddWithValue("@orden",            filtros.Orden ?? "RECIENTES");
        cmd.Parameters.AddWithValue("@pagina",           filtros.Pagina);
        cmd.Parameters.AddWithValue("@tam_pagina",       filtros.TamPagina);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            lista.Add(new NegocioResumenDto
            {
                IdNegocio            = reader.GetInt32(reader.GetOrdinal("id_negocio")),
                IdCategoria          = reader.GetInt32(reader.GetOrdinal("id_categoria")),
                Categoria            = reader.GetString(reader.GetOrdinal("categoria")),
                CategoriaIcono       = reader.IsDBNull(reader.GetOrdinal("categoria_icono")) ? null : reader.GetString(reader.GetOrdinal("categoria_icono")),
                CategoriaSlug        = reader.GetString(reader.GetOrdinal("categoria_slug")),
                Nombre               = reader.GetString(reader.GetOrdinal("nombre")),
                Descripcion          = reader.IsDBNull(reader.GetOrdinal("descripcion")) ? null : reader.GetString(reader.GetOrdinal("descripcion")),
                Slogan               = reader.IsDBNull(reader.GetOrdinal("slogan")) ? null : reader.GetString(reader.GetOrdinal("slogan")),
                LogoUrl              = reader.IsDBNull(reader.GetOrdinal("logo_url")) ? null : reader.GetString(reader.GetOrdinal("logo_url")),
                ImagenPortadaUrl     = reader.IsDBNull(reader.GetOrdinal("imagen_portada_url")) ? null : reader.GetString(reader.GetOrdinal("imagen_portada_url")),
                Ciudad               = reader.IsDBNull(reader.GetOrdinal("ciudad")) ? null : reader.GetString(reader.GetOrdinal("ciudad")),
                Pais                 = reader.IsDBNull(reader.GetOrdinal("pais")) ? null : reader.GetString(reader.GetOrdinal("pais")),
                Telefono             = reader.IsDBNull(reader.GetOrdinal("telefono")) ? null : reader.GetString(reader.GetOrdinal("telefono")),
                Whatsapp             = reader.IsDBNull(reader.GetOrdinal("whatsapp")) ? null : reader.GetString(reader.GetOrdinal("whatsapp")),
                EmailContacto        = reader.IsDBNull(reader.GetOrdinal("email_contacto")) ? null : reader.GetString(reader.GetOrdinal("email_contacto")),
                SitioWeb             = reader.IsDBNull(reader.GetOrdinal("sitio_web")) ? null : reader.GetString(reader.GetOrdinal("sitio_web")),
                Horario              = reader.IsDBNull(reader.GetOrdinal("horario")) ? null : reader.GetString(reader.GetOrdinal("horario")),
                PrecioDesde          = reader.IsDBNull(reader.GetOrdinal("precio_desde")) ? null : reader.GetDecimal(reader.GetOrdinal("precio_desde")),
                PrecioHasta          = reader.IsDBNull(reader.GetOrdinal("precio_hasta")) ? null : reader.GetDecimal(reader.GetOrdinal("precio_hasta")),
                Moneda               = reader.GetString(reader.GetOrdinal("moneda")),
                Verificado           = reader.GetBoolean(reader.GetOrdinal("verificado")),
                Destacado            = reader.GetBoolean(reader.GetOrdinal("destacado")),
                TotalResenas         = reader.GetInt32(reader.GetOrdinal("total_resenas")),
                CalificacionPromedio = reader.GetDecimal(reader.GetOrdinal("calificacion_promedio")),
                TotalVistas          = reader.GetInt32(reader.GetOrdinal("total_vistas")),
                FechaRegistro        = reader.GetDateTime(reader.GetOrdinal("fecha_registro")),
                TotalRegistros       = reader.GetInt32(reader.GetOrdinal("total_registros"))
            });
        }
        return lista;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 3. OBTENER DETALLE DE NEGOCIO (Multi-Resultset)
    // ──────────────────────────────────────────────────────────────────────────
    public async Task<NegocioDetalleDto?> ObtenerNegocioDetalleAsync(int idNegocio, int? idUsuario)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Creatividad_ObtenerNegocioDetalle", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_negocio", idNegocio);
        cmd.Parameters.AddWithValue("@id_usuario", (object?)idUsuario ?? DBNull.Value);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();

        // ── ResultSet 1: Negocio ─────────────────────────────────────────────
        if (!await reader.ReadAsync()) return null;

        var detalle = new NegocioDetalleDto
        {
            IdNegocio            = reader.GetInt32(reader.GetOrdinal("id_negocio")),
            IdCategoria          = reader.GetInt32(reader.GetOrdinal("id_categoria")),
            Categoria            = reader.GetString(reader.GetOrdinal("categoria")),
            CategoriaIcono       = reader.IsDBNull(reader.GetOrdinal("categoria_icono")) ? null : reader.GetString(reader.GetOrdinal("categoria_icono")),
            CategoriaSlug        = reader.GetString(reader.GetOrdinal("categoria_slug")),
            Nombre               = reader.GetString(reader.GetOrdinal("nombre")),
            Descripcion          = reader.IsDBNull(reader.GetOrdinal("descripcion")) ? null : reader.GetString(reader.GetOrdinal("descripcion")),
            Slogan               = reader.IsDBNull(reader.GetOrdinal("slogan")) ? null : reader.GetString(reader.GetOrdinal("slogan")),
            LogoUrl              = reader.IsDBNull(reader.GetOrdinal("logo_url")) ? null : reader.GetString(reader.GetOrdinal("logo_url")),
            ImagenPortadaUrl     = reader.IsDBNull(reader.GetOrdinal("imagen_portada_url")) ? null : reader.GetString(reader.GetOrdinal("imagen_portada_url")),
            Direccion            = reader.IsDBNull(reader.GetOrdinal("direccion")) ? null : reader.GetString(reader.GetOrdinal("direccion")),
            Ciudad               = reader.IsDBNull(reader.GetOrdinal("ciudad")) ? null : reader.GetString(reader.GetOrdinal("ciudad")),
            Pais                 = reader.IsDBNull(reader.GetOrdinal("pais")) ? null : reader.GetString(reader.GetOrdinal("pais")),
            Telefono             = reader.IsDBNull(reader.GetOrdinal("telefono")) ? null : reader.GetString(reader.GetOrdinal("telefono")),
            Whatsapp             = reader.IsDBNull(reader.GetOrdinal("whatsapp")) ? null : reader.GetString(reader.GetOrdinal("whatsapp")),
            EmailContacto        = reader.IsDBNull(reader.GetOrdinal("email_contacto")) ? null : reader.GetString(reader.GetOrdinal("email_contacto")),
            SitioWeb             = reader.IsDBNull(reader.GetOrdinal("sitio_web")) ? null : reader.GetString(reader.GetOrdinal("sitio_web")),
            Instagram            = reader.IsDBNull(reader.GetOrdinal("instagram")) ? null : reader.GetString(reader.GetOrdinal("instagram")),
            Facebook             = reader.IsDBNull(reader.GetOrdinal("facebook")) ? null : reader.GetString(reader.GetOrdinal("facebook")),
            Tiktok               = reader.IsDBNull(reader.GetOrdinal("tiktok")) ? null : reader.GetString(reader.GetOrdinal("tiktok")),
            Youtube              = reader.IsDBNull(reader.GetOrdinal("youtube")) ? null : reader.GetString(reader.GetOrdinal("youtube")),
            Horario              = reader.IsDBNull(reader.GetOrdinal("horario")) ? null : reader.GetString(reader.GetOrdinal("horario")),
            PrecioDesde          = reader.IsDBNull(reader.GetOrdinal("precio_desde")) ? null : reader.GetDecimal(reader.GetOrdinal("precio_desde")),
            PrecioHasta          = reader.IsDBNull(reader.GetOrdinal("precio_hasta")) ? null : reader.GetDecimal(reader.GetOrdinal("precio_hasta")),
            Moneda               = reader.GetString(reader.GetOrdinal("moneda")),
            Verificado           = reader.GetBoolean(reader.GetOrdinal("verificado")),
            Destacado            = reader.GetBoolean(reader.GetOrdinal("destacado")),
            TotalResenas         = reader.GetInt32(reader.GetOrdinal("total_resenas")),
            CalificacionPromedio = reader.GetDecimal(reader.GetOrdinal("calificacion_promedio")),
            TotalVistas          = reader.GetInt32(reader.GetOrdinal("total_vistas")),
            FechaRegistro        = reader.GetDateTime(reader.GetOrdinal("fecha_registro")),
            EsFavorito           = Convert.ToInt32(reader["es_favorito"]) == 1
        };

        // ── ResultSet 2: Tags ────────────────────────────────────────────────
        if (await reader.NextResultAsync())
        {
            while (await reader.ReadAsync())
            {
                detalle.Tags.Add(reader.GetString(reader.GetOrdinal("tag")));
            }
        }

        // ── ResultSet 3: Multimedia ──────────────────────────────────────────
        if (await reader.NextResultAsync())
        {
            while (await reader.ReadAsync())
            {
                detalle.Multimedia.Add(new NegocioMultimediaDto
                {
                    IdNegocioMultimedia = reader.GetInt32(reader.GetOrdinal("id_negociomultimedia")),
                    Tipo                = reader.GetString(reader.GetOrdinal("tipo")),
                    Url                 = reader.GetString(reader.GetOrdinal("url")),
                    Descripcion         = reader.IsDBNull(reader.GetOrdinal("descripcion")) ? null : reader.GetString(reader.GetOrdinal("descripcion")),
                    EsPrincipal         = reader.GetBoolean(reader.GetOrdinal("es_principal")),
                    Orden               = reader.GetInt32(reader.GetOrdinal("orden"))
                });
            }
        }

        // ── ResultSet 4: Cursos ──────────────────────────────────────────────
        if (await reader.NextResultAsync())
        {
            while (await reader.ReadAsync())
            {
                detalle.Cursos.Add(new CursoCreatividadDto
                {
                    IdCurso          = reader.GetInt32(reader.GetOrdinal("id_curso")),
                    IdNegocio        = HasColumn(reader, "id_negocio") && !reader.IsDBNull(reader.GetOrdinal("id_negocio")) ? reader.GetInt32(reader.GetOrdinal("id_negocio")) : null,
                    NombreCurso      = reader.GetString(reader.GetOrdinal("nombre_curso")),
                    Descripcion      = reader.IsDBNull(reader.GetOrdinal("descripcion")) ? null : reader.GetString(reader.GetOrdinal("descripcion")),
                    Nivel            = reader.IsDBNull(reader.GetOrdinal("nivel")) ? null : reader.GetString(reader.GetOrdinal("nivel")),
                    Modalidad        = reader.IsDBNull(reader.GetOrdinal("modalidad")) ? null : reader.GetString(reader.GetOrdinal("modalidad")),
                    Duracion         = reader.IsDBNull(reader.GetOrdinal("duracion")) ? null : reader.GetString(reader.GetOrdinal("duracion")),
                    Horario          = reader.IsDBNull(reader.GetOrdinal("horario")) ? null : reader.GetString(reader.GetOrdinal("horario")),
                    Precio           = reader.IsDBNull(reader.GetOrdinal("precio")) ? null : reader.GetDecimal(reader.GetOrdinal("precio")),
                    VideoUrl         = HasColumn(reader, "video_url") && !reader.IsDBNull(reader.GetOrdinal("video_url")) ? reader.GetString(reader.GetOrdinal("video_url")) : null,
                    AudioUrl         = HasColumn(reader, "audio_url") && !reader.IsDBNull(reader.GetOrdinal("audio_url")) ? reader.GetString(reader.GetOrdinal("audio_url")) : null,
                    ImagenUrl        = reader.IsDBNull(reader.GetOrdinal("imagen_url")) ? null : reader.GetString(reader.GetOrdinal("imagen_url")),
                    CuposDisponibles = reader.IsDBNull(reader.GetOrdinal("cupos_disponibles")) ? null : reader.GetInt32(reader.GetOrdinal("cupos_disponibles"))
                });
            }
        }

        return detalle;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 4. CREAR NEGOCIO
    // ──────────────────────────────────────────────────────────────────────────
    public async Task<IdMensajeResponseDto> CrearNegocioAsync(int? idUsuarioDueno, CrearNegocioDto dto)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Creatividad_CrearNegocio", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_categoria",        dto.IdCategoria);
        cmd.Parameters.AddWithValue("@id_usuario_dueno",   (object?)idUsuarioDueno ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@nombre",              dto.Nombre);
        cmd.Parameters.AddWithValue("@descripcion",         (object?)dto.Descripcion ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@slogan",              (object?)dto.Slogan ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@logo_url",            (object?)dto.LogoUrl ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@imagen_portada_url",  (object?)dto.ImagenPortadaUrl ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@direccion",           (object?)dto.Direccion ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@ciudad",              (object?)dto.Ciudad ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@pais",                (object?)dto.Pais ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@telefono",            (object?)dto.Telefono ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@whatsapp",            (object?)dto.Whatsapp ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@email_contacto",      (object?)dto.EmailContacto ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@sitio_web",           (object?)dto.SitioWeb ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@instagram",           (object?)dto.Instagram ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@facebook",            (object?)dto.Facebook ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@tiktok",              (object?)dto.Tiktok ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@youtube",             (object?)dto.Youtube ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@horario",             (object?)dto.Horario ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@precio_desde",        (object?)dto.PrecioDesde ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@precio_hasta",        (object?)dto.PrecioHasta ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@moneda",              dto.Moneda ?? "MXN");

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            int id = Convert.ToInt32(reader["id_negocio"]);
            string msg = reader.GetString(reader.GetOrdinal("mensaje"));
            return new IdMensajeResponseDto { Id = id, Exito = id > 0, Mensaje = id > 0 ? "Negocio creado exitosamente" : msg };
        }
        return new IdMensajeResponseDto { Id = -1, Exito = false, Mensaje = "Sin respuesta del servidor" };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 5. ACTUALIZAR NEGOCIO
    // ──────────────────────────────────────────────────────────────────────────
    public async Task<MensajeResponseDto> ActualizarNegocioAsync(int idNegocio, int idUsuario, ActualizarNegocioDto dto)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Creatividad_ActualizarNegocio", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_negocio",          idNegocio);
        cmd.Parameters.AddWithValue("@id_usuario",          idUsuario);
        cmd.Parameters.AddWithValue("@nombre",              (object?)dto.Nombre ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@descripcion",         (object?)dto.Descripcion ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@slogan",              (object?)dto.Slogan ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@logo_url",            (object?)dto.LogoUrl ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@imagen_portada_url",  (object?)dto.ImagenPortadaUrl ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@direccion",           (object?)dto.Direccion ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@ciudad",              (object?)dto.Ciudad ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@pais",                (object?)dto.Pais ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@telefono",            (object?)dto.Telefono ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@whatsapp",            (object?)dto.Whatsapp ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@email_contacto",      (object?)dto.EmailContacto ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@sitio_web",           (object?)dto.SitioWeb ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@instagram",           (object?)dto.Instagram ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@facebook",            (object?)dto.Facebook ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@tiktok",              (object?)dto.Tiktok ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@youtube",             (object?)dto.Youtube ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@horario",             (object?)dto.Horario ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@precio_desde",        (object?)dto.PrecioDesde ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@precio_hasta",        (object?)dto.PrecioHasta ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@moneda",              (object?)dto.Moneda ?? DBNull.Value);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            int exito = Convert.ToInt32(reader["exito"]);
            string msg = reader.GetString(reader.GetOrdinal("mensaje"));
            return new MensajeResponseDto { Exito = exito == 1, Mensaje = exito == 1 ? "Negocio actualizado correctamente" : msg };
        }
        return new MensajeResponseDto { Exito = false, Mensaje = "Sin respuesta del servidor" };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 6. ELIMINAR NEGOCIO
    // ──────────────────────────────────────────────────────────────────────────
    public async Task<MensajeResponseDto> EliminarNegocioAsync(int idNegocio, int idUsuario)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Creatividad_EliminarNegocio", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_negocio", idNegocio);
        cmd.Parameters.AddWithValue("@id_usuario", idUsuario);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            int exito = Convert.ToInt32(reader["exito"]);
            string msg = reader.GetString(reader.GetOrdinal("mensaje"));
            return new MensajeResponseDto { Exito = exito == 1, Mensaje = exito == 1 ? "Negocio eliminado correctamente" : msg };
        }
        return new MensajeResponseDto { Exito = false, Mensaje = "Sin respuesta del servidor" };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 7. TOGGLE FAVORITO
    // ──────────────────────────────────────────────────────────────────────────
    public async Task<ToggleFavoritoResponseDto> ToggleFavoritoAsync(int idUsuario, int idNegocio)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Creatividad_ToggleFavorito", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_usuario", idUsuario);
        cmd.Parameters.AddWithValue("@id_negocio", idNegocio);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            int esFav = Convert.ToInt32(reader["es_favorito"]);
            string msg = reader.GetString(reader.GetOrdinal("mensaje"));
            return new ToggleFavoritoResponseDto
            {
                EsFavorito = esFav == 1,
                Exito      = esFav >= 0,
                Mensaje    = msg
            };
        }
        return new ToggleFavoritoResponseDto { EsFavorito = false, Exito = false, Mensaje = "Sin respuesta del servidor" };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 8. OBTENER FAVORITOS DE USUARIO
    // ──────────────────────────────────────────────────────────────────────────
    public async Task<List<NegocioFavoritoDto>> ObtenerFavoritosAsync(int idUsuario)
    {
        var lista = new List<NegocioFavoritoDto>();
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Creatividad_ObtenerFavoritos", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_usuario", idUsuario);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            lista.Add(new NegocioFavoritoDto
            {
                IdNegocio            = reader.GetInt32(reader.GetOrdinal("id_negocio")),
                IdCategoria          = reader.GetInt32(reader.GetOrdinal("id_categoria")),
                Categoria            = reader.GetString(reader.GetOrdinal("categoria")),
                CategoriaIcono       = reader.IsDBNull(reader.GetOrdinal("categoria_icono")) ? null : reader.GetString(reader.GetOrdinal("categoria_icono")),
                Nombre               = reader.GetString(reader.GetOrdinal("nombre")),
                Descripcion          = reader.IsDBNull(reader.GetOrdinal("descripcion")) ? null : reader.GetString(reader.GetOrdinal("descripcion")),
                ImagenPortadaUrl     = reader.IsDBNull(reader.GetOrdinal("imagen_portada_url")) ? null : reader.GetString(reader.GetOrdinal("imagen_portada_url")),
                Ciudad               = reader.IsDBNull(reader.GetOrdinal("ciudad")) ? null : reader.GetString(reader.GetOrdinal("ciudad")),
                CalificacionPromedio = reader.GetDecimal(reader.GetOrdinal("calificacion_promedio")),
                TotalResenas         = reader.GetInt32(reader.GetOrdinal("total_resenas")),
                Verificado           = reader.GetBoolean(reader.GetOrdinal("verificado")),
                FechaFavorito        = reader.GetDateTime(reader.GetOrdinal("fecha_favorito"))
            });
        }
        return lista;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 9. CREAR RESEÑA
    // ──────────────────────────────────────────────────────────────────────────
    public async Task<IdMensajeResponseDto> CrearResenaAsync(int idNegocio, int idUsuario, CrearResenaDto dto)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Creatividad_CrearResena", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_negocio",     idNegocio);
        cmd.Parameters.AddWithValue("@id_usuario",     idUsuario);
        cmd.Parameters.AddWithValue("@calificacion",    dto.Calificacion);
        cmd.Parameters.AddWithValue("@comentario",      (object?)dto.Comentario ?? DBNull.Value);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            int id = Convert.ToInt32(reader["id_resena"]);
            string msg = reader.GetString(reader.GetOrdinal("mensaje"));
            return new IdMensajeResponseDto { Id = id, Exito = id > 0, Mensaje = id > 0 ? "Reseña publicada correctamente" : msg };
        }
        return new IdMensajeResponseDto { Id = -1, Exito = false, Mensaje = "Sin respuesta del servidor" };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 10. OBTENER RESEÑAS DE NEGOCIO
    // ──────────────────────────────────────────────────────────────────────────
    public async Task<List<NegocioResenaDto>> ObtenerResenasAsync(int idNegocio, int pagina = 1, int tamPagina = 10)
    {
        var lista = new List<NegocioResenaDto>();
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Creatividad_ObtenerResenas", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_negocio",   idNegocio);
        cmd.Parameters.AddWithValue("@pagina",       pagina);
        cmd.Parameters.AddWithValue("@tam_pagina",   tamPagina);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            lista.Add(new NegocioResenaDto
            {
                IdResena        = reader.GetInt32(reader.GetOrdinal("id_resena")),
                IdUsuario       = reader.GetInt32(reader.GetOrdinal("id_usuario")),
                NombreUsuario   = reader.GetString(reader.GetOrdinal("nombre_usuario")),
                FotoPerfilUrl   = reader.IsDBNull(reader.GetOrdinal("foto_perfil_url")) ? null : reader.GetString(reader.GetOrdinal("foto_perfil_url")),
                Calificacion    = reader.GetByte(reader.GetOrdinal("calificacion")),
                Comentario      = reader.IsDBNull(reader.GetOrdinal("comentario")) ? null : reader.GetString(reader.GetOrdinal("comentario")),
                Fecha           = reader.GetDateTime(reader.GetOrdinal("fecha")),
                TotalRegistros  = reader.GetInt32(reader.GetOrdinal("total_registros"))
            });
        }
        return lista;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 11. AGREGAR MULTIMEDIA A NEGOCIO
    // ──────────────────────────────────────────────────────────────────────────
    public async Task<IdMensajeResponseDto> AgregarMultimediaAsync(int idNegocio, AgregarNegocioMultimediaDto dto)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Creatividad_AgregarMultimedia", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_negocio",     idNegocio);
        cmd.Parameters.AddWithValue("@tipo",           dto.Tipo);
        cmd.Parameters.AddWithValue("@url",            dto.Url);
        cmd.Parameters.AddWithValue("@descripcion",    (object?)dto.Descripcion ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@es_principal",   dto.EsPrincipal);
        cmd.Parameters.AddWithValue("@orden",          dto.Orden);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            int id = Convert.ToInt32(reader["id_negociomultimedia"]);
            string msg = reader.GetString(reader.GetOrdinal("mensaje"));
            return new IdMensajeResponseDto { Id = id, Exito = id > 0, Mensaje = id > 0 ? "Multimedia agregada correctamente" : msg };
        }
        return new IdMensajeResponseDto { Id = -1, Exito = false, Mensaje = "Sin respuesta del servidor" };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 12. AGREGAR TAG A NEGOCIO
    // ──────────────────────────────────────────────────────────────────────────
    public async Task<MensajeResponseDto> AgregarTagAsync(int idNegocio, string tag)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Creatividad_AgregarTag", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_negocio", idNegocio);
        cmd.Parameters.AddWithValue("@tag",        tag);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            int exito = Convert.ToInt32(reader["exito"]);
            string msg = reader.GetString(reader.GetOrdinal("mensaje"));
            return new MensajeResponseDto { Exito = exito == 1, Mensaje = msg };
        }
        return new MensajeResponseDto { Exito = false, Mensaje = "Sin respuesta del servidor" };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 13. CREAR CURSO
    // ──────────────────────────────────────────────────────────────────────────
    public async Task<IdMensajeResponseDto> CrearCursoAsync(int? idNegocio, CrearCursoCreatividadDto dto)
    {
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Creatividad_CrearCurso", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@id_negocio",          (object?)idNegocio ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@nombre_curso",        dto.NombreCurso);
        cmd.Parameters.AddWithValue("@descripcion",         (object?)dto.Descripcion ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@nivel",               (object?)dto.Nivel ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@modalidad",           (object?)dto.Modalidad ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@duracion",            (object?)dto.Duracion ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@horario",             (object?)dto.Horario ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@precio",              (object?)dto.Precio ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@imagen_url",          (object?)dto.ImagenUrl ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@video_url",           (object?)dto.VideoUrl ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@audio_url",           (object?)dto.AudioUrl ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@cupos_disponibles",   (object?)dto.CuposDisponibles ?? DBNull.Value);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            int id = Convert.ToInt32(reader["id_curso"]);
            string msg = reader.GetString(reader.GetOrdinal("mensaje"));
            return new IdMensajeResponseDto { Id = id, Exito = id > 0, Mensaje = id > 0 ? "Curso registrado exitosamente" : msg };
        }
        return new IdMensajeResponseDto { Id = -1, Exito = false, Mensaje = "Sin respuesta del servidor" };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 13b. LISTAR CURSOS Y VIDEO CLASES (GLOBAL / INDEPENDIENTES Y POR NEGOCIO)
    // ──────────────────────────────────────────────────────────────────────────
    public async Task<List<CursoCreatividadDto>> ListarCursosAsync(string? busqueda, bool soloGratis, string? nivel)
    {
        var lista = new List<CursoCreatividadDto>();
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Creatividad_ListarCursos", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@busqueda", (object?)busqueda ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@solo_gratis", soloGratis);
        cmd.Parameters.AddWithValue("@nivel", (object?)nivel ?? DBNull.Value);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            lista.Add(new CursoCreatividadDto
            {
                IdCurso          = reader.GetInt32(reader.GetOrdinal("id_curso")),
                IdNegocio        = reader.IsDBNull(reader.GetOrdinal("id_negocio")) ? null : reader.GetInt32(reader.GetOrdinal("id_negocio")),
                NombreCurso      = reader.GetString(reader.GetOrdinal("nombre_curso")),
                Descripcion      = reader.IsDBNull(reader.GetOrdinal("descripcion")) ? null : reader.GetString(reader.GetOrdinal("descripcion")),
                Nivel            = reader.IsDBNull(reader.GetOrdinal("nivel")) ? null : reader.GetString(reader.GetOrdinal("nivel")),
                Modalidad        = reader.IsDBNull(reader.GetOrdinal("modalidad")) ? null : reader.GetString(reader.GetOrdinal("modalidad")),
                Duracion         = reader.IsDBNull(reader.GetOrdinal("duracion")) ? null : reader.GetString(reader.GetOrdinal("duracion")),
                Horario          = reader.IsDBNull(reader.GetOrdinal("horario")) ? null : reader.GetString(reader.GetOrdinal("horario")),
                Precio           = reader.IsDBNull(reader.GetOrdinal("precio")) ? null : reader.GetDecimal(reader.GetOrdinal("precio")),
                VideoUrl         = HasColumn(reader, "video_url") && !reader.IsDBNull(reader.GetOrdinal("video_url")) ? reader.GetString(reader.GetOrdinal("video_url")) : null,
                AudioUrl         = HasColumn(reader, "audio_url") && !reader.IsDBNull(reader.GetOrdinal("audio_url")) ? reader.GetString(reader.GetOrdinal("audio_url")) : null,
                ImagenUrl        = reader.IsDBNull(reader.GetOrdinal("imagen_url")) ? null : reader.GetString(reader.GetOrdinal("imagen_url")),
                CuposDisponibles = reader.IsDBNull(reader.GetOrdinal("cupos_disponibles")) ? null : reader.GetInt32(reader.GetOrdinal("cupos_disponibles")),
                NombreNegocio    = HasColumn(reader, "nombre_negocio") && !reader.IsDBNull(reader.GetOrdinal("nombre_negocio")) ? reader.GetString(reader.GetOrdinal("nombre_negocio")) : null,
                Ciudad           = HasColumn(reader, "ciudad") && !reader.IsDBNull(reader.GetOrdinal("ciudad")) ? reader.GetString(reader.GetOrdinal("ciudad")) : null,
                NegocioPortadaUrl= HasColumn(reader, "negocio_portada_url") && !reader.IsDBNull(reader.GetOrdinal("negocio_portada_url")) ? reader.GetString(reader.GetOrdinal("negocio_portada_url")) : null
            });
        }
        return lista;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 14. BÚSQUEDA GLOBAL
    // ──────────────────────────────────────────────────────────────────────────
    public async Task<List<NegocioBusquedaDto>> BusquedaGlobalAsync(string termino, int limite = 20)
    {
        var lista = new List<NegocioBusquedaDto>();
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Creatividad_BusquedaGlobal", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@termino", termino);
        cmd.Parameters.AddWithValue("@limite",  limite);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            lista.Add(new NegocioBusquedaDto
            {
                IdNegocio            = reader.GetInt32(reader.GetOrdinal("id_negocio")),
                Nombre               = reader.GetString(reader.GetOrdinal("nombre")),
                Descripcion          = reader.IsDBNull(reader.GetOrdinal("descripcion")) ? null : reader.GetString(reader.GetOrdinal("descripcion")),
                ImagenPortadaUrl     = reader.IsDBNull(reader.GetOrdinal("imagen_portada_url")) ? null : reader.GetString(reader.GetOrdinal("imagen_portada_url")),
                Ciudad               = reader.IsDBNull(reader.GetOrdinal("ciudad")) ? null : reader.GetString(reader.GetOrdinal("ciudad")),
                CalificacionPromedio = reader.GetDecimal(reader.GetOrdinal("calificacion_promedio")),
                Verificado           = reader.GetBoolean(reader.GetOrdinal("verificado")),
                Categoria            = reader.GetString(reader.GetOrdinal("categoria")),
                CategoriaIcono       = reader.IsDBNull(reader.GetOrdinal("categoria_icono")) ? null : reader.GetString(reader.GetOrdinal("categoria_icono")),
                CategoriaSlug        = reader.GetString(reader.GetOrdinal("categoria_slug"))
            });
        }
        return lista;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 15. OBTENER NEGOCIOS POR SLUG DE CATEGORÍA
    // ──────────────────────────────────────────────────────────────────────────
    public async Task<List<NegocioPorSlugDto>> ObtenerPorSlugAsync(string slug, int pagina = 1, int tamPagina = 12)
    {
        var lista = new List<NegocioPorSlugDto>();
        await using SqlConnection conn = new(_connectionString);
        await using SqlCommand cmd = new("dbo.sp_Creatividad_ObtenerPorSlug", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@slug",       slug);
        cmd.Parameters.AddWithValue("@pagina",     pagina);
        cmd.Parameters.AddWithValue("@tam_pagina", tamPagina);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            // If category wasn't found, sp returns 0 as total_registros with no other cols
            if (reader.FieldCount == 1) break;

            lista.Add(new NegocioPorSlugDto
            {
                IdNegocio            = reader.GetInt32(reader.GetOrdinal("id_negocio")),
                Nombre               = reader.GetString(reader.GetOrdinal("nombre")),
                Descripcion          = reader.IsDBNull(reader.GetOrdinal("descripcion")) ? null : reader.GetString(reader.GetOrdinal("descripcion")),
                Slogan               = reader.IsDBNull(reader.GetOrdinal("slogan")) ? null : reader.GetString(reader.GetOrdinal("slogan")),
                ImagenPortadaUrl     = reader.IsDBNull(reader.GetOrdinal("imagen_portada_url")) ? null : reader.GetString(reader.GetOrdinal("imagen_portada_url")),
                LogoUrl              = reader.IsDBNull(reader.GetOrdinal("logo_url")) ? null : reader.GetString(reader.GetOrdinal("logo_url")),
                Ciudad               = reader.IsDBNull(reader.GetOrdinal("ciudad")) ? null : reader.GetString(reader.GetOrdinal("ciudad")),
                Pais                 = reader.IsDBNull(reader.GetOrdinal("pais")) ? null : reader.GetString(reader.GetOrdinal("pais")),
                Telefono             = reader.IsDBNull(reader.GetOrdinal("telefono")) ? null : reader.GetString(reader.GetOrdinal("telefono")),
                Whatsapp             = reader.IsDBNull(reader.GetOrdinal("whatsapp")) ? null : reader.GetString(reader.GetOrdinal("whatsapp")),
                PrecioDesde          = reader.IsDBNull(reader.GetOrdinal("precio_desde")) ? null : reader.GetDecimal(reader.GetOrdinal("precio_desde")),
                PrecioHasta          = reader.IsDBNull(reader.GetOrdinal("precio_hasta")) ? null : reader.GetDecimal(reader.GetOrdinal("precio_hasta")),
                Moneda               = reader.GetString(reader.GetOrdinal("moneda")),
                CalificacionPromedio = reader.GetDecimal(reader.GetOrdinal("calificacion_promedio")),
                TotalResenas         = reader.GetInt32(reader.GetOrdinal("total_resenas")),
                Verificado           = reader.GetBoolean(reader.GetOrdinal("verificado")),
                Destacado            = reader.GetBoolean(reader.GetOrdinal("destacado")),
                Horario              = reader.IsDBNull(reader.GetOrdinal("horario")) ? null : reader.GetString(reader.GetOrdinal("horario")),
                TotalRegistros       = reader.GetInt32(reader.GetOrdinal("total_registros"))
            });
        }
        return lista;
    }

    private static bool HasColumn(IDataRecord reader, string columnName)
    {
        for (int i = 0; i < reader.FieldCount; i++)
        {
            if (reader.GetName(i).Equals(columnName, StringComparison.OrdinalIgnoreCase))
                return true;
        }
        return false;
    }
}

