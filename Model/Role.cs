namespace YLWorks.Model
{
    public class Role: BaseEntity
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
    }
    public class CreateRoleRequest
    {
        public string Name { get; set; } = string.Empty;
    }
    public class UpdateRoleRequest
    {
        public Guid Id { get; set; } // Required to identify which role to update
        public string Name { get; set; } = string.Empty;
    }

}
