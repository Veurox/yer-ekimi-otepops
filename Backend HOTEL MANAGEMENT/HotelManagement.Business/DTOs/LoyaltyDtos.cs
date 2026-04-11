namespace HotelManagement.Business.DTOs;

public record LoyaltyTransactionDto(
    Guid Id,
    int Points,
    string TransactionType,
    string Description,
    Guid? ReservationId,
    DateTime CreatedAt
);

public record LoyaltySummaryDto(
    Guid GuestId,
    string GuestName,
    int TotalPoints,
    string VipLevel,
    List<LoyaltyTransactionDto> RecentTransactions
);

public class EarnPointsDto
{
    public Guid GuestId { get; set; }
    public Guid ReservationId { get; set; }
    public decimal AmountSpent { get; set; }
}

public class RedeemPointsDto
{
    public Guid GuestId { get; set; }
    public int Points { get; set; }
    public string Description { get; set; } = "Puan Kullanımı";
}
