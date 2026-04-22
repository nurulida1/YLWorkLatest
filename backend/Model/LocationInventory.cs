namespace YLWorks.Model
{
    public class LocationInventory : BaseEntity
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
    }

    public class CreateLocationInventoryRequest
    {
        public string Name { get; set; }
    }

    public class UpdateLocationInventoryRequest : CreateLocationInventoryRequest
    {
        public Guid Id { get; set; }
    }
}