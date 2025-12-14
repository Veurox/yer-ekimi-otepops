namespace HotelManagement.Business.DTOs;

public class GuestDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string IdNumber { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string? ReservationId { get; set; }
    public bool IsPrimaryGuest { get; set; }
    public bool IsActive { get; set; }
    public int Visits { get; set; }
    public decimal TotalSpent { get; set; }
}

public class CreateGuestDto
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string IdNumber { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
}
