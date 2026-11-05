
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
        private readonly EmailService _emailService;
        private readonly NotificationService _notificationService;

        public AuthService(
            AppDbContext context,
            IConfiguration config,
            EmailService emailService,
            NotificationService notificationService)
        {
            _context = context;
            _config = config;
            _emailService = emailService;
            _notificationService = notificationService;
        }

        // ==========================================
        // REGISTER
        // ==========================================
        public async Task<User?> RegisterAsync(RegisterRequest request)
        {
            if (await _context.Users.AnyAsync(x => x.Email == request.Email))
                return null;

            var user = new User
            {
                FullName = request.FullName,
                DisplayName = request.DisplayName,
                Email = request.Email,
                ContactNo = request.ContactNo,
                JobTitle = request.JobTitle,

                IsActive = false,
                Status = "Pending",
                SystemRole = "Staff",

                Departments = new List<Department>()
            };

            user.Password = new PasswordHasher<User>()
                .HashPassword(user, request.Password);

            _context.Users.Add(user);

            await _context.SaveChangesAsync();

            return user;
        }

        // ==========================================
        // LOGIN
        // ==========================================
        public async Task<TokenResponseDto?> LoginAsync(LoginRequest request)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user is null)
                return null;

            if (user.Status == "Pending")
                throw new Exception(
                    "Your account is pending administrator approval.");

            if (user.Status == "Rejected")
                throw new Exception(
                    "Your account has been rejected.");

            if (!user.IsActive || user.Status != "Approved")
                throw new Exception(
                    "Your account is inactive.");

            var passwordHasher = new PasswordHasher<User>();

            var verifyResult = passwordHasher.VerifyHashedPassword(
                user,
                user.Password,
                request.Password
            );

            if (verifyResult == PasswordVerificationResult.Failed)
                return null;

            // Upgrade password hash when required
            if (verifyResult == PasswordVerificationResult.SuccessRehashNeeded)
            {
                user.Password = passwordHasher.HashPassword(
                    user,
                    request.Password
                );
            }

            // Access token expiry
            var tokenValidityMins = _config.GetValue<int>(
                "Jwt:TokenValidityMins",
                60
            );

            var expiresAt = DateTime.UtcNow.AddMinutes(
                tokenValidityMins
            );

            // Generate tokens
            var accessToken = CreateToken(user, expiresAt);
            var refreshToken = GenerateRefreshToken();

            // Remember Me preference
            user.RememberMe = request.RememberMe;

            // Refresh token expiry
            user.RefreshToken = refreshToken;

            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(
                request.RememberMe ? 30 : 1
            );

            await _context.SaveChangesAsync();

            return new TokenResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = expiresAt
            };
        }

        // ==========================================
        // REFRESH TOKEN
        // ==========================================
        public async Task<TokenResponseDto?> RefreshTokensAsync(
            RefreshTokenRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.RefreshToken))
                return null;

            var user = await _context.Users
                .FirstOrDefaultAsync(u =>
                    u.RefreshToken == request.RefreshToken
                );

            if (user is null ||
                !user.IsActive ||
                user.Status != "Approved")
            {
                return null;
            }

            // Check refresh token expiry
            if (user.RefreshTokenExpiryTime == null ||
                user.RefreshTokenExpiryTime <= DateTime.UtcNow)
            {
                user.RefreshToken = null;
                user.RefreshTokenExpiryTime = null;

                await _context.SaveChangesAsync();

                return null;
            }

            // Generate new access token
            var tokenValidityMins = _config.GetValue<int>(
                "Jwt:TokenValidityMins",
                60
            );

            var expiresAt = DateTime.UtcNow.AddMinutes(
                tokenValidityMins
            );

            var accessToken = CreateToken(user, expiresAt);

            // Rotate refresh token
            var refreshToken = GenerateRefreshToken();

            user.RefreshToken = refreshToken;

            // Preserve Remember Me expiry policy
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(
                user.RememberMe ? 30 : 1
            );

            await _context.SaveChangesAsync();

            return new TokenResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = expiresAt
            };
        }

        // ==========================================
        // LOGOUT / REVOKE REFRESH TOKEN
        // ==========================================
        public async Task<bool> RevokeRefreshTokenAsync(Guid userId)
        {
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
                return false;

            user.RefreshToken = null;
            user.RefreshTokenExpiryTime = null;
            user.RememberMe = false;

            await _context.SaveChangesAsync();

            return true;
        }

        // ==========================================
        // GENERATE REFRESH TOKEN
        // ==========================================
        private string GenerateRefreshToken()
        {
            var randomNumber = new byte[64];

            using var rng = RandomNumberGenerator.Create();

            rng.GetBytes(randomNumber);

            return Convert.ToBase64String(randomNumber);
        }

        // ==========================================
        // GENERATE ACCESS TOKEN
        // ==========================================
        private string CreateToken(User user, DateTime expiresAt)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(
                    ClaimTypes.NameIdentifier,
                    user.Id.ToString()
                ),
                new Claim(ClaimTypes.Role, user.SystemRole)
            };

            var keyString = _config["Jwt:Key"]
                ?? throw new InvalidOperationException(
                    "JWT Key is missing!");

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(keyString)
            );

            var credentials = new SigningCredentials(
                key,
                SecurityAlgorithms.HmacSha256
            );

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: expiresAt,
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler()
                .WriteToken(token);
        }

        // ==========================================
        // APPROVE USER
        // ==========================================
        public async Task<bool> ApproveUserAsync(
            ApproveUserRequest request)
        {
            var user = await _context.Users
                .Include(x => x.Departments)
                .FirstOrDefaultAsync(x => x.Id == request.UserId);

            if (user == null)
                return false;

            var departments = await _context.Departments
                .Where(x => request.DepartmentIds.Contains(x.Id))
                .ToListAsync();

            if (departments.Count != request.DepartmentIds.Count)
                return false;

            user.Departments = departments;
            user.SystemRole = request.SystemRole;
            user.Status = "Approved";
            user.IsActive = true;

            await _context.SaveChangesAsync();

            await _notificationService.CreateAsync(
                user.Id,
                "Account Approved",
                "Your account has been approved. You can now login to the system.",
                "Approval"
            );

            _emailService.SendApprovalEmail(
                user.Email,
                user.FullName
            );

            return true;
        }

        // ==========================================
        // REJECT USER
        // ==========================================
        public async Task<bool> RejectUserAsync(
            RejectUserRequest request)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(x => x.Id == request.UserId);

            if (user == null)
                return false;

            user.Status = "Rejected";
            user.IsActive = false;
            user.RejectReason = request.Reason;

            // Revoke existing refresh token
            user.RefreshToken = null;
            user.RefreshTokenExpiryTime = null;

            await _context.SaveChangesAsync();

            await _notificationService.CreateAsync(
                user.Id,
                "Account Rejected",
                $"Your account registration has been rejected. Reason: {request.Reason}",
                "Rejection"
            );

            _emailService.SendRejectionEmail(
                user.Email,
                user.FullName,
                request.Reason
            );

            return true;
        }
    }
}
