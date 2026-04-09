namespace YLWorks.Model
{
    public class Department: BaseEntity
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public Guid HodId { get; set; }
        public User Hod { get; set; }
        public string Status { get; set; }
        public List<User> Users { get; set; } = new List<User>();

    }

    public class CreateDepartmentRequest
    {
        public string Name { get; set; }
        public Guid HodId { get; set; }
        public string Status { get; set; }
    }

    public class UpdateDepartmentRequest
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public Guid HodId { get; set; }
        public string Status { get; set; }
    }

}
