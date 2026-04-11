using HotelManagement.Business.DTOs;
using HotelManagement.Business.Interfaces;
using HotelManagement.Core.Entities;
using HotelManagement.Core.Enums;
using HotelManagement.Core.Interfaces;

namespace HotelManagement.Business.Services;

public class DynamicPricingService : IDynamicPricingService
{
    private readonly IGenericRepository<DynamicPricingRule> _ruleRepo;
    private readonly IGenericRepository<Room> _roomRepo;
    private readonly IGenericRepository<Reservation> _resRepo;

    public DynamicPricingService(
        IGenericRepository<DynamicPricingRule> ruleRepo,
        IGenericRepository<Room> roomRepo,
        IGenericRepository<Reservation> resRepo)
    {
        _ruleRepo = ruleRepo;
        _roomRepo = roomRepo;
        _resRepo = resRepo;
    }

    public async Task<List<DynamicPricingRuleDto>> GetRulesAsync()
    {
        var rules = await _ruleRepo.GetAllAsync();
        return rules.OrderBy(r => r.Priority)
                    .Select(r => new DynamicPricingRuleDto(r.Id, r.Name, r.Trigger.ToString(), r.ThresholdValue, r.AdjustmentPercent, r.IsActive, r.Priority))
                    .ToList();
    }

    public async Task<DynamicPricingRuleDto> CreateRuleAsync(CreateDynamicPricingRuleDto dto)
    {
        var rule = new DynamicPricingRule
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Trigger = dto.Trigger,
            ThresholdValue = dto.ThresholdValue,
            AdjustmentPercent = dto.AdjustmentPercent,
            IsActive = dto.IsActive,
            Priority = dto.Priority,
            CreatedAt = DateTime.UtcNow
        };
        await _ruleRepo.AddAsync(rule);
        await _ruleRepo.SaveChangesAsync();
        return new DynamicPricingRuleDto(rule.Id, rule.Name, rule.Trigger.ToString(), rule.ThresholdValue, rule.AdjustmentPercent, rule.IsActive, rule.Priority);
    }

    public async Task UpdateRuleAsync(Guid id, CreateDynamicPricingRuleDto dto)
    {
        var rule = await _ruleRepo.GetByIdAsync(id) ?? throw new Exception("Kural bulunamadı.");
        rule.Name = dto.Name;
        rule.Trigger = dto.Trigger;
        rule.ThresholdValue = dto.ThresholdValue;
        rule.AdjustmentPercent = dto.AdjustmentPercent;
        rule.IsActive = dto.IsActive;
        rule.Priority = dto.Priority;
        await _ruleRepo.UpdateAsync(rule);
        await _ruleRepo.SaveChangesAsync();
    }

    public async Task DeleteRuleAsync(Guid id)
    {
        var rule = await _ruleRepo.GetByIdAsync(id) ?? throw new Exception("Kural bulunamadı.");
        await _ruleRepo.DeleteAsync(rule);
        await _ruleRepo.SaveChangesAsync();
    }

    public async Task<DynamicPriceResultDto> CalculateDynamicPriceAsync(Guid roomId, DateTime checkIn)
    {
        checkIn = DateTime.SpecifyKind(checkIn.Date, DateTimeKind.Utc);

        var room = await _roomRepo.GetByIdAsync(roomId) ?? throw new Exception("Oda bulunamadı.");
        var basePrice = room.Price;

        // Occupancy rate
        var allRooms = await _roomRepo.GetAllAsync();
        var occupiedCount = allRooms.Count(r => r.Status == RoomStatus.Occupied || r.Status == RoomStatus.Reserved);
        var totalRooms = allRooms.Count();
        var occupancyRate = totalRooms > 0 ? (decimal)occupiedCount / totalRooms * 100 : 0;

        // Days until check-in
        var daysUntilCheckIn = (checkIn - DateTime.UtcNow.Date).TotalDays;

        var activeRules = await _ruleRepo.FindAsync(r => r.IsActive);
        var appliedRules = new List<string>();
        decimal totalAdjustment = 0;

        foreach (var rule in activeRules.OrderBy(r => r.Priority))
        {
            bool applies = rule.Trigger switch
            {
                DynamicPricingTrigger.OccupancyBased => occupancyRate >= rule.ThresholdValue,
                DynamicPricingTrigger.DaysBefore     => daysUntilCheckIn <= (double)rule.ThresholdValue,
                DynamicPricingTrigger.SeasonBased    => true,
                _ => false
            };

            if (applies)
            {
                totalAdjustment += rule.AdjustmentPercent;
                appliedRules.Add(rule.Name);
            }
        }

        // Cap adjustment at ±50%
        totalAdjustment = Math.Max(-50, Math.Min(50, totalAdjustment));
        var adjustedPrice = Math.Round(basePrice * (1 + totalAdjustment / 100), 2);

        return new DynamicPriceResultDto(basePrice, adjustedPrice, appliedRules, totalAdjustment);
    }
}
