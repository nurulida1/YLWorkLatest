using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using YLWorks.Model.Leave;
using YLWorks.Services.Leave;

namespace YLWorks.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class LeaveRequestsController : ControllerBase
    {
        private readonly LeaveRequestService _leaveService;
        private readonly ILogger<LeaveRequestsController> _logger;

        public LeaveRequestsController(
            LeaveRequestService leaveService,
            ILogger<LeaveRequestsController> logger)
        {
            _leaveService = leaveService;
            _logger = logger;
        }

        /// <summary>Gets leave requests for the current user or all if HR/Admin.</summary>
        [HttpGet]
        public async Task<ActionResult<List<LeaveRequestDto>>> GetAll([FromQuery] Guid? employeeId)
        {
            var userId = GetUserId();
            var role = User.FindFirst(ClaimTypes.Role)?.Value ?? "";

            if (LeaveRoles.Hr.Contains(role) || LeaveRoles.Admin.Contains(role))
            {
                if (employeeId.HasValue)
                    return Ok(await _leaveService.GetByEmployeeAsync(employeeId.Value));
            }

            return Ok(await _leaveService.GetByEmployeeAsync(employeeId ?? userId));
        }

        /// <summary>Company-wide approved leave calendar for a date range.</summary>
        [HttpGet("calendar")]
        public async Task<ActionResult<LeaveCalendarResponseDto>> GetCalendar(
            [FromQuery] DateTime from,
            [FromQuery] DateTime to,
            [FromQuery] Guid? departmentId,
            [FromQuery] Guid? leaveTypeId)
        {
            try
            {
                var role = User.FindFirst(ClaimTypes.Role)?.Value ?? "";
                return Ok(await _leaveService.GetCalendarAsync(from, to, departmentId, leaveTypeId, role));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>Gets a single leave request by id.</summary>
        [HttpGet("{id:guid}")]
        public async Task<ActionResult<LeaveRequestDto>> GetById(Guid id)
        {
            var result = await _leaveService.GetByIdAsync(id);
            return result == null ? NotFound() : Ok(result);
        }

        /// <summary>Submits a new leave request.</summary>
        [HttpPost]
        [Authorize(Roles = "Staff,Executive,Support,HOD,Management,HR,SuperAdmin")]
        public async Task<ActionResult<LeaveRequestDto>> Submit([FromBody] CreateLeaveRequestDto dto)
        {
            try
            {
                var result = await _leaveService.SubmitAsync(dto);
                // 200 with balanceSufficient:false — client shows a specific toast (not a generic 400).
                if (!result.BalanceSufficient)
                    return Ok(result);
                if (!string.IsNullOrEmpty(result.ConflictWarning) && result.RequestId == Guid.Empty)
                    return Conflict(result);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>Edits a pending leave request.</summary>
        [HttpPut("{id:guid}")]
        [Authorize(Roles = "Staff,Executive,Support,HOD,Management,HR,SuperAdmin")]
        public async Task<ActionResult<LeaveRequestDto>> Update(Guid id, [FromBody] CreateLeaveRequestDto dto)
        {
            try
            {
                var result = await _leaveService.UpdatePendingAsync(id, dto);
                if (!result.BalanceSufficient)
                    return Ok(result);
                if (!string.IsNullOrEmpty(result.ConflictWarning) && result.RequestId == id)
                    return Conflict(result);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>Approves a pending leave request.</summary>
        [HttpPost("{id:guid}/approve")]
        [Authorize(Roles = "HOD,Management,HR,SuperAdmin")]
        public async Task<ActionResult<LeaveRequestDto>> Approve(Guid id, [FromBody] ApproveRejectLeaveDto dto)
        {
            try
            {
                return Ok(await _leaveService.ApproveAsync(id, dto.ApproverId));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>Rejects a pending leave request (reason required).</summary>
        [HttpPost("{id:guid}/reject")]
        [Authorize(Roles = "HOD,Management,HR,SuperAdmin")]
        public async Task<ActionResult<LeaveRequestDto>> Reject(Guid id, [FromBody] ApproveRejectLeaveDto dto)
        {
            try
            {
                return Ok(await _leaveService.RejectAsync(id, dto.ApproverId, dto.RejectionReason ?? ""));
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

        /// <summary>HR finalizes a pending leave request without forwarding to further managers.</summary>
        [HttpPost("{id:guid}/finalize")]
        [Authorize(Roles = "HOD,Management,HR,SuperAdmin")]
        public async Task<ActionResult<LeaveRequestDto>> Finalize(Guid id, [FromBody] ApproveRejectLeaveDto dto)
        {
            try
            {
                return Ok(await _leaveService.FinalizeByHrAsync(id, dto.ApproverId));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>Cancels a leave request.</summary>
        [HttpPost("{id:guid}/cancel")]
        public async Task<ActionResult<LeaveRequestDto>> Cancel(Guid id, [FromBody] CancelLeaveDto dto)
        {
            try
            {
                return Ok(await _leaveService.CancelAsync(id, dto.RequestedBy));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>Uploads a supporting document for a leave request.</summary>
        [HttpPost("{id:guid}/document")]
        [RequestSizeLimit(25 * 1024 * 1024)]
        [RequestFormLimits(MultipartBodyLengthLimit = 25 * 1024 * 1024)]
        public async Task<ActionResult<string>> UploadDocument(Guid id, IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "File is required." });

            try
            {
                var path = await _leaveService.UploadDocumentAsync(id, file);
                return Ok(new { fileUrl = path });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>Gets pending leave requests awaiting this user's HOD approval (chain).</summary>
        [HttpGet("pending/hod/{hodId:guid}")]
        [Authorize(Roles = "HOD,Management,HR,SuperAdmin")]
        public async Task<ActionResult<List<LeaveRequestDto>>> GetPendingForHod(Guid hodId) =>
            Ok(await _leaveService.GetPendingForHodAsync(hodId));

        /// <summary>Legacy alias — same as pending/hod (ManagerId is not used for leave).</summary>
        [HttpGet("pending/manager/{managerId:guid}")]
        [Authorize(Roles = "HOD,Manager,Management,HR,SuperAdmin,Admin")]
        public async Task<ActionResult<List<LeaveRequestDto>>> GetPendingForManager(Guid managerId) =>
            Ok(await _leaveService.GetPendingForHodAsync(managerId));

        private Guid GetUserId() =>
            Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? throw new UnauthorizedAccessException());
    }
}
