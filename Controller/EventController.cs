using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using System.Security.Claims;
using YLWorks.Data;
using YLWorks.Model;

namespace YLWorks.Controller
{
    [Route("api/[controller]")]
    [ApiController]
    public class EventController : ControllerBase
    {
        private readonly AppDbContext _context;

        public EventController(AppDbContext context)
        {
            _context = context;
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
                var query = _context.Events.AsQueryable();

                // Includes
                if (!string.IsNullOrEmpty(includes))
                {
                    foreach (var include in includes.Split(','))
                    {
                        query = query.Include(include.Trim());
                    }
                }

                // Filter with AND (,) and OR (|) support
                if (!string.IsNullOrEmpty(filter))
                {
                    var parameter = Expression.Parameter(typeof(Event), "q");
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
                            var kv = andPart.Split('=');
                            if (kv.Length != 2) continue;

                            var property = kv[0].Trim();
                            var valueStr = kv[1].Trim();
                            var propertyAccess = Expression.PropertyOrField(parameter, property);

                            Expression condition;

                            if (propertyAccess.Type == typeof(string))
                            {
                                // string -> use Contains
                                var method = typeof(string).GetMethod("Contains", new[] { typeof(string) });
                                condition = Expression.Call(propertyAccess, method!, Expression.Constant(valueStr));
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
                                condition = Expression.Equal(propertyAccess, Expression.Constant(enumValue));
                            }
                            else
                            {
                                var convertedValue = Convert.ChangeType(valueStr, propertyAccess.Type);
                                condition = Expression.Equal(propertyAccess, Expression.Constant(convertedValue));
                            }

                            orExpression = orExpression == null
                                ? condition
                                : Expression.AndAlso(orExpression, condition); // AND
                        }

                        finalExpression = finalExpression == null
                            ? orExpression
                            : Expression.OrElse(finalExpression, orExpression); // OR
                    }

                    if (finalExpression != null)
                    {
                        var lambda = Expression.Lambda<Func<Event, bool>>(finalExpression, parameter);
                        query = query.Where(lambda);
                    }
                }

                // OrderBy
                if (!string.IsNullOrEmpty(orderBy))
                {
                    if (orderBy.ToLower().Contains("desc"))
                        query = query.OrderByDescending(q => EF.Property<object>(q, orderBy.Replace(" desc", "").Trim()));
                    else
                        query = query.OrderBy(q => EF.Property<object>(q, orderBy.Trim()));
                }

                var totalElements = query.Count();

                var items = query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToList();

                // Select specific fields
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

                    return Ok(new { Data = projected, TotalElements = totalElements });
                }

                return Ok(new { Data = items, TotalElements = totalElements });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "An unexpected error occurred.", Details = ex.Message });
            }
        }

        [HttpGet("GetOne")]
        public ActionResult<object> GetOne(Guid id)
        {
            var hrEvent = _context.Events.Find(id);
            if (hrEvent == null)
                return NotFound(new { Error = "Event not found." });

            return Ok(new { hrEvent.Id, hrEvent.Title, hrEvent.StartTime, hrEvent.EndTime, hrEvent.Description, hrEvent.Participants });
        }

        [HttpPost("Create")]
        public async Task<IActionResult> Create([FromBody] CreateEventRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var hrEvent = new Event
            {
                Id = Guid.NewGuid(),
                Title = request.Title,
                Description = request.Description,
                Type = request.Type,
                StartTime = request.StartTime,
                EndTime = request.EndTime,
                AllDay = request.AllDay,
                Location = request.Location,
                MeetingLink = request.MeetingLink,
                Participants = request.Participants,
                DepartmentId = request.DepartmentId,
                Reminder = request.Reminder,
                Repeat = request.Repeat,
                CreatedById = Guid.Parse(userIdClaim),
            };

            _context.Events.Add(hrEvent);
            await _context.SaveChangesAsync();

            return Ok(new { hrEvent.Id, hrEvent.Title, hrEvent.StartTime, hrEvent.EndTime });
        }

        [HttpPut("Update")]
        public async Task<IActionResult> Update([FromBody] UpdateEventRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var hrEvent = await _context.Events.FindAsync(request.Id);
            if (hrEvent == null)
                return NotFound(new { Error = "Event not found." });

            if (!string.IsNullOrEmpty(request.Title))
                hrEvent.Title = request.Title;

            hrEvent.Description = request.Description;
            hrEvent.StartTime = request.StartTime;
            hrEvent.EndTime = request.EndTime;
            hrEvent.AllDay = request.AllDay;
            hrEvent.Location = request.Location;
            hrEvent.MeetingLink = request.MeetingLink;
            hrEvent.Participants = request.Participants;
            hrEvent.DepartmentId = request.DepartmentId;
            hrEvent.Reminder = request.Reminder;
            hrEvent.Repeat = request.Repeat;

            await _context.SaveChangesAsync();

            return Ok(new { hrEvent.Id, hrEvent.Title, hrEvent.StartTime, hrEvent.EndTime });
        }

        [HttpDelete("Delete")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var hrEvent = await _context.Events.FindAsync(id);
            if (hrEvent == null)
                return NotFound(new { Error = "Event not found." });


            _context.Events.Remove(hrEvent);
            await _context.SaveChangesAsync();
            return Ok(new { Success = true });
        }

    }
}
