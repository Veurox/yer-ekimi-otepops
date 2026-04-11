using HotelManagement.Business.DTOs;

namespace HotelManagement.Business.Interfaces;

public interface IHousekeepingService
{
    Task<IEnumerable<HousekeepingTaskDto>> GetTasksAsync(DateTime? date = null, Guid? roomId = null, Guid? assignedToId = null, string? status = null);
    Task<HousekeepingTaskDto> CreateTaskAsync(CreateHousekeepingTaskDto dto);
    Task<HousekeepingTaskDto> UpdateStatusAsync(Guid taskId, string newStatus);
    Task<HousekeepingTaskDto> AssignStaffAsync(Guid taskId, Guid staffId);
    Task<HousekeepingSummaryDto> GetTodaysSummaryAsync();
}
