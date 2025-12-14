using HotelManagement.Business.DTOs;
using HotelManagement.Business.Interfaces;
using HotelManagement.Core.Entities;
using HotelManagement.Core.Interfaces;

namespace HotelManagement.Business.Services;

public class StaffService : IStaffService
{
    private readonly IGenericRepository<Staff> _repository;

    public StaffService(IGenericRepository<Staff> repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<StaffDto>> GetAllStaffAsync()
    {
        var staffList = await _repository.GetAllAsync();
        return staffList.Select(MapToDto);
    }

    public async Task<StaffDto?> GetStaffByIdAsync(Guid id)
    {
        var staff = await _repository.GetByIdAsync(id);
        if (staff == null) return null;
        return MapToDto(staff);
    }

    public async Task<StaffDto> CreateStaffAsync(CreateStaffDto dto)
    {
        var staff = new Staff
        {
            Id = Guid.NewGuid(),
            UserName = dto.UserName,
            // SECURITY WARNING: In production, hash this password!
            PasswordHash = dto.Password, 
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Email = dto.Email,
            PhoneNumber = dto.PhoneNumber,
            Role = dto.Role,
            Shift = dto.Shift,
            Salary = dto.Salary,
            HireDate = DateTime.UtcNow,
            IsActive = true
        };

        await _repository.AddAsync(staff);
        await _repository.SaveChangesAsync();

        return MapToDto(staff);
    }

    public async Task UpdateStaffAsync(StaffDto dto)
    {
        var staff = await _repository.GetByIdAsync(dto.Id);
        if (staff == null) throw new KeyNotFoundException($"Staff {dto.Id} not found");

        staff.UserName = dto.UserName;
        staff.FirstName = dto.FirstName;
        staff.LastName = dto.LastName;
        staff.Email = dto.Email;
        staff.PhoneNumber = dto.PhoneNumber;
        staff.Salary = dto.Salary;
        staff.IsActive = dto.IsActive;
        // Role and Shift can be updated if logic allows
        
        await _repository.UpdateAsync(staff);
        await _repository.SaveChangesAsync();
    }

    public async Task DeleteStaffAsync(Guid id)
    {
        var staff = await _repository.GetByIdAsync(id);
        if (staff == null) throw new KeyNotFoundException($"Staff {id} not found");

        await _repository.DeleteAsync(staff);
        await _repository.SaveChangesAsync();
    }

    private static StaffDto MapToDto(Staff staff)
    {
        return new StaffDto
        {
            Id = staff.Id,
            UserName = staff.UserName,
            FirstName = staff.FirstName,
            LastName = staff.LastName,
            Email = staff.Email,
            PhoneNumber = staff.PhoneNumber,
            Salary = staff.Salary,
            HireDate = staff.HireDate,
            Role = staff.Role == HotelManagement.Core.Enums.StaffRole.RoomService ? "room-service" : staff.Role.ToString().ToLower(),
            Shift = staff.Shift.ToString().ToLower(),
            IsActive = staff.IsActive
        };
    }
}
