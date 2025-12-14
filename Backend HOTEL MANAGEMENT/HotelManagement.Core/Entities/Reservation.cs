using HotelManagement.Core.Enums;
using HotelManagement.Core.Interfaces;

namespace HotelManagement.Core.Entities;

public class Reservation : IEntity
{
    public Guid Id { get; set; }
    
    public Guid GuestId { get; set; }
    // Navigation property
    public Guest? Guest { get; set; }
    
    public Guid RoomId { get; set; }
    // Navigation property
    public Room? Room { get; set; }
    
    public DateTime CheckInDate { get; set; }
    
    public DateTime CheckOutDate { get; set; }
    
    public DateTime? ActualCheckOutDate { get; set; }
    
    public int NumberOfGuests { get; set; }
    
    public decimal TotalPrice { get; set; }
    
    // Payment tracking
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public bool IsPaid { get; set; }
    public DateTime? PaymentDate { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    
    public ReservationStatus Status { get; set; }
    
    public string SpecialRequests { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    
    // All guests in this reservation
    public ICollection<Guest> Guests { get; set; } = new List<Guest>();
}
