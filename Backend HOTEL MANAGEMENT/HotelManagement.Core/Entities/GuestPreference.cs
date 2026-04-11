using HotelManagement.Core.Interfaces;

namespace HotelManagement.Core.Entities;

public class GuestPreference : IEntity
{
    public Guid Id { get; set; }
    public Guid GuestId { get; set; }
    public Guest? Guest { get; set; }

    public string Category { get; set; } = "";  // RoomPreference, Food, Pillow, Temperature, Other
    public string Key { get; set; } = "";
    public string Value { get; set; } = "";
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
