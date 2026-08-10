namespace YLWorks.Model
{ 
    public class Meeting : BaseEntity
    {
        public Guid Id { get; set; }

        public string Title { get; set; } = null!;

        public string? Description { get; set; }

        public Guid OrganizerId { get; set; }

        public User Organizer { get; set; } = null!;

        public DateTime MeetingDate { get; set; }

        public TimeSpan? MeetingTime { get; set; }

        public string? Location { get; set; }

        public string? MeetingLink { get; set; }

        public int ReminderMinutes { get; set; }

        public ICollection<MeetingParticipant> Participants { get; set; }
        = new List<MeetingParticipant>();
    }

    public class MeetingParticipant
    {
        public Guid Id { get; set; }

        public Guid MeetingId { get; set; }

        public Meeting Meeting { get; set; } = null!;

        public Guid UserId { get; set; }

        public User User { get; set; } = null!;

        public bool HasAccepted { get; set; }

        public bool HasJoined { get; set; }
    }

    public class CreateMeetingRequest
    {
        public string Title { get; set; } = null!;
        public string? Description { get; set; }
        public DateTime MeetingDate { get; set; }
        public TimeSpan? MeetingTime { get; set; }
        public string? Location { get; set; }
        public string? MeetingLink { get; set; }
        public int ReminderMinutes { get; set; }
        public List<Guid> ParticipantIds { get; set; } = new List<Guid>();
    }

    public class UpdateMeetingRequest
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = null!;
        public string? Description { get; set; }
        public DateTime MeetingDate { get; set; }
        public TimeSpan? MeetingTime { get; set; }
        public string? Location { get; set; }
        public string? MeetingLink { get; set; }
        public int ReminderMinutes { get; set; }
        public List<Guid> ParticipantIds { get; set; } = new List<Guid>();
    }
}