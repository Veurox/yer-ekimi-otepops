using HotelManagement.Core.Enums;
using HotelManagement.Core.Interfaces;

namespace HotelManagement.Core.Entities;

public class Room : IEntity
{
    public Guid Id { get; set; }

    public string Number { get; set; } = string.Empty;
    
    public RoomType Type { get; set; }
    
    public decimal Price { get; set; }
    
    public RoomStatus Status { get; set; }
    
    public int Floor { get; set; }
    
    public int Capacity { get; set; }
    
    public List<string> Features { get; set; } = new();
    
    public Guid? CurrentGuestId { get; set; }
}
