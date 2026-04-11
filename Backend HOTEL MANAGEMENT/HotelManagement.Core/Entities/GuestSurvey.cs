using HotelManagement.Core.Interfaces;

namespace HotelManagement.Core.Entities;

public class GuestSurvey : IEntity
{
    public Guid Id { get; set; }
    public Guid GuestId { get; set; }
    public Guid ReservationId { get; set; }

    public int OverallRating { get; set; }
    public int RoomCleanliness { get; set; }
    public int StaffFriendliness { get; set; }
    public int FoodQuality { get; set; }
    public int ValueForMoney { get; set; }

    public string? Comments { get; set; }
    public bool WouldRecommend { get; set; }

    public DateTime SubmittedAt { get; set; }
}
