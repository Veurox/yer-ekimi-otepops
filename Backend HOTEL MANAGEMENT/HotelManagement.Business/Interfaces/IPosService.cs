using HotelManagement.Business.DTOs;

namespace HotelManagement.Business.Interfaces;

public interface IPosService
{
    Task<IEnumerable<PosTransactionDto>> GetTransactionsAsync(Guid? reservationId = null);
    Task<PosTransactionDto> CreateTransactionAsync(CreatePosTransactionDto dto);
    Task<PosTransactionDto> ChargeToRoomAsync(Guid transactionId);
    Task<RoomChargesSummaryDto> GetRoomChargesAsync(Guid reservationId);
    Task<PosTransactionDto?> CancelTransactionAsync(Guid transactionId);
}
