using YLWorks.Model.Leave;

namespace YLWorks.Model { 
    
    public class HrDashboardDto
    {
        public int TotalEmployees { get; set; }
        public int PendingLeave { get; set; }
        public int OnLeaveToday { get; set; }
        public int AssumedPresentToday { get; set; }
        public int ResignedStaff { get; set; }
        public int NewStaffUnderOneYear { get; set; }
        public List<DepartmentDistributionDto> DepartmentDistribution { get; set; } = [];
        public List<LeaveCalendarEventDto> TodayLeaveEvents { get; set; } = [];
    }

    public class SuperAdminDashboardDto
    {
        public int TotalUsers { get; set; }
        public int ActiveUsers { get; set; }
        public int InactiveUsers { get; set; }
        public int PendingApprovals { get; set; }

        public int TotalDepartments { get; set; }

        public int TotalInventoryItems { get; set; }
        public int LowStockItems { get; set; }
        public int FaultyItems { get; set; }

        public List<PendingUserDto> PendingUsers { get; set; } = [];

        public List<ActivityLogDto> Activities { get; set; } = [];
    }

    public class PendingUserDto
    {
        public Guid Id { get; set; }
        public string FullName { get; set; } = "";
        public string JobTitle { get; set; } = "";
        public string Department { get; set; } = "";
        public DateTime? CreatedAt { get; set; }
    }

    public class ActivityLogDto
    {
        public string Title { get; set; } = "";
        public string Description { get; set; } = "";
        public string User { get; set; } = "";
        public DateTime? Date { get; set; }
        public string Icon { get; set; } = "";
        public string Color { get; set; } = "";
    }

    public class ActivityLog : BaseEntity
    {
        public Guid Id { get; set; }

        public Guid? UserId { get; set; }

        public User? User { get; set; }

        public string Action { get; set; } = "";

        public string Module { get; set; } = "";

        public string Description { get; set; } = "";

        public string Icon { get; set; } = "pi pi-circle";

        public string Color { get; set; } = "blue";
    }
}