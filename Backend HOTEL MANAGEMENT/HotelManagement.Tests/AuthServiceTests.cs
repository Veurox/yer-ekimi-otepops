using HotelManagement.Business.Services;
using HotelManagement.Core.Entities;
using HotelManagement.Core.Enums;
using HotelManagement.Infrastructure.Data;
using HotelManagement.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Tests;

public class AuthServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly AuthService _service;

    public AuthServiceTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _context = new ApplicationDbContext(options);
        var staffRepo = new GenericRepository<Staff>(_context);
        _service = new AuthService(staffRepo);
    }

    public void Dispose() => _context.Dispose();

    private async Task<Staff> SeedStaff(string userName = "testuser", string password = "Test123!")
    {
        var staff = new Staff
        {
            Id = Guid.NewGuid(),
            UserName = userName,
            FirstName = "Test",
            LastName = "User",
            Email = $"{userName}@test.com",
            Role = StaffRole.Receptionist,
            IsActive = true
        };
        var result = await _service.RegisterAsync(staff, password);
        return result!;
    }

    // --- RegisterAsync ---
    [Fact]
    public async Task Register_NewUser_ReturnsStaff()
    {
        var staff = new Staff { Id = Guid.NewGuid(), UserName = "newuser", FirstName = "New", LastName = "User", Email = "new@test.com", Role = StaffRole.Receptionist, IsActive = true };
        var result = await _service.RegisterAsync(staff, "Secure123!");
        Assert.NotNull(result);
        Assert.Equal("newuser", result.UserName);
    }

    [Fact]
    public async Task Register_DuplicateUserName_ReturnsNull()
    {
        await SeedStaff("dupuser");
        var duplicate = new Staff { Id = Guid.NewGuid(), UserName = "dupuser", FirstName = "Dup", LastName = "User", Email = "dup2@test.com", Role = StaffRole.Receptionist, IsActive = true };
        var result = await _service.RegisterAsync(duplicate, "AnotherPass!");
        Assert.Null(result);
    }

    [Fact]
    public async Task Register_PasswordIsHashed()
    {
        var rawPassword = "PlainText123!";
        var staff = new Staff { Id = Guid.NewGuid(), UserName = "hashuser", FirstName = "Hash", LastName = "User", Email = "hash@test.com", Role = StaffRole.Receptionist, IsActive = true };
        var result = await _service.RegisterAsync(staff, rawPassword);
        Assert.NotNull(result);
        Assert.NotEqual(rawPassword, result!.PasswordHash);
        Assert.True(BCrypt.Net.BCrypt.Verify(rawPassword, result.PasswordHash));
    }

    // --- LoginAsync ---
    [Fact]
    public async Task Login_ValidCredentials_ReturnsStaff()
    {
        await SeedStaff("loginuser", "Pass123!");
        var result = await _service.LoginAsync("loginuser", "Pass123!");
        Assert.NotNull(result);
        Assert.Equal("loginuser", result!.UserName);
    }

    [Fact]
    public async Task Login_WrongPassword_ReturnsNull()
    {
        await SeedStaff("wrongpass", "CorrectPass!");
        var result = await _service.LoginAsync("wrongpass", "WrongPass!");
        Assert.Null(result);
    }

    [Fact]
    public async Task Login_NonExistentUser_ReturnsNull()
    {
        var result = await _service.LoginAsync("ghost", "anything");
        Assert.Null(result);
    }

    [Fact]
    public async Task Login_EmptyPassword_ReturnsNull()
    {
        await SeedStaff("emptypass", "Correct!");
        var result = await _service.LoginAsync("emptypass", "");
        Assert.Null(result);
    }
}
