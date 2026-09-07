using WebApplication1.Helpers;

namespace YLWorks.Model.Claim
{
    public class ClaimRequest : BaseEntity
    {
        public Guid Id { get; set; }
        public Guid EmployeeId { get; set; }
        public User Employee { get; set; } = null!;

        public ClaimType ClaimType { get; set; }
        public ClaimRequestStatus Status { get; set; } = ClaimRequestStatus.Pending;
        public decimal TotalAmount { get; set; }
        public string Remarks { get; set; } = string.Empty;
        public DateTime SubmittedAt { get; set; } = DateTimeHelper.Now();

        /// <summary>Outstation trip destination.</summary>
        public string? Destination { get; set; }
        /// <summary>Outstation trip start date.</summary>
        public DateTime? TripStartDate { get; set; }
        /// <summary>Outstation trip end date.</summary>
        public DateTime? TripEndDate { get; set; }

        public ICollection<ClaimLineItem> LineItems { get; set; } = new List<ClaimLineItem>();
        public ICollection<ClaimApproval> Approvals { get; set; } = new List<ClaimApproval>();
        public ICollection<ClaimDocument> Documents { get; set; } = new List<ClaimDocument>();
    }
}
