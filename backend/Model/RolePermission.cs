using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace YLWorks.Model
{
    public class RolePermission : BaseEntity
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        [StringLength(50)]
        public string SystemRole { get; set; } = string.Empty; // e.g., "Management", "HOD", "Executive", "Support"

        public Guid? DepartmentId { get; set; }

        [ForeignKey("DepartmentId")]
        public Department? Department { get; set; }

        [Required]
        public Guid SystemModuleId { get; set; }

        [ForeignKey("SystemModuleId")]
        public SystemModule Module { get; set; } = null!;

        public bool CanCreate { get; set; } = false;
        public bool CanRead { get; set; } = false;   // (View)
        public bool CanUpdate { get; set; } = false; // (Edit)
        public bool CanDelete { get; set; } = false;
        public bool CanUpdateStatus { get; set; } = false; // (Approve/Reject Status changes)
    }

    public class UpsertRolePermissionDto
    {
        public Guid? Id { get; set; }
        [Required] public string SystemRole { get; set; } = string.Empty;
        public Guid? DepartmentId { get; set; }
        [Required] public Guid SystemModuleId { get; set; }
        public bool CanCreate { get; set; }
        public bool CanRead { get; set; }
        public bool CanUpdate { get; set; }
        public bool CanDelete { get; set; }
        public bool CanUpdateStatus { get; set; }
    }
}