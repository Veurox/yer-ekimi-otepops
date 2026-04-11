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
    private readonly ICacheService _cacheService;
    private readonly IEmailService _emailService;
    private const string RoomCacheKey = "all_rooms";

    public ReservationService(
        IGenericRepository<Reservation> repository,
        IGenericRepository<Room> roomRepository,
        IGenericRepository<Guest> guestRepository,
        ICacheService cacheService,
        IEmailService emailService)
    {
        _repository = repository;
        _roomRepository = roomRepository;
        _guestRepository = guestRepository;
        _cacheService = cacheService;
        _emailService = emailService;
    }

    public async Task<PagedResultDto<ReservationDto>> GetPagedAsync(int page, int pageSize, string? status, string? search)
    {
        var reservations = await _repository.GetAllAsync();
        var allGuests = await _guestRepository.GetAllAsync();
        var allRooms = await _roomRepository.GetAllAsync();

        var query = reservations.AsQueryable();

        // Filter by status
        if (!string.IsNullOrWhiteSpace(status))
        {
            if (Enum.TryParse<ReservationStatus>(status, true, out var parsedStatus))
                query = query.Where(r => r.Status == parsedStatus);
        }

        // Filter by search (guest name or room number)
        if (!string.IsNullOrWhiteSpace(search))
        {
            var lowerSearch = search.ToLower();
            // Build lookup sets for matching reservation IDs
            var matchingGuestReservationIds = allGuests
                .Where(g => g.ReservationId.HasValue && g.Name.ToLower().Contains(lowerSearch))
                .Select(g => g.ReservationId!.Value)
                .ToHashSet();
            var matchingRoomIds = allRooms
                .Where(r => r.Number.ToLower().Contains(lowerSearch))
                .Select(r => r.Id)
                .ToHashSet();

            query = query.Where(r =>
                matchingGuestReservationIds.Contains(r.Id) ||
                matchingRoomIds.Contains(r.RoomId));
        }

        var totalCount = query.Count();
        var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);
        var skip = (page - 1) * pageSize;

        var pagedReservations = query
            .OrderByDescending(r => r.CreatedAt)
            .Skip(skip)
            .Take(pageSize)
            .ToList();

        var dtos = pagedReservations.Select(MapToDto).ToList();

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
                    IsPrimaryGuest = guest.Id == dto.GuestId
                });
            }

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

        return new PagedResultDto<ReservationDto>(dtos, totalCount, page, pageSize, totalPages);
    }

    public async Task<IEnumerable<ReservationDto>> GetAllReservationsAsync()
    {
        var reservations = await _repository.GetAllAsync();
        var dtos = reservations.Select(MapToDto).ToList();

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
                    IsPrimaryGuest = guest.Id == dto.GuestId
                });
            }

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

        var allGuests = await _guestRepository.GetAllAsync();
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
        if (dto.CheckInDate.Kind == DateTimeKind.Unspecified)
            dto.CheckInDate = DateTime.SpecifyKind(dto.CheckInDate, DateTimeKind.Utc);
        if (dto.CheckOutDate.Kind == DateTimeKind.Unspecified)
            dto.CheckOutDate = DateTime.SpecifyKind(dto.CheckOutDate, DateTimeKind.Utc);

        // Availability check
        var conflicting = await _repository.FindAsync(r =>
            r.RoomId == dto.RoomId &&
            r.Status != ReservationStatus.Cancelled &&
            r.Status != ReservationStatus.CheckedOut &&
            (r.CheckInDate < dto.CheckOutDate && r.CheckOutDate > dto.CheckInDate)
        );
        if (conflicting.Any())
            throw new InvalidOperationException("Secilen tarihlerde oda dolu (Mevcut rezervasyon var).");

        // Find or Create Guest
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
            guest.Name = dto.PrimaryGuestName;
            guest.Phone = dto.PrimaryGuestPhone;
            guest.Email = dto.PrimaryGuestEmail;
            guest.Address = dto.PrimaryGuestAddress;
            guest.IsActive = true;
            guest.IsPrimaryGuest = true;
            await _guestRepository.UpdateAsync(guest);
        }

        // Save guest first (without ReservationId to avoid circular dependency)
        await _guestRepository.SaveChangesAsync();

        var reservationId = Guid.NewGuid();
        var reservation = new Reservation
        {
            Id = reservationId,
            GuestId = guest.Id,
            RoomId = dto.RoomId,
            CheckInDate = dto.CheckInDate,
            CheckOutDate = dto.CheckOutDate,
            NumberOfGuests = dto.NumberOfGuests,
            TotalAmount = dto.TotalAmount,
            TotalPrice = dto.TotalAmount,
            PaidAmount = dto.PaidAmount ?? 0,
            IsPaid = (dto.PaidAmount ?? 0) >= dto.TotalAmount,
            PaymentMethod = NormalizePaymentMethod(dto.PaymentMethod),
            PaymentDate = (dto.PaidAmount ?? 0) > 0 ? DateTime.UtcNow : null,
            SpecialRequests = dto.SpecialRequests,
            Status = ReservationStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        await _repository.AddAsync(reservation);
        await _repository.SaveChangesAsync();

        // Now link guest to reservation
        guest.ReservationId = reservationId;
        guest.Visits++;
        guest.TotalSpent += reservation.TotalAmount;
        await _guestRepository.UpdateAsync(guest);

        // Additional Guests
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
                    ReservationId = reservationId,
                    IsActive = true,
                    Visits = 1,
                    TotalSpent = 0
                };
                await _guestRepository.AddAsync(extraGuest);
            }
            else
            {
                extraGuest.Phone = extraGuestDto.Phone;
                extraGuest.Email = extraGuestDto.Email;
                extraGuest.Address = extraGuestDto.Address;
                extraGuest.ReservationId = reservationId;
                extraGuest.Visits++;
                await _guestRepository.UpdateAsync(extraGuest);
            }
        }

        await _guestRepository.SaveChangesAsync();

        // Send confirmation email (fire-and-forget; don't fail the reservation if email fails)
        if (!string.IsNullOrWhiteSpace(guest.Email))
        {
            var room = await _roomRepository.GetByIdAsync(reservation.RoomId);
            _ = Task.Run(async () =>
            {
                try
                {
                    await _emailService.SendReservationConfirmationAsync(
                        guest.Email, guest.Name, reservation.Id.ToString(),
                        room?.Number ?? "?", reservation.CheckInDate, reservation.CheckOutDate,
                        reservation.TotalAmount);
                    reservation.ConfirmationEmailSent = true;
                    reservation.ConfirmationEmailSentAt = DateTime.UtcNow;
                    await _repository.UpdateAsync(reservation);
                    await _repository.SaveChangesAsync();
                }
                catch { /* log via middleware */ }
            });
        }

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
        if (dto.CheckInDate.Kind == DateTimeKind.Unspecified)
            dto.CheckInDate = DateTime.SpecifyKind(dto.CheckInDate, DateTimeKind.Utc);
        if (dto.CheckOutDate.Kind == DateTimeKind.Unspecified)
            dto.CheckOutDate = DateTime.SpecifyKind(dto.CheckOutDate, DateTimeKind.Utc);

        var reservation = await _repository.GetByIdAsync(dto.Id);
        if (reservation == null) throw new KeyNotFoundException($"Reservation {dto.Id} not found");

        // Cannot update terminal states
        if (reservation.Status == ReservationStatus.CheckedOut || reservation.Status == ReservationStatus.Cancelled)
            throw new InvalidOperationException($"Tamamlanmis veya iptal edilmis rezervasyon guncellenemez.");

        // If dates changed, re-validate availability
        if (reservation.CheckInDate != dto.CheckInDate || reservation.CheckOutDate != dto.CheckOutDate)
        {
            var conflicting = await _repository.FindAsync(r =>
                r.RoomId == reservation.RoomId &&
                r.Id != reservation.Id &&
                r.Status != ReservationStatus.Cancelled &&
                r.Status != ReservationStatus.CheckedOut &&
                (r.CheckInDate < dto.CheckOutDate && r.CheckOutDate > dto.CheckInDate)
            );
            if (conflicting.Any())
                throw new InvalidOperationException("Yeni tarihler icin oda musait degil.");
        }

        reservation.CheckInDate = dto.CheckInDate;
        reservation.CheckOutDate = dto.CheckOutDate;
        reservation.NumberOfGuests = dto.NumberOfGuests;
        reservation.SpecialRequests = dto.SpecialRequests;

        // Payment updates
        reservation.TotalAmount = dto.TotalAmount;
        reservation.TotalPrice = dto.TotalAmount;
        reservation.PaidAmount = dto.PaidAmount;
        reservation.PaymentMethod = NormalizePaymentMethod(dto.PaymentMethod);

        reservation.IsPaid = reservation.PaidAmount >= reservation.TotalAmount;
        if (reservation.IsPaid && reservation.PaymentDate == null)
        {
            reservation.PaymentDate = DateTime.UtcNow;
        }

        // Status update with state machine validation
        if (!string.IsNullOrEmpty(dto.Status))
        {
            if (Enum.TryParse<ReservationStatus>(dto.Status, true, out var newStatus))
            {
                if (newStatus != reservation.Status)
                {
                    reservation.TransitionTo(newStatus);
                }
            }
        }

        reservation.UpdatedAt = DateTime.UtcNow;

        await _repository.UpdateAsync(reservation);
        await _repository.SaveChangesAsync();
    }

    public async Task DeleteReservationAsync(Guid id)
    {
        var reservation = await _repository.GetByIdAsync(id);
        if (reservation == null) throw new KeyNotFoundException($"Reservation {id} not found");

        // Cannot delete active reservations - cancel them instead
        if (reservation.Status == ReservationStatus.CheckedIn)
            throw new InvalidOperationException("Aktif (giris yapilmis) rezervasyon silinemez. Once check-out yapin.");

        await _repository.DeleteAsync(reservation);
        await _repository.SaveChangesAsync();
    }

    public async Task<ReservationDto> ConfirmAsync(Guid reservationId)
    {
        var reservation = await _repository.GetByIdAsync(reservationId);
        if (reservation == null)
            throw new KeyNotFoundException($"Reservation {reservationId} not found");

        reservation.TransitionTo(ReservationStatus.Confirmed);

        await _repository.UpdateAsync(reservation);
        await _repository.SaveChangesAsync();

        return MapToDto(reservation);
    }

    public async Task<ReservationDto> CheckInAsync(Guid reservationId)
    {
        var reservation = await _repository.GetByIdAsync(reservationId);
        if (reservation == null)
            throw new KeyNotFoundException($"Reservation {reservationId} not found");

        // State machine validation (only Confirmed -> CheckedIn)
        reservation.TransitionTo(ReservationStatus.CheckedIn);

        if (reservation.CheckInDate.Date > DateTime.UtcNow.Date)
            throw new InvalidOperationException("Rezervasyon tarihinden once giris yapilamaz.");

        // Update room status using state machine
        var room = await _roomRepository.GetByIdAsync(reservation.RoomId);
        if (room != null)
        {
            room.TransitionTo(RoomStatus.Occupied);
            room.CurrentGuestId = reservation.GuestId;
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
        await _cacheService.RemoveAsync(RoomCacheKey);

        return MapToDto(reservation);
    }

    public async Task<CheckOutResult> CheckOutAsync(Guid reservationId, bool forceCheckout = false, string? forceReason = null)
    {
        var reservation = await _repository.GetByIdAsync(reservationId);
        if (reservation == null)
            throw new KeyNotFoundException($"Reservation {reservationId} not found");

        // State machine validation (only CheckedIn -> CheckedOut)
        if (!reservation.CanTransitionTo(ReservationStatus.CheckedOut))
            throw new InvalidOperationException($"Bu durumdaki ({reservation.Status}) rezervasyon icin cikis yapilamaz.");

        // Payment validation
        if (!reservation.IsPaid && !forceCheckout)
        {
            var remaining = reservation.TotalAmount - reservation.PaidAmount;
            return new CheckOutResult
            {
                Success = false,
                Message = $"Odeme tamamlanmadi. Kalan: {remaining:F2} TL",
                RequiresPayment = true,
                RemainingAmount = remaining
            };
        }

        // Perform checkout
        reservation.TransitionTo(ReservationStatus.CheckedOut);
        reservation.ActualCheckOutDate = DateTime.UtcNow;

        // Audit forced checkout
        if (forceCheckout && !reservation.IsPaid)
        {
            reservation.IsForceCheckout = true;
            reservation.ForceCheckoutReason = forceReason ?? "Personel tarafindan zorla cikis yapildi";
        }

        // Room -> Cleaning
        var room = await _roomRepository.GetByIdAsync(reservation.RoomId);
        if (room != null)
        {
            room.TransitionTo(RoomStatus.Cleaning);
            room.CurrentGuestId = null;
            await _roomRepository.UpdateAsync(room);
        }

        await _repository.UpdateAsync(reservation);
        await _repository.SaveChangesAsync();
        await _cacheService.RemoveAsync(RoomCacheKey);

        return new CheckOutResult
        {
            Success = true,
            Message = forceCheckout
                ? "Cikis yapildi (zorla - odenmemis tutar mevcut)"
                : "Cikis islemi basariyla tamamlandi",
            RequiresPayment = false,
            RemainingAmount = 0
        };
    }

    public async Task<ReservationDto> CancelAsync(Guid reservationId, string? reason = null)
    {
        var reservation = await _repository.GetByIdAsync(reservationId);
        if (reservation == null)
            throw new KeyNotFoundException($"Reservation {reservationId} not found");

        // State machine validates: only Pending or Confirmed can be cancelled
        reservation.TransitionTo(ReservationStatus.Cancelled);
        reservation.CancellationReason = reason ?? "Misafir tarafindan iptal edildi";
        reservation.CancelledAt = DateTime.UtcNow;

        // Release room if it was reserved
        var room = await _roomRepository.GetByIdAsync(reservation.RoomId);
        if (room != null && room.Status == RoomStatus.Reserved)
        {
            room.TransitionTo(RoomStatus.Available);
            await _roomRepository.UpdateAsync(room);
        }

        // Unlink guests from this reservation
        var allGuests = await _guestRepository.GetAllAsync();
        var reservationGuests = allGuests.Where(g => g.ReservationId == reservationId).ToList();
        foreach (var guest in reservationGuests)
        {
            guest.ReservationId = null;
            await _guestRepository.UpdateAsync(guest);
        }

        await _repository.UpdateAsync(reservation);
        await _repository.SaveChangesAsync();
        await _cacheService.RemoveAsync(RoomCacheKey);

        return MapToDto(reservation);
    }

    public async Task<Reservation> WalkInAsync(WalkInPayload payload)
    {
        if (!Guid.TryParse(payload.RoomId, out var roomId))
            throw new ArgumentException("Gecersiz RoomId formati.");

        var room = await _roomRepository.GetByIdAsync(roomId);
        if (room == null)
            throw new KeyNotFoundException($"Oda bulunamadi: {payload.RoomId}");

        if (room.Status != RoomStatus.Available)
            throw new InvalidOperationException($"Oda musait degil. Mevcut durum: {room.Status}");

        // Parse checkout date
        if (!DateTime.TryParse(payload.CheckOutDate, null, System.Globalization.DateTimeStyles.RoundtripKind, out var checkOutDate))
            throw new ArgumentException("Gecersiz CheckOutDate formati. ISO 8601 kullanin.");

        if (checkOutDate.Kind == DateTimeKind.Unspecified)
            checkOutDate = DateTime.SpecifyKind(checkOutDate, DateTimeKind.Utc);
        else
            checkOutDate = checkOutDate.ToUniversalTime();

        var checkInDate = DateTime.UtcNow;

        if (checkOutDate <= checkInDate)
            throw new InvalidOperationException("Cikis tarihi giris tarihinden sonra olmalidir.");

        // Find or create guest
        var existingGuests = await _guestRepository.FindAsync(g => g.IdNumber == payload.GuestIdNumber);
        var guest = existingGuests.FirstOrDefault();

        if (guest == null)
        {
            guest = new Guest
            {
                Id = Guid.NewGuid(),
                Name = payload.GuestName,
                IdNumber = payload.GuestIdNumber,
                Email = payload.GuestEmail ?? string.Empty,
                Phone = payload.GuestPhone,
                Address = payload.GuestAddress ?? string.Empty,
                IsPrimaryGuest = true,
                TotalSpent = 0,
                Visits = 0,
                IsActive = true
            };
            await _guestRepository.AddAsync(guest);
        }
        else
        {
            guest.Name = payload.GuestName;
            guest.Phone = payload.GuestPhone;
            if (!string.IsNullOrWhiteSpace(payload.GuestEmail)) guest.Email = payload.GuestEmail;
            if (!string.IsNullOrWhiteSpace(payload.GuestAddress)) guest.Address = payload.GuestAddress;
            guest.IsActive = true;
            guest.IsPrimaryGuest = true;
            await _guestRepository.UpdateAsync(guest);
        }

        await _guestRepository.SaveChangesAsync();

        // Calculate total amount based on room price and duration
        var nights = Math.Max(1, (int)Math.Ceiling((checkOutDate - checkInDate).TotalDays));
        var totalAmount = room.Price * nights;

        var reservationId = Guid.NewGuid();
        var reservation = new Reservation
        {
            Id = reservationId,
            GuestId = guest.Id,
            RoomId = roomId,
            CheckInDate = checkInDate,
            CheckOutDate = checkOutDate,
            NumberOfGuests = payload.NumberOfGuests,
            TotalAmount = totalAmount,
            TotalPrice = totalAmount,
            PaidAmount = payload.PaidAmount,
            IsPaid = payload.PaidAmount >= totalAmount,
            PaymentMethod = NormalizePaymentMethod(payload.PaymentMethod),
            PaymentDate = payload.PaidAmount > 0 ? DateTime.UtcNow : null,
            SpecialRequests = payload.SpecialRequests ?? string.Empty,
            Status = ReservationStatus.Confirmed,
            CreatedAt = DateTime.UtcNow
        };

        await _repository.AddAsync(reservation);
        await _repository.SaveChangesAsync();

        // Link guest to reservation
        guest.ReservationId = reservationId;
        guest.Visits++;
        guest.TotalSpent += reservation.TotalAmount;
        await _guestRepository.UpdateAsync(guest);
        await _guestRepository.SaveChangesAsync();

        // Immediately perform check-in
        reservation.TransitionTo(ReservationStatus.CheckedIn);

        room.TransitionTo(RoomStatus.Occupied);
        room.CurrentGuestId = guest.Id;
        await _roomRepository.UpdateAsync(room);

        guest.IsActive = true;
        await _guestRepository.UpdateAsync(guest);

        await _repository.UpdateAsync(reservation);
        await _repository.SaveChangesAsync();
        await _cacheService.RemoveAsync(RoomCacheKey);

        return reservation;
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
            TotalPrice = r.TotalAmount,
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
            Guests = new List<GuestDto>()
        };
    }

    private static string NormalizePaymentMethod(string method)
    {
        if (string.IsNullOrWhiteSpace(method)) return string.Empty;
        return method.Trim().ToLower() switch
        {
            "credit card" or "creditcard" or "kredi karti" or "kredi kartı" => "Credit Card",
            "cash" or "nakit" => "Cash",
            "debit card" or "debitcard" or "banka karti" or "banka kartı" => "Debit Card",
            "transfer" or "havale" or "eft" => "Transfer",
            _ => method.Trim()
        };
    }
}
