using HotelManagement.Business.DTOs;

namespace HotelManagement.Business.Interfaces;

public interface ILoyaltyService
{
    Task<LoyaltySummaryDto> GetSummaryAsync(Guid guestId);
    Task EarnPointsAsync(EarnPointsDto dto);
    Task RedeemPointsAsync(RedeemPointsDto dto);
    Task<List<LoyaltyTransactionDto>> GetTransactionsAsync(Guid guestId);
}
