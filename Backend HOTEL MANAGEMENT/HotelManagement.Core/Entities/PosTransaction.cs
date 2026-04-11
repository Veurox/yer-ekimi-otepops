using HotelManagement.Core.Enums;
using HotelManagement.Core.Interfaces;

namespace HotelManagement.Core.Entities;

public class PosTransaction : IEntity
{
    public Guid Id { get; set; }

    public Guid ReservationId { get; set; }
    public Reservation? Reservation { get; set; }

    public Guid GuestId { get; set; }
    public Guest? Guest { get; set; }

    public Guid RoomId { get; set; }
    public Room? Room { get; set; }

    public string Description { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public PosCategory Category { get; set; }

    public PosStatus Status { get; set; } = PosStatus.Pending;

    public string CreatedBy { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ChargedAt { get; set; }

    // FK to Payment when charged to room
    public Guid? PaymentId { get; set; }
}
