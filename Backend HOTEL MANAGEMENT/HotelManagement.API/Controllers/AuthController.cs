using HotelManagement.Business.DTOs;
using HotelManagement.Business.Interfaces;
using HotelManagement.Core.Entities;
using Microsoft.AspNetCore.Mvc;

namespace HotelManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ITokenService _tokenService;

    public AuthController(IAuthService authService, ITokenService tokenService)
    {
        _authService = authService;
        _tokenService = tokenService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<string>> Login(LoginDto dto)
    {
        var user = await _authService.LoginAsync(dto.UserName, dto.Password);
        if (user == null) return Unauthorized("Invalid credentials");

        var token = _tokenService.GenerateToken(user);
        
        var userDto = new 
        {
            Id = user.Id,
            UserName = user.UserName,
            Email = user.Email,
            Role = user.Role == HotelManagement.Core.Enums.StaffRole.RoomService ? "room-service" : user.Role.ToString().ToLower(),
            FirstName = user.FirstName,
            LastName = user.LastName,
            PhoneNumber = user.PhoneNumber,
            IsActive = user.IsActive,
            ThemePreference = "light"
        };

        return Ok(new { Token = token, User = userDto });
    }

    [HttpPost("register")]
    public async Task<ActionResult<StaffDto>> Register(CreateStaffDto dto)
    {
        var staff = new Staff
        {
            Id = Guid.NewGuid(),
            UserName = dto.UserName,
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Email = dto.Email,
            PhoneNumber = dto.PhoneNumber,
            Role = dto.Role,
            Shift = dto.Shift,
            Salary = dto.Salary,
            IsActive = true
        };

        var result = await _authService.RegisterAsync(staff, dto.Password);
        if (result == null) return BadRequest("User already exists");

        return Ok(new StaffDto 
        { 
            Id = result.Id, 
            UserName = result.UserName, 
            FirstName = result.FirstName,
            LastName = result.LastName,
            Email = result.Email,
            PhoneNumber = result.PhoneNumber,
            Salary = result.Salary,
            HireDate = result.HireDate,
            Role = result.Role == HotelManagement.Core.Enums.StaffRole.RoomService ? "room-service" : result.Role.ToString().ToLower(),
            Shift = result.Shift.ToString().ToLower(),
            IsActive = result.IsActive 
        });
    }
}

