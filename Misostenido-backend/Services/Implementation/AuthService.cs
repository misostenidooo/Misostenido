using System.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using BCrypt.Net;
using Interface;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Misostenido.Model.DTO;

namespace Implementation;

public class AuthService : IAuthService
{
    private readonly string _connectionString;
    private readonly IConfiguration _configuration;

    public AuthService(IConfiguration configuration)
    {
        _configuration = configuration;
        _connectionString = _configuration.GetConnectionString("DefaultConnection") 
            ?? throw new InvalidOperationException("La cadena de conexión 'DefaultConnection' no está configurada.");
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto dto, string ipAddress, string userAgent)
    {
        if (string.IsNullOrWhiteSpace(dto.Nombre) || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Contrasena))
        {
            return new AuthResponseDto { Exito = false, Mensaje = "Todos los campos obligatorios deben ser completados." };
        }

        string contrasenaHash = BCrypt.Net.BCrypt.HashPassword(dto.Contrasena);

        using SqlConnection conn = new(_connectionString);
        using SqlCommand cmd = new("dbo.sp_RegistrarUsuario", conn);
        cmd.CommandType = CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@nombre", dto.Nombre.Trim());
        cmd.Parameters.AddWithValue("@email", dto.Email.Trim().ToLower());
        cmd.Parameters.AddWithValue("@contrasena_hash", contrasenaHash);
        cmd.Parameters.AddWithValue("@tipo_perfil", dto.TipoPerfil.Trim().ToUpper());

        await conn.OpenAsync();
        using SqlDataReader reader = await cmd.ExecuteReaderAsync();

        if (await reader.ReadAsync())
        {
            int idUsuario = Convert.ToInt32(reader["id_usuario"]);
            string mensaje = reader["mensaje"]?.ToString() ?? string.Empty;

            if (idUsuario <= 0)
            {
                return new AuthResponseDto { Exito = false, Mensaje = mensaje };
            }

            // Tras registrar exitosamente, procedemos a realizar el login para entregar el JWT
            return await LoginInternalAsync(dto.Email.Trim().ToLower(), idUsuario, dto.Nombre.Trim(), dto.TipoPerfil.Trim().ToUpper(), null, "USUARIO", ipAddress, userAgent);
        }

        return new AuthResponseDto { Exito = false, Mensaje = "Error al procesar el registro en la base de datos." };
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto dto, string ipAddress, string userAgent)
    {
        if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Contrasena))
        {
            return new AuthResponseDto { Exito = false, Mensaje = "Correo y contraseña son requeridos." };
        }

        using SqlConnection conn = new(_connectionString);
        using SqlCommand cmd = new("dbo.sp_ObtenerUsuarioParaLogin", conn);
        cmd.CommandType = CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@email", dto.Email.Trim().ToLower());

        await conn.OpenAsync();
        using SqlDataReader reader = await cmd.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
        {
            return new AuthResponseDto { Exito = false, Mensaje = "Credenciales incorrectas o usuario no encontrado." };
        }

        bool estado = Convert.ToBoolean(reader["estado"]);
        if (!estado)
        {
            return new AuthResponseDto { Exito = false, Mensaje = "La cuenta se encuentra deshabilitada o suspendida." };
        }

        string dbHash = reader["contrasena_hash"]?.ToString() ?? string.Empty;
        bool passwordValida = BCrypt.Net.BCrypt.Verify(dto.Contrasena, dbHash);

        if (!passwordValida)
        {
            return new AuthResponseDto { Exito = false, Mensaje = "Credenciales incorrectas." };
        }

        int idUsuario = Convert.ToInt32(reader["id_usuario"]);
        string nombre = reader["nombre"].ToString()!;
        string email = reader["email"].ToString()!;
        string tipoPerfil = reader["tipo_perfil"].ToString()!;
        string? fotoPerfilUrl = reader["foto_perfil_url"] != DBNull.Value ? reader["foto_perfil_url"].ToString() : null;
        string rolNombre = reader["rol_nombre"].ToString()!;

        reader.Close();

        return await LoginInternalAsync(email, idUsuario, nombre, tipoPerfil, fotoPerfilUrl, rolNombre, ipAddress, userAgent);
    }

    public async Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenRequestDto dto, string ipAddress, string userAgent)
    {
        if (string.IsNullOrWhiteSpace(dto.RefreshToken))
        {
            return new AuthResponseDto { Exito = false, Mensaje = "Refresh token inválido." };
        }

        using SqlConnection conn = new(_connectionString);
        using SqlCommand cmd = new("dbo.sp_ValidarSesionActiva", conn);
        cmd.CommandType = CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@refresh_token", dto.RefreshToken.Trim());

        await conn.OpenAsync();
        using SqlDataReader reader = await cmd.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
        {
            return new AuthResponseDto { Exito = false, Mensaje = "Sesión inválida o expirada. Por favor inicie sesión de nuevo." };
        }

        int idUsuario = Convert.ToInt32(reader["id_usuario"]);
        string nombre = reader["nombre"].ToString()!;
        string email = reader["email"].ToString()!;
        string tipoPerfil = reader["tipo_perfil"].ToString()!;
        string? fotoPerfilUrl = reader["foto_perfil_url"] != DBNull.Value ? reader["foto_perfil_url"].ToString() : null;
        string rolNombre = reader["rol_nombre"].ToString()!;

        reader.Close();

        return await LoginInternalAsync(email, idUsuario, nombre, tipoPerfil, fotoPerfilUrl, rolNombre, ipAddress, userAgent);
    }

    public async Task<bool> LogoutAsync(string refreshToken)
    {
        if (string.IsNullOrWhiteSpace(refreshToken)) return false;

        using SqlConnection conn = new(_connectionString);
        using SqlCommand cmd = new("dbo.sp_CerrarSesion", conn);
        cmd.CommandType = CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@refresh_token", refreshToken.Trim());

        await conn.OpenAsync();
        await cmd.ExecuteNonQueryAsync();
        return true;
    }

    public async Task<AuthResponseDto> GoogleAuthAsync(GoogleAuthRequestDto dto, string ipAddress, string userAgent)
    {
        if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Nombre))
        {
            return new AuthResponseDto { Exito = false, Mensaje = "Información de cuenta Google incompleta." };
        }

        using SqlConnection conn = new(_connectionString);
        using SqlCommand cmd = new("dbo.sp_RegistrarOAutenticarGoogle", conn);
        cmd.CommandType = CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@nombre", dto.Nombre.Trim());
        cmd.Parameters.AddWithValue("@email", dto.Email.Trim().ToLower());
        cmd.Parameters.AddWithValue("@foto_perfil_url", (object?)dto.FotoPerfilUrl ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@tipo_perfil", dto.TipoPerfil.Trim().ToUpper());

        await conn.OpenAsync();
        using SqlDataReader reader = await cmd.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
        {
            return new AuthResponseDto { Exito = false, Mensaje = "Error al procesar autenticación con Google." };
        }

        int idUsuario = Convert.ToInt32(reader["id_usuario"]);
        if (idUsuario <= 0)
        {
            return new AuthResponseDto { Exito = false, Mensaje = reader["mensaje"]?.ToString() ?? "Error desconocido" };
        }

        string nombre = reader["nombre"].ToString()!;
        string email = reader["email"].ToString()!;
        string tipoPerfil = reader["tipo_perfil"].ToString()!;
        string? fotoPerfilUrl = reader["foto_perfil_url"] != DBNull.Value ? reader["foto_perfil_url"].ToString() : null;
        string rolNombre = reader["rol_nombre"].ToString()!;

        reader.Close();

        return await LoginInternalAsync(email, idUsuario, nombre, tipoPerfil, fotoPerfilUrl, rolNombre, ipAddress, userAgent);
    }

    private async Task<AuthResponseDto> LoginInternalAsync(string email, int idUsuario, string nombre, string tipoPerfil, string? fotoPerfilUrl, string rolNombre, string ipAddress, string userAgent)
    {
        // 1. Generar JWT Access Token
        string secretKey = _configuration["JwtSettings:SecretKey"] ?? "MiSostenidoSuperSecretKeyForJWTAuth2026NicaraguaPlatform!";
        string issuer = _configuration["JwtSettings:Issuer"] ?? "MisostenidoApi";
        string audience = _configuration["JwtSettings:Audience"] ?? "MisostenidoWeb";
        int durationMinutes = int.TryParse(_configuration["JwtSettings:DurationInMinutes"], out int mins) ? mins : 60;

        SymmetricSecurityKey key = new(Encoding.UTF8.GetBytes(secretKey));
        SigningCredentials credentials = new(key, SecurityAlgorithms.HmacSha256);

        DateTime expirationDate = DateTime.UtcNow.AddMinutes(durationMinutes);

        List<Claim> claims = new()
        {
            new Claim(ClaimTypes.NameIdentifier, idUsuario.ToString()),
            new Claim(ClaimTypes.Name, nombre),
            new Claim(ClaimTypes.Email, email),
            new Claim(ClaimTypes.Role, rolNombre),
            new Claim("tipo_perfil", tipoPerfil)
        };

        JwtSecurityToken token = new(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expirationDate,
            signingCredentials: credentials
        );

        string accessToken = new JwtSecurityTokenHandler().WriteToken(token);

        // 2. Generar Refresh Token criptográfico
        string refreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

        // 3. Persistir sesión en BD con sp_CrearSesion
        using SqlConnection conn = new(_connectionString);
        using SqlCommand cmd = new("dbo.sp_CrearSesion", conn);
        cmd.CommandType = CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@id_usuario", idUsuario);
        cmd.Parameters.AddWithValue("@refresh_token", refreshToken);
        cmd.Parameters.AddWithValue("@dispositivo", userAgent.Length > 200 ? userAgent[..200] : userAgent);
        cmd.Parameters.AddWithValue("@ip_origen", ipAddress.Length > 50 ? ipAddress[..50] : ipAddress);
        cmd.Parameters.AddWithValue("@dias_expiracion", 30);

        await conn.OpenAsync();
        await cmd.ExecuteNonQueryAsync();

        return new AuthResponseDto
        {
            Exito = true,
            Mensaje = "Autenticación exitosa",
            IdUsuario = idUsuario,
            Nombre = nombre,
            Email = email,
            TipoPerfil = tipoPerfil,
            FotoPerfilUrl = fotoPerfilUrl,
            RolNombre = rolNombre,
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            FechaExpiracion = expirationDate
        };
    }
}
