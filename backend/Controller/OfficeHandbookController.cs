using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using YLWorks.Data;
using YLWorks.Model;
using YLWorks.DTO;

namespace YLWorks.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class OfficeHandbookController : ControllerBase
    {
        private readonly AppDbContext _context;

        public OfficeHandbookController(AppDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // HELPER METHODS
        // =========================================================

        private string GetCurrentUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        }

        private bool CanManageHandbook()
        {
            // Adjust these role names to match your ASP.NET Identity roles.
            return User.IsInRole("SuperAdmin") || User.IsInRole("HR");
        }

        private string GenerateSlug(string title)
        {
            return System.Text.RegularExpressions.Regex
                .Replace(title.Trim().ToLowerInvariant(), @"[^a-z0-9]+", "-")
                .Trim('-');
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

        // =========================================================
        // HANDBOOK ARTICLES
        // =========================================================

        // GET: api/OfficeHandbook
        // Employees see published articles.
        // HR/Admin can also see drafts and archived articles.
        [HttpGet]
        public async Task<IActionResult> GetHandbooks()
        {
            bool canManage = CanManageHandbook();

            var query = _context.OfficeHandbooks
                .Include(x => x.Category)
                .AsQueryable();

            if (!canManage)
            {
                query = query.Where(x =>
                    x.IsPublished && !x.IsArchived);
            }

            var handbooks = await query
                .OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt)
                .Select(x => new OfficeHandbookDto
                {
                    Id = x.Id,
                    Title = x.Title,
                    Slug = x.Slug,
                    Content = x.Content,
                    CategoryId = x.CategoryId,
                    CategoryName = x.Category != null
                        ? x.Category.Name
                        : string.Empty,
                    AttachmentPath = x.AttachmentPath,
                    AttachmentName = x.AttachmentName,
                    IsPublished = x.IsPublished,
                    PublishedAt = x.PublishedAt,
                    IsArchived = x.IsArchived,
                    CreatedBy = x.CreatedBy,
                    CreatedAt = x.CreatedAt,
                    UpdatedBy = x.UpdatedBy,
                    UpdatedAt = x.UpdatedAt
                })
                .ToListAsync();

            return Ok(handbooks);
        }

        // GET: api/OfficeHandbook/{id}
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetHandbookById(Guid id)
        {
            var handbook = await _context.OfficeHandbooks
                .Include(x => x.Category)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (handbook == null)
                return NotFound(new { message = "Handbook article not found." });

            if (!CanManageHandbook() &&
                (!handbook.IsPublished || handbook.IsArchived))
            {
                return NotFound(new { message = "Handbook article not found." });
            }

            return Ok(MapToDto(handbook));
        }

        // GET: api/OfficeHandbook/slug/{slug}
        [HttpGet("slug/{slug}")]
        public async Task<IActionResult> GetHandbookBySlug(string slug)
        {
            var handbook = await _context.OfficeHandbooks
                .Include(x => x.Category)
                .FirstOrDefaultAsync(x => x.Slug == slug);

            if (handbook == null)
                return NotFound(new { message = "Handbook article not found." });

            if (!CanManageHandbook() &&
                (!handbook.IsPublished || handbook.IsArchived))
            {
                return NotFound(new { message = "Handbook article not found." });
            }

            return Ok(MapToDto(handbook));
        }

        // POST: api/OfficeHandbook
        [HttpPost]
        public async Task<IActionResult> CreateHandbook(
            [FromBody] CreateOfficeHandbookDto dto)
        {
            if (!CanManageHandbook())
                return Forbid();

            var userId = GetCurrentUserId();

            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized();

            var category = await _context.OfficeHandbookCategories
                .FirstOrDefaultAsync(x =>
                    x.Id == dto.CategoryId && x.IsActive);

            if (category == null)
            {
                return BadRequest(new
                {
                    message = "Invalid or inactive handbook category."
                });
            }

            var slug = string.IsNullOrWhiteSpace(dto.Slug)
                ? GenerateSlug(dto.Title)
                : GenerateSlug(dto.Slug);

            bool slugExists = await _context.OfficeHandbooks
                .AnyAsync(x => x.Slug == slug);

            if (slugExists)
            {
                return Conflict(new
                {
                    message = "An article with this slug already exists."
                });
            }

            var handbook = new OfficeHandbook
            {
                Id = Guid.NewGuid(),
                Title = dto.Title.Trim(),
                Slug = slug,
                Content = dto.Content,
                CategoryId = dto.CategoryId,
                IsPublished = dto.IsPublished,
                PublishedAt = dto.IsPublished
                    ? DateTime.UtcNow
                    : null,
                IsArchived = false,
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.OfficeHandbooks.Add(handbook);

            await _context.SaveChangesAsync();

            await _context.Entry(handbook)
                .Reference(x => x.Category)
                .LoadAsync();

            return CreatedAtAction(
                nameof(GetHandbookById),
                new { id = handbook.Id },
                MapToDto(handbook));
        }

        // PUT: api/OfficeHandbook/{id}
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> UpdateHandbook(
            Guid id,
            [FromBody] UpdateOfficeHandbookDto dto)
        {
            if (!CanManageHandbook())
                return Forbid();

            var handbook = await _context.OfficeHandbooks
                .FirstOrDefaultAsync(x => x.Id == id);

            if (handbook == null)
                return NotFound(new { message = "Handbook article not found." });

            if (handbook.IsArchived)
            {
                return BadRequest(new
                {
                    message = "Archived articles cannot be updated."
                });
            }

            var category = await _context.OfficeHandbookCategories
                .FirstOrDefaultAsync(x =>
                    x.Id == dto.CategoryId && x.IsActive);

            if (category == null)
            {
                return BadRequest(new
                {
                    message = "Invalid or inactive handbook category."
                });
            }

            var slug = string.IsNullOrWhiteSpace(dto.Slug)
                ? GenerateSlug(dto.Title)
                : GenerateSlug(dto.Slug);

            bool slugExists = await _context.OfficeHandbooks
                .AnyAsync(x => x.Slug == slug && x.Id != id);

            if (slugExists)
            {
                return Conflict(new
                {
                    message = "An article with this slug already exists."
                });
            }

            handbook.Title = dto.Title.Trim();
            handbook.Slug = slug;
            handbook.Content = dto.Content;
            handbook.CategoryId = dto.CategoryId;
            handbook.UpdatedBy = GetCurrentUserId();
            handbook.UpdatedAt = DateTime.UtcNow;

            if (dto.IsPublished && !handbook.IsPublished)
            {
                handbook.PublishedAt = DateTime.UtcNow;
            }
            else if (!dto.IsPublished)
            {
                handbook.PublishedAt = null;
            }

            handbook.IsPublished = dto.IsPublished;

            await _context.SaveChangesAsync();

            await _context.Entry(handbook)
                .Reference(x => x.Category)
                .LoadAsync();

            return Ok(MapToDto(handbook));
        }

        // DELETE: api/OfficeHandbook/{id}
        // Soft delete: archive the article.
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> ArchiveHandbook(Guid id)
        {
            if (!CanManageHandbook())
                return Forbid();

            var handbook = await _context.OfficeHandbooks
                .FirstOrDefaultAsync(x => x.Id == id);

            if (handbook == null)
                return NotFound(new { message = "Handbook article not found." });

            if (handbook.IsArchived)
            {
                return BadRequest(new
                {
                    message = "This article is already archived."
                });
            }

            handbook.IsArchived = true;
            handbook.IsPublished = false;
            handbook.ArchivedAt = DateTime.UtcNow;
            handbook.ArchivedBy = GetCurrentUserId();

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Handbook article archived successfully."
            });
        }

        // =========================================================
        // HANDBOOK CATEGORIES
        // =========================================================

        // GET: api/OfficeHandbook/categories
        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories()
        {
            bool canManage = CanManageHandbook();

            var query = _context.OfficeHandbookCategories
                .AsQueryable();

            if (!canManage)
            {
                query = query.Where(x => x.IsActive);
            }

            var categories = await query
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

            return Ok(categories);
        }

        // POST: api/OfficeHandbook/categories
        [HttpPost("categories")]
        public async Task<IActionResult> CreateCategory(
            [FromBody] CreateOfficeHandbookCategoryDto dto)
        {
            if (!CanManageHandbook())
                return Forbid();

            var categoryName = dto.Name.Trim();

            bool exists = await _context.OfficeHandbookCategories
                .AnyAsync(x => x.Name.ToLower() == categoryName.ToLower());

            if (exists)
            {
                return Conflict(new
                {
                    message = "This category already exists."
                });
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

            return Ok(new OfficeHandbookCategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                Description = category.Description,
                DisplayOrder = category.DisplayOrder,
                IsActive = category.IsActive,
                ArticleCount = 0
            });
        }

        // PUT: api/OfficeHandbook/categories/{id}
        [HttpPut("categories/{id:guid}")]
        public async Task<IActionResult> UpdateCategory(
            Guid id,
            [FromBody] UpdateOfficeHandbookCategoryDto dto)
        {
            if (!CanManageHandbook())
                return Forbid();

            var category = await _context.OfficeHandbookCategories
                .FirstOrDefaultAsync(x => x.Id == id);

            if (category == null)
                return NotFound(new { message = "Category not found." });

            var categoryName = dto.Name.Trim();

            bool exists = await _context.OfficeHandbookCategories
                .AnyAsync(x =>
                    x.Id != id &&
                    x.Name.ToLower() == categoryName.ToLower());

            if (exists)
            {
                return Conflict(new
                {
                    message = "This category already exists."
                });
            }

            category.Name = categoryName;
            category.Description = dto.Description;
            category.DisplayOrder = dto.DisplayOrder;
            category.IsActive = dto.IsActive;
            category.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new OfficeHandbookCategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                Description = category.Description,
                DisplayOrder = category.DisplayOrder,
                IsActive = category.IsActive,
                ArticleCount = await _context.OfficeHandbooks.CountAsync(x =>
                    x.CategoryId == category.Id &&
                    x.IsPublished &&
                    !x.IsArchived)
            });
        }

        // ==========================================
        // RESTORE ARCHIVED HANDBOOK
        // ==========================================

        [HttpPut("{id:guid}/restore")]
        public async Task<IActionResult> RestoreHandbook(Guid id)
        {
            if (!CanManageHandbook())
            {
                return Forbid();
            }

            var article = await _context.OfficeHandbooks
                .FirstOrDefaultAsync(x => x.Id == id);

            if (article == null)
            {
                return NotFound(new
                {
                    message = "Handbook article not found."
                });
            }

            if (!article.IsArchived)
            {
                return BadRequest(new
                {
                    message = "This article is not archived."
                });
            }

            article.IsArchived = false;
            article.IsPublished = false;
            article.ArchivedAt = null;
            article.ArchivedBy = null;

            article.UpdatedAt = DateTime.UtcNow;
            article.UpdatedBy = GetCurrentUserId();

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Handbook article restored successfully."
            });
        }
    }
}