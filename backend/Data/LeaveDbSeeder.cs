using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using YLWorks.Model;
using YLWorks.Model.Leave;
using YLWorks.Services.Leave;

namespace YLWorks.Data
{
    public static class LeaveDbSeeder
    {
        public static async Task SeedAsync(AppDbContext context, ILogger logger)
        {
            await EnsurePolicyAndKindsAsync(context, logger);
            await EnsureLeaveSettingsModulesAsync(context, logger);
            await EnsureLeaveCalendarTablesAsync(context, logger);

            if (await context.LeaveTypes.AnyAsync())
            {
                logger.LogInformation("Leave request seed skipped — leave types already exist.");
                return;
            }

            var year = DateTime.UtcNow.Year;
            var policy = await context.LeavePolicies.Include(p => p.TenureBands)
                .FirstAsync(p => p.IsActive);

            var annual = new LeaveType
            {
                Id = Guid.NewGuid(), Name = "Annual Leave", Description = "Standard annual leave",
                IsPaid = true, DefaultDaysPerYear = 8, PolicyKind = LeavePolicyKind.AnnualTenure,
                CreatedAt = DateTime.UtcNow
            };
            var medical = new LeaveType
            {
                Id = Guid.NewGuid(), Name = "Medical Leave", Description = "Medical leave (MC)",
                IsPaid = true, DefaultDaysPerYear = 14, RequiresDocument = true,
                PolicyKind = LeavePolicyKind.MedicalTenure, CreatedAt = DateTime.UtcNow
            };
            var emergency = new LeaveType
            {
                Id = Guid.NewGuid(), Name = "Emergency Leave", Description = "Urgent leave",
                IsPaid = true, IsEmergency = true, DefaultDaysPerYear = 3, RequiresDocument = true,
                PolicyKind = LeavePolicyKind.Fixed, CreatedAt = DateTime.UtcNow
            };
            var unpaid = new LeaveType
            {
                Id = Guid.NewGuid(), Name = "Unpaid Leave", Description = "Unpaid leave",
                IsPaid = false, DefaultDaysPerYear = 365, PolicyKind = LeavePolicyKind.Fixed,
                CreatedAt = DateTime.UtcNow
            };
            var replacement = new LeaveType
            {
                Id = Guid.NewGuid(), Name = "Replacement Leave",
                Description = "Leave credited for working on a public holiday",
                IsPaid = true, DefaultDaysPerYear = 0, PolicyKind = LeavePolicyKind.Replacement,
                CreatedAt = DateTime.UtcNow
            };

            context.LeaveTypes.AddRange(annual, medical, emergency, unpaid, replacement);

            var users = await SeedUsersAsync(context, logger);
            var mgr1 = users["manager1"];
            var employees = users.Values.Where(u =>
                u.SystemRole is "Staff" or "Executive" or "Support").ToList();

            var policyService = new LeavePolicyService(context, LoggerFactory.Create(b => { }).CreateLogger<LeavePolicyService>());

            foreach (var emp in employees)
            {
                var tenure = LeavePolicyService.CalculateTenureYears(emp.JoinedDate, year);
                var annualDays = policyService.ResolveBandDays(policy, LeaveTenureBandKind.Annual, tenure);
                var medicalDays = policyService.ResolveBandDays(policy, LeaveTenureBandKind.Medical, tenure);

                AddBalance(context, emp.Id, annual.Id, year, annualDays);
                AddBalance(context, emp.Id, medical.Id, year, medicalDays);
                AddBalance(context, emp.Id, emergency.Id, year, emergency.DefaultDaysPerYear);
                AddBalance(context, emp.Id, unpaid.Id, year, unpaid.DefaultDaysPerYear);
                AddBalance(context, emp.Id, replacement.Id, year, 0, isReplacement: true);
            }

            var emp1 = employees[0];
            var emp2 = employees[1];
            var emp3 = employees[2];

            AddRequest(context, emp1, annual, year, 10, 12, LeaveRequestStatus.Approved, false, false, true);
            var case2 = AddRequest(context, emp2, annual, year, 20, 22, LeaveRequestStatus.Rejected, false, false, false);
            context.LeaveApprovals.Add(new LeaveApproval
            {
                Id = Guid.NewGuid(), RequestId = case2.Id, ApproverId = mgr1.Id,
                Decision = LeaveApprovalDecision.Rejected, RejectionReason = "Peak project period",
                ApproverRole = mgr1.SystemRole, DecidedAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow
            });
            AddRequest(context, emp3, annual, year, 5, 6, LeaveRequestStatus.Cancelled, false, false, false);
            var case4 = AddRequest(context, employees[3], annual, year, 1, 30, LeaveRequestStatus.Pending, false, false, false);
            case4.BalanceCheck = new LeaveBalanceCheckRecord
            {
                Id = Guid.NewGuid(), RequestId = case4.Id, RequestedDays = 30, AvailableDays = 8,
                IsSufficient = false, CreatedAt = DateTime.UtcNow
            };
            AddRequest(context, employees[4], emergency, year, 15, 15, LeaveRequestStatus.Approved, true, false, true);
            var case6 = AddRequest(context, employees[5], annual, year, 8, 9, LeaveRequestStatus.Pending, false, false, false);
            case6.ConflictOverride = true;
            case6.ConflictCheck = new LeaveConflictCheck
            {
                Id = Guid.NewGuid(), RequestId = case6.Id, ConflictFound = true,
                OverlappingCount = 2, OverlappingEmployees = "Colleague A, Colleague B",
                EmployeeOverride = true, CheckedAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow
            };

            await context.SaveChangesAsync();
            logger.LogInformation("Leave management seed data created.");
        }

        /// <summary>Upgrades existing DBs: policy, PolicyKind on types, Replacement type.</summary>
        public static async Task EnsurePolicyAndKindsAsync(AppDbContext context, ILogger logger)
        {
            try
            {
                if (!await context.LeavePolicies.AnyAsync(p => p.IsActive))
                {
                    context.LeavePolicies.Add(LeavePolicyService.CreateDefaultPolicy(DateTime.UtcNow.Year));
                    await context.SaveChangesAsync();
                    logger.LogInformation("Default leave policy seeded.");
                }

                var types = await context.LeaveTypes.ToListAsync();
                if (types.Count == 0) return;

                foreach (var t in types)
                {
                    if (t.Name.Contains("Annual", StringComparison.OrdinalIgnoreCase) &&
                        t.PolicyKind == LeavePolicyKind.Fixed)
                        t.PolicyKind = LeavePolicyKind.AnnualTenure;
                    else if (t.Name.Contains("Medical", StringComparison.OrdinalIgnoreCase) &&
                             t.PolicyKind == LeavePolicyKind.Fixed)
                        t.PolicyKind = LeavePolicyKind.MedicalTenure;
                    else if (t.Name.Contains("Replacement", StringComparison.OrdinalIgnoreCase))
                        t.PolicyKind = LeavePolicyKind.Replacement;
                }

                if (!types.Any(t => t.PolicyKind == LeavePolicyKind.Replacement ||
                                    t.Name.Contains("Replacement", StringComparison.OrdinalIgnoreCase)))
                {
                    context.LeaveTypes.Add(new LeaveType
                    {
                        Id = Guid.NewGuid(),
                        Name = "Replacement Leave",
                        Description = "Leave credited for working on a public holiday",
                        IsPaid = true,
                        DefaultDaysPerYear = 0,
                        PolicyKind = LeavePolicyKind.Replacement,
                        CreatedAt = DateTime.UtcNow
                    });
                }

                await context.SaveChangesAsync();

                // Ensure ApplicableGender column exists + default existing rows to All.
                try
                {
                    await context.Database.ExecuteSqlRawAsync("""
                        SET @db = DATABASE();
                        SET @sql = IF(
                            (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                             WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'LeaveTypes' AND COLUMN_NAME = 'ApplicableGender') = 0,
                            'ALTER TABLE `LeaveTypes` ADD `ApplicableGender` varchar(20) CHARACTER SET utf8mb4 NOT NULL DEFAULT ''All''',
                            'SELECT 1');
                        PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
                        """);
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "ApplicableGender column ensure skipped.");
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "EnsurePolicyAndKinds skipped (schema may not be migrated yet).");
            }
        }

        /// <summary>Registers settings-leave-types / settings-leave-policy modules + Admin/HR/SuperAdmin rights.</summary>
        public static async Task EnsureLeaveSettingsModulesAsync(AppDbContext context, ILogger logger)
        {
            try
            {
                var specs = new (string Code, string Name, string RoutePrefix)[]
                {
                    ("settings-leave-types", "Leave Types", "settings/leave-types"),
                    ("settings-leave-policy", "Leave Policy", "settings/leave-policy"),
                    ("settings-leave-calendar-sync", "Leave Calendar Sync", "settings/leave-calendar-sync"),
                };

                var roles = new[] { "SuperAdmin", "Admin", "HR" };
                var changed = false;

                foreach (var (code, name, routePrefix) in specs)
                {
                    var module = await context.SystemModules.FirstOrDefaultAsync(m => m.Code == code);
                    if (module == null)
                    {
                        module = new SystemModule
                        {
                            Id = Guid.NewGuid(),
                            Name = name,
                            Code = code,
                            RoutePrefix = routePrefix,
                            CreatedAt = DateTime.UtcNow
                        };
                        context.SystemModules.Add(module);
                        changed = true;
                        logger.LogInformation("Seeded system module {Code}.", code);
                    }
                    else if (string.IsNullOrWhiteSpace(module.RoutePrefix))
                    {
                        module.RoutePrefix = routePrefix;
                        changed = true;
                    }

                    foreach (var role in roles)
                    {
                        var exists = await context.RolePermissions.AnyAsync(p =>
                            p.SystemModuleId == module.Id &&
                            p.SystemRole == role &&
                            p.DepartmentId == null);
                        if (exists) continue;

                        context.RolePermissions.Add(new RolePermission
                        {
                            Id = Guid.NewGuid(),
                            SystemRole = role,
                            DepartmentId = null,
                            SystemModuleId = module.Id,
                            CanCreate = true,
                            CanRead = true,
                            CanUpdate = true,
                            CanDelete = true,
                            CanUpdateStatus = false,
                            CreatedAt = DateTime.UtcNow
                        });
                        changed = true;
                    }
                }

                if (changed)
                {
                    await context.SaveChangesAsync();
                    logger.LogInformation("Leave settings modules/permissions ensured.");
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "EnsureLeaveSettingsModules skipped.");
            }
        }

        /// <summary>Creates LeaveCalendarConnections / LeaveCalendarEventMaps if migration not applied yet.</summary>
        public static async Task EnsureLeaveCalendarTablesAsync(AppDbContext context, ILogger logger)
        {
            try
            {
                await context.Database.ExecuteSqlRawAsync("""
                    SET @db = DATABASE();

                    SET @sql = IF(
                        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
                         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'LeaveCalendarConnections') = 0,
                        'CREATE TABLE `LeaveCalendarConnections` (
                            `Id` char(36) COLLATE ascii_general_ci NOT NULL,
                            `UserId` char(36) COLLATE ascii_general_ci NOT NULL,
                            `Provider` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
                            `AccessTokenProtected` longtext CHARACTER SET utf8mb4 NOT NULL,
                            `RefreshTokenProtected` longtext CHARACTER SET utf8mb4 NOT NULL,
                            `TokenExpiresAtUtc` datetime(6) NOT NULL,
                            `ExternalCalendarId` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
                            `ExternalAccountEmail` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
                            `ConnectedAtUtc` datetime(6) NOT NULL,
                            `LastSyncAtUtc` datetime(6) NULL,
                            `LastError` longtext CHARACTER SET utf8mb4 NULL,
                            `CreatedAt` datetime(6) NULL,
                            `UpdatedAt` datetime(6) NULL,
                            `CreatedById` char(36) COLLATE ascii_general_ci NULL,
                            `UpdatedById` char(36) COLLATE ascii_general_ci NULL,
                            PRIMARY KEY (`Id`),
                            UNIQUE KEY `IX_LeaveCalendarConnections_UserId_Provider` (`UserId`, `Provider`),
                            CONSTRAINT `FK_LeaveCalendarConnections_Users_UserId`
                                FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
                        'SELECT 1');
                    PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

                    SET @sql = IF(
                        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
                         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'LeaveCalendarEventMaps') = 0,
                        'CREATE TABLE `LeaveCalendarEventMaps` (
                            `Id` char(36) COLLATE ascii_general_ci NOT NULL,
                            `ConnectionId` char(36) COLLATE ascii_general_ci NOT NULL,
                            `LeaveRequestId` char(36) COLLATE ascii_general_ci NOT NULL,
                            `ExternalEventId` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
                            `CreatedAt` datetime(6) NULL,
                            `UpdatedAt` datetime(6) NULL,
                            `CreatedById` char(36) COLLATE ascii_general_ci NULL,
                            `UpdatedById` char(36) COLLATE ascii_general_ci NULL,
                            PRIMARY KEY (`Id`),
                            UNIQUE KEY `IX_LeaveCalendarEventMaps_ConnectionId_LeaveRequestId` (`ConnectionId`, `LeaveRequestId`),
                            KEY `IX_LeaveCalendarEventMaps_LeaveRequestId` (`LeaveRequestId`),
                            CONSTRAINT `FK_LeaveCalendarEventMaps_LeaveCalendarConnections_ConnectionId`
                                FOREIGN KEY (`ConnectionId`) REFERENCES `LeaveCalendarConnections` (`Id`) ON DELETE CASCADE,
                            CONSTRAINT `FK_LeaveCalendarEventMaps_LeaveRequests_LeaveRequestId`
                                FOREIGN KEY (`LeaveRequestId`) REFERENCES `LeaveRequests` (`Id`) ON DELETE CASCADE
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
                        'SELECT 1');
                    PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
                    """);

                logger.LogInformation("Leave calendar sync tables ensured.");
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "EnsureLeaveCalendarTables skipped (schema may not be ready).");
            }
        }

        private static void AddBalance(
            AppDbContext context, Guid empId, Guid typeId, int year, double tenure,
            bool isReplacement = false)
        {
            context.LeaveBalances.Add(new LeaveBalance
            {
                Id = Guid.NewGuid(),
                EmployeeId = empId,
                LeaveTypeId = typeId,
                Year = year,
                TenureEntitledDays = isReplacement ? 0 : tenure,
                CarriedForwardDays = 0,
                CreditedDays = 0,
                EntitledDays = isReplacement ? 0 : tenure,
                UsedDays = 0,
                PendingDays = 0,
                RemainingDays = isReplacement ? 0 : tenure,
                CreatedAt = DateTime.UtcNow
            });
        }

        private static LeaveRequest AddRequest(
            AppDbContext context, User emp, LeaveType type, int year,
            int startDay, int endDay, LeaveRequestStatus status,
            bool isEmergency, bool isUnpaid, bool deductUsed)
        {
            var start = new DateTime(year, 6, startDay, 0, 0, 0, DateTimeKind.Utc);
            var end = new DateTime(year, 6, endDay, 0, 0, 0, DateTimeKind.Utc);
            var days = (end - start).Days + 1;

            var req = new LeaveRequest
            {
                Id = Guid.NewGuid(),
                EmployeeId = emp.Id,
                LeaveTypeId = type.Id,
                StartDate = start,
                EndDate = end,
                TotalDays = days,
                Reason = $"Seed case - {status}",
                Status = status,
                IsEmergency = isEmergency,
                IsUnpaid = isUnpaid,
                SubmittedAt = DateTime.UtcNow.AddDays(-7),
                CreatedAt = DateTime.UtcNow
            };
            context.LeaveRequests.Add(req);

            if (deductUsed && !isUnpaid)
            {
                var bal = context.LeaveBalances.Local.FirstOrDefault(b =>
                    b.EmployeeId == emp.Id && b.LeaveTypeId == type.Id && b.Year == year);
                bal ??= context.LeaveBalances.First(b =>
                    b.EmployeeId == emp.Id && b.LeaveTypeId == type.Id && b.Year == year);
                bal.UsedDays += days;
                bal.RemainingDays = bal.EntitledDays - bal.UsedDays - bal.PendingDays;
            }

            return req;
        }

        private static async Task<Dictionary<string, User>> SeedUsersAsync(
            AppDbContext context, ILogger logger)
        {
            var result = new Dictionary<string, User>();

            async Task<User> EnsureUser(string key, string email, string fullName, string role, Guid? managerId, string password)
            {
                var existing = await context.Users
                    .Include(u => u.ReportingManagers)
                    .FirstOrDefaultAsync(u => u.Email == email);
                if (existing != null)
                {
                    if (managerId.HasValue &&
                        !existing.ReportingManagers.Any(rm => rm.ManagerId == managerId.Value))
                    {
                        existing.ReportingManagers.Add(new UserReportingManager
                        {
                            UserId = existing.Id,
                            ManagerId = managerId.Value
                        });
                    }
                    result[key] = existing;
                    return existing;
                }

                var user = new User
                {
                    Id = Guid.NewGuid(),
                    Email = email,
                    FullName = fullName,
                    Password = new PasswordHasher<User>().HashPassword(new User(), password),
                    SystemRole = role,
                    EmployeeNo = $"LV-{key.ToUpper()}",
                    IsActive = true,
                    JoinedDate = DateTime.UtcNow.AddYears(-1),
                    CreatedAt = DateTime.UtcNow
                };
                if (managerId.HasValue)
                {
                    user.ReportingManagers.Add(new UserReportingManager
                    {
                        UserId = user.Id,
                        ManagerId = managerId.Value
                    });
                }
                context.Users.Add(user);
                result[key] = user;
                return user;
            }

            await EnsureUser("admin", "leave.admin@ylwork.local", "Leave Admin", "Admin", null, "Admin123!");
            await EnsureUser("hr", "leave.hr@ylwork.local", "Leave HR", "HR", null, "Hr123!");
            var hodTop = await EnsureUser("manager2", "leave.manager2@ylwork.local", "Leave HOD (Top)", "HOD", null, "Manager123!");
            var hodMid = await EnsureUser("manager1", "leave.manager1@ylwork.local", "Leave HOD (Mid)", "Manager", hodTop.Id, "Manager123!");

            await EnsureUser("e1", "leave.emp1@ylwork.local", "Leave Employee 1", "Staff", hodMid.Id, "Staff123!");
            await EnsureUser("e2", "leave.emp2@ylwork.local", "Leave Employee 2", "Executive", hodMid.Id, "Staff123!");
            await EnsureUser("e3", "leave.emp3@ylwork.local", "Leave Employee 3", "Support", hodMid.Id, "Staff123!");
            await EnsureUser("e4", "leave.emp4@ylwork.local", "Leave Employee 4", "Staff", hodTop.Id, "Staff123!");
            await EnsureUser("e5", "leave.emp5@ylwork.local", "Leave Employee 5", "Executive", hodTop.Id, "Staff123!");
            await EnsureUser("e6", "leave.emp6@ylwork.local", "Leave Employee 6", "Support", hodTop.Id, "Staff123!");

            await context.SaveChangesAsync();
            logger.LogInformation("Leave seed users ready ({Count} total).", result.Count);
            return result;
        }
    }
}
