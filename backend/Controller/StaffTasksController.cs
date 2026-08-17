using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Linq.Expressions;
using YLWorks.Data;
using YLWorks.Hubs;
using YLWorks.Model;
using System.Security.Claims;
using WebApplication1.Helpers;
using System.Reflection;

namespace YLWorks.Controller
{
    [Route("api/[controller]")]
    [ApiController]
    public class StaffTaskController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hub;

        public StaffTaskController(AppDbContext context, IHubContext<NotificationHub> hub)
        {
            _context = context;
            _hub = hub;

        }

        [HttpGet("GetMany")]
        public async Task<ActionResult> GetMany(
            int page = 1,
            int pageSize = 10,
            string? filter = null,
            string? orderBy = null,
            string? includes = null)
        {
            try
            {
                // =========================================================
                // GET CURRENT USER
                // =========================================================

                var userIdClaim =
                    User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdClaim))
                {
                    return Unauthorized(new
                    {
                        Error = "Invalid token."
                    });
                }

                if (!Guid.TryParse(userIdClaim, out Guid currentUserId))
                {
                    return Unauthorized(new
                    {
                        Error = "Invalid user ID."
                    });
                }


                // =========================================================
                // PAGINATION VALIDATION
                // =========================================================

                page = page < 1 ? 1 : page;

                pageSize = pageSize switch
                {
                    <= 0 => 10,
                    > 100 => 100,
                    _ => pageSize
                };


                // =========================================================
                // BASE QUERY
                // =========================================================

                var query = _context.StaffTasks
                    .AsNoTracking()
                    .Where(t =>
                        t.AssignedById == currentUserId ||
                        t.AssignedToId == currentUserId
                    )
                    .AsQueryable();


                // =========================================================
                // FILTER
                //
                // Example:
                //
                // Status=Todo
                //
                // Status=Todo,Priority=High
                //
                // Status=Todo|Status=InProgress
                //
                // =========================================================

                if (!string.IsNullOrWhiteSpace(filter))
                {
                    var parameter =
                        Expression.Parameter(
                            typeof(StaffTask),
                            "t"
                        );

                    Expression? finalExpression = null;

                    var orParts = filter.Split(
                        '|',
                        StringSplitOptions.RemoveEmptyEntries
                    );

                    foreach (var orPart in orParts)
                    {
                        Expression? orExpression = null;

                        var andParts = orPart.Split(
                            ',',
                            StringSplitOptions.RemoveEmptyEntries
                        );

                        foreach (var andPart in andParts)
                        {
                            bool isNotEqual =
                                andPart.Contains("!=");

                            var kv = isNotEqual
                                ? andPart.Split(
                                    new[] { "!=" },
                                    StringSplitOptions.None
                                )
                                : andPart.Split(
                                    new[] { '=' },
                                    StringSplitOptions.None
                                );

                            if (kv.Length != 2)
                                continue;

                            var propertyName = kv[0].Trim();
                            var valueStr = kv[1].Trim();

                            // ---------------------------------------------
                            // Validate property
                            // ---------------------------------------------

                            var propertyInfo =
                                typeof(StaffTask).GetProperty(
                                    propertyName,
                                    BindingFlags.Public |
                                    BindingFlags.Instance |
                                    BindingFlags.IgnoreCase
                                );

                            if (propertyInfo == null)
                                continue;

                            var propertyAccess =
                                Expression.Property(
                                    parameter,
                                    propertyInfo
                                );

                            var propertyType =
                                Nullable.GetUnderlyingType(
                                    propertyInfo.PropertyType
                                ) ?? propertyInfo.PropertyType;

                            Expression condition;


                            // ---------------------------------------------
                            // STRING
                            // ---------------------------------------------

                            if (propertyType == typeof(string))
                            {
                                var toLowerMethod =
                                    typeof(string).GetMethod(
                                        nameof(string.ToLower),
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
                                        nameof(string.Contains),
                                        new[] { typeof(string) }
                                    )!;

                                var containsExpression =
                                    Expression.Call(
                                        propertyToLower,
                                        containsMethod,
                                        valueToLower
                                    );

                                condition = isNotEqual
                                    ? Expression.Not(
                                        containsExpression
                                    )
                                    : containsExpression;
                            }


                            // ---------------------------------------------
                            // GUID
                            // ---------------------------------------------

                            else if (propertyType == typeof(Guid))
                            {
                                if (!Guid.TryParse(
                                    valueStr,
                                    out var guidValue))
                                {
                                    continue;
                                }

                                var guidConstant =
                                    Expression.Constant(
                                        guidValue,
                                        propertyType
                                    );

                                Expression guidExpression;

                                if (propertyInfo.PropertyType ==
                                    typeof(Guid?))
                                {
                                    guidExpression =
                                        Expression.Equal(
                                            propertyAccess,
                                            Expression.Convert(
                                                guidConstant,
                                                propertyInfo.PropertyType
                                            )
                                        );
                                }
                                else
                                {
                                    guidExpression =
                                        Expression.Equal(
                                            propertyAccess,
                                            guidConstant
                                        );
                                }

                                condition = isNotEqual
                                    ? Expression.Not(guidExpression)
                                    : guidExpression;
                            }


                            // ---------------------------------------------
                            // ENUM
                            // ---------------------------------------------

                            else if (propertyType.IsEnum)
                            {
                                if (!Enum.TryParse(
                                    propertyType,
                                    valueStr,
                                    true,
                                    out var enumValue))
                                {
                                    continue;
                                }

                                var enumConstant =
                                    Expression.Constant(
                                        enumValue,
                                        propertyType
                                    );

                                var enumExpression =
                                    Expression.Equal(
                                        propertyAccess,
                                        enumConstant
                                    );

                                condition = isNotEqual
                                    ? Expression.Not(enumExpression)
                                    : enumExpression;
                            }


                            // ---------------------------------------------
                            // DATE
                            // ---------------------------------------------

                            else if (propertyType == typeof(DateTime))
                            {
                                if (!DateTime.TryParse(
                                    valueStr,
                                    out var dateValue))
                                {
                                    continue;
                                }

                                var dateConstant =
                                    Expression.Constant(
                                        dateValue,
                                        propertyType
                                    );

                                Expression dateExpression;

                                if (propertyInfo.PropertyType ==
                                    typeof(DateTime?))
                                {
                                    dateExpression =
                                        Expression.Equal(
                                            propertyAccess,
                                            Expression.Convert(
                                                dateConstant,
                                                propertyInfo.PropertyType
                                            )
                                        );
                                }
                                else
                                {
                                    dateExpression =
                                        Expression.Equal(
                                            propertyAccess,
                                            dateConstant
                                        );
                                }

                                condition = isNotEqual
                                    ? Expression.Not(dateExpression)
                                    : dateExpression;
                            }


                            // ---------------------------------------------
                            // BOOLEAN
                            // ---------------------------------------------

                            else if (propertyType == typeof(bool))
                            {
                                if (!bool.TryParse(
                                    valueStr,
                                    out var boolValue))
                                {
                                    continue;
                                }

                                var boolConstant =
                                    Expression.Constant(
                                        boolValue,
                                        propertyType
                                    );

                                var boolExpression =
                                    Expression.Equal(
                                        propertyAccess,
                                        boolConstant
                                    );

                                condition = isNotEqual
                                    ? Expression.Not(boolExpression)
                                    : boolExpression;
                            }


                            // ---------------------------------------------
                            // DECIMAL / INT / OTHER
                            // ---------------------------------------------

                            else
                            {
                                try
                                {
                                    var convertedValue =
                                        Convert.ChangeType(
                                            valueStr,
                                            propertyType
                                        );

                                    var valueConstant =
                                        Expression.Constant(
                                            convertedValue,
                                            propertyType
                                        );

                                    var equalExpression =
                                        Expression.Equal(
                                            propertyAccess,
                                            valueConstant
                                        );

                                    condition = isNotEqual
                                        ? Expression.Not(
                                            equalExpression
                                        )
                                        : equalExpression;
                                }
                                catch
                                {
                                    continue;
                                }
                            }


                            // ---------------------------------------------
                            // AND
                            // ---------------------------------------------

                            orExpression =
                                orExpression == null
                                    ? condition
                                    : Expression.AndAlso(
                                        orExpression,
                                        condition
                                    );
                        }


                        // ---------------------------------------------
                        // OR
                        // ---------------------------------------------

                        if (orExpression != null)
                        {
                            finalExpression =
                                finalExpression == null
                                    ? orExpression
                                    : Expression.OrElse(
                                        finalExpression,
                                        orExpression
                                    );
                        }
                    }


                    // ---------------------------------------------
                    // APPLY FILTER
                    // ---------------------------------------------

                    if (finalExpression != null)
                    {
                        var lambda =
                            Expression.Lambda<Func<StaffTask, bool>>(
                                finalExpression,
                                parameter
                            );

                        query = query.Where(lambda);
                    }
                }


                // =========================================================
                // SORTING
                // =========================================================

                if (!string.IsNullOrWhiteSpace(orderBy))
                {
                    var orderParts = orderBy.Trim().Split(
                        ' ',
                        StringSplitOptions.RemoveEmptyEntries
                    );

                    var propertyName = orderParts[0];

                    var propertyInfo =
                        typeof(StaffTask).GetProperty(
                            propertyName,
                            BindingFlags.Public |
                            BindingFlags.Instance |
                            BindingFlags.IgnoreCase
                        );

                    if (propertyInfo != null)
                    {
                        var isDescending =
                            orderParts.Length > 1 &&
                            orderParts[1].Equals(
                                "desc",
                                StringComparison.OrdinalIgnoreCase
                            );

                        query = isDescending
                            ? query.OrderByDescending(
                                q => EF.Property<object>(
                                    q,
                                    propertyInfo.Name
                                )
                            )
                            : query.OrderBy(
                                q => EF.Property<object>(
                                    q,
                                    propertyInfo.Name
                                )
                            );
                    }
                }
                else
                {
                    // Default:
                    // incomplete tasks first,
                    // then earliest due date.

                    query = query
                        .OrderBy(t =>
                            t.Status == "Completed" ||
                            t.Status == "Cancelled")
                        .ThenBy(t => t.DueDate);
                }


                // =========================================================
                // TOTAL
                // =========================================================

                var totalElements =
                    await query.CountAsync();


                // =========================================================
                // DATA
                // =========================================================

                var items = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(t => new
                    {
                        // -------------------------------------------------
                        // Basic
                        // -------------------------------------------------

                        t.Id,

                        t.Title,

                        t.Description,


                        // -------------------------------------------------
                        // Assignment
                        // -------------------------------------------------
                        t.AssignedToId,
                        AssignedTo =
                            t.AssignedTo == null
                                ? null
                                : new
                                {
                                    t.AssignedTo.Id,
                                    t.AssignedTo.FullName
                                },
                        t.AssignedById,
                        AssignedBy =
                            t.AssignedBy == null
                                ? null
                                : new
                                {
                                    t.AssignedBy.Id,
                                    t.AssignedBy.FullName
                                },


                        // -------------------------------------------------
                        // Task
                        // -------------------------------------------------

                        t.Priority,

                        t.Category,

                        t.Status,


                        // -------------------------------------------------
                        // Dates
                        // -------------------------------------------------

                        t.StartDate,

                        t.DueDate,

                        t.ReminderAt,


                        // -------------------------------------------------
                        // Recurring
                        // -------------------------------------------------

                        t.IsRecurring,

                        t.RecurringType,


                        // -------------------------------------------------
                        // Time
                        // -------------------------------------------------

                        t.EstimatedHours,

                        t.ActualHours,


                        // -------------------------------------------------
                        // Completion
                        // -------------------------------------------------

                        t.CompletedAt,

                        CompletedBy =
                            t.CompletedBy == null
                                ? null
                                : new
                                {
                                    t.CompletedBy.Id,
                                    t.CompletedBy.FullName
                                },


                        // -------------------------------------------------
                        // Checklist
                        // -------------------------------------------------

                        Checklists = t.Checklists
                            .OrderBy(c => c.Sequence)
                            .Select(c => new
                            {
                                c.Id,

                                c.StaffTaskId,

                                c.Title,

                                c.IsCompleted,

                                c.CompletedAt,

                                c.Sequence
                            })
                            .ToList(),

                        ChecklistTotal =
                            t.Checklists.Count(),

                        ChecklistCompleted =
                            t.Checklists.Count(
                                c => c.IsCompleted
                            )
                    })
                    .ToListAsync();


                // =========================================================
                // RESPONSE
                // =========================================================

                return Ok(new
                {
                    Data = items,

                    TotalElements = totalElements,

                    Page = page,

                    PageSize = pageSize,

                    TotalPages =
                        (int)Math.Ceiling(
                            totalElements /
                            (double)pageSize
                        )
                });
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    new
                    {
                        Error =
                            "An unexpected error occurred.",

                        Detail = ex.Message
                    }
                );
            }
        }

        [HttpGet("GetOne")]
        public async Task<IActionResult> GetOne([FromQuery] Guid id)
        {
            try
            {
                // =========================================================
                // GET CURRENT USER
                // =========================================================

                var userIdClaim =
                    User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdClaim))
                {
                    return Unauthorized(new
                    {
                        Error = "Invalid token."
                    });
                }

                if (!Guid.TryParse(userIdClaim, out Guid currentUserId))
                {
                    return Unauthorized(new
                    {
                        Error = "Invalid user ID."
                    });
                }


                // =========================================================
                // GET TASK
                // =========================================================

                var data = await _context.StaffTasks
                    .AsNoTracking()
                    .Where(x =>
                        x.Id == id &&
                        (
                            x.AssignedById == currentUserId ||
                            x.AssignedToId == currentUserId
                        )
                    )
                    .Select(x => new
                    {
                        // =================================================
                        // BASIC
                        // =================================================

                        x.Id,

                        x.Title,

                        x.Description,


                        // =================================================
                        // ASSIGNMENT
                        // =================================================

                        x.AssignedById,

                        AssignedBy = x.AssignedBy == null
                            ? null
                            : new
                            {
                                x.AssignedBy.Id,
                                x.AssignedBy.FullName,
                                x.AssignedBy.DisplayName,
                                x.AssignedBy.Email
                            },


                        x.AssignedToId,

                        AssignedTo = x.AssignedTo == null
                            ? null
                            : new
                            {
                                x.AssignedTo.Id,
                                x.AssignedTo.FullName,
                                x.AssignedTo.DisplayName,
                                x.AssignedTo.Email
                            },


                        // =================================================
                        // TASK DETAILS
                        // =================================================

                        x.Priority,

                        x.Category,

                        x.Status,


                        // =================================================
                        // DATE / TIME
                        // =================================================

                        x.StartDate,

                        x.DueDate,

                        x.ReminderAt,


                        // =================================================
                        // RECURRING
                        // =================================================

                        x.IsRecurring,

                        x.RecurringType,


                        // =================================================
                        // TIME TRACKING
                        // =================================================

                        x.EstimatedHours,

                        x.ActualHours,


                        // =================================================
                        // COMPLETION
                        // =================================================

                        x.CompletedAt,

                        x.CompletedById,

                        CompletedBy = x.CompletedBy == null
                            ? null
                            : new
                            {
                                x.CompletedBy.Id,
                                x.CompletedBy.FullName,
                                x.CompletedBy.DisplayName,
                                x.CompletedBy.Email
                            },


                        // =================================================
                        // CHECKLIST
                        // =================================================

                        Checklists = x.Checklists
                            .OrderBy(c => c.Sequence)
                            .Select(c => new
                            {
                                c.Id,

                                c.StaffTaskId,

                                c.Title,

                                c.IsCompleted,

                                c.CompletedAt,

                                c.Sequence
                            })
                            .ToList(),

                        ChecklistTotal =
                            x.Checklists.Count(),

                        ChecklistCompleted =
                            x.Checklists.Count(
                                c => c.IsCompleted
                            )
                    })
                    .FirstOrDefaultAsync();


                // =========================================================
                // NOT FOUND
                // =========================================================

                if (data == null)
                {
                    return NotFound(new
                    {
                        Error = "Task not found."
                    });
                }


                // =========================================================
                // RESPONSE
                // =========================================================

                return Ok(data);
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    new
                    {
                        Error =
                            "An unexpected error occurred.",

                        Detail = ex.Message
                    }
                );
            }
        }

        [HttpPost("Create")]
        public async Task<ActionResult> AddTask(
    [FromBody] CreateStaffTaskRequest request)
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

            if (string.IsNullOrEmpty(userIdClaim))
            {
                return Unauthorized(new
                {
                    Error = "Invalid token."
                });
            }

            if (!Guid.TryParse(userIdClaim, out Guid currentUserId))
            {
                return Unauthorized(new
                {
                    Error = "Invalid user ID."
                });
            }

            try
            {
                // =========================================================
                // ASSIGN TO
                //
                // If AssignedToId is null:
                //     Create personal task
                //     AssignedTo = current user
                //
                // Otherwise:
                //     Assign task to selected staff
                // =========================================================

                var assignedToId =
                    request.AssignedToId ?? currentUserId;


                // =========================================================
                // VALIDATE ASSIGNED USER
                // =========================================================

                var assignedUserExists =
                    await _context.Users
                        .AnyAsync(x => x.Id == assignedToId);

                if (!assignedUserExists)
                {
                    return BadRequest(new
                    {
                        Error = "Assigned user not found."
                    });
                }


                // =========================================================
                // CREATE TASK
                // =========================================================

                var task = new StaffTask
                {
                    Id = Guid.NewGuid(),

                    Title = request.Title.Trim(),

                    Description = request.Description,

                    AssignedToId = assignedToId,

                    AssignedById = currentUserId,

                    Priority = string.IsNullOrWhiteSpace(request.Priority)
                        ? "Medium"
                        : request.Priority,

                    Category = string.IsNullOrWhiteSpace(request.Category)
                        ? "Others"
                        : request.Category,

                    Status = "Todo",

                    StartDate = request.StartDate,

                    DueDate = request.DueDate,

                    ReminderAt = request.ReminderAt,

                    IsRecurring = request.IsRecurring,

                    RecurringType = request.IsRecurring
                        ? request.RecurringType
                        : null,

                    EstimatedHours = request.EstimatedHours,

                    CreatedAt = DateTimeHelper.Now()
                };


                // =========================================================
                // CHECKLIST
                // =========================================================

                if (request.Checklists?.Any() == true)
                {
                    var sequence = 1;

                    foreach (var item in request.Checklists)
                    {
                        if (string.IsNullOrWhiteSpace(item.Title))
                            continue;

                        task.Checklists.Add(
                            new StaffTaskChecklist
                            {
                                Id = Guid.NewGuid(),

                                StaffTaskId = task.Id,

                                Title = item.Title.Trim(),

                                IsCompleted = false,

                                CompletedAt = null,

                                Sequence =
                                    item.Sequence > 0
                                        ? item.Sequence
                                        : sequence
                            });

                        sequence++;
                    }
                }


                // =========================================================
                // SAVE
                // =========================================================

                _context.StaffTasks.Add(task);

                await _context.SaveChangesAsync();


                // =========================================================
                // GET FULL DTO
                // =========================================================

                var result = await GetStaffTaskDto(task.Id);


                // =========================================================
                // SIGNALR
                // =========================================================

                await _hub.Clients.All.SendAsync(
                    "StaffTaskAdded",
                    result
                );


                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    new
                    {
                        Error = "Failed to add task.",

                        Detail = ex.Message,

                        InnerException =
                            ex.InnerException?.Message
                    }
                );
            }
        }

        [HttpPut("Update")]
        public async Task<IActionResult> Update(
     [FromBody] UpdateStaffTaskRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (request.Id == Guid.Empty)
            {
                return BadRequest(new
                {
                    Error = "Task ID is required."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Title))
            {
                return BadRequest(new
                {
                    Error = "Title is required."
                });
            }

            // =========================================================
            // GET CURRENT USER
            // =========================================================

            var userIdClaim =
                User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
            {
                return Unauthorized(new
                {
                    Error = "Invalid token."
                });
            }

            if (!Guid.TryParse(userIdClaim, out Guid currentUserId))
            {
                return Unauthorized(new
                {
                    Error = "Invalid user ID."
                });
            }

            try
            {
                // =========================================================
                // GET TASK
                // =========================================================

                var task = await _context.StaffTasks
                    .FirstOrDefaultAsync(x => x.Id == request.Id);

                if (task == null)
                {
                    return NotFound(new
                    {
                        Error = "Task not found."
                    });
                }


                // =========================================================
                // PERMISSION
                //
                // Only creator / assigner can edit task details.
                // =========================================================

                if (task.AssignedById != currentUserId)
                {
                    return Forbid();
                }


                // =========================================================
                // VALIDATE ASSIGNED USER
                // =========================================================

                if (request.AssignedToId.HasValue)
                {
                    var assignedUserExists =
                        await _context.Users
                            .AnyAsync(x =>
                                x.Id == request.AssignedToId.Value);

                    if (!assignedUserExists)
                    {
                        return BadRequest(new
                        {
                            Error = "Assigned user not found."
                        });
                    }
                }


                // =========================================================
                // UPDATE BASIC TASK INFORMATION
                // =========================================================

                task.Title =
                    request.Title.Trim();

                task.Description =
                    request.Description;

                task.AssignedToId =
                    request.AssignedToId;

                task.Priority =
                    string.IsNullOrWhiteSpace(request.Priority)
                        ? "Medium"
                        : request.Priority;

                task.Category =
                    string.IsNullOrWhiteSpace(request.Category)
                        ? "Others"
                        : request.Category;

                task.StartDate =
                    request.StartDate;

                task.DueDate =
                    request.DueDate;

                task.ReminderAt =
                    request.ReminderAt;

                task.IsRecurring =
                    request.IsRecurring;

                task.RecurringType =
                    request.IsRecurring
                        ? request.RecurringType
                        : null;

                task.EstimatedHours =
                    request.EstimatedHours;


                // =========================================================
                // REMOVE EXISTING CHECKLIST
                // =========================================================

                var existingChecklists =
                    await _context.StaffTaskChecklists
                        .Where(x =>
                            x.StaffTaskId == task.Id)
                        .ToListAsync();

                _context.StaffTaskChecklists
                    .RemoveRange(existingChecklists);


                // =========================================================
                // CREATE UPDATED CHECKLIST
                // =========================================================

                var newChecklists =
                    new List<StaffTaskChecklist>();

                if (request.Checklists?.Any() == true)
                {
                    var sequence = 1;

                    foreach (var item in request.Checklists)
                    {
                        if (string.IsNullOrWhiteSpace(item.Title))
                            continue;

                        newChecklists.Add(
                            new StaffTaskChecklist
                            {
                                Id = Guid.NewGuid(),

                                StaffTaskId =
                                    task.Id,

                                Title =
                                    item.Title.Trim(),

                                IsCompleted =
                                    item.IsCompleted,

                                CompletedAt =
                                    item.IsCompleted
                                        ? DateTimeHelper.Now()
                                        : null,

                                Sequence =
                                    item.Sequence > 0
                                        ? item.Sequence
                                        : sequence
                            });

                        sequence++;
                    }

                    if (newChecklists.Any())
                    {
                        _context.StaffTaskChecklists
                            .AddRange(newChecklists);
                    }
                }


                // =========================================================
                // DETERMINE TASK STATUS
                //
                // IMPORTANT:
                // Status is determined from checklist if checklist exists.
                //
                // All completed  -> Completed
                // Some completed  -> InProgress
                // None completed  -> Todo
                //
                // If there is no checklist, use request.Status.
                // =========================================================

                var checklistTotal =
                    newChecklists.Count;

                var checklistCompleted =
                    newChecklists.Count(x =>
                        x.IsCompleted);


                if (checklistTotal > 0)
                {
                    // -----------------------------------------------------
                    // ALL CHECKLIST COMPLETED
                    // -----------------------------------------------------

                    if (checklistCompleted == checklistTotal)
                    {
                        task.Status =
                            "Completed";
                    }

                    // -----------------------------------------------------
                    // SOME CHECKLIST COMPLETED
                    // -----------------------------------------------------

                    else if (checklistCompleted > 0)
                    {
                        task.Status =
                            "InProgress";
                    }

                    // -----------------------------------------------------
                    // NO CHECKLIST COMPLETED
                    // -----------------------------------------------------

                    else
                    {
                        task.Status =
                            "Todo";
                    }
                }
                else
                {
                    // -----------------------------------------------------
                    // NO CHECKLIST
                    //
                    // Use status selected from frontend.
                    // -----------------------------------------------------

                    task.Status =
                        string.IsNullOrWhiteSpace(request.Status)
                            ? "Todo"
                            : request.Status;
                }


                // =========================================================
                // HANDLE COMPLETION
                // =========================================================

                if (task.Status == "Completed")
                {
                    // -----------------------------------------------------
                    // Preserve existing CompletedAt if already completed.
                    // Otherwise create new completion date.
                    // -----------------------------------------------------

                    if (task.CompletedAt == null)
                    {
                        task.CompletedAt =
                            DateTimeHelper.Now();
                    }

                    // -----------------------------------------------------
                    // Preserve existing CompletedById if available.
                    // Otherwise current user becomes completer.
                    // -----------------------------------------------------

                    if (task.CompletedById == null)
                    {
                        task.CompletedById =
                            currentUserId;
                    }
                }
                else
                {
                    // -----------------------------------------------------
                    // Task is no longer completed
                    // -----------------------------------------------------

                    task.CompletedAt =
                        null;

                    task.CompletedById =
                        null;
                }


                // =========================================================
                // SAVE
                // =========================================================

                await _context.SaveChangesAsync();


                // =========================================================
                // GET UPDATED DTO
                // =========================================================

                var result =
                    await GetStaffTaskDto(task.Id);


                // =========================================================
                // SIGNALR
                // =========================================================

                await _hub.Clients.All.SendAsync(
                    "StaffTaskUpdated",
                    result
                );


                // =========================================================
                // RESPONSE
                // =========================================================

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    new
                    {
                        Error =
                            "Failed to update task.",

                        Detail =
                            ex.Message,

                        InnerException =
                            ex.InnerException?.Message
                    }
                );
            }
        }

        [HttpPut("{id}/Reopen")]
        public async Task<IActionResult> ReopenTask(Guid id)
        {
            var userIdClaim =
                User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
            {
                return Unauthorized(new
                {
                    Error = "Invalid token."
                });
            }

            if (!Guid.TryParse(
                userIdClaim,
                out Guid currentUserId))
            {
                return Unauthorized(new
                {
                    Error = "Invalid user ID."
                });
            }

            try
            {
                var task = await _context.StaffTasks
                    .FirstOrDefaultAsync(x => x.Id == id);

                if (task == null)
                {
                    return NotFound(new
                    {
                        Error = "Task not found."
                    });
                }


                // Only assigned staff can reopen
                if (task.AssignedToId != currentUserId)
                {
                    return Forbid();
                }


                task.Status = "Todo";

                task.CompletedAt = null;

                task.CompletedById = null;


                await _context.SaveChangesAsync();


                var result =
                    await GetStaffTaskDto(task.Id);


                await _hub.Clients.All.SendAsync(
                    "StaffTaskUpdated",
                    result
                );


                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    new
                    {
                        Error =
                            "Failed to reopen task.",

                        Detail =
                            ex.Message
                    }
                );
            }
        }

        [HttpDelete("Delete")]
        public async Task<ActionResult> DeleteTask(
    [FromQuery] Guid id)
        {
            var userIdClaim =
                User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
            {
                return Unauthorized(new
                {
                    Error = "Invalid token."
                });
            }

            if (!Guid.TryParse(
                userIdClaim,
                out Guid currentUserId))
            {
                return Unauthorized(new
                {
                    Error = "Invalid user ID."
                });
            }

            try
            {
                var task = await _context.StaffTasks
                    .FirstOrDefaultAsync(x => x.Id == id);

                if (task == null)
                {
                    return NotFound(new
                    {
                        Error = "Task not found."
                    });
                }


                // =========================================================
                // ONLY CREATOR CAN DELETE
                // =========================================================

                if (task.AssignedById != currentUserId)
                {
                    return Forbid();
                }


                // =========================================================
                // DELETE CHECKLIST FIRST
                // =========================================================

                var checklists =
                    await _context.StaffTaskChecklists
                        .Where(x =>
                            x.StaffTaskId == task.Id)
                        .ToListAsync();

                if (checklists.Any())
                {
                    _context.StaffTaskChecklists
                        .RemoveRange(checklists);
                }


                // =========================================================
                // DELETE TASK
                // =========================================================

                _context.StaffTasks.Remove(task);

                await _context.SaveChangesAsync();


                // =========================================================
                // SIGNALR
                // =========================================================

                await _hub.Clients.All.SendAsync(
                    "StaffTaskDeleted",
                    id
                );


                return Ok(new
                {
                    Message =
                        "Task deleted successfully.",

                    Id = id
                });
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    new
                    {
                        Error =
                            "Failed to delete task.",

                        Detail =
                            ex.Message
                    }
                );
            }
        }

        [HttpPut("{id}/Complete")]
        public async Task<IActionResult> CompleteTask(
    Guid id,
    [FromBody] CompleteStaffTaskRequest? request)
        {
            var userIdClaim =
                User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
            {
                return Unauthorized(new
                {
                    Error = "Invalid token."
                });
            }

            if (!Guid.TryParse(
                userIdClaim,
                out Guid currentUserId))
            {
                return Unauthorized(new
                {
                    Error = "Invalid user ID."
                });
            }

            try
            {
                var task = await _context.StaffTasks
                    .FirstOrDefaultAsync(x => x.Id == id);

                if (task == null)
                {
                    return NotFound(new
                    {
                        Error = "Task not found."
                    });
                }


                // =========================================================
                // ONLY ASSIGNEE CAN COMPLETE
                // =========================================================

                if (task.AssignedToId != currentUserId)
                {
                    return Forbid();
                }


                // =========================================================
                // COMPLETE
                // =========================================================

                task.Status = "Completed";

                task.CompletedAt =
                    DateTimeHelper.Now();

                task.CompletedById =
                    currentUserId;

                if (request?.ActualHours != null)
                {
                    task.ActualHours =
                        request.ActualHours;
                }


                // =========================================================
                // SAVE
                // =========================================================

                await _context.SaveChangesAsync();


                // =========================================================
                // GET UPDATED TASK
                // =========================================================

                var result =
                    await GetStaffTaskDto(task.Id);


                // =========================================================
                // SIGNALR
                // =========================================================

                await _hub.Clients.All.SendAsync(
                    "StaffTaskCompleted",
                    result
                );


                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    new
                    {
                        Error =
                            "Failed to complete task.",

                        Detail =
                            ex.Message
                    }
                );
            }
        }

        [HttpGet("GetDropdown")]
        public async Task<IActionResult> GetDropdown()
        {
            try
            {

                var users = await _context.Users.OrderBy(u => u.FullName)
                    .Select(u => new DropdownDto
                    {
                        Id = u.Id,
                        Name = u.FullName,
                        DisplayName = u.DisplayName,
                        Email = u.Email,
                        JobTitle = u.JobTitle,
                    })
                    .ToListAsync();

                return Ok(new
                {
                    Users = users
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new { Error = "Failed to load dropdown data." });
            }
        }

        private async Task<object?> GetStaffTaskDto(Guid id)
        {
            return await _context.StaffTasks
                .AsNoTracking()
                .Where(x => x.Id == id)
                .Select(x => new
                {
                    x.Id,

                    x.Title,

                    x.Description,


                    // =====================================================
                    // ASSIGNED BY
                    // =====================================================

                    x.AssignedById,

                    AssignedBy =
                        x.AssignedBy == null
                            ? null
                            : new
                            {
                                x.AssignedBy.Id,
                                x.AssignedBy.FullName,
                                x.AssignedBy.DisplayName,
                                x.AssignedBy.Email
                            },


                    // =====================================================
                    // ASSIGNED TO
                    // =====================================================

                    x.AssignedToId,

                    AssignedTo =
                        x.AssignedTo == null
                            ? null
                            : new
                            {
                                x.AssignedTo.Id,
                                x.AssignedTo.FullName,
                                x.AssignedTo.DisplayName,
                                x.AssignedTo.Email
                            },


                    // =====================================================
                    // TASK DETAILS
                    // =====================================================

                    x.Priority,

                    x.Category,

                    x.Status,


                    // =====================================================
                    // DATES
                    // =====================================================

                    x.StartDate,

                    x.DueDate,

                    x.ReminderAt,


                    // =====================================================
                    // RECURRING
                    // =====================================================

                    x.IsRecurring,

                    x.RecurringType,


                    // =====================================================
                    // HOURS
                    // =====================================================

                    x.EstimatedHours,

                    x.ActualHours,


                    // =====================================================
                    // COMPLETION
                    // =====================================================

                    x.CompletedAt,

                    x.CompletedById,

                    CompletedBy =
                        x.CompletedBy == null
                            ? null
                            : new
                            {
                                x.CompletedBy.Id,
                                x.CompletedBy.FullName,
                                x.CompletedBy.DisplayName,
                                x.CompletedBy.Email
                            },


                    // =====================================================
                    // CHECKLIST
                    // =====================================================

                    Checklists = x.Checklists
                        .OrderBy(c => c.Sequence)
                        .Select(c => new
                        {
                            c.Id,

                            c.StaffTaskId,

                            c.Title,

                            c.IsCompleted,

                            c.CompletedAt,

                            c.Sequence
                        })
                        .ToList(),

                    ChecklistTotal =
                        x.Checklists.Count(),

                    ChecklistCompleted =
                        x.Checklists.Count(
                            c => c.IsCompleted
                        )
                })
                .FirstOrDefaultAsync();
        }

        [HttpGet("GetSummary")]
        public async Task<IActionResult> GetSummary()
        {
            try
            {
                // =========================================================
                // GET CURRENT USER
                // =========================================================

                var userIdClaim =
                    User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdClaim))
                {
                    return Unauthorized(new
                    {
                        Error = "Invalid token."
                    });
                }

                if (!Guid.TryParse(
                    userIdClaim,
                    out Guid currentUserId))
                {
                    return Unauthorized(new
                    {
                        Error = "Invalid user ID."
                    });
                }


                // =========================================================
                // BASE QUERY
                //
                // User is involved when:
                //
                // 1. AssignedToId = current user
                //
                // OR
                //
                // 2. AssignedToId is NULL
                //    AND AssignedById = current user
                //
                // NULL AssignedToId means PERSONAL / OWN TASK.
                //
                // OR
                //
                // 3. AssignedById = current user
                //    for tasks assigned to someone else.
                // =========================================================

                var query = _context.StaffTasks
                    .AsNoTracking()
                    .Where(t =>
                        t.AssignedToId == currentUserId ||
                        t.AssignedById == currentUserId
                    );


                // =========================================================
                // MY TASKS
                //
                // Includes:
                //
                // 1. Task assigned to me
                //
                // 2. Personal task:
                //    AssignedToId == null
                //    AND AssignedById == current user
                //
                // Does NOT include tasks I assigned to other people.
                // =========================================================

                var myTasks = await query
                    .CountAsync(t =>
                        t.AssignedToId == currentUserId
                        ||
                        (
                            t.AssignedToId == null &&
                            t.AssignedById == currentUserId
                        )
                    );


                // =========================================================
                // ASSIGNED TO OTHERS
                //
                // Created by me and assigned to another user.
                //
                // Example:
                //
                // AssignedById = Me
                // AssignedToId = John
                //
                // This does NOT include personal tasks.
                // =========================================================

                var assignedToOthers = await query
                    .CountAsync(t =>
                        t.AssignedById == currentUserId &&
                        t.AssignedToId != null &&
                        t.AssignedToId != currentUserId
                    );


                // =========================================================
                // IN PROGRESS
                //
                // My task means:
                //
                // 1. Assigned to me
                //
                // OR
                //
                // 2. Personal task
                //    AssignedToId == null
                //    AND AssignedById == me
                //
                // Then status must be InProgress.
                // =========================================================

                var inProgress = await query
                    .CountAsync(t =>
                        (
                            t.AssignedToId == currentUserId
                            ||
                            (
                                t.AssignedToId == null &&
                                t.AssignedById == currentUserId
                            )
                        )
                        &&
                        t.Status == "InProgress"
                    );


                // =========================================================
                // COMPLETED
                //
                // My task means:
                //
                // 1. Assigned to me
                //
                // OR
                //
                // 2. Personal task
                //    AssignedToId == null
                //    AND AssignedById = me
                //
                // Then status must be Completed.
                // =========================================================

                var completed = await query
                    .CountAsync(t =>
                        (
                            t.AssignedToId == currentUserId
                            ||
                            (
                                t.AssignedToId == null &&
                                t.AssignedById == currentUserId
                            )
                        )
                        &&
                        t.Status == "Completed"
                    );


                // =========================================================
                // RESPONSE
                // =========================================================

                return Ok(new
                {
                    MyTasks = myTasks,

                    AssignedToOthers = assignedToOthers,

                    InProgress = inProgress,

                    Completed = completed
                });
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    new
                    {
                        Error =
                            "Failed to load task summary.",

                        Detail =
                            ex.Message,

                        InnerException =
                            ex.InnerException?.Message
                    }
                );
            }
        }

        [HttpPut("UpdateChecklist")]
        public async Task<IActionResult> UpdateChecklist(
    [FromBody] UpdateStaffTaskChecklistRequest request)
        {
            var userIdClaim =
                User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!Guid.TryParse(userIdClaim, out Guid currentUserId))
            {
                return Unauthorized(new
                {
                    Error = "Invalid user."
                });
            }

            var task = await _context.StaffTasks
                .FirstOrDefaultAsync(x => x.Id == request.Id);

            if (task == null)
            {
                return NotFound(new
                {
                    Error = "Task not found."
                });
            }

            // Only assigned staff can update checklist
            if (task.AssignedToId != currentUserId)
            {
                return Forbid();
            }

            foreach (var item in request.Checklists)
            {
                var checklist = await _context.StaffTaskChecklists
                    .FirstOrDefaultAsync(x =>
                        x.Id == item.Id &&
                        x.StaffTaskId == task.Id);

                if (checklist == null)
                    continue;

                checklist.IsCompleted = item.IsCompleted;

                checklist.CompletedAt = item.IsCompleted
                    ? DateTimeHelper.Now()
                    : null;
            }


            // =========================================================
            // UPDATE TASK STATUS BASED ON CHECKLIST
            // =========================================================

            var total = await _context.StaffTaskChecklists
                .CountAsync(x => x.StaffTaskId == task.Id);

            var completed = await _context.StaffTaskChecklists
                .CountAsync(x =>
                    x.StaffTaskId == task.Id &&
                    x.IsCompleted);


            if (total > 0 && completed == total)
            {
                // ALL completed
                task.Status = "Completed";
                task.CompletedAt = DateTimeHelper.Now();
                task.CompletedById = currentUserId;
            }
            else if (completed > 0)
            {
                // SOME completed
                task.Status = "InProgress";
                task.CompletedAt = null;
                task.CompletedById = null;
            }
            else
            {
                // NONE completed
                task.Status = "Todo";
                task.CompletedAt = null;
                task.CompletedById = null;
            }


            await _context.SaveChangesAsync();

            var result = await GetStaffTaskDto(task.Id);

            await _hub.Clients.All.SendAsync(
                "StaffTaskUpdated",
                result
            );

            return Ok(result);
        }
    }
}
