using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Linq.Expressions;
using System.Reflection;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using YLWorks.Data;
using YLWorks.Hubs;
using YLWorks.Model;
using YLWorks.Services;

namespace WebApplication1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly EmailService _emailService;
        private readonly IHubContext<NotificationHub> _hub;
        private readonly IConfiguration _config;

        public UsersController(AppDbContext context, EmailService emailService, IHubContext<NotificationHub> hub, IConfiguration config)
        {
            _context = context;
            _emailService = emailService;
            _hub = hub;
            _config = config;
        }

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
                    var parameter = Expression.Parameter(typeof(User), "u");
                    Expression? finalExpression = null;

                    // Split OR conditions first
                    var orParts = filter.Split('|');
                    foreach (var orPart in orParts)
                    {
                        Expression? orExpression = null;

                        // Split AND conditions
                        var andParts = orPart.Split(',');
                        foreach (var andPart in andParts)
                        {
                            bool isNotEqual = andPart.Contains("!=");

                            var kv = isNotEqual
                                ? andPart.Split("!=")
                                : andPart.Split('=');

                            if (kv.Length != 2) continue;

                            var property = kv[0].Trim();
                            var valueStr = kv[1].Trim();

                            var propertyAccess = Expression.PropertyOrField(parameter, property);

                            Expression condition;

                            if (propertyAccess.Type == typeof(string))
                            {
                                var method = typeof(string).GetMethod("Equals", new[] { typeof(string) });
                                var equalsExpr = Expression.Call(propertyAccess, method!, Expression.Constant(valueStr));

                                condition = isNotEqual
                                    ? Expression.Not(equalsExpr)
                                    : equalsExpr;
                            }
                            else if (propertyAccess.Type == typeof(Guid) || propertyAccess.Type == typeof(Guid?))
                            {
                                condition = Expression.Equal(
                                    propertyAccess,
                                    Expression.Constant(Guid.Parse(valueStr), propertyAccess.Type)
                                );
                            }
                            else if (propertyAccess.Type.IsEnum)
                            {
                                var enumValue = Enum.Parse(propertyAccess.Type, valueStr);
                                var equalsExpr = Expression.Equal(propertyAccess, Expression.Constant(enumValue));

                                condition = isNotEqual
                                    ? Expression.Not(equalsExpr)
                                    : equalsExpr;
                            }
                            else
                            {
                                var convertedValue = Convert.ChangeType(valueStr, propertyAccess.Type);
                                condition = Expression.Equal(propertyAccess, Expression.Constant(convertedValue));
                            }

                            orExpression = orExpression == null
                                ? condition
                                : Expression.AndAlso(orExpression, condition); // AND inside one OR part
                        }

                        finalExpression = finalExpression == null
                            ? orExpression
                            : Expression.OrElse(finalExpression, orExpression); // OR between parts
                    }

                    if (finalExpression != null)
                    {
                        var lambda = Expression.Lambda<Func<User, bool>>(finalExpression, parameter);
                        query = query.Where(lambda);
                    }
                }


                // OrderBy (e.g., "CreatedDate desc")
                if (!string.IsNullOrEmpty(orderBy))
                {
                    if (orderBy.ToLower().Contains("desc"))
                        query = query.OrderByDescending(q => EF.Property<object>(q, orderBy.Replace(" desc", "").Trim()));
                    else
                        query = query.OrderBy(q => EF.Property<object>(q, orderBy.Trim()));
                }

                var TotalElements = query.Count();

                var items = query
      .Skip((page - 1) * pageSize)
      .Take(pageSize)
      .Select(u => new
      {
          u.Id,
          u.EmployeeNo,
          u.FullName,
          u.Email,
          u.SystemRole,
          u.JobTitle,
          u.IsActive,
          u.LastLoginAt,
          u.ContactNo,
          u.Gender,
          u.CreatedAt,
          u.JoinedDate,
          u.HodId,
          Departments = u.Departments.Select(d => new { d.Id, d.Name }),
      })
      .ToList();


                // Select (e.g., "Id,Status")
                if (!string.IsNullOrEmpty(select))
                {
                    var selectedFields = select.Split(',').Select(f => f.Trim()).ToList();
                    var projected = items.Select(item =>
                    {
                        var dict = new Dictionary<string, object>();
                        foreach (var field in selectedFields)
                        {
                            var value = item.GetType().GetProperty(field)?.GetValue(item);
                            dict[field] = value ?? "null";
                        }
                        return dict;
                    });

                    return Ok(new
                    {
                        Data = projected,
                        TotalElements
                    });
                }

                return Ok(new
                {
                    Data = items,
                    TotalElements
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "An unexpected error occured." });
            }

        }

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
                var query = _context.Users.AsQueryable();

                // ===== Includes =====
                if (!string.IsNullOrEmpty(includes))
                {
                    foreach (var include in includes.Split(','))
                    {
                        var navProp = include.Trim();
                        if (!string.IsNullOrEmpty(navProp))
                        {
                            var propInfo = typeof(User).GetProperty(navProp, BindingFlags.IgnoreCase | BindingFlags.Public | BindingFlags.Instance);
                            if (propInfo != null)
                                query = query.Include(navProp);
                        }
                    }
                }

                // ===== Filter =====
                if (!string.IsNullOrEmpty(filter))
                {
                    var parts = filter.Split('=');
                    if (parts.Length == 2)
                    {
                        var propertyName = parts[0].Trim();
                        var valueStr = parts[1].Trim();

                        var propertyInfo = typeof(User).GetProperty(propertyName, BindingFlags.IgnoreCase | BindingFlags.Public | BindingFlags.Instance);
                        if (propertyInfo != null)
                        {
                            try
                            {
                                object typedValue;

                                if (propertyInfo.PropertyType == typeof(Guid) || propertyInfo.PropertyType == typeof(Guid?))
                                    typedValue = Guid.Parse(valueStr);
                                else if (propertyInfo.PropertyType.IsEnum)
                                    typedValue = Enum.Parse(propertyInfo.PropertyType, valueStr);
                                else if (propertyInfo.PropertyType == typeof(int) || propertyInfo.PropertyType == typeof(int?))
                                    typedValue = int.Parse(valueStr);
                                else if (propertyInfo.PropertyType == typeof(bool) || propertyInfo.PropertyType == typeof(bool?))
                                    typedValue = bool.Parse(valueStr);
                                else if (propertyInfo.PropertyType == typeof(DateTime) || propertyInfo.PropertyType == typeof(DateTime?))
                                    typedValue = DateTime.Parse(valueStr);
                                else
                                    typedValue = valueStr;

                                var parameter = Expression.Parameter(typeof(User), "x");
                                var propertyAccess = Expression.Property(parameter, propertyInfo);
                                var constant = Expression.Constant(typedValue);
                                var equals = Expression.Equal(propertyAccess, constant);
                                var lambda = Expression.Lambda<Func<User, bool>>(equals, parameter);
                                query = query.Where(lambda);
                            }
                            catch
                            {
                                // Ignore invalid filter
                            }
                        }
                    }
                }

                // ===== OrderBy =====
                if (!string.IsNullOrEmpty(orderBy))
                {
                    var isDesc = orderBy.ToLower().Contains("desc");
                    var fieldName = orderBy.Replace(" desc", "", StringComparison.OrdinalIgnoreCase).Trim();

                    var propertyInfo = typeof(User).GetProperty(fieldName, BindingFlags.IgnoreCase | BindingFlags.Public | BindingFlags.Instance);
                    if (propertyInfo != null)
                    {
                        query = isDesc
                            ? query.OrderByDescending(x => EF.Property<object>(x, propertyInfo.Name))
                            : query.OrderBy(x => EF.Property<object>(x, propertyInfo.Name));
                    }
                }

                // ===== Paging =====
                var item = query.Skip((page - 1) * pageSize).Take(pageSize).FirstOrDefault();
                if (item == null)
                    return Ok(new { Data = new { } });

                // ===== Select specific fields =====
                if (!string.IsNullOrEmpty(select))
                {
                    var selectedFields = select.Split(',').Select(f => f.Trim()).ToList();
                    var dict = new Dictionary<string, object?>();

                    foreach (var field in selectedFields)
                    {
                        var propInfo = item.GetType().GetProperty(field, BindingFlags.IgnoreCase | BindingFlags.Public | BindingFlags.Instance);
                        dict[field] = propInfo != null ? propInfo.GetValue(item) : null;
                    }

                    return Ok(new { Data = dict });
                }

                return Ok(item);
            }
            catch (Exception ex)
            {
                // Log ex if needed
                return StatusCode(500, new { Error = "An unexpected error occurred." });
            }
        }


        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateUserStatus(Guid id, [FromQuery] bool isActive)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return NotFound(new { Error = "User not found." });

            user.IsActive = isActive;
            user.UpdatedAt = DateTime.UtcNow;
            // user.UpdatedById = currentUserId; // Recommended if you have a BaseEntity

            await _context.SaveChangesAsync();

            return Ok(new { Success = true, Status = user.IsActive });
        }

        //login
        [HttpPost("Login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var user = _context.Users.FirstOrDefault(u => u.Email == request.Email);

                if (user == null || !user.IsActive)
                {
                    return Ok(new { Success = false, Message = "User account not found" });
                }
                // Here you would normally verify the password hash
                var hashedInput = HashPassword(request.Password);
                if (user.Password != hashedInput) // Simplified for example
                {
                    return Ok(new { Success = false, Message = "Your password is incorrect" });
                }

                var token = GenerateJwtToken(user);

                //var token = GenerateJwtToken(user);
                return Ok(new
                {
                    Success = true,
                    Token = token,
                    User = new
                    {
                        user.Id,
                        user.FullName,
                        user.Email,
                        user.SystemRole,
                        user.JobTitle,
                        user.HodId,
                        Hod = user.Hod == null ? null : new
                        {
                            user.Hod.Id,
                            user.Hod.FullName,
                            user.Hod.Email,
                            user.Hod.JobTitle
                        }
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Login failed." });
            }
        }
        private string GenerateJwtToken(User user)
        {
            var claims = new[]
            {
        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
        new Claim(ClaimTypes.Email, user.Email),
        new Claim(ClaimTypes.Role, user.SystemRole ?? "Staff")
    };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddHours(12),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }



        private string HashPassword(string password)
        {
            using (var sha = SHA256.Create())
            {
                var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(password));
                return Convert.ToBase64String(bytes);
            }
        }

        [HttpPost("Register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                // Check password confirmation
                if (request.Password != request.ConfirmPassword)
                    return Ok(new { Success = false, Message = "Passwords do not match." });

                // Check email uniqueness
                if (await _context.Users.AnyAsync(u => u.Email == request.Email))
                    return Ok(new { Success = false, Message = "Email already in use." });

                var newUser = new User
                {
                    Id = Guid.NewGuid(),
                    EmployeeNo = GenerateEmployeeNo(),
                    FullName = request.FullName,
                    Email = request.Email,
                    ContactNo = request.ContactNo,
                    JobTitle = request.JobTitle,
                    SystemRole = request.JobTitle,
                    JoinedDate = request.JoinedDate,
                    HodId = request.HodId,
                    Gender = request.Gender,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                var passwordHasher = new PasswordHasher<User>();
                newUser.Password = passwordHasher.HashPassword(newUser, request.Password);

                _context.Users.Add(newUser);
                await _context.SaveChangesAsync();

                // SignalR notification
                await _hub.Clients.All.SendAsync("ReceiveNotification", new
                {
                    Title = "New User Registered",
                    Message = $"{newUser.FullName} has joined as {newUser.JobTitle}.",
                    Type = "info",
                    Time = DateTime.UtcNow
                });

                return Ok(new
                {
                    Success = true,
                    User = newUser
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
                return StatusCode(500, new { Error = "Registration failed.", Details = ex.Message });
            }
        }

        private string GenerateEmployeeNo()
        {
            // Get last EmployeeId numeric part
            var lastEmployee = _context.Users
                .OrderByDescending(u => u.CreatedAt)
                .FirstOrDefault();

            int nextNumber = 1;
            if (lastEmployee != null && lastEmployee.EmployeeNo.StartsWith("EMP-"))
            {
                var lastNumberStr = lastEmployee.EmployeeNo.Substring(4); // skip "EMP-"
                if (int.TryParse(lastNumberStr, out int lastNumber))
                    nextNumber = lastNumber + 1;
            }

            return $"EMP-{nextNumber:D4}"; // EMP-0001, EMP-0002 ...
        }


        [HttpPut("ChangePassword")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var user = await _context.Users.FindAsync(request.UserId);
                if (user == null)
                    return NotFound(new { Success = false, Message = "User not found." });

                if (request.NewPassword != request.ConfirmPassword)
                    return Ok(new { Success = false, Message = "Passwords do not match." });

                user.Password = HashPassword(request.NewPassword);
                user.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                // 🔔 Notify via SignalR
                await _hub.Clients.All.SendAsync("ReceiveNotification", new
                {
                    Title = "Password Changed",
                    Message = $"Password for {user.FullName} has been updated.",
                    Type = "info",
                    Time = DateTime.UtcNow
                });

                return Ok(new { Success = true, Message = "Password changed successfully." });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
                return StatusCode(500, new { Success = false, Error = "Failed to change password.", Details = ex.Message });
            }
        }


        [HttpPost("ResetPassword")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var resetToken = await _context.PasswordResetTokens
                    .Include(t => t.User)
                    .FirstOrDefaultAsync(t => t.Token == request.Token);

                if (resetToken == null || resetToken.ExpiryTime < DateTime.UtcNow)
                    return Ok(new { Success = false, Message = "Invalid or expired token." });

                // Update password
                resetToken.User.Password = HashPassword(request.NewPassword);
                resetToken.User.UpdatedAt = DateTime.UtcNow;

                // Remove used token
                _context.PasswordResetTokens.Remove(resetToken);
                await _context.SaveChangesAsync();

                // Send notification via SignalR
                await _hub.Clients.All.SendAsync("ReceiveNotification", new
                {
                    Title = "Password Reset",
                    Message = $"Password for user {resetToken.User.Email} has been successfully reset.",
                    Type = "info",
                    Time = DateTime.UtcNow
                });

                return Ok(new { Success = true, Message = "Password has been reset successfully." });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
                return StatusCode(500, new { Error = "Failed to reset password.", Details = ex.Message });
            }
        }



        //profile
        [HttpGet("Profile")]
        [Authorize] // Requires authentication
        public IActionResult GetProfile()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { Error = "User ID not found in token." });

                var user = _context.Users.Find(int.Parse(userId));
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
                return StatusCode(500, new { Error = "Failed to retrieve profile.", Details = ex.Message });
            }
        }

        [HttpPost("ForgotPassword")]
        public IActionResult ForgotPassword([FromQuery] string Email)
        {
            if (string.IsNullOrEmpty(Email))
            {
                return BadRequest(new { Success = false, Message = "Email is required." });
            }

            try
            {
                var user = _context.Users.FirstOrDefault(u => u.Email == Email);

                // To prevent leaking whether an email exists or not
                if (user == null || !user.IsActive)
                {
                    return Ok(new { Success = true, Message = "If your email is registered, you will receive reset instructions shortly." });
                }

                var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(48));
                var expiry = DateTime.UtcNow.AddHours(1);

                var resetToken = new PasswordResetToken
                {
                    UserId = user.Id,
                    Token = token,
                    ExpiryTime = expiry
                };

                _context.PasswordResetTokens.Add(resetToken);
                _context.SaveChanges();

                var resetLink = $"http://192.168.1.82:4200/reset-password?token={Uri.EscapeDataString(token)}";
                _emailService.SendResetEmail(user.Email, resetLink);

                Console.WriteLine($"Password reset link for {user.Email}: {resetLink}");

                return Ok(new
                {
                    Success = true,
                    Message = "If your email is registered, you will receive reset instructions shortly."
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
                return StatusCode(500, new { Success = false, Error = "Failed to send reset password link." });
            }
        }

        [HttpGet("DashboardCounts")]
        public IActionResult GetDashboardCounts()
        {
            try
            {
                var totalUsers = _context.Users.Count();
                var activeUsers = _context.Users.Count(u => u.IsActive);
                var inactiveUsers = _context.Users.Count(u => !u.IsActive);

                return Ok(new
                {
                    TotalUsers = totalUsers,
                    ActiveUsers = activeUsers,
                    InactiveUsers = inactiveUsers
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
                return StatusCode(500, new { Error = "Failed to get dashboard counts.", Details = ex.Message });
            }
        }

        [HttpPut("Update/{id}")]
        public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UpdateUserRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var user = await _context.Users.FindAsync(id);
                if (user == null)
                    return NotFound(new { Success = false, Message = "User not found." });

                // Update fields only if they are provided in the request
                if (!string.IsNullOrEmpty(request.FullName)) user.FullName = request.FullName;
                if (!string.IsNullOrEmpty(request.ContactNo)) user.ContactNo = request.ContactNo;
                if (!string.IsNullOrEmpty(request.Email)) user.Email = request.Email;
                if (!string.IsNullOrEmpty(request.JobTitle)) user.JobTitle = request.JobTitle;
                user.SystemRole = request.JobTitle;
                if (request.JoinedDate.HasValue) user.JoinedDate = request.JoinedDate.Value; 
                if (!string.IsNullOrEmpty(request.Gender)) user.Gender = request.Gender;
                if (request.HodId.HasValue) user.HodId = request.HodId.Value;
                user.UpdatedAt = DateTime.UtcNow;

                _context.Users.Update(user);
                await _context.SaveChangesAsync();

                // 🔔 Optional: Notify via SignalR
                await _hub.Clients.All.SendAsync("ReceiveNotification", new
                {
                    Title = "User Updated",
                    Message = $"Profile for {user.FullName} has been updated.",
                    Type = "success",
                    Time = DateTime.UtcNow
                });

                var result = new UserDto
                {
                    Id = user.Id,
                    FullName = user.FullName,
                    ContactNo = user.ContactNo,
                    EmployeeNo = user.EmployeeNo,
                    JobTitle = user.JobTitle,
                    Email = user.Email,
                    SystemRole = user.SystemRole,
                    JoinedDate = user.JoinedDate,
                    Gender = user.Gender,
                    HodId = user.HodId,
                    UpdatedAt = user.UpdatedAt,
                    CreatedAt = user.CreatedAt,
                    LastLoginAt = user.LastLoginAt,
                    IsActive = user.IsActive,
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
                return StatusCode(500, new { Success = false, Error = "Failed to update user.", Details = ex.Message });
            }
        }

    }
}
