using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using YLWorks.Data;
using YLWorks.Hubs;

namespace YLWorks.Controller
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class AppController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hub;
        public AppController(AppDbContext context, IHubContext<NotificationHub> hub)
        {
            _context = context;
            _hub = hub;
        }

        [HttpGet("DashboardSummary")]
        public async Task<IActionResult> GetDashboardSummary()
        {
            try
            {
                // --- Get UserId and Role from claims ---
                var userIdClaim = User.Claims.FirstOrDefault(c => c.Type is "UserId" or "Id" or "sub" or ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                    return Unauthorized(new { Message = "User not authorized or invalid UserId claim." });

                var role = User.Claims.FirstOrDefault(c => c.Type is "Role" or ClaimTypes.Role)?.Value;
                if (string.IsNullOrEmpty(role))
                    return Forbid("Role not found.");

                var today = DateTime.Today;
                var dashboard = new Dictionary<string, object>();
                var thisMonthStart = new DateTime(today.Year, today.Month, 1);
                var lastMonthStart = thisMonthStart.AddMonths(-1);
                var lastMonthEnd = thisMonthStart.AddDays(-1);

                if (role == "Admin")
                {
                    // --- Quotations ---
                    var totalQuotations = await _context.Quotations.CountAsync();
                    var lastMonthQuotations = await _context.Quotations.CountAsync(q =>
                        q.CreatedAt.HasValue && q.CreatedAt.Value >= lastMonthStart && q.CreatedAt.Value <= lastMonthEnd);
                    var thisMonthQuotations = await _context.Quotations.CountAsync(q =>
                        q.CreatedAt.HasValue && q.CreatedAt.Value >= thisMonthStart);

                    double quotationGrowth = lastMonthQuotations == 0
                        ? 100
                        : Math.Round(((double)(thisMonthQuotations - lastMonthQuotations) / lastMonthQuotations) * 100, 2);

                    var allStatuses = new[] { "Pending", "Approved", "Rejected" };

                    var quotationStatus = await _context.Quotations
                        .GroupBy(q => q.Status)
                        .Select(g => new { Status = g.Key.ToString(), Count = g.Count() })
                        .ToListAsync();
                    var totalPayments = await _context.Payments
                        .Where(p => p.Status == "Paid") // or "Completed" (make consistent)
                        .Select(p => (decimal?)p.Amount ?? 0m)
                        .SumAsync();

                    var months = Enumerable.Range(0, 12)
    .Select(i => DateTime.Today.AddMonths(-11 + i))
    .Select(d => new
    {
        d.Year,
        d.Month,
        Label = new DateTime(d.Year, d.Month, 1).ToString("MMM yyyy")
    })
    .ToList();
                    var payments = await _context.Payments
     .Where(p => p.PaidAmount > 0)
     .GroupBy(p => new { p.PaymentDate.Year, p.PaymentDate.Month })
     .Select(g => new
     {
         g.Key.Year,
         g.Key.Month,
         Income = g
             .Where(x => x.ClientId != null)
             .Sum(x => (decimal?)x.PaidAmount ?? 0m),
         Expense = g
             .Where(x => x.SupplierId != null)
             .Sum(x => (decimal?)x.PaidAmount ?? 0m)
     })
     .ToListAsync();

                    var monthlyPayments = months
    .Select(m =>
    {
        var match = payments
            .FirstOrDefault(p => p.Year == m.Year && p.Month == m.Month);

        return new
        {
            m.Label,
            Income = match?.Income ?? 0m,
            Expense = match?.Expense ?? 0m
        };
    })
    .ToList();

                    dashboard["PaymentChart"] = monthlyPayments;
                    // Income = payments from clients
                    var totalIncome = await _context.Payments
                        .Where(p => p.ClientId != null && p.Status == "Completed")
                        .Select(p => (decimal?)p.Amount ?? 0m)
                        .SumAsync();

                    // Expense = payments to suppliers
                    var totalExpense = await _context.Payments
                        .Where(p => p.SupplierId != null && p.Status == "Completed")
                        .Select(p => (decimal?)p.Amount ?? 0m)
                        .SumAsync();

                    // Optional: This month income/expense
                    var thisMonthIncome = await _context.Payments
                        .Where(p => p.ClientId != null
                            && p.Status == "Completed"
                            && p.PaymentDate >= thisMonthStart)
                        .Select(p => (decimal?)p.Amount ?? 0m)
                        .SumAsync();

                    var thisMonthExpense = await _context.Payments
                        .Where(p => p.SupplierId != null
                            && p.Status == "Completed"
                            && p.PaymentDate >= thisMonthStart)
                        .Select(p => (decimal?)p.Amount ?? 0m)
                        .SumAsync();

                    // Merge with allStatuses to ensure zero counts
                    var result = allStatuses
                        .Select(s => new
                        {
                            Status = s,
                            Count = quotationStatus.FirstOrDefault(q => q.Status == s)?.Count ?? 0
                        })
                        .ToList();

                    dashboard["PaymentActivity"] = new
                    {
                        Total = totalPayments,
                        Income = new
                        {
                            Total = totalIncome,
                            ThisMonth = thisMonthIncome
                        },
                        Expense = new
                        {
                            Total = totalExpense,
                            ThisMonth = thisMonthExpense
                        }
                    };

                    dashboard["Quotations"] = new
                    {
                        Total = totalQuotations,
                        GrowthPercent = quotationGrowth,
                        Status = result
                    };

                    // --- Purchase Orders ---
                    var totalPOs = await _context.PurchaseOrders.CountAsync();
                    var lastMonthPOs = await _context.PurchaseOrders.CountAsync(po =>
                        po.CreatedAt.HasValue && po.CreatedAt.Value >= lastMonthStart && po.CreatedAt.Value <= lastMonthEnd);
                    var thisMonthPOs = await _context.PurchaseOrders.CountAsync(po =>
                        po.CreatedAt.HasValue && po.CreatedAt.Value >= thisMonthStart);

                    double poGrowth = lastMonthPOs == 0
                        ? 100
                        : Math.Round(((double)(thisMonthPOs - lastMonthPOs) / lastMonthPOs) * 100, 2);

                    dashboard["PurchaseOrders"] = new
                    {
                        Total = totalPOs,
                        GrowthPercent = poGrowth
                    };

                    // --- Invoices ---
                    var totalInvoices = await _context.Invoices.CountAsync();
                    var paidInvoices = await _context.Invoices.CountAsync(i => i.Status == "Paid");
                    var unpaidInvoices = await _context.Invoices.CountAsync(i => i.Status == "Pending" || i.Status == "PartialPaid");

                    var paidAmount = await _context.Invoices
                        .Where(i => i.Status == "Paid")
                        .Select(i => (decimal?)i.TotalAmount ?? 0m)
                        .SumAsync();

                    var unpaidAmount = await _context.Invoices
                        .Where(i => i.Status == "Pending" || i.Status == "PartialPaid")
                        .Select(i => (decimal?)i.TotalAmount ?? 0m)
                        .SumAsync();

                    var lastMonthInvoices = await _context.Invoices.CountAsync(i =>
                        i.CreatedAt.HasValue && i.CreatedAt.Value >= lastMonthStart && i.CreatedAt.Value <= lastMonthEnd);
                    var thisMonthInvoices = await _context.Invoices.CountAsync(i =>
                        i.CreatedAt.HasValue && i.CreatedAt.Value >= thisMonthStart);

                    double invoiceGrowth = lastMonthInvoices == 0
                        ? 100
                        : Math.Round(((double)(thisMonthInvoices - lastMonthInvoices) / lastMonthInvoices) * 100, 2);

                    dashboard["Invoices"] = new
                    {
                        Total = totalInvoices,
                        GrowthPercent = invoiceGrowth,
                        Paid = new { Count = paidInvoices, Amount = paidAmount },
                        Unpaid = new { Count = unpaidInvoices, Amount = unpaidAmount }
                    };

                    // --- Revenue ---
                    var revenueMonthly = await _context.Payments
                        .Where(p => p.Status == "Completed" && p.CreatedAt.HasValue)
                        .GroupBy(p => new { p.CreatedAt.Value.Year, p.CreatedAt.Value.Month })
                        .Select(g => new
                        {
                            Year = g.Key.Year,
                            Month = g.Key.Month,
                            Label = $"{g.Key.Month}/{g.Key.Year}",
                            Total = g.Sum(x => (decimal?)x.Amount ?? 0m)
                        })
                        .OrderBy(x => x.Year).ThenBy(x => x.Month)
                        .ToListAsync();

                    var totalRevenue = revenueMonthly.Sum(r => r.Total);

                    var lastMonthRevenue = await _context.Payments
                        .Where(p => p.Status == "Completed" &&
                                    p.CreatedAt >= lastMonthStart && p.CreatedAt <= lastMonthEnd)
                        .Select(p => (decimal?)p.Amount ?? 0m)
                        .SumAsync();

                    var thisMonthRevenue = await _context.Payments
                        .Where(p => p.Status == "Completed" && p.CreatedAt >= thisMonthStart)
                        .Select(p => (decimal?)p.Amount ?? 0m)
                        .SumAsync();

                    decimal revenueGrowth = lastMonthRevenue == 0
                        ? 100m
                        : Math.Round((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100m, 2);

                    dashboard["Revenue"] = new
                    {
                        Total = totalRevenue,
                        GrowthPercent = revenueGrowth,
                        Trend = revenueMonthly
                    };
                }

                return Ok(dashboard);
            }
            catch (Exception ex)
            {
                // Log the exception here for debugging
                Console.WriteLine(ex);
                return StatusCode(500, new { Message = "Error fetching dashboard summary", Details = ex.Message });
            }
        }

    }
}
