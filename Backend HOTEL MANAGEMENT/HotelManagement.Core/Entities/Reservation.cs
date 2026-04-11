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

    // Kept for backward compatibility, always equals TotalAmount
    public decimal TotalPrice { get; set; }

    // Payment tracking
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public bool IsPaid { get; set; }
    public DateTime? PaymentDate { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;

    public ReservationStatus Status { get; set; }

    public string SpecialRequests { get; set; } = string.Empty;

    // Cancellation
    public string? CancellationReason { get; set; }
    public DateTime? CancelledAt { get; set; }

    // Force checkout audit
    public bool IsForceCheckout { get; set; }
    public string? ForceCheckoutReason { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Email tracking
    public bool ConfirmationEmailSent { get; set; } = false;
    public DateTime? ConfirmationEmailSentAt { get; set; }
    public bool ReminderEmailSent { get; set; } = false;
    public DateTime? ReminderEmailSentAt { get; set; }

    // All guests in this reservation
    public ICollection<Guest> Guests { get; set; } = new List<Guest>();

    // --- State Machine: Valid reservation status transitions ---
    private static readonly Dictionary<ReservationStatus, ReservationStatus[]> _validTransitions = new()
    {
        { ReservationStatus.Pending, new[] { ReservationStatus.Confirmed, ReservationStatus.Cancelled } },
        { ReservationStatus.Confirmed, new[] { ReservationStatus.CheckedIn, ReservationStatus.Cancelled } },
        { ReservationStatus.CheckedIn, new[] { ReservationStatus.CheckedOut } },
        { ReservationStatus.CheckedOut, Array.Empty<ReservationStatus>() },
        { ReservationStatus.Cancelled, Array.Empty<ReservationStatus>() }
    };

    public bool CanTransitionTo(ReservationStatus newStatus)
    {
        return _validTransitions.TryGetValue(Status, out var allowed) && allowed.Contains(newStatus);
    }

    public void TransitionTo(ReservationStatus newStatus)
    {
        if (!CanTransitionTo(newStatus))
            throw new InvalidOperationException(
                $"Rezervasyon durumu '{Status}' -> '{newStatus}' geçişi geçersiz.");
        Status = newStatus;
        UpdatedAt = DateTime.UtcNow;
    }
}
