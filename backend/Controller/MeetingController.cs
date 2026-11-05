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
using YLWorks.Services;
using System.Net;

namespace YLWorks.Controller
{
    [Route("api/[controller]")]
    [ApiController]
    public class MeetingController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hub;
        private readonly EmailService _emailService;
        private readonly ILogger<MeetingController> _logger;

        public MeetingController(
            AppDbContext context,
            IHubContext<NotificationHub> hub,
            EmailService emailService,
            ILogger<MeetingController> logger)
        {
            _context = context;
            _hub = hub;
            _emailService = emailService;
            _logger = logger;
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
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdClaim))
                {
                    return Unauthorized(new { Error = "Invalid token." });
                }

                if (!Guid.TryParse(userIdClaim, out Guid currentUserId))
                {
                    return Unauthorized(new { Error = "Invalid user ID." });
                }

                var query = _context.Meetings
                    .Where(m =>
                        m.OrganizerId == currentUserId ||
                        m.Participants.Any(p => p.UserId == currentUserId)
                    )
                    .AsQueryable();

                // Existing filter
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

                            if (kv.Length != 2)
                                continue;

                            var property = kv[0].Trim();
                            var valueStr = kv[1].Trim();

                            var propertyAccess =
                                Expression.PropertyOrField(parameter, property);

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
                                    Expression.Constant(valueStr.ToLower());

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
                                var guidValue = Guid.Parse(valueStr);

                                condition = Expression.Equal(
                                    propertyAccess,
                                    Expression.Constant(
                                        guidValue,
                                        propertyAccess.Type
                                    )
                                );
                            }
                            else if (propertyAccess.Type.IsEnum)
                            {
                                var enumValue =
                                    Enum.Parse(
                                        propertyAccess.Type,
                                        valueStr
                                    );

                                var equalsExpr =
                                    Expression.Equal(
                                        propertyAccess,
                                        Expression.Constant(enumValue)
                                    );

                                condition = isNotEqual
                                    ? Expression.Not(equalsExpr)
                                    : equalsExpr;
                            }
                            else
                            {
                                var convertedValue =
                                    Convert.ChangeType(
                                        valueStr,
                                        propertyAccess.Type
                                    );

                                condition =
                                    Expression.Equal(
                                        propertyAccess,
                                        Expression.Constant(
                                            convertedValue,
                                            propertyAccess.Type
                                        )
                                    );
                            }

                            orExpression = orExpression == null
                                ? condition
                                : Expression.AndAlso(
                                    orExpression,
                                    condition
                                );
                        }

                        finalExpression = finalExpression == null
                            ? orExpression
                            : Expression.OrElse(
                                finalExpression,
                                orExpression
                            );
                    }

                    if (finalExpression != null)
                    {
                        var lambda =
                            Expression.Lambda<Func<Meeting, bool>>(
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
                                orderBy.Replace(" desc", "").Trim()
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

                var totalElements = await query.CountAsync();

                var items = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(t => new
                    {
                        t.Id,
                        t.Title,
                        t.Description,
                        t.OrganizerId,
                        Organizer = t.Organizer == null
                            ? null
                            : new
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

                            User = am.User == null
                                ? null
                                : new
                                {
                                    am.User.FullName,
                                    am.User.Email
                                },

                            am.HasAccepted,
                            am.HasJoined
                        })
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
        public async Task<ActionResult<Meeting>> AddMeeting(
    [FromBody] CreateMeetingRequest request)
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

            var userIdClaim = User.FindFirst(
                ClaimTypes.NameIdentifier
            )?.Value;

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

                // Get selected participants
                // Exclude organizer and remove duplicates
                var participantIds = request.ParticipantIds?
                    .Where(id => id != currentUserId)
                    .Distinct()
                    .ToList() ?? new List<Guid>();

                // Get participant information
                var participants = await _context.Users
                    .AsNoTracking()
                    .Where(u => participantIds.Contains(u.Id))
                    .Select(u => new
                    {
                        u.Id,
                        u.FullName,
                        u.Email
                    })
                    .ToListAsync();

                // Validate selected participants
                if (participants.Count != participantIds.Count)
                {
                    return BadRequest(new
                    {
                        Error = "One or more selected participants do not exist."
                    });
                }

                // Create meeting
                var meeting = new Meeting
                {
                    Id = Guid.NewGuid(),
                    Title = request.Title.Trim(),
                    Description = request.Description,
                    MeetingDate = DateTimeHelper.ToMalaysiaDateTime(
                        request.MeetingDate
                    ),
                    MeetingTime = request.MeetingTime,
                    Location = request.Location,
                    MeetingLink = request.MeetingLink,
                    ReminderMinutes = request.ReminderMinutes,
                    CreatedAt = now,
                    OrganizerId = currentUserId
                };

                // Assign participants
                var assignments = participants
                    .Select(user => new MeetingParticipant
                    {
                        Id = Guid.NewGuid(),
                        MeetingId = meeting.Id,
                        UserId = user.Id,
                        HasAccepted = false,
                        HasJoined = false
                    })
                    .ToList();

                // Create individual notifications
                var notifications = participants
                    .Select(user => new Notification
                    {
                        Id = Guid.NewGuid(),
                        UserId = user.Id,
                        Title = "New Meeting Invitation",
                        Message = $"You have been invited to a meeting: {meeting.Title}",
                        Type = "Meeting",
                        Link = "/meetings",
                        IsRead = false,
                        CreatedAt = now
                    })
                    .ToList();

                // Save meeting, participants and notifications together
                _context.Meetings.Add(meeting);

                if (assignments.Count > 0)
                {
                    _context.MeetingParticipants.AddRange(assignments);
                }

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
                    catch (Exception ex)
                    {
                        // Notification is already saved.
                        _logger.LogError(
                            ex,
                            "Failed to send meeting notification to {UserId}",
                            notification.UserId
                        );
                    }
                }

                // Prepare meeting email
                var emailSent = 0;
                var emailFailed = 0;

                var meetingDate = meeting.MeetingDate.ToString(
                    "dddd, dd MMMM yyyy"
                );

                var meetingTime = meeting.MeetingTime.ToString();

                var safeTitle = WebUtility.HtmlEncode(meeting.Title);

                var safeDescription = WebUtility.HtmlEncode(
                    meeting.Description ?? "No description provided."
                );

                var safeLocation = WebUtility.HtmlEncode(
                    meeting.Location ?? "Not specified"
                );

                var organizer = await _context.Users
                    .AsNoTracking()
                    .Where(u => u.Id == currentUserId)
                    .Select(u => u.DisplayName ?? u.FullName)
                    .FirstOrDefaultAsync();

                var safeOrganizer = WebUtility.HtmlEncode(
                    organizer ?? "YLWorks Organizer"
                );

                var hasValidMeetingLink =
                    Uri.TryCreate(
                        meeting.MeetingLink,
                        UriKind.Absolute,
                        out var meetingUri
                    )
                    && (meetingUri.Scheme == Uri.UriSchemeHttps ||
                        meetingUri.Scheme == Uri.UriSchemeHttp);

                var meetingLinkHtml = hasValidMeetingLink
                    ? $@"
                <p>
                    <strong>Meeting Link:</strong><br/>
                    <a href='{WebUtility.HtmlEncode(meetingUri!.AbsoluteUri)}'
                       style='color: #2563eb;'>
                        Join Meeting
                    </a>
                </p>"
                    : "";

                var emailBody = $@"
        <!DOCTYPE html>
        <html>
        <body style='margin:0; padding:24px;
                     background-color:#f8fafc;
                     font-family:Arial,sans-serif;
                     color:#334155;'>

            <div style='max-width:600px;
                        margin:auto;
                        background:#ffffff;
                        border-radius:12px;
                        padding:32px;
                        border:1px solid #e2e8f0;'>

                <h2 style='color:#2563eb; margin-top:0;'>
                    Meeting Invitation
                </h2>

                <p>Hello {{ParticipantName}},</p>

                <p>
                    You have been invited to attend a meeting.
                    Please find the meeting details below.
                </p>

                <div style='background:#f8fafc;
                            padding:20px;
                            border-radius:8px;
                            margin:20px 0;'>

                    <h3 style='margin-top:0; color:#1e293b;'>
                        {safeTitle}
                    </h3>

                    <p>
                        <strong>Description</strong><br/>
                        {safeDescription}
                    </p>

                    <p>
                        <strong>Date</strong><br/>
                        {meetingDate}
                    </p>

                    <p>
                        <strong>Time</strong><br/>
                        {WebUtility.HtmlEncode(meetingTime)}
                    </p>

                    <p>
                        <strong>Location</strong><br/>
                        {safeLocation}
                    </p>

                    <p>
                        <strong>Organizer</strong><br/>
                        {safeOrganizer}
                    </p>

                    {meetingLinkHtml}

                </div>

                <p>
                    Please log in to OfficeHub to view the meeting
                    invitation and respond to it.
                </p>

                <p>
                    Thank you,<br/>
                    <strong>YLWorks</strong>
                </p>

            </div>

        </body>
        </html>";

                // Send email to each selected participant
                foreach (var participant in participants)
                {
                    if (string.IsNullOrWhiteSpace(participant.Email))
                    {
                        emailFailed++;
                        continue;
                    }

                    try
                    {
                        var personalizedEmail = emailBody.Replace(
                            "{ParticipantName}",
                            WebUtility.HtmlEncode(
                                participant.FullName ?? "there"
                            )
                        );

                        await _emailService.SendEmailAsync(
                            participant.Email,
                            $"Meeting Invitation: {meeting.Title}",
                            personalizedEmail
                        );

                        emailSent++;
                    }
                    catch (Exception ex)
                    {
                        emailFailed++;

                        _logger.LogError(
                            ex,
                            "Failed to send meeting invitation to {Email}",
                            participant.Email
                        );
                    }
                }

                // Broadcast meeting update
                var result = await GetMeetingDto(meeting.Id);

                await _hub.Clients.All.SendAsync(
                    "MeetingAdded",
                    result
                );

                return Ok(new
                {
                    Message = "Meeting created successfully.",
                    Data = result,
                    NotificationsSent = notifications.Count,
                    EmailsSent = emailSent,
                    EmailsFailed = emailFailed
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create meeting.");

                return StatusCode(500, new
                {
                    Error = "Failed to add meeting.",
                    Detail = ex.Message,
                    InnerException = ex.InnerException?.Message
                });
            }
        }

        [HttpPut("Update")]
        public async Task<IActionResult> Update([FromBody] UpdateMeetingRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim) ||
                !Guid.TryParse(userIdClaim, out Guid currentUserId))
            {
                return Unauthorized(new { Error = "Invalid user ID." });
            }

            var meeting = await _context.Meetings
                .FirstOrDefaultAsync(x => x.Id == request.Id);

            if (meeting == null)
                return NotFound(new { Error = "Meeting not found." });

            // Only the organizer can update the meeting.
            if (meeting.OrganizerId != currentUserId)
                return Forbid();

            if (string.IsNullOrWhiteSpace(request.Title))
                return BadRequest(new { Error = "Meeting title is required." });

            try
            {
                var now = DateTimeHelper.Now();

                // Get existing participant assignments.
                var existingAssignments = await _context.MeetingParticipants
                    .Where(x => x.MeetingId == meeting.Id)
                    .ToListAsync();

                var oldParticipantIds = existingAssignments
                    .Select(x => x.UserId)
                    .ToHashSet();

                // Prepare new participant IDs.
                var newParticipantIds = (request.ParticipantIds ?? new List<Guid>())
                    .Where(x => x != currentUserId)
                    .Distinct()
                    .ToHashSet();

                // Validate selected users.
                var allRequestedUsers = await _context.Users
                    .Where(x => newParticipantIds.Contains(x.Id))
                    .Select(x => new
                    {
                        x.Id,
                        x.FullName,
                        x.DisplayName,
                        x.Email
                    })
                    .ToListAsync();

                if (allRequestedUsers.Count != newParticipantIds.Count)
                {
                    return BadRequest(new
                    {
                        Error = "One or more selected participants do not exist."
                    });
                }

                // Identify everyone affected by this update.
                // This includes existing, added and removed participants.
                var affectedParticipantIds = oldParticipantIds
                    .Union(newParticipantIds)
                    .ToHashSet();

                // Get affected users for email notifications.
                var affectedUsers = await _context.Users
                    .Where(x => affectedParticipantIds.Contains(x.Id))
                    .Select(x => new
                    {
                        x.Id,
                        x.FullName,
                        x.DisplayName,
                        x.Email
                    })
                    .ToListAsync();

                var usersById = affectedUsers.ToDictionary(x => x.Id);

                // Identify added and removed participants.
                var addedParticipantIds = newParticipantIds
                    .Except(oldParticipantIds)
                    .ToHashSet();

                var removedParticipantIds = oldParticipantIds
                    .Except(newParticipantIds)
                    .ToHashSet();

                // Update meeting information.
                meeting.Title = request.Title.Trim();
                meeting.Description = request.Description;
                meeting.MeetingDate =
                    DateTimeHelper.ToMalaysiaDateTime(request.MeetingDate);
                meeting.MeetingTime = request.MeetingTime;
                meeting.Location = request.Location;
                meeting.MeetingLink = request.MeetingLink;
                meeting.ReminderMinutes = request.ReminderMinutes;

                // Remove participants who are no longer invited.
                var assignmentsToRemove = existingAssignments
                    .Where(x => removedParticipantIds.Contains(x.UserId))
                    .ToList();

                if (assignmentsToRemove.Count > 0)
                {
                    _context.MeetingParticipants.RemoveRange(assignmentsToRemove);
                }

                // Add only new participants.
                // Existing participants retain their acceptance/join status.
                var assignmentsToAdd = addedParticipantIds
                    .Select(userId => new MeetingParticipant
                    {
                        Id = Guid.NewGuid(),
                        MeetingId = meeting.Id,
                        UserId = userId,
                        HasAccepted = false,
                        HasJoined = false
                    })
                    .ToList();

                if (assignmentsToAdd.Count > 0)
                {
                    _context.MeetingParticipants.AddRange(assignmentsToAdd);
                }

                // Create notifications for everyone affected.
                var notifications = new List<Notification>();

                foreach (var participantId in affectedParticipantIds)
                {
                    var isRemoved = removedParticipantIds.Contains(participantId);
                    var isNew = addedParticipantIds.Contains(participantId);

                    var notification = new Notification
                    {
                        Id = Guid.NewGuid(),
                        UserId = participantId,

                        Title = isRemoved
                            ? "Meeting Invitation Removed"
                            : isNew
                                ? "New Meeting Invitation"
                                : "Meeting Updated",

                        Message = isRemoved
                            ? $"You are no longer invited to the meeting: {meeting.Title}"
                            : isNew
                                ? $"You have been invited to a meeting: {meeting.Title}"
                                : $"The meeting details have been updated: {meeting.Title}",

                        Type = "Meeting",
                        Link = "/meetings",
                        IsRead = false,
                        CreatedAt = now
                    };

                    notifications.Add(notification);
                }

                if (notifications.Count > 0)
                {
                    _context.Notifications.AddRange(notifications);
                }

                // Save meeting, participants and notifications together.
                await _context.SaveChangesAsync();

                // Send real-time notifications through SignalR.
                foreach (var notification in notifications)
                {
                    try
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
                    catch (Exception ex)
                    {
                        _logger.LogWarning(
                            ex,
                            "Failed to send meeting update notification to {UserId}",
                            notification.UserId
                        );
                    }
                }

                // Get organizer information.
                var organizer = await _context.Users
                    .Where(x => x.Id == currentUserId)
                    .Select(x => new
                    {
                        x.FullName,
                        x.DisplayName
                    })
                    .FirstOrDefaultAsync();

                var organizerName = organizer?.DisplayName
                    ?? organizer?.FullName
                    ?? "Meeting Organizer";

                // Send emails to affected participants.
                int emailsSent = 0;
                int emailsFailed = 0;

                foreach (var participantId in affectedParticipantIds)
                {
                    if (!usersById.TryGetValue(participantId, out var participant))
                        continue;

                    if (string.IsNullOrWhiteSpace(participant.Email))
                        continue;

                    var participantName = WebUtility.HtmlEncode(
                        participant.DisplayName ?? participant.FullName ?? "there"
                    );

                    var meetingTitle = WebUtility.HtmlEncode(meeting.Title);

                    var description = WebUtility.HtmlEncode(
                        meeting.Description ?? "No description provided."
                    );

                    var location = WebUtility.HtmlEncode(
                        meeting.Location ?? "Not specified"
                    );

                    var meetingDate = WebUtility.HtmlEncode(
                        meeting.MeetingDate.ToString()
                    );

                    var meetingTime = WebUtility.HtmlEncode(
                        meeting.MeetingTime.ToString()
                    );

                    var organizerDisplayName = WebUtility.HtmlEncode(organizerName);

                    var isRemoved = removedParticipantIds.Contains(participantId);
                    var isNew = addedParticipantIds.Contains(participantId);

                    string subject;
                    string heading;
                    string message;

                    if (isRemoved)
                    {
                        subject = $"Meeting Invitation Removed: {meeting.Title}";
                        heading = "Meeting Invitation Removed";
                        message = "You are no longer invited to this meeting.";
                    }
                    else if (isNew)
                    {
                        subject = $"New Meeting Invitation: {meeting.Title}";
                        heading = "You Have Been Invited";
                        message = "You have been invited to attend this meeting.";
                    }
                    else
                    {
                        subject = $"Meeting Updated: {meeting.Title}";
                        heading = "Meeting Details Updated";
                        message = "The details of this meeting have been updated.";
                    }

                    var emailBody = $@"
                <div style='font-family:Arial,sans-serif;max-width:600px;margin:auto;'>
                    <h2>{heading}</h2>

                    <p>Hi {participantName},</p>

                    <p>{message}</p>

                    <h3>{meetingTitle}</h3>

                    <p><strong>Description:</strong> {description}</p>
                    <p><strong>Date:</strong> {meetingDate}</p>
                    <p><strong>Time:</strong> {meetingTime}</p>
                    <p><strong>Location:</strong> {location}</p>
                    <p><strong>Organizer:</strong> {organizerDisplayName}</p>

                    <p>Please log in to OfficeHub for more information.</p>
                </div>";

                    try
                    {
                        await _emailService.SendEmailAsync(
                            participant.Email,
                            subject,
                            emailBody
                        );

                        emailsSent++;
                    }
                    catch (Exception ex)
                    {
                        emailsFailed++;

                        _logger.LogError(
                            ex,
                            "Failed to send meeting update email to {Email}",
                            participant.Email
                        );
                    }
                }

                // Get updated meeting information.
                var result = await GetMeetingDto(meeting.Id);

                // Broadcast meeting update to connected clients.
                await _hub.Clients.All.SendAsync("MeetingUpdated", result);

                return Ok(new
                {
                    Message = "Meeting updated successfully.",
                    Data = result,
                    NotificationsSent = notifications.Count,
                    EmailsSent = emailsSent,
                    EmailsFailed = emailsFailed
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to update meeting {MeetingId}",
                    request.Id
                );

                return StatusCode(500, new
                {
                    Error = "Failed to update meeting.",
                    Detail = ex.Message
                });
            }
        }

        [HttpDelete("Delete")]
        public async Task<IActionResult> DeleteMeeting([FromQuery] Guid id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim) ||
                !Guid.TryParse(userIdClaim, out Guid currentUserId))
            {
                return Unauthorized(new { Error = "Invalid user ID." });
            }

            var meeting = await _context.Meetings
                .FirstOrDefaultAsync(x => x.Id == id);

            if (meeting == null)
                return NotFound(new { Error = "Meeting not found." });

            // Only the organizer can delete the meeting.
            if (meeting.OrganizerId != currentUserId)
                return Forbid();

            try
            {
                var now = DateTimeHelper.Now();

                // Get participant assignments before deleting.
                var participants = await _context.MeetingParticipants
                    .Where(x => x.MeetingId == meeting.Id)
                    .ToListAsync();

                var participantIds = participants
                    .Select(x => x.UserId)
                    .Distinct()
                    .ToList();

                // Get participant email information before deleting.
                var participantUsers = await _context.Users
                    .Where(x => participantIds.Contains(x.Id))
                    .Select(x => new
                    {
                        x.Id,
                        x.FullName,
                        x.DisplayName,
                        x.Email
                    })
                    .ToListAsync();

                var usersById = participantUsers.ToDictionary(x => x.Id);

                // Get organizer information.
                var organizer = await _context.Users
                    .Where(x => x.Id == currentUserId)
                    .Select(x => new
                    {
                        x.FullName,
                        x.DisplayName
                    })
                    .FirstOrDefaultAsync();

                var organizerName = organizer?.DisplayName
                    ?? organizer?.FullName
                    ?? "Meeting Organizer";

                // Create cancellation notifications.
                var notifications = participantIds.Select(userId =>
                    new Notification
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        Title = "Meeting Cancelled",
                        Message = $"The meeting has been cancelled: {meeting.Title}",
                        Type = "Meeting",
                        Link = "/meetings",
                        IsRead = false,
                        CreatedAt = now
                    }).ToList();

                if (notifications.Count > 0)
                {
                    _context.Notifications.AddRange(notifications);
                }

                // Explicitly remove participant assignments.
                _context.MeetingParticipants.RemoveRange(participants);

                // Delete meeting.
                _context.Meetings.Remove(meeting);

                // Save deletion and notifications together.
                await _context.SaveChangesAsync();

                // Send real-time notifications.
                foreach (var notification in notifications)
                {
                    try
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
                    catch (Exception ex)
                    {
                        _logger.LogWarning(
                            ex,
                            "Failed to send meeting cancellation notification to {UserId}",
                            notification.UserId
                        );
                    }
                }

                // Send cancellation emails.
                int emailsSent = 0;
                int emailsFailed = 0;

                foreach (var participant in participantUsers)
                {
                    if (string.IsNullOrWhiteSpace(participant.Email))
                        continue;

                    var participantName = WebUtility.HtmlEncode(
                        participant.DisplayName ?? participant.FullName ?? "there"
                    );

                    var meetingTitle = WebUtility.HtmlEncode(meeting.Title);
                    var meetingDate = WebUtility.HtmlEncode(
                        meeting.MeetingDate.ToString()
                    );
                    var meetingTime = WebUtility.HtmlEncode(
                        meeting.MeetingTime.ToString()
                    );
                    var location = WebUtility.HtmlEncode(
                        meeting.Location ?? "Not specified"
                    );
                    var organizerDisplayName = WebUtility.HtmlEncode(organizerName);

                    var emailBody = $@"
                <div style='font-family:Arial,sans-serif;max-width:600px;margin:auto;'>
                    <h2>Meeting Cancelled</h2>

                    <p>Hi {participantName},</p>

                    <p>
                        We would like to inform you that the following meeting
                        has been cancelled by the organizer.
                    </p>

                    <h3>{meetingTitle}</h3>

                    <p><strong>Date:</strong> {meetingDate}</p>
                    <p><strong>Time:</strong> {meetingTime}</p>
                    <p><strong>Location:</strong> {location}</p>
                    <p><strong>Organizer:</strong> {organizerDisplayName}</p>

                    <p>You do not need to attend this meeting.</p>
                </div>";

                    try
                    {
                        await _emailService.SendEmailAsync(
                            participant.Email,
                            $"Meeting Cancelled: {meeting.Title}",
                            emailBody
                        );

                        emailsSent++;
                    }
                    catch (Exception ex)
                    {
                        emailsFailed++;

                        _logger.LogError(
                            ex,
                            "Failed to send meeting cancellation email to {Email}",
                            participant.Email
                        );
                    }
                }

                // Update connected clients.
                await _hub.Clients.All.SendAsync("MeetingDeleted", id);

                return Ok(new
                {
                    Message = "Meeting cancelled and deleted successfully.",
                    NotificationsSent = notifications.Count,
                    EmailsSent = emailsSent,
                    EmailsFailed = emailsFailed
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete meeting {MeetingId}", id);

                return StatusCode(500, new
                {
                    Error = "Failed to delete meeting.",
                    Detail = ex.Message
                });
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

        [HttpPut("Cancel")]
        public async Task<IActionResult> CancelMeeting([FromQuery] Guid id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { Error = "Invalid token." });

            if (!Guid.TryParse(userIdClaim, out Guid currentUserId))
                return Unauthorized(new { Error = "Invalid user ID." });

            var meeting = await _context.Meetings
                .FirstOrDefaultAsync(x => x.Id == id);

            if (meeting == null)
                return NotFound(new { Error = "Meeting not found." });

            if (meeting.OrganizerId != currentUserId)
            {
                return Forbid();
            }

            try
            {
                _context.Meetings.Remove(meeting);

                await _context.SaveChangesAsync();

                await _hub.Clients.All.SendAsync(
                    "MeetingCancelled",
                    id
                );

                return Ok(new
                {
                    Message = "Meeting cancelled successfully."
                });
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    new
                    {
                        Error = "Failed to cancel meeting.",
                        Detail = ex.Message
                    }
                );
            }
        }
    }
}
