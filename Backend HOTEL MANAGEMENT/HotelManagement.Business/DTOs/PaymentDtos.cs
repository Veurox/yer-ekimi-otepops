namespace HotelManagement.Business.DTOs;

public class PaymentDto
{
    public Guid Id { get; set; }
    public Guid ReservationId { get; set; }
    public Guid GuestId { get; set; }
    public string GuestName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "TRY";
    public string Method { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string? ReferenceNumber { get; set; }
    public string? Notes { get; set; }
    public DateTime PaidAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreatePaymentDto
{
    public Guid ReservationId { get; set; }
    public decimal Amount { get; set; }
    public string Method { get; set; } = string.Empty;
    public string Type { get; set; } = "Reservation";
    public string? ReferenceNumber { get; set; }
    public string? Notes { get; set; }
}

public class ReservationPaymentSummaryDto
{
    public Guid ReservationId { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal RemainingAmount { get; set; }
    public bool IsPaid { get; set; }
    public List<PaymentDto> Payments { get; set; } = new();
}
