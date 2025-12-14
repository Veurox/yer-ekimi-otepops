using HotelManagement.Core.Interfaces;

namespace HotelManagement.Core.Entities;

public class MenuItem : IEntity
{
    public Guid Id { get; set; }
    
    public string Name { get; set; } = string.Empty;
    
    public string Category { get; set; } = string.Empty;
    
    public decimal Price { get; set; }
    
    public string Description { get; set; } = string.Empty;
    
    public bool Available { get; set; }
    
    public string Image { get; set; } = string.Empty;
}
