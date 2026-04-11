using HotelManagement.Core.Enums;

namespace HotelManagement.Business.DTOs;

public record DynamicPricingRuleDto(
    Guid Id,
    string Name,
    string Trigger,
    decimal ThresholdValue,
    decimal AdjustmentPercent,
    bool IsActive,
    int Priority
);

public class CreateDynamicPricingRuleDto
{
    public string Name { get; set; } = "";
    public DynamicPricingTrigger Trigger { get; set; }
    public decimal ThresholdValue { get; set; }
    public decimal AdjustmentPercent { get; set; }
    public bool IsActive { get; set; } = true;
    public int Priority { get; set; } = 1;
}

public record DynamicPriceResultDto(
    decimal BasePrice,
    decimal AdjustedPrice,
    List<string> AppliedRules,
    decimal TotalAdjustmentPercent
);
