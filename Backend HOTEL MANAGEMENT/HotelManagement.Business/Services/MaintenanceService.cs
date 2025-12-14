using HotelManagement.Business.DTOs;
using HotelManagement.Business.Interfaces;
using HotelManagement.Core.Entities;
using HotelManagement.Core.Interfaces;
using HotelManagement.Core.Enums;

namespace HotelManagement.Business.Services;

public class MaintenanceService : IMaintenanceService
{
    private readonly IGenericRepository<MaintenanceRequest> _repository;

    public MaintenanceService(IGenericRepository<MaintenanceRequest> repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<MaintenanceRequestDto>> GetAllRequestsAsync()
    {
        var requests = await _repository.GetAllAsync();
        return requests.Select(MapToDto);
    }

    public async Task<MaintenanceRequestDto?> GetRequestByIdAsync(Guid id)
    {
        var request = await _repository.GetByIdAsync(id);
        if (request == null) return null;
        return MapToDto(request);
    }

    public async Task<MaintenanceRequestDto> CreateRequestAsync(CreateMaintenanceRequestDto dto)
    {
        var request = new MaintenanceRequest
        {
            Id = Guid.NewGuid(),
            RoomId = dto.RoomId,
            Title = dto.Title,
            Description = dto.Description,
            Priority = dto.Priority,
            ReportedBy = dto.ReportedBy,
            Status = MaintenanceStatus.Pending,
            AssignedToId = dto.AssignedTo,
            CreatedAt = DateTime.UtcNow
        };

        await _repository.AddAsync(request);
        await _repository.SaveChangesAsync();

        return MapToDto(request);
    }

    public async Task UpdateRequestAsync(MaintenanceRequestDto dto)
    {
        var request = await _repository.GetByIdAsync(dto.Id);
        if (request == null) throw new KeyNotFoundException($"MaintenanceRequest {dto.Id} not found");

        // Simple update logic
        // Normalize logic: remove hyphens, case-insensitive
        var statusStr = dto.Status.Replace("-", "");
        if (Enum.TryParse<MaintenanceStatus>(statusStr, true, out var status))
        {
            request.Status = status;
        }
        
        request.AssignedToId = dto.AssignedTo;

        await _repository.UpdateAsync(request);
        await _repository.SaveChangesAsync();
    }

    public async Task DeleteRequestAsync(Guid id)
    {
        var request = await _repository.GetByIdAsync(id);
        if (request == null) throw new KeyNotFoundException($"MaintenanceRequest {id} not found");

        await _repository.DeleteAsync(request);
        await _repository.SaveChangesAsync();
    }

    private static MaintenanceRequestDto MapToDto(MaintenanceRequest m)
    {
        return new MaintenanceRequestDto
        {
            Id = m.Id,
            RoomId = m.RoomId,
            Title = m.Title,
            Description = m.Description,
            Priority = m.Priority.ToString().ToLower(),
            Status = m.Status == MaintenanceStatus.InProgress ? "in-progress" : m.Status.ToString().ToLower(),
            ReportedBy = m.ReportedBy,
            AssignedTo = m.AssignedToId,
            CreatedAt = m.CreatedAt
        };
    }
}
