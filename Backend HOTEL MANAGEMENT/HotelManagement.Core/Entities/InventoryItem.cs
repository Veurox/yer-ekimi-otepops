using HotelManagement.Core.Enums;
using HotelManagement.Core.Interfaces;

namespace HotelManagement.Core.Entities;

public class InventoryItem : IEntity
{
    public Guid Id { get; set; }
    
    public string Name { get; set; } = string.Empty;
    
    public InventoryCategory Category { get; set; }
    
    public int Quantity { get; set; }
    
    public string Unit { get; set; } = string.Empty;
    
    public int MinQuantity { get; set; }
    
    public decimal PricePerUnit { get; set; }
    
    public string Supplier { get; set; } = string.Empty;
    
    public DateTime? LastRestocked { get; set; }
}
