namespace YLWorks.Model
{
    /// <summary>
    /// Many-to-many: a user may have multiple reporting managers (HODs).
    /// </summary>
    public class UserReportingManager
    {
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;

        public Guid ManagerId { get; set; }
        public User Manager { get; set; } = null!;
    }
}
