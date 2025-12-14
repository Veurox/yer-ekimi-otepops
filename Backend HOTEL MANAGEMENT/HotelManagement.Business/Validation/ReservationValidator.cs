using HotelManagement.Business.DTOs;
using HotelManagement.Core.Entities;
using HotelManagement.Core.Interfaces;

namespace HotelManagement.Business.Validation;

public class ReservationValidator
{
    private readonly IGenericRepository<Room> _roomRepository;
    private readonly IGenericRepository<Reservation> _reservationRepository;
    private readonly IGenericRepository<Guest> _guestRepository;

    public ReservationValidator(
        IGenericRepository<Room> roomRepository,
        IGenericRepository<Reservation> reservationRepository,
        IGenericRepository<Guest> guestRepository)
    {
        _roomRepository = roomRepository;
        _reservationRepository = reservationRepository;
        _guestRepository = guestRepository;
    }

    public async Task<ValidationResult> ValidateCreateReservation(CreateReservationDto dto)
    {
        var errors = new List<string>();

        // 1. Date validation
        if (dto.CheckInDate >= dto.CheckOutDate)
            errors.Add("Check-out date must be after check-in date");

        if (dto.CheckInDate.Date < DateTime.UtcNow.Date)
            errors.Add("Check-in date cannot be in the past");

        // 2. Room validation
        var room = await _roomRepository.GetByIdAsync(dto.RoomId);
        if (room == null)
        {
            errors.Add("Room not found");
        }
        else
        {
            // Check room capacity
            if (room.Capacity < dto.NumberOfGuests)
                errors.Add($"Room capacity ({room.Capacity}) exceeded. Guests: {dto.NumberOfGuests}");

            // Check room availability for dates
            var isAvailable = await IsRoomAvailable(dto.RoomId, dto.CheckInDate, dto.CheckOutDate);
            if (!isAvailable)
                errors.Add("Room is not available for selected dates");
        }

        // 3. Guest count validation
        var expectedGuestCount = 1 + (dto.AdditionalGuests?.Count ?? 0);
        if (dto.NumberOfGuests != expectedGuestCount)
            errors.Add($"Number of guests ({dto.NumberOfGuests}) doesn't match provided guest details ({expectedGuestCount})");

        // 4. Primary guest validation
        if (string.IsNullOrWhiteSpace(dto.PrimaryGuestName))
            errors.Add("Primary guest name is required");

        if (string.IsNullOrWhiteSpace(dto.PrimaryGuestIdNumber))
            errors.Add("Primary guest ID number is required");

        if (dto.PrimaryGuestIdNumber?.Length != 11)
            errors.Add("Primary guest ID number must be 11 digits");

        // 5. Check if primary guest already has active reservation for these dates
        if (!string.IsNullOrWhiteSpace(dto.PrimaryGuestIdNumber))
        {
            var hasActiveReservation = await CheckGuestActiveReservation(
                dto.PrimaryGuestIdNumber,
                dto.CheckInDate,
                dto.CheckOutDate);

            if (hasActiveReservation)
                errors.Add("Primary guest already has an active reservation for these dates");
        }

        // 6. Payment validation
        if (dto.TotalAmount < 0)
            errors.Add("Total amount cannot be negative");

        if (dto.PaidAmount < 0)
            errors.Add("Paid amount cannot be negative");

        if (dto.PaidAmount > dto.TotalAmount)
            errors.Add("Paid amount cannot exceed total amount");

        return new ValidationResult
        {
            IsValid = errors.Count == 0,
            Errors = errors
        };
    }

    private async Task<bool> IsRoomAvailable(Guid roomId, DateTime checkIn, DateTime checkOut)
    {
        var allReservations = await _reservationRepository.GetAllAsync();
        
        var overlappingReservations = allReservations.Where(r =>
            r.RoomId == roomId &&
            r.Status != Core.Enums.ReservationStatus.Cancelled &&
            r.Status != Core.Enums.ReservationStatus.CheckedOut &&
            // Check for date overlap
            r.CheckInDate < checkOut && r.CheckOutDate > checkIn
        );

        return !overlappingReservations.Any();
    }

    private async Task<bool> CheckGuestActiveReservation(string idNumber, DateTime checkIn, DateTime checkOut)
    {
        var allGuests = await _guestRepository.GetAllAsync();
        var guest = allGuests.FirstOrDefault(g => g.IdNumber == idNumber && g.IsActive);

        if (guest == null || !guest.ReservationId.HasValue)
            return false;

        var allReservations = await _reservationRepository.GetAllAsync();
        var activeReservation = allReservations.FirstOrDefault(r =>
            r.Id == guest.ReservationId.Value &&
            r.Status != Core.Enums.ReservationStatus.Cancelled &&
            r.Status != Core.Enums.ReservationStatus.CheckedOut &&
            // Check for date overlap
            r.CheckInDate < checkOut && r.CheckOutDate > checkIn
        );

        return activeReservation != null;
    }
}

public class ValidationResult
{
    public bool IsValid { get; set; }
    public List<string> Errors { get; set; } = new();
}
