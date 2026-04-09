namespace YLWorks.Model
{
    public class LeaveType: BaseEntity
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public bool RequiresAttachment { get; set; } = false;
    }
    public class CreateLeaveTypeRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public bool RequiresAttachment { get; set; } = false;
    }

    public class UpdateLeaveRequest
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public bool RequiresAttachment { get; set; } = false;
    }
}
