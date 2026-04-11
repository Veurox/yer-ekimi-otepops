using HotelManagement.Business.DTOs;

namespace HotelManagement.Business.Interfaces;

public interface IGuestService
{
    Task<IEnumerable<GuestDto>> GetAllGuestsAsync();
    Task<PagedResultDto<GuestDto>> GetPagedAsync(int page, int pageSize, string? search);
    Task<GuestDto?> GetGuestByIdAsync(Guid id);
    Task<GuestDto> CreateGuestAsync(CreateGuestDto dto);
    Task UpdateGuestAsync(GuestDto dto);
    Task DeleteGuestAsync(Guid id);
}
