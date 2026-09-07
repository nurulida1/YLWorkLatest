using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using YLWorks.Model.Leave;
using YLWorks.Services.Leave;

namespace YLWorks.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class LeavePolicyController : ControllerBase
    {
        private readonly LeavePolicyService _policyService;

        public LeavePolicyController(LeavePolicyService policyService) =>
            _policyService = policyService;

        [HttpGet]
        public async Task<ActionResult<LeavePolicyDto>> Get() =>
            Ok(await _policyService.GetPolicyDtoAsync());

        [HttpPut]
        [Authorize(Roles = "HOD,Management,HR,SuperAdmin")]
        public async Task<ActionResult<LeavePolicyDto>> Upsert([FromBody] UpsertLeavePolicyDto dto)
        {
            try
            {
                return Ok(await _policyService.UpsertPolicyAsync(dto));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
