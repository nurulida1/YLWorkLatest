using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Linq.Expressions;
using YLWorks.Data;
using YLWorks.Hubs;
using YLWorks.Model;
using System.Text;

namespace YLWorks.Controller
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ClientController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hub;

        public ClientController(AppDbContext context, IHubContext<NotificationHub> hub)
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
                    .Include(c => c.DeliveryAddress).Where(x => x.Type == CompanyType.Client)
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

                var total = await query.CountAsync();

                var data = await query
                    .OrderBy(x => x.Name)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(x => new CompanyDto
                    {
                        Id = x.Id,
                        Name = x.Name,
                        Email = x.Email,
                        ContactNo = x.ContactNo,
                        PrimaryContactPerson = x.PrimaryContactPerson,
                        PrimaryContactNo = x.PrimaryContactNo,
                        PrimaryEmail = x.PrimaryEmail,
                        SecondaryContactPerson = x.SecondaryContactPerson,
                        SecondaryContactNo = x.SecondaryContactNo,
                        SecondaryEmail = x.SecondaryEmail,
                        IsActive = x.IsActive,
                        BalancePayment = x.BalancePayment,
                        Type = x.Type,
                        LogoImage = x.LogoImage,

                        BillingAddress = x.BillingAddress == null ? null : new AddressDto
                        {
                            Id = x.BillingAddress.Id,
                            AddressLine1 = x.BillingAddress.AddressLine1,
                            City = x.BillingAddress.City,
                            Country = x.BillingAddress.Country
                        },

                        DeliveryAddress = x.DeliveryAddress == null ? null : new AddressDto
                        {
                            Id = x.DeliveryAddress.Id,
                            AddressLine1 = x.DeliveryAddress.AddressLine1,
                            City = x.DeliveryAddress.City,
                            Country = x.DeliveryAddress.Country
                        }
                    })
                    .ToListAsync();

                return Ok(new
                {
                    Data = data,
                    TotalElements = total
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
                        Postcode = request.BillingAddress.Postcode,
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
                        Postcode = request.DeliveryAddress.Postcode,
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
                    PrimaryContactPerson = request.PrimaryContactPerson,
                    PrimaryContactNo = request.PrimaryContactNo,
                    PrimaryEmail =request.PrimaryEmail,
                    SecondaryContactPerson = request.SecondaryContactPerson,
                    SecondaryContactNo = request.SecondaryContactNo,
                    SecondaryEmail = request.SecondaryEmail,
                    RegistrationNo = request.RegistrationNo,
                    FaxNo = request.FaxNo,
                    ACNo = request.ACNo,
                    Email = request.Email,
                    WebsiteUrl = request.WebsiteUrl,
                    Type = CompanyType.Client,
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

                await _hub.Clients.All.SendAsync("ClientAdded", result);

                return Ok(result);
            }
            catch (Exception)
            {
                return StatusCode(500, new { Error = "Failed to add client." });
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
                .FirstOrDefaultAsync(x =>
                    x.Id == request.Id &&
                    x.Type == CompanyType.Client);

            if (comp == null)
                return NotFound(new { Error = "Client not found." });

            try
            {
                comp.Name = request.Name ?? comp.Name;
                comp.ContactNo = request.ContactNo;
                comp.PrimaryContactPerson = request.PrimaryContactPerson;
                comp.PrimaryContactNo = request.PrimaryContactNo;
                comp.PrimaryEmail = request.PrimaryEmail;
                comp.SecondaryContactPerson = request.SecondaryContactPerson;
                comp.SecondaryContactNo = request.SecondaryContactNo;
                comp.SecondaryEmail = request.SecondaryEmail;
                comp.FaxNo = request.FaxNo;
                comp.ACNo = request.ACNo;
                comp.Email = request.Email;
                comp.RegistrationNo = request.RegistrationNo;
                comp.WebsiteUrl = request.WebsiteUrl;
                comp.Type = CompanyType.Client;
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
                        comp.BillingAddress.Postcode = request.BillingAddress.Postcode;
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
                            Postcode = request.BillingAddress.Postcode
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
                        comp.DeliveryAddress.Postcode = request.DeliveryAddress.Postcode;
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
                            Postcode = request.DeliveryAddress.Postcode
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

                await _hub.Clients.All.SendAsync("ClientUpdated", result);

                return Ok(result);
            }
            catch (Exception)
            {
                return StatusCode(500, new { Error = "Failed to update client." });
            }
        }

        [HttpDelete("Delete")]
        public async Task<ActionResult> DeleteCompany([FromQuery] Guid id)
        {
            var comp = await _context.Companies.FirstOrDefaultAsync(x =>
                    x.Id == id &&
                    x.Type == CompanyType.Client);

            if (comp == null)
                return NotFound(new { Error = "Client not found." });

            try
            {
                _context.Companies.Remove(comp);
                await _context.SaveChangesAsync();

                await _hub.Clients.All.SendAsync("ClientDeleted", id);

                return Ok(new { Message = "Client deleted successfully." });
            }
            catch (Exception)
            {
                return StatusCode(500, new { Error = "Failed to delete client." });
            }
        }

        [HttpGet("ExportCsv")]
        public async Task<IActionResult> ExportCsv()
        {
            try
            {
                var clients = await _context.Companies
                    .Include(c => c.BillingAddress)
                    .Where(x => x.Type == CompanyType.Client)
                    .OrderBy(x => x.Name)
                    .Select(x => new
                    {
                        x.Name,
                        x.RegistrationNo,
                        x.Email,
                        x.ContactNo,
                        x.PrimaryContactPerson,
                        x.PrimaryContactNo,
                        x.PrimaryEmail,
                        x.SecondaryContactPerson,
                        x.SecondaryContactNo,
                        x.SecondaryEmail,
                        x.WebsiteUrl,
                        x.IsActive,
                        Address = x.BillingAddress == null
                            ? ""
                            : $"{x.BillingAddress.AddressLine1}, {x.BillingAddress.City}, {x.BillingAddress.State}, {x.BillingAddress.Country}, {x.BillingAddress.Postcode}"
                    })
                    .ToListAsync();


                var csv = new StringBuilder();

                // Header
                csv.AppendLine(
                    "Company Name,Registration No,Email,Contact No,Primary Contact Person,Primary Contact No,Primary Email,Secondary Contact Person,Secondary Contact No,Secondary Email,Website,Status,Address"
                );


                // Rows
                foreach (var client in clients)
                {
                    csv.AppendLine(
                        $"\"{client.Name}\"," +
                        $"\"{client.RegistrationNo}\"," +
                        $"\"{client.Email}\"," +
                        $"\"{client.ContactNo}\"," +
                        $"\"{client.PrimaryContactPerson}\"," +
                        $"\"{client.PrimaryContactNo}\"," +
                        $"\"{client.PrimaryEmail}\"," +
                        $"\"{client.SecondaryContactPerson}\"," +
                        $"\"{client.SecondaryContactNo}\"," +
                        $"\"{client.SecondaryEmail}\"," +
                        $"\"{client.WebsiteUrl}\"," +
                        $"\"{(client.IsActive ? "Active" : "Inactive")}\"," +
                        $"\"{client.Address}\""
                    );
                }


                var bytes = Encoding.UTF8.GetBytes(csv.ToString());

                return File(
                    bytes,
                    "text/csv",
                    $"Clients_{DateTime.Now:yyyyMMddHHmmss}.csv"
                );
            }
            catch (Exception)
            {
                return StatusCode(500, new
                {
                    Error = "Failed to export clients."
                });
            }
        }
    }
}
