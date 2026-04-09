using System.ComponentModel.DataAnnotations.Schema;

namespace YLWorks.Model
{
    public class Client: BaseEntity
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string? ContactPerson { get; set; }
        public string? ContactNo { get; set; }
        public Guid? BillingAddressId { get; set; }
        [ForeignKey("BillingAddressId")]
        public virtual Address? BillingAddress { get; set; }

        // This ID points to the Address table for Delivery
        public Guid? DeliveryAddressId { get; set; }
        [ForeignKey("DeliveryAddressId")]
        public virtual Address? DeliveryAddress { get; set; }
        public string? Email { get; set; }
        public string Status { get; set; }
    }

    public class CreateClientRequest
    {
        public string Name { get; set; }
        public string? ContactPerson { get; set; }
        public string? ContactNo { get; set; }
        public string? Email { get; set; }

        // Structured addresses
        public AddressRequest BillingAddress { get; set; }
        public AddressRequest DeliveryAddress { get; set; }
    }

    public class UpdateClientRequest
    {
        public Guid Id { get; set; }
        public string? Name { get; set; }
        public string? ContactPerson { get; set; }
        public string? ContactNo { get; set; }
        public string? Email { get; set; }

        // Optional updates for addresses
        public AddressRequest? BillingAddress { get; set; }
        public AddressRequest? DeliveryAddress { get; set; }
    }
}
