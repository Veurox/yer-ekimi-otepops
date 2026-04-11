using System.Net;
using System.Net.Http.Json;
using HotelManagement.Infrastructure.Data;
using HotelManagement.Core.Entities;
using HotelManagement.Core.Enums;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.InMemory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;

namespace HotelManagement.Tests;

public class OtelOpsApiFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Override configuration — provide all required values so startup doesn't throw
        builder.ConfigureAppConfiguration((ctx, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "InMemoryTest",
                ["ConnectionStrings:Redis"]             = "localhost:6379",
                ["Jwt:Key"]      = "IntegrationTestSecretKey12345678901234567890X",
                ["Jwt:Issuer"]   = "OtelOPS",
                ["Jwt:Audience"] = "OtelOPS",
                // Disable rate limiting in tests
                ["IpRateLimiting:EnableEndpointRateLimiting"] = "false",
                ["IpRateLimiting:StackBlockedRequests"] = "false",
                ["IpRateLimiting:RealIpHeader"] = "X-Real-IP",
                ["IpRateLimiting:ClientIdHeader"] = "X-ClientId",
                ["IpRateLimiting:HttpStatusCode"] = "429",
                ["IpRateLimiting:GeneralRules:0:Endpoint"] = "*",
                ["IpRateLimiting:GeneralRules:0:Period"] = "1s",
                ["IpRateLimiting:GeneralRules:0:Limit"] = "10000",
                // Disable email
                ["Email:IsEnabled"] = "false",
            });
        });

        builder.ConfigureServices(services =>
        {
            // Remove the existing DbContextOptions<ApplicationDbContext> to avoid
            // "multiple database providers" conflict between Npgsql and InMemory.
            var optionsDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
            if (optionsDescriptor != null)
                services.Remove(optionsDescriptor);

            // Build a dedicated EF Core internal service provider for InMemory only.
            // This prevents it from sharing the Npgsql provider registered by Program.cs.
            var internalSp = new ServiceCollection()
                .AddEntityFrameworkInMemoryDatabase()
                .BuildServiceProvider();

            // Register InMemory DbContext with its own isolated internal service provider.
            services.AddDbContext<ApplicationDbContext>(options =>
                options
                    .UseInternalServiceProvider(internalSp)
                    .UseInMemoryDatabase("IntegrationTestDb_" + Guid.NewGuid()));

            // Remove real Redis IConnectionMultiplexer — it's not needed in tests.
            var redisDescriptors = services
                .Where(d => d.ServiceType.FullName?.Contains("IConnectionMultiplexer") == true)
                .ToList();
            foreach (var d in redisDescriptors) services.Remove(d);
        });

        builder.UseEnvironment("Development");
    }

    public void SeedDatabase()
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        db.Database.EnsureCreated();

        if (db.Staff.Any()) return;

        var admin = new Staff
        {
            Id = Guid.NewGuid(),
            UserName = "admin",
            FirstName = "Admin",
            LastName = "User",
            Email = "admin@test.com",
            Role = StaffRole.Manager,
            IsActive = true,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!")
        };
        db.Staff.Add(admin);

        db.Rooms.AddRange(
            new Room { Id = Guid.NewGuid(), Number = "201", Type = RoomType.Single,  Price = 500,  Status = RoomStatus.Available, Capacity = 1, Floor = 2 },
            new Room { Id = Guid.NewGuid(), Number = "202", Type = RoomType.Double,  Price = 800,  Status = RoomStatus.Available, Capacity = 2, Floor = 2 },
            new Room { Id = Guid.NewGuid(), Number = "203", Type = RoomType.Suite,   Price = 2000, Status = RoomStatus.Occupied,  Capacity = 4, Floor = 2 }
        );

        db.SaveChanges();
    }
}

public class ApiIntegrationTests : IClassFixture<OtelOpsApiFactory>
{
    private readonly HttpClient _client;
    private readonly OtelOpsApiFactory _factory;

    public ApiIntegrationTests(OtelOpsApiFactory factory)
    {
        _factory = factory;
        // CreateClient starts the server — must happen BEFORE SeedDatabase uses Services
        _client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });
        _factory.SeedDatabase();
    }

    private async Task<string> GetTokenAsync(string user = "admin", string pass = "Admin123!")
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new { userName = user, password = pass });
        if (!response.IsSuccessStatusCode) return string.Empty;
        var body = await response.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        return body?["token"]?.ToString() ?? string.Empty;
    }

    private void SetAuth(string token) =>
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

    // ── Health ───────────────────────────────────────────────────────────────────
    [Fact]
    public async Task Health_Returns200()
    {
        var response = await _client.GetAsync("/health");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Root_Returns200OrRedirect()
    {
        var response = await _client.GetAsync("/");
        Assert.True(response.StatusCode is HttpStatusCode.OK or HttpStatusCode.Redirect
                    or HttpStatusCode.Found or HttpStatusCode.MovedPermanently);
    }

    // ── Auth ─────────────────────────────────────────────────────────────────────
    [Fact]
    public async Task Login_ValidCredentials_Returns200_WithToken()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login",
            new { userName = "admin", password = "Admin123!" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        Assert.NotNull(body);
        Assert.True(body!.ContainsKey("token"), "Response should contain 'token'");
        Assert.False(string.IsNullOrWhiteSpace(body["token"]?.ToString()), "Token should not be empty");
    }

    [Fact]
    public async Task Login_WrongPassword_Returns401()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login",
            new { userName = "admin", password = "Wrong!" });
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_NonExistentUser_Returns401()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login",
            new { userName = "nobody", password = "anything" });
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── Protected Routes ─────────────────────────────────────────────────────────
    [Fact]
    public async Task GetRooms_WithoutToken_Returns401()
    {
        _client.DefaultRequestHeaders.Authorization = null;
        var response = await _client.GetAsync("/api/rooms");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetRooms_WithValidToken_Returns200()
    {
        var token = await GetTokenAsync();
        SetAuth(token);
        var response = await _client.GetAsync("/api/rooms");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetRooms_Returns_AtLeast_3_Seeded_Rooms()
    {
        var token = await GetTokenAsync();
        SetAuth(token);
        var response = await _client.GetAsync("/api/rooms");
        var rooms = await response.Content.ReadFromJsonAsync<List<Dictionary<string, object>>>();
        Assert.NotNull(rooms);
        Assert.True(rooms!.Count >= 3, $"Expected >= 3 rooms, got {rooms.Count}");
    }

    [Fact]
    public async Task GetReservations_WithValidToken_Returns200()
    {
        var token = await GetTokenAsync();
        SetAuth(token);
        var response = await _client.GetAsync("/api/reservations");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetReservations_WithoutToken_Returns401()
    {
        _client.DefaultRequestHeaders.Authorization = null;
        var response = await _client.GetAsync("/api/reservations");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── Create Reservation ───────────────────────────────────────────────────────
    [Fact]
    public async Task CreateReservation_WithValidData_Returns201Or200()
    {
        var token = await GetTokenAsync();
        SetAuth(token);

        // Get an available room from seeded data
        var roomsResponse = await _client.GetAsync("/api/rooms");
        var rooms = await roomsResponse.Content.ReadFromJsonAsync<List<Dictionary<string, object>>>();
        var available = rooms!.FirstOrDefault(r => r["status"]?.ToString() == "Available");
        Assert.NotNull(available);

        var dto = new
        {
            roomId = Guid.Parse(available!["id"]!.ToString()!),
            checkInDate = DateTime.UtcNow.AddDays(10),
            checkOutDate = DateTime.UtcNow.AddDays(12),
            numberOfGuests = 1,
            totalAmount = 1000m,
            paidAmount = 1000m,
            paymentMethod = "Cash",
            primaryGuestName = "Integration Test Guest",
            primaryGuestEmail = "integrationtest@test.com",
            primaryGuestPhone = "5550000099",
            primaryGuestIdNumber = "88888888888",
            primaryGuestAddress = "Integration Test Address",
            additionalGuests = Array.Empty<object>()
        };

        var response = await _client.PostAsJsonAsync("/api/reservations", dto);
        var body = await response.Content.ReadAsStringAsync();
        Assert.True(response.StatusCode is HttpStatusCode.Created or HttpStatusCode.OK,
            $"Expected 201/200 but got {(int)response.StatusCode}: {body}");
    }

    // ── POS ─────────────────────────────────────────────────────────────────────
    [Fact]
    public async Task GetPosTransactions_WithToken_Returns200()
    {
        var token = await GetTokenAsync();
        SetAuth(token);
        var response = await _client.GetAsync("/api/pos");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // ── Housekeeping ─────────────────────────────────────────────────────────────
    [Fact]
    public async Task GetHousekeepingTasks_WithToken_Returns200()
    {
        var token = await GetTokenAsync();
        SetAuth(token);
        var response = await _client.GetAsync("/api/housekeeping");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetHousekeepingSummary_WithToken_Returns200()
    {
        var token = await GetTokenAsync();
        SetAuth(token);
        var response = await _client.GetAsync("/api/housekeeping/summary");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // ── Staff ────────────────────────────────────────────────────────────────────
    [Fact]
    public async Task GetStaff_WithToken_Returns200()
    {
        var token = await GetTokenAsync();
        SetAuth(token);
        var response = await _client.GetAsync("/api/staff");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // ── Security Headers ─────────────────────────────────────────────────────────
    [Fact]
    public async Task Response_Contains_XContentTypeOptions_Header()
    {
        var token = await GetTokenAsync();
        SetAuth(token);
        var response = await _client.GetAsync("/api/rooms");
        var hasHeader = response.Headers.Contains("X-Content-Type-Options") ||
                        response.Headers.Contains("x-content-type-options");
        Assert.True(hasHeader, "Response should include X-Content-Type-Options security header");
    }
}
