using HotelManagement.Core.Enums;

namespace HotelManagement.Business.DTOs;

public class RoomDto
{
    public Guid Id { get; set; }
    public string Number { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Status { get; set; } = string.Empty;
    public int Floor { get; set; }
    public int Capacity { get; set; }
    public List<string> Features { get; set; } = new();
}

public class CreateRoomDto
{
    public string Number { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Floor { get; set; }
    public int Capacity { get; set; }
    public List<string> Features { get; set; } = new();
}

public class UpdateRoomDto
{
    public Guid Id { get; set; }
    public string Number { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Status { get; set; } = string.Empty;
    public int Floor { get; set; }
    public int Capacity { get; set; }
    public List<string> Features { get; set; } = new();
}
