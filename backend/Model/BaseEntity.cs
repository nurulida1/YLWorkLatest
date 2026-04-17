namespace YLWorks.Model
{
    public abstract class BaseEntity
    {
        public DateTime? CreatedAt { get; set; } = DateTime.Now;
        public DateTime? UpdatedAt { get; set; }
    }

    public class DropdownDto
    {
        public Guid Id { get; set; }
        public string Label { get; set; } = string.Empty;
    }
}
