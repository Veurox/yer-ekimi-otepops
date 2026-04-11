namespace HotelManagement.Business.DTOs;

public class WalkInPayload
{
    public string RoomId { get; set; } = "";
    public string CheckOutDate { get; set; } = "";  // ISO date string
    public int NumberOfGuests { get; set; } = 1;
    public decimal PaidAmount { get; set; }
    public string PaymentMethod { get; set; } = "Cash";
    public string? SpecialRequests { get; set; }
    // Guest info
    public string GuestName { get; set; } = "";
    public string GuestPhone { get; set; } = "";
    public string GuestIdNumber { get; set; } = "";
    public string? GuestEmail { get; set; }
    public string? GuestAddress { get; set; }
}
