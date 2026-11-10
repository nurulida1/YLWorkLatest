
using System.ComponentModel.DataAnnotations;

namespace YLWorks.Model
{
    public class DeliveryOrderRMA : BaseEntity
    {
        public Guid Id { get; set; }

        public string DeliveryOrderRMANo { get; set; } = string.Empty;

        // Delivery Order
        public Guid? DeliveryOrderId { get; set; }
        public DeliveryOrder? DeliveryOrder { get; set; }

        public DateTime? Date { get; set; }

        // Return information
        public string? ReturnType { get; set; }
        public decimal? ReturnQuantity { get; set; }
        public string? ReturnMethod { get; set; }
        public string? ReturnAction { get; set; }

        // Companies
        public Guid? SenderCompanyId { get; set; }
        public Company? SenderCompany { get; set; }

        public Guid? ReceiverCompanyId { get; set; }
        public Company? ReceiverCompany { get; set; }

        // Additional information
        public string? Reason { get; set; }
        public string? Remarks { get; set; }

        public string Status { get; set; } = "Reported";

        // Action information
        public Guid? ActionUserId { get; set; }
        public string? ActionUserName { get; set; }
        public string? SignatureImage { get; set; }

        // Related records
        public ICollection<DORMAItem> DORMAItems { get; set; }
            = new List<DORMAItem>();

        public ICollection<DORMAProofImage> DORMAProofImages { get; set; }
            = new List<DORMAProofImage>();

        public ICollection<DORMAStatusHistory> DORMAStatusHistories { get; set; }
            = new List<DORMAStatusHistory>();
    }

    // =========================================================
    // RMA ITEM
    // =========================================================

    public class DORMAItem
    {
        public Guid Id { get; set; }

        public Guid DeliveryOrderRMAId { get; set; }
        public DeliveryOrderRMA DeliveryOrderRMA { get; set; } = null!;

        public Guid? SalesOrderItemId { get; set; }
        public SalesOrderItem? SalesOrderItem { get; set; }

        public Guid? DeliveryOrderItemId { get; set; }
        public DeliveryOrderItem? DeliveryOrderItem { get; set; }

        public string? Description { get; set; }
        public decimal? Quantity { get; set; }
        public string? Unit { get; set; }
        public string? Condition { get; set; }
        public string? Remarks { get; set; }
    }

    // =========================================================
    // CREATE REQUEST
    // =========================================================

    public class CreateDeliveryOrderRMARequest
    {
        public string DeliveryOrderRMANo { get; set; } = string.Empty;

        public Guid? DeliveryOrderId { get; set; }

        public DateTime? Date { get; set; }

        public string? ReturnMethod { get; set; }
        public string? ReturnType { get; set; }

        [Range(typeof(decimal), "0.01", "999999999999")]
        public decimal? ReturnQuantity { get; set; }

        public string? ReturnAction { get; set; }

        public Guid? SenderCompanyId { get; set; }
        public Guid? ReceiverCompanyId { get; set; }

        public string? Reason { get; set; }
        public string? Remarks { get; set; }

        public ICollection<RMAItemRequest>? DORMAItems { get; set; }
            = new List<RMAItemRequest>();

        public ICollection<DORMAProofImageRequest>? DORMAProofImages { get; set; }
            = new List<DORMAProofImageRequest>();
    }

    // =========================================================
    // UPDATE REQUEST
    // =========================================================

    public class UpdateDeliveryOrderRMARequest
        : CreateDeliveryOrderRMARequest
    {
        public Guid Id { get; set; }
    }

    // =========================================================
    // RMA ITEM REQUEST
    // =========================================================

    public class RMAItemRequest
    {
        public Guid? SalesOrderItemId { get; set; }
        public Guid? DeliveryOrderItemId { get; set; }

        public string? Description { get; set; }
        public decimal? Quantity { get; set; }
        public string? Unit { get; set; }
        public string? Condition { get; set; }
        public string? Remarks { get; set; }
    }

    // =========================================================
    // PROOF IMAGE
    // =========================================================

    public class DORMAProofImageRequest
    {
        public string Url { get; set; } = string.Empty;
    }

    public class DORMAProofImage
    {
        public Guid Id { get; set; }

        public Guid DeliveryOrderRMAId { get; set; }
        public DeliveryOrderRMA DeliveryOrderRMA { get; set; } = null!;

        public string Url { get; set; } = string.Empty;
    }

    // =========================================================
    // UPDATE STATUS REQUEST
    // =========================================================

    public class UpdateRMAStatusRequest
    {
        public string Status { get; set; } = string.Empty;

        public string? Remarks { get; set; }

        public string? SignatureImage { get; set; }
    }

    // =========================================================
    // STATUS HISTORY
    // =========================================================

    public class DORMAStatusHistory
    {
        public Guid Id { get; set; }

        public Guid RMAId { get; set; }
        public DeliveryOrderRMA DeliveryOrderRMA { get; set; } = null!;

        public string Status { get; set; } = string.Empty;

        public DateTime ActionAt { get; set; }

        public Guid? ActionUserId { get; set; }

        public string? Remarks { get; set; }
    }

    // =========================================================
    // DROPDOWN RESPONSE
    // =========================================================

    public class DORMADropdownDto
    {
        public List<DODropdownDto> DeliveryOrders { get; set; } = new();

        public List<ProjectDropdownDto> Projects { get; set; } = new();

        public List<CompanyDropdownItem> Companies { get; set; } = new();

        public List<UserDto> Users { get; set; } = new();
    }
}
