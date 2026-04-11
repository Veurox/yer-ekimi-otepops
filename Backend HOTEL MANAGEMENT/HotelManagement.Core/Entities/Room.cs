using HotelManagement.Core.Enums;
using HotelManagement.Core.Interfaces;

namespace HotelManagement.Core.Entities;

public class Room : IEntity
{
    public Guid Id { get; set; }

    public string Number { get; set; } = string.Empty;

    public RoomType Type { get; set; }

    public decimal Price { get; set; }

    public RoomStatus Status { get; set; }

    public int Floor { get; set; }

    public int Capacity { get; set; }

    public List<string> Features { get; set; } = new();

    public Guid? CurrentGuestId { get; set; }

    // --- State Machine: Valid room status transitions ---
    private static readonly Dictionary<RoomStatus, RoomStatus[]> _validTransitions = new()
    {
        { RoomStatus.Available, new[] { RoomStatus.Occupied, RoomStatus.Maintenance, RoomStatus.Reserved } },
        { RoomStatus.Reserved, new[] { RoomStatus.Occupied, RoomStatus.Available, RoomStatus.Maintenance } },
        { RoomStatus.Occupied, new[] { RoomStatus.Cleaning, RoomStatus.Maintenance } },
        { RoomStatus.Cleaning, new[] { RoomStatus.Available, RoomStatus.Maintenance } },
        { RoomStatus.Maintenance, new[] { RoomStatus.Available, RoomStatus.Cleaning } }
    };

    public bool CanTransitionTo(RoomStatus newStatus)
    {
        return _validTransitions.TryGetValue(Status, out var allowed) && allowed.Contains(newStatus);
    }

    public void TransitionTo(RoomStatus newStatus)
    {
        if (!CanTransitionTo(newStatus))
            throw new InvalidOperationException(
                $"Oda '{Number}' durumu '{Status}' -> '{newStatus}' geçişi geçersiz.");
        Status = newStatus;
    }
}
