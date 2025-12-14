using HotelManagement.Core.Enums;

namespace HotelManagement.Business.DTOs;

public class InventoryItemDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal PricePerUnit { get; set; }
}

public class CreateInventoryItemDto
{
    public string Name { get; set; } = string.Empty;
    public InventoryCategory Category { get; set; }
    public int Quantity { get; set; }
    public string Unit { get; set; } = string.Empty;
    public int MinQuantity { get; set; }
    public decimal PricePerUnit { get; set; }
    public string Supplier { get; set; } = string.Empty;
}
