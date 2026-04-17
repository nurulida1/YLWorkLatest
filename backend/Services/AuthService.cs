using YLWorks.Data;
using YLWorks.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace YLWorks.Services
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;

        public AuthService(AppDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        // ----------------------------
        // REGISTER
        // ----------------------------
        public async Task<User?> RegisterAsync(UserDto request)
        {
            // Check email uniqueness
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
                return null;

            var user = new User
            {
                Email = request.Email,
                IsActive = true,
                SystemRole = request.SystemRole,
                FullName = request.FullName,
            };
            user.Password = new PasswordHasher<User>().HashPassword(user, request.Password);

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return user;
        }

        // ----------------------------
        // LOGIN
        // ----------------------------
        //public async Task<TokenResponseDto?> LoginAsync(UserDto request)
        //{
        //    var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        //    if (user is null || !user.IsActive)
        //        return null;

        //    var passwordHasher = new PasswordHasher<User>();
        //    var verifyResult = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);

        //    if (verifyResult == PasswordVerificationResult.Failed)
        //        return null;

        //    var response = new TokenResponseDto
        //    {
        //        AccessToken = CreateToken(user),
        //        RefreshToken = await GenerateAndSaveRefreshTokenAsync(user)
        //    };

        //    return response;
        //}
        public async Task<TokenResponseDto?> LoginAsync(LoginRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user is null || !user.IsActive)
                return null;

            var passwordHasher = new PasswordHasher<User>();
            var verifyResult = passwordHasher.VerifyHashedPassword(user, user.Password, request.Password);

            if (verifyResult == PasswordVerificationResult.Failed)
                return null;

            var response = new TokenResponseDto
            {
                AccessToken = CreateToken(user),
                RefreshToken = await GenerateAndSaveRefreshTokenAsync(user),
                ExpiresAt = DateTime.UtcNow.AddMinutes(_config.GetValue<int>("Jwt:TokenValidityMins", 60))
            };

            return response;
        }

        // ----------------------------
        // REFRESH TOKEN
        // ----------------------------
        public async Task<TokenResponseDto?> RefreshTokensAsync(RefreshTokenRequestDto request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.RefreshToken == request.RefreshToken);
            if (user is null)
                return null;

            if (user.RefreshTokenExpiryTime == null || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
                return null;

            var newAccessToken = CreateToken(user);
            var newRefreshToken = GenerateRefreshToken();

            user.RefreshToken = newRefreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);

            await _context.SaveChangesAsync();

            return new TokenResponseDto
            {
                AccessToken = newAccessToken,
                RefreshToken = newRefreshToken
            };
        }

        // ----------------------------
        // TOKEN GENERATION HELPERS
        // ----------------------------
        private string GenerateRefreshToken()
        {
            var randomNumber = new byte[32];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }

        private async Task<string> GenerateAndSaveRefreshTokenAsync(User user)
        {
            var refreshToken = GenerateRefreshToken();
            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
            await _context.SaveChangesAsync();
            return refreshToken;
        }

        private string CreateToken(User user)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Role, user.SystemRole)
            };

            var keyString = _config["Jwt:Key"] ?? throw new Exception("JWT Key is missing!");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyString));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var tokenValidityMins = _config.GetValue<int>("Jwt:TokenValidityMins", 60);

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(tokenValidityMins),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
