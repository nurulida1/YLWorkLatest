using Microsoft.EntityFrameworkCore;
using WebApplication1.Helpers;
using YLWorks.Model;
using YLWorks.Model.Claim;

namespace YLWorks.Data
{
    public static class ClaimDbSeeder
    {
        public static async Task SeedAsync(AppDbContext context, ILogger logger)
        {
            await EnsureClaimSettingsModulesAsync(context, logger);
            await EnsureDefaultClaimSettingsAsync(context, logger);
        }

        public static async Task EnsureDefaultClaimSettingsAsync(AppDbContext context, ILogger logger)
        {
            try
            {
                if (await context.ClaimSettings.AnyAsync(s => s.IsActive))
                    return;

                context.ClaimSettings.Add(new ClaimSettings
                {
                    Id = Guid.NewGuid(),
                    IsActive = true,
                    CreatedAt = DateTimeHelper.Now()
                });
                await context.SaveChangesAsync();
                logger.LogInformation("Seeded default ClaimSettings.");
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "EnsureDefaultClaimSettings skipped.");
            }
        }

        public static async Task EnsureClaimSettingsModulesAsync(AppDbContext context, ILogger logger)
        {
            try
            {
                var specs = new (string Code, string Name, string RoutePrefix)[]
                {
                    ("claims", "Claims", "claims"),
                    ("settings-claim-settings", "Claim Settings", "settings/claim-settings"),
                };

                var roles = SystemRoles.SettingsAdmin;
                var staffRoles = SystemRoles.All;
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

                    var rolesForModule = code == "claims" ? staffRoles : roles;
                    foreach (var role in rolesForModule)
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
                            CanDelete = code != "claims",
                            CanUpdateStatus = code == "claims",
                            CreatedAt = DateTime.UtcNow
                        });
                        changed = true;
                    }
                }

                if (changed)
                {
                    await context.SaveChangesAsync();
                    logger.LogInformation("Claim modules/permissions ensured.");
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "EnsureClaimSettingsModules skipped.");
            }
        }
    }
}
