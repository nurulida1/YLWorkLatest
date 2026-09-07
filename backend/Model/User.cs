using System.ComponentModel.DataAnnotations;

namespace YLWorks.Model
{
    public class User : BaseEntity
    {
        public Guid Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string? DisplayName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? ContactNo { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public ICollection<Department> Departments { get; set; }
        public DateTime? JoinedDate { get; set; }
        public string? AccessPermission { get; set; }
        public string EmployeeNo { get; set; } = string.Empty;
        public string? JobTitle { get; set; }
        public string SystemRole { get; set; } = "Staff";
        public string? Gender { get; set; }
        public DateTime? LastLoginAt { get; set; }
        public bool IsActive { get; set; } = true;
        /// <summary>Reporting managers (HODs) for leave approval routing.</summary>
        public ICollection<UserReportingManager> ReportingManagers { get; set; } = new List<UserReportingManager>();
        public Guid? ManagerId { get; set; }
        public User? Manager { get; set; }
        public ICollection<User> DirectReports { get; set; } = new List<User>();
        public string Status { get; set; } = "Pending";
        public string? RejectReason { get; set; }

        /// <summary>Monthly salary used for overtime ordinary/hourly rate (RM).</summary>
        public decimal? MonthlySalary { get; set; }

        /// <summary>Optional per-employee work schedule override (null = use department/company default).</summary>
        public TimeSpan? WorkStartTime { get; set; }
        public TimeSpan? WorkEndTime { get; set; }
        public bool? UsesRestDayHalfDay { get; set; }
        public TimeSpan? RestDayHalfDayStart { get; set; }
        public TimeSpan? RestDayHalfDayEnd { get; set; }

        // Refresh token support
        public string? RefreshToken { get; set; }
        public DateTime? RefreshTokenExpiryTime { get; set; }
        public ICollection<Notification> Notifications { get; set; }
        = new List<Notification>();
    }

    public class LoginRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        [Required]
        public string Password { get; set; } = string.Empty;
    }

    public class RegisterRequest
    {
        [Required]
        public string FullName { get; set; } = string.Empty;

        public string? DisplayName { get; set;} = string.Empty;
        
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;

        [Required]
        [Compare("Password")]
        public string ConfirmPassword { get; set; } = string.Empty;

        public string? ContactNo { get; set; }
        public string JobTitle {  get; set; } = string.Empty;
        public string? SystemRole { get; set; } = string.Empty;
        public string? Gender { get; set; } = string.Empty;
        public DateTime? JoinedDate { get; set; }
        public string Status { get; set; } = "Approved";
        public List<Guid> HodIds { get; set; } = new();
        public List<Guid> DepartmentIds { get; set; } = new List<Guid>();

    }

    public class PasswordResetToken
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string Token { get; set; } = string.Empty;
        public DateTime ExpiryTime { get; set; }
        public User User { get; set; } = null!;
    }


    public class ForgotPasswordRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
    }

    public class ResetPasswordRequest
    {
        [Required]
        public string Token { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string NewPassword { get; set; } = string.Empty;

        [Required]
        [Compare("NewPassword")]
        public string ConfirmPassword { get; set; } = string.Empty;
    }

    public class ChangePasswordRequest
    {
        [Required]
        public Guid UserId { get; set; }

        [Required]
        [MinLength(6)]
        public string NewPassword { get; set; } = string.Empty;

        [Required]
        [Compare("NewPassword")]
        public string ConfirmPassword { get; set; } = string.Empty;
    }


    public class UserDto
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string ContactNo { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? DisplayName { get; set; } = string.Empty;
        public string EmployeeNo { get; set; } = string.Empty;
        public string JobTitle { get; set; } = string.Empty;
        public string? Gender { get; set; } = string.Empty;
        public DateTime? JoinedDate { get; set; }
        public List<Guid> HodIds { get; set; } = new();
        public string? SystemRole { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }
        public bool IsActive { get; set; } = true;

        public List<Guid> DepartmentIds { get; set; } = new List<Guid>();
        public List<UserDepartmentDto> Departments { get; set; } = new List<UserDepartmentDto>();

        public decimal? MonthlySalary { get; set; }
        public string? WorkStartTime { get; set; }
        public string? WorkEndTime { get; set; }
        public bool? UsesRestDayHalfDay { get; set; }
        public string? RestDayHalfDayStart { get; set; }
        public string? RestDayHalfDayEnd { get; set; }
    }

    public class UserDepartmentDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }

    public class LoginResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? DisplayName { get; set;} = string.Empty;
        public string EmployeeNo { get; set; } = string.Empty;
        public string AccessToken { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public DateTime? ExpiresAt { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string SystemRole { get; set; } = string.Empty;
        public string JobTitle { get; set; } = string.Empty;
        public string Gender { get; set; }
        public List<Guid> HodIds { get; set; } = new();
        public List<string> Departments { get; set; } = new();
        public List<Guid>? DepartmentIds { get; set; } = new();
    }

    public class UpdateUserRequest
    {
        public string? FullName { get; set; }
        public string? DisplayName { get; set;} = string.Empty;
        public string? ContactNo { get; set; }
        public string? Email { get; set; }
        public string? JobTitle { get; set; }
        public DateTime? JoinedDate { get; set; }
        /// <summary>Replace reporting managers; empty list clears. Null = leave unchanged.</summary>
        public List<Guid>? HodIds { get; set; }
        public List<Guid>? DepartmentIds { get; set; }
        public string SystemRole { get; set; } = "Staff"; // SuperAdmin, Management, HOD, HR, Staff, Support
        public string? Gender { get; set; }

        public decimal? MonthlySalary { get; set; }
        /// <summary>HH:mm; null = leave unchanged. Empty string clears override.</summary>
        public string? WorkStartTime { get; set; }
        public string? WorkEndTime { get; set; }
        public bool? UsesRestDayHalfDay { get; set; }
        public string? RestDayHalfDayStart { get; set; }
        public string? RestDayHalfDayEnd { get; set; }
        /// <summary>When true, clears employee schedule overrides so department/company defaults apply.</summary>
        public bool? ClearWorkScheduleOverride { get; set; }
    }

    public class StaffDashboardDto
    {
        public int TotalStaff { get; set; }

        public int ActiveNow { get; set; }

        public int Inactive { get; set; }

        public List<DepartmentDistributionDto> DepartmentDistribution { get; set; } = [];
    }

    public class DepartmentDistributionDto
    {
        public Guid DepartmentId { get; set; }

        public string Department { get; set; } = string.Empty;

        public int Count { get; set; }
    }

    public class ApproveUserRequest
    {
        public Guid UserId { get; set; }
        public List<Guid> DepartmentIds { get; set; } = new();
        public string SystemRole { get; set; }
    }

    public class RejectUserRequest
    {
        public Guid UserId { get; set; }
        public string? Reason { get; set; }
    }

    public class ApprovalRequest
    {
        public string Status { get; set; } = string.Empty;

        // For Approved
        public string? SystemRole { get; set; }

        public List<Guid>? DepartmentIds { get; set; }


        // For Rejected
        public string? Reason { get; set; }
    }
}
