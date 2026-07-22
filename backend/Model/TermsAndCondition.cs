using System.ComponentModel.DataAnnotations;

namespace YLWorks.Model
{
    public class TermsAndCondition : BaseEntity
    { 
        public Guid Id { get; set; }
        public string? Title { get; set; }
        public string? Description { get; set; }
    }

    public class CreateTermsAndConditionRequest
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
    }

    public class UpdateTermsAndConditionRequest
    {
        public Guid Id { get; set; }
        public string? Title { get; set; }
        public string? Description { get; set; }
    }

    public class TermItem
    {
        public string Title { get; set; }
        public string? Description { get; set; }
    }

    public class CreateTermsBulkRequest
    {
        public List<TermItem> Items { get; set; } = new();
    }
}