using HotelManagement.Business.DTOs;

namespace HotelManagement.Business.Interfaces;

public interface IRoomServiceOrderService
{
    Task<IEnumerable<RoomServiceOrderDto>> GetAllOrdersAsync();
    Task<RoomServiceOrderDto?> GetOrderByIdAsync(Guid id);
    Task<RoomServiceOrderDto> CreateOrderAsync(CreateRoomServiceOrderDto dto);
    Task UpdateOrderAsync(RoomServiceOrderDto dto);
    Task DeleteOrderAsync(Guid id);
}
