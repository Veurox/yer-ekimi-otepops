using HotelManagement.Core.Enums;
using HotelManagement.Core.Interfaces;

namespace HotelManagement.Core.Entities;

public class Payment : IEntity
{
    public Guid Id { get; set; }

    public Guid ReservationId { get; set; }
    public Reservation? Reservation { get; set; }

    public Guid GuestId { get; set; }
    public Guest? Guest { get; set; }

    public decimal Amount { get; set; }
    public string Currency { get; set; } = "TRY";

    public PaymentMethod Method { get; set; }
    public PaymentStatus Status { get; set; }
    public PaymentType Type { get; set; }

    /// <summary>Reference number from bank/POS</summary>
    public string? ReferenceNumber { get; set; }

    public string? Notes { get; set; }

    public DateTime PaidAt { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Staff who processed the payment</summary>
    public Guid? ProcessedByStaffId { get; set; }
}

public enum PaymentMethod
{
    Cash,
    CreditCard,
    DebitCard,
    BankTransfer,
    Online,
    RoomCharge
}
