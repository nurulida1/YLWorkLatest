using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using System.Security.Claims;
using YLWorks.Data;
using YLWorks.Hubs;
using YLWorks.Model;

namespace YLWorks.Controller
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class QuotationController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hub;
        private readonly IWebHostEnvironment _env; // <-- add this

        public QuotationController(AppDbContext context, IHubContext<NotificationHub> hub, IWebHostEnvironment env)
        {
            _context = context;
            _hub = hub;
            _env = env;
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
                // 1. Initialize Query
                var query = _context.Quotations.AsQueryable();

                // Dynamically include related data
                if (!string.IsNullOrWhiteSpace(includes))
                {
                    foreach (var include in includes.Split(',', StringSplitOptions.RemoveEmptyEntries))
                    {
                        query = query.Include(include.Trim());
                    }
                }

                // 3. Dynamic Filtering (Expression Tree)
                if (!string.IsNullOrEmpty(filter))
                {
                    var parameter = Expression.Parameter(typeof(Quotation), "q");
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
                            var propertyAccess = Expression.PropertyOrField(parameter, propertyName);

                            Expression condition;
                            // String handling
                            if (propertyAccess.Type == typeof(string))
                            {
                                var method = typeof(string).GetMethod("Contains", new[] { typeof(string) });
                                var containsExpr = Expression.Call(propertyAccess, method!, Expression.Constant(valueStr));
                                condition = isNotEqual ? Expression.Not(containsExpr) : containsExpr;
                            }
                            // Guid handling
                            else if (propertyAccess.Type == typeof(Guid) || propertyAccess.Type == typeof(Guid?))
                            {
                                var guidValue = Guid.Parse(valueStr);
                                condition = Expression.Equal(propertyAccess, Expression.Constant(guidValue, propertyAccess.Type));
                            }
                            // Enum handling (Status)
                            else if (propertyAccess.Type.IsEnum)
                            {
                                var enumValue = Enum.Parse(propertyAccess.Type, valueStr);
                                condition = Expression.Equal(propertyAccess, Expression.Constant(enumValue));
                            }
                            // General handling (Numbers/Dates)
                            else
                            {
                                var convertedValue = Convert.ChangeType(valueStr, Nullable.GetUnderlyingType(propertyAccess.Type) ?? propertyAccess.Type);
                                condition = Expression.Equal(propertyAccess, Expression.Constant(convertedValue, propertyAccess.Type));
                            }

                            orExpression = orExpression == null ? condition : Expression.AndAlso(orExpression, condition);
                        }
                        finalExpression = finalExpression == null ? orExpression : Expression.OrElse(finalExpression, orExpression);
                    }

                    if (finalExpression != null)
                    {
                        var lambda = Expression.Lambda<Func<Quotation, bool>>(finalExpression, parameter);
                        query = query.Where(lambda);
                    }
                }

                // 4. Sorting
                if (!string.IsNullOrEmpty(orderBy))
                {
                    bool descending = orderBy.EndsWith(" desc", StringComparison.OrdinalIgnoreCase);
                    var propertyName = orderBy.Replace(" desc", "", StringComparison.OrdinalIgnoreCase).Trim();
                    query = descending ? query.OrderByDescending(x => EF.Property<object>(x, propertyName))
                                       : query.OrderBy(x => EF.Property<object>(x, propertyName));
                }

                var totalElements = query.Count();

                // 5. Pagination and Execution
                var items = query.Skip((page - 1) * pageSize).Take(pageSize).ToList();

                // 6. Selective Projection
                if (!string.IsNullOrEmpty(select))
                {
                    var selectedFields = select.Split(',').Select(f => f.Trim()).ToList();
                    var projected = items.Select(item =>
                    {
                        var dict = new Dictionary<string, object?>();
                        foreach (var field in selectedFields)
                        {
                            // Note: GetProperty is case-sensitive. 
                            // Ensure Angular sends "QuotationNo" not "quotationNo"
                            var prop = item.GetType().GetProperty(field);
                            dict[field] = prop?.GetValue(item);
                        }
                        return dict;
                    });

                    return Ok(new { Data = projected, TotalElements = totalElements });
                }

                // === SET IT HERE ===
                // If no specific fields are selected, map the whole list to DTOs 
                // to prevent circular reference crashes.
                var dtoItems = items.Select(item => MapToDto(item)).ToList();

                return Ok(new { Data = dtoItems, TotalElements = totalElements });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Search failed.", Details = ex.Message });
            }
        }

        [HttpGet("GetOne")]
        public async Task<IActionResult> GetOne(string? filter = null, string? includes = null)
        {
            IQueryable<Quotation> query = _context.Quotations.AsQueryable();

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

            // USE YOUR MAPPER HERE TO PREVENT CYCLES
            return Ok(MapToDto(data));
        }
        
        [HttpPost("Create")]
        public async Task<ActionResult<object>> Create([FromBody] CreateQuotationRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized(new { Error = "Invalid token." });

            if (!request.IsDraft && string.IsNullOrWhiteSpace(request.QuotationNo))
                return BadRequest(new { Error = "Quotation Number is required for finalized records." });

            try
            {
                var quotation = new Quotation
                {
                    Id = Guid.NewGuid(),
                    QuotationNo = request.QuotationNo,
                    QuotationDate = request.QuotationDate, // Mapping IssueDate to QuotationDate
                    DueDate = request.DueDate,      // Mapping ValidUntil to DueDate
                    ClientId = request.ClientId,
                    Description = request.Description,
                    TermsConditions = request.TermsConditions,
                    BankDetails = request.BankDetails,
                    Status = "Draft",
                    Gross = request.Gross,
                    Discount = request.Discount,   // Matching your Quotation model name
                    TotalAmount = request.TotalAmount,
                    CreatedById = Guid.Parse(userIdClaim),
                    CreatedAt = DateTime.UtcNow
                };

                // Use the null-coalescing operator ?? to handle empty/null item lists
                quotation.Items = (request.Items ?? new List<QuotationItemRequest>()).Select(i => new QuotationItems
                {
                    Id = Guid.NewGuid(),
                    QuotationId = quotation.Id,
                    Item = i.Item,
                    Description = i.Description,
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice,
                    Discount = i.Discount,
                    TotalAmount = i.TotalAmount,
                    Unit = i.Unit,
                    CreatedAt = DateTime.UtcNow
                }).ToList();

                _context.Quotations.Add(quotation);
                await _context.SaveChangesAsync();

                var result = MapToDto(quotation);
                await _hub.Clients.All.SendAsync("QuotationAdded", result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Failed to create.", Details = ex.Message });
            }
        }

        [HttpPut("Update")]
        public async Task<ActionResult<object>> Update([FromBody] UpdateQuotationRequest request)
        {
            if (request == null || request.Id == Guid.Empty)
                return BadRequest("Invalid request.");

            var quotation = await _context.Quotations
                .Include(q => q.Items)
                .FirstOrDefaultAsync(q => q.Id == request.Id);

            if (quotation == null)
                return NotFound("Quotation not found.");

            try
            {
                // =========================
                // 1. UPDATE PARENT
                // =========================
                quotation.QuotationNo = request.QuotationNo ?? quotation.QuotationNo;
                quotation.QuotationDate = request.QuotationDate;
                quotation.DueDate = request.DueDate;
                quotation.Description = request.Description;
                quotation.TermsConditions = request.TermsConditions;
                quotation.BankDetails = request.BankDetails;
                quotation.ClientId = request.ClientId;
                quotation.Gross = request.Gross;
                quotation.Discount = request.Discount;
                quotation.TotalAmount = request.TotalAmount;
                quotation.Status = "Draft";
                quotation.UpdatedAt = DateTime.UtcNow;

                // =========================
                // 2. ITEM RECONCILIATION
                // =========================

                var requestItems = request.Items ?? new List<UpdateQuotationItemRequest>();

                var requestItemIds = requestItems
                    .Where(i => i.Id.HasValue && i.Id.Value != Guid.Empty)
                    .Select(i => i.Id!.Value)
                    .ToList();

                // -------------------------
                // REMOVE items not in request
                // -------------------------
                var itemsToRemove = quotation.Items
                    .Where(dbItem => !requestItemIds.Contains(dbItem.Id))
                    .ToList();

                foreach (var item in itemsToRemove)
                {
                    _context.QuotationItems.Remove(item);
                }

                // -------------------------
                // ADD or UPDATE items
                // -------------------------
                foreach (var itemReq in requestItems)
                {
                    // UPDATE EXISTING
                    if (itemReq.Id.HasValue && itemReq.Id.Value != Guid.Empty)
                    {
                        var existing = quotation.Items
                            .FirstOrDefault(i => i.Id == itemReq.Id.Value);

                        if (existing == null)
                            continue; // skip if already deleted

                        existing.Item = itemReq.Item;
                        existing.Description = itemReq.Description;
                        existing.Quantity = itemReq.Quantity;
                        existing.UnitPrice = itemReq.UnitPrice;
                        existing.Unit = itemReq.Unit;
                        existing.Discount = itemReq.Discount;
                        existing.TotalAmount = itemReq.TotalAmount;
                        existing.UpdatedAt = DateTime.UtcNow;
                    }
                    else
                    {
                        // ADD NEW ITEM
                        var newItem = new QuotationItems
                        {
                            Id = Guid.NewGuid(),
                            QuotationId = quotation.Id,
                            Item = itemReq.Item,
                            Description = itemReq.Description,
                            Quantity = itemReq.Quantity,
                            UnitPrice = itemReq.UnitPrice,
                            Unit = itemReq.Unit,
                            Discount = itemReq.Discount,
                            TotalAmount = itemReq.TotalAmount,
                            CreatedAt = DateTime.UtcNow
                        };

                        quotation.Items.Add(newItem);
                    }
                }

                // =========================
                // 3. SAVE
                // =========================
                await _context.SaveChangesAsync();

                var result = MapToDto(quotation);

                await _hub.Clients.All.SendAsync("QuotationUpdated", result);

                return Ok(result);
            }
            catch (DbUpdateConcurrencyException ex)
            {
                return Conflict(new
                {
                    Error = "This quotation was modified or deleted by another user.",
                    Details = ex.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = "Update failed.",
                    Details = ex.Message
                });
            }
        }

        [HttpPost("Preview")]
        public async Task<IActionResult> Preview([FromBody] CreateQuotationRequest request)
        {
            var client = await _context.Clients
        .Include(c => c.BillingAddress)
        .Include(c => c.DeliveryAddress)
        .FirstOrDefaultAsync(c => c.Id == request.ClientId);
            // Transient projection for frontend preview
            return Ok(new
            {
                QuotationNo = request.QuotationNo ?? "DRAFT",
                QuotationDate = request.QuotationDate,
                DueDate = request.DueDate,
                Description = request.Description,
                TermsConditions = request.TermsConditions,
                BankDetails = request.BankDetails,
                Gross = request.Gross,
                Discount = request.Discount,
                TotalAmount = request.TotalAmount,

                // Map the client found in the DB
                Client = client != null ? new
                {
                    client.Id,
                    client.Name,
                    client.ContactNo,
                    client.Email,
                    client.ContactPerson,
                    BillingAddress = client.BillingAddress,
                    DeliveryAddress = client.DeliveryAddress
                } : null,

                Items = request.Items.Select(i => new {
                    i.Item,
                    i.Description,
                    i.Quantity,
                    i.Unit,
                    i.UnitPrice,
                    i.Discount,
                    i.TotalAmount
                })
            });
        }

        private object MapToDto(Quotation q)
        {
            return new
            {
                q.Id,
                q.QuotationNo,
                q.Description,
                q.TermsConditions,
                q.BankDetails,
                q.QuotationDate,
                q.DueDate,
                q.Status,
                q.ClientId,
                Client = q.Client != null ? new Client
                {
                    Id = q.ClientId,
                    Name = q.Client.Name,
                    ContactNo = q.Client.ContactNo,
                    Email = q.Client.Email,
                    ContactPerson = q.Client.ContactPerson, // Added for completeness

                    // Project the new structured addresses
                    BillingAddress = q.Client.BillingAddress != null ? new Address
                    {
                        Id = q.Client.BillingAddress.Id,
                        AddressLine1 = q.Client.BillingAddress.AddressLine1,
                        AddressLine2 = q.Client.BillingAddress.AddressLine2,
                        City = q.Client.BillingAddress.City,
                        State = q.Client.BillingAddress.State,
                        Country = q.Client.BillingAddress.Country,
                        Poscode = q.Client.BillingAddress.Poscode
                    } : null,

                    DeliveryAddress = q.Client.DeliveryAddress != null ? new Address
                    {
                        Id = q.Client.DeliveryAddress.Id,
                        AddressLine1 = q.Client.DeliveryAddress.AddressLine1,
                        AddressLine2 = q.Client.DeliveryAddress.AddressLine2,
                        City = q.Client.DeliveryAddress.City,
                        State = q.Client.DeliveryAddress.State,
                        Country = q.Client.DeliveryAddress.Country,
                        Poscode = q.Client.DeliveryAddress.Poscode
                    } : null
                } : null,
                q.Gross,
                q.TotalAmount,
                q.Discount,
                Items = q.Items.Select(i => new
                {
                    i.Id,
                    i.Item,
                    i.Description,
                    i.Quantity,
                    i.Unit,
                    i.UnitPrice,
                    i.Discount,
                    i.TotalAmount
                }).ToList()
            };
        }


        [HttpPatch("UpdateStatus")]
        public async Task<IActionResult> UpdateStatus([FromBody] UpdateQuotationStatusRequest request)
        {
            // 1. Fetch the quotation
            var quotation = await _context.Quotations
                .FirstOrDefaultAsync(q => q.Id == request.Id);

            if (quotation == null) return NotFound();

            string current = quotation.Status;
            string next = request.Status ?? "Draft";

            // 2. Define Allowed Transitions
            bool isValidTransition = (current, next) switch
            {
                ("Draft", "Open") => true,
                ("Draft", "Pending Signature") => true,
                ("Open", "Pending Signature") => true,

                // Status 'Signed' is usually set automatically by the system, 
                // but we allow the transition here for consistency.
                ("Pending Signature", "Signed") => true,

                // Admin Action:
                ("Signed", "Sent") => true,

                ("Sent", "Accepted") => true,
                ("Sent", "Declined") => true,
                _ => false
            };

            if (!isValidTransition)
            {
                return BadRequest(new
                {
                    Error = "Invalid Status Transition",
                    Details = $"Cannot change from {current} to {next}."
                });
            }

            // 3. Handle Business Logic for Assignment
            // Inside UpdateStatus method
            try
            {
                
                // Note: We leave the AssignedToId as-is for "Signed", "Sent", "Accepted" 
                // so we know exactly who approved this version.

                quotation.Status = next!;
                quotation.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Broadcast via SignalR
                var result = MapToDto(quotation);
                await _hub.Clients.All.SendAsync("QuotationStatusChanged", result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Update failed", Details = ex.Message });
            }
        }

        [HttpDelete("Delete")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var quotes = await _context.Quotations.FindAsync(id);
            if (quotes == null)
                return NotFound(new { Error = "Quotation not found." });


            _context.Quotations.Remove(quotes);
            await _context.SaveChangesAsync();
            return Ok(new { Success = true });
        }

 //       [HttpGet("DownloadPdf/{id}")]
 //       public async Task<IActionResult> DownloadPdf(Guid id)
 //       {
 //           // 1. Fetch Data
 //           var quotation = await _context.Quotations
 //               .Include(q => q.Client)
 //               .Include(q => q.Items)
 //               .FirstOrDefaultAsync(q => q.Id == id);

 //           if (quotation == null) return NotFound();

 //           // 2. Prepare Images
 //           // Note: Assuming logo is local and signature is a web URL
 //           string logoPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "assets", "yl-logo.png");
 //           byte[] logoData = System.IO.File.Exists(logoPath) ? System.IO.File.ReadAllBytes(logoPath) : null;

 //           byte[] signatureData = null;
 //           if (!string.IsNullOrEmpty(quotation.SignatureImageUrl))
 //           {
 //               if (quotation.SignatureImageUrl.StartsWith("data:image", StringComparison.OrdinalIgnoreCase))
 //               {
 //                   // It's a Base64 string! We need to strip the "data:image/png;base64," part
 //                   var base64Data = quotation.SignatureImageUrl.Split(',')[1];
 //                   signatureData = Convert.FromBase64String(base64Data);
 //               }
 //               else
 //               {
 //                   // It's a real URL (http/https)
 //                   using var client = new HttpClient();
 //                   signatureData = await client.GetByteArrayAsync(quotation.SignatureImageUrl);
 //               }
 //           }

 //           var webRoot = _env.WebRootPath; // wwwroot folder
 //           var fontRegular = Path.Combine(webRoot, "fonts", "Outfit-Regular.ttf");
 //           var fontBold = Path.Combine(webRoot, "fonts", "Outfit-Bold.ttf");

 //           QuestPDF.Settings.UseEnvironmentFonts = false;
 //           QuestPDF.Settings.FontDiscoveryPaths.Clear();
 //           QuestPDF.Settings.FontDiscoveryPaths.Add(fontRegular);
 //           QuestPDF.Settings.FontDiscoveryPaths.Add(fontBold);


 //           // 3. Define the Document Structure
 //           var document = Document.Create(container =>
 //           {
 //               container.Page(page =>
 //               {
 //                   // Styling based on YL Works.pdf 
 //                   page.Size(PageSizes.A4);
 //                   page.Margin(1.5f, Unit.Centimetre);
 //                   page.PageColor(Colors.White);
 //                   page.DefaultTextStyle(x => x.FontSize(9)
 //                                                      .FontFamily("Outfit-Regular") // use font name, not path
 //                                                      .FontColor(Colors.Black));
 //                   // --- HEADER ---
 //                   page.Header().PaddingBottom(10).Row(row =>
 //                   {
 //                       row.RelativeItem().Column(col =>
 //                       {
 //                           col.Spacing(5); // <-- sets gap between each Item

 //                           // Company Name and Tagline [cite: 26, 27]
 //                           col.Item().Text("YL Systems Sdn Bhd").FontSize(16).Bold().FontColor("#1e3a8a");
 //                           col.Item().Text("ELV TECHNOLOGY SOLUTION PROVIDER").FontSize(7).SemiBold().FontColor(Colors.Grey.Medium);
 //                       });

 //                       row.RelativeItem().AlignRight().Column(col =>
 //                       {
 //                           col.Spacing(5); // <-- sets gap between each Item

 //                           col.Item().Text("QUOTATION")
 //                               .FontSize(22)
 //                               .Medium()
 //                               .FontColor(Colors.Grey.Lighten1);

 //                           col.Item().Text(quotation.QuotationNo)
 //                               .FontSize(12)
 //                               .Bold()
 //                               .AlignRight();

 //                           col.Item().Text($"Date: {quotation.QuotationDate:dd MMM yyyy}")
 //                               .FontSize(8)
 //                               .AlignRight();

 //                           col.Item().Text($"Valid Until: {quotation.DueDate:dd MMM yyyy}")
 //                               .FontSize(8)
 //                               .AlignRight();

 //                           col.Item()
 //.Column(col =>
 //{
 //    col.Item().Text(quotation.Client?.Address ?? "", TextStyle.Default.FontSize(8));

 //    // Horizontal divider
 //    col.Item().PaddingVertical(2).LineHorizontal(1).LineColor(Colors.Grey.Medium);
 //});

 //                       });



 //                   });

 //                   page.Content().Column(column =>
 //                   {
 //                       // --- ADDRESS SECTION --- [cite: 28-32, 37-42]
 //                       column.Item().PaddingVertical(10).Row(row =>
 //                       {
 //                           // --- FROM (Left side) ---
 //                           row.RelativeItem().Column(c =>
 //                           {
 //                               c.Spacing(3);
 //                               c.Item().Text("FROM").FontSize(8).Bold().FontColor("#2563eb");
 //                               c.Item().Text("YL Systems Sdn Bhd").Bold();
 //                               c.Item().Text("42, Jln 21/19, Sea Park");
 //                               c.Item().Text("46300 Petaling Jaya, Selangor");
 //                               c.Item().Text("Contact: 03-78773929");
 //                           });

 //                           // --- BILL TO (Right side) ---
 //                           row.RelativeItem().AlignRight().Column(c => // 35% width
 //                           {
 //                               c.Spacing(3);
 //                               c.Item().Text("BILL TO").FontSize(8).Bold().FontColor("#2563eb").AlignRight(); // text right
 //                               c.Item().Text(quotation.Client?.Name ?? "N/A").Bold().AlignRight();
 //                               c.Item().MaxWidth(120)
 //                                .Column(col =>
 //                                {
 //                                    col.Item().Text(quotation.Client?.Address ?? "").AlignRight();
 //                                });
 //                               c.Item().AlignRight().Column(col =>
 //                               {
 //                                   col.Item().Text(txt =>
 //                                   {
 //                                       txt.Span("Attn: ").Bold();
 //                                       txt.Span(quotation.Client?.ContactPerson ?? "");
 //                                   });
 //                               });
 //                               c.Item().AlignRight().Column(col =>
 //                               {
 //                                   col.Item().Text(txt =>
 //                                   {
 //                                       txt.Span("Email: ").Bold();
 //                                       txt.Span(quotation.Client?.Email ?? "");
 //                                   });
 //                               });

 //                           });
 //                       });


 //                       // --- MAIN ITEMS TABLE --- 
 //                       column.Item().PaddingTop(10).Table(table =>
 //                       {
 //                           table.ColumnsDefinition(columns =>
 //                           {
 //                               columns.RelativeColumn(4); // DESCRIPTION
 //                               columns.RelativeColumn();  // QTY
 //                               columns.RelativeColumn();  // UNIT
 //                               columns.RelativeColumn();  // RATE
 //                               columns.RelativeColumn();  // TAX
 //                               columns.RelativeColumn();  // AMOUNT
 //                           });

 //                           table.Header(header =>
 //                           {
 //                               header.Cell().Element(CellStyle).Text("DESCRIPTION");
 //                               header.Cell().Element(CellStyle).AlignCenter().Text("QTY");
 //                               header.Cell().Element(CellStyle).AlignCenter().Text("UNIT");
 //                               header.Cell().Element(CellStyle).AlignCenter().Text("RATE (RM)");
 //                               header.Cell().Element(CellStyle).AlignCenter().Text("TAX");
 //                               header.Cell().Element(CellStyle).AlignCenter().Text("AMOUNT (RM)");

 //                               static IContainer CellStyle(IContainer c) => c.BorderBottom(1).BorderColor(Colors.Black).PaddingVertical(5).DefaultTextStyle(t => t.FontSize(8).Bold());
 //                           });

 //                           foreach (var item in quotation.Items)
 //                           {
 //                               table.Cell().Element(RowStyle).Text(item.Description);
 //                               table.Cell().Element(RowStyle).AlignCenter().Text(item.Quantity.ToString());
 //                               table.Cell().Element(RowStyle).AlignCenter().Text(item.Unit);
 //                               table.Cell().Element(RowStyle).AlignCenter().Text(item.Rate.ToString("N2"));
 //                               table.Cell().Element(RowStyle).AlignCenter().Text($"{item.TaxRate}%");
 //                               table.Cell().Element(RowStyle).AlignCenter().Text(item.Amount.ToString("N2"));

 //                               static IContainer RowStyle(IContainer c) => c.BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten3).PaddingVertical(5);
 //                           }
 //                       });

 //                       // --- BOTTOM SECTION: NOTES & TOTALS --- [cite: 44-46]
 //                       column.Item().PaddingTop(15).Row(row =>
 //                       {
 //                           // Left side: Notes and Signature [cite: 47-49]
 //                           row.RelativeItem().Column(c =>
 //                           {
 //                               c.Item().Text("NOTES").FontSize(8).Bold();
 //                               c.Item().Text(quotation.Description ?? "").FontSize(8);

 //                               if (signatureData != null)
 //                               {
 //                                   c.Item().PaddingTop(25).Column(sig =>
 //                                   {
 //                                       sig.Item().Width(100).Image(signatureData);
 //                                       sig.Item().PaddingTop(5).Text(quotation.SignatureName ?? "NURUL IDA").Bold();
 //                                       sig.Item().Text("AUTHORIZED SIGNATURE").FontSize(7).FontColor(Colors.Grey.Medium);
 //                                   });
 //                               }
 //                           });

 //                           // Right side: Summary Table 
 //                           row.RelativeItem().AlignRight().Column(c =>
 //                           {
 //                               var subtotal = quotation.Items.Sum(i => i.Amount);
 //                               var discountPercent = quotation.DiscountRate;
 //                               var discountAmount = (subtotal * discountPercent) / 100m;

 //                               c.Item().Width(180).Table(t =>
 //                               {
 //                                   t.ColumnsDefinition(cd => { cd.RelativeColumn(); cd.RelativeColumn(); });

 //                                   t.Cell().PaddingVertical(2).Text("Subtotal");
 //                                   t.Cell().PaddingVertical(2).AlignRight().Text($"RM {subtotal:N2}");

 //                                   if (discountPercent > 0)
 //                                   {
 //                                       t.Cell().PaddingVertical(2).Text($"Discount ({discountPercent}%)");
 //                                       t.Cell().PaddingVertical(2).AlignRight().Text($"-RM {discountAmount:N2}");
 //                                   }

 //                                   t.Cell().PaddingVertical(5).BorderTop(1).Text("Total Amount").Bold();
 //                                   t.Cell().PaddingVertical(5).BorderTop(1).AlignRight().Text($"RM {quotation.TotalAmount:N2}").Bold();
 //                               });
 //                           });
 //                       });
 //                   });
 //               });
 //           });
 //           document.ShowInCompanion(); // live preview

 //           byte[] pdfBytes = document.GeneratePdf(); // for download if needed
 //           return File(pdfBytes, "application/pdf", $"Quotation_{quotation.QuotationNo}.pdf");
 //       }

        [HttpPost("Clone/{id}")]
        public async Task<IActionResult> Clone(Guid id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();

            // 1. Fetch the source quotation with its items
            var source = await _context.Quotations
                .Include(q => q.Items)
                .FirstOrDefaultAsync(q => q.Id == id);

            if (source == null) return NotFound("Source quotation not found.");

            try
            {
                // 2. Generate New Numbers (Incremental Logic)
                // Fetches the most recent QuotationNo from the DB to ensure uniqueness
                var lastQuote = await _context.Quotations
                    .OrderByDescending(q => q.CreatedAt)
                    .Select(q => q.QuotationNo)
                    .FirstOrDefaultAsync();

                string newQuotationNo = IncrementStringNumber(lastQuote ?? source.QuotationNo);

                // 3. Create New Quotation Object
                var clonedQuotation = new Quotation
                {
                    Id = Guid.NewGuid(),
                    QuotationNo = newQuotationNo,
                    QuotationDate = DateTime.UtcNow,
                    DueDate = DateTime.UtcNow.AddDays(14), // Default to 14 days or use source logic
                    ClientId = source.ClientId,
                    Description = source.Description,
                    Status = "Draft", // Always start clones as Draft
                    Gross = source.Gross,
                    Discount = source.Discount,
                    TotalAmount = source.TotalAmount,

                    CreatedById = Guid.Parse(userIdClaim),
                    CreatedAt = DateTime.UtcNow
                };

                // 4. Clone Items
                clonedQuotation.Items = source.Items.Select(i => new QuotationItems
                {
                    Id = Guid.NewGuid(),
                    QuotationId = clonedQuotation.Id,
                    Item = i.Item,
                    Description = i.Description,
                    Quantity = i.Quantity,
                    Unit = i.Unit,
                    UnitPrice = i.UnitPrice,
                    Discount = i.Discount,
                    TotalAmount = i.TotalAmount,
                    CreatedAt = DateTime.UtcNow
                }).ToList();

                _context.Quotations.Add(clonedQuotation);
                await _context.SaveChangesAsync();

                // 5. Notify Hub and Return
                var result = MapToDto(clonedQuotation);
                await _hub.Clients.All.SendAsync("QuotationAdded", result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Cloning failed", Details = ex.Message });
            }
        }

        private string IncrementStringNumber(string? input)
        {
            if (string.IsNullOrEmpty(input)) return "1";

            // Find the last group of digits in the string
            var match = System.Text.RegularExpressions.Regex.Match(input, @"\d+$");
            if (!match.Success) return input + "1";

            string digits = match.Value;
            // Increment the number and pad with leading zeros to maintain length (e.g., 001 -> 002)
            string incremented = (long.Parse(digits) + 1).ToString().PadLeft(digits.Length, '0');

            return input.Substring(0, match.Index) + incremented;
        }

        [HttpPost("ConvertToInvoice/{id}")]
        public async Task<IActionResult> ConvertToInvoice(Guid id)
        {
            var source = await _context.Quotations.Include(q => q.Items).FirstOrDefaultAsync(q => q.Id == id);
            if (source == null) return NotFound();

            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized("User ID not found in token.");

            Guid currentUserId = Guid.Parse(userIdClaim);

            var lastInv = await _context.Invoices.OrderByDescending(i => i.CreatedAt).Select(i => i.InvoiceNo).FirstOrDefaultAsync();
            string newInvoiceNo = IncrementStringNumber(lastInv ?? "INV-000");

            var invoice = new Invoice
            {
                Id = Guid.NewGuid(),
                InvoiceNo = newInvoiceNo,
                ClientId = source.ClientId,
                InvoiceDate = DateTime.UtcNow,
                DueDate = DateTime.UtcNow.AddDays(30),
                // Round the total amount
                TotalAmount = Math.Round(source.TotalAmount ?? 0m, 2),
                Status = "Unpaid",
                CreatedById = currentUserId,
                CreatedAt = DateTime.UtcNow
            };

            invoice.InvoiceItems = source.Items.Select(i => new InvoiceItem
            {
                Item = i.Item,
                Description = i.Description,
                Quantity = i.Quantity,
                // Round the rate and the line item amount
                Unit = i.Unit,
                UnitPrice = Math.Round(i.UnitPrice, 2),
                Discount = Math.Round(i.Discount ?? 0m, 2),
                TotalAmount = Math.Round(i.TotalAmount, 2)
            }).ToList();

            _context.Invoices.Add(invoice);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Invoice Created", InvoiceNo = newInvoiceNo });
        }

        [HttpPost("ConvertToPO/{id}")]
        public async Task<IActionResult> ConvertToPO(Guid id)
        {
            var source = await _context.Quotations.Include(q => q.Items).FirstOrDefaultAsync(q => q.Id == id);
            if (source == null) return NotFound();

            var lastPo = await _context.PurchaseOrders.OrderByDescending(p => p.CreatedAt).Select(p => p.PONo).FirstOrDefaultAsync();
            string newPoNo = IncrementStringNumber(lastPo ?? "PO-000");

            var po = new PurchaseOrder
            {
                Id = Guid.NewGuid(),
                PONo = newPoNo,
                POReceivedDate = DateTime.UtcNow,
                Status = "ConvertedToPO",
                TotalAmount = source.TotalAmount,
                CreatedAt = DateTime.UtcNow
            };

            po.POItems = source.Items.Select(i => new POItem
            {
                Item = i.Item,
                Description = i.Description,
                Quantity = i.Quantity,
                Unit = i.Unit,
                UnitPrice = i.UnitPrice,
                Discount = i.Discount,
                TotalAmount = i.TotalAmount
            }).ToList();

            _context.PurchaseOrders.Add(po);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "PO Created", PoNo = newPoNo });
        }
    }
}