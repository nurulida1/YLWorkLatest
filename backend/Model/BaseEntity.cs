using WebApplication1.Helpers;

namespace YLWorks.Model
{
    public abstract class BaseEntity
    {
        public DateTime? CreatedAt { get; set; } = DateTimeHelper.Now();
        public DateTime? UpdatedAt { get; set; }
        public Guid? CreatedById { get; set; }
        public Guid? UpdatedById { get; set; }
    }

    public class DropdownDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? DisplayName { get; set; }
        public string? ProjectTitle { get; set; }
        public string? ProjectCode { get; set; }
        public Guid? ClientId { get; set; }
        public string? JobTitle { get; set; }
        public string? Email { get; set; }
        public string? Brand { get; set; }
        public string? Model { get; set; }
        public decimal? Quantity { get; set; }
        public string? Unit { get; set; }
        public string? Status { get; set; }
        public string? Category { get; set; }
        public string? ItemCode { get; set; }
        public string? Attachment { get; set; }
    }

    public class PagedResponse<T>
    {
        public List<T> Data { get; set; }
        public int TotalElements { get; set; }
    }
}
