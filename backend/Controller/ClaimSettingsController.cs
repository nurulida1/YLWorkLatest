using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using YLWorks.Model.Claim;
using YLWorks.Services.Claims;

namespace YLWorks.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ClaimSettingsController : ControllerBase
    {
        private readonly ClaimSettingsService _settingsService;

        public ClaimSettingsController(ClaimSettingsService settingsService)
        {
            _settingsService = settingsService;
        }

        [HttpGet]
        public async Task<ActionResult<ClaimSettingsDto>> Get() =>
            Ok(await _settingsService.GetAsync());

        [HttpPut]
        [Authorize(Roles = "HR,SuperAdmin,Admin")]
        public async Task<ActionResult<ClaimSettingsDto>> Upsert([FromBody] UpsertClaimSettingsDto dto)
        {
            try
            {
                return Ok(await _settingsService.UpsertAsync(dto));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
