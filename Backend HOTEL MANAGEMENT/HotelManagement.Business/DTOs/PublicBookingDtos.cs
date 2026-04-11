namespace HotelManagement.Business.DTOs;

public class AvailableRoomDto
{
    public Guid Id { get; set; }
    public string Number { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public int Floor { get; set; }
    public int Capacity { get; set; }
    public List<string> Features { get; set; } = new();
    public decimal BasePrice { get; set; }
    public decimal FinalPricePerNight { get; set; }
    public int NightCount { get; set; }
    public decimal TotalPrice { get; set; }
    public List<string> AppliedRules { get; set; } = new();
}

public class PublicReservationRequest
{
    public Guid RoomId { get; set; }
    public DateTime CheckInDate { get; set; }
    public DateTime CheckOutDate { get; set; }
    public int NumberOfGuests { get; set; }
    public string SpecialRequests { get; set; } = string.Empty;

    // Primary guest
    public string PrimaryGuestName { get; set; } = string.Empty;
    public string PrimaryGuestEmail { get; set; } = string.Empty;
    public string PrimaryGuestPhone { get; set; } = string.Empty;
    public string PrimaryGuestIdNumber { get; set; } = string.Empty;
    public string PrimaryGuestAddress { get; set; } = string.Empty;

    // Additional guests
    public List<AdditionalGuestDto> AdditionalGuests { get; set; } = new();
}

public class BookingConfirmationDto
{
    public Guid ReservationId { get; set; }
    public string RoomNumber { get; set; } = string.Empty;
    public string RoomType { get; set; } = string.Empty;
    public DateTime CheckInDate { get; set; }
    public DateTime CheckOutDate { get; set; }
    public int NightCount { get; set; }
    public decimal TotalAmount { get; set; }
    public string GuestName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}
