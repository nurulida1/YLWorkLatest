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

        /// <summary>Department default working hours (null = company ClaimSettings defaults).</summary>
        public TimeSpan? WorkStartTime { get; set; }
        public TimeSpan? WorkEndTime { get; set; }
        public bool? UsesRestDayHalfDay { get; set; }
        public TimeSpan? RestDayHalfDayStart { get; set; }
        public TimeSpan? RestDayHalfDayEnd { get; set; }

        public List<User> Users { get; set; } = new();
    }

    public class DepartmentDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public Guid? HodId { get; set; }
        public HodDto? Hod { get; set; }
        public string? WorkStartTime { get; set; }
        public string? WorkEndTime { get; set; }
        public bool? UsesRestDayHalfDay { get; set; }
        public string? RestDayHalfDayStart { get; set; }
        public string? RestDayHalfDayEnd { get; set; }
    }

    public class HodDto
    {
        public string FullName { get; set; } = string.Empty;
    }


    public class CreateDepartmentRequest
    {
        public string Name { get; set; } = string.Empty;
        public Guid? HodId { get; set; }
        public string? Description { get; set; }
        public string? Code { get; set; }
        public bool IsActive { get; set; }
        public string? WorkStartTime { get; set; }
        public string? WorkEndTime { get; set; }
        public bool? UsesRestDayHalfDay { get; set; }
        public string? RestDayHalfDayStart { get; set; }
        public string? RestDayHalfDayEnd { get; set; }
    }

    public class UpdateDepartmentRequest : CreateDepartmentRequest
    {
        public Guid Id { get; set; }
    }
}