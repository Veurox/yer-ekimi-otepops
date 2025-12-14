using HotelManagement.Business.DTOs;

namespace HotelManagement.Business.Interfaces;

public interface IStaffService
{
    Task<IEnumerable<StaffDto>> GetAllStaffAsync();
    Task<StaffDto?> GetStaffByIdAsync(Guid id);
    Task<StaffDto> CreateStaffAsync(CreateStaffDto dto);
    Task UpdateStaffAsync(StaffDto dto);
    Task DeleteStaffAsync(Guid id);
}
