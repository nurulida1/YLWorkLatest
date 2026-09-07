namespace YLWorks.Model.Leave
{
    public class PublicHoliday : BaseEntity
    {
        public Guid Id { get; set; }
        /// <summary>Calendar date of the holiday (time ignored).</summary>
        public DateTime Date { get; set; }
        public string Name { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
    }

    public class PublicHolidayDto
    {
        public Guid Id { get; set; }
        public DateTime Date { get; set; }
        public string Name { get; set; } = string.Empty;
        public bool IsActive { get; set; }
    }

    public class UpsertPublicHolidayDto
    {
        public DateTime Date { get; set; }
        public string Name { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
    }
}
