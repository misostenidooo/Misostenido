using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Misostenido.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class UploadController : ControllerBase
{
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<UploadController> _logger;

    public UploadController(IWebHostEnvironment env, ILogger<UploadController> logger)
    {
        _env = env;
        _logger = logger;
    }

    /// <summary>
    /// Sube uno o varios archivos (imágenes, videos o audios) al servidor local.
    /// Retorna las URLs accesibles públicamente.
    /// </summary>
    [HttpPost]
    [AllowAnonymous]
    [RequestSizeLimit(100 * 1024 * 1024)] // 100 MB límite
    public async Task<IActionResult> SubirArchivo([FromForm] List<IFormFile> archivos, [FromQuery] string carpeta = "feed")
    {
        if (archivos == null || archivos.Count == 0)
        {
            // Intentar leer archivo individual de Form.Files
            if (Request.Form.Files.Count > 0)
            {
                archivos = Request.Form.Files.ToList();
            }
            else
            {
                return BadRequest(new { exito = false, mensaje = "No se ha enviado ningún archivo." });
            }
        }

        // Sanitizar nombre de subcarpeta
        carpeta = string.IsNullOrWhiteSpace(carpeta) ? "feed" : Path.GetFileName(carpeta.ToLowerInvariant());

        // Asegurar que existe wwwroot/uploads/{carpeta}
        string webRoot = _env.WebRootPath;
        if (string.IsNullOrEmpty(webRoot))
        {
            webRoot = Path.Combine(_env.ContentRootPath, "wwwroot");
        }

        string uploadsPath = Path.Combine(webRoot, "uploads", carpeta);
        if (!Directory.Exists(uploadsPath))
        {
            Directory.CreateDirectory(uploadsPath);
        }

        var resultados = new List<object>();

        // Extensiones permitidas
        var extensionesFotos = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".svg" };
        var extensionesVideos = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".mp4", ".webm", ".mov", ".mkv", ".avi" };
        var extensionesAudios = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac" };

        foreach (var file in archivos)
        {
            if (file.Length == 0) continue;

            string extensionOriginal = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (string.IsNullOrEmpty(extensionOriginal)) extensionOriginal = ".jpg";

            string tipoContenido = "FOTO";
            if (extensionesVideos.Contains(extensionOriginal))
            {
                tipoContenido = "VIDEO";
            }
            else if (extensionesAudios.Contains(extensionOriginal))
            {
                tipoContenido = "AUDIO";
            }
            else if (!extensionesFotos.Contains(extensionOriginal))
            {
                // Si no coincide con ninguna lista, admitir como foto por defecto
                tipoContenido = "FOTO";
            }

            // Generar nombre de archivo único
            string nombreArchivoUnico = $"{Guid.NewGuid():N}_{DateTime.UtcNow.Ticks}{extensionOriginal}";
            string rutaCompleta = Path.Combine(uploadsPath, nombreArchivoUnico);

            using (var stream = new FileStream(rutaCompleta, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Construir URL pública
            string baseUrl = $"{Request.Scheme}://{Request.Host}";
            string rutaRelativa = $"/uploads/{carpeta}/{nombreArchivoUnico}";
            string urlCompleta = $"{baseUrl}{rutaRelativa}";

            resultados.Add(new
            {
                url = urlCompleta,
                rutaRelativa = rutaRelativa,
                tipo = tipoContenido,
                nombreOriginal = file.FileName,
                tamanoBytes = file.Length
            });
        }

        if (resultados.Count == 0)
        {
            return BadRequest(new { exito = false, mensaje = "No se pudieron procesar los archivos enviados." });
        }

        return Ok(new
        {
            exito = true,
            mensaje = $"{resultados.Count} archivo(s) subido(s) exitosamente.",
            archivos = resultados,
            // Primer archivo como conveniencia
            url = ((dynamic)resultados[0]).url,
            tipo = ((dynamic)resultados[0]).tipo
        });
    }
}
