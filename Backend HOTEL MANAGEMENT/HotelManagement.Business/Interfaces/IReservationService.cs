using HotelManagement.Business.DTOs;

namespace HotelManagement.Business.Interfaces;

public interface IReservationService
{
    Task<IEnumerable<ReservationDto>> GetAllReservationsAsync();
    Task<ReservationDto?> GetReservationByIdAsync(Guid id);
    Task<ReservationDto> CreateReservationAsync(CreateReservationDto dto);
    Task UpdateReservationAsync(ReservationDto dto);
    Task DeleteReservationAsync(Guid id);
    
    // New methods for check-in/check-out
    Task<ReservationDto> CheckInAsync(Guid reservationId);
    Task<CheckOutResult> CheckOutAsync(Guid reservationId, bool forceCheckout = false);
}
