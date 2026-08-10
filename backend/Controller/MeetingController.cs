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
using ClosedXML.Excel;

namespace YLWorks.Controller
{
    [Route("api/[controller]")]
    [ApiController]
    public class MeetingController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hub;

        public MeetingController(AppDbContext context, IHubContext<NotificationHub> hub)
        {
            _context = context;
            _hub = hub;

        }

        [HttpGet("GetMany")]
        public async Task<ActionResult<object>> GetMany(
      int page = 1,
      int pageSize = 10,
      string? filter = null,
      string? orderBy = null,
      string? includes = null)
        {
            try
            {
                var query = _context.Meetings.AsQueryable();

                if (!string.IsNullOrEmpty(filter))
                {
                    var parameter = Expression.Parameter(typeof(Meeting), "u");
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

                            if (kv.Length != 2) continue;

                            var property = kv[0].Trim();
                            var valueStr = kv[1].Trim();

                            var propertyAccess = Expression.PropertyOrField(parameter, property);

                            Expression condition;

                            if (propertyAccess.Type == typeof(string))
                            {
                                var toLowerMethod = typeof(string).GetMethod("ToLower", Type.EmptyTypes)!;

                                var propertyToLower = Expression.Call(propertyAccess, toLowerMethod);
                                var valueToLower = Expression.Constant(valueStr.ToLower());

                                var containsMethod = typeof(string).GetMethod("Contains", new[] { typeof(string) })!;

                                var containsExpr = Expression.Call(propertyToLower, containsMethod, valueToLower);

                                condition = isNotEqual
                                    ? Expression.Not(containsExpr)
                                    : containsExpr;
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
                                var equalsExpr = Expression.Equal(
                                    propertyAccess,
                                    Expression.Constant(enumValue)
                                );

                                condition = isNotEqual
                                    ? Expression.Not(equalsExpr)
                                    : equalsExpr;
                            }
                            else
                            {
                                var convertedValue = Convert.ChangeType(valueStr, propertyAccess.Type);
                                condition = Expression.Equal(
                                    propertyAccess,
                                    Expression.Constant(convertedValue)
                                );
                            }

                            orExpression = orExpression == null
                                ? condition
                                : Expression.AndAlso(orExpression, condition);
                        }

                        finalExpression = finalExpression == null
                            ? orExpression
                            : Expression.OrElse(finalExpression, orExpression);
                    }

                    if (finalExpression != null)
                    {
                        var lambda = Expression.Lambda<Func<Meeting, bool>>(finalExpression, parameter);
                        query = query.Where(lambda);
                    }
                }
                if (!string.IsNullOrEmpty(orderBy))
                {
                    if (orderBy.ToLower().Contains("desc"))
                        query = query.OrderByDescending(q =>
                            EF.Property<object>(q, orderBy.Replace(" desc", "").Trim()));
                    else
                        query = query.OrderBy(q =>
                            EF.Property<object>(q, orderBy.Trim()));
                }
                var totalElements = await query.CountAsync();

                var items = await query
      .Skip((page - 1) * pageSize)
      .Take(pageSize)
      .Select(t => new
      {
          t.Id,
          t.Title,
          t.Description,
          Organizer = t.Organizer == null ? null : new
          {
              t.Organizer.Id,
              t.Organizer.FullName
          },
          t.MeetingDate,
          t.MeetingTime,
          t.Location,
          t.MeetingLink,
          t.ReminderMinutes,
          Participants = t.Participants.Select(am => new
          {
              am.UserId,
              User = am.User == null ? null : new
              {
                  am.User.FullName,
                  am.User.Email
              },
              am.HasAccepted,
              am.HasJoined
          }),
      })
      .ToListAsync();

                return Ok(new
                {
                    Data = items,
                    TotalElements = totalElements
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new { Error = "An unexpected error occurred." });
            }
        }

        [HttpGet("GetOne")]
        public async Task<IActionResult> GetOne([FromQuery] Guid id)
        {
            var data = await _context.Meetings
                .AsNoTracking()
                .Where(x => x.Id == id)
                .Select(x => new
                {
                    x.Id,
                    x.Title,
                    x.Description,
                    x.OrganizerId,
                    Organizer = x.Organizer == null ? null : new
                    {
                        x.Organizer.FullName,
                        x.Organizer.DisplayName,
                        x.Organizer.Email
                    },
                    x.MeetingDate,
                    x.MeetingTime,
                    x.Location,
                    x.MeetingLink,
                    x.ReminderMinutes,

                    Participants = x.Participants.Select(pm => new
                    {
                        pm.MeetingId,
                        UserId = pm.UserId,
                        User = pm.User == null ? null : new
                        {
                            pm.User.FullName,
                            pm.User.DisplayName,
                            pm.User.Email
                        },
                        pm.HasAccepted,
                        pm.HasJoined
                    }),
                })
                .FirstOrDefaultAsync();

            if (data == null)
                return NotFound();

            return Ok(data);
        }

        [HttpPost("Create")]
        public async Task<ActionResult<Meeting>> AddMeeting([FromBody] CreateMeetingRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Title))
                return BadRequest(new { Error = "Title is required." });

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            Console.WriteLine($"UserId Claim: {userIdClaim}");

            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { Error = "Invalid token." });

            try
            {
                var meeting = new Meeting
                {
                    Id = Guid.NewGuid(),
                    Title = request.Title,
                    Description = request.Description,
                    MeetingDate = request.MeetingDate,
                    MeetingTime = request.MeetingTime,
                    Location = request.Location,
                    MeetingLink = request.MeetingLink,
                    ReminderMinutes = request.ReminderMinutes,
                    CreatedAt = DateTimeHelper.Now(),
                    OrganizerId = Guid.Parse(userIdClaim)
                };

                _context.Meetings.Add(meeting);
                await _context.SaveChangesAsync();

                // Assign members
                if (request.ParticipantIds?.Any() == true)
                {
                    var assignments = request.ParticipantIds.Select(userId => new MeetingParticipant
                    {
                        Id = Guid.NewGuid(),
                        MeetingId = meeting.Id,
                        UserId = userId,
                        HasAccepted = false,
                        HasJoined = false
                    });

                    _context.MeetingParticipants.AddRange(assignments);
                }

                await _context.SaveChangesAsync();

                var result = await GetMeetingDto(meeting.Id);

                await _hub.Clients.All.SendAsync("MeetingAdded", result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to add meeting.",
                    Detail = ex.Message,
                    InnerException = ex.InnerException?.Message,
                    InnerInnerException = ex.InnerException?.InnerException?.Message
                });
            }
        }

        [HttpPut("Update")]
        public async Task<IActionResult> Update([FromBody] UpdateMeetingRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { Error = "Invalid token." });

            var meeting = await _context.Meetings
                .FirstOrDefaultAsync(x => x.Id == request.Id);

            if (meeting == null)
                return NotFound(new { Error = "Meeting not found." });

            try
            {
                meeting.Title = request.Title;
                meeting.Description = request.Description;
                meeting.MeetingDate = request.MeetingDate;
                meeting.MeetingTime = request.MeetingTime;
                meeting.Location = request.Location;
                meeting.MeetingLink = request.MeetingLink;
                meeting.ReminderMinutes = request.ReminderMinutes;

                // Replace assigned users
                var existingAssignments = await _context.MeetingParticipants
                    .Where(x => x.MeetingId == meeting.Id)
                    .ToListAsync();

                _context.MeetingParticipants.RemoveRange(existingAssignments);

                if (request.ParticipantIds?.Any() == true)
                {
                    var assignments = request.ParticipantIds.Select(userId => new MeetingParticipant
                    {
                        Id = Guid.NewGuid(),
                        MeetingId = meeting.Id,
                        UserId = userId,
                    });

                    _context.MeetingParticipants.AddRange(assignments);
                }

                await _context.SaveChangesAsync();

                var result = await GetMeetingDto(meeting.Id);

                await _hub.Clients.All.SendAsync("MeetingUpdated", result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to update meeting.",
                    Detail = ex.Message
                });
            }
        }

        [HttpDelete("Delete")]
        public async Task<ActionResult> DeleteMeeting([FromQuery] Guid id)
        {
            var meeting = await _context.Meetings.FindAsync(id);
            if (meeting == null)
                return NotFound(new { Error = "Meeting not found." });

            try
            {
                _context.Meetings.Remove(meeting);
                await _context.SaveChangesAsync();

                // Optional: Notify via SignalR
                await _hub.Clients.All.SendAsync("MeetingDeleted", id);

                return Ok(new { Message = "Meeting deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Failed to delete meeting." });
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

        private async Task<Meeting> GetMeetingDto(Guid meetingId)
        {
            return await _context.Meetings
                .Include(t => t.Participants)
                    .ThenInclude(a => a.User)
                .Where(t => t.Id == meetingId)
                .Select(t => new Meeting
                {
                    Id = t.Id,
                    Title = t.Title,
                    Description = t.Description,
                    OrganizerId = t.OrganizerId,
                    Organizer = t.Organizer == null ? null : new User
                    {
                        Id = t.Organizer.Id,
                        FullName = t.Organizer.FullName,
                        DisplayName = t.Organizer.DisplayName,
                        Email = t.Organizer.Email
                    },
                    MeetingDate = t.MeetingDate,
                    MeetingTime = t.MeetingTime,
                    Location = t.Location,
                    MeetingLink = t.MeetingLink,
                    ReminderMinutes = t.ReminderMinutes,

                    Participants = t.Participants
    .Select(a => new MeetingParticipant
    {
        Id = a.Id,
        MeetingId = a.MeetingId,
        UserId = a.UserId,
        User = a.User == null ? null : new User
        {
            Id = a.User.Id,
            FullName = a.User.FullName,
            Email = a.User.Email
        },
        HasAccepted = a.HasAccepted,
        HasJoined = a.HasJoined
    })
    .ToList(), 
                })
                .FirstAsync();
        }
    }
}
