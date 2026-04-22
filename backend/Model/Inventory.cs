namespace YLWorks.Model
{
    public class Inventory : BaseEntity
    {
        public Guid Id { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public string? Brand { get; set; }
        public string? Model { get; set; }
        public Guid? CategoryId { get; set; }
        public CategoryInventory? Category { get; set; }
        public string? Description { get; set; }
        public string Unit { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public string? SerialNumber { get; set; }
        public string? ReferenceType { get; set; } // MaterialRequest, PurchaseOrder, WorkOrder
        public Guid? ReferenceId { get; set; }
        public Guid? LocationId { get; set; }
        public LocationInventory? Location { get; set; }
        public Guid? SectionId { get; set; }
        public SectionInventory? Section { get; set; }
        public int? ParLevel { get; set; }
        public DateTime? Date { get; set; }
        public string? Status { get; set; } // InStock, Issued, Damaged, Lost, FOC, Disposed, etc.
        public string? Remarks { get; set; }
        public double? Costs { get; set; }
        public string? Attachment { get; set; }
        public Guid? CreatedById { get; set; }
        public User? CreatedBy { get; set; }
    }

    public class CreateInventoryRequest
    {
        public string ItemName { get; set; } = string.Empty;
        public string? Brand { get; set; }
        public string? Model { get; set; }
        public Guid? CategoryId { get; set; }
        public string? Description { get; set; }
        public string Unit { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public string? SerialNumber { get; set; }
        public string? ReferenceType { get; set; } // MaterialRequest, PurchaseOrder, WorkOrder
        public Guid? ReferenceId { get; set; }
        public Guid? LocationId { get; set; }
        public Guid? SectionId { get; set; }
        public int? ParLevel { get; set; }
        public DateTime? Date { get; set; }
        public string? Status { get; set; } // InStock, Issued, Damaged, Lost, FOC, Disposed, etc.
        public string? Remarks { get; set; }
        public double? Costs { get; set; }
        public string? Attachment { get; set; }
    }

    public class UpdateInventoryRequest
    {
        public Guid Id { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public string? Brand { get; set; }
        public string? Model { get; set; }
        public Guid? CategoryId { get; set; }
        public string? Description { get; set; }
        public string Unit { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public string? SerialNumber { get; set; }
        public string? ReferenceType { get; set; } // MaterialRequest, PurchaseOrder, WorkOrder
        public Guid? ReferenceId { get; set; }
        public Guid? LocationId { get; set; }
        public Guid? SectionId { get; set; }
        public int? ParLevel { get; set; }
        public DateTime? Date { get; set; }
        public string? Status { get; set; } // InStock, Issued, Damaged, Lost, FOC, Disposed, etc.
        public string? Remarks { get; set; }
        public double? Costs { get; set; }
        public string? Attachment { get; set; }
    }

    public class InventoryDropdownResponse
    {
        public List<DropdownDto> Sections { get; set; } = new();
        public List<DropdownDto> Categories { get; set; } = new();
        public List<DropdownDto> Locations { get; set; } = new();
    }
}