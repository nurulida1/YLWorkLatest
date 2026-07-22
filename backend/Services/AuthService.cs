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

        public AuthService(AppDbContext context, IConfiguration config, EmailService emailService, NotificationService notificationService)
        {
            _context = context;
            _config = config;
            _emailService = emailService;
            _notificationService = notificationService;
        }

        // ----------------------------
        // REGISTER
        // ----------------------------
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

                IsActive = false, // Cannot login until approved
                Status = "Pending",

                // Default role before admin approval
                SystemRole = "Staff",

                // No department during registration
                Departments = new List<Department>()
            };

            user.Password = new PasswordHasher<User>()
                .HashPassword(user, request.Password);

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
            
            if (user is null)
                return null;

            if (user.Status == "Pending")
                throw new Exception("Your account is pending administrator approval.");

            if (user.Status == "Rejected")
                throw new Exception("Your account has been rejected.");

            if (!user.IsActive)
                throw new Exception("Your account is inactive.");

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

        public async Task<bool> ApproveUserAsync(ApproveUserRequest request)
        {
            var user = await _context.Users
                .Include(x => x.Departments)
                .FirstOrDefaultAsync(x => x.Id == request.UserId);

            if (user == null)
                return false;


            var departments = await _context.Departments
                .Where(x => request.DepartmentIds.Contains(x.Id))
                .ToListAsync();


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

        public async Task<bool> RejectUserAsync(RejectUserRequest request)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(x => x.Id == request.UserId);

            if (user == null)
                return false;


            user.Status = "Rejected";
            user.IsActive = false;
            user.RejectReason = request.Reason;

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
