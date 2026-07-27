using System.ComponentModel.DataAnnotations;

namespace YLWorks.Model.Leave
{
    public class CreateLeaveRequestDto
    {
        [Required]
        public Guid EmployeeId { get; set; }

        [Required]
        public Guid LeaveTypeId { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        [Required]
        [MinLength(3)]
        public string Reason { get; set; } = string.Empty;

        public bool IsEmergency { get; set; }
        public bool IsUnpaid { get; set; }
        public bool ConflictOverride { get; set; }
    }

    public class LeaveRequestDto
    {
        public Guid RequestId { get; set; }
        public Guid EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public Guid LeaveTypeId { get; set; }
        public string LeaveTypeName { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int TotalDays { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public bool IsEmergency { get; set; }
        public bool IsUnpaid { get; set; }
        public bool ConflictOverride { get; set; }
        public DateTime SubmittedAt { get; set; }
        public string? ConflictWarning { get; set; }
        public double? RemainingBalance { get; set; }
        public bool BalanceSufficient { get; set; } = true;
        public List<string>? BalanceOptions { get; set; }
        public string? RejectionReason { get; set; }
        public bool HasAppeal { get; set; }
        public string? AppealOutcome { get; set; }
        public string? DocumentUrl { get; set; }
        public string? DocumentFileName { get; set; }
        /// <summary>User ids of reporting managers who must act next (pending chain only).</summary>
        public List<Guid> CurrentApproverIds { get; set; } = new();
        /// <summary>First current eligible approver id (convenience; prefer CurrentApproverIds).</summary>
        public Guid? CurrentApproverId { get; set; }
        /// <summary>True when the employee has no reporting managers for leave routing.</summary>
        public bool NoApproverAssigned { get; set; }
        /// <summary>Full predicted HOD approval chain with per-step status.</summary>
        public List<LeaveApprovalChainStepDto> ApprovalChain { get; set; } = new();
    }

    public class LeaveApprovalChainStepDto
    {
        public int StepOrder { get; set; }
        public Guid? ApproverId { get; set; }
        public string ApproverName { get; set; } = string.Empty;
        /// <summary>Approved | Rejected | Pending | Waiting | Completed</summary>
        public string Status { get; set; } = string.Empty;
        public DateTime? DecidedAt { get; set; }
        public string? RejectionReason { get; set; }
        public bool IsFinalStep { get; set; }
    }

    public class ApproveRejectLeaveDto
    {
        [Required]
        public Guid ApproverId { get; set; }

        public string? RejectionReason { get; set; }
    }

    public class CancelLeaveDto
    {
        [Required]
        public Guid RequestedBy { get; set; }
    }

    public class AppealLeaveDto
    {
        [Required]
        public Guid EmployeeId { get; set; }

        [Required]
        [MinLength(3)]
        public string AppealReason { get; set; } = string.Empty;
    }

    public class ResolveAppealDto
    {
        [Required]
        public Guid ReviewedBy { get; set; }

        [Required]
        public LeaveAppealOutcome Outcome { get; set; }
    }

    public class LeaveBalanceDto
    {
        public Guid LeaveTypeId { get; set; }
        public string LeaveTypeName { get; set; } = string.Empty;
        public string PolicyKind { get; set; } = string.Empty;
        public string ApplicableGender { get; set; } = nameof(LeaveApplicableGender.All);
        public int Year { get; set; }
        public double EntitledDays { get; set; }
        public double TenureEntitledDays { get; set; }
        public double CarriedForwardDays { get; set; }
        public double CreditedDays { get; set; }
        public double UsedDays { get; set; }
        public double PendingDays { get; set; }
        public double RemainingDays { get; set; }
    }

    public class LeaveTypeDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsPaid { get; set; }
        public bool IsEmergency { get; set; }
        public int DefaultDaysPerYear { get; set; }
        public bool RequiresDocument { get; set; }
        public string PolicyKind { get; set; } = nameof(LeavePolicyKind.Fixed);
        public string ApplicableGender { get; set; } = nameof(LeaveApplicableGender.All);
    }

    public class UpsertLeaveTypeDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsPaid { get; set; } = true;
        public bool IsEmergency { get; set; }
        public int DefaultDaysPerYear { get; set; }
        public bool RequiresDocument { get; set; }
        /// <summary>Fixed | AnnualTenure | MedicalTenure | Replacement</summary>
        public string PolicyKind { get; set; } = nameof(LeavePolicyKind.Fixed);
        /// <summary>All | Male | Female</summary>
        public string ApplicableGender { get; set; } = nameof(LeaveApplicableGender.All);
    }

    public class LeaveTenureBandDto
    {
        public Guid? Id { get; set; }
        public string BandKind { get; set; } = string.Empty;
        public int MinYearsInclusive { get; set; }
        public int? MaxYearsExclusive { get; set; }
        public double DaysPerYear { get; set; }
    }

    public class LeavePolicyDto
    {
        public Guid Id { get; set; }
        public int EffectiveFromYear { get; set; }
        public double AnnualCarryForwardPercent { get; set; }
        public bool IsActive { get; set; }
        public List<LeaveTenureBandDto> TenureBands { get; set; } = new();
    }

    public class UpsertLeavePolicyDto
    {
        public int EffectiveFromYear { get; set; }
        public double AnnualCarryForwardPercent { get; set; } = 50;
        public List<LeaveTenureBandDto> TenureBands { get; set; } = new();
    }

    public class CreditLeaveBalanceDto
    {
        [Required]
        public Guid EmployeeId { get; set; }
        [Required]
        public Guid LeaveTypeId { get; set; }
        [Required]
        public double Days { get; set; }
        public int? Year { get; set; }
        public string? Note { get; set; }
    }

    public class LeaveAppealDto
    {
        public Guid AppealId { get; set; }
        public Guid RequestId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string AppealReason { get; set; } = string.Empty;
        public string RequestStatus { get; set; } = string.Empty;
        public string? Outcome { get; set; }
        public DateTime RaisedAt { get; set; }
        public DateTime? ResolvedAt { get; set; }
    }

    public class ConflictCheckResultDto
    {
        public bool ConflictFound { get; set; }
        public int OverlappingCount { get; set; }
        public string? OverlappingEmployees { get; set; }
    }

    public class BalanceCheckResultDto
    {
        public bool IsSufficient { get; set; }
        public double RequestedDays { get; set; }
        public double AvailableDays { get; set; }
        public List<string> Options { get; set; } = new();
    }

    public class LeaveCalendarEventDto
    {
        public Guid RequestId { get; set; }
        public Guid EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public Guid? LeaveTypeId { get; set; }
        public string? LeaveTypeName { get; set; }
        public string? Reason { get; set; }
        public bool CanViewDetails { get; set; }
    }

    public class LeaveCalendarResponseDto
    {
        public bool CanViewDetails { get; set; }
        public List<LeaveCalendarEventDto> Events { get; set; } = new();
    }

    public class LeaveCalendarSyncStatusDto
    {
        public bool GoogleConnected { get; set; }
        public string? GoogleAccountEmail { get; set; }
        public DateTime? ConnectedAtUtc { get; set; }
        public DateTime? LastSyncAtUtc { get; set; }
        public string? LastError { get; set; }

        public bool OutlookConnected { get; set; }
        public string? OutlookFeedUrl { get; set; }
        public DateTime? OutlookConnectedAtUtc { get; set; }
        public DateTime? OutlookLastAccessedAtUtc { get; set; }
    }

    public class LeaveCalendarConnectUrlDto
    {
        public string AuthUrl { get; set; } = string.Empty;
    }

    public class LeaveCalendarOutlookFeedDto
    {
        public string FeedUrl { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }
}
