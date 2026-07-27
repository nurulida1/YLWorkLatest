using Microsoft.EntityFrameworkCore;
using YLWorks.Data;
using YLWorks.Model.Leave;

namespace YLWorks.Services.Leave
{
    public class LeaveConflictService
    {
        private readonly AppDbContext _context;

        public LeaveConflictService(AppDbContext context) => _context = context;

        public async Task<ConflictCheckResultDto> CheckConflictAsync(
            Guid employeeId, DateTime start, DateTime end)
        {
            var employee = await _context.Users
                .Include(u => u.Departments)
                .FirstOrDefaultAsync(u => u.Id == employeeId);

            if (employee == null)
                return new ConflictCheckResultDto();

            var departmentIds = employee.Departments.Select(d => d.Id).ToList();
            if (departmentIds.Count == 0)
                return new ConflictCheckResultDto();

            var departmentUserIds = await _context.Users
                .Where(u => u.Departments.Any(d => departmentIds.Contains(d.Id)) && u.Id != employeeId)
                .Select(u => u.Id)
                .ToListAsync();

            var startDate = start.Date;
            var endDate = end.Date;

            var overlapping = await _context.LeaveRequests
                .Include(r => r.Employee)
                .Where(r =>
                    departmentUserIds.Contains(r.EmployeeId) &&
                    r.Status != LeaveRequestStatus.Rejected &&
                    r.Status != LeaveRequestStatus.Cancelled &&
                    r.StartDate.Date <= endDate &&
                    r.EndDate.Date >= startDate)
                .Select(r => r.Employee.FullName)
                .Distinct()
                .ToListAsync();

            return new ConflictCheckResultDto
            {
                ConflictFound = overlapping.Count > 0,
                OverlappingCount = overlapping.Count,
                OverlappingEmployees = overlapping.Count > 0
                    ? string.Join(", ", overlapping)
                    : null
            };
        }
    }
}
