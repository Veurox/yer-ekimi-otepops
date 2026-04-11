using HotelManagement.Business.DTOs;

namespace HotelManagement.Business.Interfaces;

public interface ISurveyService
{
    Task<GuestSurveyDto> SubmitAsync(SubmitSurveyDto dto);
    Task<List<GuestSurveyDto>> GetAllAsync(int page = 1, int pageSize = 20);
    Task<SurveyStatsDto> GetStatsAsync();
    Task<List<GuestSurveyDto>> GetByGuestAsync(Guid guestId);
}
