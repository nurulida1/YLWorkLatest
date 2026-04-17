namespace YLWorks.Model
{
    public enum CompanyType
    {
        Own = 1,
        Client = 2,
        Supplier = 3
    }

    public class Company : BaseEntity
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;

        public Guid? BillingAddressId { get; set; }
        public Address? BillingAddress { get; set; }

        public Guid? DeliveryAddressId { get; set; }
        public Address? DeliveryAddress { get; set; }

        public string? ContactNo { get; set; }
        public string? ContactPerson1 { get; set; }
        public string? ContactPerson2 { get; set; }
        public string? Email { get; set; }

        public string? FaxNo { get; set; }
        public string? ACNo { get; set; }
        public string? WebsiteUrl { get; set; }
        public string? TINNo { get; set; }
        public string? SSTRegNo { get; set; }
        public CompanyType Type { get; set; }
        public decimal BalancePayment { get; set; } = 0;
        public bool SameAsBillingAddress { get; set; }

        public bool IsActive { get; set; } = true;

        public string? LogoImage { get; set; }
    }

    public class CreateCompanyRequest
    {
        public string Name { get; set; } = string.Empty;

        public AddressRequest? BillingAddress { get; set; }
        public AddressRequest? DeliveryAddress { get; set; }

        public string? ContactNo { get; set; }
        public string? ContactPerson1 { get; set; }
        public string? ContactPerson2 { get; set; }
        public string? FaxNo { get; set; }
        public string? ACNo { get; set; }
        public string? Email { get; set; }
        public string? WebsiteUrl { get; set; }
        public string? TINNo { get; set; }
        public string? SSTRegNo { get; set; }
        public CompanyType Type { get; set; }
        public bool SameAsBillingAddress { get; set; }

        public string? LogoImage { get; set; }

    }

    public class UpdateCompanyRequest : CreateCompanyRequest
    {
        public Guid Id { get; set; }
      
    }
    public class CompanyDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string ContactNo { get; set; }
        public string ContactPerson1 { get; set; }
        public string ContactPerson2 { get; set; }
        public string FaxNo { get; set; }
        public string ACNo { get; set; }
        public string Email { get; set; }
        public string WebsiteUrl { get; set; }
        public CompanyType Type { get; set; }
        public bool IsActive { get; set; }
        public string LogoImage { get; set; }
        public string TINNo { get; set; }
        public string SSTRegNo { get; set; }
        public bool SameAsBillingAddress { get; set; }

        public AddressDto? BillingAddress { get; set; }
        public AddressDto? DeliveryAddress { get; set; }
    }

}