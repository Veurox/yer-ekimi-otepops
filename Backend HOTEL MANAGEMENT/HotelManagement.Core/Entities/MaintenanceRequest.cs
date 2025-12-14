using HotelManagement.Core.Enums;
using HotelManagement.Core.Interfaces;

namespace HotelManagement.Core.Entities;

public class MaintenanceRequest : IEntity
{
    public Guid Id { get; set; }
    
    public Guid RoomId { get; set; }
    public Room? Room { get; set; }
    
    public string Title { get; set; } = string.Empty;
    
    public string Description { get; set; } = string.Empty;
    
    public MaintenancePriority Priority { get; set; }
    
    public MaintenanceStatus Status { get; set; }
    
    public string ReportedBy { get; set; } = string.Empty; // Staff Id or Name
    
    public Guid? AssignedToId { get; set; }
    public Staff? AssignedTo { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? CompletedAt { get; set; }
}
