namespace YLWorks.Model
{
    public class AccessPermission : BaseEntity
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
    }

    public class CreateAccessPermissionRequest
    {
        public string Name { get; set; }
    }

    public class UpdateAccessPermissionRequest: CreateAccessPermissionRequest
    {
        public Guid Id { get; set; }
    }
}