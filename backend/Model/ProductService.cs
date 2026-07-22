using System.ComponentModel.DataAnnotations;

namespace YLWorks.Model
{
    public class ProductService : BaseEntity
    {
        public Guid Id { get; set; }

        public string? ItemCode { get; set; }
        public string? Description { get; set; }

        public string Type { get; set; }

        public string? Unit { get; set; }
        public decimal? Price { get; set; }

        public Guid? InventoryId { get; set; }
        public Inventory? Inventory { get; set; }

        public decimal? AvailableStock =>
            Inventory == null
                ? null
                : Inventory.Quantity - Inventory.ReservedQuantity;

        public ICollection<QuotationItems> QuotationItems { get; set; }
            = new List<QuotationItems>();

        public ICollection<Inventory> Inventories { get; set; }
            = new List<Inventory>();
    }

    public class CreateProductServiceRequest
    {
        public string? ItemCode { get; set; }
        public string? Description { get; set; }

        public string Type { get; set; }

        public string? Unit { get; set; }
        public decimal? Price { get; set; }

        public Guid? InventoryId { get; set; }
    }

    public class UpdateProductServiceRequest
    {
        public Guid Id { get; set; }

        public string? ItemCode { get; set; }
        public string? Description { get; set; }

        public string Type { get; set; }

        public string? Unit { get; set; }
        public decimal? Price { get; set; }

        public Guid? InventoryId { get; set; }
    }

    public class ProductServiceDropdownItem
    {
        public Guid Id { get; set; }
        public string? ItemCode { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
    }
}