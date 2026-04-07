namespace YLWorks.Model
{
    public class Income: BaseEntity
    {
        public Guid Id { get; set; }
        public string IncomeNo { get; set; }
        public string? ReferenceNo { get; set; }
        public decimal? Amount { get; set; }
        public DateTime IncomeDate { get; set; }
        public string PaymentMode { get; set; }
        public string? Description { get; set; }
    }

    public class CreateIncomeRequest
    {
        public string IncomeNo { set; get; }
        public string? ReferenceNo { set; get; } = null;
        public decimal? Amount { get; set; }
        public DateTime IncomeDate { get; set; }
        public string PaymentMode { get; set; }
        public string? Description { get; set; } = null;

    }
}
