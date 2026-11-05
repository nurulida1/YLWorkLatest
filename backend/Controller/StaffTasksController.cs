using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using System.Security.Claims;
using YLWorks.Data;
using YLWorks.Hubs;
using YLWorks.Model;
using WebApplication1.Helpers;

namespace YLWorks.Controller
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class StaffTaskController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hub;

        private static readonly string[] AllowedPriorities =
        {
            "Low",
            "Medium",
            "High",
            "Urgent"
        };

        private static readonly string[] AllowedCategories =
        {
            "Admin",
            "HR",
            "Development",
            "Documentation",
            "Maintenance",
            "Meeting",
            "Training",
            "Others"
        };

        private static readonly string[] AllowedStatuses =
        {
            "Todo",
            "InProgress",
            "Pending",
            "Completed",
            "Cancelled"
        };

        private static readonly string[] AllowedRecurringTypes =
        {
            "Daily",
            "Weekly",
            "Monthly",
            "Yearly"
        };

        public StaffTaskController(
            AppDbContext context,
            IHubContext<NotificationHub> hub)
        {
            _context = context;
            _hub = hub;
        }

        // ================================================================
        // CURRENT USER
        // ================================================================

        private bool TryGetCurrentUserId(out Guid userId)
        {
            userId = Guid.Empty;

            var userIdClaim =
                User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            return Guid.TryParse(userIdClaim, out userId);
        }

        // ================================================================
        // VALIDATION HELPERS
        // ================================================================

        private static string NormalizeValue(
            string? value,
            string defaultValue)
        {
            return string.IsNullOrWhiteSpace(value)
                ? defaultValue
                : value.Trim();
        }

        private static bool IsValidValue(
            string value,
            string[] allowedValues)
        {
            return allowedValues.Any(x =>
                x.Equals(value, StringComparison.OrdinalIgnoreCase));
        }

        private static string NormalizeAllowedValue(
            string? value,
            string defaultValue,
            string[] allowedValues)
        {
            var normalized = NormalizeValue(value, defaultValue);

            var matched = allowedValues.FirstOrDefault(x =>
                x.Equals(
                    normalized,
                    StringComparison.OrdinalIgnoreCase));

            return matched ?? normalized;
        }

        private IActionResult? ValidateTaskDetails(
            string? title,
            DateTime? startDate,
            DateTime dueDate,
            bool isRecurring,
            string? recurringType,
            decimal? estimatedHours)
        {
            if (string.IsNullOrWhiteSpace(title))
            {
                return BadRequest(new
                {
                    Error = "Title is required."
                });
            }

            if (title.Trim().Length > 200)
            {
                return BadRequest(new
                {
                    Error = "Title cannot exceed 200 characters."
                });
            }

            if (startDate.HasValue &&
                dueDate < startDate.Value)
            {
                return BadRequest(new
                {
                    Error = "Due date cannot be earlier than start date."
                });
            }

            if (dueDate == DateTime.MinValue)
            {
                return BadRequest(new
                {
                    Error = "Due date is required."
                });
            }

            if (estimatedHours < 0)
            {
                return BadRequest(new
                {
                    Error = "Estimated hours cannot be negative."
                });
            }

            if (isRecurring)
            {
                if (string.IsNullOrWhiteSpace(recurringType) ||
                    !IsValidValue(
                        recurringType,
                        AllowedRecurringTypes))
                {
                    return BadRequest(new
                    {
                        Error = "A valid recurring type is required."
                    });
                }
            }

            return null;
        }

        private IActionResult? ValidatePriorityAndCategory(
            string? priority,
            string? category)
        {
            var normalizedPriority =
                NormalizeValue(priority, "Medium");

            var normalizedCategory =
                NormalizeValue(category, "Others");

            if (!IsValidValue(
                normalizedPriority,
                AllowedPriorities))
            {
                return BadRequest(new
                {
                    Error = "Invalid task priority."
                });
            }

            if (!IsValidValue(
                normalizedCategory,
                AllowedCategories))
            {
                return BadRequest(new
                {
                    Error = "Invalid task category."
                });
            }

            return null;
        }

        private static string GetTaskStatusFromChecklist(
            int total,
            int completed)
        {
            if (total == 0)
                return "Todo";

            if (completed == total)
                return "Completed";

            if (completed > 0)
                return "InProgress";

            return "Todo";
        }

        private static void SetTaskCompletion(
            StaffTask task,
            string status,
            Guid currentUserId)
        {
            task.Status = status;

            if (status == "Completed")
            {
                task.CompletedAt ??= DateTimeHelper.Now();
                task.CompletedById ??= currentUserId;
            }
            else
            {
                task.CompletedAt = null;
                task.CompletedById = null;
            }
        }

        private async Task<IActionResult> GetTaskNotFoundResponse()
        {
            return NotFound(new
            {
                Error = "Task not found."
            });
        }

        // ================================================================
        // FILTER EXPRESSION
        //
        // Supported:
        // Status=Todo
        // Priority=High
        // Status=Todo,Priority=High
        // Status=Todo|Status=InProgress
        // Title=report
        // ================================================================

        private static Expression<Func<StaffTask, bool>>?
            BuildFilterExpression(string filter)
        {
            var parameter =
                Expression.Parameter(typeof(StaffTask), "t");

            Expression? finalExpression = null;

            var allowedProperties = new HashSet<string>(
                StringComparer.OrdinalIgnoreCase)
            {
                "Title",
                "Description",
                "Priority",
                "Category",
                "Status",
                "AssignedToId",
                "AssignedById",
                "ProjectId",
                "IsRecurring",
                "DueDate",
                "StartDate",
                "ReminderAt"
            };

            var orParts = filter.Split(
                '|',
                StringSplitOptions.RemoveEmptyEntries);

            foreach (var orPart in orParts)
            {
                Expression? orExpression = null;

                var andParts = orPart.Split(
                    ',',
                    StringSplitOptions.RemoveEmptyEntries);

                foreach (var andPart in andParts)
                {
                    var isNotEqual = andPart.Contains("!=");

                    var parts = isNotEqual
                        ? andPart.Split(
                            new[] { "!=" },
                            2,
                            StringSplitOptions.None)
                        : andPart.Split(
                            new[] { '=' },
                            2,
                            StringSplitOptions.None);

                    if (parts.Length != 2)
                        continue;

                    var propertyName = parts[0].Trim();
                    var value = parts[1].Trim();

                    if (!allowedProperties.Contains(propertyName))
                        continue;

                    var propertyInfo =
                        typeof(StaffTask).GetProperty(
                            propertyName,
                            System.Reflection.BindingFlags.Public |
                            System.Reflection.BindingFlags.Instance |
                            System.Reflection.BindingFlags.IgnoreCase);

                    if (propertyInfo == null)
                        continue;

                    var propertyAccess =
                        Expression.Property(parameter, propertyInfo);

                    var actualType =
                        Nullable.GetUnderlyingType(
                            propertyInfo.PropertyType)
                        ?? propertyInfo.PropertyType;

                    Expression condition;

                    // STRING
                    if (actualType == typeof(string))
                    {
                        var notNull =
                            Expression.NotEqual(
                                propertyAccess,
                                Expression.Constant(null));

                        var toLowerMethod =
                            typeof(string).GetMethod(
                                nameof(string.ToLower),
                                Type.EmptyTypes)!;

                        var containsMethod =
                            typeof(string).GetMethod(
                                nameof(string.Contains),
                                new[] { typeof(string) })!;

                        var loweredProperty =
                            Expression.Call(
                                propertyAccess,
                                toLowerMethod);

                        var loweredValue =
                            Expression.Constant(value.ToLower());

                        var contains =
                            Expression.Call(
                                loweredProperty,
                                containsMethod,
                                loweredValue);

                        condition = Expression.AndAlso(
                            notNull,
                            isNotEqual
                                ? Expression.Not(contains)
                                : contains);
                    }

                    // GUID / NULLABLE GUID
                    else if (actualType == typeof(Guid))
                    {
                        if (!Guid.TryParse(value, out var guidValue))
                            continue;

                        var constant =
                            Expression.Constant(guidValue, actualType);

                        Expression right =
                            propertyInfo.PropertyType == typeof(Guid?)
                                ? Expression.Convert(
                                    constant,
                                    propertyInfo.PropertyType)
                                : constant;

                        var equal =
                            Expression.Equal(propertyAccess, right);

                        condition = isNotEqual
                            ? Expression.Not(equal)
                            : equal;
                    }

                    // BOOLEAN
                    else if (actualType == typeof(bool))
                    {
                        if (!bool.TryParse(value, out var boolValue))
                            continue;

                        var equal = Expression.Equal(
                            propertyAccess,
                            Expression.Constant(boolValue));

                        condition = isNotEqual
                            ? Expression.Not(equal)
                            : equal;
                    }

                    // DATE / NULLABLE DATE
                    else if (actualType == typeof(DateTime))
                    {
                        if (!DateTime.TryParse(
                            value,
                            out var dateValue))
                        {
                            continue;
                        }

                        var constant =
                            Expression.Constant(dateValue);

                        Expression right =
                            propertyInfo.PropertyType == typeof(DateTime?)
                                ? Expression.Convert(
                                    constant,
                                    propertyInfo.PropertyType)
                                : constant;

                        var equal =
                            Expression.Equal(propertyAccess, right);

                        condition = isNotEqual
                            ? Expression.Not(equal)
                            : equal;
                    }
                    else
                    {
                        continue;
                    }

                    orExpression = orExpression == null
                        ? condition
                        : Expression.AndAlso(
                            orExpression,
                            condition);
                }

                if (orExpression != null)
                {
                    finalExpression = finalExpression == null
                        ? orExpression
                        : Expression.OrElse(
                            finalExpression,
                            orExpression);
                }
            }

            if (finalExpression == null)
                return null;

            return Expression.Lambda<Func<StaffTask, bool>>(
                finalExpression,
                parameter);
        }

        // ================================================================
        // SORTING
        // ================================================================

        private static IQueryable<StaffTask> ApplySorting(
            IQueryable<StaffTask> query,
            string? orderBy)
        {
            if (string.IsNullOrWhiteSpace(orderBy))
            {
                return query
                    .OrderBy(t =>
                        t.Status == "Completed" ||
                        t.Status == "Cancelled")
                    .ThenBy(t => t.DueDate);
            }

            var parts = orderBy.Trim().Split(
                ' ',
                StringSplitOptions.RemoveEmptyEntries);

            var property = parts[0];

            var descending =
                parts.Length > 1 &&
                parts[1].Equals(
                    "desc",
                    StringComparison.OrdinalIgnoreCase);

            return property.ToLowerInvariant() switch
            {
                "title" => descending
                    ? query.OrderByDescending(t => t.Title)
                    : query.OrderBy(t => t.Title),

                "priority" => descending
                    ? query.OrderByDescending(t => t.Priority)
                    : query.OrderBy(t => t.Priority),

                "category" => descending
                    ? query.OrderByDescending(t => t.Category)
                    : query.OrderBy(t => t.Category),

                "status" => descending
                    ? query.OrderByDescending(t => t.Status)
                    : query.OrderBy(t => t.Status),

                "duedate" => descending
                    ? query.OrderByDescending(t => t.DueDate)
                    : query.OrderBy(t => t.DueDate),

                "startdate" => descending
                    ? query.OrderByDescending(t => t.StartDate)
                    : query.OrderBy(t => t.StartDate),

                "createdat" => descending
                    ? query.OrderByDescending(t => t.CreatedAt)
                    : query.OrderBy(t => t.CreatedAt),

                _ => query
                    .OrderBy(t =>
                        t.Status == "Completed" ||
                        t.Status == "Cancelled")
                    .ThenBy(t => t.DueDate)
            };
        }

        // ================================================================
        // GET MANY
        // ================================================================

        [HttpGet("GetMany")]
        public async Task<ActionResult> GetMany(
            int page = 1,
            int pageSize = 10,
            string? filter = null,
            string? orderBy = null,
            string? includes = null)
        {
            if (!TryGetCurrentUserId(out var currentUserId))
                return Unauthorized(new { Error = "Invalid user." });

            try
            {
                page = Math.Max(1, page);
                pageSize = pageSize switch
                {
                    <= 0 => 10,
                    > 100 => 100,
                    _ => pageSize
                };

                var query = _context.StaffTasks
                    .AsNoTracking()
                    .Where(t =>
                        t.AssignedById == currentUserId ||
                        t.AssignedToId == currentUserId);

                if (!string.IsNullOrWhiteSpace(filter))
                {
                    var expression =
                        BuildFilterExpression(filter);

                    if (expression != null)
                        query = query.Where(expression);
                }

                query = ApplySorting(query, orderBy);

                var totalElements = await query.CountAsync();

                var items = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(t => new
                    {
                        t.Id,
                        t.Title,
                        t.Description,
                        t.ProjectId,
                        Project = t.Project == null ? null : new
                        {
                            t.Project.Id,
                            t.Project.ProjectCode,
                            t.Project.ProjectTitle
                        },
                        t.AssignedToId,

                        AssignedTo = t.AssignedTo == null
                            ? null
                            : new
                            {
                                t.AssignedTo.Id,
                                t.AssignedTo.FullName
                            },

                        t.AssignedById,

                        AssignedBy = t.AssignedBy == null
                            ? null
                            : new
                            {
                                t.AssignedBy.Id,
                                t.AssignedBy.FullName
                            },

                        t.Priority,
                        t.Category,
                        t.Status,

                        t.StartDate,
                        t.DueDate,
                        t.ReminderAt,

                        t.IsRecurring,
                        t.RecurringType,

                        t.EstimatedHours,
                        t.ActualHours,

                        t.CompletedAt,

                        CompletedBy = t.CompletedBy == null
                            ? null
                            : new
                            {
                                t.CompletedBy.Id,
                                t.CompletedBy.FullName
                            },

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

                        ChecklistTotal = t.Checklists.Count(),

                        ChecklistCompleted =
                            t.Checklists.Count(c => c.IsCompleted)
                    })
                    .ToListAsync();

                return Ok(new
                {
                    Data = items,
                    TotalElements = totalElements,
                    Page = page,
                    PageSize = pageSize,
                    TotalPages = (int)Math.Ceiling(
                        totalElements / (double)pageSize)
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to load tasks."
                });
            }
        }

        // ================================================================
        // GET ONE
        // ================================================================

        [HttpGet("GetOne")]
        public async Task<IActionResult> GetOne(
            [FromQuery] Guid id)
        {
            if (!TryGetCurrentUserId(out var currentUserId))
                return Unauthorized(new { Error = "Invalid user." });

            try
            {
                var data = await _context.StaffTasks
                    .AsNoTracking()
                    .Where(x =>
                        x.Id == id &&
                        (
                            x.AssignedById == currentUserId ||
                            x.AssignedToId == currentUserId
                        ))
                    .Select(x => new
                    {
                        x.Id,
                        x.Title,
                        x.Description,
                        x.ProjectId,
                        Project = x.Project == null ? null : new
                        {
                            x.Project.Id,
                            x.Project.ProjectCode,
                            x.Project.ProjectTitle
                        },
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

                        x.Priority,
                        x.Category,
                        x.Status,

                        x.StartDate,
                        x.DueDate,
                        x.ReminderAt,

                        x.IsRecurring,
                        x.RecurringType,

                        x.EstimatedHours,
                        x.ActualHours,

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

                        ChecklistTotal = x.Checklists.Count(),

                        ChecklistCompleted =
                            x.Checklists.Count(c => c.IsCompleted)
                    })
                    .FirstOrDefaultAsync();

                if (data == null)
                    return NotFound(new { Error = "Task not found." });

                return Ok(data);
            }
            catch (Exception)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to load task."
                });
            }
        }

        // ================================================================
        // CREATE
        // ================================================================


        [HttpPost("Create")]
        public async Task<IActionResult> AddTask(
    [FromBody] CreateStaffTaskRequest request)
        {
            if (!TryGetCurrentUserId(out var currentUserId))
                return Unauthorized(new { Error = "Invalid user." });

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var validation = ValidateTaskDetails(
                request.Title,
                request.StartDate,
                request.DueDate,
                request.IsRecurring,
                request.RecurringType,
                request.EstimatedHours);

            if (validation != null)
                return validation;

            validation = ValidatePriorityAndCategory(
                request.Priority,
                request.Category);

            if (validation != null)
                return validation;

            try
            {
                // Validate optional project.
                if (!await IsValidProject(request.ProjectId))
                {
                    return BadRequest(new
                    {
                        Error = "Project not found."
                    });
                }

                // Null means personal task.
                var assignedToId =
                    request.AssignedToId ?? currentUserId;

                var assignedUserExists =
                    await _context.Users.AnyAsync(
                        x => x.Id == assignedToId);

                if (!assignedUserExists)
                {
                    return BadRequest(new
                    {
                        Error = "Assigned user not found."
                    });
                }

                var task = new StaffTask
                {
                    Id = Guid.NewGuid(),

                    Title = request.Title.Trim(),
                    Description = request.Description?.Trim(),

                    AssignedToId = assignedToId,
                    AssignedById = currentUserId,

                    Priority = NormalizeAllowedValue(
                        request.Priority,
                        "Medium",
                        AllowedPriorities),

                    Category = NormalizeAllowedValue(
                        request.Category,
                        "Others",
                        AllowedCategories),

                    Status = StaffTaskStatus.Todo,

                    StartDate = request.StartDate,
                    DueDate = request.DueDate,
                    ReminderAt = request.ReminderAt,

                    IsRecurring = request.IsRecurring,

                    RecurringType = request.IsRecurring
                        ? NormalizeAllowedValue(
                            request.RecurringType,
                            "Daily",
                            AllowedRecurringTypes)
                        : null,

                    EstimatedHours = request.EstimatedHours,

                    // OPTIONAL PROJECT
                    ProjectId = request.ProjectId,

                    CreatedAt = DateTimeHelper.Now()
                };

                // Add checklists.
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

                                Sequence = item.Sequence > 0
                                    ? item.Sequence
                                    : sequence
                            });

                        sequence++;
                    }
                }

                _context.StaffTasks.Add(task);

                await _context.SaveChangesAsync();

                // Notify assigned employee.
                if (assignedToId != currentUserId)
                {
                    await SendTaskNotification(
                        assignedToId,
                        "New Task Assigned",
                        $"You have been assigned a new task: {task.Title}",
                        task.Id);
                }

                var result = await GetStaffTaskDto(task.Id);

                await _hub.Clients.All.SendAsync(
                    "StaffTaskAdded",
                    result);

                return Ok(result);
            }
            catch (Exception)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to create task."
                });
            }
        }

        // ================================================================
        // UPDATE
        // ================================================================

        [HttpPut("Update")]
        public async Task<IActionResult> Update(
    [FromBody] UpdateStaffTaskRequest request)
        {
            if (!TryGetCurrentUserId(out var currentUserId))
                return Unauthorized(new { Error = "Invalid user." });

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (request.Id == Guid.Empty)
            {
                return BadRequest(new
                {
                    Error = "Task ID is required."
                });
            }

            var validation = ValidateTaskDetails(
                request.Title,
                request.StartDate,
                request.DueDate,
                request.IsRecurring,
                request.RecurringType,
                request.EstimatedHours);

            if (validation != null)
                return validation;

            validation = ValidatePriorityAndCategory(
                request.Priority,
                request.Category);

            if (validation != null)
                return validation;

            try
            {
                // Validate optional project.
                if (!await IsValidProject(request.ProjectId))
                {
                    return BadRequest(new
                    {
                        Error = "Project not found."
                    });
                }

                var task = await _context.StaffTasks
                    .Include(x => x.Checklists)
                    .FirstOrDefaultAsync(x => x.Id == request.Id);

                if (task == null)
                    return NotFound(new { Error = "Task not found." });

                // Only creator / assigner can edit task details.
                if (task.AssignedById != currentUserId)
                    return Forbid();

                var previousAssignedToId = task.AssignedToId;

                var assignedToId =
                    request.AssignedToId ?? currentUserId;

                var assignedUserExists =
                    await _context.Users.AnyAsync(
                        x => x.Id == assignedToId);

                if (!assignedUserExists)
                {
                    return BadRequest(new
                    {
                        Error = "Assigned user not found."
                    });
                }

                if (!IsValidValue(
                    NormalizeValue(request.Status, "Todo"),
                    AllowedStatuses))
                {
                    return BadRequest(new
                    {
                        Error = "Invalid task status."
                    });
                }

                // UPDATE TASK DETAILS

                task.Title = request.Title.Trim();
                task.Description = request.Description?.Trim();

                task.AssignedToId = assignedToId;

                task.Priority = NormalizeAllowedValue(
                    request.Priority,
                    "Medium",
                    AllowedPriorities);

                task.Category = NormalizeAllowedValue(
                    request.Category,
                    "Others",
                    AllowedCategories);

                task.StartDate = request.StartDate;
                task.DueDate = request.DueDate;
                task.ReminderAt = request.ReminderAt;

                task.IsRecurring = request.IsRecurring;

                task.RecurringType = request.IsRecurring
                    ? NormalizeAllowedValue(
                        request.RecurringType,
                        "Daily",
                        AllowedRecurringTypes)
                    : null;

                task.EstimatedHours = request.EstimatedHours;

                // OPTIONAL PROJECT
                // Null clears the project's association.

                task.ProjectId = request.ProjectId;

                // SYNC CHECKLISTS

                var requestedChecklists =
                    request.Checklists ??
                    new List<UpdateStaffTaskChecklistItemRequest>();

                var existingById = task.Checklists
                    .ToDictionary(x => x.Id);

                var submittedIds = requestedChecklists
                    .Where(x => x.Id.HasValue)
                    .Select(x => x.Id!.Value)
                    .ToList();

                if (submittedIds.Any(id => !existingById.ContainsKey(id)))
                {
                    return BadRequest(new
                    {
                        Error = "One or more checklist items do not belong to this task."
                    });
                }

                var now = DateTimeHelper.Now();
                var sequence = 1;

                foreach (var item in requestedChecklists)
                {
                    if (string.IsNullOrWhiteSpace(item.Title))
                        continue;

                    StaffTaskChecklist checklist;

                    if (item.Id.HasValue)
                    {
                        checklist = existingById[item.Id.Value];
                    }
                    else
                    {
                        checklist = new StaffTaskChecklist
                        {
                            Id = Guid.NewGuid(),
                            StaffTaskId = task.Id
                        };

                        task.Checklists.Add(checklist);
                    }

                    checklist.Title = item.Title.Trim();

                    checklist.IsCompleted = item.IsCompleted;

                    checklist.CompletedAt = item.IsCompleted
                        ? checklist.CompletedAt ?? now
                        : null;

                    checklist.Sequence = item.Sequence > 0
                        ? item.Sequence
                        : sequence;

                    sequence++;
                }

                // REMOVE CHECKLISTS NOT SUBMITTED

                var retainedIds = requestedChecklists
                    .Where(x => x.Id.HasValue)
                    .Select(x => x.Id!.Value)
                    .ToHashSet();

                var removedChecklists = task.Checklists
                    .Where(x =>
                        existingById.ContainsKey(x.Id) &&
                        !retainedIds.Contains(x.Id))
                    .ToList();

                if (removedChecklists.Any())
                {
                    _context.StaffTaskChecklists.RemoveRange(
                        removedChecklists);
                }

                // DETERMINE STATUS

                var activeChecklists = task.Checklists
                    .Where(x =>
                        !removedChecklists.Any(r => r.Id == x.Id))
                    .ToList();

                var checklistTotal = activeChecklists.Count;

                var checklistCompleted = activeChecklists.Count(
                    x => x.IsCompleted);

                var newStatus = checklistTotal > 0
                    ? GetTaskStatusFromChecklist(
                        checklistTotal,
                        checklistCompleted)
                    : NormalizeAllowedValue(
                        request.Status,
                        "Todo",
                        AllowedStatuses);

                SetTaskCompletion(
                    task,
                    newStatus,
                    currentUserId);

                await _context.SaveChangesAsync();

                // Notify assigned employee when the task is assigned or updated.
                if (assignedToId != currentUserId)
                {
                    if (assignedToId != previousAssignedToId)
                    {
                        // New employee assigned.
                        await SendTaskNotification(
                            assignedToId,
                            "Task Assigned to You",
                            $"You have been assigned a task: {task.Title}",
                            task.Id);
                    }
                    else
                    {
                        // Existing assignee: task details have been updated.
                        await SendTaskNotification(
                            assignedToId,
                            "Task Updated",
                            $"The task '{task.Title}' assigned to you has been updated.",
                            task.Id);
                    }
                }

                // Notify previous assignee.
                if (previousAssignedToId.HasValue &&
                    previousAssignedToId.Value != currentUserId &&
                    previousAssignedToId.Value != assignedToId)
                {
                    await SendTaskNotification(
                        previousAssignedToId.Value,
                        "Task Reassigned",
                        $"The task '{task.Title}' has been reassigned to another employee.",
                        task.Id);
                }

                var result = await GetStaffTaskDto(task.Id);

                await _hub.Clients.All.SendAsync(
                    "StaffTaskUpdated",
                    result);

                return Ok(result);
            }
            catch (Exception)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to update task."
                });
            }
        }
        // ================================================================
        // REOPEN
        // ================================================================

        [HttpPut("{id}/Reopen")]
        public async Task<IActionResult> ReopenTask(Guid id)
        {
            if (!TryGetCurrentUserId(out var currentUserId))
                return Unauthorized(new { Error = "Invalid user." });

            try
            {
                var task = await _context.StaffTasks
                    .Include(x => x.Checklists)
                    .FirstOrDefaultAsync(x => x.Id == id);

                if (task == null)
                    return NotFound(new { Error = "Task not found." });

                // Only assigned staff can reopen.
                if (task.AssignedToId != currentUserId)
                    return Forbid();

                task.Status = "Todo";
                task.CompletedAt = null;
                task.CompletedById = null;

                // Reset checklist completion to keep the task consistent.
                foreach (var checklist in task.Checklists)
                {
                    checklist.IsCompleted = false;
                    checklist.CompletedAt = null;
                }

                await _context.SaveChangesAsync();

                // Notify the creator / assigner.
                if (task.AssignedById != currentUserId)
                {
                    await SendTaskNotification(
                        task.AssignedById,
                        "Task Reopened",
                        $"'{task.Title}' has been reopened.",
                        task.Id);
                }

                var result = await GetStaffTaskDto(task.Id);

                await _hub.Clients.All.SendAsync(
                    "StaffTaskUpdated",
                    result);

                return Ok(result);
            }
            catch (Exception)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to reopen task."
                });
            }
        }

        // ================================================================
        // DELETE
        // ================================================================

        [HttpDelete("Delete")]
        public async Task<ActionResult> DeleteTask(
            [FromQuery] Guid id)
        {
            if (!TryGetCurrentUserId(out var currentUserId))
                return Unauthorized(new { Error = "Invalid user." });

            try
            {
                var task = await _context.StaffTasks
                    .Include(x => x.Checklists)
                    .FirstOrDefaultAsync(x => x.Id == id);

                if (task == null)
                    return NotFound(new { Error = "Task not found." });

                // Only creator / assigner can delete.
                if (task.AssignedById != currentUserId)
                    return Forbid();

                if (task.Checklists.Any())
                {
                    _context.StaffTaskChecklists.RemoveRange(
                        task.Checklists);
                }

                // Notify assigned employee before deleting the task.
                if (task.AssignedToId.HasValue &&
                    task.AssignedToId.Value != currentUserId)
                {
                    await SendTaskNotification(
                        task.AssignedToId.Value,
                        "Task Deleted",
                        $"The task '{task.Title}' assigned to you has been deleted.",
                        task.Id);
                }

                _context.StaffTasks.Remove(task);

                await _context.SaveChangesAsync();

                await _hub.Clients.All.SendAsync(
                    "StaffTaskDeleted",
                    id);

                return Ok(new
                {
                    Message = "Task deleted successfully.",
                    Id = id
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to delete task."
                });
            }
        }

        // ================================================================
        // COMPLETE
        // ================================================================

        [HttpPut("{id}/Complete")]
        public async Task<IActionResult> CompleteTask(
            Guid id,
            [FromBody] CompleteStaffTaskRequest? request)
        {
            if (!TryGetCurrentUserId(out var currentUserId))
                return Unauthorized(new { Error = "Invalid user." });

            if (request?.ActualHours < 0)
            {
                return BadRequest(new
                {
                    Error = "Actual hours cannot be negative."
                });
            }

            try
            {
                var task = await _context.StaffTasks
                    .FirstOrDefaultAsync(x => x.Id == id);

                if (task == null)
                    return NotFound(new { Error = "Task not found." });

                // Only assigned staff can complete.
                if (task.AssignedToId != currentUserId)
                    return Forbid();

                task.Status = "Completed";
                task.CompletedAt = DateTimeHelper.Now();
                task.CompletedById = currentUserId;

                if (request?.ActualHours.HasValue == true)
                {
                    task.ActualHours = request.ActualHours.Value;
                }

                await _context.SaveChangesAsync();

                // Notify the creator / assigner.
                if (task.AssignedById != currentUserId)
                {
                    await SendTaskNotification(
                        task.AssignedById,
                        "Task Completed",
                        $"'{task.Title}' has been completed.",
                        task.Id);
                }

                var result = await GetStaffTaskDto(task.Id);

                await _hub.Clients.All.SendAsync(
                    "StaffTaskCompleted",
                    result);

                return Ok(result);
            }
            catch (Exception)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to complete task."
                });
            }
        }

        // ================================================================
        // GET DROPDOWN
        // ================================================================

        [HttpGet("GetDropdown")]
        public async Task<IActionResult> GetDropdown()
        {
            try
            {
                var users = await _context.Users
                    .AsNoTracking()
                    .OrderBy(u => u.FullName)
                    .Select(u => new DropdownDto
                    {
                        Id = u.Id,
                        Name = u.FullName,
                        DisplayName = u.DisplayName,
                        Email = u.Email,
                        JobTitle = u.JobTitle
                    })
                    .ToListAsync();

                return Ok(new
                {
                    Users = users
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to load dropdown data."
                });
            }
        }

        // ================================================================
        // GET TASK DTO
        // ================================================================

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

                    // PROJECT
                    x.ProjectId,

                    Project = x.Project == null
                        ? null
                        : new
                        {
                            x.Project.Id,
                            x.Project.ProjectCode,
                            x.Project.ProjectTitle
                        },

                    // ASSIGNMENT
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

                    // TASK DETAILS
                    x.Priority,
                    x.Category,
                    x.Status,

                    // SCHEDULE
                    x.StartDate,
                    x.DueDate,
                    x.ReminderAt,

                    // RECURRING
                    x.IsRecurring,
                    x.RecurringType,

                    // TIME
                    x.EstimatedHours,
                    x.ActualHours,

                    // COMPLETION
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

                    // CHECKLIST
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

                    ChecklistTotal = x.Checklists.Count(),

                    ChecklistCompleted =
                        x.Checklists.Count(c => c.IsCompleted)
                })
                .FirstOrDefaultAsync();
        }
        // ================================================================
        // GET SUMMARY
        // ================================================================

        [HttpGet("GetSummary")]
        public async Task<IActionResult> GetSummary()
        {
            if (!TryGetCurrentUserId(out var currentUserId))
                return Unauthorized(new { Error = "Invalid user." });

            try
            {
                var query = _context.StaffTasks
                    .AsNoTracking()
                    .Where(t =>
                        t.AssignedToId == currentUserId ||
                        t.AssignedById == currentUserId);

                // Tasks assigned to the current user.
                // Personal tasks are also assigned to the current user
                // when created or updated through this controller.
                var myTasksQuery = query.Where(t =>
                    t.AssignedToId == currentUserId);

                var myTasks = await myTasksQuery.CountAsync();

                var assignedToOthers = await query.CountAsync(t =>
                    t.AssignedById == currentUserId &&
                    t.AssignedToId != null &&
                    t.AssignedToId != currentUserId);

                var inProgress = await myTasksQuery.CountAsync(t =>
                    t.Status == "InProgress");

                var completed = await myTasksQuery.CountAsync(t =>
                    t.Status == "Completed");

                return Ok(new
                {
                    MyTasks = myTasks,
                    AssignedToOthers = assignedToOthers,
                    InProgress = inProgress,
                    Completed = completed
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to load task summary."
                });
            }
        }

        // ================================================================
        // UPDATE CHECKLIST
        // ================================================================

        [HttpPut("UpdateChecklist")]
        public async Task<IActionResult> UpdateChecklist(
            [FromBody] UpdateStaffTaskChecklistRequest request)
        {
            if (!TryGetCurrentUserId(out var currentUserId))
                return Unauthorized(new { Error = "Invalid user." });

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (request.Id == Guid.Empty)
            {
                return BadRequest(new
                {
                    Error = "Task ID is required."
                });
            }

            try
            {
                var task = await _context.StaffTasks
                    .Include(x => x.Checklists)
                    .FirstOrDefaultAsync(x => x.Id == request.Id);

                if (task == null)
                    return NotFound(new { Error = "Task not found." });

                // Only assigned staff can update checklist.
                if (task.AssignedToId != currentUserId)
                    return Forbid();

                var checklists = request.Checklists
                    ?? new List<UpdateStaffTaskChecklistItemOnlyRequest>();

                var now = DateTimeHelper.Now();

                foreach (var item in checklists)
                {
                    var checklist = task.Checklists.FirstOrDefault(x =>
                        x.Id == item.Id);

                    // Ignore IDs that do not belong to this task.
                    if (checklist == null)
                        continue;

                    checklist.IsCompleted = item.IsCompleted;

                    checklist.CompletedAt = item.IsCompleted
                        ? checklist.CompletedAt ?? now
                        : null;

                    if (item.Sequence > 0)
                        checklist.Sequence = item.Sequence;
                }

                var total = task.Checklists.Count;

                var completed = task.Checklists.Count(
                    x => x.IsCompleted);

                var status = GetTaskStatusFromChecklist(
                    total,
                    completed);

                SetTaskCompletion(
                    task,
                    status,
                    currentUserId);

                await _context.SaveChangesAsync();

                var result = await GetStaffTaskDto(task.Id);

                await _hub.Clients.All.SendAsync(
                    "StaffTaskUpdated",
                    result);

                return Ok(result);
            }
            catch (Exception)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to update checklist."
                });
            }
        }


        private async Task SendTaskNotification(
            Guid userId,
            string title,
            string message,
            Guid taskId)
        {
            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = title,
                Message = message,
                Type = "Task",
                Link = $"/staff-tasks/{taskId}",
                IsRead = false,
                CreatedAt = DateTimeHelper.Now()
            };

            // Save notification to database.
            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();

            // Send real-time notification to the intended user.
            await _hub.Clients
                .Group($"user-{userId}")
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

        private async Task<bool> IsValidProject(Guid? projectId)
        {
            if (!projectId.HasValue)
                return true;

            return await _context.Projects
                .AnyAsync(x => x.Id == projectId.Value);
        }

    }
}