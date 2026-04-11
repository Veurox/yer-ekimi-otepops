namespace HotelManagement.Business.DTOs;

public record GuestSurveyDto(
    Guid Id,
    Guid GuestId,
    Guid ReservationId,
    int OverallRating,
    int RoomCleanliness,
    int StaffFriendliness,
    int FoodQuality,
    int ValueForMoney,
    string? Comments,
    bool WouldRecommend,
    DateTime SubmittedAt
);

public class SubmitSurveyDto
{
    public Guid GuestId { get; set; }
    public Guid ReservationId { get; set; }
    public int OverallRating { get; set; }
    public int RoomCleanliness { get; set; }
    public int StaffFriendliness { get; set; }
    public int FoodQuality { get; set; }
    public int ValueForMoney { get; set; }
    public string? Comments { get; set; }
    public bool WouldRecommend { get; set; }
}

public record SurveyStatsDto(
    double AverageOverall,
    double AverageRoomCleanliness,
    double AverageStaffFriendliness,
    double AverageFoodQuality,
    double AverageValueForMoney,
    int TotalSurveys,
    double RecommendationRate
);
