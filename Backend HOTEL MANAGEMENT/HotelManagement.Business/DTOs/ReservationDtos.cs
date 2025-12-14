using HotelManagement.Core.Enums;

namespace HotelManagement.Business.DTOs;

public class ReservationDto
{
    public Guid Id { get; set; }
    public Guid GuestId { get; set; }
    public Guid RoomId { get; set; }
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
    
    public string Status { get; set; } = string.Empty;
    public string SpecialRequests { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    
    // All guests in reservation
    public List<GuestDto> Guests { get; set; } = new();
}

public class CreateReservationDto
{
    public Guid RoomId { get; set; }
    public DateTime CheckInDate { get; set; }
    public DateTime CheckOutDate { get; set; }
    public int NumberOfGuests { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal? PaidAmount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string SpecialRequests { get; set; } = string.Empty;
    
    // Primary guest info
    public string PrimaryGuestName { get; set; } = string.Empty;
    public string PrimaryGuestEmail { get; set; } = string.Empty;
    public string PrimaryGuestPhone { get; set; } = string.Empty;
    public string PrimaryGuestIdNumber { get; set; } = string.Empty;
    public string PrimaryGuestAddress { get; set; } = string.Empty;
    
    // Additional guests
    public List<AdditionalGuestDto> AdditionalGuests { get; set; } = new();
}

public class AdditionalGuestDto
{
    public string Name { get; set; } = string.Empty;
    public string IdNumber { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
}

public class CheckOutResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public bool RequiresPayment { get; set; }
    public decimal RemainingAmount { get; set; }
}
