using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Microsoft.Extensions.FileProviders;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.HttpOverrides;
using YLWorks.Data;
using YLWorks.Services;
using YLWorks.Hubs;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Scalar.AspNetCore;
using QuestPDF.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Swashbuckle.AspNetCore.SwaggerGen;
using YLWorks.Swagger;

var builder = WebApplication.CreateBuilder(args);

var jwtSettings = builder.Configuration.GetSection("Jwt");
var key = jwtSettings["Key"];
var issuer = jwtSettings["Issuer"];
var audience = jwtSettings["Audience"];

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders =
        ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    // Cloudflare / reverse proxy; clear known networks so forwarded headers are accepted.
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidIssuer = issuer,
        ValidAudience = audience,
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(key!)),
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true
    };
});

builder.Services.AddAuthorization();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Version = "v1",
        Title = "YL Works API",
        Description = "API for YL Works"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter: Bearer {your token}"
    });

    c.OperationFilter<AuthorizeCheckOperationFilter>();
});
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseMySql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        ServerVersion.AutoDetect(builder.Configuration.GetConnectionString("DefaultConnection"))
    );
});

builder.Services.AddSignalR();

builder.Services.AddCors(options =>
{
    // Dev only: Angular on :4200 calling API on :5000.
    options.AddPolicy("AllowAll",
        policy =>
        {
            policy
            .AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
        });
});


builder.Services.AddMemoryCache();

// Persist keys so encrypted calendar tokens survive app-pool recycles on IIS.
var dpKeysPath = Path.Combine(builder.Environment.ContentRootPath, "dp-keys");
Directory.CreateDirectory(dpKeysPath);
builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo(dpKeysPath))
    .SetApplicationName("YLWork");

builder.Services.Configure<YLWorks.Services.Leave.GoogleCalendarOptions>(
    builder.Configuration.GetSection(YLWorks.Services.Leave.GoogleCalendarOptions.SectionName));
builder.Services.Configure<YLWorks.Services.Leave.LeaveCalendarIcsOptions>(
    builder.Configuration.GetSection(YLWorks.Services.Leave.LeaveCalendarIcsOptions.SectionName));

builder.Services.AddHealthChecks();
builder.Services.AddScoped<EmailService>();
builder.Services.AddScoped<NotificationService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<YLWorks.Services.Leave.LeavePolicyService>();
builder.Services.AddScoped<YLWorks.Services.Leave.LeaveBalanceService>();
builder.Services.AddScoped<YLWorks.Services.Leave.LeaveBalanceCascadeService>();
builder.Services.AddScoped<YLWorks.Services.Leave.LeaveConflictService>();
builder.Services.AddScoped<YLWorks.Services.Leave.LeaveNotificationHelper>();
builder.Services.AddScoped<YLWorks.Services.Leave.EmergencyLeaveApprovalScheduler>();
builder.Services.AddScoped<YLWorks.Services.Leave.LeaveHolidayService>();
builder.Services.AddScoped<YLWorks.Services.Leave.LeaveRequestService>();
builder.Services.AddScoped<YLWorks.Services.Leave.LeaveCalendarTokenProtector>();
builder.Services.AddScoped<YLWorks.Services.Leave.GoogleCalendarLeaveSyncService>();
builder.Services.AddScoped<YLWorks.Services.Leave.LeaveExternalCalendarSyncCoordinator>();
builder.Services.AddScoped<YLWorks.Services.Leave.GoogleCalendarAuthService>();
builder.Services.AddScoped<YLWorks.Services.Leave.OutlookLeaveIcsFeedService>();
builder.Services.AddScoped<YLWorks.Services.Claims.ClaimSettingsService>();
builder.Services.AddScoped<YLWorks.Services.Claims.ClaimNotificationHelper>();
builder.Services.AddScoped<YLWorks.Services.Claims.ClaimRequestService>();
builder.Services.AddHostedService<YLWorks.Services.Leave.LeaveYearEndHostedService>();
builder.Services.AddScoped<IOfficeHandbookService, OfficeHandbookService>();

var app = builder.Build();

app.UseForwardedHeaders();

{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("LeaveDbSeeder");

    if (app.Environment.IsDevelopment())
    {
        // Full leave seed: types + policy + demo users/requests (dev only).
        await LeaveDbSeeder.SeedAsync(db, logger);
        var claimLogger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("ClaimDbSeeder");
        await ClaimDbSeeder.SeedAsync(db, claimLogger);
    }
    else
    {
        // Production: leave policy + default leave types only (no demo data).
        await LeaveDbSeeder.EnsureBasicsAsync(db, logger);
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "YL Works API v1");
        c.InjectJavascript("/swagger-ui/custom.js");
    });
}

if (app.Configuration.GetValue("EnableHttpsRedirection", false))
{
    app.UseHttpsRedirection();
}

// Same-origin SPA+API in Production needs no CORS. Keep open CORS for local Angular dev server.
if (app.Environment.IsDevelopment())
{
    app.UseCors("AllowAll");
}

app.UseDefaultFiles();
var staticFileContentTypes = new Microsoft.AspNetCore.StaticFiles.FileExtensionContentTypeProvider();
staticFileContentTypes.Mappings[".webmanifest"] = "application/manifest+json";
app.UseStaticFiles(new StaticFileOptions
{
    ContentTypeProvider = staticFileContentTypes
});

var uploadsRoot = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
Directory.CreateDirectory(uploadsRoot);
var uploadsProvider = new PhysicalFileProvider(uploadsRoot);

// Canonical path (lowercase). Also map /Uploads for existing DB-stored relative paths.
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = uploadsProvider,
    RequestPath = "/uploads"
});
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = uploadsProvider,
    RequestPath = "/Uploads"
});

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notifications");
app.MapHealthChecks("/health");

app.MapGet("/api", () => Results.Ok("Hello from API"));

// Angular client-side routes (must be after API/hub maps).
app.MapFallbackToFile("index.html");

app.Run();
