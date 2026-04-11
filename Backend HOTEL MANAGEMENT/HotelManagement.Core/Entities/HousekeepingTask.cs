using HotelManagement.Core.Enums;
using HotelManagement.Core.Interfaces;

namespace HotelManagement.Core.Entities;

public class HousekeepingTask : IEntity
{
    public Guid Id { get; set; }

    public Guid RoomId { get; set; }
    public Room? Room { get; set; }

    public HousekeepingTaskType TaskType { get; set; }

    public HousekeepingStatus Status { get; set; } = HousekeepingStatus.Pending;

    public int Priority { get; set; } = 2; // 1=Low, 2=Medium, 3=High

    public Guid? AssignedToId { get; set; }
    public Staff? AssignedTo { get; set; }

    public string Notes { get; set; } = string.Empty;

    public DateTime ScheduledDate { get; set; }

    public DateTime? StartedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
