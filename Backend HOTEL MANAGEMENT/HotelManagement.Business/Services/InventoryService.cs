using HotelManagement.Business.DTOs;
using HotelManagement.Business.Interfaces;
using HotelManagement.Core.Entities;
using HotelManagement.Core.Interfaces;
using HotelManagement.Core.Enums;

namespace HotelManagement.Business.Services;

public class InventoryService : IInventoryService
{
    private readonly IGenericRepository<InventoryItem> _repository;

    public InventoryService(IGenericRepository<InventoryItem> repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<InventoryItemDto>> GetAllInventoryAsync()
    {
        var items = await _repository.GetAllAsync();
        return items.Select(MapToDto);
    }

    public async Task<InventoryItemDto?> GetInventoryByIdAsync(Guid id)
    {
        var item = await _repository.GetByIdAsync(id);
        if (item == null) return null;
        return MapToDto(item);
    }

    public async Task<InventoryItemDto> CreateInventoryAsync(CreateInventoryItemDto dto)
    {
        var item = new InventoryItem
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Category = dto.Category,
            Quantity = dto.Quantity,
            Unit = dto.Unit,
            MinQuantity = dto.MinQuantity,
            PricePerUnit = dto.PricePerUnit,
            Supplier = dto.Supplier,
            LastRestocked = DateTime.UtcNow
        };

        await _repository.AddAsync(item);
        await _repository.SaveChangesAsync();

        return MapToDto(item);
    }

    public async Task UpdateInventoryAsync(InventoryItemDto dto)
    {
        var item = await _repository.GetByIdAsync(dto.Id);
        if (item == null) throw new KeyNotFoundException($"InventoryItem {dto.Id} not found");

        item.Quantity = dto.Quantity;
        item.PricePerUnit = dto.PricePerUnit;
        // More fields...

        await _repository.UpdateAsync(item);
        await _repository.SaveChangesAsync();
    }

    public async Task DeleteInventoryAsync(Guid id)
    {
        var item = await _repository.GetByIdAsync(id);
        if (item == null) throw new KeyNotFoundException($"InventoryItem {id} not found");

        await _repository.DeleteAsync(item);
        await _repository.SaveChangesAsync();
    }

    private static InventoryItemDto MapToDto(InventoryItem i)
    {
        return new InventoryItemDto
        {
            Id = i.Id,
            Name = i.Name,
            Category = i.Category.ToString().ToLower(),
            Quantity = i.Quantity,
            Unit = i.Unit,
            PricePerUnit = i.PricePerUnit
        };
    }
}
