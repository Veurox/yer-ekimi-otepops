using HotelManagement.Business.Interfaces;
using HotelManagement.Core.Entities;
using HotelManagement.Core.Interfaces;

namespace HotelManagement.Business.Services;

public class AuthService : IAuthService
{
    private readonly IGenericRepository<Staff> _staffRepository;

    public AuthService(IGenericRepository<Staff> staffRepository)
    {
        _staffRepository = staffRepository;
    }

    public async Task<Staff?> LoginAsync(string userName, string password)
    {
        var staffList = await _staffRepository.FindAsync(s => s.UserName == userName);
        var staff = staffList.FirstOrDefault();
        
        if (staff == null) return null;
        
        // Verify password using BCrypt
        if (!BCrypt.Net.BCrypt.Verify(password, staff.PasswordHash)) return null; 

        return staff;
    }

    public async Task<Staff?> RegisterAsync(Staff staff, string password)
    {
        var existing = await _staffRepository.FindAsync(s => s.UserName == staff.UserName);
        if (existing.Any()) return null; // Already exists

        // Hash password
        staff.PasswordHash = BCrypt.Net.BCrypt.HashPassword(password);
        
        await _staffRepository.AddAsync(staff);
        await _staffRepository.SaveChangesAsync();

        return staff;
    }
}
