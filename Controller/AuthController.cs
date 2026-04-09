using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using YLWorks.Model;
using YLWorks.Data;
using YLWorks.Services;
using Microsoft.AspNetCore.Authorization;

namespace YLWorks.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _config;
        private readonly IAuthService authService;
        private readonly JwtService _jwtService;

        public AuthController(IConfiguration config, AppDbContext context, IAuthService authService, JwtService jwtService)
        {
            _config = config;
            _jwtService = jwtService;
            this.authService = authService;
        }

        [AllowAnonymous]
        [HttpPost("authenticate")]
        public async Task<ActionResult<LoginResponse>> Authenticate(LoginRequest request)
        {
            var result = await _jwtService.Authenticate(request);
            return Ok(result);
        }

        [HttpPost("register")]
        public async Task<ActionResult<User>> Register(UserDto request)
        {
            var user = await authService.RegisterAsync(request);
            if (user == null)
                return BadRequest("Email already exists.");

            return Ok(user);
        }

        //[HttpPost("login")]
        //public async Task<ActionResult<TokenResponseDto>> Login(UserDto request)
        //{
        //    var result = await authService.LoginAsync(request);
        //    if (result is null)
        //        return BadRequest("Invalid email or password.");

        //    return Ok(result);
        //}

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

       }
}
