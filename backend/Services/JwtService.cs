using YLWorks.Data;
using YLWorks.Model;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using System.Security.Cryptography;

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
            if (string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.Password))
            {
                return new LoginResponse
                {
                    Success = false,
                    Message = "Email and password are required."
                };
            }

            var userAccount = await _context.Users
                .Include(u => u.Departments)
                .Include(u => u.ReportingManagers)
                .FirstOrDefaultAsync(x => x.Email == request.Email);

            if (userAccount == null)
            {
                return new LoginResponse
                {
                    Success = false,
                    Message = "Invalid email or password."
                };
            }

            if (userAccount.Status == "Pending")
            {
                return new LoginResponse
                {
                    Success = false,
                    Message = "Your account is pending administrator approval."
                };
            }

            if (userAccount.Status == "Rejected")
            {
                return new LoginResponse
                {
                    Success = false,
                    Message = "Your account has been rejected."
                };
            }

            if (!userAccount.IsActive)
            {
                return new LoginResponse
                {
                    Success = false,
                    Message = "Your account is inactive."
                };
            }

            if (userAccount.Status == "Pending")
            {
                return new LoginResponse
                {
                    Success = false,
                    Message = "Your account is pending administrator approval."
                };
            }

            if (userAccount.Status == "Rejected")
            {
                return new LoginResponse
                {
                    Success = false,
                    Message = "Your account has been rejected."
                };
            }

            var passwordHasher = new PasswordHasher<User>();

            var verifyResult = passwordHasher.VerifyHashedPassword(
                userAccount,
                userAccount.Password,
                request.Password
            );

            if (verifyResult == PasswordVerificationResult.Failed)
            {
                return new LoginResponse
                {
                    Success = false,
                    Message = "Invalid email or password."
                };
            }

            if (verifyResult == PasswordVerificationResult.SuccessRehashNeeded)
            {
                userAccount.Password = passwordHasher.HashPassword(
                    userAccount,
                    request.Password
                );
            }

            var tokenValidityMins = _config.GetValue<int>(
                "Jwt:TokenValidityMins",
                60
            );

            var tokenExpiryTimeStamp = DateTime.UtcNow.AddMinutes(tokenValidityMins);

            var claims = new List<Claim>
    {
        new Claim(ClaimTypes.Email, userAccount.Email),
        new Claim(ClaimTypes.NameIdentifier, userAccount.Id.ToString()),
        new Claim(ClaimTypes.Role, userAccount.SystemRole)
    };

            var key = _config["Jwt:Key"]
                ?? throw new InvalidOperationException("JWT Key is missing.");

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = tokenExpiryTimeStamp,
                Issuer = _config["Jwt:Issuer"],
                Audience = _config["Jwt:Audience"],
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
                    SecurityAlgorithms.HmacSha256Signature
                )
            };

            var tokenHandler = new JwtSecurityTokenHandler();

            var securityToken = tokenHandler.CreateToken(tokenDescriptor);
            var accessToken = tokenHandler.WriteToken(securityToken);

            // Save Remember Me preference
            userAccount.RememberMe = request.RememberMe;

            // Generate a new refresh token
            var refreshToken = GenerateRefreshToken();

            var refreshTokenExpiry = DateTime.UtcNow.AddDays(
                request.RememberMe ? 30 : 1
            );

            userAccount.RefreshToken = refreshToken;
            userAccount.RefreshTokenExpiryTime = refreshTokenExpiry;

            // Update last login
            var malaysiaTimeZone = TimeZoneInfo.FindSystemTimeZoneById(
                "Singapore Standard Time"
            );

            userAccount.LastLoginAt = TimeZoneInfo.ConvertTimeFromUtc(
                DateTime.UtcNow,
                malaysiaTimeZone
            );

            await _context.SaveChangesAsync();

            return new LoginResponse
            {
                Success = true,
                Message = "Login successful.",
                Email = userAccount.Email,
                FullName = userAccount.FullName,
                DisplayName = userAccount.DisplayName,
                EmployeeNo = userAccount.EmployeeNo,
                UserId = userAccount.Id.ToString(),
                Gender = userAccount.Gender ?? string.Empty,
                SystemRole = userAccount.SystemRole,
                JobTitle = userAccount.JobTitle ?? string.Empty,

                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = tokenExpiryTimeStamp,

                HodIds = userAccount.ReportingManagers
                    .Select(rm => rm.ManagerId)
                    .ToList(),

                Departments = userAccount.Departments?
                    .Select(d => d.Name)
                    .ToList() ?? new List<string>(),

                DepartmentIds = userAccount.Departments?
                    .Select(d => d.Id)
                    .ToList() ?? new List<Guid>()
            };
        }

        private string GenerateRefreshToken()
        {
            var randomNumber = new byte[64];

            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);

            return Convert.ToBase64String(randomNumber);
        }
    }
}
