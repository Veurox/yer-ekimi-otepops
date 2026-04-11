using HotelManagement.Core.Interfaces;

namespace HotelManagement.Core.Entities;

public class LoyaltyTransaction : IEntity
{
    public Guid Id { get; set; }
    public Guid GuestId { get; set; }
    public Guest? Guest { get; set; }

    public int Points { get; set; }
    public string TransactionType { get; set; } = "";  // Earned, Redeemed, Expired, Bonus
    public string Description { get; set; } = "";
    public Guid? ReservationId { get; set; }

    public DateTime CreatedAt { get; set; }
}
