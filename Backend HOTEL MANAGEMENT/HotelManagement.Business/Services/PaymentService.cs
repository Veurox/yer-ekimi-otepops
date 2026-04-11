using HotelManagement.Business.DTOs;
using HotelManagement.Business.Interfaces;
using HotelManagement.Core.Entities;
using HotelManagement.Core.Enums;
using HotelManagement.Core.Interfaces;

namespace HotelManagement.Business.Services;

public class PaymentService : IPaymentService
{
    private readonly IGenericRepository<Payment> _paymentRepository;
    private readonly IGenericRepository<Reservation> _reservationRepository;
    private readonly IGenericRepository<Guest> _guestRepository;

    public PaymentService(
        IGenericRepository<Payment> paymentRepository,
        IGenericRepository<Reservation> reservationRepository,
        IGenericRepository<Guest> guestRepository)
    {
        _paymentRepository = paymentRepository;
        _reservationRepository = reservationRepository;
        _guestRepository = guestRepository;
    }

    public async Task<IEnumerable<PaymentDto>> GetPaymentsByReservationAsync(Guid reservationId)
    {
        var payments = await _paymentRepository.FindAsync(p => p.ReservationId == reservationId);
        var guests = await _guestRepository.GetAllAsync();

        return payments
            .OrderByDescending(p => p.PaidAt)
            .Select(p => MapToDto(p, guests.FirstOrDefault(g => g.Id == p.GuestId)?.Name ?? ""));
    }

    public async Task<ReservationPaymentSummaryDto> GetPaymentSummaryAsync(Guid reservationId)
    {
        var reservation = await _reservationRepository.GetByIdAsync(reservationId);
        var payments = await _paymentRepository.FindAsync(p => p.ReservationId == reservationId);
        var guests = await _guestRepository.GetAllAsync();

        var completedPayments = payments.Where(p => p.Status != PaymentStatus.Refunded && p.Status != PaymentStatus.Failed).ToList();
        var paidAmount = completedPayments.Where(p => p.Type != PaymentType.Refund).Sum(p => p.Amount)
                       - completedPayments.Where(p => p.Type == PaymentType.Refund).Sum(p => p.Amount);

        return new ReservationPaymentSummaryDto
        {
            ReservationId = reservationId,
            TotalAmount = reservation.TotalAmount,
            PaidAmount = paidAmount,
            RemainingAmount = Math.Max(0, reservation.TotalAmount - paidAmount),
            IsPaid = paidAmount >= reservation.TotalAmount,
            Payments = payments
                .OrderByDescending(p => p.PaidAt)
                .Select(p => MapToDto(p, guests.FirstOrDefault(g => g.Id == p.GuestId)?.Name ?? ""))
                .ToList()
        };
    }

    public async Task<PaymentDto> AddPaymentAsync(CreatePaymentDto dto)
    {
        var reservation = await _reservationRepository.GetByIdAsync(dto.ReservationId);
        if (reservation == null)
            throw new KeyNotFoundException($"Reservation {dto.ReservationId} not found");

        if (dto.Amount <= 0)
            throw new InvalidOperationException("Odeme tutari sifirdan buyuk olmali.");

        if (!Enum.TryParse<PaymentMethod>(NormalizeMethodString(dto.Method), true, out var method))
            method = PaymentMethod.Cash;

        if (!Enum.TryParse<PaymentType>(dto.Type, true, out var type))
            type = PaymentType.Reservation;

        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            ReservationId = dto.ReservationId,
            GuestId = reservation.GuestId,
            Amount = dto.Amount,
            Method = method,
            Status = PaymentStatus.Completed,
            Type = type,
            ReferenceNumber = dto.ReferenceNumber,
            Notes = dto.Notes,
            PaidAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        await _paymentRepository.AddAsync(payment);

        // Update reservation paid amount
        var existingPayments = await _paymentRepository.FindAsync(p => p.ReservationId == dto.ReservationId && p.Status == PaymentStatus.Completed);
        var totalPaid = existingPayments.Where(p => p.Type != PaymentType.Refund).Sum(p => p.Amount) + dto.Amount;
        reservation.PaidAmount = totalPaid;
        reservation.IsPaid = totalPaid >= reservation.TotalAmount;
        if (reservation.IsPaid && reservation.PaymentDate == null)
            reservation.PaymentDate = DateTime.UtcNow;
        reservation.UpdatedAt = DateTime.UtcNow;

        await _reservationRepository.UpdateAsync(reservation);
        await _paymentRepository.SaveChangesAsync();

        var guest = await _guestRepository.GetByIdAsync(payment.GuestId);
        return MapToDto(payment, guest?.Name ?? "");
    }

    public async Task<PaymentDto> RefundPaymentAsync(Guid paymentId, string? reason = null)
    {
        var original = await _paymentRepository.GetByIdAsync(paymentId);
        if (original == null)
            throw new KeyNotFoundException($"Payment {paymentId} not found");

        if (original.Status == PaymentStatus.Refunded)
            throw new InvalidOperationException("Bu odeme zaten iade edilmis.");

        // Mark original as refunded
        original.Status = PaymentStatus.Refunded;
        await _paymentRepository.UpdateAsync(original);

        // Create refund record
        var refund = new Payment
        {
            Id = Guid.NewGuid(),
            ReservationId = original.ReservationId,
            GuestId = original.GuestId,
            Amount = original.Amount,
            Method = original.Method,
            Status = PaymentStatus.Completed,
            Type = PaymentType.Refund,
            Notes = reason ?? $"Iade: {original.Id}",
            PaidAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        await _paymentRepository.AddAsync(refund);

        // Update reservation paid amount
        var reservation = await _reservationRepository.GetByIdAsync(original.ReservationId);
        var allPayments = await _paymentRepository.FindAsync(p => p.ReservationId == original.ReservationId && p.Status == PaymentStatus.Completed);
        var totalPaid = allPayments.Where(p => p.Type != PaymentType.Refund).Sum(p => p.Amount)
                      - allPayments.Where(p => p.Type == PaymentType.Refund).Sum(p => p.Amount)
                      - original.Amount;
        reservation.PaidAmount = Math.Max(0, totalPaid);
        reservation.IsPaid = reservation.PaidAmount >= reservation.TotalAmount;
        reservation.UpdatedAt = DateTime.UtcNow;

        await _reservationRepository.UpdateAsync(reservation);
        await _paymentRepository.SaveChangesAsync();

        var guest = await _guestRepository.GetByIdAsync(refund.GuestId);
        return MapToDto(refund, guest?.Name ?? "");
    }

    private static PaymentDto MapToDto(Payment p, string guestName) => new()
    {
        Id = p.Id,
        ReservationId = p.ReservationId,
        GuestId = p.GuestId,
        GuestName = guestName,
        Amount = p.Amount,
        Currency = p.Currency,
        Method = p.Method.ToString(),
        Status = p.Status.ToString(),
        Type = p.Type.ToString(),
        ReferenceNumber = p.ReferenceNumber,
        Notes = p.Notes,
        PaidAt = p.PaidAt,
        CreatedAt = p.CreatedAt
    };

    private static string NormalizeMethodString(string method) => method.Trim().ToLower() switch
    {
        "cash" or "nakit" => "Cash",
        "creditcard" or "credit card" or "kredi karti" or "kredi kartı" => "CreditCard",
        "debitcard" or "debit card" or "banka karti" or "banka kartı" => "DebitCard",
        "transfer" or "havale" or "eft" or "banktransfer" or "bank transfer" => "BankTransfer",
        "online" => "Online",
        _ => method.Trim()
    };
}
