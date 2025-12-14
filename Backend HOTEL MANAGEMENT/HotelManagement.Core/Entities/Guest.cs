using HotelManagement.Core.Interfaces;

namespace HotelManagement.Core.Entities;

public class Guest : IEntity
{
    public Guid Id { get; set; }
    
    public string Name { get; set; } = string.Empty;
    
    public string Email { get; set; } = string.Empty;
    
    public string Phone { get; set; } = string.Empty;
    
    public string IdNumber { get; set; } = string.Empty;
    
    public string Address { get; set; } = string.Empty;
    
    // Auth (for future guest portal)
    public string UserName { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    
    // Reservation relationship
    public Guid? ReservationId { get; set; }
    public Reservation? Reservation { get; set; }
    
    // Guest type
    public bool IsPrimaryGuest { get; set; }
    
    // Soft delete
    public bool IsActive { get; set; } = true;
    
    // Statistics
    public decimal TotalSpent { get; set; }
    public int Visits { get; set; }
}
