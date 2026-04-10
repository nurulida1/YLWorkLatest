namespace YLWorks.Model
{
    public class Address: BaseEntity
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string AddressLine1 { get; set; }
        public string? AddressLine2 { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public int Poscode { get; set; }

    }

    public class AddressRequest
    {
        public string Name { get; set; } // e.g. "Main Office" or "Branch A"
        public string AddressLine1 { get; set; }
        public string? AddressLine2 { get; set; }
        public string Country { get; set; }
        public string State { get; set; }
        public string City { get; set; } = string.Empty;
        public int Poscode { get; set; }
    }
}
