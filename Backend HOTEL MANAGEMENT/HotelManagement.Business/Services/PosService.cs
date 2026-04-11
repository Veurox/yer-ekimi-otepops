using HotelManagement.Business.DTOs;
using HotelManagement.Business.Interfaces;
using HotelManagement.Core.Entities;
using HotelManagement.Core.Enums;
using HotelManagement.Core.Interfaces;

namespace HotelManagement.Business.Services;

public class PosService : IPosService
{
    private readonly IGenericRepository<PosTransaction> _posRepository;
    private readonly IGenericRepository<Reservation> _reservationRepository;
    private readonly IGenericRepository<Guest> _guestRepository;
    private readonly IGenericRepository<Room> _roomRepository;
    private readonly IGenericRepository<Payment> _paymentRepository;

    public PosService(
        IGenericRepository<PosTransaction> posRepository,
        IGenericRepository<Reservation> reservationRepository,
        IGenericRepository<Guest> guestRepository,
        IGenericRepository<Room> roomRepository,
        IGenericRepository<Payment> paymentRepository)
    {
        _posRepository = posRepository;
        _reservationRepository = reservationRepository;
        _guestRepository = guestRepository;
        _roomRepository = roomRepository;
        _paymentRepository = paymentRepository;
    }

    public async Task<IEnumerable<PosTransactionDto>> GetTransactionsAsync(Guid? reservationId = null)
    {
        var all = await _posRepository.GetAllAsync();
        if (reservationId.HasValue)
            all = all.Where(t => t.ReservationId == reservationId.Value);

        var rooms = await _roomRepository.GetAllAsync();
        var guests = await _guestRepository.GetAllAsync();

        return all.OrderByDescending(t => t.CreatedAt)
                  .Select(t => MapToDto(t, rooms, guests));
    }

    public async Task<PosTransactionDto> CreateTransactionAsync(CreatePosTransactionDto dto)
    {
        var reservation = await _reservationRepository.GetByIdAsync(dto.ReservationId)
            ?? throw new InvalidOperationException("Rezervasyon bulunamadı.");

        if (reservation.Status != ReservationStatus.CheckedIn && reservation.Status != ReservationStatus.Confirmed)
            throw new InvalidOperationException("Sadece aktif rezervasyonlara POS satışı eklenebilir.");

        var transaction = new PosTransaction
        {
            Id = Guid.NewGuid(),
            ReservationId = dto.ReservationId,
            GuestId = reservation.GuestId,
            RoomId = reservation.RoomId,
            Description = dto.Description,
            Amount = dto.Amount,
            Category = dto.Category,
            Status = PosStatus.Pending,
            CreatedBy = dto.CreatedBy,
            CreatedAt = DateTime.UtcNow
        };

        await _posRepository.AddAsync(transaction);
        await _posRepository.SaveChangesAsync();

        var rooms = await _roomRepository.GetAllAsync();
        var guests = await _guestRepository.GetAllAsync();
        return MapToDto(transaction, rooms, guests);
    }

    public async Task<PosTransactionDto> ChargeToRoomAsync(Guid transactionId)
    {
        var transaction = await _posRepository.GetByIdAsync(transactionId)
            ?? throw new InvalidOperationException("İşlem bulunamadı.");

        if (transaction.Status != PosStatus.Pending)
            throw new InvalidOperationException("Sadece bekleyen işlemler oda hesabına eklenebilir.");

        var reservation = await _reservationRepository.GetByIdAsync(transaction.ReservationId)
            ?? throw new InvalidOperationException("Rezervasyon bulunamadı.");

        // Create payment record
        var paymentType = transaction.Category == PosCategory.Bar ? PaymentType.BarCharge : PaymentType.RestaurantCharge;
        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            ReservationId = transaction.ReservationId,
            GuestId = transaction.GuestId,
            Amount = transaction.Amount,
            Method = PaymentMethod.RoomCharge,
            Type = paymentType,
            Status = PaymentStatus.Completed,
            Notes = $"POS: {transaction.Description} ({transaction.Category})",
            PaidAt = DateTime.UtcNow
        };

        await _paymentRepository.AddAsync(payment);

        // Update reservation total
        reservation.TotalAmount += transaction.Amount;
        await _reservationRepository.UpdateAsync(reservation);

        // Update transaction status
        transaction.Status = PosStatus.ChargedToRoom;
        transaction.ChargedAt = DateTime.UtcNow;
        transaction.PaymentId = payment.Id;
        await _posRepository.UpdateAsync(transaction);
        await _posRepository.SaveChangesAsync();

        var rooms = await _roomRepository.GetAllAsync();
        var guests = await _guestRepository.GetAllAsync();
        return MapToDto(transaction, rooms, guests);
    }

    public async Task<RoomChargesSummaryDto> GetRoomChargesAsync(Guid reservationId)
    {
        var reservation = await _reservationRepository.GetByIdAsync(reservationId)
            ?? throw new InvalidOperationException("Rezervasyon bulunamadı.");

        var transactions = await _posRepository.FindAsync(t => t.ReservationId == reservationId);
        var rooms = await _roomRepository.GetAllAsync();
        var guests = await _guestRepository.GetAllAsync();

        var room = rooms.FirstOrDefault(r => r.Id == reservation.RoomId);
        var guest = guests.FirstOrDefault(g => g.Id == reservation.GuestId);
        var chargedTransactions = transactions.Where(t => t.Status == PosStatus.ChargedToRoom).ToList();
        var totalCharges = chargedTransactions.Sum(t => t.Amount);

        return new RoomChargesSummaryDto
        {
            ReservationId = reservationId,
            GuestName = guest?.Name ?? "",
            RoomNumber = room?.Number ?? "",
            Charges = transactions.Select(t => MapToDto(t, rooms, guests)).ToList(),
            TotalCharges = totalCharges,
            ReservationAmount = reservation.TotalAmount - totalCharges,
            GrandTotal = reservation.TotalAmount
        };
    }

    public async Task<PosTransactionDto?> CancelTransactionAsync(Guid transactionId)
    {
        var transaction = await _posRepository.GetByIdAsync(transactionId);
        if (transaction == null) return null;
        if (transaction.Status == PosStatus.ChargedToRoom)
            throw new InvalidOperationException("Oda hesabına eklenmiş işlem iptal edilemez.");

        transaction.Status = PosStatus.Cancelled;
        await _posRepository.UpdateAsync(transaction);
        await _posRepository.SaveChangesAsync();

        var rooms = await _roomRepository.GetAllAsync();
        var guests = await _guestRepository.GetAllAsync();
        return MapToDto(transaction, rooms, guests);
    }

    private PosTransactionDto MapToDto(PosTransaction t, IEnumerable<Room> rooms, IEnumerable<Guest> guests)
    {
        var room = rooms.FirstOrDefault(r => r.Id == t.RoomId);
        var guest = guests.FirstOrDefault(g => g.Id == t.GuestId);
        return new PosTransactionDto
        {
            Id = t.Id,
            ReservationId = t.ReservationId,
            GuestId = t.GuestId,
            RoomId = t.RoomId,
            RoomNumber = room?.Number ?? "",
            GuestName = guest?.Name ?? "",
            Description = t.Description,
            Amount = t.Amount,
            Category = t.Category.ToString(),
            Status = t.Status.ToString(),
            CreatedBy = t.CreatedBy,
            CreatedAt = t.CreatedAt,
            ChargedAt = t.ChargedAt,
            PaymentId = t.PaymentId
        };
    }
}
