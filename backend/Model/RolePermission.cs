namespace YLWorks.Model
{
    public class RolePermission : BaseEntity
    {
        public Guid Id { get; set; }
        public string SystemRole { get; set; }
        public string AccessPermission { get; set; }
    }
    public class CreateRolePermissionRequest
    {
        public string SystemRole { get; set; } = string.Empty;
        public string AccessPermission { get; set; } = string.Empty;
    }
    public class UpdateRolePermissionRequest : CreateRolePermissionRequest
    {
        public Guid Id { get; set; } 
    }

}
