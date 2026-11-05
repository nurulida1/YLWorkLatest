
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using YLWorks.Data;
using YLWorks.Model;
using YLWorks.Hubs;
using System.Linq.Expressions;
using System.Security.Claims;
using WebApplication1.Helpers;

namespace YLWorks.Controller
{
    [Route("api/[controller]")]
    [ApiController]
    public class NoticeController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hubContext;

        public NoticeController(
            AppDbContext context,
            IHubContext<NotificationHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        // GET: api/Notice/GetMany
        [HttpGet("GetMany")]
        public async Task<ActionResult> GetMany(
            int page = 1,
            int pageSize = 10,
            string? filter = null,
            string? orderBy = null)
        {
            try
            {
                var query = _context.Notices
                    .AsNoTracking()
                    .AsQueryable();

                // Filter
                if (!string.IsNullOrEmpty(filter))
                {
                    var parameter = Expression.Parameter(
                        typeof(Notice),
                        "n"
                    );

                    Expression? finalExpression = null;

                    var orParts = filter.Split('|');

                    foreach (var orPart in orParts)
                    {
                        Expression? orExpression = null;

                        var andParts = orPart.Split(',');

                        foreach (var andPart in andParts)
                        {
                            bool isNotEqual = andPart.Contains("!=");

                            var kv = isNotEqual
                                ? andPart.Split("!=")
                                : andPart.Split('=');

                            if (kv.Length != 2)
                                continue;

                            var property = kv[0].Trim();
                            var valueStr = kv[1].Trim();

                            var propertyAccess =
                                Expression.PropertyOrField(
                                    parameter,
                                    property
                                );

                            Expression condition;

                            if (propertyAccess.Type == typeof(string))
                            {
                                var toLowerMethod =
                                    typeof(string).GetMethod(
                                        "ToLower",
                                        Type.EmptyTypes
                                    )!;

                                var propertyToLower =
                                    Expression.Call(
                                        propertyAccess,
                                        toLowerMethod
                                    );

                                var valueToLower =
                                    Expression.Constant(
                                        valueStr.ToLower()
                                    );

                                var containsMethod =
                                    typeof(string).GetMethod(
                                        "Contains",
                                        new[] { typeof(string) }
                                    )!;

                                var containsExpr =
                                    Expression.Call(
                                        propertyToLower,
                                        containsMethod,
                                        valueToLower
                                    );

                                condition = isNotEqual
                                    ? Expression.Not(containsExpr)
                                    : containsExpr;
                            }
                            else if (
                                propertyAccess.Type == typeof(Guid) ||
                                propertyAccess.Type == typeof(Guid?)
                            )
                            {
                                if (!Guid.TryParse(
                                    valueStr,
                                    out Guid guidValue))
                                    continue;

                                var guidConstant =
                                    Expression.Constant(guidValue);

                                condition =
                                    propertyAccess.Type == typeof(Guid?)
                                    ? Expression.Equal(
                                        propertyAccess,
                                        Expression.Convert(
                                            guidConstant,
                                            typeof(Guid?)
                                        )
                                    )
                                    : Expression.Equal(
                                        propertyAccess,
                                        guidConstant
                                    );
                            }
                            else
                            {
                                try
                                {
                                    var targetType =
                                        Nullable.GetUnderlyingType(
                                            propertyAccess.Type
                                        ) ?? propertyAccess.Type;

                                    var convertedValue =
                                        Convert.ChangeType(
                                            valueStr,
                                            targetType
                                        );

                                    var constant =
                                        Expression.Constant(
                                            convertedValue,
                                            targetType
                                        );

                                    condition =
                                        propertyAccess.Type != targetType
                                        ? Expression.Equal(
                                            propertyAccess,
                                            Expression.Convert(
                                                constant,
                                                propertyAccess.Type
                                            )
                                        )
                                        : Expression.Equal(
                                            propertyAccess,
                                            constant
                                        );
                                }
                                catch
                                {
                                    continue;
                                }
                            }

                            orExpression = orExpression == null
                                ? condition
                                : Expression.AndAlso(
                                    orExpression,
                                    condition
                                );
                        }

                        if (orExpression != null)
                        {
                            finalExpression = finalExpression == null
                                ? orExpression
                                : Expression.OrElse(
                                    finalExpression,
                                    orExpression
                                );
                        }
                    }

                    if (finalExpression != null)
                    {
                        var lambda =
                            Expression.Lambda<Func<Notice, bool>>(
                                finalExpression,
                                parameter
                            );

                        query = query.Where(lambda);
                    }
                }

                // Sorting
                if (!string.IsNullOrEmpty(orderBy))
                {
                    if (orderBy.ToLower().Contains("desc"))
                    {
                        query = query.OrderByDescending(q =>
                            EF.Property<object>(
                                q,
                                orderBy
                                    .Replace(" desc", "")
                                    .Trim()
                            )
                        );
                    }
                    else
                    {
                        query = query.OrderBy(q =>
                            EF.Property<object>(
                                q,
                                orderBy.Trim()
                            )
                        );
                    }
                }
                else
                {
                    query = query
                        .OrderByDescending(x => x.IsPinned)
                        .ThenByDescending(x => x.PublishDate);
                }

                var totalElements = await query.CountAsync();

                var items = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(x => new NoticeDto
                    {
                        Id = x.Id,
                        Title = x.Title,
                        Content = x.Content,
                        PublishDate = x.PublishDate,
                        ExpiryDate = x.ExpiryDate,
                        IsPinned = x.IsPinned,
                        IsActive = x.IsActive,
                        CreatedById = x.CreatedById,
                        CreatedByName = x.CreatedBy != null
                            ? x.CreatedBy.DisplayName ?? x.CreatedBy.FullName
                            : null
                    })
                    .ToListAsync();

                return Ok(new
                {
                    Data = items,
                    TotalElements = totalElements
                });
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    new
                    {
                        Error = "An unexpected error occurred.",
                        Detail = ex.Message
                    }
                );
            }
        }

        // GET: api/Notice/GetOne?id={id}
        [HttpGet("GetOne")]
        public async Task<IActionResult> GetOne(
            [FromQuery] Guid id)
        {
            var data = await _context.Notices
                .AsNoTracking()
                .Where(x => x.Id == id)
                .Select(x => new NoticeDto
                {
                    Id = x.Id,
                    Title = x.Title,
                    Content = x.Content,
                    PublishDate = x.PublishDate,
                    ExpiryDate = x.ExpiryDate,
                    IsPinned = x.IsPinned,
                    IsActive = x.IsActive,
                    CreatedById = x.CreatedById,
                    CreatedByName = x.CreatedBy != null
                        ? x.CreatedBy.DisplayName ?? x.CreatedBy.FullName
                        : null
                })
                .FirstOrDefaultAsync();

            if (data == null)
            {
                return NotFound(new
                {
                    Error = "Notice not found."
                });
            }

            return Ok(data);
        }

        // POST: api/Notice/Create
        [Authorize(Roles = "HR,SuperAdmin")]
        [HttpPost("Create")]
        public async Task<ActionResult> Create(
            [FromBody] CreateNoticeRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (string.IsNullOrWhiteSpace(request.Title))
            {
                return BadRequest(new
                {
                    Error = "Title is required."
                });
            }

            var userIdClaim =
                User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim) ||
                !Guid.TryParse(userIdClaim, out Guid currentUserId))
            {
                return Unauthorized(new
                {
                    Error = "Invalid user ID."
                });
            }

            try
            {
                var now = DateTimeHelper.Now();

                // Create announcement
                var notice = new Notice
                {
                    Id = Guid.NewGuid(),
                    Title = request.Title,
                    Content = request.Content,
                    PublishDate = request.PublishDate ?? now,
                    ExpiryDate = request.ExpiryDate,
                    IsPinned = request.IsPinned,
                    IsActive = true,
                    CreatedById = currentUserId,
                    CreatedAt = now
                };

                // Get active and approved employees
                // Exclude the user who created the announcement
                var recipients = await _context.Users
                    .AsNoTracking()
                    .Where(u =>
                        u.IsActive &&
                        u.Status == "Approved" &&
                        u.Id != currentUserId)
                    .Select(u => u.Id)
                    .ToListAsync();

                // Create individual notifications
                var notifications = recipients
                    .Select(userId => new Notification
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        Title = "New Announcement",
                        Message =
                            $"A new announcement has been published: {notice.Title}",
                        Type = "Announcement",
                        Link = "/announcements",
                        IsRead = false,
                        CreatedAt = now
                    })
                    .ToList();

                // Save notice and notifications together
                _context.Notices.Add(notice);

                if (notifications.Count > 0)
                {
                    _context.Notifications.AddRange(notifications);
                }

                await _context.SaveChangesAsync();

                // Send real-time notifications through SignalR
                foreach (var notification in notifications)
                {
                    try
                    {
                        await _hubContext.Clients
                            .Group($"user-{notification.UserId}")
                            .SendAsync("ReceiveNotification", new
                            {
                                id = notification.Id,
                                userId = notification.UserId,
                                title = notification.Title,
                                message = notification.Message,
                                type = notification.Type,
                                link = notification.Link,
                                isRead = notification.IsRead,
                                createdAt = notification.CreatedAt
                            });
                    }
                    catch
                    {
                        // Notification is already saved.
                        // The user can still retrieve it from the API.
                    }
                }

                return Ok(new
                {
                    Message = "Notice created successfully.",
                    Data = notice,
                    NotificationsSent = notifications.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    new
                    {
                        Error = "Failed to create notice.",
                        Detail = ex.Message,
                        InnerException = ex.InnerException?.Message
                    }
                );
            }
        }

        // PUT: api/Notice/Update
        [Authorize(Roles = "HR,SuperAdmin")]
        [HttpPut("Update")]
        public async Task<IActionResult> Update(
            [FromBody] UpdateNoticeRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var notice = await _context.Notices
                .FirstOrDefaultAsync(x => x.Id == request.Id);

            if (notice == null)
            {
                return NotFound(new
                {
                    Error = "Notice not found."
                });
            }

            try
            {
                notice.Title = request.Title;
                notice.Content = request.Content;
                notice.PublishDate =
                    request.PublishDate ?? notice.PublishDate;
                notice.ExpiryDate = request.ExpiryDate;
                notice.IsPinned = request.IsPinned;
                notice.IsActive = request.IsActive;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    Message = "Notice updated successfully."
                });
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    new
                    {
                        Error = "Failed to update notice.",
                        Detail = ex.Message
                    }
                );
            }
        }

        // DELETE: api/Notice/Delete?id={id}
        [Authorize(Roles = "HR,SuperAdmin")]
        [HttpDelete("Delete")]
        public async Task<ActionResult> Delete(
            [FromQuery] Guid id)
        {
            var notice = await _context.Notices
                .FirstOrDefaultAsync(x => x.Id == id);

            if (notice == null)
            {
                return NotFound(new
                {
                    Error = "Notice not found."
                });
            }

            try
            {
                _context.Notices.Remove(notice);

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    Message = "Notice deleted successfully."
                });
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    new
                    {
                        Error = "Failed to delete notice.",
                        Detail = ex.Message
                    }
                );
            }
        }

        // PUT: api/Notice/ToggleStatus?id={id}
        [Authorize(Roles = "HR,SuperAdmin")]
        [HttpPut("ToggleStatus")]
        public async Task<IActionResult> ToggleStatus(
            [FromQuery] Guid id)
        {
            var notice = await _context.Notices
                .FirstOrDefaultAsync(x => x.Id == id);

            if (notice == null)
            {
                return NotFound(new
                {
                    Error = "Notice not found."
                });
            }

            notice.IsActive = !notice.IsActive;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Notice status updated successfully.",
                IsActive = notice.IsActive
            });
        }

        // PUT: api/Notice/TogglePin?id={id}
        [Authorize(Roles = "HR,SuperAdmin")]
        [HttpPut("TogglePin")]
        public async Task<IActionResult> TogglePin(
            [FromQuery] Guid id)
        {
            var notice = await _context.Notices
                .FirstOrDefaultAsync(x => x.Id == id);

            if (notice == null)
            {
                return NotFound(new
                {
                    Error = "Notice not found."
                });
            }

            notice.IsPinned = !notice.IsPinned;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Notice pin status updated successfully.",
                IsPinned = notice.IsPinned
            });
        }
    }
}
