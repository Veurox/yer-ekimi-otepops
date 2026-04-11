namespace HotelManagement.Business.DTOs;

public class InvoiceDto
{
    public Guid Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public Guid ReservationId { get; set; }
    public Guid GuestId { get; set; }
    public string GuestName { get; set; } = string.Empty;
    public string? GuestEmail { get; set; }
    public string? BillingAddress { get; set; }

    // Room info
    public string RoomNumber { get; set; } = string.Empty;
    public DateTime CheckInDate { get; set; }
    public DateTime CheckOutDate { get; set; }
    public int NightCount { get; set; }

    // Amounts
    public decimal RoomCharges { get; set; }
    public decimal RoomServiceCharges { get; set; }
    public decimal OtherCharges { get; set; }
    public decimal Discount { get; set; }
    public decimal SubTotal { get; set; }
    public decimal TaxRate { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string Currency { get; set; } = "TRY";

    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime IssuedAt { get; set; }
    public DateTime? PaidAt { get; set; }
    public DateTime CreatedAt { get; set; }

    public List<InvoiceLineItemDto> LineItems { get; set; } = new();
}

public class InvoiceLineItemDto
{
    public Guid Id { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
    public DateTime ServiceDate { get; set; }
}

public class GenerateInvoiceDto
{
    public Guid ReservationId { get; set; }
    public decimal? Discount { get; set; }
    public string? Notes { get; set; }
    public string? BillingAddress { get; set; }
}
