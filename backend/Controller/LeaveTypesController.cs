using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using YLWorks.Data;
using YLWorks.Model.Leave;

using YLWorks.Services.Leave;

namespace YLWorks.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class LeaveTypesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LeaveTypesController(AppDbContext context) => _context = context;

        [HttpGet]
        public async Task<ActionResult<List<LeaveTypeDto>>> GetAll([FromQuery] Guid? employeeId = null)
        {
            string? gender = null;
            if (employeeId.HasValue)
            {
                gender = await _context.Users.AsNoTracking()
                    .Where(u => u.Id == employeeId.Value)
                    .Select(u => u.Gender)
                    .FirstOrDefaultAsync();
            }

            var types = await _context.LeaveTypes
                .OrderBy(t => t.Name)
                .ToListAsync();

            var dtos = types
                .Where(t => !employeeId.HasValue || LeaveGenderRules.IsEligible(t.ApplicableGender, gender))
                .Select(Map)
                .ToList();

            return Ok(dtos);
        }

        [HttpPost]
        [Authorize(Roles = "HOD,Management,HR,SuperAdmin")]
        public async Task<ActionResult<LeaveTypeDto>> Create([FromBody] UpsertLeaveTypeDto dto)
        {
            if (!TryParsePolicyKind(dto.PolicyKind, out var kind))
                return BadRequest(new { message = "Invalid policyKind. Use Fixed, AnnualTenure, MedicalTenure, or Replacement." });
            if (!TryParseApplicableGender(dto.ApplicableGender, out var gender))
                return BadRequest(new { message = "Invalid applicableGender. Use All, Male, or Female." });

            var entity = new LeaveType
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                Description = dto.Description,
                IsPaid = dto.IsPaid,
                IsEmergency = dto.IsEmergency,
                DefaultDaysPerYear = dto.DefaultDaysPerYear,
                RequiresDocument = dto.RequiresDocument,
                AllowsHalfDay = dto.AllowsHalfDay,
                AllowsBalanceCascade = dto.IsEmergency ? false : dto.AllowsBalanceCascade,
                PolicyKind = kind,
                ApplicableGender = gender,
                CreatedAt = DateTime.UtcNow
            };
            _context.LeaveTypes.Add(entity);
            await _context.SaveChangesAsync();
            return Ok(Map(entity));
        }

        [HttpPut("{id:guid}")]
        [Authorize(Roles = "HOD,Management,HR,SuperAdmin")]
        public async Task<ActionResult<LeaveTypeDto>> Update(Guid id, [FromBody] UpsertLeaveTypeDto dto)
        {
            var entity = await _context.LeaveTypes.FindAsync(id);
            if (entity == null) return NotFound();

            if (!TryParsePolicyKind(dto.PolicyKind, out var kind))
                return BadRequest(new { message = "Invalid policyKind. Use Fixed, AnnualTenure, MedicalTenure, or Replacement." });
            if (!TryParseApplicableGender(dto.ApplicableGender, out var gender))
                return BadRequest(new { message = "Invalid applicableGender. Use All, Male, or Female." });

            entity.Name = dto.Name;
            entity.Description = dto.Description;
            entity.IsPaid = dto.IsPaid;
            entity.IsEmergency = dto.IsEmergency;
            entity.DefaultDaysPerYear = dto.DefaultDaysPerYear;
            entity.RequiresDocument = dto.RequiresDocument;
            entity.AllowsHalfDay = dto.AllowsHalfDay;
            entity.AllowsBalanceCascade = dto.IsEmergency ? false : dto.AllowsBalanceCascade;
            entity.PolicyKind = kind;
            entity.ApplicableGender = gender;
            entity.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return Ok(Map(entity));
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "HOD,Management,HR,SuperAdmin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var entity = await _context.LeaveTypes.FindAsync(id);
            if (entity == null) return NotFound();

            if (entity.PolicyKind is LeavePolicyKind.AnnualTenure or LeavePolicyKind.MedicalTenure)
            {
                return BadRequest(new
                {
                    message = "Annual and Medical leave types cannot be deleted (required for tenure policy)."
                });
            }

            var hasRequests = await _context.LeaveRequests.AnyAsync(r => r.LeaveTypeId == id);
            if (hasRequests)
            {
                return BadRequest(new
                {
                    message = "Cannot delete this leave type because leave requests already use it."
                });
            }

            var balances = await _context.LeaveBalances.Where(b => b.LeaveTypeId == id).ToListAsync();
            if (balances.Count > 0)
                _context.LeaveBalances.RemoveRange(balances);

            _context.LeaveTypes.Remove(entity);
            await _context.SaveChangesAsync();
            return Ok(new { success = true });
        }

        private static bool TryParsePolicyKind(string? value, out LeavePolicyKind kind)
        {
            if (Enum.TryParse(value, ignoreCase: true, out kind) &&
                Enum.IsDefined(typeof(LeavePolicyKind), kind))
                return true;
            kind = LeavePolicyKind.Fixed;
            return false;
        }

        private static bool TryParseApplicableGender(string? value, out LeaveApplicableGender gender)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                gender = LeaveApplicableGender.All;
                return true;
            }
            if (Enum.TryParse(value, ignoreCase: true, out gender) &&
                Enum.IsDefined(typeof(LeaveApplicableGender), gender))
                return true;
            gender = LeaveApplicableGender.All;
            return false;
        }

        private static LeaveTypeDto Map(LeaveType t) => new()
        {
            Id = t.Id,
            Name = t.Name,
            Description = t.Description,
            IsPaid = t.IsPaid,
            IsEmergency = t.IsEmergency,
            DefaultDaysPerYear = t.DefaultDaysPerYear,
            RequiresDocument = t.RequiresDocument,
            AllowsHalfDay = t.AllowsHalfDay,
            AllowsBalanceCascade = t.AllowsBalanceCascade,
            PolicyKind = t.PolicyKind.ToString(),
            ApplicableGender = t.ApplicableGender.ToString()
        };
    }
}
