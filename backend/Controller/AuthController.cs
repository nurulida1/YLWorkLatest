
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;
using YLWorks.Model;
using YLWorks.Data;
using YLWorks.Services;

namespace YLWorks.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly JwtService _jwtService;
        private readonly AppDbContext _context;

        public AuthController(
            AppDbContext context,
            IAuthService authService,
            JwtService jwtService)
        {
            _context = context;
            _authService = authService;
            _jwtService = jwtService;
        }

        // ==========================================
        // AUTHENTICATE
        // ==========================================
        [AllowAnonymous]
        [HttpPost("authenticate")]
        public async Task<ActionResult<LoginResponse>> Authenticate(
            [FromBody] LoginRequest request)
        {
            var result = await _jwtService.Authenticate(request);

            if (result == null || !result.Success)
            {
                return Unauthorized(result);
            }

            return Ok(result);
        }

        // ==========================================
        // REGISTER
        // ==========================================
        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<IActionResult> Register(
            [FromBody] RegisterRequest request)
        {
            var user = await _authService.RegisterAsync(request);

            if (user == null)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Email already exists."
                });
            }

            return Ok(new
            {
                success = true,
                message = "Registration submitted. Waiting for admin approval.",
                userId = user.Id
            });
        }

        // ==========================================
        // CHECK AUTHENTICATION
        // ==========================================
        [Authorize]
        [HttpGet("IsAuthenticated")]
        public IActionResult AuthenticatedOnlyEndPoint()
        {
            return Ok(new
            {
                success = true,
                message = "You are authenticated!"
            });
        }

        // ==========================================
        // APPROVE USER
        // ==========================================
        [Authorize(Roles = "HOD,Management,HR,SuperAdmin")]
        [HttpPost("approve")]
        public async Task<IActionResult> Approve(
            [FromBody] ApproveUserRequest request)
        {
            var result = await _authService.ApproveUserAsync(request);

            if (!result)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Unable to approve user. Please check the user and departments."
                });
            }

            return Ok(new
            {
                success = true,
                message = "User approved successfully."
            });
        }

        // ==========================================
        // REJECT USER
        // ==========================================
        [Authorize(Roles = "HOD,Management,HR,SuperAdmin")]
        [HttpPost("reject")]
        public async Task<IActionResult> Reject(
            [FromBody] RejectUserRequest request)
        {
            var result = await _authService.RejectUserAsync(request);

            if (!result)
            {
                return NotFound(new
                {
                    success = false,
                    message = "User not found."
                });
            }

            return Ok(new
            {
                success = true,
                message = "User rejected."
            });
        }

        // ==========================================
        // REFRESH TOKEN
        // ==========================================
        [AllowAnonymous]
        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh(
            [FromBody] RefreshTokenRequestDto request)
        {
            var result = await _authService.RefreshTokensAsync(request);

            if (result == null)
            {
                return Unauthorized(new
                {
                    success = false,
                    message = "Refresh token is invalid or expired. Please login again."
                });
            }

            return Ok(new
            {
                success = true,
                accessToken = result.AccessToken,
                refreshToken = result.RefreshToken,
                expiresAt = result.ExpiresAt
            });
        }

        // ==========================================
        // LOGOUT
        // ==========================================
        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var userIdValue = User.FindFirstValue(
                ClaimTypes.NameIdentifier
            );

            if (!Guid.TryParse(userIdValue, out var userId))
            {
                return Unauthorized();
            }

            var result = await _authService.RevokeRefreshTokenAsync(userId);

            if (!result)
            {
                return NotFound(new
                {
                    success = false,
                    message = "User not found."
                });
            }

            return Ok(new
            {
                success = true,
                message = "Logged out successfully."
            });
        }
    }
}
