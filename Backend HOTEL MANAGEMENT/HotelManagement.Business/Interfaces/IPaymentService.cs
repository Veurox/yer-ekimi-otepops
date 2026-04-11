using HotelManagement.Business.DTOs;

namespace HotelManagement.Business.Interfaces;

public interface IPaymentService
{
    Task<IEnumerable<PaymentDto>> GetPaymentsByReservationAsync(Guid reservationId);
    Task<ReservationPaymentSummaryDto> GetPaymentSummaryAsync(Guid reservationId);
    Task<PaymentDto> AddPaymentAsync(CreatePaymentDto dto);
    Task<PaymentDto> RefundPaymentAsync(Guid paymentId, string? reason = null);
}
