using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using YLWorks.Model.Leave;
using YLWorks.Services.Leave;

namespace YLWorks.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class LeaveHolidaysController : ControllerBase
    {
        private readonly LeaveHolidayService _holidayService;

        public LeaveHolidaysController(LeaveHolidayService holidayService) =>
            _holidayService = holidayService;

        /// <summary>Active holidays in a date range (apply form + team calendar).</summary>
        [HttpGet]
        public async Task<ActionResult<List<PublicHolidayDto>>> Get(
            [FromQuery] DateTime? from = null,
            [FromQuery] DateTime? to = null,
            [FromQuery] int? year = null,
            [FromQuery] bool includeInactive = false)
        {
            if (year.HasValue)
            {
                var list = await _holidayService.GetByYearAsync(year.Value, includeInactive);
                return Ok(list);
            }

            if (from.HasValue && to.HasValue)
            {
                var list = await _holidayService.GetInRangeAsync(from.Value, to.Value, activeOnly: !includeInactive);
                return Ok(list);
            }

            // Default: current Malaysia year for admin list
            var y = WebApplication1.Helpers.DateTimeHelper.Now().Year;
            return Ok(await _holidayService.GetByYearAsync(y, includeInactive: true));
        }

        [HttpPost]
        [Authorize(Roles = "HR,Admin,SuperAdmin")]
        public async Task<ActionResult<PublicHolidayDto>> Create([FromBody] UpsertPublicHolidayDto dto)
        {
            try
            {
                return Ok(await _holidayService.CreateAsync(dto));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id:guid}")]
        [Authorize(Roles = "HR,Admin,SuperAdmin")]
        public async Task<ActionResult<PublicHolidayDto>> Update(Guid id, [FromBody] UpsertPublicHolidayDto dto)
        {
            try
            {
                return Ok(await _holidayService.UpdateAsync(id, dto));
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "HR,Admin,SuperAdmin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            try
            {
                await _holidayService.DeleteAsync(id);
                return Ok(new { success = true });
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }
    }
}
