using System.Security;

namespace YLWorks.Model
{
    public class Permission: BaseEntity
    {
        public Guid Id { get; set; }
        public string ModuleName { get; set; }
        public string Action {  get; set; }
        public ICollection<PermissionRole> PermissionRoles { get; set; } = new List<PermissionRole>();

    }
    public class PermissionRole
    {
        public Guid PermissionId { get; set; }
        public Permission Permission { get; set; } = null!;

        public Guid RoleId { get; set; }
        // Optional: Role entity if you have a Role table
        public Role Role { get; set; } = null!;
    }
    // DTO to create a permission
    public class CreatePermissionRequest
    {
        public string ModuleName { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;

        // List of RoleIds this permission should be assigned to
        public List<Guid> RoleIds { get; set; } = new List<Guid>();
    }

    // DTO to update a permission
    public class UpdatePermissionRequest
    {
        public Guid Id { get; set; } // Permission Id to update
        public string ModuleName { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;

        // Updated list of RoleIds
        public List<Guid> RoleIds { get; set; } = new List<Guid>();
    }

    // Optional response DTO
    public class PermissionResponse
    {
        public Guid Id { get; set; }
        public string ModuleName { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public List<Guid> RoleIds { get; set; } = new List<Guid>();
    }
}
