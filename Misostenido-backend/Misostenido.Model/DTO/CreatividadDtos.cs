namespace Misostenido.Model.DTO;

// ── DTO: Categoría de Creatividad ───────────────────────────────────────────
public class CategoriaCreatividadDto
{
    public int IdCategoria { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string? Icono { get; set; }
    public string Slug { get; set; } = string.Empty;
    public int OrdenDisplay { get; set; }
}

// ── DTO: Filtros para listar negocios ───────────────────────────────────────
public class FiltrosNegocioDto
{
    public int? IdCategoria { get; set; }
    public string? Ciudad { get; set; }
    public string? Busqueda { get; set; }
    public bool SoloVerificados { get; set; } = false;
    public bool SoloDestacados { get; set; } = false;
    public string Orden { get; set; } = "RECIENTES"; // RECIENTES | CALIFICACION | VISTAS
    public int Pagina { get; set; } = 1;
    public int TamPagina { get; set; } = 12;
}

// ── DTO: Resumen de negocio en catálogo/listado ──────────────────────────────
public class NegocioResumenDto
{
    public int IdNegocio { get; set; }
    public int IdCategoria { get; set; }
    public string Categoria { get; set; } = string.Empty;
    public string? CategoriaIcono { get; set; }
    public string CategoriaSlug { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string? Slogan { get; set; }
    public string? LogoUrl { get; set; }
    public string? ImagenPortadaUrl { get; set; }
    public string? Ciudad { get; set; }
    public string? Pais { get; set; }
    public string? Telefono { get; set; }
    public string? Whatsapp { get; set; }
    public string? EmailContacto { get; set; }
    public string? SitioWeb { get; set; }
    public string? Horario { get; set; }
    public decimal? PrecioDesde { get; set; }
    public decimal? PrecioHasta { get; set; }
    public string Moneda { get; set; } = "MXN";
    public bool Verificado { get; set; }
    public bool Destacado { get; set; }
    public int TotalResenas { get; set; }
    public decimal CalificacionPromedio { get; set; }
    public int TotalVistas { get; set; }
    public DateTime FechaRegistro { get; set; }
    public int TotalRegistros { get; set; }
}

// ── DTO: Multimedia de Negocio ──────────────────────────────────────────────
public class NegocioMultimediaDto
{
    public int IdNegocioMultimedia { get; set; }
    public string Tipo { get; set; } = string.Empty; // FOTO o VIDEO
    public string Url { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public bool EsPrincipal { get; set; }
    public int Orden { get; set; }
}

// ── DTO: Curso para Negocio Educativo o Instructor Independiente ────────────
public class CursoCreatividadDto
{
    public int IdCurso { get; set; }
    public int? IdNegocio { get; set; }
    public string NombreCurso { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string? Nivel { get; set; }
    public string? Modalidad { get; set; }
    public string? Duracion { get; set; }
    public string? Horario { get; set; }
    public decimal? Precio { get; set; }
    public string? VideoUrl { get; set; }
    public string? AudioUrl { get; set; }
    public string? ImagenUrl { get; set; }
    public int? CuposDisponibles { get; set; }
    public string? NombreNegocio { get; set; }
    public string? Ciudad { get; set; }
    public string? NegocioPortadaUrl { get; set; }
}

// ── DTO: Detalle completo de Negocio (incluye tags, multimedia y cursos) ─────
public class NegocioDetalleDto
{
    public int IdNegocio { get; set; }
    public int IdCategoria { get; set; }
    public string Categoria { get; set; } = string.Empty;
    public string? CategoriaIcono { get; set; }
    public string CategoriaSlug { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string? Slogan { get; set; }
    public string? LogoUrl { get; set; }
    public string? ImagenPortadaUrl { get; set; }
    public string? Direccion { get; set; }
    public string? Ciudad { get; set; }
    public string? Pais { get; set; }
    public string? Telefono { get; set; }
    public string? Whatsapp { get; set; }
    public string? EmailContacto { get; set; }
    public string? SitioWeb { get; set; }
    public string? Instagram { get; set; }
    public string? Facebook { get; set; }
    public string? Tiktok { get; set; }
    public string? Youtube { get; set; }
    public string? Horario { get; set; }
    public decimal? PrecioDesde { get; set; }
    public decimal? PrecioHasta { get; set; }
    public string Moneda { get; set; } = "MXN";
    public bool Verificado { get; set; }
    public bool Destacado { get; set; }
    public int TotalResenas { get; set; }
    public decimal CalificacionPromedio { get; set; }
    public int TotalVistas { get; set; }
    public DateTime FechaRegistro { get; set; }
    public bool EsFavorito { get; set; }
    public List<string> Tags { get; set; } = [];
    public List<NegocioMultimediaDto> Multimedia { get; set; } = [];
    public List<CursoCreatividadDto> Cursos { get; set; } = [];
}

// ── DTO: Crear Negocio ───────────────────────────────────────────────────────
public class CrearNegocioDto
{
    public int IdCategoria { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string? Slogan { get; set; }
    public string? LogoUrl { get; set; }
    public string? ImagenPortadaUrl { get; set; }
    public string? Direccion { get; set; }
    public string? Ciudad { get; set; }
    public string? Pais { get; set; }
    public string? Telefono { get; set; }
    public string? Whatsapp { get; set; }
    public string? EmailContacto { get; set; }
    public string? SitioWeb { get; set; }
    public string? Instagram { get; set; }
    public string? Facebook { get; set; }
    public string? Tiktok { get; set; }
    public string? Youtube { get; set; }
    public string? Horario { get; set; }
    public decimal? PrecioDesde { get; set; }
    public decimal? PrecioHasta { get; set; }
    public string Moneda { get; set; } = "MXN";
}

// ── DTO: Actualizar Negocio ──────────────────────────────────────────────────
public class ActualizarNegocioDto
{
    public string? Nombre { get; set; }
    public string? Descripcion { get; set; }
    public string? Slogan { get; set; }
    public string? LogoUrl { get; set; }
    public string? ImagenPortadaUrl { get; set; }
    public string? Direccion { get; set; }
    public string? Ciudad { get; set; }
    public string? Pais { get; set; }
    public string? Telefono { get; set; }
    public string? Whatsapp { get; set; }
    public string? EmailContacto { get; set; }
    public string? SitioWeb { get; set; }
    public string? Instagram { get; set; }
    public string? Facebook { get; set; }
    public string? Tiktok { get; set; }
    public string? Youtube { get; set; }
    public string? Horario { get; set; }
    public decimal? PrecioDesde { get; set; }
    public decimal? PrecioHasta { get; set; }
    public string? Moneda { get; set; }
}

// ── DTO: Toggle Favorito Response ────────────────────────────────────────────
public class ToggleFavoritoResponseDto
{
    public bool EsFavorito { get; set; }
    public bool Exito { get; set; }
    public string Mensaje { get; set; } = string.Empty;
}

// ── DTO: Negocio Favorito del usuario ────────────────────────────────────────
public class NegocioFavoritoDto
{
    public int IdNegocio { get; set; }
    public int IdCategoria { get; set; }
    public string Categoria { get; set; } = string.Empty;
    public string? CategoriaIcono { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string? ImagenPortadaUrl { get; set; }
    public string? Ciudad { get; set; }
    public decimal CalificacionPromedio { get; set; }
    public int TotalResenas { get; set; }
    public bool Verificado { get; set; }
    public DateTime FechaFavorito { get; set; }
}

// ── DTO: Crear Reseña ────────────────────────────────────────────────────────
public class CrearResenaDto
{
    public byte Calificacion { get; set; }
    public string? Comentario { get; set; }
}

// ── DTO: Reseña de Negocio ───────────────────────────────────────────────────
public class NegocioResenaDto
{
    public int IdResena { get; set; }
    public int IdUsuario { get; set; }
    public string NombreUsuario { get; set; } = string.Empty;
    public string? FotoPerfilUrl { get; set; }
    public byte Calificacion { get; set; }
    public string? Comentario { get; set; }
    public DateTime Fecha { get; set; }
    public int TotalRegistros { get; set; }
}

// ── DTO: Agregar Multimedia a Negocio ────────────────────────────────────────
public class AgregarNegocioMultimediaDto
{
    public string Tipo { get; set; } = "FOTO"; // FOTO o VIDEO
    public string Url { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public bool EsPrincipal { get; set; } = false;
    public int Orden { get; set; } = 0;
}

// ── DTO: Agregar Tag a Negocio ───────────────────────────────────────────────
public class AgregarTagDto
{
    public string Tag { get; set; } = string.Empty;
}

// ── DTO: Crear Curso o Video Clase ──────────────────────────────────────────
public class CrearCursoCreatividadDto
{
    public int? IdNegocio { get; set; }
    public string NombreCurso { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string? Nivel { get; set; }
    public string? Modalidad { get; set; }
    public string? Duracion { get; set; }
    public string? Horario { get; set; }
    public decimal? Precio { get; set; }
    public string? VideoUrl { get; set; }
    public string? AudioUrl { get; set; }
    public string? ImagenUrl { get; set; }
    public int? CuposDisponibles { get; set; }
}

// ── DTO: Búsqueda Global en Creatividad ──────────────────────────────────────
public class NegocioBusquedaDto
{
    public int IdNegocio { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string? ImagenPortadaUrl { get; set; }
    public string? Ciudad { get; set; }
    public decimal CalificacionPromedio { get; set; }
    public bool Verificado { get; set; }
    public string Categoria { get; set; } = string.Empty;
    public string? CategoriaIcono { get; set; }
    public string CategoriaSlug { get; set; } = string.Empty;
}

// ── DTO: Negocios por Slug de Categoría ──────────────────────────────────────
public class NegocioPorSlugDto
{
    public int IdNegocio { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string? Slogan { get; set; }
    public string? ImagenPortadaUrl { get; set; }
    public string? LogoUrl { get; set; }
    public string? Ciudad { get; set; }
    public string? Pais { get; set; }
    public string? Telefono { get; set; }
    public string? Whatsapp { get; set; }
    public decimal? PrecioDesde { get; set; }
    public decimal? PrecioHasta { get; set; }
    public string Moneda { get; set; } = "MXN";
    public decimal CalificacionPromedio { get; set; }
    public int TotalResenas { get; set; }
    public bool Verificado { get; set; }
    public bool Destacado { get; set; }
    public string? Horario { get; set; }
    public int TotalRegistros { get; set; }
}
