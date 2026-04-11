using HotelManagement.Core.Interfaces;

namespace HotelManagement.Core.Entities;

/// <summary>
/// Named pricing plan (e.g. "Yaz Sezonu", "Hafta Sonu Fiyatı", "Erken Rezervasyon")
/// </summary>
public class RatePlan : IEntity
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    /// <summary>Percentage or fixed amount multiplier on base room price</summary>
    public RatePlanAdjustmentType AdjustmentType { get; set; } = RatePlanAdjustmentType.Percentage;
    public decimal AdjustmentValue { get; set; }  // e.g. 20 = +%20, -10 = -%10

    public bool IsActive { get; set; } = true;
    public int Priority { get; set; } = 0;  // Higher = takes precedence

    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }

    /// <summary>Applies only on these weekdays (null = all days)</summary>
    public List<DayOfWeek> ApplicableDays { get; set; } = new();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<RatePlanRoomType> RoomTypeRates { get; set; } = new List<RatePlanRoomType>();
}

/// <summary>
/// Override price for a specific room type under this rate plan
/// </summary>
public class RatePlanRoomType : IEntity
{
    public Guid Id { get; set; }

    public Guid RatePlanId { get; set; }
    public RatePlan? RatePlan { get; set; }

    /// <summary>Null = applies to all room types</summary>
    public string? RoomType { get; set; }

    /// <summary>Fixed price per night for this room type (overrides base price if set)</summary>
    public decimal? FixedPricePerNight { get; set; }

    /// <summary>Additional adjustment on top of plan's base adjustment</summary>
    public decimal? AdditionalAdjustment { get; set; }
}

public enum RatePlanAdjustmentType
{
    Percentage,
    FixedAmount
}
