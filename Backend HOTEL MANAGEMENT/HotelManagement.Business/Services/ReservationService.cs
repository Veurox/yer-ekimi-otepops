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
        // Note: For better performance with large data, this should be done via Include() in repository
        var allGuests = await _guestRepository.GetAllAsync();
        
        foreach (var dto in dtos)
        {
            var reservationGuests = allGuests.Where(g => g.ReservationId == dto.Id);
            foreach (var guest in reservationGuests)
            {
                 dto.Guests.Add(new GuestDto
                {
                    Id = guest.Id,
                    Name = guest.Name,
                    Email = guest.Email,
                    Phone = guest.Phone,
                    IdNumber = guest.IdNumber,
                    Address = guest.Address,
                    IsPrimaryGuest = guest.Id == dto.GuestId // Check against Primary Guest ID stored in Reservation
                });
            }
            
            // Fallback: If no guests found by ReservationId (legacy data), at least add the primary guest
            if (!dto.Guests.Any())
            {
                var primary = allGuests.FirstOrDefault(g => g.Id == dto.GuestId);
                if (primary != null)
                {
                    dto.Guests.Add(new GuestDto
                    {
                        Id = primary.Id,
                        Name = primary.Name,
                        Email = primary.Email,
                        Phone = primary.Phone,
                        IdNumber = primary.IdNumber,
                        Address = primary.Address,
                        IsPrimaryGuest = true
                    });
                }
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
        var allGuests = await _guestRepository.GetAllAsync(); // Or FindAsync(g => g.ReservationId == id) if repo supports it
        var reservationGuests = allGuests.Where(g => g.ReservationId == id);
        
        foreach (var guest in reservationGuests)
        {
             dto.Guests.Add(new GuestDto
            {
                Id = guest.Id,
                Name = guest.Name,
                Email = guest.Email,
                Phone = guest.Phone,
                IdNumber = guest.IdNumber,
                Address = guest.Address,
                IsPrimaryGuest = guest.Id == reservation.GuestId
            });
        }

        // Fallback for legacy
        if (!dto.Guests.Any())
        {
             var primary = allGuests.FirstOrDefault(g => g.Id == reservation.GuestId);
             if (primary != null)
             {
                dto.Guests.Add(new GuestDto
                {
                    Id = primary.Id,
                    Name = primary.Name,
                    Email = primary.Email,
                    Phone = primary.Phone,
                    IdNumber = primary.IdNumber,
                    Address = primary.Address,
                    IsPrimaryGuest = true
                });
             }
        }

        return dto;
    }

    public async Task<ReservationDto> CreateReservationAsync(CreateReservationDto dto)
    {
        // Ensure dates are UTC to satisfy Npgsql
        if (dto.CheckInDate.Kind == DateTimeKind.Unspecified)
            dto.CheckInDate = DateTime.SpecifyKind(dto.CheckInDate, DateTimeKind.Utc);
        
        if (dto.CheckOutDate.Kind == DateTimeKind.Unspecified)
            dto.CheckOutDate = DateTime.SpecifyKind(dto.CheckOutDate, DateTimeKind.Utc);

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

        // 3. Create Reservation Entity First (to get ID)
        var reservationId = Guid.NewGuid();
        var reservation = new Reservation
        {
            Id = reservationId,
            GuestId = guest.Id, // Primary Guest Link
            RoomId = dto.RoomId,
            CheckInDate = dto.CheckInDate, // Already ensuring UTC above
            CheckOutDate = dto.CheckOutDate, // Already ensuring UTC above
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

        // Link Primary Guest to Reservation
        guest.ReservationId = reservationId;
        guest.Visits++;
        guest.TotalSpent += reservation.TotalAmount; // Only primary guest tracks total spent for now
        
        // 4. Handle Additional Guests
        foreach (var extraGuestDto in dto.AdditionalGuests)
        {
            var extraGuestsList = await _guestRepository.FindAsync(g => g.IdNumber == extraGuestDto.IdNumber);
            var extraGuest = extraGuestsList.FirstOrDefault();

            if (extraGuest == null)
            {
                extraGuest = new Guest
                {
                    Id = Guid.NewGuid(),
                    Name = extraGuestDto.Name,
                    IdNumber = extraGuestDto.IdNumber,
                    Email = extraGuestDto.Email,
                    Phone = extraGuestDto.Phone,
                    Address = extraGuestDto.Address,
                    IsPrimaryGuest = false,
                    ReservationId = reservationId, // Link to this reservation
                    IsActive = true,
                    Visits = 1,
                    TotalSpent = 0
                };
                await _guestRepository.AddAsync(extraGuest);
            }
            else
            {
                // Update existing guest
                extraGuest.Phone = extraGuestDto.Phone;
                extraGuest.Email = extraGuestDto.Email;
                extraGuest.Address = extraGuestDto.Address;
                extraGuest.ReservationId = reservationId; // Link to this new reservation
                extraGuest.Visits++; // Increment visits
                await _guestRepository.UpdateAsync(extraGuest);
            }
        }

        await _repository.AddAsync(reservation);
        await _repository.SaveChangesAsync(); // Saves all guest changes as well due to EF tracking

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
        // Ensure dates are UTC
        if (dto.CheckInDate.Kind == DateTimeKind.Unspecified)
            dto.CheckInDate = DateTime.SpecifyKind(dto.CheckInDate, DateTimeKind.Utc);
        
        if (dto.CheckOutDate.Kind == DateTimeKind.Unspecified)
            dto.CheckOutDate = DateTime.SpecifyKind(dto.CheckOutDate, DateTimeKind.Utc);

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

        /* 
         * REMOVED: Do not deactivate guests on checkout. 
         * We want to keep them for history and CRM.
         */

        await _repository.UpdateAsync(reservation);
        await _repository.SaveChangesAsync();
        await _roomRepository.SaveChangesAsync();
        // Guest changes removed, so no save needed for guests specifically, but context saves all tracked.
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
