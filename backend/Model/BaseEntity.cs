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
        public string Name { get; set; } = string.Empty;
    }
}
