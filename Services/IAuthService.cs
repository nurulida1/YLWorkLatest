using YLWorks.Model;

namespace YLWorks.Services
{
	public interface IAuthService
	{
		Task<User?> RegisterAsync(UserDto request);
        //Task<TokenResponseDto?> LoginAsync(UserDto request);
        Task<TokenResponseDto?> LoginAsync(LoginRequest request);

        Task<TokenResponseDto?> RefreshTokensAsync(RefreshTokenRequestDto request);
	}
}