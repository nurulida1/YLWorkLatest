using System.ComponentModel.DataAnnotations;

namespace YLWorks.Model
{
    public class SystemModule : BaseEntity
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty; // e.g., "Quotation", "Invoice", "Inventory"

        [Required]
        [StringLength(50)]
        public string Code { get; set; } = string.Empty; // e.g., "QUOTATION", "INVOICE"
    }


    public class CreateSystemModuleRequest
    {
        public string Name { get; set; } = string.Empty; 
        public string Code { get; set; } = string.Empty; 
    }

    public class UpdateSystemModuleRequest : CreateSystemModuleRequest
    {
        public Guid Id { get; set;}
    }
}