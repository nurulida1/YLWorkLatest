namespace YLWorks.Model
{
    public class Department : BaseEntity
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;

        public Guid? HodId { get; set; }
        public User? Hod { get; set; }

        public string? Description { get; set; }
        public bool IsActive { get; set; }

        public List<User> Users { get; set; } = new();
    }

    public class DepartmentDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public bool IsActive { get; set; }
        public Guid? HodId { get; set; }
        public HodDto? Hod { get; set; }
    }

    public class HodDto
    {
        public string FullName { get; set; }
    }


    public class CreateDepartmentRequest
    {
        public string Name { get; set; } = string.Empty;
        public Guid HodId { get; set; }
        public string? Description { get; set; }
        public string? Code { get; set; }
        public bool IsActive { get; set; }
    }

    public class UpdateDepartmentRequest : CreateDepartmentRequest
    {
        public Guid Id { get; set; }
    }
}