
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;
using YLWorks.Data;
using YLWorks.DTO;
using YLWorks.Model;

namespace YLWorks.Services
{
    public class OfficeHandbookService : IOfficeHandbookService
    {
        private readonly AppDbContext _context;

        public OfficeHandbookService(AppDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // HELPER METHODS
        // =========================================================

        private string GenerateSlug(string value)
        {
            return Regex.Replace(
                value.Trim().ToLowerInvariant(),
                @"[^a-z0-9]+",
                "-"
            ).Trim('-');
        }

        private OfficeHandbookDto MapToDto(OfficeHandbook handbook)
        {
            return new OfficeHandbookDto
            {
                Id = handbook.Id,
                Title = handbook.Title,
                Slug = handbook.Slug,
                Content = handbook.Content,
                CategoryId = handbook.CategoryId,
                CategoryName = handbook.Category?.Name ?? string.Empty,
                AttachmentPath = handbook.AttachmentPath,
                AttachmentName = handbook.AttachmentName,
                IsPublished = handbook.IsPublished,
                PublishedAt = handbook.PublishedAt,
                IsArchived = handbook.IsArchived,
                CreatedBy = handbook.CreatedBy,
                CreatedAt = handbook.CreatedAt,
                UpdatedBy = handbook.UpdatedBy,
                UpdatedAt = handbook.UpdatedAt
            };
        }

        private async Task<bool> IsSlugExistsAsync(
            string slug,
            Guid? excludeId = null)
        {
            return await _context.OfficeHandbooks.AnyAsync(x =>
                x.Slug == slug &&
                (!excludeId.HasValue || x.Id != excludeId.Value));
        }

        private async Task<OfficeHandbookCategoryDto> MapCategoryToDtoAsync(
            OfficeHandbookCategory category)
        {
            var articleCount = await _context.OfficeHandbooks.CountAsync(x =>
                x.CategoryId == category.Id &&
                x.IsPublished &&
                !x.IsArchived);

            return new OfficeHandbookCategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                Description = category.Description,
                DisplayOrder = category.DisplayOrder,
                IsActive = category.IsActive,
                ArticleCount = articleCount
            };
        }

        // =========================================================
        // GET HANDBOOK ARTICLES
        // =========================================================

        public async Task<List<OfficeHandbookDto>> GetHandbooksAsync(
            bool canManage)
        {
            var query = _context.OfficeHandbooks
                .AsNoTracking()
                .Include(x => x.Category)
                .AsQueryable();

            if (!canManage)
            {
                query = query.Where(x =>
                    x.IsPublished && !x.IsArchived);
            }

            var handbooks = await query
                .OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt)
                .ToListAsync();

            return handbooks.Select(MapToDto).ToList();
        }

        // =========================================================
        // GET HANDBOOK BY ID
        // =========================================================

        public async Task<OfficeHandbookDto?> GetHandbookByIdAsync(
            Guid id,
            bool canManage)
        {
            var handbook = await _context.OfficeHandbooks
                .AsNoTracking()
                .Include(x => x.Category)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (handbook == null)
                return null;

            if (!canManage &&
                (!handbook.IsPublished || handbook.IsArchived))
            {
                return null;
            }

            return MapToDto(handbook);
        }

        // =========================================================
        // GET HANDBOOK BY SLUG
        // =========================================================

        public async Task<OfficeHandbookDto?> GetHandbookBySlugAsync(
            string slug,
            bool canManage)
        {
            var handbook = await _context.OfficeHandbooks
                .AsNoTracking()
                .Include(x => x.Category)
                .FirstOrDefaultAsync(x => x.Slug == slug);

            if (handbook == null)
                return null;

            if (!canManage &&
                (!handbook.IsPublished || handbook.IsArchived))
            {
                return null;
            }

            return MapToDto(handbook);
        }

        // =========================================================
        // CREATE HANDBOOK
        // =========================================================

        public async Task<OfficeHandbookDto> CreateHandbookAsync(
            CreateOfficeHandbookDto dto,
            string userId)
        {
            var category = await _context.OfficeHandbookCategories
                .FirstOrDefaultAsync(x =>
                    x.Id == dto.CategoryId && x.IsActive);

            if (category == null)
            {
                throw new InvalidOperationException(
                    "Invalid or inactive handbook category.");
            }

            var slug = GenerateSlug(
                string.IsNullOrWhiteSpace(dto.Slug)
                    ? dto.Title
                    : dto.Slug
            );

            if (string.IsNullOrWhiteSpace(slug))
            {
                throw new InvalidOperationException(
                    "A valid article slug is required.");
            }

            if (await IsSlugExistsAsync(slug))
            {
                throw new InvalidOperationException(
                    "An article with this slug already exists.");
            }

            var now = DateTime.UtcNow;

            var handbook = new OfficeHandbook
            {
                Id = Guid.NewGuid(),
                Title = dto.Title.Trim(),
                Slug = slug,
                Content = dto.Content,
                CategoryId = dto.CategoryId,
                IsPublished = dto.IsPublished,
                PublishedAt = dto.IsPublished ? now : null,
                IsArchived = false,
                CreatedBy = userId,
                CreatedAt = now
            };

            _context.OfficeHandbooks.Add(handbook);

            await _context.SaveChangesAsync();

            handbook.Category = category;

            return MapToDto(handbook);
        }

        // =========================================================
        // UPDATE HANDBOOK
        // =========================================================

        public async Task<OfficeHandbookDto> UpdateHandbookAsync(
            Guid id,
            UpdateOfficeHandbookDto dto,
            string userId)
        {
            var handbook = await _context.OfficeHandbooks
                .Include(x => x.Category)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (handbook == null)
            {
                throw new KeyNotFoundException(
                    "Handbook article not found.");
            }

            if (handbook.IsArchived)
            {
                throw new InvalidOperationException(
                    "Archived articles cannot be updated.");
            }

            var category = await _context.OfficeHandbookCategories
                .FirstOrDefaultAsync(x =>
                    x.Id == dto.CategoryId && x.IsActive);

            if (category == null)
            {
                throw new InvalidOperationException(
                    "Invalid or inactive handbook category.");
            }

            var slug = GenerateSlug(
                string.IsNullOrWhiteSpace(dto.Slug)
                    ? dto.Title
                    : dto.Slug
            );

            if (string.IsNullOrWhiteSpace(slug))
            {
                throw new InvalidOperationException(
                    "A valid article slug is required.");
            }

            if (await IsSlugExistsAsync(slug, id))
            {
                throw new InvalidOperationException(
                    "An article with this slug already exists.");
            }

            var now = DateTime.UtcNow;

            handbook.Title = dto.Title.Trim();
            handbook.Slug = slug;
            handbook.Content = dto.Content;
            handbook.CategoryId = dto.CategoryId;
            handbook.UpdatedBy = userId;
            handbook.UpdatedAt = now;

            if (dto.IsPublished && !handbook.IsPublished)
            {
                handbook.PublishedAt = now;
            }
            else if (!dto.IsPublished)
            {
                handbook.PublishedAt = null;
            }

            handbook.IsPublished = dto.IsPublished;
            handbook.Category = category;

            await _context.SaveChangesAsync();

            return MapToDto(handbook);
        }

        // =========================================================
        // ARCHIVE HANDBOOK
        // =========================================================

        public async Task<bool> ArchiveHandbookAsync(
            Guid id,
            string userId)
        {
            var handbook = await _context.OfficeHandbooks
                .FirstOrDefaultAsync(x => x.Id == id);

            if (handbook == null)
                return false;

            if (handbook.IsArchived)
                throw new InvalidOperationException(
                    "This article is already archived.");

            handbook.IsArchived = true;
            handbook.IsPublished = false;
            handbook.ArchivedAt = DateTime.UtcNow;
            handbook.ArchivedBy = userId;

            await _context.SaveChangesAsync();

            return true;
        }

        // =========================================================
        // GET CATEGORIES
        // =========================================================

        public async Task<List<OfficeHandbookCategoryDto>> GetCategoriesAsync(
            bool canManage)
        {
            var query = _context.OfficeHandbookCategories
                .AsNoTracking()
                .AsQueryable();

            if (!canManage)
            {
                query = query.Where(x => x.IsActive);
            }

            return await query
                .OrderBy(x => x.DisplayOrder)
                .Select(x => new OfficeHandbookCategoryDto
                {
                    Id = x.Id,
                    Name = x.Name,
                    Description = x.Description,
                    DisplayOrder = x.DisplayOrder,
                    IsActive = x.IsActive,
                    ArticleCount = x.Handbooks.Count(h =>
                        h.IsPublished && !h.IsArchived)
                })
                .ToListAsync();
        }

        // =========================================================
        // CREATE CATEGORY
        // =========================================================

        public async Task<OfficeHandbookCategoryDto> CreateCategoryAsync(
            CreateOfficeHandbookCategoryDto dto)
        {
            var categoryName = dto.Name.Trim();

            bool exists = await _context.OfficeHandbookCategories
                .AnyAsync(x =>
                    x.Name.ToLower() == categoryName.ToLower());

            if (exists)
            {
                throw new InvalidOperationException(
                    "This category already exists.");
            }

            var category = new OfficeHandbookCategory
            {
                Id = Guid.NewGuid(),
                Name = categoryName,
                Description = dto.Description,
                DisplayOrder = dto.DisplayOrder,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.OfficeHandbookCategories.Add(category);

            await _context.SaveChangesAsync();

            return new OfficeHandbookCategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                Description = category.Description,
                DisplayOrder = category.DisplayOrder,
                IsActive = category.IsActive,
                ArticleCount = 0
            };
        }

        // =========================================================
        // UPDATE CATEGORY
        // =========================================================

        public async Task<OfficeHandbookCategoryDto> UpdateCategoryAsync(
            Guid id,
            UpdateOfficeHandbookCategoryDto dto)
        {
            var category = await _context.OfficeHandbookCategories
                .FirstOrDefaultAsync(x => x.Id == id);

            if (category == null)
            {
                throw new KeyNotFoundException(
                    "Category not found.");
            }

            var categoryName = dto.Name.Trim();

            bool exists = await _context.OfficeHandbookCategories
                .AnyAsync(x =>
                    x.Id != id &&
                    x.Name.ToLower() == categoryName.ToLower());

            if (exists)
            {
                throw new InvalidOperationException(
                    "This category already exists.");
            }

            category.Name = categoryName;
            category.Description = dto.Description;
            category.DisplayOrder = dto.DisplayOrder;
            category.IsActive = dto.IsActive;
            category.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return await MapCategoryToDtoAsync(category);
        }
    }
}
