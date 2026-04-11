using HotelManagement.Business.DTOs;

namespace HotelManagement.Business.Interfaces;

public interface IRatePlanService
{
    Task<IEnumerable<RatePlanDto>> GetAllAsync();
    Task<RatePlanDto?> GetByIdAsync(Guid id);
    Task<RatePlanDto> CreateAsync(CreateRatePlanDto dto);
    Task<RatePlanDto> UpdateAsync(Guid id, CreateRatePlanDto dto);
    Task DeleteAsync(Guid id);

    /// <summary>Calculate price for a room for given date range considering active rate plans</summary>
    Task<CalculatedRateDto> CalculateRateAsync(Guid roomId, DateTime checkIn, DateTime checkOut);
}
