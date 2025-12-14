using HotelManagement.Business.DTOs;
using HotelManagement.Business.Interfaces;
using HotelManagement.Core.Entities;
using HotelManagement.Core.Interfaces;

namespace HotelManagement.Business.Services;

public class MenuService : IMenuService
{
    private readonly IGenericRepository<MenuItem> _repository;

    public MenuService(IGenericRepository<MenuItem> repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<MenuItemDto>> GetAllMenuItemsAsync()
    {
        var items = await _repository.GetAllAsync();
        return items.Select(MapToDto);
    }

    public async Task<MenuItemDto?> GetMenuItemByIdAsync(Guid id)
    {
        var item = await _repository.GetByIdAsync(id);
        if (item == null) return null;
        return MapToDto(item);
    }

    public async Task<MenuItemDto> CreateMenuItemAsync(CreateMenuItemDto dto)
    {
        var item = new MenuItem
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Category = dto.Category,
            Price = dto.Price,
            Description = dto.Description,
            Available = dto.Available,
            Image = dto.Image
        };

        await _repository.AddAsync(item);
        await _repository.SaveChangesAsync();

        return MapToDto(item);
    }

    public async Task UpdateMenuItemAsync(MenuItemDto dto)
    {
        var item = await _repository.GetByIdAsync(dto.Id);
        if (item == null) throw new KeyNotFoundException($"MenuItem {dto.Id} not found");

        item.Name = dto.Name;
        item.Category = dto.Category;
        item.Price = dto.Price;
        item.Description = dto.Description;
        item.Available = dto.Available;

        await _repository.UpdateAsync(item);
        await _repository.SaveChangesAsync();
    }

    public async Task DeleteMenuItemAsync(Guid id)
    {
        var item = await _repository.GetByIdAsync(id);
        if (item == null) throw new KeyNotFoundException($"MenuItem {id} not found");

        await _repository.DeleteAsync(item);
        await _repository.SaveChangesAsync();
    }

    private static MenuItemDto MapToDto(MenuItem m)
    {
        return new MenuItemDto
        {
            Id = m.Id,
            Name = m.Name,
            Category = m.Category,
            Price = m.Price,
            Description = m.Description,
            Available = m.Available,
            Image = m.Image
        };
    }
}
