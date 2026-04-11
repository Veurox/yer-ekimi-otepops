using HotelManagement.Core.Enums;
using HotelManagement.Core.Interfaces;

namespace HotelManagement.Core.Entities;

public class DynamicPricingRule : IEntity
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public DynamicPricingTrigger Trigger { get; set; }
    public decimal ThresholdValue { get; set; }
    public decimal AdjustmentPercent { get; set; }
    public bool IsActive { get; set; } = true;
    public int Priority { get; set; } = 1;
    public DateTime CreatedAt { get; set; }
}
