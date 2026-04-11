using HotelManagement.Business.DTOs;
using HotelManagement.Business.Interfaces;
using HotelManagement.Core.Entities;
using HotelManagement.Core.Enums;
using HotelManagement.Core.Interfaces;

namespace HotelManagement.Business.Services;

public class HousekeepingService : IHousekeepingService
{
    private readonly IGenericRepository<HousekeepingTask> _taskRepository;
    private readonly IGenericRepository<Room> _roomRepository;
    private readonly IGenericRepository<Staff> _staffRepository;

    public HousekeepingService(
        IGenericRepository<HousekeepingTask> taskRepository,
        IGenericRepository<Room> roomRepository,
        IGenericRepository<Staff> staffRepository)
    {
        _taskRepository = taskRepository;
        _roomRepository = roomRepository;
        _staffRepository = staffRepository;
    }

    public async Task<IEnumerable<HousekeepingTaskDto>> GetTasksAsync(DateTime? date = null, Guid? roomId = null, Guid? assignedToId = null, string? status = null)
    {
        var tasks = await _taskRepository.GetAllAsync();

        if (date.HasValue)
            tasks = tasks.Where(t => t.ScheduledDate.Date == date.Value.Date);

        if (roomId.HasValue)
            tasks = tasks.Where(t => t.RoomId == roomId.Value);

        if (assignedToId.HasValue)
            tasks = tasks.Where(t => t.AssignedToId == assignedToId.Value);

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<HousekeepingStatus>(status, true, out var parsedStatus))
            tasks = tasks.Where(t => t.Status == parsedStatus);

        var rooms = await _roomRepository.GetAllAsync();
        var staff = await _staffRepository.GetAllAsync();

        return tasks.OrderByDescending(t => t.Priority)
                    .ThenBy(t => t.ScheduledDate)
                    .Select(t => MapToDto(t, rooms, staff));
    }

    public async Task<HousekeepingTaskDto> CreateTaskAsync(CreateHousekeepingTaskDto dto)
    {
        var room = await _roomRepository.GetByIdAsync(dto.RoomId)
            ?? throw new InvalidOperationException("Oda bulunamadı.");

        var task = new HousekeepingTask
        {
            Id = Guid.NewGuid(),
            RoomId = dto.RoomId,
            TaskType = dto.TaskType,
            Status = HousekeepingStatus.Pending,
            Priority = dto.Priority,
            AssignedToId = dto.AssignedToId,
            Notes = dto.Notes,
            ScheduledDate = dto.ScheduledDate,
            CreatedAt = DateTime.UtcNow
        };

        await _taskRepository.AddAsync(task);
        await _taskRepository.SaveChangesAsync();

        var rooms = await _roomRepository.GetAllAsync();
        var staff = await _staffRepository.GetAllAsync();
        return MapToDto(task, rooms, staff);
    }

    public async Task<HousekeepingTaskDto> UpdateStatusAsync(Guid taskId, string newStatus)
    {
        var task = await _taskRepository.GetByIdAsync(taskId)
            ?? throw new InvalidOperationException("Görev bulunamadı.");

        if (!Enum.TryParse<HousekeepingStatus>(newStatus, true, out var status))
            throw new InvalidOperationException($"Geçersiz durum: {newStatus}");

        task.Status = status;

        if (status == HousekeepingStatus.InProgress && task.StartedAt == null)
            task.StartedAt = DateTime.UtcNow;

        if (status == HousekeepingStatus.Completed)
        {
            task.CompletedAt = DateTime.UtcNow;

            // Mark room as Available when cleaning is done
            var room = await _roomRepository.GetByIdAsync(task.RoomId);
            if (room != null)
            {
                room.Status = RoomStatus.Available;
                await _roomRepository.UpdateAsync(room);
            }
        }

        await _taskRepository.UpdateAsync(task);
        await _taskRepository.SaveChangesAsync();

        var rooms = await _roomRepository.GetAllAsync();
        var staff = await _staffRepository.GetAllAsync();
        return MapToDto(task, rooms, staff);
    }

    public async Task<HousekeepingTaskDto> AssignStaffAsync(Guid taskId, Guid staffId)
    {
        var task = await _taskRepository.GetByIdAsync(taskId)
            ?? throw new InvalidOperationException("Görev bulunamadı.");

        var staffMember = await _staffRepository.GetByIdAsync(staffId)
            ?? throw new InvalidOperationException("Personel bulunamadı.");

        task.AssignedToId = staffId;
        await _taskRepository.UpdateAsync(task);
        await _taskRepository.SaveChangesAsync();

        var rooms = await _roomRepository.GetAllAsync();
        var staff = await _staffRepository.GetAllAsync();
        return MapToDto(task, rooms, staff);
    }

    public async Task<HousekeepingSummaryDto> GetTodaysSummaryAsync()
    {
        var today = DateTime.UtcNow.Date;
        var tasks = (await _taskRepository.GetAllAsync())
            .Where(t => t.ScheduledDate.Date == today)
            .ToList();

        return new HousekeepingSummaryDto
        {
            Pending = tasks.Count(t => t.Status == HousekeepingStatus.Pending),
            InProgress = tasks.Count(t => t.Status == HousekeepingStatus.InProgress),
            Completed = tasks.Count(t => t.Status == HousekeepingStatus.Completed),
            Skipped = tasks.Count(t => t.Status == HousekeepingStatus.Skipped),
            Total = tasks.Count
        };
    }

    private HousekeepingTaskDto MapToDto(HousekeepingTask t, IEnumerable<Room> rooms, IEnumerable<Staff> staff)
    {
        var room = rooms.FirstOrDefault(r => r.Id == t.RoomId);
        var assignee = t.AssignedToId.HasValue ? staff.FirstOrDefault(s => s.Id == t.AssignedToId.Value) : null;
        return new HousekeepingTaskDto
        {
            Id = t.Id,
            RoomId = t.RoomId,
            RoomNumber = room?.Number ?? "",
            TaskType = t.TaskType.ToString(),
            Status = t.Status.ToString(),
            Priority = t.Priority,
            AssignedToId = t.AssignedToId,
            AssignedToName = assignee != null ? $"{assignee.FirstName} {assignee.LastName}" : null,
            Notes = t.Notes,
            ScheduledDate = t.ScheduledDate,
            StartedAt = t.StartedAt,
            CompletedAt = t.CompletedAt,
            CreatedAt = t.CreatedAt
        };
    }
}
