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
    public class CompanyController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hub;

        public CompanyController(AppDbContext context, IHubContext<NotificationHub> hub)
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
                var query = _context.Companies
                    .Include(c => c.BillingAddress)
                    .Include(c => c.DeliveryAddress)
                    .AsQueryable();

                if (!string.IsNullOrEmpty(includes))
                {
                    foreach (var include in includes.Split(','))
                    {
                        query = query.Include(include.Trim());
                    }
                }

                if (!string.IsNullOrEmpty(filter))
                {
                    var parameter = Expression.Parameter(typeof(Company), "u");
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
                        var lambda = Expression.Lambda<Func<Company, bool>>(finalExpression, parameter);
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
                    .Select(c => new CompanyDto
                    {
                        Id = c.Id,
                        Name = c.Name,
                        IsActive = c.IsActive,
                        Type = c.Type,
                        LogoImage = c.LogoImage,
                        ContactNo = c.ContactNo,
                        ContactPerson1 = c.ContactPerson1,
                        BillingAddress = c.BillingAddress == null ? null : new AddressDto
                        {
                            Id = c.BillingAddress.Id
                        },

                        DeliveryAddress = c.DeliveryAddress == null ? null : new AddressDto
                        {
                            Id = c.DeliveryAddress.Id
                        }
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
        public async Task<IActionResult> GetOne(string? filter = null, string? includes = null)
        {
            IQueryable<Company> query = _context.Companies.AsQueryable();

            // Dynamically include related data
            if (!string.IsNullOrWhiteSpace(includes))
            {
                foreach (var include in includes.Split(',', StringSplitOptions.RemoveEmptyEntries))
                {
                    query = query.Include(include.Trim());
                }
            }

            // Filter by ID
            if (!string.IsNullOrEmpty(filter))
            {
                var filterValue = filter.Contains('=') ? filter.Split('=')[1].Trim() : filter.Trim();
                if (Guid.TryParse(filterValue, out Guid guidId))
                {
                    query = query.Where(d => d.Id == guidId);
                }
            }

            var data = await query.FirstOrDefaultAsync();

            if (data == null) return NotFound();

            return Ok(data);
        }



        [HttpPost("Create")]
        public async Task<ActionResult> AddCompany([FromBody] CreateCompanyRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                return BadRequest(new { Error = "Name is required." });

            try
            {
                // =========================
                // CREATE ADDRESSES
                // =========================
                Address? billingAddress = null;
                Address? deliveryAddress = null;

                if (request.BillingAddress != null)
                {
                    billingAddress = new Address
                    {
                        Id = Guid.NewGuid(),
                        AddressLine1 = request.BillingAddress.AddressLine1,
                        AddressLine2 = request.BillingAddress.AddressLine2,
                        City = request.BillingAddress.City,
                        State = request.BillingAddress.State,
                        Country = request.BillingAddress.Country,
                        Poscode = request.BillingAddress.Poscode,
                        CreatedAt = DateTime.Now
                    };

                    _context.Addresses.Add(billingAddress);
                }

                if (request.DeliveryAddress != null)
                {
                    deliveryAddress = new Address
                    {
                        Id = Guid.NewGuid(),
                        AddressLine1 = request.DeliveryAddress.AddressLine1,
                        AddressLine2 = request.DeliveryAddress.AddressLine2,
                        City = request.DeliveryAddress.City,
                        State = request.DeliveryAddress.State,
                        Country = request.DeliveryAddress.Country,
                        Poscode = request.DeliveryAddress.Poscode,
                        CreatedAt = DateTime.Now
                    };

                    _context.Addresses.Add(deliveryAddress);
                }

                // =========================
                // CREATE COMPANY
                // =========================
                var comp = new Company
                {
                    Id = Guid.NewGuid(),
                    Name = request.Name,
                    BillingAddressId = billingAddress?.Id,
                    DeliveryAddressId = deliveryAddress?.Id,
                    ContactNo = request.ContactNo,
                    ContactPerson1 = request.ContactPerson1,
                    ContactPerson2 = request.ContactPerson2,
                    FaxNo = request.FaxNo,
                    ACNo = request.ACNo,
                    Email = request.Email,
                    WebsiteUrl = request.WebsiteUrl,
                    Type = request.Type,
                    LogoImage = request.LogoImage,
                    TINNo = request.TINNo,
                    SSTRegNo = request.SSTRegNo,
                    IsActive = true,
                    SameAsBillingAddress = request.SameAsBillingAddress,
                    CreatedAt = DateTime.Now
                };

                _context.Companies.Add(comp);
                await _context.SaveChangesAsync();

                // =========================
                // RESPONSE DTO
                // =========================
                var result = new CompanyDto
                {
                    Id = comp.Id,
                    Name = comp.Name,
                    IsActive = comp.IsActive,
                    Type = comp.Type,
                    SameAsBillingAddress = comp.SameAsBillingAddress,
                    BillingAddress = billingAddress == null ? null : new AddressDto
                    {
                        Id = billingAddress.Id,
                        AddressLine1 = billingAddress.AddressLine1,
                        City = billingAddress.City,
                        Country = billingAddress.Country
                    },

                    DeliveryAddress = deliveryAddress == null ? null : new AddressDto
                    {
                        Id = deliveryAddress.Id,
                        AddressLine1 = deliveryAddress.AddressLine1,
                        City = deliveryAddress.City,
                        Country = deliveryAddress.Country
                    }
                };

                await _hub.Clients.All.SendAsync("CompanyAdded", result);

                return Ok(result);
            }
            catch (Exception)
            {
                return StatusCode(500, new { Error = "Failed to add company." });
            }
        }

        [HttpPut("Update")]
        public async Task<ActionResult> UpdateCompany([FromBody] UpdateCompanyRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var comp = await _context.Companies
                .Include(c => c.BillingAddress)
                .Include(c => c.DeliveryAddress)
                .FirstOrDefaultAsync(c => c.Id == request.Id);

            if (comp == null)
                return NotFound(new { Error = "Company not found." });

            try
            {
                comp.Name = request.Name ?? comp.Name;
                comp.ContactNo = request.ContactNo;
                comp.ContactPerson1 = request.ContactPerson1;
                comp.ContactPerson2 = request.ContactPerson2;
                comp.FaxNo = request.FaxNo;
                comp.ACNo = request.ACNo;
                comp.Email = request.Email;
                comp.WebsiteUrl = request.WebsiteUrl;
                comp.Type = request.Type;
                comp.LogoImage = request.LogoImage;
                comp.TINNo = request.TINNo;
                comp.SSTRegNo = request.SSTRegNo;
                comp.SameAsBillingAddress = request.SameAsBillingAddress;
                comp.UpdatedAt = DateTime.Now;

                // =========================
                // UPDATE / CREATE BILLING
                // =========================
                if (request.BillingAddress != null)
                {
                    if (comp.BillingAddress != null)
                    {
                        comp.BillingAddress.AddressLine1 = request.BillingAddress.AddressLine1;
                        comp.BillingAddress.City = request.BillingAddress.City;
                        comp.BillingAddress.State = request.BillingAddress.State;
                        comp.BillingAddress.Country = request.BillingAddress.Country;
                        comp.BillingAddress.Poscode = request.BillingAddress.Poscode;
                    }
                    else
                    {
                        var billing = new Address
                        {
                            Id = Guid.NewGuid(),
                            AddressLine1 = request.BillingAddress.AddressLine1,
                            City = request.BillingAddress.City,
                            State = request.BillingAddress.State,
                            Country = request.BillingAddress.Country,
                            Poscode = request.BillingAddress.Poscode
                        };

                        _context.Addresses.Add(billing);
                        comp.BillingAddressId = billing.Id;
                    }
                }

                // =========================
                // UPDATE / CREATE DELIVERY
                // =========================
                if (request.DeliveryAddress != null)
                {
                    if (comp.DeliveryAddress != null)
                    {
                        comp.DeliveryAddress.AddressLine1 = request.DeliveryAddress.AddressLine1;
                        comp.DeliveryAddress.City = request.DeliveryAddress.City;
                        comp.DeliveryAddress.State = request.DeliveryAddress.State;
                        comp.DeliveryAddress.Country = request.DeliveryAddress.Country;
                        comp.DeliveryAddress.Poscode = request.DeliveryAddress.Poscode;
                    }
                    else
                    {
                        var delivery = new Address
                        {
                            Id = Guid.NewGuid(),
                            AddressLine1 = request.DeliveryAddress.AddressLine1,
                            City = request.DeliveryAddress.City,
                            State = request.DeliveryAddress.State,
                            Country = request.DeliveryAddress.Country,
                            Poscode = request.DeliveryAddress.Poscode
                        };

                        _context.Addresses.Add(delivery);
                        comp.DeliveryAddressId = delivery.Id;
                    }
                }

                await _context.SaveChangesAsync();

                var result = new CompanyDto
                {
                    Id = comp.Id,
                    Name = comp.Name,
                    IsActive = comp.IsActive
                };

                await _hub.Clients.All.SendAsync("CompanyUpdated", result);

                return Ok(result);
            }
            catch (Exception)
            {
                return StatusCode(500, new { Error = "Failed to update company." });
            }
        }

        [HttpDelete("Delete")]
        public async Task<ActionResult> DeleteCompany([FromQuery] Guid id)
        {
            var comp = await _context.Companies.FindAsync(id);

            if (comp == null)
                return NotFound(new { Error = "Company not found." });

            try
            {
                _context.Companies.Remove(comp);
                await _context.SaveChangesAsync();

                await _hub.Clients.All.SendAsync("CompanyDeleted", id);

                return Ok(new { Message = "Company deleted successfully." });
            }
            catch (Exception)
            {
                return StatusCode(500, new { Error = "Failed to delete company." });
            }
        }
    }
}
