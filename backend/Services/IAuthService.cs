using YLWorks.Model;

namespace YLWorks.Services
{
	public interface IAuthService
	{
        Task<User?> RegisterAsync(RegisterRequest request);
        //Task<TokenResponseDto?> LoginAsync(UserDto request);
        Task<TokenResponseDto?> LoginAsync(LoginRequest request);

        Task<TokenResponseDto?> RefreshTokensAsync(RefreshTokenRequestDto request);
        Task<bool> ApproveUserAsync(ApproveUserRequest request);
        Task<bool> RejectUserAsync(RejectUserRequest request);

    }
}