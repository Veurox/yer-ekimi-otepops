using HotelManagement.Business.DTOs;
using HotelManagement.Business.Interfaces;
using HotelManagement.Core.Entities;
using HotelManagement.Core.Interfaces;

namespace HotelManagement.Business.Services;

public class SurveyService : ISurveyService
{
    private readonly IGenericRepository<GuestSurvey> _surveyRepo;

    public SurveyService(IGenericRepository<GuestSurvey> surveyRepo)
    {
        _surveyRepo = surveyRepo;
    }

    public async Task<GuestSurveyDto> SubmitAsync(SubmitSurveyDto dto)
    {
        var survey = new GuestSurvey
        {
            Id = Guid.NewGuid(),
            GuestId = dto.GuestId,
            ReservationId = dto.ReservationId,
            OverallRating = Math.Clamp(dto.OverallRating, 1, 5),
            RoomCleanliness = Math.Clamp(dto.RoomCleanliness, 1, 5),
            StaffFriendliness = Math.Clamp(dto.StaffFriendliness, 1, 5),
            FoodQuality = Math.Clamp(dto.FoodQuality, 1, 5),
            ValueForMoney = Math.Clamp(dto.ValueForMoney, 1, 5),
            Comments = dto.Comments,
            WouldRecommend = dto.WouldRecommend,
            SubmittedAt = DateTime.UtcNow
        };
        await _surveyRepo.AddAsync(survey);
        await _surveyRepo.SaveChangesAsync();
        return ToDto(survey);
    }

    public async Task<List<GuestSurveyDto>> GetAllAsync(int page = 1, int pageSize = 20)
    {
        var all = await _surveyRepo.GetAllAsync();
        return all.OrderByDescending(s => s.SubmittedAt)
                  .Skip((page - 1) * pageSize).Take(pageSize)
                  .Select(ToDto).ToList();
    }

    public async Task<SurveyStatsDto> GetStatsAsync()
    {
        var all = await _surveyRepo.GetAllAsync();
        if (!all.Any())
            return new SurveyStatsDto(0, 0, 0, 0, 0, 0, 0);

        return new SurveyStatsDto(
            all.Average(s => s.OverallRating),
            all.Average(s => s.RoomCleanliness),
            all.Average(s => s.StaffFriendliness),
            all.Average(s => s.FoodQuality),
            all.Average(s => s.ValueForMoney),
            all.Count(),
            all.Count() > 0 ? (double)all.Count(s => s.WouldRecommend) / all.Count() * 100 : 0
        );
    }

    public async Task<List<GuestSurveyDto>> GetByGuestAsync(Guid guestId)
    {
        var surveys = await _surveyRepo.FindAsync(s => s.GuestId == guestId);
        return surveys.OrderByDescending(s => s.SubmittedAt).Select(ToDto).ToList();
    }

    private static GuestSurveyDto ToDto(GuestSurvey s) =>
        new(s.Id, s.GuestId, s.ReservationId, s.OverallRating, s.RoomCleanliness,
            s.StaffFriendliness, s.FoodQuality, s.ValueForMoney, s.Comments, s.WouldRecommend, s.SubmittedAt);
}
