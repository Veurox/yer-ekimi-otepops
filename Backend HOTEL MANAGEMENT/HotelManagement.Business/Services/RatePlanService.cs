using HotelManagement.Business.DTOs;
using HotelManagement.Business.Interfaces;
using HotelManagement.Core.Entities;
using HotelManagement.Core.Interfaces;

namespace HotelManagement.Business.Services;

public class RatePlanService : IRatePlanService
{
    private readonly IGenericRepository<RatePlan> _planRepository;
    private readonly IGenericRepository<RatePlanRoomType> _rateRoomRepository;
    private readonly IGenericRepository<Room> _roomRepository;

    public RatePlanService(
        IGenericRepository<RatePlan> planRepository,
        IGenericRepository<RatePlanRoomType> rateRoomRepository,
        IGenericRepository<Room> roomRepository)
    {
        _planRepository     = planRepository;
        _rateRoomRepository = rateRoomRepository;
        _roomRepository     = roomRepository;
    }

    public async Task<IEnumerable<RatePlanDto>> GetAllAsync()
    {
        var plans = (await _planRepository.GetAllAsync()).OrderByDescending(p => p.Priority);
        var result = new List<RatePlanDto>();
        foreach (var p in plans)
            result.Add(await EnrichDto(p));
        return result;
    }

    public async Task<RatePlanDto?> GetByIdAsync(Guid id)
    {
        var plans = await _planRepository.FindAsync(p => p.Id == id);
        var plan  = plans.FirstOrDefault();
        return plan == null ? null : await EnrichDto(plan);
    }

    public async Task<RatePlanDto> CreateAsync(CreateRatePlanDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new InvalidOperationException("Plan adı boş olamaz.");

        if (!Enum.TryParse<RatePlanAdjustmentType>(dto.AdjustmentType, true, out var adjType))
            adjType = RatePlanAdjustmentType.Percentage;

        var plan = new RatePlan
        {
            Id              = Guid.NewGuid(),
            Name            = dto.Name,
            Description     = dto.Description,
            AdjustmentType  = adjType,
            AdjustmentValue = dto.AdjustmentValue,
            IsActive        = dto.IsActive,
            Priority        = dto.Priority,
            ValidFrom       = dto.ValidFrom.HasValue ? DateTime.SpecifyKind(dto.ValidFrom.Value, DateTimeKind.Utc) : null,
            ValidTo         = dto.ValidTo.HasValue   ? DateTime.SpecifyKind(dto.ValidTo.Value,   DateTimeKind.Utc) : null,
            ApplicableDays  = dto.ApplicableDays.Select(d => (DayOfWeek)d).ToList(),
            CreatedAt       = DateTime.UtcNow
        };

        await _planRepository.AddAsync(plan);
        await _planRepository.SaveChangesAsync();

        foreach (var rr in dto.RoomTypeRates)
        {
            await _rateRoomRepository.AddAsync(new RatePlanRoomType
            {
                Id                  = Guid.NewGuid(),
                RatePlanId          = plan.Id,
                RoomType            = rr.RoomType,
                FixedPricePerNight  = rr.FixedPricePerNight,
                AdditionalAdjustment = rr.AdditionalAdjustment
            });
        }

        if (dto.RoomTypeRates.Any())
            await _rateRoomRepository.SaveChangesAsync();

        return await EnrichDto(plan);
    }

    public async Task<RatePlanDto> UpdateAsync(Guid id, CreateRatePlanDto dto)
    {
        var plans = await _planRepository.FindAsync(p => p.Id == id);
        var plan  = plans.FirstOrDefault() ?? throw new KeyNotFoundException($"RatePlan {id} not found");

        if (!Enum.TryParse<RatePlanAdjustmentType>(dto.AdjustmentType, true, out var adjType))
            adjType = RatePlanAdjustmentType.Percentage;

        plan.Name            = dto.Name;
        plan.Description     = dto.Description;
        plan.AdjustmentType  = adjType;
        plan.AdjustmentValue = dto.AdjustmentValue;
        plan.IsActive        = dto.IsActive;
        plan.Priority        = dto.Priority;
        plan.ValidFrom       = dto.ValidFrom.HasValue ? DateTime.SpecifyKind(dto.ValidFrom.Value, DateTimeKind.Utc) : null;
        plan.ValidTo         = dto.ValidTo.HasValue   ? DateTime.SpecifyKind(dto.ValidTo.Value,   DateTimeKind.Utc) : null;
        plan.ApplicableDays  = dto.ApplicableDays.Select(d => (DayOfWeek)d).ToList();

        await _planRepository.UpdateAsync(plan);

        // Replace room-type overrides
        var existing = await _rateRoomRepository.FindAsync(r => r.RatePlanId == id);
        foreach (var e in existing)
            await _rateRoomRepository.DeleteAsync(e);

        foreach (var rr in dto.RoomTypeRates)
        {
            await _rateRoomRepository.AddAsync(new RatePlanRoomType
            {
                Id                   = Guid.NewGuid(),
                RatePlanId           = plan.Id,
                RoomType             = rr.RoomType,
                FixedPricePerNight   = rr.FixedPricePerNight,
                AdditionalAdjustment = rr.AdditionalAdjustment
            });
        }

        await _planRepository.SaveChangesAsync();
        return await EnrichDto(plan);
    }

    public async Task DeleteAsync(Guid id)
    {
        var plans = await _planRepository.FindAsync(p => p.Id == id);
        var plan  = plans.FirstOrDefault() ?? throw new KeyNotFoundException($"RatePlan {id} not found");
        await _planRepository.DeleteAsync(plan);
        await _planRepository.SaveChangesAsync();
    }

    public async Task<CalculatedRateDto> CalculateRateAsync(Guid roomId, DateTime checkIn, DateTime checkOut)
    {
        // Ensure UTC kind for PostgreSQL compatibility
        checkIn  = DateTime.SpecifyKind(checkIn.Date,  DateTimeKind.Utc);
        checkOut = DateTime.SpecifyKind(checkOut.Date, DateTimeKind.Utc);

        var room   = await _roomRepository.GetByIdAsync(roomId);
        var nights = Math.Max(1, (int)(checkOut - checkIn).TotalDays);

        decimal basePrice = room.Price;
        decimal finalPrice = basePrice;
        string? appliedPlan = null;
        decimal discountAmount = 0;

        var activePlans = (await _planRepository.FindAsync(p =>
            p.IsActive &&
            (!p.ValidFrom.HasValue || p.ValidFrom.Value <= checkIn) &&
            (!p.ValidTo.HasValue   || p.ValidTo.Value   >= checkOut)))
            .OrderByDescending(p => p.Priority)
            .ToList();

        foreach (var plan in activePlans)
        {
            // Check applicable days (all nights must fall in applicable days, or plan applies to all)
            if (plan.ApplicableDays.Any())
            {
                bool anyDayMatches = false;
                for (var d = checkIn.Date; d < checkOut.Date; d = d.AddDays(1))
                    if (plan.ApplicableDays.Contains(d.DayOfWeek)) { anyDayMatches = true; break; }
                if (!anyDayMatches) continue;
            }

            // Check room-type specific override
            var roomTypeOverride = (await _rateRoomRepository.FindAsync(r =>
                r.RatePlanId == plan.Id &&
                (r.RoomType == null || r.RoomType == room.Type.ToString())))
                .FirstOrDefault();

            if (roomTypeOverride?.FixedPricePerNight.HasValue == true)
            {
                finalPrice  = roomTypeOverride.FixedPricePerNight.Value;
                appliedPlan = plan.Name;
                break;
            }

            // Apply percentage or fixed adjustment
            decimal adjusted = plan.AdjustmentType == RatePlanAdjustmentType.Percentage
                ? basePrice * (1 + plan.AdjustmentValue / 100)
                : basePrice + plan.AdjustmentValue;

            if (roomTypeOverride?.AdditionalAdjustment.HasValue == true)
                adjusted += roomTypeOverride.AdditionalAdjustment.Value;

            finalPrice  = Math.Max(0, adjusted);
            appliedPlan = plan.Name;
            break;
        }

        discountAmount = (basePrice - finalPrice) * nights;

        return new CalculatedRateDto
        {
            RoomId             = room.Id,
            RoomNumber         = room.Number,
            RoomType           = room.Type.ToString(),
            BasePrice          = basePrice,
            FinalPricePerNight = Math.Round(finalPrice, 2),
            NightCount         = nights,
            TotalPrice         = Math.Round(finalPrice * nights, 2),
            AppliedRatePlan    = appliedPlan,
            DiscountAmount     = Math.Round(discountAmount, 2)
        };
    }

    private async Task<RatePlanDto> EnrichDto(RatePlan plan)
    {
        var roomTypeRates = await _rateRoomRepository.FindAsync(r => r.RatePlanId == plan.Id);
        return new RatePlanDto
        {
            Id              = plan.Id,
            Name            = plan.Name,
            Description     = plan.Description,
            AdjustmentType  = plan.AdjustmentType.ToString(),
            AdjustmentValue = plan.AdjustmentValue,
            IsActive        = plan.IsActive,
            Priority        = plan.Priority,
            ValidFrom       = plan.ValidFrom,
            ValidTo         = plan.ValidTo,
            ApplicableDays  = plan.ApplicableDays.Select(d => (int)d).ToList(),
            CreatedAt       = plan.CreatedAt,
            RoomTypeRates   = roomTypeRates.Select(r => new RatePlanRoomTypeDto
            {
                Id                   = r.Id,
                RoomType             = r.RoomType,
                FixedPricePerNight   = r.FixedPricePerNight,
                AdditionalAdjustment = r.AdditionalAdjustment
            }).ToList()
        };
    }
}
