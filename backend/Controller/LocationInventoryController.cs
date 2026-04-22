using Azure.Core;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using YLWorks.Data;
using YLWorks.Hubs;
using YLWorks.Model;

namespace YLWorks.Controller
{
	[Route("api/[controller]")]
	[ApiController]
	public class LocationInventoryController : ControllerBase
	{
		private readonly AppDbContext _context;
		private readonly IHubContext<NotificationHub> _hub;

		public LocationInventoryController(AppDbContext context, IHubContext<NotificationHub> hub)
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
				var query = _context.LocationInventories.AsQueryable();

				if (!string.IsNullOrEmpty(filter))
				{
					var parameter = Expression.Parameter(typeof(LocationInventory), "u");
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
						var lambda = Expression.Lambda<Func<LocationInventory, bool>>(finalExpression, parameter);
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
					.Select(p => new
					{
						p.Id,
						p.Name
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
		[HttpPost("Create")]
		public async Task<ActionResult<LocationInventory>> AddLocationInventory([FromBody] CreateLocationInventoryRequest request)
		{
			if (string.IsNullOrWhiteSpace(request.Name))
				return BadRequest(new { Error = "Name is required." });

			try
			{
				var location = new LocationInventory
				{
					Id = Guid.NewGuid(),
					Name = request.Name,
				};

				location.CreatedAt = DateTime.Now;

				_context.LocationInventories.Add(location);
				await _context.SaveChangesAsync();


				var result = await _context.LocationInventories
					.Where(d => d.Id == location.Id)
					.Select(d => new LocationInventory
					{
						Id = d.Id,
						Name = d.Name
					})
					.FirstAsync();

				// Optional: Notify via SignalR
				await _hub.Clients.All.SendAsync("LocationAdded", location);

				return Ok(result);
			}
			catch (Exception)
			{
				return StatusCode(500, new { Error = "Failed to add location." });
			}
		}

		[HttpPut("Update")]
		public async Task<ActionResult<LocationInventory>> UpdateLocationInventory([FromBody] UpdateLocationInventoryRequest request)
		{
			if (!ModelState.IsValid)
				return BadRequest(ModelState);

			var location = await _context.LocationInventories.FindAsync(request.Id);
			if (location == null)
				return NotFound(new { Error = "Location not found." });

			try
			{
				location.Name = request.Name;
				location.UpdatedAt = DateTime.Now;

				_context.LocationInventories.Update(location);
				await _context.SaveChangesAsync();

				// Optional: Notify via SignalR
				var result = await _context.LocationInventories
		   .Where(d => d.Id == location.Id)
		   .Select(d => new LocationInventory
		   {
			   Id = d.Id,
			   Name = d.Name,
		   })
		   .FirstAsync();
				await _hub.Clients.All.SendAsync("LocationUpdated", location);

				return Ok(result);
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { Error = "Failed to update location." });
			}
		}

		[HttpDelete("Delete")]
		public async Task<ActionResult> DeleteLocationInventory([FromQuery] Guid id)
		{
			var location = await _context.LocationInventories.FindAsync(id);
			if (location == null)
				return NotFound(new { Error = "Location not found." });

			try
			{
				_context.LocationInventories.Remove(location);
				await _context.SaveChangesAsync();

				// Optional: Notify via SignalR
				await _hub.Clients.All.SendAsync("LocationDeleted", id);

				return Ok(new { Message = "Location deleted successfully." });
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { Error = "Failed to delete location." });
			}
		}

	}
}
