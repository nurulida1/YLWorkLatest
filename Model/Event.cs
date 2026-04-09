namespace YLWorks.Model
{
    public class Event: BaseEntity
    {
        public Guid Id { get; set; }
        public string Title { get; set; }
        public string? Description { get; set; }
        public string? Type { get; set; } // event / meeting
        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public bool? AllDay { get; set; }
        public string? Location { get; set; }
        public string? MeetingLink { get; set; }
        public List<Guid>? Participants { get; set; }
        public Guid? CreatedById { get; set; }
        public User CreatedBy { get; set; }
        public Guid? DepartmentId { get; set; }
        public Department? Department { get; set; }
        public DateTime? Reminder {  get; set; }
        public bool? Repeat { get; set; } // none, daily, weekly, monthly
    }

    public class CreateEventRequest
    {
        public string Title { get; set; }
        public string? Description { get; set; }
        public string? Type { get; set; } // event / meeting
        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public bool? AllDay { get; set; }
        public string? Location { get; set; }
        public string? MeetingLink { get; set; }
        public List<Guid>? Participants { get; set; }
        public Guid? DepartmentId { get; set; }
        public DateTime? Reminder { get; set; }
        public bool? Repeat { get; set; } // none, daily, weekly, monthly
    }

    public class UpdateEventRequest
    {
        public Guid Id { get; set; }

        public string Title { get; set; }
        public string? Description { get; set; }
        public string? Type { get; set; } // event / meeting
        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public bool? AllDay { get; set; }
        public string? Location { get; set; }
        public string? MeetingLink { get; set; }
        public List<Guid>? Participants { get; set; }
        public Guid? DepartmentId { get; set; }
        public DateTime? Reminder { get; set; }
        public bool? Repeat { get; set; } // none, daily, weekly, monthly
    }

}
