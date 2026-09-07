using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using YLWorks.Model;
using YLWorks.Data;
using YLWorks.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace YLWorks.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _config;
        private readonly IAuthService authService;
        private readonly JwtService _jwtService;
        private readonly AppDbContext _context;

        public AuthController(IConfiguration config, AppDbContext context, IAuthService authService, JwtService jwtService)
        {
            _config = config;
            _jwtService = jwtService;
            this.authService = authService;
            _context = context;

        }

        [AllowAnonymous]
        [HttpPost("authenticate")]
        public async Task<ActionResult<LoginResponse>> Authenticate(LoginRequest request)
        {
            var result = await _jwtService.Authenticate(request);
            return Ok(result);
        }

        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<ActionResult<User>> Register(RegisterRequest request)
        {
            var user = await authService.RegisterAsync(request);

            if (user == null)
                return BadRequest("Email already exists.");

            return Ok(new
            {
                message = "Registration submitted. Waiting for admin approval.",
                userId = user.Id
            });
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<ActionResult<TokenResponseDto>> Login(LoginRequest request)
        {
            var token = await authService.LoginAsync(request);
            if (token is null)
                return BadRequest("Invalid email or password.");

            return Ok(new
            {
                access_token = token.AccessToken,
                refresh_token = token.RefreshToken,
                token_type = "bearer",
                expires_in = (int)(DateTime.UtcNow.AddMinutes(60) - DateTime.UtcNow).TotalSeconds
            });
        }

        [Authorize]
        [HttpGet("IsAuthenticated")]
        public IActionResult AuthenticatedOnlyEndPoint()
        {
            return Ok("You are authenticated!");
        }

        [Authorize(Roles = "HOD,Management,HR,SuperAdmin")]
        [HttpPost("approve")]
        public async Task<IActionResult> Approve(ApproveUserRequest request)
        {
            var user = await _context.Users
                .Include(x => x.Departments)
                .FirstOrDefaultAsync(x => x.Id == request.UserId);

            if (user == null)
                return NotFound("User not found.");

            var departments = await _context.Departments
                .Where(x => request.DepartmentIds.Contains(x.Id))
                .ToListAsync();

            if (departments.Count != request.DepartmentIds.Count)
            {
                return BadRequest("One or more departments not found.");
            }

            user.Departments = departments;
            user.SystemRole = request.SystemRole;
            user.Status = "Approved";
            user.IsActive = true;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "User approved successfully."
            });
        }

        [Authorize(Roles = "HOD,Management,HR,SuperAdmin")]
        [HttpPost("reject")]
        public async Task<IActionResult> Reject(RejectUserRequest request)
        {
            var user = await _context.Users.FindAsync(request.UserId);

            if (user == null)
                return NotFound();

            user.Status = "Rejected";
            user.RejectReason = request.Reason;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "User rejected."
            });
        }
    }
}
