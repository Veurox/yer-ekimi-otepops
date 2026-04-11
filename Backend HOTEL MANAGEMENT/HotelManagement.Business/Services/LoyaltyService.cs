using HotelManagement.Business.DTOs;
using HotelManagement.Business.Interfaces;
using HotelManagement.Core.Entities;
using HotelManagement.Core.Interfaces;

namespace HotelManagement.Business.Services;

public class LoyaltyService : ILoyaltyService
{
    private readonly IGenericRepository<Guest> _guestRepo;
    private readonly IGenericRepository<LoyaltyTransaction> _txRepo;

    public LoyaltyService(
        IGenericRepository<Guest> guestRepo,
        IGenericRepository<LoyaltyTransaction> txRepo)
    {
        _guestRepo = guestRepo;
        _txRepo = txRepo;
    }

    public async Task<LoyaltySummaryDto> GetSummaryAsync(Guid guestId)
    {
        var guest = await _guestRepo.GetByIdAsync(guestId)
            ?? throw new Exception("Misafir bulunamadı.");
        var transactions = await _txRepo.FindAsync(t => t.GuestId == guestId);
        var recent = transactions.OrderByDescending(t => t.CreatedAt).Take(20)
            .Select(t => new LoyaltyTransactionDto(t.Id, t.Points, t.TransactionType, t.Description, t.ReservationId, t.CreatedAt))
            .ToList();

        return new LoyaltySummaryDto(guest.Id, guest.Name, guest.LoyaltyPoints, guest.VipLevel ?? "Bronze", recent);
    }

    public async Task EarnPointsAsync(EarnPointsDto dto)
    {
        var guest = await _guestRepo.GetByIdAsync(dto.GuestId)
            ?? throw new Exception("Misafir bulunamadı.");

        int points = (int)(dto.AmountSpent / 10);
        if (points <= 0) return;

        var tx = new LoyaltyTransaction
        {
            Id = Guid.NewGuid(),
            GuestId = dto.GuestId,
            Points = points,
            TransactionType = "Earned",
            Description = $"{dto.AmountSpent:N0} ₺ harcama için {points} puan",
            ReservationId = dto.ReservationId,
            CreatedAt = DateTime.UtcNow
        };
        await _txRepo.AddAsync(tx);

        guest.LoyaltyPoints += points;
        await _guestRepo.UpdateAsync(guest);
        await _txRepo.SaveChangesAsync();
    }

    public async Task RedeemPointsAsync(RedeemPointsDto dto)
    {
        var guest = await _guestRepo.GetByIdAsync(dto.GuestId)
            ?? throw new Exception("Misafir bulunamadı.");

        if (guest.LoyaltyPoints < dto.Points)
            throw new Exception($"Yetersiz puan. Mevcut: {guest.LoyaltyPoints}, İstenen: {dto.Points}");

        var tx = new LoyaltyTransaction
        {
            Id = Guid.NewGuid(),
            GuestId = dto.GuestId,
            Points = -dto.Points,
            TransactionType = "Redeemed",
            Description = dto.Description,
            CreatedAt = DateTime.UtcNow
        };
        await _txRepo.AddAsync(tx);

        guest.LoyaltyPoints -= dto.Points;
        await _guestRepo.UpdateAsync(guest);
        await _txRepo.SaveChangesAsync();
    }

    public async Task<List<LoyaltyTransactionDto>> GetTransactionsAsync(Guid guestId)
    {
        var txs = await _txRepo.FindAsync(t => t.GuestId == guestId);
        return txs.OrderByDescending(t => t.CreatedAt)
                  .Select(t => new LoyaltyTransactionDto(t.Id, t.Points, t.TransactionType, t.Description, t.ReservationId, t.CreatedAt))
                  .ToList();
    }
}
