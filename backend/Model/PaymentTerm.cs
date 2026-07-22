using System.ComponentModel.DataAnnotations;

namespace YLWorks.Model
{
    public class PaymentTerm : BaseEntity
    {
        public Guid Id { get; set; }
        public string? Name { get; set; }
    }

    public class CreatePaymentTermRequest
    {
        public string? Name { get; set; }
    }

    public class UpdatePaymentTermRequest
    {
        public Guid Id { get; set; }
        public string? Name { get; set; }
    }
}