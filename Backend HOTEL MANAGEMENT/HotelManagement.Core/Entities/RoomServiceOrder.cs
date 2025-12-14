using HotelManagement.Core.Enums;
using HotelManagement.Core.Interfaces;

namespace HotelManagement.Core.Entities;

public class RoomServiceOrder : IEntity
{
    public Guid Id { get; set; }
    
    public Guid RoomId { get; set; }
    public Room? Room { get; set; }
    
    public List<RoomServiceOrderItem> Items { get; set; } = new();
    
    public decimal TotalPrice { get; set; }
    
    public OrderStatus Status { get; set; }
    
    public DateTime OrderedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? DeliveredAt { get; set; }
}

public class RoomServiceOrderItem : IEntity
{
    public Guid Id { get; set; }
    
    public Guid RoomServiceOrderId { get; set; } // Foreign Key
    
    public Guid MenuItemId { get; set; }
    public MenuItem? MenuItem { get; set; }
    
    public int Quantity { get; set; }
    
    public string SpecialInstructions { get; set; } = string.Empty;
}
