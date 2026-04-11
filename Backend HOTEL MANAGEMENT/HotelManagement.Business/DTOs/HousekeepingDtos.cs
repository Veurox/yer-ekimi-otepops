using HotelManagement.Core.Enums;

namespace HotelManagement.Business.DTOs;

public class HousekeepingTaskDto
{
    public Guid Id { get; set; }
    public Guid RoomId { get; set; }
    public string RoomNumber { get; set; } = string.Empty;
    public string TaskType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int Priority { get; set; }
    public Guid? AssignedToId { get; set; }
    public string? AssignedToName { get; set; }
    public string Notes { get; set; } = string.Empty;
    public DateTime ScheduledDate { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateHousekeepingTaskDto
{
    public Guid RoomId { get; set; }
    public HousekeepingTaskType TaskType { get; set; }
    public int Priority { get; set; } = 2;
    public Guid? AssignedToId { get; set; }
    public string Notes { get; set; } = string.Empty;
    public DateTime ScheduledDate { get; set; }
}

public class UpdateHousekeepingStatusDto
{
    public string Status { get; set; } = string.Empty;
}

public class AssignHousekeepingStaffDto
{
    public Guid StaffId { get; set; }
}

public class HousekeepingSummaryDto
{
    public int Pending { get; set; }
    public int InProgress { get; set; }
    public int Completed { get; set; }
    public int Skipped { get; set; }
    public int Total { get; set; }
}
