using HotelManagement.Core.Interfaces;

namespace HotelManagement.Core.Entities;

public class GuestNote : IEntity
{
    public Guid Id { get; set; }
    public Guid GuestId { get; set; }
    public Guest? Guest { get; set; }

    public string Note { get; set; } = "";
    public string? AddedBy { get; set; }
    public bool IsImportant { get; set; }

    public DateTime CreatedAt { get; set; }
}
