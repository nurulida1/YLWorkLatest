using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using YLWorks.Model.Claim;
using YLWorks.Services.Claims;

namespace YLWorks.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ClaimRequestsController : ControllerBase
    {
        private readonly ClaimRequestService _claimService;

        public ClaimRequestsController(ClaimRequestService claimService)
        {
            _claimService = claimService;
        }

        [HttpGet]
        public async Task<ActionResult<List<ClaimRequestDto>>> GetAll([FromQuery] Guid? employeeId)
        {
            var userId = GetUserId();
            var role = User.FindFirst(ClaimTypes.Role)?.Value ?? "";

            if (ClaimRoles.Hr.Contains(role) || ClaimRoles.Admin.Contains(role))
            {
                if (employeeId.HasValue)
                    return Ok(await _claimService.GetByEmployeeAsync(employeeId.Value));
                return Ok(await _claimService.GetAllAsync());
            }

            return Ok(await _claimService.GetByEmployeeAsync(employeeId ?? userId));
        }

        [HttpGet("dashboard")]
        public async Task<ActionResult<ClaimDashboardDto>> GetDashboard(
            [FromQuery] int? year,
            [FromQuery] int? month)
        {
            var userId = GetUserId();
            var role = User.FindFirst(ClaimTypes.Role)?.Value ?? "";
            try
            {
                return Ok(await _claimService.GetDashboardAsync(userId, role, year, month));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<ClaimRequestDto>> GetById(Guid id)
        {
            var result = await _claimService.GetByIdAsync(id);
            return result == null ? NotFound() : Ok(result);
        }

        [HttpGet("medical-balance")]
        [Authorize(Roles = "Staff,Executive,Support,HOD,Manager,Management,HR,SuperAdmin,Admin")]
        public async Task<ActionResult<MedicalBalanceDto>> GetMedicalBalance(
            [FromQuery] Guid employeeId,
            [FromQuery] int? year,
            [FromQuery] Guid? excludeRequestId)
        {
            try
            {
                return Ok(await _claimService.GetMedicalBalanceAsync(employeeId, year, excludeRequestId));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("preview-ot")]
        [Authorize(Roles = "Staff,Executive,Support,HOD,Manager,Management,HR,SuperAdmin,Admin")]
        public async Task<ActionResult<PreviewOtAmountResultDto>> PreviewOt([FromBody] PreviewOtAmountDto dto)
        {
            try
            {
                return Ok(await _claimService.PreviewOtAsync(dto));
            }
            catch (Exception ex) when (ex is InvalidOperationException or ArgumentException)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost]
        [Authorize(Roles = "Staff,Executive,Support,HOD,Manager,Management,HR,SuperAdmin,Admin")]
        public async Task<ActionResult<ClaimRequestDto>> Submit([FromBody] CreateClaimRequestDto dto)
        {
            try
            {
                return Ok(await _claimService.SubmitAsync(dto));
            }
            catch (Exception ex) when (ex is InvalidOperationException or ArgumentException)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (DbUpdateConcurrencyException)
            {
                return BadRequest(new { message = "Unable to save claim changes. Please refresh and try again." });
            }
        }

        [HttpPut("{id:guid}")]
        [Authorize(Roles = "Staff,Executive,Support,HOD,Manager,Management,HR,SuperAdmin,Admin")]
        public async Task<ActionResult<ClaimRequestDto>> Update(Guid id, [FromBody] CreateClaimRequestDto dto)
        {
            try
            {
                return Ok(await _claimService.UpdatePendingAsync(id, dto));
            }
            catch (Exception ex) when (ex is InvalidOperationException or ArgumentException)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (DbUpdateConcurrencyException)
            {
                return BadRequest(new { message = "Unable to save claim changes. Please refresh and try again." });
            }
        }

        [HttpPost("{id:guid}/approve")]
        [Authorize(Roles = "HOD,Manager,Management,HR,SuperAdmin,Admin")]
        public async Task<ActionResult<ClaimRequestDto>> Approve(Guid id, [FromBody] ApproveRejectClaimDto dto)
        {
            try
            {
                return Ok(await _claimService.ApproveAsync(id, dto.ApproverId));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id:guid}/reject")]
        [Authorize(Roles = "HOD,Manager,Management,HR,SuperAdmin,Admin")]
        public async Task<ActionResult<ClaimRequestDto>> Reject(Guid id, [FromBody] ApproveRejectClaimDto dto)
        {
            try
            {
                return Ok(await _claimService.RejectAsync(id, dto.ApproverId, dto.RejectionReason ?? ""));
            }
            catch (Exception ex) when (ex is InvalidOperationException or ArgumentException)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id:guid}/finalize")]
        [Authorize(Roles = "HOD,Manager,Management,HR,SuperAdmin,Admin")]
        public async Task<ActionResult<ClaimRequestDto>> Finalize(Guid id, [FromBody] ApproveRejectClaimDto dto)
        {
            try
            {
                return Ok(await _claimService.FinalizeByHrAsync(id, dto.ApproverId));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id:guid}/cancel")]
        public async Task<ActionResult<ClaimRequestDto>> Cancel(Guid id, [FromBody] CancelClaimDto dto)
        {
            try
            {
                return Ok(await _claimService.CancelAsync(id, dto.RequestedBy));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id:guid}/document")]
        [RequestSizeLimit(25 * 1024 * 1024)]
        [RequestFormLimits(MultipartBodyLengthLimit = 25 * 1024 * 1024)]
        public async Task<ActionResult<object>> UploadDocument(
            Guid id,
            IFormFile file,
            [FromForm] string? documentKind)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "File is required." });

            var kind = ClaimDocumentKind.Receipt;
            if (!string.IsNullOrWhiteSpace(documentKind) &&
                Enum.TryParse<ClaimDocumentKind>(documentKind, true, out var parsed))
                kind = parsed;

            try
            {
                var doc = await _claimService.UploadDocumentAsync(id, file, kind);
                return Ok(doc);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("pending/hod/{hodId:guid}")]
        [Authorize(Roles = "HOD,Manager,Management,HR,SuperAdmin,Admin")]
        public async Task<ActionResult<List<ClaimRequestDto>>> GetPendingForHod(Guid hodId) =>
            Ok(await _claimService.GetPendingForApproverAsync(hodId));

        private Guid GetUserId()
        {
            var raw = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value
                ?? User.FindFirst("userId")?.Value;
            return Guid.TryParse(raw, out var id) ? id : Guid.Empty;
        }
    }
}
