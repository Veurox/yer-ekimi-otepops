namespace HotelManagement.Business.DTOs;

public class RoomServiceOrderDto
{
    public Guid Id { get; set; }
    public Guid RoomId { get; set; }
    public decimal TotalPrice { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime OrderedAt { get; set; }
    public List<RoomServiceOrderItemDto> Items { get; set; } = new();
}

public class RoomServiceOrderItemDto
{
    public Guid MenuItemId { get; set; }
    public int Quantity { get; set; }
    public string SpecialInstructions { get; set; } = string.Empty;
}

public class CreateRoomServiceOrderDto
{
    public Guid RoomId { get; set; }
    public List<RoomServiceOrderItemDto> Items { get; set; } = new();
}
