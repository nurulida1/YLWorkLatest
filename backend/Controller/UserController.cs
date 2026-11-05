using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using System.Reflection;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using YLWorks.Data;
using YLWorks.Hubs;
using YLWorks.Model;
using YLWorks.Services;
using WebApplication1.Helpers;

namespace WebApplication1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly EmailService _emailService;
        private readonly IHubContext<NotificationHub> _hub;

        public UsersController(
            AppDbContext context,
            EmailService emailService,
            IHubContext<NotificationHub> hub)
        {
            _context = context;
            _emailService = emailService;
            _hub = hub;
        }

        // =========================================================
        // GET MANY USERS
        // =========================================================
        [Authorize]
        [HttpGet("GetMany")]
        public ActionResult<object> GetMany(
            int page = 1,
            int pageSize = 10,
            string? filter = null,
            string? orderBy = null,
            string? select = null,
            string? includes = null)
        {
            try
            {
                page = Math.Max(page, 1);
                pageSize = Math.Clamp(pageSize, 1, 500);

                var query = _context.Users.AsQueryable();

                if (!string.IsNullOrEmpty(includes))
                {
                    foreach (var include in includes.Split(','))
                    {
                        query = query.Include(include.Trim());
                    }
                }

                if (!string.IsNullOrEmpty(filter))
                {
                    var parameter = Expression.Parameter(
                        typeof(User),
                        "u"
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

                            var propertyInfo = typeof(User).GetProperty(
                                property,
                                BindingFlags.IgnoreCase |
                                BindingFlags.Public |
                                BindingFlags.Instance
                            );

                            if (propertyInfo == null)
                                continue;

                            var propertyAccess = Expression.Property(
                                parameter,
                                propertyInfo
                            );

                            Expression condition;

                            var propertyType =
                                Nullable.GetUnderlyingType(
                                    propertyAccess.Type
                                ) ?? propertyAccess.Type;

                            if (propertyType == typeof(string))
                            {
                                var toLowerMethod = typeof(string).GetMethod(
                                    "ToLower",
                                    Type.EmptyTypes
                                )!;

                                var containsMethod = typeof(string).GetMethod(
                                    "Contains",
                                    new[] { typeof(string) }
                                )!;

                                var propertyToLower = Expression.Call(
                                    propertyAccess,
                                    toLowerMethod
                                );

                                var valueToLower = Expression.Constant(
                                    valueStr.ToLower()
                                );

                                var containsExpr = Expression.Call(
                                    propertyToLower,
                                    containsMethod,
                                    valueToLower
                                );

                                condition = isNotEqual
                                    ? Expression.Not(containsExpr)
                                    : containsExpr;
                            }
                            else if (propertyType == typeof(Guid))
                            {
                                if (!Guid.TryParse(
                                    valueStr,
                                    out var guidValue))
                                    continue;

                                var constant = Expression.Constant(
                                    guidValue
                                );

                                condition = Expression.Equal(
                                    propertyAccess,
                                    constant
                                );

                                if (isNotEqual)
                                    condition = Expression.Not(condition);
                            }
                            else if (propertyType.IsEnum)
                            {
                                if (!Enum.TryParse(
                                    propertyType,
                                    valueStr,
                                    true,
                                    out var enumValue))
                                    continue;

                                var constant = Expression.Constant(
                                    enumValue,
                                    propertyType
                                );

                                condition = Expression.Equal(
                                    propertyAccess,
                                    constant
                                );

                                if (isNotEqual)
                                    condition = Expression.Not(condition);
                            }
                            else
                            {
                                try
                                {
                                    var convertedValue = Convert.ChangeType(
                                        valueStr,
                                        propertyType
                                    );

                                    var constant = Expression.Constant(
                                        convertedValue,
                                        propertyType
                                    );

                                    if (propertyAccess.Type != propertyType)
                                    {
                                        condition = Expression.Equal(
                                            propertyAccess,
                                            Expression.Convert(
                                                constant,
                                                propertyAccess.Type
                                            )
                                        );
                                    }
                                    else
                                    {
                                        condition = Expression.Equal(
                                            propertyAccess,
                                            constant
                                        );
                                    }

                                    if (isNotEqual)
                                        condition = Expression.Not(condition);
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
                        var lambda = Expression.Lambda<Func<User, bool>>(
                            finalExpression,
                            parameter
                        );

                        query = query.Where(lambda);
                    }
                }

                // OrderBy
                if (!string.IsNullOrEmpty(orderBy))
                {
                    var isDesc = orderBy.Contains(
                        "desc",
                        StringComparison.OrdinalIgnoreCase
                    );

                    var fieldName = orderBy
                        .Replace(
                            " desc",
                            "",
                            StringComparison.OrdinalIgnoreCase
                        )
                        .Replace(
                            " asc",
                            "",
                            StringComparison.OrdinalIgnoreCase
                        )
                        .Trim();

                    var propertyInfo = typeof(User).GetProperty(
                        fieldName,
                        BindingFlags.IgnoreCase |
                        BindingFlags.Public |
                        BindingFlags.Instance
                    );

                    if (propertyInfo != null)
                    {
                        query = isDesc
                            ? query.OrderByDescending(
                                x => EF.Property<object>(
                                    x,
                                    propertyInfo.Name
                                )
                            )
                            : query.OrderBy(
                                x => EF.Property<object>(
                                    x,
                                    propertyInfo.Name
                                )
                            );
                    }
                }

                var totalElements = query.Count();

                var items = query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(u => new
                    {
                        u.Id,
                        u.EmployeeNo,
                        u.FullName,
                        u.DisplayName,
                        u.Email,
                        u.SystemRole,
                        u.JobTitle,
                        u.IsActive,
                        u.LastLoginAt,
                        u.ContactNo,
                        u.Gender,
                        u.CreatedAt,
                        u.JoinedDate,
                        u.Status,
                        u.MonthlySalary,

                        WorkStartTime = u.WorkStartTime.HasValue
                            ? string.Format(
                                "{0:D2}:{1:D2}",
                                (int)u.WorkStartTime.Value.TotalHours,
                                u.WorkStartTime.Value.Minutes
                            )
                            : null,

                        WorkEndTime = u.WorkEndTime.HasValue
                            ? string.Format(
                                "{0:D2}:{1:D2}",
                                (int)u.WorkEndTime.Value.TotalHours,
                                u.WorkEndTime.Value.Minutes
                            )
                            : null,

                        u.UsesRestDayHalfDay,

                        RestDayHalfDayStart = u.RestDayHalfDayStart.HasValue
                            ? string.Format(
                                "{0:D2}:{1:D2}",
                                (int)u.RestDayHalfDayStart.Value.TotalHours,
                                u.RestDayHalfDayStart.Value.Minutes
                            )
                            : null,

                        RestDayHalfDayEnd = u.RestDayHalfDayEnd.HasValue
                            ? string.Format(
                                "{0:D2}:{1:D2}",
                                (int)u.RestDayHalfDayEnd.Value.TotalHours,
                                u.RestDayHalfDayEnd.Value.Minutes
                            )
                            : null,

                        HodIds = u.ReportingManagers
                            .Select(rm => rm.ManagerId)
                            .ToList(),

                        DepartmentIds = u.Departments
                            .Select(d => d.Id)
                            .ToList(),

                        Departments = u.Departments
                            .Select(d => new
                            {
                                d.Id,
                                d.Name
                            })
                            .ToList()
                    })
                    .ToList();

                if (!string.IsNullOrEmpty(select))
                {
                    var selectedFields = select
                        .Split(',')
                        .Select(f => f.Trim())
                        .ToList();

                    var projected = items.Select(item =>
                    {
                        var dict = new Dictionary<string, object?>();

                        foreach (var field in selectedFields)
                        {
                            var value = item.GetType()
                                .GetProperty(
                                    field,
                                    BindingFlags.IgnoreCase |
                                    BindingFlags.Public |
                                    BindingFlags.Instance
                                )
                                ?.GetValue(item);

                            dict[field] = value;
                        }

                        return dict;
                    });

                    return Ok(new
                    {
                        Data = projected,
                        TotalElements = totalElements
                    });
                }

                return Ok(new
                {
                    Data = items,
                    TotalElements = totalElements
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);

                return StatusCode(500, new
                {
                    Error = "An unexpected error occurred."
                });
            }
        }

        // =========================================================
        // GET ONE USER
        // =========================================================
        [Authorize]
        [HttpGet("GetOne")]
        public ActionResult<object> GetOne(
            int page = 1,
            int pageSize = 1,
            string? filter = null,
            string? orderBy = null,
            string? select = null,
            string? includes = null)
        {
            try
            {
                page = Math.Max(page, 1);
                pageSize = Math.Clamp(pageSize, 1, 500);

                var query = _context.Users
                    .Include(u => u.ReportingManagers)
                    .Include(u => u.Departments)
                    .AsQueryable();

                // Includes
                if (!string.IsNullOrEmpty(includes))
                {
                    foreach (var include in includes.Split(','))
                    {
                        var navProp = include.Trim();

                        if (string.IsNullOrEmpty(navProp))
                            continue;

                        var propInfo = typeof(User).GetProperty(
                            navProp,
                            BindingFlags.IgnoreCase |
                            BindingFlags.Public |
                            BindingFlags.Instance
                        );

                        if (propInfo != null)
                            query = query.Include(propInfo.Name);
                    }
                }

                // Filter
                if (!string.IsNullOrEmpty(filter))
                {
                    var parts = filter.Split('=');

                    if (parts.Length == 2)
                    {
                        var propertyName = parts[0].Trim();
                        var valueStr = parts[1].Trim();

                        var propertyInfo = typeof(User).GetProperty(
                            propertyName,
                            BindingFlags.IgnoreCase |
                            BindingFlags.Public |
                            BindingFlags.Instance
                        );

                        if (propertyInfo != null)
                        {
                            try
                            {
                                var propertyType =
                                    Nullable.GetUnderlyingType(
                                        propertyInfo.PropertyType
                                    ) ?? propertyInfo.PropertyType;

                                object typedValue;

                                if (propertyType == typeof(Guid))
                                    typedValue = Guid.Parse(valueStr);
                                else if (propertyType.IsEnum)
                                    typedValue = Enum.Parse(
                                        propertyType,
                                        valueStr,
                                        true
                                    );
                                else
                                    typedValue = Convert.ChangeType(
                                        valueStr,
                                        propertyType
                                    );

                                var parameter = Expression.Parameter(
                                    typeof(User),
                                    "x"
                                );

                                var propertyAccess = Expression.Property(
                                    parameter,
                                    propertyInfo
                                );

                                var constant = Expression.Constant(
                                    typedValue,
                                    propertyType
                                );

                                Expression comparison;

                                if (propertyAccess.Type != propertyType)
                                {
                                    comparison = Expression.Equal(
                                        propertyAccess,
                                        Expression.Convert(
                                            constant,
                                            propertyAccess.Type
                                        )
                                    );
                                }
                                else
                                {
                                    comparison = Expression.Equal(
                                        propertyAccess,
                                        constant
                                    );
                                }

                                var lambda = Expression.Lambda<Func<User, bool>>(
                                    comparison,
                                    parameter
                                );

                                query = query.Where(lambda);
                            }
                            catch
                            {
                                // Ignore invalid filter.
                            }
                        }
                    }
                }

                // OrderBy
                if (!string.IsNullOrEmpty(orderBy))
                {
                    var isDesc = orderBy.Contains(
                        "desc",
                        StringComparison.OrdinalIgnoreCase
                    );

                    var fieldName = orderBy
                        .Replace(
                            " desc",
                            "",
                            StringComparison.OrdinalIgnoreCase
                        )
                        .Replace(
                            " asc",
                            "",
                            StringComparison.OrdinalIgnoreCase
                        )
                        .Trim();

                    var propertyInfo = typeof(User).GetProperty(
                        fieldName,
                        BindingFlags.IgnoreCase |
                        BindingFlags.Public |
                        BindingFlags.Instance
                    );

                    if (propertyInfo != null)
                    {
                        query = isDesc
                            ? query.OrderByDescending(
                                x => EF.Property<object>(
                                    x,
                                    propertyInfo.Name
                                )
                            )
                            : query.OrderBy(
                                x => EF.Property<object>(
                                    x,
                                    propertyInfo.Name
                                )
                            );
                    }
                }

                // Paging
                var item = query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .FirstOrDefault();

                if (item == null)
                    return Ok(new { Data = new { } });

                // Only allow safe fields to be selected.
                if (!string.IsNullOrEmpty(select))
                {
                    var allowedFields = new HashSet<string>(
                        new[]
                        {
                            "Id",
                            "EmployeeNo",
                            "FullName",
                            "DisplayName",
                            "Email",
                            "SystemRole",
                            "JobTitle",
                            "IsActive",
                            "LastLoginAt",
                            "ContactNo",
                            "Gender",
                            "CreatedAt",
                            "UpdatedAt",
                            "JoinedDate",
                            "Status",
                            "MonthlySalary",
                            "WorkStartTime",
                            "WorkEndTime",
                            "UsesRestDayHalfDay",
                            "RestDayHalfDayStart",
                            "RestDayHalfDayEnd",
                            "HodIds",
                            "DepartmentIds",
                            "Departments"
                        },
                        StringComparer.OrdinalIgnoreCase
                    );

                    var selectedFields = select
                        .Split(',')
                        .Select(f => f.Trim())
                        .ToList();

                    var dict = new Dictionary<string, object?>();

                    foreach (var field in selectedFields)
                    {
                        if (!allowedFields.Contains(field))
                            continue;

                        object? value = null;

                        switch (field.ToLowerInvariant())
                        {
                            case "hodids":
                                value = item.ReportingManagers
                                    .Select(rm => rm.ManagerId)
                                    .ToList();
                                break;

                            case "departmentids":
                                value = item.Departments
                                    .Select(d => d.Id)
                                    .ToList();
                                break;

                            case "departments":
                                value = item.Departments
                                    .Select(d => new
                                    {
                                        d.Id,
                                        d.Name
                                    })
                                    .ToList();
                                break;

                            case "workstarttime":
                                value = item.WorkStartTime.HasValue
                                    ? $"{(int)item.WorkStartTime.Value.TotalHours:D2}:{item.WorkStartTime.Value.Minutes:D2}"
                                    : null;
                                break;

                            case "workendtime":
                                value = item.WorkEndTime.HasValue
                                    ? $"{(int)item.WorkEndTime.Value.TotalHours:D2}:{item.WorkEndTime.Value.Minutes:D2}"
                                    : null;
                                break;

                            case "restdayhalfdaystart":
                                value = item.RestDayHalfDayStart.HasValue
                                    ? $"{(int)item.RestDayHalfDayStart.Value.TotalHours:D2}:{item.RestDayHalfDayStart.Value.Minutes:D2}"
                                    : null;
                                break;

                            case "restdayhalfdayend":
                                value = item.RestDayHalfDayEnd.HasValue
                                    ? $"{(int)item.RestDayHalfDayEnd.Value.TotalHours:D2}:{item.RestDayHalfDayEnd.Value.Minutes:D2}"
                                    : null;
                                break;

                            default:
                                value = item.GetType()
                                    .GetProperty(
                                        field,
                                        BindingFlags.IgnoreCase |
                                        BindingFlags.Public |
                                        BindingFlags.Instance
                                    )
                                    ?.GetValue(item);
                                break;
                        }

                        dict[field] = value;
                    }

                    return Ok(new { Data = dict });
                }

                return Ok(new
                {
                    item.Id,
                    item.EmployeeNo,
                    item.FullName,
                    item.DisplayName,
                    item.Email,
                    item.SystemRole,
                    item.JobTitle,
                    item.IsActive,
                    item.LastLoginAt,
                    item.ContactNo,
                    item.Gender,
                    item.CreatedAt,
                    item.JoinedDate,

                    HodIds = item.ReportingManagers
                        .Select(rm => rm.ManagerId)
                        .ToList(),

                    DepartmentIds = item.Departments
                        .Select(d => d.Id)
                        .ToList(),

                    Departments = item.Departments
                        .Select(d => new
                        {
                            d.Id,
                            d.Name
                        })
                        .ToList()
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);

                return StatusCode(500, new
                {
                    Error = "An unexpected error occurred."
                });
            }
        }

        // =========================================================
        // UPDATE USER STATUS
        // =========================================================
        [Authorize(Roles = "SuperAdmin,HR,Management")]
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateUserStatus(
            Guid id,
            [FromQuery] bool isActive)
        {
            var user = await _context.Users.FindAsync(id);

            if (user == null)
                return NotFound(new { Error = "User not found." });

            user.IsActive = isActive;
            user.UpdatedAt = DateTimeHelper.Now();

            if (!isActive)
            {
                user.RefreshToken = null;
                user.RefreshTokenExpiryTime = null;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                Success = true,
                Status = user.IsActive
            });
        }

        // =========================================================
        // REGISTER
        // =========================================================
        [AllowAnonymous]
        [HttpPost("Register")]
        public async Task<IActionResult> Register(
            [FromBody] RegisterRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                if (request.Password != request.ConfirmPassword)
                {
                    return Ok(new
                    {
                        Success = false,
                        Message = "Passwords do not match."
                    });
                }

                if (await _context.Users.AnyAsync(
                    u => u.Email == request.Email))
                {
                    return Ok(new
                    {
                        Success = false,
                        Message = "Email already in use."
                    });
                }

                var newUser = new User
                {
                    Id = Guid.NewGuid(),
                    EmployeeNo = GenerateEmployeeNo(),
                    FullName = request.FullName,
                    DisplayName = request.DisplayName,
                    Email = request.Email,
                    ContactNo = request.ContactNo,
                    JobTitle = request.JobTitle,
                    SystemRole = "Staff",
                    JoinedDate = request.JoinedDate,
                    Gender = request.Gender,
                    IsActive = false,
                    Status = "Pending",
                    CreatedAt = DateTimeHelper.Now()
                };

                // Assign departments
                if (request.DepartmentIds?.Any() == true)
                {
                    var departments = await _context.Departments
                        .Where(d => request.DepartmentIds.Contains(d.Id))
                        .ToListAsync();

                    newUser.Departments = departments;
                }

                // Assign reporting managers
                if (request.HodIds?.Any() == true)
                {
                    var managerIds = request.HodIds
                        .Where(id => id != Guid.Empty && id != newUser.Id)
                        .Distinct()
                        .ToList();

                    foreach (var managerId in managerIds)
                    {
                        newUser.ReportingManagers.Add(
                            new UserReportingManager
                            {
                                UserId = newUser.Id,
                                ManagerId = managerId
                            }
                        );
                    }
                }

                var passwordHasher = new PasswordHasher<User>();

                newUser.Password = passwordHasher.HashPassword(
                    newUser,
                    request.Password
                );

                _context.Users.Add(newUser);

                _context.ActivityLogs.Add(new ActivityLog
                {
                    Id = Guid.NewGuid(),
                    UserId = newUser.Id,
                    Module = "User",
                    Action = "Register",
                    Description = $"{newUser.FullName} registered a new account.",
                    Icon = "pi pi-user-plus",
                    Color = "blue",
                    CreatedAt = DateTimeHelper.Now()
                });

                await _context.SaveChangesAsync();

                // Notify active SuperAdmins
                var superAdmins = await _context.Users
                    .Where(u =>
                        u.SystemRole == "SuperAdmin" &&
                        u.IsActive)
                    .Select(u => u.Id)
                    .ToListAsync();

                var notificationMessage =
                    $"{newUser.FullName} has requested to register as {newUser.JobTitle}.";

                var notifications = new List<Notification>();

                foreach (var adminId in superAdmins)
                {
                    notifications.Add(new Notification
                    {
                        Id = Guid.NewGuid(),
                        UserId = adminId,
                        Title = "New User Registration",
                        Message = notificationMessage,
                        Type = "Registration",
                        Link = "/user-management",
                        IsRead = false,
                        CreatedAt = DateTimeHelper.Now()
                    });
                }

                if (notifications.Any())
                {
                    _context.Notifications.AddRange(notifications);
                    await _context.SaveChangesAsync();
                }

                // SignalR notifications
                foreach (var notification in notifications)
                {
                    await _hub.Clients
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

                return Ok(new
                {
                    Success = true,
                    Message = "Registration submitted successfully. Please wait for administrator approval.",
                    User = new
                    {
                        newUser.Id,
                        newUser.EmployeeNo,
                        newUser.FullName,
                        newUser.Email,
                        newUser.Status
                    }
                });
            }
            catch (Exception ex)
            {
                var innerException = ex;

                while (innerException.InnerException != null)
                {
                    innerException = innerException.InnerException;
                }

                Console.WriteLine("REGISTRATION ERROR: " + ex);
                Console.WriteLine("INNER EXCEPTION: " + innerException.Message);

                return StatusCode(500, new
                {
                    success = false,
                    error = "Registration failed.",
                    details = innerException.Message
                });
            }
        }

        // =========================================================
        // ADMIN CREATE USER
        // =========================================================
        [Authorize(Roles = "HOD,Management,HR,SuperAdmin")]
        [HttpPost("AdminCreate")]
        public async Task<IActionResult> AdminCreate(
            [FromBody] RegisterRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (await _context.Users.AnyAsync(
                x => x.Email == request.Email))
            {
                return Ok(new
                {
                    Success = false,
                    Message = "Email already exists."
                });
            }

            var user = new User
            {
                Id = Guid.NewGuid(),
                EmployeeNo = GenerateEmployeeNo(),
                FullName = request.FullName,
                DisplayName = request.DisplayName,
                Email = request.Email,
                ContactNo = request.ContactNo,
                JobTitle = request.JobTitle,
                SystemRole = request.SystemRole ?? "Staff",
                JoinedDate = request.JoinedDate,
                Gender = request.Gender,
                Status = "Approved",
                IsActive = true,
                CreatedAt = DateTimeHelper.Now()
            };

            // Department assignment
            if (request.DepartmentIds?.Any() == true)
            {
                var departments = await _context.Departments
                    .Where(x => request.DepartmentIds.Contains(x.Id))
                    .ToListAsync();

                user.Departments = departments;
            }

            // Reporting manager assignment
            if (request.HodIds?.Any() == true)
            {
                var managerIds = request.HodIds
                    .Where(id => id != Guid.Empty && id != user.Id)
                    .Distinct();

                foreach (var managerId in managerIds)
                {
                    user.ReportingManagers.Add(
                        new UserReportingManager
                        {
                            UserId = user.Id,
                            ManagerId = managerId
                        }
                    );
                }
            }

            var passwordHasher = new PasswordHasher<User>();

            user.Password = passwordHasher.HashPassword(
                user,
                request.Password
            );

            _context.Users.Add(user);

            _context.ActivityLogs.Add(new ActivityLog
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                Module = "User",
                Action = "Create",
                Description = $"Admin created account for {user.FullName}",
                Icon = "pi pi-user-plus",
                Color = "green",
                CreatedAt = DateTimeHelper.Now()
            });

            await _context.SaveChangesAsync();

            // NOTE:
            // This currently preserves your existing account-created email.
            // Replace it with a secure password-setup link before production.
            try
            {
                _emailService.SendAccountCreatedEmail(
                    user.Email,
                    user.FullName,
                    request.Password
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Account email sending failed: {ex}");
            }

            return Ok(new
            {
                Success = true,
                Message = "User created successfully.",
                User = new
                {
                    user.Id,
                    user.EmployeeNo,
                    user.FullName,
                    user.DisplayName,
                    user.Email,
                    user.SystemRole,
                    user.JobTitle,
                    user.Status,
                    user.IsActive
                }
            });
        }

        // =========================================================
        // GENERATE EMPLOYEE NUMBER
        // =========================================================
        private string GenerateEmployeeNo()
        {
            var lastEmployee = _context.Users
                .OrderByDescending(u => u.CreatedAt)
                .FirstOrDefault();

            int nextNumber = 1;

            if (lastEmployee != null &&
                lastEmployee.EmployeeNo.StartsWith("EMP-"))
            {
                var lastNumberStr =
                    lastEmployee.EmployeeNo.Substring(4);

                if (int.TryParse(lastNumberStr, out int lastNumber))
                    nextNumber = lastNumber + 1;
            }

            return $"EMP-{nextNumber:D4}";
        }

        // =========================================================
        // CHANGE PASSWORD
        // =========================================================
        [Authorize]
        [HttpPut("ChangePassword")]
        public async Task<IActionResult> ChangePassword(
            [FromBody] ChangePasswordRequest request)
        {
            if (!ModelState.IsValid)
            {
                return Ok(new
                {
                    Success = false,
                    Message = "Invalid password request."
                });
            }

            try
            {
                var userIdValue = User.FindFirstValue(
                    ClaimTypes.NameIdentifier
                );

                if (!Guid.TryParse(userIdValue, out var userId))
                    return Unauthorized();

                var user = await _context.Users.FindAsync(userId);

                if (user == null)
                {
                    return Ok(new
                    {
                        Success = false,
                        Message = "User not found."
                    });
                }

                if (request.NewPassword != request.ConfirmPassword)
                {
                    return Ok(new
                    {
                        Success = false,
                        Message = "Passwords do not match."
                    });
                }

                var passwordHasher = new PasswordHasher<User>();

                var verificationResult = passwordHasher.VerifyHashedPassword(
                    user,
                    user.Password,
                    request.CurrentPassword
                );

                if (verificationResult == PasswordVerificationResult.Failed)
                {
                    return Ok(new
                    {
                        Success = false,
                        Message = "Current password is incorrect."
                    });
                }

                if (request.CurrentPassword == request.NewPassword)
                {
                    return Ok(new
                    {
                        Success = false,
                        Message = "New password must be different from current password."
                    });
                }

                user.Password = passwordHasher.HashPassword(
                    user,
                    request.NewPassword
                );

                user.UpdatedAt = DateTimeHelper.Now();

                // Revoke refresh token.
                user.RefreshToken = null;
                user.RefreshTokenExpiryTime = null;

                // Invalidate all outstanding reset tokens.
                var resetTokens = await _context.PasswordResetTokens
                    .Where(x => x.UserId == user.Id)
                    .ToListAsync();

                _context.PasswordResetTokens.RemoveRange(resetTokens);

                _context.ActivityLogs.Add(new ActivityLog
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    Module = "User",
                    Action = "Change Password",
                    Description = $"{user.FullName} changed their password.",
                    Icon = "pi pi-key",
                    Color = "orange",
                    CreatedAt = DateTimeHelper.Now()
                });

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    Success = true,
                    Message = "Password changed successfully. Please login again."
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);

                return StatusCode(500, new
                {
                    Success = false,
                    Message = "Failed to change password."
                });
            }
        }
        // =========================================================
        // RESET PASSWORD
        // =========================================================
        [AllowAnonymous]
        [HttpPost("ResetPassword")]
        public async Task<IActionResult> ResetPassword(
            [FromBody] ResetPasswordRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                if (request.NewPassword != request.ConfirmPassword)
                {
                    return BadRequest(new
                    {
                        Success = false,
                        Message = "Passwords do not match."
                    });
                }

                await using var transaction =
                    await _context.Database.BeginTransactionAsync();

                var now = DateTimeHelper.Now();

                var hashedToken = HashResetToken(request.Token);

                var resetToken = await _context.PasswordResetTokens
                    .Include(t => t.User)
                    .FirstOrDefaultAsync(t =>
                        t.Token == hashedToken &&
                        t.ExpiryTime > now &&
                        t.UsedAt == null
                    );

                if (resetToken == null || !resetToken.User.IsActive)
                {
                    return BadRequest(new
                    {
                        Success = false,
                        Message = "Invalid or expired token."
                    });
                }

                var user = resetToken.User;

                var passwordHasher = new PasswordHasher<User>();

                user.Password = passwordHasher.HashPassword(
                    user,
                    request.NewPassword
                );

                user.UpdatedAt = now;

                // Revoke existing refresh token.
                user.RefreshToken = null;
                user.RefreshTokenExpiryTime = null;

                _context.ActivityLogs.Add(new ActivityLog
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    Module = "User",
                    Action = "Reset Password",
                    Description = $"Password was reset for {user.FullName}.",
                    Icon = "pi pi-refresh",
                    Color = "blue",
                    CreatedAt = now
                });

                // Invalidate all reset tokens for this user.
                var userResetTokens = await _context.PasswordResetTokens
                    .Where(t => t.UserId == user.Id)
                    .ToListAsync();

                _context.PasswordResetTokens.RemoveRange(userResetTokens);

                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                return Ok(new
                {
                    Success = true,
                    Message = "Password has been reset successfully."
                });
            }
            catch (DbUpdateConcurrencyException)
            {
                return BadRequest(new
                {
                    Success = false,
                    Message = "Invalid or expired token."
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);

                return StatusCode(500, new
                {
                    Success = false,
                    Error = "Failed to reset password."
                });
            }
        }

        // =========================================================
        // GET PROFILE
        // =========================================================
        [Authorize]
        [HttpGet("Profile")]
        public IActionResult GetProfile()
        {
            try
            {
                var userId = User.FindFirst(
                    ClaimTypes.NameIdentifier
                )?.Value;

                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new
                    {
                        Error = "User ID not found in token."
                    });
                }

                if (!Guid.TryParse(userId, out var parsedUserId))
                    return Unauthorized();

                var user = _context.Users.Find(parsedUserId);

                if (user == null)
                    return NotFound(new { Error = "User not found." });

                var profile = new
                {
                    user.Id,
                    user.Email,
                    user.IsActive,
                    user.CreatedAt,
                    user.UpdatedAt
                };

                return Ok(profile);
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);

                return StatusCode(500, new
                {
                    Error = "Failed to retrieve profile."
                });
            }
        }

        // =========================================================
        // FORGOT PASSWORD
        // =========================================================
        [AllowAnonymous]
        [HttpPost("ForgotPassword")]
        public async Task<IActionResult> ForgotPassword(
            [FromQuery] string Email)
        {
            if (string.IsNullOrWhiteSpace(Email))
            {
                return BadRequest(new
                {
                    Success = false,
                    Message = "Email is required."
                });
            }

            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(
                    u => u.Email == Email
                );

                // Do not reveal whether the email exists.
                if (user == null || !user.IsActive)
                {
                    return Ok(new
                    {
                        Success = true,
                        Message = "If your email is registered, you will receive reset instructions shortly."
                    });
                }

                // Remove previous reset tokens.
                var previousTokens = await _context.PasswordResetTokens
                    .Where(x => x.UserId == user.Id)
                    .ToListAsync();

                _context.PasswordResetTokens.RemoveRange(previousTokens);

                // Generate a secure random token.
                var token = Convert.ToBase64String(
                    RandomNumberGenerator.GetBytes(48)
                );

                var expiry = DateTimeHelper.Now().AddMinutes(30);

                var resetToken = new PasswordResetToken
                {
                    UserId = user.Id,
                    Token = HashResetToken(token),
                    ExpiryTime = expiry,
                    UsedAt = null
                };

                _context.PasswordResetTokens.Add(resetToken);

                await _context.SaveChangesAsync();

                // TODO: Move frontend URL into appsettings.json.
                var resetLink =
                    $"http://localhost:4200/reset-password?token={Uri.EscapeDataString(token)}";

                try
                {
                    _emailService.SendResetEmail(
                        user.Email,
                        resetLink
                    );
                }
                catch (Exception ex)
                {
                    Console.WriteLine(
                        $"Reset email sending failed: {ex}"
                    );

                    _context.PasswordResetTokens.Remove(resetToken);
                    await _context.SaveChangesAsync();

                    return StatusCode(500, new
                    {
                        Success = false,
                        Message = "Failed to send reset password link."
                    });
                }

                return Ok(new
                {
                    Success = true,
                    Message = "If your email is registered, you will receive reset instructions shortly."
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);

                return StatusCode(500, new
                {
                    Success = false,
                    Error = "Failed to send reset password link."
                });
            }
        }

        // =========================================================
        // DASHBOARD COUNTS
        // =========================================================
        [Authorize]
        [HttpGet("DashboardCounts")]
        public IActionResult GetDashboardCounts()
        {
            try
            {
                var totalUsers = _context.Users.Count();

                var activeUsers = _context.Users
                    .Count(u => u.IsActive);

                var inactiveUsers = _context.Users
                    .Count(u => !u.IsActive);

                var pendingUsers = _context.Users
                    .Count(u => u.Status == "Pending");

                return Ok(new
                {
                    TotalUsers = totalUsers,
                    ActiveUsers = activeUsers,
                    InactiveUsers = inactiveUsers,
                    PendingUsers = pendingUsers
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);

                return StatusCode(500, new
                {
                    Error = "Failed to get dashboard counts."
                });
            }
        }

        // =========================================================
        // UPDATE USER
        // =========================================================
        [Authorize(Roles = "HOD,Management,HR,SuperAdmin")]
        [HttpPut("Update/{id}")]
        public async Task<IActionResult> UpdateUser(
            Guid id,
            [FromBody] UpdateUserRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var currentUserIdClaim = User.FindFirst(
                    ClaimTypes.NameIdentifier
                )?.Value;

                Guid? currentUserId = null;

                if (Guid.TryParse(
                    currentUserIdClaim,
                    out var parsedId))
                {
                    currentUserId = parsedId;
                }

                var actorName = User.FindFirst(
                    ClaimTypes.Name
                )?.Value ?? "System";

                var user = await _context.Users
                    .Include(u => u.Departments)
                    .Include(u => u.ReportingManagers)
                    .FirstOrDefaultAsync(u => u.Id == id);

                if (user == null)
                {
                    return NotFound(new
                    {
                        Success = false,
                        Message = "User not found."
                    });
                }

                // Prevent duplicate email.
                if (!string.IsNullOrWhiteSpace(request.Email) &&
                    request.Email != user.Email)
                {
                    bool emailExists = await _context.Users
                        .AnyAsync(x =>
                            x.Email == request.Email &&
                            x.Id != id
                        );

                    if (emailExists)
                    {
                        return Ok(new
                        {
                            Success = false,
                            Message = "Email already in use."
                        });
                    }
                }

                // Update user fields.
                if (!string.IsNullOrWhiteSpace(request.FullName))
                    user.FullName = request.FullName;

                if (!string.IsNullOrWhiteSpace(request.DisplayName))
                    user.DisplayName = request.DisplayName;

                if (!string.IsNullOrWhiteSpace(request.ContactNo))
                    user.ContactNo = request.ContactNo;

                if (!string.IsNullOrWhiteSpace(request.Email))
                    user.Email = request.Email;

                if (!string.IsNullOrWhiteSpace(request.JobTitle))
                    user.JobTitle = request.JobTitle;

                if (!string.IsNullOrWhiteSpace(request.SystemRole))
                    user.SystemRole = request.SystemRole;

                if (request.JoinedDate.HasValue)
                    user.JoinedDate = request.JoinedDate.Value;

                if (!string.IsNullOrWhiteSpace(request.Gender))
                    user.Gender = request.Gender;

                if (request.MonthlySalary.HasValue)
                    user.MonthlySalary = request.MonthlySalary.Value;

                // Work schedule.
                if (request.ClearWorkScheduleOverride == true)
                {
                    user.WorkStartTime = null;
                    user.WorkEndTime = null;
                    user.UsesRestDayHalfDay = null;
                    user.RestDayHalfDayStart = null;
                    user.RestDayHalfDayEnd = null;
                }
                else
                {
                    if (request.WorkStartTime != null)
                    {
                        user.WorkStartTime =
                            YLWorks.Services.Claims.ClaimSettingsService.ParseOptionalTime(
                                string.IsNullOrWhiteSpace(request.WorkStartTime)
                                    ? null
                                    : request.WorkStartTime
                            );
                    }

                    if (request.WorkEndTime != null)
                    {
                        user.WorkEndTime =
                            YLWorks.Services.Claims.ClaimSettingsService.ParseOptionalTime(
                                string.IsNullOrWhiteSpace(request.WorkEndTime)
                                    ? null
                                    : request.WorkEndTime
                            );
                    }

                    if (request.UsesRestDayHalfDay.HasValue)
                    {
                        user.UsesRestDayHalfDay =
                            request.UsesRestDayHalfDay;
                    }

                    if (request.RestDayHalfDayStart != null)
                    {
                        user.RestDayHalfDayStart =
                            YLWorks.Services.Claims.ClaimSettingsService.ParseOptionalTime(
                                string.IsNullOrWhiteSpace(request.RestDayHalfDayStart)
                                    ? null
                                    : request.RestDayHalfDayStart
                            );
                    }

                    if (request.RestDayHalfDayEnd != null)
                    {
                        user.RestDayHalfDayEnd =
                            YLWorks.Services.Claims.ClaimSettingsService.ParseOptionalTime(
                                string.IsNullOrWhiteSpace(request.RestDayHalfDayEnd)
                                    ? null
                                    : request.RestDayHalfDayEnd
                            );
                    }
                }

                // Update reporting managers.
                if (request.HodIds != null)
                {
                    var oldManagers = await _context.UserReportingManagers
                        .Where(x => x.UserId == user.Id)
                        .ToListAsync();

                    _context.UserReportingManagers.RemoveRange(oldManagers);

                    var managerIds = request.HodIds
                        .Where(x =>
                            x != Guid.Empty &&
                            x != user.Id
                        )
                        .Distinct()
                        .ToList();

                    foreach (var managerId in managerIds)
                    {
                        _context.UserReportingManagers.Add(
                            new UserReportingManager
                            {
                                UserId = user.Id,
                                ManagerId = managerId
                            }
                        );
                    }
                }

                // Update departments.
                if (request.DepartmentIds != null)
                {
                    user.Departments.Clear();

                    var departments = await _context.Departments
                        .Where(d => request.DepartmentIds.Contains(d.Id))
                        .ToListAsync();

                    foreach (var department in departments)
                    {
                        user.Departments.Add(department);
                    }
                }

                user.UpdatedAt = DateTimeHelper.Now();

                _context.Users.Update(user);

                _context.ActivityLogs.Add(new ActivityLog
                {
                    Id = Guid.NewGuid(),
                    UserId = currentUserId,
                    Module = "User",
                    Action = "Update",
                    Description =
                        $"{actorName} updated the profile of {user.FullName} ({user.EmployeeNo}).",
                    Icon = "pi pi-user-edit",
                    Color = "orange",
                    CreatedAt = DateTimeHelper.Now()
                });

                await _context.SaveChangesAsync();

                await _hub.Clients.All.SendAsync("ReceiveNotification", new
                {
                    Title = "User Updated",
                    Message = $"{user.FullName}'s profile has been updated.",
                    Type = "success",
                    Time = DateTimeHelper.Now()
                });

                var result = new UserDto
                {
                    Id = user.Id,
                    FullName = user.FullName,
                    DisplayName = user.DisplayName,
                    ContactNo = user.ContactNo,
                    EmployeeNo = user.EmployeeNo,
                    JobTitle = user.JobTitle,
                    Email = user.Email,
                    SystemRole = user.SystemRole,
                    JoinedDate = user.JoinedDate,
                    Gender = user.Gender,

                    HodIds = user.ReportingManagers
                        .Select(rm => rm.ManagerId)
                        .ToList(),

                    DepartmentIds = user.Departments
                        .Select(d => d.Id)
                        .ToList(),

                    Departments = user.Departments
                        .Select(d => new UserDepartmentDto
                        {
                            Id = d.Id,
                            Name = d.Name
                        })
                        .ToList(),

                    MonthlySalary = user.MonthlySalary,

                    WorkStartTime = user.WorkStartTime.HasValue
                        ? YLWorks.Services.Claims.ClaimSettingsService.FormatTime(
                            user.WorkStartTime.Value
                        )
                        : null,

                    WorkEndTime = user.WorkEndTime.HasValue
                        ? YLWorks.Services.Claims.ClaimSettingsService.FormatTime(
                            user.WorkEndTime.Value
                        )
                        : null,

                    UsesRestDayHalfDay = user.UsesRestDayHalfDay,

                    RestDayHalfDayStart = user.RestDayHalfDayStart.HasValue
                        ? YLWorks.Services.Claims.ClaimSettingsService.FormatTime(
                            user.RestDayHalfDayStart.Value
                        )
                        : null,

                    RestDayHalfDayEnd = user.RestDayHalfDayEnd.HasValue
                        ? YLWorks.Services.Claims.ClaimSettingsService.FormatTime(
                            user.RestDayHalfDayEnd.Value
                        )
                        : null,

                    UpdatedAt = user.UpdatedAt,
                    CreatedAt = user.CreatedAt,
                    LastLoginAt = user.LastLoginAt,
                    IsActive = user.IsActive
                };

                return Ok(new
                {
                    Success = true,
                    User = result
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);

                return StatusCode(500, new
                {
                    Success = false,
                    Error = "Failed to update user.",
                    Details = ex.InnerException?.Message ?? ex.Message
                });
            }
        }

        // =========================================================
        // USER APPROVAL
        // =========================================================
        [Authorize(Roles = "SuperAdmin,HR,Management")]
        [HttpPut("Approval/{id}")]
        public async Task<IActionResult> Approval(
            Guid id,
            [FromBody] ApprovalRequest request)
        {
            var user = await _context.Users
                .Include(x => x.Departments)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (user == null)
                return NotFound(new { Error = "User not found." });

            if (request.Status != "Approved" &&
                request.Status != "Rejected")
            {
                return BadRequest(new
                {
                    Error = "Invalid approval status."
                });
            }

            user.Status = request.Status;

            if (request.Status == "Approved")
            {
                user.SystemRole = request.SystemRole;
                user.IsActive = true;
                user.RejectReason = null;

                user.Departments = await _context.Departments
                    .Where(x => request.DepartmentIds.Contains(x.Id))
                    .ToListAsync();
            }
            else
            {
                user.IsActive = false;
                user.RejectReason = request.Reason;

                // Revoke refresh token when rejected.
                user.RefreshToken = null;
                user.RefreshTokenExpiryTime = null;
            }

            await _context.SaveChangesAsync();

            bool emailSent = false;

            try
            {
                if (request.Status == "Approved")
                {
                    _emailService.SendApprovalEmail(
                        user.Email,
                        user.FullName
                    );
                }
                else
                {
                    _emailService.SendRejectionEmail(
                        user.Email,
                        user.FullName,
                        request.Reason
                    );
                }

                emailSent = true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Email sending failed: {ex}");
            }

            return Ok(new
            {
                Success = true,
                Message = "User status updated successfully.",
                EmailSent = emailSent
            });
        }

        // =========================================================
        // HASH RESET TOKEN
        // =========================================================
        private static string HashResetToken(string token)
        {
            var hash = SHA256.HashData(
                Encoding.UTF8.GetBytes(token)
            );

            return Convert.ToHexString(hash);
        }
    }
}