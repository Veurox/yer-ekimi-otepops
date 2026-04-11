using HotelManagement.Core.Enums;
using HotelManagement.Core.Interfaces;

namespace HotelManagement.Core.Entities;

public class Invoice : IEntity
{
    public Guid Id { get; set; }

    /// <summary>Human-readable invoice number e.g. INV-2026-00042</summary>
    public string InvoiceNumber { get; set; } = string.Empty;

    public Guid ReservationId { get; set; }
    public Reservation? Reservation { get; set; }

    public Guid GuestId { get; set; }
    public Guest? Guest { get; set; }

    // Line items breakdown
    public decimal RoomCharges { get; set; }
    public decimal RoomServiceCharges { get; set; }
    public decimal OtherCharges { get; set; }
    public decimal Discount { get; set; }

    // Tax
    public decimal TaxRate { get; set; } = 0.10m;  // %10 KDV
    public decimal TaxAmount { get; set; }

    public decimal SubTotal { get; set; }
    public decimal TotalAmount { get; set; }

    public string Currency { get; set; } = "TRY";

    public InvoiceStatus Status { get; set; } = InvoiceStatus.Draft;

    public string? Notes { get; set; }
    public string? BillingAddress { get; set; }

    public DateTime IssuedAt { get; set; }
    public DateTime? PaidAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<InvoiceLineItem> LineItems { get; set; } = new List<InvoiceLineItem>();
}

public class InvoiceLineItem : IEntity
{
    public Guid Id { get; set; }

    public Guid InvoiceId { get; set; }
    public Invoice? Invoice { get; set; }

    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;  // Room, RoomService, Other
    public int Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
    public DateTime ServiceDate { get; set; }
}
