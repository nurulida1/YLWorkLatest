using YLWorks.Data;
using YLWorks.Model;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;

namespace YLWorks.Services
{
    public class JwtService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;

        public JwtService(AppDbContext dbContext, IConfiguration configuration)
        {
            _context = dbContext;
            _config = configuration;
        }

        public async Task<LoginResponse> Authenticate(LoginRequest request)
        {
            // 1. Validate input
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            {
                return new LoginResponse
                {
                    Success = false,
                    Message = "Email and password are required."
                };
            }

            // 2. Find user
            var userAccount = await _context.Users
                .Include(u => u.Department)
                .FirstOrDefaultAsync(x => x.Email == request.Email);

            if (userAccount == null || !userAccount.IsActive)
            {
                return new LoginResponse
                {
                    Success = false,
                    Message = "Login failed: user does not exist or is inactive."
                };
            }

            // 3. Verify password
            var passwordHasher = new PasswordHasher<User>();
            var verifyResult = passwordHasher.VerifyHashedPassword(userAccount, userAccount.PasswordHash, request.Password);

            if (verifyResult == PasswordVerificationResult.Failed)
            {
                return new LoginResponse
                {
                    Success = false,
                    Message = "Invalid password."
                };
            }

            // 4. Update last active timestamp
            TimeZoneInfo malaysiaTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Singapore Standard Time");
            userAccount.LastLoginAt = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, malaysiaTimeZone);
            _context.Users.Update(userAccount);

            await _context.SaveChangesAsync();

            // 5. JWT configuration
            var issuer = _config["Jwt:Issuer"];
            var audience = _config["Jwt:Audience"];
            var key = _config["Jwt:Key"];
            var tokenValidityMins = _config.GetValue<int>("Jwt:TokenValidityMins", 60);
            var tokenExpiryTimeStamp = DateTime.UtcNow.AddMinutes(tokenValidityMins);

            // 6. Claims
            var claims = new List<Claim>
    {
        new Claim(ClaimTypes.Email, userAccount.Email),
        new Claim(ClaimTypes.NameIdentifier, userAccount.Id.ToString()),
        new Claim(ClaimTypes.Role, userAccount.Role)
    };

            // 7. Generate JWT token
            var tokenHandler = new JwtSecurityTokenHandler();
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = tokenExpiryTimeStamp,
                Issuer = issuer,
                Audience = audience,
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
                    SecurityAlgorithms.HmacSha256Signature
                ),
            };

            var securityToken = tokenHandler.CreateToken(tokenDescriptor);
            var accessToken = tokenHandler.WriteToken(securityToken);

            // 8. Return response
            return new LoginResponse
            {
                Success = true,
                Message = "Login successful.",
                Email = userAccount.Email,
                FirstName = userAccount.FirstName,
                LastName = userAccount.LastName,
                EmployeeId = userAccount.EmployeeId,
                UserId = userAccount.Id.ToString(),
                Role = userAccount.Role,
                JobTitle = userAccount.JobTitle,
                AccessToken = accessToken,
                RefreshToken = userAccount.RefreshToken ?? string.Empty,
                ExpiresAt = tokenExpiryTimeStamp,
                Department = userAccount.Department?.Name ?? string.Empty,
            };
        }
    }
}
