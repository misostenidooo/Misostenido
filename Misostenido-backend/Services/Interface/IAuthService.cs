using Misostenido.Model.DTO;

namespace Interface;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterRequestDto dto, string ipAddress, string userAgent);
    Task<AuthResponseDto> LoginAsync(LoginRequestDto dto, string ipAddress, string userAgent);
    Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenRequestDto dto, string ipAddress, string userAgent);
    Task<bool> LogoutAsync(string refreshToken);
    Task<AuthResponseDto> GoogleAuthAsync(GoogleAuthRequestDto dto, string ipAddress, string userAgent);
}
