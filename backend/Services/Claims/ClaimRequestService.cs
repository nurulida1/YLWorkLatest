using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Helpers;
using YLWorks.Data;
using YLWorks.Model;
using YLWorks.Model.Claim;

namespace YLWorks.Services.Claims
{
    public class ClaimRequestService
    {
        private readonly AppDbContext _context;
        private readonly ClaimSettingsService _settingsService;
        private readonly ClaimNotificationHelper _notifications;
        private readonly ILogger<ClaimRequestService> _logger;

        public ClaimRequestService(
            AppDbContext context,
            ClaimSettingsService settingsService,
            ClaimNotificationHelper notifications,
            ILogger<ClaimRequestService> logger)
        {
            _context = context;
            _settingsService = settingsService;
            _notifications = notifications;
            _logger = logger;
        }

        public async Task<ClaimRequestDto?> GetByIdAsync(Guid id)
        {
            var request = await GetRequestQuery().FirstOrDefaultAsync(r => r.Id == id);
            if (request == null) return null;
            var usersById = await LoadUsersWithManagersAsync();
            return MapToDto(request, usersById);
        }

        public async Task<List<ClaimRequestDto>> GetByEmployeeAsync(Guid employeeId)
        {
            var list = await GetRequestQuery()
                .Where(r => r.EmployeeId == employeeId)
                .OrderByDescending(r => r.SubmittedAt)
                .ToListAsync();
            var usersById = await LoadUsersWithManagersAsync();
            return list.Select(r => MapToDto(r, usersById)).ToList();
        }

        public async Task<List<ClaimRequestDto>> GetAllAsync()
        {
            var list = await GetRequestQuery()
                .OrderByDescending(r => r.SubmittedAt)
                .ToListAsync();
            var usersById = await LoadUsersWithManagersAsync();
            return list.Select(r => MapToDto(r, usersById)).ToList();
        }

        public async Task<ClaimDashboardDto> GetDashboardAsync(
            Guid employeeId,
            string role,
            int? year = null,
            int? month = null)
        {
            var isHrOrAdmin = ClaimRoles.Hr.Contains(role) || ClaimRoles.Admin.Contains(role);
            var query = GetRequestQuery().AsQueryable();
            if (!isHrOrAdmin)
                query = query.Where(r => r.EmployeeId == employeeId);

            var list = await query.OrderByDescending(r => r.SubmittedAt).ToListAsync();
            var usersById = await LoadUsersWithManagersAsync();
            var dtos = list.Select(r => MapToDto(r, usersById)).ToList();

            var filterYear = year ?? DateTime.UtcNow.Year;
            var filterMonth = month ?? DateTime.UtcNow.Month;
            if (filterMonth is < 1 or > 12)
                throw new ArgumentException("Month must be between 1 and 12.");

            var monthStart = new DateTime(filterYear, filterMonth, 1, 0, 0, 0, DateTimeKind.Utc);
            var monthEnd = monthStart.AddMonths(1);
            var monthDtos = dtos
                .Where(d => d.SubmittedAt >= monthStart && d.SubmittedAt < monthEnd)
                .ToList();

            return new ClaimDashboardDto
            {
                ApprovedTotal = monthDtos
                    .Where(d => d.Status == nameof(ClaimRequestStatus.Approved))
                    .Sum(d => d.TotalAmount),
                PendingTotal = monthDtos
                    .Where(d => d.Status == nameof(ClaimRequestStatus.Pending))
                    .Sum(d => d.TotalAmount),
                ApprovedCount = monthDtos.Count(d => d.Status == nameof(ClaimRequestStatus.Approved)),
                PendingCount = monthDtos.Count(d => d.Status == nameof(ClaimRequestStatus.Pending)),
                Recent = dtos.Take(10).ToList()
            };
        }

        public async Task<List<ClaimRequestDto>> GetPendingForApproverAsync(Guid approverId)
        {
            var pending = await GetRequestQuery()
                .Where(r => r.Status == ClaimRequestStatus.Pending)
                .ToListAsync();
            var usersById = await LoadUsersWithManagersAsync();
            return pending
                .Where(r => ResolveCurrentEligibleApproverIds(r, usersById).Contains(approverId))
                .Select(r => MapToDto(r, usersById))
                .OrderByDescending(r => r.SubmittedAt)
                .ToList();
        }

        public async Task<MedicalBalanceDto> GetMedicalBalanceAsync(
            Guid employeeId,
            int? year = null,
            Guid? excludeRequestId = null)
        {
            var employee = await _context.Users.FindAsync(employeeId)
                ?? throw new InvalidOperationException("Employee not found.");
            var settings = await _settingsService.GetActiveEntityAsync();
            var claimYear = year ?? DateTimeHelper.Now().Year;
            var configured = settings.MedicalAnnualLimit;
            var annualLimit = ClaimMedicalCalculator.ResolveAnnualLimit(
                employee, claimYear, configured);
            var used = await GetMedicalUsedAmountAsync(employeeId, claimYear, excludeRequestId);
            var isProrated = annualLimit < Math.Round(configured, 2, MidpointRounding.AwayFromZero);

            return new MedicalBalanceDto
            {
                Year = claimYear,
                AnnualLimit = annualLimit,
                UsedAmount = used,
                RemainingAmount = Math.Max(0m, annualLimit - used),
                PerReceiptLimit = settings.MedicalPerReceiptLimit,
                IsProrated = isProrated
            };
        }

        public async Task<PreviewOtAmountResultDto> PreviewOtAsync(PreviewOtAmountDto dto)
        {
            var employee = await _context.Users.FindAsync(dto.EmployeeId)
                ?? throw new InvalidOperationException("Employee not found.");
            if (employee.MonthlySalary is null or <= 0)
                throw new InvalidOperationException("Employee monthly salary is not set. Contact HR.");

            if (!Enum.TryParse<ClaimOtDayType>(dto.DayType, true, out var dayType))
                throw new ArgumentException("Invalid day type.");

            var settings = await _settingsService.GetActiveEntityAsync();
            var (ordinary, hourly) = ClaimOtCalculator.GetRates(employee.MonthlySalary.Value, settings);
            var amount = ClaimOtCalculator.CalculateAmount(dayType, dto.Hours, ordinary, hourly, settings);
            return new PreviewOtAmountResultDto
            {
                OrdinaryRate = ordinary,
                HourlyRate = hourly,
                Amount = amount
            };
        }

        public async Task<ClaimRequestDto> SubmitAsync(CreateClaimRequestDto dto)
        {
            var employee = await _context.Users
                .Include(u => u.ReportingManagers)
                .FirstOrDefaultAsync(u => u.Id == dto.EmployeeId)
                ?? throw new InvalidOperationException("Employee not found.");

            if (!Enum.TryParse<ClaimType>(dto.ClaimType, true, out var claimType))
                throw new ArgumentException("Invalid claim type.");

            var settings = await _settingsService.GetActiveEntityAsync();
            var claimYear = DateTimeHelper.Now().Year;
            var lines = await BuildLineItemsAsync(
                claimType, dto, employee, settings, excludeRequestId: null, claimYear);
            var total = lines.Sum(l => l.Amount);

            var autoApprove = GetReportingManagerIds(employee).Count == 0;
            var request = new ClaimRequest
            {
                Id = Guid.NewGuid(),
                EmployeeId = dto.EmployeeId,
                ClaimType = claimType,
                Status = autoApprove ? ClaimRequestStatus.Approved : ClaimRequestStatus.Pending,
                TotalAmount = total,
                Remarks = dto.Remarks?.Trim() ?? string.Empty,
                Destination = dto.Destination?.Trim(),
                TripStartDate = dto.TripStartDate?.Date,
                TripEndDate = dto.TripEndDate?.Date,
                SubmittedAt = DateTimeHelper.Now(),
                CreatedAt = DateTimeHelper.Now(),
                LineItems = lines
            };

            ValidateOutstationHeader(claimType, request);

            _context.ClaimRequests.Add(request);
            await _context.SaveChangesAsync();

            if (autoApprove)
            {
                await _notifications.SendClaimNotificationAsync(
                    employee.Id, request.Id, "Approved",
                    $"Your {claimType} claim (RM {total:0.00}) was auto-approved (no reporting manager assigned).");
            }
            else
            {
                foreach (var managerId in GetReportingManagerIds(employee))
                {
                    await _notifications.SendClaimNotificationAsync(
                        managerId, request.Id, "Submitted",
                        $"Claim from {employee.FullName} requires your approval (RM {total:0.00}).");
                }
            }

            var usersById = await LoadUsersWithManagersAsync();
            return MapToDto(await GetRequestQuery().FirstAsync(r => r.Id == request.Id), usersById);
        }

        public async Task<ClaimRequestDto> UpdatePendingAsync(Guid id, CreateClaimRequestDto dto)
        {
            var request = await GetRequestForActionAsync(id);
            if (request.Status != ClaimRequestStatus.Pending)
                throw new InvalidOperationException("Only pending claims can be edited.");
            if (request.EmployeeId != dto.EmployeeId)
                throw new InvalidOperationException("Employee mismatch.");
            if (request.Approvals.Any(a => a.Decision == ClaimApprovalDecision.Approved))
                throw new InvalidOperationException("Cannot edit a claim that already has an approval in the chain. Withdraw and submit a new claim.");

            if (!Enum.TryParse<ClaimType>(dto.ClaimType, true, out var claimType))
                throw new ArgumentException("Invalid claim type.");

            var employee = await _context.Users.FindAsync(dto.EmployeeId)
                ?? throw new InvalidOperationException("Employee not found.");
            var settings = await _settingsService.GetActiveEntityAsync();
            var lines = await BuildLineItemsAsync(
                claimType, dto, employee, settings, excludeRequestId: id, request.SubmittedAt.Year);

            _context.ClaimLineItems.RemoveRange(request.LineItems.ToList());
            request.LineItems.Clear();
            foreach (var line in lines)
            {
                line.RequestId = request.Id;
                request.LineItems.Add(line);
            }

            request.ClaimType = claimType;
            request.Remarks = dto.Remarks?.Trim() ?? string.Empty;
            request.Destination = dto.Destination?.Trim();
            request.TripStartDate = dto.TripStartDate?.Date;
            request.TripEndDate = dto.TripEndDate?.Date;
            request.TotalAmount = lines.Sum(l => l.Amount);
            request.UpdatedAt = DateTimeHelper.Now();
            ValidateOutstationHeader(claimType, request);

            await _context.SaveChangesAsync();
            var usersById = await LoadUsersWithManagersAsync();
            return MapToDto(await GetRequestQuery().FirstAsync(r => r.Id == id), usersById);
        }

        public async Task<ClaimRequestDto> ApproveAsync(Guid requestId, Guid approverId)
        {
            var request = await GetRequestForActionAsync(requestId);
            if (request.Status != ClaimRequestStatus.Pending)
                throw new InvalidOperationException("Only pending claims can be approved.");

            var usersById = await LoadUsersWithManagersAsync();
            if (!usersById.TryGetValue(approverId, out var approver))
                throw new InvalidOperationException("Approver not found.");

            var eligible = ResolveCurrentEligibleApproverIds(request, usersById);
            if (!eligible.Contains(approverId))
                throw new InvalidOperationException("You are not the current approver for this claim.");

            _context.ClaimApprovals.Add(new ClaimApproval
            {
                Id = Guid.NewGuid(),
                RequestId = requestId,
                ApproverId = approverId,
                Decision = ClaimApprovalDecision.Approved,
                ApproverRole = approver.SystemRole,
                DecidedAt = DateTimeHelper.Now(),
                CreatedAt = DateTimeHelper.Now()
            });
            request.UpdatedAt = DateTimeHelper.Now();

            var next = GetReportingManagerIds(approver);
            if (next.Count > 0)
            {
                foreach (var nextId in next)
                {
                    await _notifications.SendClaimNotificationAsync(
                        nextId, requestId, "Submitted",
                        $"Claim from {request.Employee.FullName} requires your approval (RM {request.TotalAmount:0.00}).");
                }

                var peerMsg =
                    $"Claim from {request.Employee.FullName} was approved by {DisplayName(approver)} and advanced in the approval chain.";
                foreach (var peerId in eligible.Where(id => id != approverId))
                    await _notifications.SendClaimNotificationAsync(peerId, requestId, "Submitted", peerMsg);

                await _context.SaveChangesAsync();
                usersById = await LoadUsersWithManagersAsync();
                return MapToDto(await GetRequestQuery().FirstAsync(r => r.Id == requestId), usersById);
            }

            request.Status = ClaimRequestStatus.Approved;
            await _context.SaveChangesAsync();
            await _notifications.SendClaimNotificationAsync(
                request.EmployeeId, requestId, "Approved",
                $"Your claim (RM {request.TotalAmount:0.00}) was approved.");

            usersById = await LoadUsersWithManagersAsync();
            return MapToDto(await GetRequestQuery().FirstAsync(r => r.Id == requestId), usersById);
        }

        public async Task<ClaimRequestDto> FinalizeByHrAsync(Guid requestId, Guid hrUserId)
        {
            var request = await GetRequestForActionAsync(requestId);
            if (request.Status != ClaimRequestStatus.Pending)
                throw new InvalidOperationException("Only pending claims can be finalized.");

            var usersById = await LoadUsersWithManagersAsync();
            if (!usersById.TryGetValue(hrUserId, out var hrUser))
                throw new InvalidOperationException("Approver not found.");
            if (!string.Equals(hrUser.SystemRole, "HR", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("Only HR can finalize claims.");

            var eligible = ResolveCurrentEligibleApproverIds(request, usersById);
            if (!eligible.Contains(hrUserId))
                throw new InvalidOperationException("You are not the current approver for this claim.");

            _context.ClaimApprovals.Add(new ClaimApproval
            {
                Id = Guid.NewGuid(),
                RequestId = requestId,
                ApproverId = hrUserId,
                Decision = ClaimApprovalDecision.Approved,
                ApproverRole = "HR",
                DecidedAt = DateTimeHelper.Now(),
                CreatedAt = DateTimeHelper.Now()
            });

            request.Status = ClaimRequestStatus.Approved;
            request.UpdatedAt = DateTimeHelper.Now();
            await _context.SaveChangesAsync();

            await _notifications.SendClaimNotificationAsync(
                request.EmployeeId, requestId, "Approved",
                $"Your claim (RM {request.TotalAmount:0.00}) was finalized by HR.");

            usersById = await LoadUsersWithManagersAsync();
            return MapToDto(await GetRequestQuery().FirstAsync(r => r.Id == requestId), usersById);
        }

        public async Task<ClaimRequestDto> RejectAsync(Guid requestId, Guid approverId, string rejectionReason)
        {
            if (string.IsNullOrWhiteSpace(rejectionReason))
                throw new ArgumentException("Rejection reason is required.", nameof(rejectionReason));

            var request = await GetRequestForActionAsync(requestId);
            if (request.Status != ClaimRequestStatus.Pending)
                throw new InvalidOperationException("Only pending claims can be rejected.");

            var usersById = await LoadUsersWithManagersAsync();
            if (!usersById.TryGetValue(approverId, out var approver))
                throw new InvalidOperationException("Approver not found.");

            var eligible = ResolveCurrentEligibleApproverIds(request, usersById);
            if (!eligible.Contains(approverId))
                throw new InvalidOperationException("You are not the current approver for this claim.");

            request.Status = ClaimRequestStatus.Rejected;
            request.UpdatedAt = DateTimeHelper.Now();
            _context.ClaimApprovals.Add(new ClaimApproval
            {
                Id = Guid.NewGuid(),
                RequestId = requestId,
                ApproverId = approverId,
                Decision = ClaimApprovalDecision.Rejected,
                RejectionReason = rejectionReason,
                ApproverRole = approver.SystemRole,
                DecidedAt = DateTimeHelper.Now(),
                CreatedAt = DateTimeHelper.Now()
            });

            await _context.SaveChangesAsync();
            await _notifications.SendClaimNotificationAsync(
                request.EmployeeId, requestId, "Rejected",
                $"Your claim was rejected. Reason: {rejectionReason}");

            usersById = await LoadUsersWithManagersAsync();
            return MapToDto(await GetRequestQuery().FirstAsync(r => r.Id == requestId), usersById);
        }

        public async Task<ClaimRequestDto> CancelAsync(Guid requestId, Guid requestedBy)
        {
            var request = await GetRequestForActionAsync(requestId);
            if (request.Status != ClaimRequestStatus.Pending)
                throw new InvalidOperationException("Only pending claims can be withdrawn.");
            if (request.EmployeeId != requestedBy)
                throw new InvalidOperationException("Only the claimant can withdraw this claim.");

            request.Status = ClaimRequestStatus.Cancelled;
            request.UpdatedAt = DateTimeHelper.Now();
            await _context.SaveChangesAsync();

            var usersById = await LoadUsersWithManagersAsync();
            return MapToDto(await GetRequestQuery().FirstAsync(r => r.Id == requestId), usersById);
        }

        public async Task<ClaimDocumentDto> UploadDocumentAsync(
            Guid requestId,
            IFormFile file,
            ClaimDocumentKind kind = ClaimDocumentKind.Receipt)
        {
            var request = await _context.ClaimRequests.FindAsync(requestId)
                ?? throw new InvalidOperationException("Claim request not found.");

            var folder = Path.Combine(Directory.GetCurrentDirectory(), "Uploads", "Claim");
            Directory.CreateDirectory(folder);
            var storedName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var path = Path.Combine(folder, storedName);
            await using (var stream = new FileStream(path, FileMode.Create))
                await file.CopyToAsync(stream);

            var relative = $"Uploads/Claim/{storedName}";
            var doc = new ClaimDocument
            {
                Id = Guid.NewGuid(),
                RequestId = requestId,
                DocumentKind = kind,
                FileName = file.FileName,
                FileUrl = relative,
                UploadedAt = DateTimeHelper.Now(),
                CreatedAt = DateTimeHelper.Now()
            };
            _context.ClaimDocuments.Add(doc);
            await _context.SaveChangesAsync();

            return new ClaimDocumentDto
            {
                Id = doc.Id,
                DocumentKind = doc.DocumentKind.ToString(),
                FileName = doc.FileName,
                FileUrl = doc.FileUrl,
                UploadedAt = doc.UploadedAt
            };
        }

        private async Task<List<ClaimLineItem>> BuildLineItemsAsync(
            ClaimType claimType,
            CreateClaimRequestDto dto,
            User employee,
            ClaimSettings settings,
            Guid? excludeRequestId,
            int claimYear)
        {
            if (dto.LineItems == null || dto.LineItems.Count == 0)
                throw new ArgumentException("At least one line item is required.");

            var lines = new List<ClaimLineItem>();

            switch (claimType)
            {
                case ClaimType.MonthlyReimbursement:
                    foreach (var item in dto.LineItems)
                    {
                        if (!Enum.TryParse<ClaimLineKind>(item.LineKind, true, out var kind) ||
                            kind != ClaimLineKind.MonthlyItem)
                            throw new ArgumentException("Monthly claims only allow MonthlyItem lines.");
                        if (!Enum.TryParse<ClaimReimbursementCategory>(item.Category, true, out var category))
                            throw new ArgumentException("Invalid reimbursement category.");
                        if (item.Amount <= 0)
                            throw new ArgumentException("Line amount must be greater than zero.");
                        if (item.PurchaseDate == null)
                            throw new ArgumentException("Purchase date is required for monthly claims.");

                        ValidateMonthlyLimits(category, item.Amount, settings);
                        lines.Add(new ClaimLineItem
                        {
                            Id = Guid.NewGuid(),
                            LineKind = ClaimLineKind.MonthlyItem,
                            Category = category,
                            PurchaseDate = item.PurchaseDate.Value.Date,
                            Description = item.Description?.Trim() ?? string.Empty,
                            Amount = Math.Round(item.Amount, 2, MidpointRounding.AwayFromZero),
                            CreatedAt = DateTimeHelper.Now()
                        });
                    }

                    await ValidateMedicalAnnualTotalAsync(
                        employee, lines, settings, excludeRequestId, claimYear);
                    break;

                case ClaimType.Overtime:
                    if (employee.MonthlySalary is null or <= 0)
                        throw new InvalidOperationException("Employee monthly salary is not set. Contact HR before submitting overtime claims.");

                    var (ordinary, hourly) = ClaimOtCalculator.GetRates(employee.MonthlySalary.Value, settings);
                    foreach (var item in dto.LineItems)
                    {
                        if (!Enum.TryParse<ClaimLineKind>(item.LineKind, true, out var kind) ||
                            kind != ClaimLineKind.OvertimeItem)
                            throw new ArgumentException("Overtime claims only allow OvertimeItem lines.");
                        if (!Enum.TryParse<ClaimOtDayType>(item.DayType, true, out var dayType))
                            throw new ArgumentException("Invalid overtime day type.");
                        if (item.WorkDate == null)
                            throw new ArgumentException("Work date is required for overtime.");
                        if (item.Hours is null or <= 0)
                            throw new ArgumentException("Overtime hours must be greater than zero.");

                        var amount = ClaimOtCalculator.CalculateAmount(
                            dayType, item.Hours.Value, ordinary, hourly, settings);

                        lines.Add(new ClaimLineItem
                        {
                            Id = Guid.NewGuid(),
                            LineKind = ClaimLineKind.OvertimeItem,
                            WorkDate = item.WorkDate.Value.Date,
                            DayType = dayType,
                            Hours = item.Hours,
                            OrdinaryRate = ordinary,
                            HourlyRate = hourly,
                            Description = item.Description?.Trim() ?? $"{dayType} OT",
                            Amount = amount,
                            CreatedAt = DateTimeHelper.Now()
                        });
                    }
                    break;

                case ClaimType.OutstationTravel:
                    foreach (var item in dto.LineItems)
                    {
                        if (!Enum.TryParse<ClaimLineKind>(item.LineKind, true, out var kind))
                            throw new ArgumentException("Invalid line kind.");

                        switch (kind)
                        {
                            case ClaimLineKind.Mileage:
                            {
                                if (!Enum.TryParse<ClaimVehicleType>(item.VehicleType, true, out var vehicle))
                                    throw new ArgumentException("Invalid vehicle type.");
                                if (item.Kilometers is null or <= 0)
                                    throw new ArgumentException("Kilometers must be greater than zero.");
                                var rate = vehicle == ClaimVehicleType.Car
                                    ? settings.MileageCarRatePerKm
                                    : settings.MileageMotorcycleRatePerKm;
                                var amount = Math.Round(item.Kilometers.Value * rate, 2, MidpointRounding.AwayFromZero);
                                lines.Add(new ClaimLineItem
                                {
                                    Id = Guid.NewGuid(),
                                    LineKind = ClaimLineKind.Mileage,
                                    VehicleType = vehicle,
                                    Kilometers = item.Kilometers,
                                    Description = item.Description?.Trim() ?? $"{vehicle} mileage",
                                    Amount = amount,
                                    CreatedAt = DateTimeHelper.Now()
                                });
                                break;
                            }
                            case ClaimLineKind.Expense:
                            {
                                if (item.Amount <= 0)
                                    throw new ArgumentException("Expense amount must be greater than zero.");
                                lines.Add(new ClaimLineItem
                                {
                                    Id = Guid.NewGuid(),
                                    LineKind = ClaimLineKind.Expense,
                                    Description = item.Description?.Trim() ?? "Outstation expense",
                                    Amount = Math.Round(item.Amount, 2, MidpointRounding.AwayFromZero),
                                    PurchaseDate = item.PurchaseDate?.Date,
                                    CreatedAt = DateTimeHelper.Now()
                                });
                                break;
                            }
                            case ClaimLineKind.MealAllowance:
                            {
                                if (item.MealDays is null or <= 0)
                                    throw new ArgumentException("Meal allowance days must be greater than zero.");
                                var amount = Math.Round(
                                    item.MealDays.Value * settings.MealAllowancePerDay, 2, MidpointRounding.AwayFromZero);
                                lines.Add(new ClaimLineItem
                                {
                                    Id = Guid.NewGuid(),
                                    LineKind = ClaimLineKind.MealAllowance,
                                    MealDays = item.MealDays,
                                    Description = item.Description?.Trim() ?? "Meal allowance",
                                    Amount = amount,
                                    CreatedAt = DateTimeHelper.Now()
                                });
                                break;
                            }
                            default:
                                throw new ArgumentException("Outstation claims only allow Mileage, Expense, or MealAllowance lines.");
                        }
                    }
                    break;

                default:
                    throw new ArgumentException("Unsupported claim type.");
            }

            return lines;
        }

        private static void ValidateMonthlyLimits(
            ClaimReimbursementCategory category,
            decimal amount,
            ClaimSettings settings)
        {
            if (category == ClaimReimbursementCategory.Medical && amount > settings.MedicalPerReceiptLimit)
                throw new InvalidOperationException(
                    $"Medical claim per receipt cannot exceed RM {settings.MedicalPerReceiptLimit:0.00}.");

            if (category == ClaimReimbursementCategory.SafetyShoes && amount > settings.SafetyShoesLimit)
                throw new InvalidOperationException(
                    $"Safety shoes claim cannot exceed RM {settings.SafetyShoesLimit:0.00}.");
        }

        private async Task<decimal> GetMedicalUsedAmountAsync(
            Guid employeeId,
            int claimYear,
            Guid? excludeRequestId)
        {
            return await _context.ClaimLineItems
                .Where(l =>
                    l.Request.EmployeeId == employeeId &&
                    l.Category == ClaimReimbursementCategory.Medical &&
                    l.Request.SubmittedAt.Year == claimYear &&
                    (l.Request.Status == ClaimRequestStatus.Pending ||
                     l.Request.Status == ClaimRequestStatus.Approved) &&
                    (excludeRequestId == null || l.RequestId != excludeRequestId.Value))
                .SumAsync(l => (decimal?)l.Amount) ?? 0m;
        }

        private async Task ValidateMedicalAnnualTotalAsync(
            User employee,
            List<ClaimLineItem> newLines,
            ClaimSettings settings,
            Guid? excludeRequestId,
            int claimYear)
        {
            var incoming = ClaimMedicalCalculator.SumMedicalLines(newLines);
            if (incoming <= 0)
                return;

            var annualLimit = ClaimMedicalCalculator.ResolveAnnualLimit(
                employee, claimYear, settings.MedicalAnnualLimit);
            var existing = await GetMedicalUsedAmountAsync(employee.Id, claimYear, excludeRequestId);

            if (existing + incoming > annualLimit)
            {
                var remaining = Math.Max(0m, annualLimit - existing);
                throw new InvalidOperationException(
                    $"You have exceeded your medical claim balance for {claimYear}. " +
                    $"Remaining: RM {remaining:0.00}, your claim: RM {incoming:0.00}.");
            }
        }

        private static void ValidateOutstationHeader(ClaimType claimType, ClaimRequest request)
        {
            if (claimType != ClaimType.OutstationTravel)
                return;
            if (string.IsNullOrWhiteSpace(request.Destination))
                throw new ArgumentException("Destination is required for outstation claims.");
            if (request.TripStartDate == null || request.TripEndDate == null)
                throw new ArgumentException("Trip start and end dates are required for outstation claims.");
            if (request.TripEndDate.Value.Date < request.TripStartDate.Value.Date)
                throw new ArgumentException("Trip end date cannot be before start date.");
        }

        private IQueryable<ClaimRequest> GetRequestQuery() =>
            _context.ClaimRequests
                .Include(r => r.Employee)
                .Include(r => r.Approvals)
                .Include(r => r.LineItems)
                .Include(r => r.Documents);

        private async Task<ClaimRequest> GetRequestForActionAsync(Guid requestId) =>
            await GetRequestQuery().FirstOrDefaultAsync(r => r.Id == requestId)
            ?? throw new InvalidOperationException("Claim request not found.");

        private async Task<Dictionary<Guid, User>> LoadUsersWithManagersAsync() =>
            await _context.Users.AsNoTracking()
                .Include(u => u.ReportingManagers)
                .ToDictionaryAsync(u => u.Id);

        private static HashSet<Guid> GetReportingManagerIds(User? user)
        {
            if (user?.ReportingManagers == null || user.ReportingManagers.Count == 0)
                return new HashSet<Guid>();
            return user.ReportingManagers.Select(rm => rm.ManagerId).ToHashSet();
        }

        private static HashSet<Guid> ResolveCurrentEligibleApproverIds(
            ClaimRequest request,
            Dictionary<Guid, User> usersById)
        {
            if (request.Status != ClaimRequestStatus.Pending)
                return new HashSet<Guid>();
            return ResolveEligibleApproverIdsCore(request, usersById);
        }

        private static HashSet<Guid> ResolveEligibleApproverIdsCore(
            ClaimRequest request,
            Dictionary<Guid, User> usersById)
        {
            if (!usersById.TryGetValue(request.EmployeeId, out var employee))
                return new HashSet<Guid>();

            var chainApprovals = request.Approvals
                .Where(a => a.Decision is ClaimApprovalDecision.Approved or ClaimApprovalDecision.Overridden)
                .OrderBy(a => a.DecidedAt)
                .ToList();

            if (chainApprovals.Count == 0)
                return GetReportingManagerIds(employee);

            var lastApproverId = chainApprovals[^1].ApproverId;
            if (!usersById.TryGetValue(lastApproverId, out var lastApprover))
                return new HashSet<Guid>();

            return GetReportingManagerIds(lastApprover);
        }

        private static string DisplayName(User user) =>
            string.IsNullOrWhiteSpace(user.FullName)
                ? user.DisplayName ?? user.Email
                : user.FullName;

        private static List<ClaimApprovalChainStepDto> BuildApprovalChain(
            ClaimRequest r,
            Dictionary<Guid, User> usersById,
            out bool noApproverAssigned)
        {
            noApproverAssigned = false;
            var steps = new List<ClaimApprovalChainStepDto>();

            if (!usersById.TryGetValue(r.EmployeeId, out var employee))
            {
                noApproverAssigned = true;
                return steps;
            }

            if (GetReportingManagerIds(employee).Count == 0)
            {
                noApproverAssigned = true;
                return steps;
            }

            var stepOrder = 1;
            var rejected = false;
            var seenApprovers = new HashSet<Guid>();

            var pastApprovals = r.Approvals
                .Where(a => a.Decision is ClaimApprovalDecision.Approved
                    or ClaimApprovalDecision.Overridden
                    or ClaimApprovalDecision.Rejected)
                .OrderBy(a => a.DecidedAt)
                .ToList();

            foreach (var approval in pastApprovals)
            {
                usersById.TryGetValue(approval.ApproverId, out var approverUser);
                var status = approval.Decision == ClaimApprovalDecision.Rejected ? "Rejected" : "Approved";
                if (approval.Decision == ClaimApprovalDecision.Rejected)
                    rejected = true;

                steps.Add(new ClaimApprovalChainStepDto
                {
                    StepOrder = stepOrder++,
                    ApproverId = approval.ApproverId,
                    ApproverName = approverUser != null ? DisplayName(approverUser) : "Unknown",
                    Status = status,
                    DecidedAt = approval.DecidedAt,
                    RejectionReason = approval.RejectionReason,
                    IsFinalStep = false
                });
                seenApprovers.Add(approval.ApproverId);
            }

            if (rejected || r.Status == ClaimRequestStatus.Approved || r.Status == ClaimRequestStatus.Cancelled)
            {
                if (steps.Count > 0)
                    steps[^1].IsFinalStep = true;
                return steps;
            }

            var current = ResolveEligibleApproverIdsCore(r, usersById);
            foreach (var id in current.Where(id => !seenApprovers.Contains(id)))
            {
                usersById.TryGetValue(id, out var u);
                steps.Add(new ClaimApprovalChainStepDto
                {
                    StepOrder = stepOrder++,
                    ApproverId = id,
                    ApproverName = u != null ? DisplayName(u) : "Unknown",
                    Status = "Pending",
                    IsFinalStep = GetReportingManagerIds(u).Count == 0
                });
            }

            return steps;
        }

        private static ClaimRequestDto MapToDto(ClaimRequest r, Dictionary<Guid, User> usersById)
        {
            var chain = BuildApprovalChain(r, usersById, out var noApprover);
            var currentIds = ResolveCurrentEligibleApproverIds(r, usersById).ToList();
            var rejection = r.Approvals
                .Where(a => a.Decision == ClaimApprovalDecision.Rejected)
                .OrderByDescending(a => a.DecidedAt)
                .FirstOrDefault();

            return new ClaimRequestDto
            {
                RequestId = r.Id,
                EmployeeId = r.EmployeeId,
                EmployeeName = r.Employee != null ? DisplayName(r.Employee) : string.Empty,
                ClaimType = r.ClaimType.ToString(),
                Status = r.Status.ToString(),
                TotalAmount = r.TotalAmount,
                Remarks = r.Remarks,
                SubmittedAt = r.SubmittedAt,
                Destination = r.Destination,
                TripStartDate = r.TripStartDate,
                TripEndDate = r.TripEndDate,
                RejectionReason = rejection?.RejectionReason,
                LineItems = r.LineItems.Select(l => new ClaimLineItemDto
                {
                    Id = l.Id,
                    LineKind = l.LineKind.ToString(),
                    Description = l.Description,
                    Amount = l.Amount,
                    Category = l.Category?.ToString(),
                    PurchaseDate = l.PurchaseDate,
                    WorkDate = l.WorkDate,
                    DayType = l.DayType?.ToString(),
                    Hours = l.Hours,
                    OrdinaryRate = l.OrdinaryRate,
                    HourlyRate = l.HourlyRate,
                    VehicleType = l.VehicleType?.ToString(),
                    Kilometers = l.Kilometers,
                    MealDays = l.MealDays
                }).ToList(),
                Documents = r.Documents.Select(d => new ClaimDocumentDto
                {
                    Id = d.Id,
                    DocumentKind = d.DocumentKind.ToString(),
                    FileName = d.FileName,
                    FileUrl = d.FileUrl,
                    UploadedAt = d.UploadedAt
                }).ToList(),
                CurrentApproverIds = currentIds,
                CurrentApproverId = currentIds.Count > 0 ? currentIds[0] : null,
                NoApproverAssigned = noApprover,
                ApprovalChain = chain
            };
        }
    }
}
