using System.ComponentModel.DataAnnotations;

namespace YLWorks.Model.Claim
{
    public class CreateClaimRequestDto
    {
        [Required]
        public Guid EmployeeId { get; set; }

        [Required]
        public string ClaimType { get; set; } = "MonthlyReimbursement";

        public string Remarks { get; set; } = string.Empty;

        // Outstation header
        public string? Destination { get; set; }
        public DateTime? TripStartDate { get; set; }
        public DateTime? TripEndDate { get; set; }

        public List<CreateClaimLineItemDto> LineItems { get; set; } = new();
    }

    public class CreateClaimLineItemDto
    {
        [Required]
        public string LineKind { get; set; } = "MonthlyItem";

        public string Description { get; set; } = string.Empty;
        public decimal Amount { get; set; }

        public string? Category { get; set; }
        public DateTime? PurchaseDate { get; set; }

        public DateTime? WorkDate { get; set; }
        public string? DayType { get; set; }
        public decimal? Hours { get; set; }

        public string? VehicleType { get; set; }
        public decimal? Kilometers { get; set; }

        public int? MealDays { get; set; }
    }

    public class ClaimLineItemDto
    {
        public Guid Id { get; set; }
        public string LineKind { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string? Category { get; set; }
        public DateTime? PurchaseDate { get; set; }
        public DateTime? WorkDate { get; set; }
        public string? DayType { get; set; }
        public decimal? Hours { get; set; }
        public decimal? OrdinaryRate { get; set; }
        public decimal? HourlyRate { get; set; }
        public string? VehicleType { get; set; }
        public decimal? Kilometers { get; set; }
        public int? MealDays { get; set; }
    }

    public class ClaimDocumentDto
    {
        public Guid Id { get; set; }
        public string DocumentKind { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public string FileUrl { get; set; } = string.Empty;
        public DateTime UploadedAt { get; set; }
    }

    public class ClaimRequestDto
    {
        public Guid RequestId { get; set; }
        public Guid EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string ClaimType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public string Remarks { get; set; } = string.Empty;
        public DateTime SubmittedAt { get; set; }
        public string? Destination { get; set; }
        public DateTime? TripStartDate { get; set; }
        public DateTime? TripEndDate { get; set; }
        public string? RejectionReason { get; set; }
        public List<ClaimLineItemDto> LineItems { get; set; } = new();
        public List<ClaimDocumentDto> Documents { get; set; } = new();
        public List<Guid> CurrentApproverIds { get; set; } = new();
        public Guid? CurrentApproverId { get; set; }
        public bool NoApproverAssigned { get; set; }
        public List<ClaimApprovalChainStepDto> ApprovalChain { get; set; } = new();
    }

    public class ClaimApprovalChainStepDto
    {
        public int StepOrder { get; set; }
        public Guid? ApproverId { get; set; }
        public string ApproverName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime? DecidedAt { get; set; }
        public string? RejectionReason { get; set; }
        public bool IsFinalStep { get; set; }
    }

    public class ApproveRejectClaimDto
    {
        [Required]
        public Guid ApproverId { get; set; }

        public string? RejectionReason { get; set; }
    }

    public class CancelClaimDto
    {
        [Required]
        public Guid RequestedBy { get; set; }
    }

    public class ClaimSettingsDto
    {
        public Guid Id { get; set; }
        public decimal MedicalPerReceiptLimit { get; set; }
        public decimal MedicalAnnualLimit { get; set; }
        public decimal SafetyShoesLimit { get; set; }
        public decimal MileageCarRatePerKm { get; set; }
        public decimal MileageMotorcycleRatePerKm { get; set; }
        public decimal MealAllowancePerDay { get; set; }
        public int OrdinaryRateDivisorDays { get; set; }
        public int OrdinaryDayHours { get; set; }
        public decimal OtNormalMultiplier { get; set; }
        public decimal OtRestDayFirstBandMultiplier { get; set; }
        public decimal OtRestDaySecondBandMultiplier { get; set; }
        public decimal OtRestDayAfter8HourlyMultiplier { get; set; }
        public decimal OtPublicHolidayUpTo8Multiplier { get; set; }
        public decimal OtPublicHolidayAfter8HourlyMultiplier { get; set; }
        public string DefaultWorkStartTime { get; set; } = "09:00";
        public string DefaultWorkEndTime { get; set; } = "18:00";
        public bool DefaultUsesRestDayHalfDay { get; set; }
        public string DefaultRestDayHalfDayStart { get; set; } = "08:00";
        public string DefaultRestDayHalfDayEnd { get; set; } = "12:00";
    }

    public class UpsertClaimSettingsDto
    {
        public decimal MedicalPerReceiptLimit { get; set; } = 100m;
        public decimal MedicalAnnualLimit { get; set; } = 400m;
        public decimal SafetyShoesLimit { get; set; } = 100m;
        public decimal MileageCarRatePerKm { get; set; } = 0.50m;
        public decimal MileageMotorcycleRatePerKm { get; set; } = 0.30m;
        public decimal MealAllowancePerDay { get; set; } = 50m;
        public int OrdinaryRateDivisorDays { get; set; } = 26;
        public int OrdinaryDayHours { get; set; } = 8;
        public decimal OtNormalMultiplier { get; set; } = 1.5m;
        public decimal OtRestDayFirstBandMultiplier { get; set; } = 0.5m;
        public decimal OtRestDaySecondBandMultiplier { get; set; } = 1.0m;
        public decimal OtRestDayAfter8HourlyMultiplier { get; set; } = 2.0m;
        public decimal OtPublicHolidayUpTo8Multiplier { get; set; } = 2.0m;
        public decimal OtPublicHolidayAfter8HourlyMultiplier { get; set; } = 3.0m;
        public string DefaultWorkStartTime { get; set; } = "09:00";
        public string DefaultWorkEndTime { get; set; } = "18:00";
        public bool DefaultUsesRestDayHalfDay { get; set; } = true;
        public string DefaultRestDayHalfDayStart { get; set; } = "08:00";
        public string DefaultRestDayHalfDayEnd { get; set; } = "12:00";
    }

    public class ClaimDashboardDto
    {
        public decimal ApprovedTotal { get; set; }
        public decimal PendingTotal { get; set; }
        public int ApprovedCount { get; set; }
        public int PendingCount { get; set; }
        public List<ClaimRequestDto> Recent { get; set; } = new();
    }

    public class PreviewOtAmountDto
    {
        [Required]
        public Guid EmployeeId { get; set; }
        [Required]
        public string DayType { get; set; } = "Normal";
        [Required]
        public decimal Hours { get; set; }
    }

    public class PreviewOtAmountResultDto
    {
        public decimal OrdinaryRate { get; set; }
        public decimal HourlyRate { get; set; }
        public decimal Amount { get; set; }
    }

    public class MedicalBalanceDto
    {
        public int Year { get; set; }
        public decimal AnnualLimit { get; set; }
        public decimal UsedAmount { get; set; }
        public decimal RemainingAmount { get; set; }
        public decimal PerReceiptLimit { get; set; }
        public bool IsProrated { get; set; }
    }
}
