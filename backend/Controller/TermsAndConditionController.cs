using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using YLWorks.Data;
using YLWorks.Hubs;
using YLWorks.Model;
using WebApplication1.Helpers;
using Microsoft.AspNetCore.Authorization;

namespace YLWorks.Controller
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class TermsAndConditionController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hub;

        public TermsAndConditionController(AppDbContext context, IHubContext<NotificationHub> hub)
        {
            _context = context;
            _hub = hub;

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
                var query = _context.TermsAndConditions.AsQueryable();

                if (!string.IsNullOrEmpty(includes))
                {
                    foreach (var include in includes.Split(','))
                    {
                        query = query.Include(include.Trim());
                    }
                }

                if (!string.IsNullOrEmpty(filter))
                {
                    var parameter = Expression.Parameter(typeof(TermsAndCondition), "u");
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
                        var lambda = Expression.Lambda<Func<TermsAndCondition, bool>>(finalExpression, parameter);
                        query = query.Where(lambda);
                    }
                }


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
          u.Title,
          u.Description
      })
      .ToList();


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

        [HttpPost("Create")]
        public async Task<ActionResult<TermsAndCondition>> AddTerms([FromBody] CreateTermsAndConditionRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Title))
                return BadRequest(new { Error = "Title is required." });

            try
            {
                var term = new TermsAndCondition
                {
                    Id = Guid.NewGuid(),
                    Title = request.Title,
                    Description = request.Description,
                };

                term.CreatedAt = DateTimeHelper.Now();

                _context.TermsAndConditions.Add(term);
                await _context.SaveChangesAsync();


                var result = await _context.TermsAndConditions
                    .Where(d => d.Id == term.Id)
                    .Select(d => new TermsAndCondition
                    {
                        Id = d.Id,
                        Title = d.Title,
                        Description = d.Description
                    })
                    .FirstAsync();

                await _hub.Clients.All.SendAsync("TermsAndConditionAdded", term);

                return Ok(result);
            }
            catch (Exception)
            {
                return StatusCode(500, new { Error = "Failed to add terms and condition." });
            }
        }

        [HttpPut("Update")]
        public async Task<ActionResult<TermsAndCondition>> UpdateTerms([FromBody] UpdateTermsAndConditionRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var term = await _context.TermsAndConditions.FindAsync(request.Id);
            if (term == null)
                return NotFound(new { Error = "Terms and condition not found." });

            try
            {
                term.Title = request.Title ?? term.Title;
                term.Description = request.Description ?? term.Description;
                term.UpdatedAt = DateTimeHelper.Now();

                _context.TermsAndConditions.Update(term);
                await _context.SaveChangesAsync();

                var result = await _context.TermsAndConditions
           .Where(d => d.Id == term.Id)
           .Select(d => new TermsAndCondition
           {
               Id = d.Id,
               Title = d.Title,
               Description = d.Description
           })
           .FirstAsync();
                await _hub.Clients.All.SendAsync("TermsAndConditionUpdated", term);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Failed to update terms and condition." });
            }
        }

        [HttpDelete("Delete")]
        public async Task<ActionResult> DeleteTerms([FromQuery] Guid id)
        {
            var term = await _context.TermsAndConditions.FindAsync(id);
            if (term == null)
                return NotFound(new { Error = "Terms and condition not found." });

            try
            {
                _context.TermsAndConditions.Remove(term);
                await _context.SaveChangesAsync();

                await _hub.Clients.All.SendAsync("TermsAndConditionDeleted", id);

                return Ok(new { Message = "Terms and condition deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Failed to delete terms and condition." });
            }
        }

        [HttpPost("CreateBulk")]
        public async Task<ActionResult> CreateBulk([FromBody] CreateTermsBulkRequest request)
        {
            if (request.Items == null || !request.Items.Any())
                return BadRequest(new { Error = "Items are required." });

            try
            {
                var now = DateTimeHelper.Now();

                var terms = request.Items
    .Where(x => !string.IsNullOrWhiteSpace(x.Title))
    .Select(x => new TermsAndCondition
    {
        Id = Guid.NewGuid(),
        Title = x.Title.Trim(),
        Description = x.Description ?? "",
        CreatedAt = now
    })
    .ToList();

                _context.TermsAndConditions.AddRange(terms);
                await _context.SaveChangesAsync();

                var result = terms.Select(d => new TermsAndCondition
                {
                    Id = d.Id,
                    Title = d.Title,
                    Description = d.Description
                }).ToList();

                await _hub.Clients.All.SendAsync("TermsAndConditionBulkAdded", result);

                return Ok(result);
            }
            catch (Exception)
            {
                return StatusCode(500, new { Error = "Failed to add terms and conditions." });
            }
        }
    }
}
