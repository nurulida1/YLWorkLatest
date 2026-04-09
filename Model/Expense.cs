namespace YLWorks.Model
{
    public class Expense : BaseEntity
    {
        public Guid Id { get; set; }
        public string ExpenseNo { get; set; }
        public decimal? Amount { get; set; }
        public DateTime ExpenseDate { get; set; }
        public string PaymentMode { get; set; }
        public string? Description { get; set; }
    }

    public class CreateExpenseRequest
    {
        public decimal? Amount { get; set; }
        public DateTime ExpenseDate { get; set; }
        public string PaymentMode { get; set; }
        public string? Description { get; set; } = null;

    }
}
