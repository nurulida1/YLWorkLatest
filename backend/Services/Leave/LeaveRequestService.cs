using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using YLWorks.Data;
using YLWorks.Model;
using YLWorks.Model.Leave;
using WebApplication1.Helpers;

namespace YLWorks.Services.Leave
{
    public class LeaveRequestService
    {
        private readonly AppDbContext _context;
        private readonly LeaveBalanceService _balanceService;
        private readonly LeaveBalanceCascadeService _cascadeService;
        private readonly LeaveNotificationHelper _notifications;
        private readonly EmergencyLeaveApprovalScheduler _emergencyScheduler;
        private readonly LeaveHolidayService _holidayService;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<LeaveRequestService> _logger;

        public LeaveRequestService(
            AppDbContext context,
            LeaveBalanceService balanceService,
            LeaveBalanceCascadeService cascadeService,
            LeaveNotificationHelper notifications,
            EmergencyLeaveApprovalScheduler emergencyScheduler,
            LeaveHolidayService holidayService,
            IServiceScopeFactory scopeFactory,
            ILogger<LeaveRequestService> logger)
        {
            _context = context;
            _balanceService = balanceService;
            _cascadeService = cascadeService;
            _notifications = notifications;
            _emergencyScheduler = emergencyScheduler;
            _holidayService = holidayService;
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        public async Task<LeaveRequestDto?> GetByIdAsync(Guid id)
        {
            var request = await GetRequestQuery().FirstOrDefaultAsync(r => r.Id == id);
            if (request == null) return null;
            var usersById = await LoadUsersWithManagersAsync();
            return MapToDto(request, usersById);
        }

        public async Task<List<LeaveRequestDto>> GetByEmployeeAsync(Guid employeeId)
        {
            var list = await GetRequestQuery()
                .Where(r => r.EmployeeId == employeeId)
                .OrderByDescending(r => r.SubmittedAt)
                .ToListAsync();
            var usersById = await LoadUsersWithManagersAsync();
            return list.Select(r => MapToDto(r, usersById)).ToList();
        }

        /// <summary>Pending requests where the given user is among the current eligible approvers.</summary>
        public async Task<List<LeaveRequestDto>> GetPendingForHodAsync(Guid hodId)
        {
            var usersById = await LoadUsersWithManagersAsync();

            var list = await GetRequestQuery()
                .Where(r => r.Status == LeaveRequestStatus.Pending)
                .OrderByDescending(r => r.IsEmergency)
                .ThenBy(r => r.SubmittedAt)
                .ToListAsync();

            return list
                .Where(r => ResolveCurrentEligibleApproverIds(r, usersById).Contains(hodId))
                .Select(r => MapToDto(r, usersById))
                .ToList();
        }

        public Task<List<LeaveRequestDto>> GetPendingForManagerAsync(Guid managerId) =>
            GetPendingForHodAsync(managerId);

        /// <summary>
        /// Company-wide approved leave overlapping [from, to]. Sensitive fields redacted for non-approvers.
        /// </summary>
        public async Task<LeaveCalendarResponseDto> GetCalendarAsync(
            DateTime from,
            DateTime to,
            Guid? departmentId,
            Guid? leaveTypeId,
            string viewerRole)
        {
            var fromDate = from.Date;
            var toDate = to.Date;
            if (toDate < fromDate)
                throw new ArgumentException("End date must be on or after start date.");

            var spanDays = (toDate - fromDate).TotalDays + 1;
            if (spanDays > 93)
                throw new ArgumentException("Date range cannot exceed 93 days.");

            var canViewDetails = LeaveRoles.CanApprove.Contains(viewerRole);

            // Peers must not filter by leave type (would leak type via presence).
            if (!canViewDetails)
                leaveTypeId = null;

            var query = _context.LeaveRequests
                .AsNoTracking()
                .Include(r => r.Employee)
                    .ThenInclude(e => e.Departments)
                .Include(r => r.LeaveType)
                .Where(r => r.Status == LeaveRequestStatus.Approved)
                .Where(r => r.StartDate.Date <= toDate && r.EndDate.Date >= fromDate);

            if (leaveTypeId.HasValue)
                query = query.Where(r => r.LeaveTypeId == leaveTypeId.Value);

            if (departmentId.HasValue)
            {
                var deptId = departmentId.Value;
                query = query.Where(r => r.Employee.Departments.Any(d => d.Id == deptId));
            }

            var rows = await query
                .OrderBy(r => r.StartDate)
                .ThenBy(r => r.Employee.FullName)
                .ToListAsync();

            var events = rows.Select(r => new LeaveCalendarEventDto
            {
                RequestId = r.Id,
                EmployeeId = r.EmployeeId,
                EmployeeName = r.Employee.FullName,
                StartDate = r.StartDate.Date,
                EndDate = r.EndDate.Date,
                LeaveTypeId = canViewDetails ? r.LeaveTypeId : null,
                LeaveTypeName = canViewDetails ? r.LeaveType.Name : null,
                Reason = canViewDetails ? r.Reason : null,
                TotalDays = canViewDetails ? r.TotalDays : null,
                StartSession = canViewDetails ? r.StartSession.ToString() : null,
                EndSession = canViewDetails ? r.EndSession.ToString() : null,
                CanViewDetails = canViewDetails
            }).ToList();

            return new LeaveCalendarResponseDto
            {
                CanViewDetails = canViewDetails,
                Events = events
            };
        }

        public async Task<LeaveRequestDto> SubmitAsync(CreateLeaveRequestDto dto)
        {
            var employee = await _context.Users
                .Include(u => u.Departments)
                .Include(u => u.ReportingManagers)
                .FirstOrDefaultAsync(u => u.Id == dto.EmployeeId)
                ?? throw new InvalidOperationException("Employee not found.");

            if (dto.EndDate.Date < dto.StartDate.Date)
                throw new InvalidOperationException("End date must be on or after start date.");

            await _holidayService.EnsureStartOrEndNotHolidayAsync(dto.StartDate, dto.EndDate);

            if (!LeaveDayCalculator.TryParseSession(dto.StartSession, out var startSession) ||
                !LeaveDayCalculator.TryParseSession(dto.EndSession, out var endSession))
            {
                throw new InvalidOperationException("Invalid leave session. Use Full, AM, or PM.");
            }

            var leaveType = await _context.LeaveTypes
                .FirstOrDefaultAsync(t => t.Id == dto.LeaveTypeId)
                ?? throw new InvalidOperationException("Leave type not found.");

            (startSession, endSession) = LeaveDayCalculator.NormalizeAndValidateSessions(
                dto.StartDate, dto.EndDate, startSession, endSession, leaveType.AllowsHalfDay);

            var totalDays = await _holidayService.CountChargeableDaysAsync(
                dto.StartDate, dto.EndDate, startSession, endSession);
            if (totalDays <= 0)
                throw new InvalidOperationException(
                    "Invalid leave duration. After excluding public holidays, no chargeable leave days remain.");

            if (!LeaveGenderRules.IsEligible(leaveType.ApplicableGender, employee.Gender))
            {
                throw new InvalidOperationException(
                    string.IsNullOrWhiteSpace(employee.Gender)
                        ? "Your profile gender is not set. Ask HR to update your gender before applying for this leave type."
                        : $"This leave type is only available to {LeaveGenderRules.DescribeRequirement(leaveType.ApplicableGender)}.");
            }

            var resolved = await ResolveLeaveTypeForRequestAsync(dto, leaveType);
            leaveType = resolved.LeaveType;
            var isEmergency = resolved.IsEmergency;
            var isShortNoticeAnnual = resolved.IsShortNoticeAnnual;

            var year = dto.StartDate.Year;
            LeaveBalanceCascadePlan plan;
            if (isShortNoticeAnnual)
            {
                // Full Annual → Unpaid conversion: single unpaid bucket, no cascade accept.
                plan = new LeaveBalanceCascadePlan
                {
                    Lines =
                    [
                        new LeaveBalanceAllocationLine
                        {
                            LeaveTypeId = leaveType.Id,
                            LeaveTypeName = leaveType.Name,
                            Days = totalDays,
                            SortOrder = 0,
                            IsUnpaidBucket = true
                        }
                    ],
                    IsSufficient = true,
                    RequiresAccept = false,
                    AvailableOnPrimary = totalDays
                };
            }
            else
            {
                plan = await _cascadeService.PlanAsync(
                    dto.EmployeeId, leaveType, totalDays, year, dto.StartDate);
            }

            if (!plan.IsSufficient)
            {
                return new LeaveRequestDto
                {
                    EmployeeId = dto.EmployeeId,
                    BalanceSufficient = false,
                    RemainingBalance = plan.AvailableOnPrimary,
                    BalanceOptions = new List<string>
                    {
                        "Adjust dates to fit remaining balance",
                        "Ask HR to enable balance cascade on this leave type",
                        "Apply as unpaid leave"
                    },
                    TotalDays = totalDays,
                    BalanceAllocations = MapPlanToAllocationDtos(plan)
                };
            }

            if (plan.RequiresAccept && !dto.AcceptBalanceCascade)
            {
                throw new InvalidOperationException(
                    leaveType.IsEmergency
                        ? "Emergency leave is charged from Annual Leave first, then Unpaid Leave. " +
                          "Please confirm the balance split and resubmit."
                        : "Insufficient balance on the selected leave type. Remaining days will be taken from " +
                          "Annual Leave (if available) then Unpaid Leave. Please confirm the balance split and resubmit.");
            }

            var isUnpaid = plan.Lines.All(l => l.IsUnpaidBucket);
            var hasPaidAllocations = plan.Lines.Any(l => !l.IsUnpaidBucket);

            var managerIds = GetReportingManagerIds(employee);
            // Top-of-org (no reporting managers): approve immediately with no approval-chain rows.
            var autoApproveNoManager = managerIds.Count == 0;

            var request = new LeaveRequest
            {
                Id = Guid.NewGuid(),
                EmployeeId = dto.EmployeeId,
                LeaveTypeId = leaveType.Id,
                StartDate = dto.StartDate.Date,
                EndDate = dto.EndDate.Date,
                TotalDays = totalDays,
                StartSession = startSession,
                EndSession = endSession,
                Reason = dto.Reason,
                IsEmergency = isEmergency,
                IsUnpaid = isUnpaid,
                IsShortNoticeAnnual = isShortNoticeAnnual,
                ConflictOverride = false,
                Status = autoApproveNoManager ? LeaveRequestStatus.Approved : LeaveRequestStatus.Pending,
                SubmittedAt = DateTimeHelper.Now(),
                CreatedAt = DateTimeHelper.Now()
            };

            ReplaceBalanceAllocations(request, plan);

            request.BalanceCheck = new LeaveBalanceCheckRecord
            {
                Id = Guid.NewGuid(),
                RequestId = request.Id,
                RequestedDays = totalDays,
                AvailableDays = plan.AvailableOnPrimary,
                IsSufficient = true,
                ActionTaken = plan.RequiresAccept
                    ? LeaveBalanceAction.CascadeApplied
                    : isUnpaid
                        ? LeaveBalanceAction.UnpaidApplied
                        : null,
                CheckedAt = DateTimeHelper.Now(),
                CreatedAt = DateTimeHelper.Now()
            };

            // Team overlap is allowed — conflict check no longer blocks apply.
            request.ConflictCheck = new LeaveConflictCheck
            {
                Id = Guid.NewGuid(),
                RequestId = request.Id,
                ConflictFound = false,
                OverlappingCount = 0,
                OverlappingEmployees = string.Empty,
                EmployeeOverride = false,
                CheckedAt = DateTimeHelper.Now(),
                CreatedAt = DateTimeHelper.Now()
            };

            _context.LeaveRequests.Add(request);

            if (hasPaidAllocations)
            {
                if (autoApproveNoManager)
                    await DeductPaidAllocationsAsync(request, year);
                else
                    await AddPendingPaidAllocationsAsync(request, year);
            }

            await _context.SaveChangesAsync();

            if (autoApproveNoManager)
            {
                await _notifications.SendLeaveNotificationAsync(
                    employee.Id,
                    request.Id,
                    "Approved",
                    $"Your leave request ({request.StartDate:dd MMM} - {request.EndDate:dd MMM}) was approved.");
                ScheduleCalendarSync(request.Id);
                _logger.LogInformation(
                    "Leave request {RequestId} auto-approved (no reporting managers) for {EmployeeId}",
                    request.Id, dto.EmployeeId);
            }
            else
            {
                var shortNoticeLabel = isShortNoticeAnnual ? "short-notice annual (unpaid) " : "";
                var cascadeLabel = plan.RequiresAccept ? "cascade-split " : "";
                var notifyType = isEmergency ? "Emergency" : "Submitted";
                var notifyMsg =
                    $"{employee.FullName} submitted a {(isEmergency ? "emergency " : "")}{shortNoticeLabel}{cascadeLabel}leave request ({totalDays} day(s)).";
                foreach (var managerId in managerIds)
                {
                    await _notifications.SendLeaveNotificationAsync(
                        managerId, request.Id, notifyType, notifyMsg);
                }

                if (isEmergency)
                    _emergencyScheduler.ScheduleAutoApproval(request.Id);

                _logger.LogInformation("Leave request {RequestId} submitted by {EmployeeId}", request.Id, dto.EmployeeId);
            }

            var loaded = await GetRequestQuery().FirstAsync(r => r.Id == request.Id);
            var usersById = await LoadUsersWithManagersAsync();
            return MapToDto(loaded, usersById);
        }

        public async Task<LeaveRequestDto> UpdatePendingAsync(Guid requestId, CreateLeaveRequestDto dto)
        {
            var request = await GetRequestQuery().FirstOrDefaultAsync(r => r.Id == requestId)
                ?? throw new InvalidOperationException("Leave request not found.");

            if (request.Status != LeaveRequestStatus.Pending)
                throw new InvalidOperationException("Only pending requests can be edited.");
            if (request.EmployeeId != dto.EmployeeId)
                throw new InvalidOperationException("You can only edit your own leave request.");

            if (dto.EndDate.Date < dto.StartDate.Date)
                throw new InvalidOperationException("End date must be on or after start date.");

            await _holidayService.EnsureStartOrEndNotHolidayAsync(dto.StartDate, dto.EndDate);

            if (!LeaveDayCalculator.TryParseSession(dto.StartSession, out var startSession) ||
                !LeaveDayCalculator.TryParseSession(dto.EndSession, out var endSession))
            {
                throw new InvalidOperationException("Invalid leave session. Use Full, AM, or PM.");
            }

            var leaveType = await _context.LeaveTypes
                .FirstOrDefaultAsync(t => t.Id == dto.LeaveTypeId)
                ?? throw new InvalidOperationException("Leave type not found.");

            (startSession, endSession) = LeaveDayCalculator.NormalizeAndValidateSessions(
                dto.StartDate, dto.EndDate, startSession, endSession, leaveType.AllowsHalfDay);

            var totalDays = await _holidayService.CountChargeableDaysAsync(
                dto.StartDate, dto.EndDate, startSession, endSession);
            if (totalDays <= 0)
                throw new InvalidOperationException(
                    "Invalid leave duration. After excluding public holidays, no chargeable leave days remain.");

            var employee = await _context.Users.AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == dto.EmployeeId)
                ?? throw new InvalidOperationException("Employee not found.");

            if (!LeaveGenderRules.IsEligible(leaveType.ApplicableGender, employee.Gender))
            {
                throw new InvalidOperationException(
                    string.IsNullOrWhiteSpace(employee.Gender)
                        ? "Your profile gender is not set. Ask HR to update your gender before applying for this leave type."
                        : $"This leave type is only available to {LeaveGenderRules.DescribeRequirement(leaveType.ApplicableGender)}.");
            }

            var resolved = await ResolveLeaveTypeForRequestAsync(dto, leaveType);
            leaveType = resolved.LeaveType;
            var isEmergency = resolved.IsEmergency;
            var isShortNoticeAnnual = resolved.IsShortNoticeAnnual;
            var year = dto.StartDate.Year;

            var creditBack = BuildCreditBackFromRequest(request, year);

            LeaveBalanceCascadePlan plan;
            if (isShortNoticeAnnual)
            {
                plan = new LeaveBalanceCascadePlan
                {
                    Lines =
                    [
                        new LeaveBalanceAllocationLine
                        {
                            LeaveTypeId = leaveType.Id,
                            LeaveTypeName = leaveType.Name,
                            Days = totalDays,
                            SortOrder = 0,
                            IsUnpaidBucket = true
                        }
                    ],
                    IsSufficient = true,
                    RequiresAccept = false,
                    AvailableOnPrimary = totalDays
                };
            }
            else
            {
                plan = await _cascadeService.PlanAsync(
                    dto.EmployeeId, leaveType, totalDays, year, dto.StartDate, creditBack);
            }

            if (!plan.IsSufficient)
            {
                return new LeaveRequestDto
                {
                    RequestId = request.Id,
                    EmployeeId = dto.EmployeeId,
                    BalanceSufficient = false,
                    RemainingBalance = plan.AvailableOnPrimary,
                    BalanceOptions = new List<string>
                    {
                        "Adjust dates to fit remaining balance",
                        "Ask HR to enable balance cascade on this leave type",
                        "Apply as unpaid leave"
                    },
                    TotalDays = totalDays,
                    BalanceAllocations = MapPlanToAllocationDtos(plan)
                };
            }

            if (plan.RequiresAccept && !dto.AcceptBalanceCascade)
            {
                throw new InvalidOperationException(
                    leaveType.IsEmergency
                        ? "Emergency leave is charged from Annual Leave first, then Unpaid Leave. " +
                          "Please confirm the balance split and resubmit."
                        : "Insufficient balance on the selected leave type. Remaining days will be taken from " +
                          "Annual Leave (if available) then Unpaid Leave. Please confirm the balance split and resubmit.");
            }

            var isUnpaid = plan.Lines.All(l => l.IsUnpaidBucket);
            var hasPaidAllocations = plan.Lines.Any(l => !l.IsUnpaidBucket);

            await RestorePaidAllocationsAsync(request, wasApproved: false);

            request.LeaveTypeId = leaveType.Id;
            request.StartDate = dto.StartDate.Date;
            request.EndDate = dto.EndDate.Date;
            request.TotalDays = totalDays;
            request.StartSession = startSession;
            request.EndSession = endSession;
            request.Reason = dto.Reason;
            request.IsEmergency = isEmergency;
            request.IsUnpaid = isUnpaid;
            request.IsShortNoticeAnnual = isShortNoticeAnnual;
            request.ConflictOverride = false;
            request.UpdatedAt = DateTimeHelper.Now();

            ReplaceBalanceAllocations(request, plan);

            if (hasPaidAllocations)
                await AddPendingPaidAllocationsAsync(request, year);

            if (request.BalanceCheck == null)
            {
                request.BalanceCheck = new LeaveBalanceCheckRecord
                {
                    Id = Guid.NewGuid(),
                    RequestId = request.Id,
                    CreatedAt = DateTimeHelper.Now()
                };
            }
            request.BalanceCheck.RequestedDays = totalDays;
            request.BalanceCheck.AvailableDays = plan.AvailableOnPrimary;
            request.BalanceCheck.IsSufficient = true;
            request.BalanceCheck.ActionTaken = plan.RequiresAccept
                ? LeaveBalanceAction.CascadeApplied
                : isUnpaid
                    ? LeaveBalanceAction.UnpaidApplied
                    : null;
            request.BalanceCheck.CheckedAt = DateTimeHelper.Now();
            request.BalanceCheck.UpdatedAt = DateTimeHelper.Now();

            if (request.ConflictCheck == null)
            {
                request.ConflictCheck = new LeaveConflictCheck
                {
                    Id = Guid.NewGuid(),
                    RequestId = request.Id,
                    CreatedAt = DateTimeHelper.Now()
                };
            }
            request.ConflictCheck.ConflictFound = false;
            request.ConflictCheck.OverlappingCount = 0;
            request.ConflictCheck.OverlappingEmployees = string.Empty;
            request.ConflictCheck.EmployeeOverride = false;
            request.ConflictCheck.CheckedAt = DateTimeHelper.Now();
            request.ConflictCheck.UpdatedAt = DateTimeHelper.Now();

            await _context.SaveChangesAsync();

            if (isEmergency)
                _emergencyScheduler.ScheduleAutoApproval(request.Id);

            var loaded = await GetRequestQuery().FirstAsync(r => r.Id == request.Id);
            var usersById = await LoadUsersWithManagersAsync();
            return MapToDto(loaded, usersById);
        }

        public async Task<LeaveRequestDto> ApproveAsync(Guid requestId, Guid approverId)
        {
            var request = await GetRequestForActionAsync(requestId);

            if (request.Status != LeaveRequestStatus.Pending)
                throw new InvalidOperationException("Only pending requests can be approved.");

            var usersById = await LoadUsersWithManagersAsync();
            if (!usersById.TryGetValue(approverId, out var approver))
                throw new InvalidOperationException("Approver not found.");

            var eligible = ResolveCurrentEligibleApproverIds(request, usersById);
            if (!eligible.Contains(approverId))
                throw new InvalidOperationException("You are not the current approver for this leave request.");

            _context.LeaveApprovals.Add(new LeaveApproval
            {
                Id = Guid.NewGuid(),
                RequestId = requestId,
                ApproverId = approverId,
                Decision = LeaveApprovalDecision.Approved,
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
                    await _notifications.SendLeaveNotificationAsync(
                        nextId,
                        requestId,
                        "Submitted",
                        $"Leave request from {request.Employee.FullName} requires your approval ({request.TotalDays} day(s)).");
                }

                var peerMsg =
                    $"Leave request from {request.Employee.FullName} was approved by {DisplayName(approver)} and advanced in the approval chain.";
                foreach (var peerId in eligible.Where(id => id != approverId))
                {
                    await _notifications.SendLeaveNotificationAsync(
                        peerId, requestId, "Submitted", peerMsg);
                }

                await _context.SaveChangesAsync();
                _logger.LogInformation(
                    "Leave request {RequestId} approved by {ApproverId}; forwarded to {NextCount} manager(s)",
                    requestId, approverId, next.Count);

                usersById = await LoadUsersWithManagersAsync();
                return MapToDto(await GetRequestQuery().FirstAsync(r => r.Id == requestId), usersById);
            }

            return await FinalizeApprovalAsync(request, approver, requestId, approvalAlreadyRecorded: true);
        }

        /// <summary>
        /// Eligible current approver with SystemRole HR finalizes without forwarding further.
        /// </summary>
        public async Task<LeaveRequestDto> FinalizeByHrAsync(Guid requestId, Guid hrUserId)
        {
            var request = await GetRequestForActionAsync(requestId);

            if (request.Status != LeaveRequestStatus.Pending)
                throw new InvalidOperationException("Only pending requests can be finalized.");

            var usersById = await LoadUsersWithManagersAsync();
            if (!usersById.TryGetValue(hrUserId, out var hrUser))
                throw new InvalidOperationException("Approver not found.");

            if (!string.Equals(hrUser.SystemRole, "HR", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("Only HR can finalize leave requests.");

            var eligible = ResolveCurrentEligibleApproverIds(request, usersById);
            if (!eligible.Contains(hrUserId))
                throw new InvalidOperationException("You are not the current approver for this leave request.");

            _context.LeaveApprovals.Add(new LeaveApproval
            {
                Id = Guid.NewGuid(),
                RequestId = requestId,
                ApproverId = hrUserId,
                Decision = LeaveApprovalDecision.Approved,
                ApproverRole = "HR",
                DecidedAt = DateTimeHelper.Now(),
                CreatedAt = DateTimeHelper.Now()
            });

            return await FinalizeApprovalAsync(request, hrUser, requestId, approvalAlreadyRecorded: true);
        }

        private async Task<LeaveRequestDto> FinalizeApprovalAsync(
            LeaveRequest request,
            User approver,
            Guid requestId,
            bool approvalAlreadyRecorded = false)
        {
            request.Status = LeaveRequestStatus.Approved;
            request.UpdatedAt = DateTimeHelper.Now();

            if (!approvalAlreadyRecorded)
            {
                _context.LeaveApprovals.Add(new LeaveApproval
                {
                    Id = Guid.NewGuid(),
                    RequestId = requestId,
                    ApproverId = approver.Id,
                    Decision = LeaveApprovalDecision.Approved,
                    ApproverRole = approver.SystemRole,
                    DecidedAt = DateTimeHelper.Now(),
                    CreatedAt = DateTimeHelper.Now()
                });
            }

            await DeductPaidAllocationsAsync(request, request.StartDate.Year);

            await _context.SaveChangesAsync();

            await _notifications.SendLeaveNotificationAsync(
                request.EmployeeId, requestId, "Approved",
                $"Your leave request ({request.StartDate:dd MMM} - {request.EndDate:dd MMM}) was approved.");

            ScheduleCalendarSync(requestId);

            var usersById = await LoadUsersWithManagersAsync();
            return MapToDto(await GetRequestQuery().FirstAsync(r => r.Id == requestId), usersById);
        }

        public async Task<LeaveRequestDto> RejectAsync(Guid requestId, Guid approverId, string rejectionReason)
        {
            if (string.IsNullOrWhiteSpace(rejectionReason))
                throw new ArgumentException("Rejection reason is required.", nameof(rejectionReason));

            var request = await GetRequestForActionAsync(requestId);

            if (request.Status != LeaveRequestStatus.Pending)
                throw new InvalidOperationException("Only pending requests can be rejected.");

            var usersById = await LoadUsersWithManagersAsync();
            if (!usersById.TryGetValue(approverId, out var approver))
                throw new InvalidOperationException("Approver not found.");

            var eligible = ResolveCurrentEligibleApproverIds(request, usersById);
            if (!eligible.Contains(approverId))
                throw new InvalidOperationException("You are not the current approver for this leave request.");

            request.Status = LeaveRequestStatus.Rejected;
            request.UpdatedAt = DateTimeHelper.Now();

            _context.LeaveApprovals.Add(new LeaveApproval
            {
                Id = Guid.NewGuid(),
                RequestId = requestId,
                ApproverId = approverId,
                Decision = LeaveApprovalDecision.Rejected,
                RejectionReason = rejectionReason,
                ApproverRole = approver.SystemRole,
                DecidedAt = DateTimeHelper.Now(),
                CreatedAt = DateTimeHelper.Now()
            });

            if (HasPaidAllocations(request) || !request.IsUnpaid)
                await RestorePaidAllocationsAsync(request, wasApproved: false);

            await _context.SaveChangesAsync();

            await _notifications.SendLeaveNotificationAsync(
                request.EmployeeId, requestId, "Rejected",
                $"Your leave request was rejected. Reason: {rejectionReason}. Submit a new leave application if you still need time off.");

            usersById = await LoadUsersWithManagersAsync();
            return MapToDto(await GetRequestQuery().FirstAsync(r => r.Id == requestId), usersById);
        }

        public async Task<LeaveRequestDto> CancelAsync(Guid requestId, Guid requestedBy)
        {
            var request = await GetRequestForActionAsync(requestId);

            if (request.Status != LeaveRequestStatus.Approved && request.Status != LeaveRequestStatus.Pending)
                throw new InvalidOperationException("This request cannot be cancelled.");

            var today = DateTimeHelper.Now().Date;
            var leaveStarted = request.StartDate.Date <= today;

            if (!leaveStarted)
            {
                var wasApproved = request.Status == LeaveRequestStatus.Approved;

                request.Status = LeaveRequestStatus.Cancelled;
                request.UpdatedAt = DateTimeHelper.Now();

                await RestorePaidAllocationsAsync(request, wasApproved: wasApproved);

                await _context.SaveChangesAsync();
                if (wasApproved)
                    ScheduleCalendarSync(requestId, remove: true);

                var usersAfterCancel = await LoadUsersWithManagersAsync();
                return MapToDto(await GetRequestQuery().FirstAsync(r => r.Id == requestId), usersAfterCancel);
            }

            request.Cancellation = new LeaveCancellation
            {
                Id = Guid.NewGuid(),
                RequestId = requestId,
                RequestedBy = requestedBy,
                LeaveStarted = true,
                RequiresApproval = true,
                Status = LeaveCancelStatus.Pending,
                RequestedAt = DateTimeHelper.Now(),
                CreatedAt = DateTimeHelper.Now()
            };
            await _context.SaveChangesAsync();

            var usersById = await LoadUsersWithManagersAsync();
            usersById.TryGetValue(request.EmployeeId, out var employee);
            var notifyIds = ResolveEligibleApproverIdsCore(request, usersById);
            if (notifyIds.Count == 0)
                notifyIds = GetReportingManagerIds(employee);

            foreach (var notifyId in notifyIds)
            {
                await _notifications.SendLeaveNotificationAsync(
                    notifyId, requestId, "Cancelled",
                    $"{employee?.FullName} requested cancellation of an in-progress leave.");
            }

            return MapToDto(await GetRequestQuery().FirstAsync(r => r.Id == requestId), usersById);
        }

        public async Task AutoApproveEmergencyIfPendingAsync(Guid requestId)
        {
            var request = await _context.LeaveRequests
                .Include(r => r.BalanceAllocations)
                .FirstOrDefaultAsync(r => r.Id == requestId && r.IsEmergency);

            if (request == null || request.Status != LeaveRequestStatus.Pending)
                return;

            var hrUser = await _context.Users
                .FirstOrDefaultAsync(u => u.SystemRole == "HR" && u.IsActive);

            var approverId = hrUser?.Id ?? request.EmployeeId;

            request.Status = LeaveRequestStatus.Approved;
            request.UpdatedAt = DateTimeHelper.Now();

            _context.LeaveApprovals.Add(new LeaveApproval
            {
                Id = Guid.NewGuid(),
                RequestId = requestId,
                ApproverId = approverId,
                Decision = LeaveApprovalDecision.Overridden,
                ApproverRole = "HR",
                DecidedAt = DateTimeHelper.Now(),
                CreatedAt = DateTimeHelper.Now()
            });

            await DeductPaidAllocationsAsync(request, request.StartDate.Year);

            await _context.SaveChangesAsync();

            await _notifications.SendLeaveNotificationAsync(
                request.EmployeeId, requestId, "Emergency",
                "Your emergency leave was auto-approved after the 2-hour window.");

            var employee = await _context.Users
                .Include(u => u.ReportingManagers)
                .FirstOrDefaultAsync(u => u.Id == request.EmployeeId);
            foreach (var managerId in GetReportingManagerIds(employee))
            {
                await _notifications.SendLeaveNotificationAsync(
                    managerId, requestId, "Emergency",
                    "Emergency leave was auto-approved.");
            }

            _logger.LogInformation("Emergency leave {RequestId} auto-approved", requestId);
            ScheduleCalendarSync(requestId);
        }

        private void ScheduleCalendarSync(Guid leaveRequestId, bool remove = false)
        {
            _ = Task.Run(async () =>
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var coordinator = scope.ServiceProvider
                        .GetRequiredService<LeaveExternalCalendarSyncCoordinator>();
                    if (remove)
                        await coordinator.RemoveLeaveAsync(leaveRequestId);
                    else
                        await coordinator.SyncApprovedLeaveAsync(leaveRequestId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "External calendar sync failed for leave {RequestId}", leaveRequestId);
                }
            });
        }

        public async Task<string> UploadDocumentAsync(Guid requestId, IFormFile file)
        {
            var request = await _context.LeaveRequests.FindAsync(requestId)
                ?? throw new InvalidOperationException("Leave request not found.");

            var folder = Path.Combine(Directory.GetCurrentDirectory(), "Uploads", "Leave");
            Directory.CreateDirectory(folder);
            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var path = Path.Combine(folder, fileName);
            await using (var stream = new FileStream(path, FileMode.Create))
                await file.CopyToAsync(stream);

            var relative = $"Uploads/Leave/{fileName}";
            _context.LeaveSupportingDocuments.Add(new LeaveSupportingDocument
            {
                Id = Guid.NewGuid(),
                RequestId = requestId,
                FileName = file.FileName,
                FileUrl = relative,
                UploadedAt = DateTimeHelper.Now(),
                CreatedAt = DateTimeHelper.Now()
            });
            await _context.SaveChangesAsync();
            return relative;
        }

        private IQueryable<LeaveRequest> GetRequestQuery() =>
            _context.LeaveRequests
                .Include(r => r.Employee)
                .Include(r => r.LeaveType)
                .Include(r => r.Approvals)
                .Include(r => r.ConflictCheck)
                .Include(r => r.BalanceCheck)
                .Include(r => r.Cancellation)
                .Include(r => r.Appeal)
                .Include(r => r.Documents)
                .Include(r => r.BalanceAllocations)
                    .ThenInclude(a => a.LeaveType);

        private async Task<LeaveRequest> GetRequestForActionAsync(Guid requestId) =>
            await GetRequestQuery().FirstOrDefaultAsync(r => r.Id == requestId)
            ?? throw new InvalidOperationException("Leave request not found.");

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

        /// <summary>
        /// Current eligible approver ids for a pending request.
        /// 0 approvals → employee's reporting managers; else → last Approved/Overridden approver's managers.
        /// </summary>
        private static HashSet<Guid> ResolveCurrentEligibleApproverIds(
            LeaveRequest request,
            Dictionary<Guid, User> usersById)
        {
            if (request.Status != LeaveRequestStatus.Pending)
                return new HashSet<Guid>();

            return ResolveEligibleApproverIdsCore(request, usersById);
        }

        /// <summary>
        /// Eligible approvers based on approval history (ignores request status — used for cancel notify / chain freeze).
        /// </summary>
        private static HashSet<Guid> ResolveEligibleApproverIdsCore(
            LeaveRequest request,
            Dictionary<Guid, User> usersById)
        {
            if (!usersById.TryGetValue(request.EmployeeId, out var employee))
                return new HashSet<Guid>();

            var chainApprovals = request.Approvals
                .Where(a => a.Decision is LeaveApprovalDecision.Approved or LeaveApprovalDecision.Overridden)
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

        private static List<LeaveApprovalChainStepDto> BuildApprovalChain(
            LeaveRequest r,
            Dictionary<Guid, User> usersById,
            out bool noApproverAssigned)
        {
            noApproverAssigned = false;
            var steps = new List<LeaveApprovalChainStepDto>();

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
            DateTime? lastDecisionAt = null;
            var rejected = false;
            var seenApprovers = new HashSet<Guid>();

            var pastApprovals = r.Approvals
                .Where(a => a.Decision is LeaveApprovalDecision.Approved
                    or LeaveApprovalDecision.Overridden
                    or LeaveApprovalDecision.Rejected)
                .OrderBy(a => a.DecidedAt)
                .ToList();

            foreach (var approval in pastApprovals)
            {
                usersById.TryGetValue(approval.ApproverId, out var approverUser);
                var status = approval.Decision == LeaveApprovalDecision.Rejected ? "Rejected" : "Approved";
                if (approval.Decision == LeaveApprovalDecision.Rejected)
                    rejected = true;

                steps.Add(new LeaveApprovalChainStepDto
                {
                    StepOrder = stepOrder++,
                    ApproverId = approval.ApproverId,
                    ApproverName = approverUser != null ? DisplayName(approverUser) : approval.ApproverId.ToString(),
                    Status = status,
                    DecidedAt = approval.DecidedAt,
                    RejectionReason = approval.RejectionReason,
                    IsFinalStep = false
                });
                seenApprovers.Add(approval.ApproverId);
                lastDecisionAt = approval.DecidedAt;
            }

            if (!rejected &&
                (r.Status == LeaveRequestStatus.Pending || r.Status == LeaveRequestStatus.Cancelled))
            {
                var eligible = ResolveEligibleApproverIdsCore(r, usersById);
                var pendingStepOrder = stepOrder;
                foreach (var id in eligible.OrderBy(x => x))
                {
                    usersById.TryGetValue(id, out var mgr);
                    steps.Add(new LeaveApprovalChainStepDto
                    {
                        StepOrder = pendingStepOrder,
                        ApproverId = id,
                        ApproverName = mgr != null ? DisplayName(mgr) : id.ToString(),
                        Status = "Pending",
                        IsFinalStep = false
                    });
                    seenApprovers.Add(id);
                }
                if (eligible.Count > 0)
                    stepOrder++;

                // Weak Waiting preview: walk first eligible manager's first manager linearly.
                var firstEligible = eligible.OrderBy(x => x).FirstOrDefault();
                if (firstEligible != Guid.Empty &&
                    usersById.TryGetValue(firstEligible, out var firstMgr))
                {
                    var nextIds = GetReportingManagerIds(firstMgr);
                    while (nextIds.Count > 0)
                    {
                        var nextId = nextIds.OrderBy(x => x).First();
                        if (!seenApprovers.Add(nextId))
                            break;
                        if (!usersById.TryGetValue(nextId, out var nextUser))
                            break;

                        steps.Add(new LeaveApprovalChainStepDto
                        {
                            StepOrder = stepOrder++,
                            ApproverId = nextId,
                            ApproverName = DisplayName(nextUser),
                            Status = "Waiting",
                            IsFinalStep = false
                        });
                        nextIds = GetReportingManagerIds(nextUser);
                    }
                }
            }

            if (r.Status == LeaveRequestStatus.Approved)
            {
                steps.Add(new LeaveApprovalChainStepDto
                {
                    StepOrder = steps.Count + 1,
                    ApproverId = null,
                    ApproverName = "Completed",
                    Status = "Completed",
                    DecidedAt = lastDecisionAt ?? r.UpdatedAt ?? r.SubmittedAt,
                    IsFinalStep = true
                });
            }

            return steps;
        }

        private static LeaveRequestDto MapToDto(LeaveRequest r, Dictionary<Guid, User>? usersById = null)
        {
            var latestRejection = r.Approvals
                .Where(a => a.Decision == LeaveApprovalDecision.Rejected)
                .OrderByDescending(a => a.DecidedAt)
                .FirstOrDefault();
            var latestDocument = r.Documents
                .OrderByDescending(d => d.UploadedAt)
                .FirstOrDefault();

            var users = usersById ?? new Dictionary<Guid, User>();
            var noApproverAssigned = false;
            var approvalChain = users.Count > 0
                ? BuildApprovalChain(r, users, out noApproverAssigned)
                : new List<LeaveApprovalChainStepDto>();

            var currentApproverIds = users.Count > 0
                ? ResolveCurrentEligibleApproverIds(r, users).OrderBy(x => x).ToList()
                : new List<Guid>();

            return new LeaveRequestDto
            {
                RequestId = r.Id,
                EmployeeId = r.EmployeeId,
                EmployeeName = r.Employee.FullName,
                LeaveTypeId = r.LeaveTypeId,
                LeaveTypeName = r.LeaveType.Name,
                StartDate = r.StartDate,
                EndDate = r.EndDate,
                TotalDays = r.TotalDays,
                StartSession = r.StartSession.ToString(),
                EndSession = r.EndSession.ToString(),
                Reason = r.Reason,
                Status = r.Status.ToString(),
                IsEmergency = r.IsEmergency,
                IsUnpaid = r.IsUnpaid,
                IsShortNoticeAnnual = r.IsShortNoticeAnnual,
                ConflictOverride = r.ConflictOverride,
                SubmittedAt = r.SubmittedAt,
                ConflictWarning = null,
                RemainingBalance = r.BalanceCheck?.AvailableDays,
                BalanceAllocations = (r.BalanceAllocations ?? Array.Empty<LeaveRequestBalanceAllocation>())
                    .OrderBy(a => a.SortOrder)
                    .Select(a => new LeaveBalanceAllocationDto
                    {
                        LeaveTypeId = a.LeaveTypeId,
                        LeaveTypeName = a.LeaveType?.Name ?? string.Empty,
                        Days = a.Days,
                        SortOrder = a.SortOrder,
                        IsUnpaidBucket = a.IsUnpaidBucket
                    })
                    .ToList(),
                RejectionReason = latestRejection?.RejectionReason,
                HasAppeal = r.Appeal != null,
                AppealOutcome = r.Appeal?.Outcome?.ToString(),
                DocumentUrl = latestDocument?.FileUrl,
                DocumentFileName = latestDocument?.FileName,
                CurrentApproverIds = currentApproverIds,
                CurrentApproverId = currentApproverIds.Count > 0 ? currentApproverIds[0] : null,
                NoApproverAssigned = noApproverAssigned,
                ApprovalChain = approvalChain
            };
        }

        private static bool HasPaidAllocations(LeaveRequest request) =>
            request.BalanceAllocations != null &&
            request.BalanceAllocations.Any(a => !a.IsUnpaidBucket && a.Days > 0);

        private static Dictionary<Guid, double> BuildCreditBackFromRequest(LeaveRequest request, int year)
        {
            var credit = new Dictionary<Guid, double>();
            if (request.StartDate.Year != year)
                return credit;

            if (request.BalanceAllocations != null && request.BalanceAllocations.Count > 0)
            {
                foreach (var line in request.BalanceAllocations.Where(a => !a.IsUnpaidBucket && a.Days > 0))
                {
                    credit[line.LeaveTypeId] = credit.GetValueOrDefault(line.LeaveTypeId) + line.Days;
                }
                return credit;
            }

            // Legacy requests without allocation rows.
            if (!request.IsUnpaid && request.TotalDays > 0)
                credit[request.LeaveTypeId] = request.TotalDays;

            return credit;
        }

        private static List<LeaveBalanceAllocationDto> MapPlanToAllocationDtos(LeaveBalanceCascadePlan plan) =>
            plan.Lines.Select(l => new LeaveBalanceAllocationDto
            {
                LeaveTypeId = l.LeaveTypeId,
                LeaveTypeName = l.LeaveTypeName,
                Days = l.Days,
                SortOrder = l.SortOrder,
                IsUnpaidBucket = l.IsUnpaidBucket
            }).ToList();

        private void ReplaceBalanceAllocations(LeaveRequest request, LeaveBalanceCascadePlan plan)
        {
            if (request.BalanceAllocations.Count > 0)
                _context.LeaveRequestBalanceAllocations.RemoveRange(request.BalanceAllocations);

            request.BalanceAllocations = plan.Lines.Select(l => new LeaveRequestBalanceAllocation
            {
                Id = Guid.NewGuid(),
                RequestId = request.Id,
                LeaveTypeId = l.LeaveTypeId,
                Days = l.Days,
                SortOrder = l.SortOrder,
                IsUnpaidBucket = l.IsUnpaidBucket
            }).ToList();
        }

        private async Task AddPendingPaidAllocationsAsync(LeaveRequest request, int year)
        {
            foreach (var line in GetPaidAllocationLines(request))
            {
                await _balanceService.AddPendingDaysAsync(
                    request.EmployeeId, line.LeaveTypeId, line.Days, year);
            }
        }

        private async Task DeductPaidAllocationsAsync(LeaveRequest request, int year)
        {
            var paid = GetPaidAllocationLines(request).ToList();
            if (paid.Count == 0 && !request.IsUnpaid &&
                (request.BalanceAllocations == null || request.BalanceAllocations.Count == 0))
            {
                // Legacy: deduct whole request against LeaveTypeId.
                await _balanceService.DeductBalanceAsync(
                    request.EmployeeId, request.LeaveTypeId, request.TotalDays, year);
                return;
            }

            foreach (var line in paid)
            {
                await _balanceService.DeductBalanceAsync(
                    request.EmployeeId, line.LeaveTypeId, line.Days, year);
            }
        }

        private async Task RestorePaidAllocationsAsync(LeaveRequest request, bool wasApproved)
        {
            var year = request.StartDate.Year;
            var paid = GetPaidAllocationLines(request).ToList();
            if (paid.Count == 0 && !request.IsUnpaid &&
                (request.BalanceAllocations == null || request.BalanceAllocations.Count == 0))
            {
                await _balanceService.RestoreBalanceAsync(
                    request.EmployeeId, request.LeaveTypeId, request.TotalDays, year, wasApproved);
                return;
            }

            foreach (var line in paid)
            {
                await _balanceService.RestoreBalanceAsync(
                    request.EmployeeId, line.LeaveTypeId, line.Days, year, wasApproved);
            }
        }

        private static IEnumerable<(Guid LeaveTypeId, double Days)> GetPaidAllocationLines(LeaveRequest request)
        {
            if (request.BalanceAllocations == null)
                yield break;

            foreach (var a in request.BalanceAllocations.Where(x => !x.IsUnpaidBucket && x.Days > 0))
                yield return (a.LeaveTypeId, a.Days);
        }

        private const string AnnualLeaveTypeName = "Annual Leave";
        private const string UnpaidLeaveTypeName = "Unpaid Leave";
        private const int AnnualLeaveMinNoticeCalendarDays = 7;

        private sealed record ResolvedLeaveType(
            LeaveType LeaveType,
            bool IsEmergency,
            bool IsUnpaid,
            bool IsShortNoticeAnnual);

        private static bool IsNamedLeaveType(LeaveType type, string expectedName) =>
            string.Equals(type.Name?.Trim(), expectedName, StringComparison.OrdinalIgnoreCase);

        private static bool RequiresShortNoticeAnnualConversion(LeaveType selectedType, DateTime startDate)
        {
            if (selectedType.IsEmergency) return false;
            if (!IsNamedLeaveType(selectedType, AnnualLeaveTypeName)) return false;
            var today = DateTimeHelper.Now().Date;
            var daysUntilStart = (startDate.Date - today).TotalDays;
            return daysUntilStart < AnnualLeaveMinNoticeCalendarDays;
        }

        private async Task<ResolvedLeaveType> ResolveLeaveTypeForRequestAsync(
            CreateLeaveRequestDto dto,
            LeaveType selectedType)
        {
            if (!RequiresShortNoticeAnnualConversion(selectedType, dto.StartDate))
            {
                return new ResolvedLeaveType(
                    selectedType,
                    selectedType.IsEmergency,
                    !selectedType.IsPaid,
                    IsShortNoticeAnnual: false);
            }

            if (!dto.AcceptShortNoticeAsUnpaid)
            {
                throw new InvalidOperationException(
                    "Annual leave requires at least 7 calendar days' notice before the start date. " +
                    "To proceed with short notice, this request will be recorded as Unpaid Leave (not deducted from Annual Leave). " +
                    "Please confirm short-notice unpaid leave and resubmit.");
            }

            var unpaidName = UnpaidLeaveTypeName.ToLowerInvariant();
            var unpaid = await _context.LeaveTypes
                .FirstOrDefaultAsync(t => t.Name.ToLower() == unpaidName)
                ?? throw new InvalidOperationException(
                    "Unpaid Leave type is not configured. Ask HR to add an \"Unpaid Leave\" leave type.");

            return new ResolvedLeaveType(
                unpaid,
                IsEmergency: false,
                IsUnpaid: true,
                IsShortNoticeAnnual: true);
        }
    }
}
