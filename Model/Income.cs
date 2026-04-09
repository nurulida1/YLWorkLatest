namespace YLWorks.Model
{
    public class Income: BaseEntity
    {
        public Guid Id { get; set; }
        public string IncomeNo { get; set; }
        public decimal? Amount { get; set; }
        public DateTime IncomeDate { get; set; }
        public string PaymentMode { get; set; }
        public string? Description { get; set; }
    }

    public class CreateIncomeRequest
    {
        public decimal? Amount { get; set; }
        public DateTime IncomeDate { get; set; }
        public string PaymentMode { get; set; }
        public string? Description { get; set; } = null;

    }
}
