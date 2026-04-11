using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using HotelManagement.Infrastructure.Data;

namespace HotelManagement.Tests;

/// <summary>
/// Minimal factory diagnostic: isolates why WebApplicationFactory fails to start.
/// </summary>
public class MinimalFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((ctx, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "Host=localhost;Port=5433;Database=TestDb;Username=postgres;Password=test",
                ["ConnectionStrings:Redis"] = "localhost:6379",
                ["Jwt:Key"]      = "IntegrationTestSecretKey12345678901234567890X",
                ["Jwt:Issuer"]   = "OtelOPS",
                ["Jwt:Audience"] = "OtelOPS",
                ["IpRateLimiting:EnableEndpointRateLimiting"] = "false",
                ["IpRateLimiting:StackBlockedRequests"] = "false",
                ["IpRateLimiting:GeneralRules:0:Endpoint"] = "*",
                ["IpRateLimiting:GeneralRules:0:Period"] = "1s",
                ["IpRateLimiting:GeneralRules:0:Limit"] = "10000",
                ["Email:IsEnabled"] = "false",
            });
        });

        builder.UseEnvironment("Development");
    }
}

public class FactoryDiagnosticTests
{
    [Fact]
    public void MinimalFactory_Services_DoesNotThrow()
    {
        var ex = Record.Exception(() =>
        {
            using var factory = new MinimalFactory();
            var sp = factory.Services;
            Assert.NotNull(sp);
        });
        Assert.Null(ex);
    }

    [Fact]
    public void OtelOpsFactory_CreateClient_DoesNotThrow()
    {
        Exception? startupEx = null;
        try
        {
            using var factory = new OtelOpsApiFactory();
            using var client = factory.CreateClient();
            Assert.NotNull(client);
        }
        catch (Exception ex)
        {
            startupEx = ex;
        }

        if (startupEx != null)
        {
            // Report inner exceptions to help debug
            var msg = startupEx.Message;
            var inner = startupEx.InnerException;
            while (inner != null)
            {
                msg += $"\n  → {inner.Message}";
                inner = inner.InnerException;
            }
            Assert.Fail($"Factory startup failed: {msg}");
        }
    }
}
