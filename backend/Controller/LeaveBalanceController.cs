using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using YLWorks.Model.Leave;
using YLWorks.Services.Leave;

namespace YLWorks.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class LeaveBalanceController : ControllerBase
    {
        private readonly LeaveBalanceService _balanceService;

        public LeaveBalanceController(LeaveBalanceService balanceService) =>
            _balanceService = balanceService;

        [HttpGet("{employeeId:guid}")]
        public async Task<ActionResult<List<LeaveBalanceDto>>> GetBalances(Guid employeeId) =>
            Ok(await _balanceService.GetAllBalancesForEmployeeAsync(employeeId, DateTime.UtcNow.Year));

        [HttpGet("{employeeId:guid}/{year:int}")]
        public async Task<ActionResult<List<LeaveBalanceDto>>> GetBalancesForYear(Guid employeeId, int year) =>
            Ok(await _balanceService.GetAllBalancesForEmployeeAsync(employeeId, year));

        [HttpPost("credit")]
        [Authorize(Roles = "SuperAdmin,Admin,HR")]
        public async Task<IActionResult> Credit([FromBody] CreditLeaveBalanceDto dto)
        {
            try
            {
                Guid? by = null;
                var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (Guid.TryParse(idClaim, out var uid)) by = uid;
                await _balanceService.CreditReplacementAsync(dto, by);
                return Ok(new { success = true });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>Closes the given year and creates next-year balances (idempotent).</summary>
        [HttpPost("run-year-end")]
        [Authorize(Roles = "SuperAdmin,Admin,HR")]
        public async Task<IActionResult> RunYearEnd([FromQuery] int? year = null)
        {
            try
            {
                var closedYear = year ?? (DateTime.UtcNow.Year - 1);
                Guid? by = null;
                var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (Guid.TryParse(idClaim, out var uid)) by = uid;
                var count = await _balanceService.RunYearEndRolloverAsync(closedYear, by);
                return Ok(new { success = true, closedYear, rows = count });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }
    }
}
