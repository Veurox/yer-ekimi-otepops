namespace HotelManagement.Business.DTOs;

public class RatePlanDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string AdjustmentType { get; set; } = string.Empty;
    public decimal AdjustmentValue { get; set; }
    public bool IsActive { get; set; }
    public int Priority { get; set; }
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }
    public List<int> ApplicableDays { get; set; } = new();   // 0=Sun..6=Sat
    public DateTime CreatedAt { get; set; }
    public List<RatePlanRoomTypeDto> RoomTypeRates { get; set; } = new();
}

public class RatePlanRoomTypeDto
{
    public Guid Id { get; set; }
    public string? RoomType { get; set; }
    public decimal? FixedPricePerNight { get; set; }
    public decimal? AdditionalAdjustment { get; set; }
}

public class CreateRatePlanDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string AdjustmentType { get; set; } = "Percentage";
    public decimal AdjustmentValue { get; set; }
    public bool IsActive { get; set; } = true;
    public int Priority { get; set; } = 0;
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }
    public List<int> ApplicableDays { get; set; } = new();
    public List<CreateRatePlanRoomTypeDto> RoomTypeRates { get; set; } = new();
}

public class CreateRatePlanRoomTypeDto
{
    public string? RoomType { get; set; }
    public decimal? FixedPricePerNight { get; set; }
    public decimal? AdditionalAdjustment { get; set; }
}

public class CalculatedRateDto
{
    public Guid RoomId { get; set; }
    public string RoomNumber { get; set; } = string.Empty;
    public string RoomType { get; set; } = string.Empty;
    public decimal BasePrice { get; set; }
    public decimal FinalPricePerNight { get; set; }
    public int NightCount { get; set; }
    public decimal TotalPrice { get; set; }
    public string? AppliedRatePlan { get; set; }
    public decimal DiscountAmount { get; set; }
}
