using System;
using System.Collections.Generic;

namespace YLWorks.Model
{
    public class PurchaseOrderRMA : BaseEntity
    {
        public Guid Id { get; set; }
        public string PurchaseOrderRMANo { get; set; } = string.Empty; 

        public Guid? PurchaseOrderId { get; set; }
        public Guid? GoodsReceivingId { get; set; } 

        public DateTime? Date { get; set; }

        public string? ReturnType { get; set; }
        public decimal? ReturnQuantity { get; set; }
        public string? ReturnMethod { get; set; } 

        public string? ReturnAction { get; set; }

        public Guid? SenderCompanyId { get; set; }
        public Company? SenderCompany { get; set; }

        public Guid? ReceiverCompanyId { get; set; } 
        public Company? ReceiverCompany { get; set; }

        public string? Reason { get; set; }
        public string? Remarks { get; set; }
        public string Status { get; set; } = "Prepared"; 

        public Guid? ActionUserId { get; set; }
        public string? ActionUserName { get; set; }
        public DateTime? StatusUpdatedAt { get; set; }

        public ICollection<PORMAItem> PORMAItems { get; set; } = new List<PORMAItem>();
        public ICollection<PORMAProofImage> PORMAProofImages { get; set; } = new List<PORMAProofImage>();
    }

    public class PORMAItem
    {
        public Guid Id { get; set; }
        public Guid PurchaseOrderRMAId { get; set; }
        public PurchaseOrderRMA PurchaseOrderRMA { get; set; } = null!;

        public Guid? PurchaseOrderItemId { get; set; }
        public Guid? GoodsReceivedItemId { get; set; }

        public string? Description { get; set; }
        public decimal? Quantity { get; set; }
        public string? Unit { get; set; }
        public string? Condition { get; set; } 
        public string? Remarks { get; set; }
    }

    public class CreatePurchaseOrderRMARequest
    {
        public string PurchaseOrderRMANo { get; set; } = string.Empty;
        public Guid? PurchaseOrderId { get; set; }
        public Guid? GoodsReceivingId { get; set; }
        public DateTime? Date { get; set; }
        public string? ReturnMethod { get; set; }
        public string? ReturnType { get; set; }
        public decimal? ReturnQuantity { get; set; }
        public string? ReturnAction { get; set; }
        public Guid? SenderCompanyId { get; set; }   
        public Guid? ReceiverCompanyId { get; set; }
        public string? Reason { get; set; }
        public string? Remarks { get; set; }

        public ICollection<PORMAItemRequest>? PORMAItems { get; set; } = new List<PORMAItemRequest>();
        public ICollection<PORMAProofImageRequest>? PORMAProofImages { get; set; } = new List<PORMAProofImageRequest>();
    }

    public class UpdatePurchaseOrderRMARequest : CreatePurchaseOrderRMARequest
    {
        public Guid Id { get; set; }
        public new ICollection<UpdatePORMAItemRequest>? PORMAItems { get; set; } = new List<UpdatePORMAItemRequest>();
    }

    public class PORMAItemRequest
    {
        public Guid? PurchaseOrderItemId { get; set; }
        public Guid? GoodsReceivedItemId { get; set; }
        public string? Description { get; set; }
        public decimal? Quantity { get; set; }
        public string? Unit { get; set; }
        public string? Condition { get; set; }
        public string? Remarks { get; set; }
    }

    public class UpdatePORMAItemRequest : PORMAItemRequest
    {
        public Guid? Id { get; set; }
    }

    public class PORMAProofImage
    {
        public Guid Id { get; set; }
        public Guid PurchaseOrderRMAId { get; set; }
        public PurchaseOrderRMA PurchaseOrderRMA { get; set; } = null!;
        public string Url { get; set; } = string.Empty;
    }


    public class PORMAProofImageRequest
    {
        public string Url { get; set; } = string.Empty;
    }

}
