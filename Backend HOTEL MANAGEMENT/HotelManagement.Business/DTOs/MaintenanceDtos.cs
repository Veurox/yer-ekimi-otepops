using HotelManagement.Core.Enums;

namespace HotelManagement.Business.DTOs;

public class MaintenanceRequestDto
{
    public Guid Id { get; set; }
    public Guid RoomId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string ReportedBy { get; set; } = string.Empty;
    public Guid? AssignedTo { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateMaintenanceRequestDto
{
    public Guid RoomId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public MaintenancePriority Priority { get; set; }
    public string ReportedBy { get; set; } = string.Empty;
    public Guid? AssignedTo { get; set; }
}
