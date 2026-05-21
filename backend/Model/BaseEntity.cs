namespace YLWorks.Model
{
    public abstract class BaseEntity
    {
        public DateTime? CreatedAt { get; set; } = DateTime.Now;
        public DateTime? UpdatedAt { get; set; }
        public Guid? CreatedById { get; set; }
        public Guid? UpdatedById { get; set; }
    }

    public class DropdownDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? ProjectTitle { get; set; }
        public string? ProjectCode { get; set; }
        public Guid? ClientId { get; set; }
    }

    public class PagedResponse<T>
    {
        public List<T> Data { get; set; }
        public int TotalElements { get; set; }
    }
}
