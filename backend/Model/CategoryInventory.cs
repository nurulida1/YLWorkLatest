namespace YLWorks.Model
{
    public class CategoryInventory : BaseEntity
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
    }

    public class CreateCategoryInventoryRequest
    {
        public string Name { get; set; }
    }

    public class UpdateCategoryInventoryRequest : CreateCategoryInventoryRequest
    {
        public Guid Id { get; set; }
    }

}