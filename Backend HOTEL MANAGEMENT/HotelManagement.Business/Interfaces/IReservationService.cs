using HotelManagement.Business.DTOs;
using HotelManagement.Core.Entities;

namespace HotelManagement.Business.Interfaces;

public interface IReservationService
{
    Task<IEnumerable<ReservationDto>> GetAllReservationsAsync();
    Task<ReservationDto?> GetReservationByIdAsync(Guid id);
    Task<ReservationDto> CreateReservationAsync(CreateReservationDto dto);
    Task UpdateReservationAsync(ReservationDto dto);
    Task DeleteReservationAsync(Guid id);

    Task<PagedResultDto<ReservationDto>> GetPagedAsync(int page, int pageSize, string? status, string? search);

    Task<ReservationDto> ConfirmAsync(Guid reservationId);
    Task<ReservationDto> CheckInAsync(Guid reservationId);
    Task<CheckOutResult> CheckOutAsync(Guid reservationId, bool forceCheckout = false, string? forceReason = null);
    Task<ReservationDto> CancelAsync(Guid reservationId, string? reason = null);
    Task<Reservation> WalkInAsync(WalkInPayload payload);
}
