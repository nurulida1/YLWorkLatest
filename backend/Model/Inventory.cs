namespace YLWorks.Model
{
    public class Inventory : BaseEntity
    {
        public Guid Id { get; set; }

        public string? ItemCode { get; set; }
        public string ItemName { get; set; } = string.Empty;

        public string? Brand { get; set; }
        public string? Model { get; set; }

        public decimal AvailableQuantity =>
            (Quantity ?? 0m) - (ReservedQuantity ?? 0m);

        public string? Description { get; set; }

        public Guid? CategoryId { get; set; }
        public CategoryInventory? Category { get; set; }

        public Guid? ProductServiceId { get; set; }  
        public ProductService? ProductService { get; set; }

        public string Unit { get; set; } = string.Empty;

        public decimal? ReservedQuantity { get; set; }
        public decimal? Quantity { get; set; }

        public string? SerialNumber { get; set; }

        public Guid? LocationId { get; set; }
        public LocationInventory? Location { get; set; }

        public Guid? SectionId { get; set; }
        public SectionInventory? Section { get; set; }

        public int? ParLevel { get; set; }

        public DateTime? Date { get; set; }

        public string? Status { get; set; }

        public string? Remarks { get; set; }

        public decimal? Costs { get; set; }

        public string? Attachment { get; set; }

        public Guid? CreatedById { get; set; }
        public User? CreatedBy { get; set; }
        public string StockType { get; set; } = "Stock";
    }

    public class CreateInventoryRequest
    {
        public string? ItemCode { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public string? Brand { get; set; }
        public string? Model { get; set; }
        public Guid? CategoryId { get; set; }
        public string? Description { get; set; }
        public string Unit { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public string? SerialNumber { get; set; }
        public Guid? LocationId { get; set; }
        public Guid? SectionId { get; set; }
        public int? ParLevel { get; set; }
        public DateTime? Date { get; set; }
        public string? Status { get; set; } // InStock, Issued, Damaged, Lost, FOC, Disposed, etc.
        public string? Remarks { get; set; }
        public decimal? Costs { get; set; }
        public string? Attachment { get; set; }
        public decimal? ReservedQuantity { get; set; }
        public Guid? ProductServiceId { get; set; }
    }

    public class UpdateInventoryRequest
    {
        public Guid Id { get; set; }
        public string? ItemCode { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public string? Brand { get; set; }
        public string? Model { get; set; }
        public Guid? CategoryId { get; set; }
        public string? Description { get; set; }
        public string Unit { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public string? SerialNumber { get; set; }
        public Guid? LocationId { get; set; }
        public Guid? SectionId { get; set; }
        public int? ParLevel { get; set; }
        public DateTime? Date { get; set; }
        public string? Status { get; set; } // InStock, Issued, Damaged, Lost, FOC, Disposed, etc.
        public string? Remarks { get; set; }
        public decimal? Costs { get; set; }
        public string? Attachment { get; set; }
    }

    public class InventoryDropdownResponse
    {
        public List<DropdownDto> Sections { get; set; } = new();
        public List<DropdownDto> Categories { get; set; } = new();
        public List<DropdownDto> Locations { get; set; } = new();
    }

    public class InventoryDashboardResponseDto
    {
        // Cards
        public int TotalItems { get; set; }
        public int LowStockItems { get; set; }
        public int FaultyItems { get; set; }
        public int PendingRequests { get; set; }

        // Restock list (USE DTO, not entity)
        public List<InventoryRestockDto> RestockAlerts { get; set; } = new();

        // Chart (USE DTO, not CategoryInventory)
        public List<InventoryCategoryChartDto> CategoryChart { get; set; } = new();
    }

    public class InventoryCategoryChartDto
    {
        public string CategoryName { get; set; } = string.Empty;
        public int Total { get; set; }
    }

    public class InventoryRestockDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public int ParLevel { get; set; }
        public SectionDto Section { get; set; }
        public string Brand { get; set; }
    }

    public class SectionDto
    {
        public string Name { get; set; } = string.Empty;
    }

    public class StockTransaction
    {
        public Guid Id { get; set; }
        public Guid InventoryId { get; set; }

        public string Type { get; set; } // IN / OUT
        public decimal Quantity { get; set; }

        public string ReferenceType { get; set; } // GRN / SO / ADJUSTMENT
        public Guid ReferenceId { get; set; }

        public DateTime CreatedAt { get; set; }
    }

    public class InventoryDropdownItem
    {
        public Guid Id { get; set; }
        public string? ItemCode { get; set; }
        public string ItemName { get; set; } = string.Empty;
    }

    public class InventoryAudit
    {
        public Guid Id { get; set; }
        public Guid InventoryId { get; set; }
        public Inventory? Inventory { get; set; }

        /// <summary>Create or Update</summary>
        public string Action { get; set; } = string.Empty;

        public Guid? UserId { get; set; }
        public string? UserName { get; set; }

        public DateTime CreatedAt { get; set; }

        /// <summary>JSON: { message, fields: [{ field, oldValue, newValue }] }</summary>
        public string Changes { get; set; } = "{}";
    }

    public class InventoryAuditFieldChange
    {
        public string Field { get; set; } = string.Empty;
        public string? OldValue { get; set; }
        public string? NewValue { get; set; }
    }

    public class InventoryAuditChangesPayload
    {
        public string? Message { get; set; }
        public List<InventoryAuditFieldChange> Fields { get; set; } = new();
    }

    public class InventoryAuditDto
    {
        public Guid Id { get; set; }
        public Guid InventoryId { get; set; }
        public string Action { get; set; } = string.Empty;
        public Guid? UserId { get; set; }
        public string? UserName { get; set; }
        public DateTime CreatedAt { get; set; }
        public InventoryAuditChangesPayload Changes { get; set; } = new();
    }
}