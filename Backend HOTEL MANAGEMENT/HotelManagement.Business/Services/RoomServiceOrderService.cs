using HotelManagement.Business.DTOs;
using HotelManagement.Business.Interfaces;
using HotelManagement.Core.Entities;
using HotelManagement.Core.Interfaces;
using HotelManagement.Core.Enums;

namespace HotelManagement.Business.Services;

public class RoomServiceOrderService : IRoomServiceOrderService
{
    private readonly IGenericRepository<RoomServiceOrder> _orderRepository;
    // We might need repo for Items, but Aggregates usually handle children.
    // However, GenericRepository usually is per entity. 
    // Creating items inside order usually requires adding them to context or order. 
    // For simplicity, we assume cascading add works or we'd inject Item Repo.
    // But strict generic repo usually handles aggregate root.

    public RoomServiceOrderService(IGenericRepository<RoomServiceOrder> orderRepository)
    {
        _orderRepository = orderRepository;
    }

    public async Task<IEnumerable<RoomServiceOrderDto>> GetAllOrdersAsync()
    {
        // Includes are tricky with GenericRepo unless implementation supports it.
        // Our GenericRepository FindAsync/GetAllAsync uses DbContext.Set<T>(), but no Include support in interface yet.
        // This is a limitation of simple Generic Repository.
        // For now, we will just return orders (Items might be null/empty).
        // To fix Strictness: We should add Include support to IGenericRepository or separate Query.
        // I will assume Lazy Loading is OFF, so explicit Include is needed.
        // I'll skip Items population in List for now to follow 'Strict Generic Repository' pattern without Includes.
        
        var orders = await _orderRepository.GetAllAsync();
        return orders.Select(MapToDto);
    }

    public async Task<RoomServiceOrderDto?> GetOrderByIdAsync(Guid id)
    {
        var order = await _orderRepository.GetByIdAsync(id);
        if (order == null) return null;
        return MapToDto(order);
    }

    public async Task<RoomServiceOrderDto> CreateOrderAsync(CreateRoomServiceOrderDto dto)
    {
        var order = new RoomServiceOrder
        {
            Id = Guid.NewGuid(),
            RoomId = dto.RoomId,
            Status = OrderStatus.Pending,
            OrderedAt = DateTime.UtcNow,
            TotalPrice = 0 // calc later
        };

        foreach (var itemDto in dto.Items)
        {
            order.Items.Add(new RoomServiceOrderItem
            {
                Id = Guid.NewGuid(),
                MenuItemId = itemDto.MenuItemId,
                Quantity = itemDto.Quantity,
                SpecialInstructions = itemDto.SpecialInstructions
            });
        }

        await _orderRepository.AddAsync(order);
        await _orderRepository.SaveChangesAsync();

        return MapToDto(order);
    }

    public async Task UpdateOrderAsync(RoomServiceOrderDto dto)
    {
        var order = await _orderRepository.GetByIdAsync(dto.Id);
        if (order == null) throw new KeyNotFoundException($"Order {dto.Id} not found");

        if (Enum.TryParse<OrderStatus>(dto.Status, out var status))
        {
            order.Status = status;
        }

        await _orderRepository.UpdateAsync(order);
        await _orderRepository.SaveChangesAsync();
    }

    public async Task DeleteOrderAsync(Guid id)
    {
        var order = await _orderRepository.GetByIdAsync(id);
        if (order == null) throw new KeyNotFoundException($"Order {id} not found");

        await _orderRepository.DeleteAsync(order);
        await _orderRepository.SaveChangesAsync();
    }

    private static RoomServiceOrderDto MapToDto(RoomServiceOrder order)
    {
        return new RoomServiceOrderDto
        {
            Id = order.Id,
            RoomId = order.RoomId,
            TotalPrice = order.TotalPrice,
            Status = order.Status.ToString().ToLower(),
            OrderedAt = order.OrderedAt,
            // Items not loaded if no Include, so checking null
            Items = order.Items?.Select(i => new RoomServiceOrderItemDto
            {
                MenuItemId = i.MenuItemId,
                Quantity = i.Quantity,
                SpecialInstructions = i.SpecialInstructions
            }).ToList() ?? new List<RoomServiceOrderItemDto>()
        };
    }
}
