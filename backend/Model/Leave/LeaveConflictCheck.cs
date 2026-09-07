using WebApplication1.Helpers;
namespace YLWorks.Model.Leave
{
    public class LeaveConflictCheck : BaseEntity
    {
        public Guid Id { get; set; }
        public Guid RequestId { get; set; }
        public LeaveRequest Request { get; set; } = null!;
        public bool ConflictFound { get; set; }
        public int OverlappingCount { get; set; }
        public string? OverlappingEmployees { get; set; }
        public bool EmployeeOverride { get; set; }
        public DateTime CheckedAt { get; set; } = DateTimeHelper.Now();
    }
}
