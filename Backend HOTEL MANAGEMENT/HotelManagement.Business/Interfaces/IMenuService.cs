using HotelManagement.Business.DTOs;

namespace HotelManagement.Business.Interfaces;

public interface IMenuService
{
    Task<IEnumerable<MenuItemDto>> GetAllMenuItemsAsync();
    Task<MenuItemDto?> GetMenuItemByIdAsync(Guid id);
    Task<MenuItemDto> CreateMenuItemAsync(CreateMenuItemDto dto);
    Task UpdateMenuItemAsync(MenuItemDto dto);
    Task DeleteMenuItemAsync(Guid id);
}
