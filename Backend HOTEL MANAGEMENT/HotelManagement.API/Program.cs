using AspNetCoreRateLimit;
using Microsoft.Extensions.Hosting;
using HotelManagement.Business.Services;
using HotelManagement.Business.Interfaces;
using HotelManagement.Core.Interfaces;
using HotelManagement.Infrastructure.Data;
using HotelManagement.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using Serilog.Events;
using System.Text;

// ── Serilog bootstrap logger (before DI) ─────────────────────────────────────
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .MinimumLevel.Override("System", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    Log.Information("OtelOPS API starting up...");

    var builder = WebApplication.CreateBuilder(args);

    // ── Serilog full configuration ────────────────────────────────────────────
    builder.Host.UseSerilog((ctx, services, cfg) => cfg
        .ReadFrom.Configuration(ctx.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext()
        .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Warning)
        .MinimumLevel.Override("Microsoft.EntityFrameworkCore.Database.Command", LogEventLevel.Warning)
        .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
        .WriteTo.File("logs/otelops-.log",
            rollingInterval: RollingInterval.Day,
            retainedFileCountLimit: 7,
            outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj}{NewLine}{Exception}"));

    // ── DB Context ────────────────────────────────────────────────────────────
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

    // ── Generic Repository ────────────────────────────────────────────────────
    builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));

    // ── Redis Cache ───────────────────────────────────────────────────────────
    builder.Services.AddStackExchangeRedisCache(options =>
    {
        options.Configuration = builder.Configuration.GetConnectionString("Redis");
        options.InstanceName = "OtelProject_";
    });

    builder.Services.AddScoped<ICacheService, HotelManagement.Infrastructure.Services.RedisCacheService>();

    // ── Business Services ─────────────────────────────────────────────────────
    builder.Services.AddScoped<ITokenService, TokenService>();
    builder.Services.AddScoped<IAuthService, AuthService>();
    builder.Services.AddScoped<IRoomService, RoomService>();
    builder.Services.AddScoped<IStaffService, StaffService>();
    builder.Services.AddScoped<IGuestService, GuestService>();
    builder.Services.AddScoped<IReservationService, ReservationService>();
    builder.Services.AddScoped<IMaintenanceService, MaintenanceService>();
    builder.Services.AddScoped<IMenuService, MenuService>();
    builder.Services.AddScoped<IRoomServiceOrderService, RoomServiceOrderService>();
    builder.Services.AddScoped<IInventoryService, InventoryService>();
    builder.Services.AddScoped<HotelManagement.Business.Validation.ReservationValidator>();
    builder.Services.AddScoped<IPaymentService, PaymentService>();
    builder.Services.AddScoped<IInvoiceService, InvoiceService>();
    builder.Services.AddScoped<IReportingService, ReportingService>();
    builder.Services.AddScoped<IRatePlanService, RatePlanService>();
    builder.Services.AddScoped<IAuditService, AuditService>();
    builder.Services.AddScoped<IGuestCrmService, GuestCrmService>();
    builder.Services.AddScoped<IDynamicPricingService, DynamicPricingService>();
    builder.Services.AddScoped<ILoyaltyService, LoyaltyService>();
    builder.Services.AddScoped<ISurveyService, SurveyService>();
    builder.Services.AddScoped<IPosService, PosService>();
    builder.Services.AddScoped<IHousekeepingService, HousekeepingService>();
    builder.Services.AddScoped<IEmailService, HotelManagement.Infrastructure.Services.SmtpEmailService>();
    builder.Services.AddHostedService<HotelManagement.Infrastructure.Services.CheckInReminderService>();

    // ── JWT Authentication ────────────────────────────────────────────────────
    var jwtKey = builder.Configuration["Jwt:Key"]
        ?? throw new InvalidOperationException("JWT key is not configured.");
    var key = Encoding.ASCII.GetBytes(jwtKey);
    var isProduction = builder.Environment.IsProduction();

    builder.Services.AddAuthentication(x =>
    {
        x.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        x.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(x =>
    {
        x.RequireHttpsMetadata = isProduction;
        x.SaveToken = true;
        x.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],
            ClockSkew = TimeSpan.Zero
        };
    });

    // ── Rate Limiting ─────────────────────────────────────────────────────────
    builder.Services.AddMemoryCache();
    builder.Services.Configure<IpRateLimitOptions>(builder.Configuration.GetSection("IpRateLimiting"));
    builder.Services.AddSingleton<IIpPolicyStore, MemoryCacheIpPolicyStore>();
    builder.Services.AddSingleton<IRateLimitCounterStore, MemoryCacheRateLimitCounterStore>();
    builder.Services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();
    builder.Services.AddSingleton<IProcessingStrategy, AsyncKeyLockProcessingStrategy>();
    builder.Services.AddInMemoryRateLimiting();

    // ── SignalR ───────────────────────────────────────────────────────────────
    builder.Services.AddSignalR();

    // ── Health Checks ─────────────────────────────────────────────────────────
    builder.Services.AddHealthChecks()
        .AddNpgSql(
            builder.Configuration.GetConnectionString("DefaultConnection")!,
            name: "postgres",
            tags: new[] { "db", "ready" })
        .AddRedis(
            builder.Configuration.GetConnectionString("Redis")!,
            name: "redis",
            tags: new[] { "cache", "ready" });

    // ── Controllers & JSON ────────────────────────────────────────────────────
    builder.Services.AddControllers()
        .AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
            options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        });

    builder.Services.AddEndpointsApiExplorer();

    // ── Swagger (development only in production, configurable) ────────────────
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new OpenApiInfo
        {
            Title = "OtelOPS Hotel Management API",
            Version = "v1",
            Description = "Complete hotel management and reservation system API"
        });
        c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Description = "JWT Authorization header. Example: 'Bearer {token}'",
            Name = "Authorization",
            In = ParameterLocation.Header,
            Type = SecuritySchemeType.Http,
            Scheme = "bearer"
        });
        c.AddSecurityRequirement(new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
                },
                Array.Empty<string>()
            }
        });
    });

    // ── CORS ──────────────────────────────────────────────────────────────────
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowAll", policy =>
        {
            var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                ?? new[] { "http://localhost:5173", "http://localhost:3000" };
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    var app = builder.Build();
    // ─────────────────────────────────────────────────────────────────────────

    // ── Request logging ───────────────────────────────────────────────────────
    app.UseSerilogRequestLogging(options =>
    {
        options.MessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000}ms";
    });

    // ── Security Headers ──────────────────────────────────────────────────────
    app.Use(async (context, next) =>
    {
        context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
        context.Response.Headers.Append("X-Frame-Options", "DENY");
        context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
        context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
        await next();
    });

    // ── HTTPS Redirect (production only) ─────────────────────────────────────
    if (isProduction)
    {
        app.UseHsts();
        app.UseHttpsRedirection();
    }

    // ── Rate Limiting ─────────────────────────────────────────────────────────
    app.UseIpRateLimiting();

    // ── Swagger (all envs for now; restrict in production if needed) ──────────
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "OtelOPS API v1");
        c.RoutePrefix = "swagger";
    });

    app.UseCors("AllowAll");
    app.UseAuthentication();
    app.UseAuthorization();

    app.MapControllers();
    app.MapHub<HotelManagement.API.Hubs.HousekeepingHub>("/hubs/housekeeping");

    // ── Health check endpoints ────────────────────────────────────────────────
    app.MapHealthChecks("/health");
    app.MapHealthChecks("/health/ready", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
    {
        Predicate = check => check.Tags.Contains("ready")
    });
    app.MapGet("/", () => Results.Redirect("/swagger"));

    // ── Database Initialization ───────────────────────────────────────────────
    using (var scope = app.Services.CreateScope())
    {
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

        try
        {
            if (context.Database.IsRelational())
            {
                logger.LogInformation("Applying database migrations...");
                await context.Database.MigrateAsync();
                logger.LogInformation("Database migrations applied successfully.");
            }
            else
            {
                // InMemory provider (used in integration tests) — just ensure schema exists
                await context.Database.EnsureCreatedAsync();
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while migrating the database.");
            throw;
        }

        // Seed only if database is empty (idempotent seeding)
        await HotelManagement.API.DataSeeder.SeedRooms(context);
        await HotelManagement.API.DataSeeder.SeedStaff(context);
        await HotelManagement.API.DataSeeder.SeedGuests(context);
        await HotelManagement.API.DataSeeder.SeedInventory(context);
        await HotelManagement.API.DataSeeder.SeedMenu(context);
        await HotelManagement.API.DataSeeder.SeedReservations(context);
        await HotelManagement.API.DataSeeder.SeedMaintenance(context);
        await HotelManagement.API.DataSeeder.SeedOrders(context);
        await HotelManagement.API.DataSeeder.SeedRatePlans(context);
        await HotelManagement.API.DataSeeder.SeedDynamicPricingRules(context);
    }

    app.Run();
}
catch (Exception ex) when (ex is not HostAbortedException && ex.GetType().Name != "StopTheHostException")
{
    Log.Fatal(ex, "OtelOPS API terminated unexpectedly.");
}
finally
{
    Log.CloseAndFlush();
}

// Required for WebApplicationFactory in integration tests
public partial class Program { }
