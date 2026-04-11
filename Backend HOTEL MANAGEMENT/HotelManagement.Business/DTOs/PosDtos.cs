using HotelManagement.Core.Enums;

namespace HotelManagement.Business.DTOs;

public class PosTransactionDto
{
    public Guid Id { get; set; }
    public Guid ReservationId { get; set; }
    public Guid GuestId { get; set; }
    public Guid RoomId { get; set; }
    public string RoomNumber { get; set; } = string.Empty;
    public string GuestName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? ChargedAt { get; set; }
    public Guid? PaymentId { get; set; }
}

public class CreatePosTransactionDto
{
    public Guid ReservationId { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public PosCategory Category { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
}

public class RoomChargesSummaryDto
{
    public Guid ReservationId { get; set; }
    public string GuestName { get; set; } = string.Empty;
    public string RoomNumber { get; set; } = string.Empty;
    public List<PosTransactionDto> Charges { get; set; } = new();
    public decimal TotalCharges { get; set; }
    public decimal ReservationAmount { get; set; }
    public decimal GrandTotal { get; set; }
}
