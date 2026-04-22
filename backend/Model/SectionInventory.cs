namespace YLWorks.Model
{
    public class SectionInventory : BaseEntity
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
    }

    public class CreateSectionInventoryRequest
    {
        public string Name { get; set; }
    }

    public class UpdateSectionInventoryRequest: CreateSectionInventoryRequest
    {
        public Guid Id { get; set; }
    }
}