using HotelManagement.Core.Interfaces;

namespace HotelManagement.Core.Entities;

public class AuditLog : IEntity
{
    public Guid Id { get; set; }
    public string EntityName { get; set; } = "";  // e.g. "Reservation", "Room"
    public string EntityId { get; set; } = "";
    public string Action { get; set; } = "";      // "Created", "Updated", "Deleted", "CheckIn", "CheckOut", etc.
    public string? ChangedBy { get; set; }         // userName
    public string? OldValues { get; set; }         // JSON
    public string? NewValues { get; set; }         // JSON
    public string? Notes { get; set; }
    public DateTime Timestamp { get; set; }
}
