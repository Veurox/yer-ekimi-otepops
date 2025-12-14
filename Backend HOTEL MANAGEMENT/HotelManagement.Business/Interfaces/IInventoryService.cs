using HotelManagement.Business.DTOs;

namespace HotelManagement.Business.Interfaces;

public interface IInventoryService
{
    Task<IEnumerable<InventoryItemDto>> GetAllInventoryAsync();
    Task<InventoryItemDto?> GetInventoryByIdAsync(Guid id);
    Task<InventoryItemDto> CreateInventoryAsync(CreateInventoryItemDto dto);
    Task UpdateInventoryAsync(InventoryItemDto dto);
    Task DeleteInventoryAsync(Guid id);
}
