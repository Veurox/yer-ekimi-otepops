using HotelManagement.Business.DTOs;

namespace HotelManagement.Business.Interfaces;

public interface IMaintenanceService
{
    Task<IEnumerable<MaintenanceRequestDto>> GetAllRequestsAsync();
    Task<MaintenanceRequestDto?> GetRequestByIdAsync(Guid id);
    Task<MaintenanceRequestDto> CreateRequestAsync(CreateMaintenanceRequestDto dto);
    Task UpdateRequestAsync(MaintenanceRequestDto dto);
    Task DeleteRequestAsync(Guid id);
}
