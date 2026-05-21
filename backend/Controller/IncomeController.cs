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
	public class IncomeController : ControllerBase
	{
		private readonly AppDbContext _context;

		public IncomeController(AppDbContext context)
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
				var query = _context.Incomes.AsQueryable();

				if (!string.IsNullOrWhiteSpace(includes))
				{
					foreach (var include in includes.Split(',', StringSplitOptions.RemoveEmptyEntries))
					{
						query = query.Include(include.Trim());
					}
				}

				if (!string.IsNullOrEmpty(filter))
				{
					var parameter = Expression.Parameter(typeof(Expense), "x");
					Expression? finalExpression = null;

					var orParts = filter.Split('|');

					foreach (var orPart in orParts)
					{
						Expression? orExpression = null;
						var andParts = orPart.Split(',');

						foreach (var andPart in andParts)
						{
							bool isNotEqual = andPart.Contains("!=");
							var kv = isNotEqual ? andPart.Split("!=") : andPart.Split('=');
							if (kv.Length != 2) continue;

							var propertyName = kv[0].Trim();
							var valueStr = kv[1].Trim();

							var property = Expression.PropertyOrField(parameter, propertyName);

							Expression condition;

							if (property.Type == typeof(string))
							{
								var method = typeof(string).GetMethod("Contains", new[] { typeof(string) });
								var contains = Expression.Call(property, method!, Expression.Constant(valueStr));
								condition = isNotEqual ? Expression.Not(contains) : contains;
							}
							else if (property.Type == typeof(Guid) || property.Type == typeof(Guid?))
							{
								var guid = Guid.Parse(valueStr);
								condition = Expression.Equal(property, Expression.Constant(guid, property.Type));
							}
							else if (property.Type.IsEnum)
							{
								var enumValue = Enum.Parse(property.Type, valueStr);
								condition = Expression.Equal(property, Expression.Constant(enumValue));
							}
							else
							{
								var converted = Convert.ChangeType(
									valueStr,
									Nullable.GetUnderlyingType(property.Type) ?? property.Type
								);

								condition = Expression.Equal(property, Expression.Constant(converted, property.Type));
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
						var lambda = Expression.Lambda<Func<Income, bool>>(finalExpression, parameter);
						query = query.Where(lambda);
					}
				}

				if (!string.IsNullOrEmpty(orderBy))
				{
					bool desc = orderBy.EndsWith(" desc", StringComparison.OrdinalIgnoreCase);
					var property = orderBy.Replace(" desc", "", StringComparison.OrdinalIgnoreCase).Trim();

					query = desc
						? query.OrderByDescending(x => EF.Property<object>(x, property))
						: query.OrderBy(x => EF.Property<object>(x, property));
				}

				var totalElements = query.Count();

				var items = query
					.Skip((page - 1) * pageSize)
					.Take(pageSize)
					.ToList();

				if (!string.IsNullOrEmpty(select))
				{
					var fields = select.Split(',').Select(x => x.Trim()).ToList();

					var projected = items.Select(item =>
					{
						var dict = new Dictionary<string, object?>();

						foreach (var field in fields)
						{
							var prop = item.GetType().GetProperty(field);
							dict[field] = prop?.GetValue(item);
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
				return StatusCode(500, new
				{
					Error = "Income GetMany failed",
					Details = ex.Message
				});
			}
		}

		[HttpGet("GetOne")]
		public async Task<IActionResult> GetOne(string? filter = null, string? includes = null)
		{
			try
			{
				IQueryable<Income> query = _context.Incomes;

				if (!string.IsNullOrWhiteSpace(includes))
				{
					foreach (var include in includes.Split(',', StringSplitOptions.RemoveEmptyEntries))
					{
						query = query.Include(include.Trim());
					}
				}

				if (!string.IsNullOrEmpty(filter))
				{
					var value = filter.Contains("=")
						? filter.Split('=')[1].Trim()
						: filter.Trim();

					if (Guid.TryParse(value, out Guid id))
					{
						query = query.Where(x => x.Id == id);
					}
				}

				var data = await query.FirstOrDefaultAsync();

				if (data == null)
					return NotFound();

				return Ok(new
				{
					data.Id,
					data.IncomeNo,
					data.Amount,
					data.IncomeDate,
					data.PaymentMode,
					data.Description,
					data.Attachment,
					data.PaymentId,
					data.ProcessedById,
					ProcessedBy = data.ProcessedBy == null ? null : new
					{
						data.ProcessedBy.Id,
						data.ProcessedBy.FullName
					}
				});
			}
			catch (Exception ex)
			{
				return StatusCode(500, new
				{
					Error = "Income GetOne failed",
					Details = ex.Message
				});
			}
		}

		[HttpPost("Create")]
		public async Task<IActionResult> Create([FromForm] CreateIncomeRequest request)
		{
			var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

			if (string.IsNullOrEmpty(userIdClaim))
				return Unauthorized();

			var userId = Guid.Parse(userIdClaim);

			string? filePath = null;

			if (request.Attachment != null)
			{
				var uploads = Path.Combine(
					Directory.GetCurrentDirectory(),
					"wwwroot/uploads/incomes"
				);

				if (!Directory.Exists(uploads))
					Directory.CreateDirectory(uploads);

				var fileName = $"{Guid.NewGuid()}_{request.Attachment.FileName}";
				var fullPath = Path.Combine(uploads, fileName);

				using (var stream = new FileStream(fullPath, FileMode.Create))
				{
					await request.Attachment.CopyToAsync(stream);
				}

				filePath = $"uploads/incomes/{fileName}";
			}

			var income = new Income
			{
				Id = Guid.NewGuid(),
				IncomeNo = await GenerateIncomeNo(),
				PaymentId = request.PaymentId,
				Amount = request.Amount,
				IncomeDate = request.IncomeDate,
				PaymentMode = request.PaymentMode,
				Description = request.Description,
				Attachment = filePath,
				ProcessedById = userId
			};

			_context.Incomes.Add(income);
			await _context.SaveChangesAsync();

			return Ok(income);
		}

		private async Task<string> GenerateIncomeNo()
		{
			var today = DateTime.UtcNow.ToString("yyyyMMdd");
			var prefix = $"INC-{today}";

			var lastIncome = await _context.Incomes
				.Where(x => x.IncomeNo.StartsWith(prefix))
				.OrderByDescending(x => x.IncomeNo)
				.FirstOrDefaultAsync();

			if (lastIncome == null)
				return $"{prefix}-0001";

			var lastNumber = int.Parse(lastIncome.IncomeNo.Split('-').Last());
			return $"{prefix}-{(lastNumber + 1):D4}";
		}
	}
}