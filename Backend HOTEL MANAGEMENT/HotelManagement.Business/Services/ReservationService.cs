using HotelManagement.Business.DTOs;
using HotelManagement.Business.Interfaces;
using HotelManagement.Core.Entities;
using HotelManagement.Core.Interfaces;
using HotelManagement.Core.Enums;

namespace HotelManagement.Business.Services;

public class ReservationService : IReservationService
{
    private readonly IGenericRepository<Reservation> _repository;
    private readonly IGenericRepository<Room> _roomRepository;
    private readonly IGenericRepository<Guest> _guestRepository;

    public ReservationService(
        IGenericRepository<Reservation> repository,
        IGenericRepository<Room> roomRepository,
        IGenericRepository<Guest> guestRepository)
    {
        _repository = repository;
        _roomRepository = roomRepository;
        _guestRepository = guestRepository;
    }

    public async Task<IEnumerable<ReservationDto>> GetAllReservationsAsync()
    {
        var reservations = await _repository.GetAllAsync();
        var dtos = reservations.Select(MapToDto).ToList();

        // Enrich with Guest Data (Manual Join)
        var allGuests = await _guestRepository.GetAllAsync();
        foreach (var dto in dtos)
        {
            var primaryGuest = allGuests.FirstOrDefault(g => g.Id == dto.GuestId);
            if (primaryGuest != null)
            {
                dto.Guests.Add(new GuestDto
                {
                    Id = primaryGuest.Id,
                    Name = primaryGuest.Name,
                    Email = primaryGuest.Email,
                    Phone = primaryGuest.Phone,
                    IdNumber = primaryGuest.IdNumber,
                    Address = primaryGuest.Address,
                    IsPrimaryGuest = true
                });
            }
        }
        return dtos;
    }

    public async Task<ReservationDto?> GetReservationByIdAsync(Guid id)
    {
        var reservation = await _repository.GetByIdAsync(id);
        if (reservation == null) return null;
        
        var dto = MapToDto(reservation);
        
        // Enrich
        var guest = await _guestRepository.GetByIdAsync(reservation.GuestId);
        if (guest != null)
        {
            dto.Guests.Add(new GuestDto
            {
                 Id = guest.Id,
                 Name = guest.Name,
                 Email = guest.Email,
                 Phone = guest.Phone,
                 IdNumber = guest.IdNumber,
                 Address = guest.Address,
                 IsPrimaryGuest = true
            });
        }
        return dto;
    }

    public async Task<ReservationDto> CreateReservationAsync(CreateReservationDto dto)
    {
        // 1. Availability Check
        var conflictingReservations = await _repository.FindAsync(r => 
            r.RoomId == dto.RoomId &&
            r.Status != ReservationStatus.Cancelled && 
            r.Status != ReservationStatus.CheckedOut &&
            (r.CheckInDate < dto.CheckOutDate && r.CheckOutDate > dto.CheckInDate)
        );
        
        if (conflictingReservations.Any())
            throw new InvalidOperationException("Seçilen tarihlerde oda dolu (Mevcut rezervasyon var).");

        // 2. Find or Create Guest
        var guests = await _guestRepository.FindAsync(g => g.IdNumber == dto.PrimaryGuestIdNumber);
        var guest = guests.FirstOrDefault();

        if (guest == null)
        {
            guest = new Guest
            {
                Id = Guid.NewGuid(),
                Name = dto.PrimaryGuestName,
                IdNumber = dto.PrimaryGuestIdNumber,
                Email = dto.PrimaryGuestEmail,
                Phone = dto.PrimaryGuestPhone,
                Address = dto.PrimaryGuestAddress,
                IsPrimaryGuest = true,
                TotalSpent = 0,
                Visits = 0,
                IsActive = true
            };
            await _guestRepository.AddAsync(guest);
        }
        else 
        {
             guest.Phone = dto.PrimaryGuestPhone;
             guest.Email = dto.PrimaryGuestEmail;
             guest.Address = dto.PrimaryGuestAddress;
             await _guestRepository.UpdateAsync(guest);
        }

        // 3. Create Reservation
        var reservation = new Reservation
        {
            Id = Guid.NewGuid(),
            GuestId = guest.Id,
            RoomId = dto.RoomId,
            CheckInDate = DateTime.SpecifyKind(dto.CheckInDate, DateTimeKind.Utc),
            CheckOutDate = DateTime.SpecifyKind(dto.CheckOutDate, DateTimeKind.Utc),
            NumberOfGuests = dto.NumberOfGuests,
            TotalAmount = dto.TotalAmount,
            TotalPrice = dto.TotalAmount,
            PaidAmount = dto.PaidAmount ?? 0,
            IsPaid = (dto.PaidAmount ?? 0) >= dto.TotalAmount,
            PaymentMethod = dto.PaymentMethod,
            PaymentDate = (dto.PaidAmount ?? 0) > 0 ? DateTime.UtcNow : null,
            SpecialRequests = dto.SpecialRequests,
            Status = ReservationStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        guest.Visits++;
        guest.TotalSpent += reservation.TotalAmount;
        
        await _repository.AddAsync(reservation);
        await _repository.SaveChangesAsync(); // Saves guest changes too implicitly if tracked

        var resultDto = MapToDto(reservation);
        resultDto.Guests.Add(new GuestDto
        {
             Id = guest.Id,
             Name = guest.Name,
             Email = guest.Email,
             Phone = guest.Phone,
             IdNumber = guest.IdNumber,
             Address = guest.Address,
             IsPrimaryGuest = true
        });

        return resultDto;
    }

    public async Task UpdateReservationAsync(ReservationDto dto)
    {
        var reservation = await _repository.GetByIdAsync(dto.Id);
        if (reservation == null) throw new KeyNotFoundException($"Reservation {dto.Id} not found");

        reservation.CheckInDate = dto.CheckInDate;
        reservation.CheckOutDate = dto.CheckOutDate;
        reservation.NumberOfGuests = dto.NumberOfGuests;
        reservation.SpecialRequests = dto.SpecialRequests; // Ensure special requests are updated too

        // Payment Updates
        reservation.TotalAmount = dto.TotalAmount;
        reservation.PaidAmount = dto.PaidAmount;
        reservation.PaymentMethod = dto.PaymentMethod;
        
        // Auto-update IsPaid status based on amounts
        reservation.IsPaid = reservation.PaidAmount >= reservation.TotalAmount;
        if (reservation.IsPaid && reservation.PaymentDate == null)
        {
            reservation.PaymentDate = DateTime.UtcNow;
        }

        if (Enum.TryParse<ReservationStatus>(dto.Status, true, out var status))
        {
            reservation.Status = status;
        }

        await _repository.UpdateAsync(reservation);
        await _repository.SaveChangesAsync();
    }

    public async Task DeleteReservationAsync(Guid id)
    {
        var reservation = await _repository.GetByIdAsync(id);
        if (reservation == null) throw new KeyNotFoundException($"Reservation {id} not found");

        await _repository.DeleteAsync(reservation);
        await _repository.SaveChangesAsync();
    }

    private static ReservationDto MapToDto(Reservation r)
    {
        return new ReservationDto
        {
            Id = r.Id,
            GuestId = r.GuestId,
            RoomId = r.RoomId,
            CheckInDate = r.CheckInDate,
            CheckOutDate = r.CheckOutDate,
            ActualCheckOutDate = r.ActualCheckOutDate,
            NumberOfGuests = r.NumberOfGuests,
            TotalPrice = r.TotalPrice,
            TotalAmount = r.TotalAmount,
            PaidAmount = r.PaidAmount,
            IsPaid = r.IsPaid,
            PaymentDate = r.PaymentDate,
            PaymentMethod = r.PaymentMethod,
            Status = r.Status switch
            {
                ReservationStatus.CheckedIn => "checked-in",
                ReservationStatus.CheckedOut => "checked-out",
                _ => r.Status.ToString().ToLower()
            },
            SpecialRequests = r.SpecialRequests,
            CreatedAt = r.CreatedAt,
            UpdatedAt = r.UpdatedAt,
            Guests = new List<GuestDto>() // Populated in Service methods
        };
    }

    public async Task<ReservationDto> CheckInAsync(Guid reservationId)
    {
        var reservation = await _repository.GetByIdAsync(reservationId);
        if (reservation == null)
            throw new KeyNotFoundException($"Reservation {reservationId} not found");

        // Validation
        if (reservation.Status != ReservationStatus.Confirmed && reservation.Status != ReservationStatus.Pending)
            throw new InvalidOperationException($"Cannot check-in reservation with status: {reservation.Status}");

        if (reservation.CheckInDate.Date > DateTime.UtcNow.Date)
            throw new InvalidOperationException("Cannot check in before reservation date");

        // Update reservation
        reservation.Status = ReservationStatus.CheckedIn;
        reservation.UpdatedAt = DateTime.UtcNow;

        // Update room status to Occupied
        var room = await _roomRepository.GetByIdAsync(reservation.RoomId);
        if (room != null)
        {
            room.Status = RoomStatus.Occupied;
            await _roomRepository.UpdateAsync(room);
        }

        // Activate all guests in this reservation
        var allGuests = await _guestRepository.GetAllAsync();
        var reservationGuests = allGuests.Where(g => g.ReservationId == reservationId).ToList();
        foreach (var guest in reservationGuests)
        {
            guest.IsActive = true;
            await _guestRepository.UpdateAsync(guest);
        }

        await _repository.UpdateAsync(reservation);
        await _repository.SaveChangesAsync();
        await _roomRepository.SaveChangesAsync();
        await _guestRepository.SaveChangesAsync();

        return MapToDto(reservation);
    }

    public async Task<CheckOutResult> CheckOutAsync(Guid reservationId, bool forceCheckout = false)
    {
        var reservation = await _repository.GetByIdAsync(reservationId);
        if (reservation == null)
            throw new KeyNotFoundException($"Reservation {reservationId} not found");

        // Validation
        if (reservation.Status != ReservationStatus.CheckedIn)
            throw new InvalidOperationException($"Cannot check-out reservation with status: {reservation.Status}");

        // Payment validation
        if (!reservation.IsPaid && !forceCheckout)
        {
            var remaining = reservation.TotalAmount - reservation.PaidAmount;
            return new CheckOutResult
            {
                Success = false,
                Message = $"Payment incomplete. Remaining: {remaining:F2} TL",
                RequiresPayment = true,
                RemainingAmount = remaining
            };
        }

        // Update reservation
        reservation.ActualCheckOutDate = DateTime.UtcNow;
        reservation.Status = ReservationStatus.CheckedOut;
        reservation.UpdatedAt = DateTime.UtcNow;

        // Update room status to Cleaning
        var room = await _roomRepository.GetByIdAsync(reservation.RoomId);
        if (room != null)
        {
            room.Status = RoomStatus.Cleaning;
            await _roomRepository.UpdateAsync(room);
        }

        // Deactivate all guests (soft delete)
        var allGuests = await _guestRepository.GetAllAsync();
        var reservationGuests = allGuests.Where(g => g.ReservationId == reservationId).ToList();
        foreach (var guest in reservationGuests)
        {
            guest.IsActive = false;
            await _guestRepository.UpdateAsync(guest);
        }

        await _repository.UpdateAsync(reservation);
        await _repository.SaveChangesAsync();
        await _roomRepository.SaveChangesAsync();
        await _guestRepository.SaveChangesAsync();

        return new CheckOutResult
        {
            Success = true,
            Message = "Check-out completed successfully",
            RequiresPayment = false,
            RemainingAmount = 0
        };
    }
}
