
using YLWorks.DTO;

namespace YLWorks.Services
{
	public interface IOfficeHandbookService
	{
		// Articles
		Task<List<OfficeHandbookDto>> GetHandbooksAsync(bool canManage);

		Task<OfficeHandbookDto?> GetHandbookByIdAsync(
			Guid id,
			bool canManage);

		Task<OfficeHandbookDto?> GetHandbookBySlugAsync(
			string slug,
			bool canManage);

		Task<OfficeHandbookDto> CreateHandbookAsync(
			CreateOfficeHandbookDto dto,
			string userId);

		Task<OfficeHandbookDto> UpdateHandbookAsync(
			Guid id,
			UpdateOfficeHandbookDto dto,
			string userId);

		Task<bool> ArchiveHandbookAsync(
			Guid id,
			string userId);

		// Categories
		Task<List<OfficeHandbookCategoryDto>> GetCategoriesAsync(
			bool canManage);

		Task<OfficeHandbookCategoryDto> CreateCategoryAsync(
			CreateOfficeHandbookCategoryDto dto);

		Task<OfficeHandbookCategoryDto> UpdateCategoryAsync(
			Guid id,
			UpdateOfficeHandbookCategoryDto dto);
	}
}
