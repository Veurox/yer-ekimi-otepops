using HotelManagement.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HotelManagement.Infrastructure.Data.Configurations;

public class RatePlanConfiguration : IEntityTypeConfiguration<RatePlan>
{
    public void Configure(EntityTypeBuilder<RatePlan> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(x => x.Description)
            .HasMaxLength(300);

        builder.Property(x => x.AdjustmentType)
            .HasConversion<string>();

        builder.Property(x => x.AdjustmentValue)
            .HasPrecision(8, 2);

        // Store DayOfWeek list as JSON array
        builder.Property(x => x.ApplicableDays)
            .HasConversion(
                v => string.Join(",", v.Select(d => (int)d)),
                v => string.IsNullOrEmpty(v)
                    ? new List<DayOfWeek>()
                    : v.Split(',', StringSplitOptions.RemoveEmptyEntries)
                       .Select(s => (DayOfWeek)int.Parse(s))
                       .ToList()
            );

        builder.HasMany(x => x.RoomTypeRates)
            .WithOne(x => x.RatePlan)
            .HasForeignKey(x => x.RatePlanId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class RatePlanRoomTypeConfiguration : IEntityTypeConfiguration<RatePlanRoomType>
{
    public void Configure(EntityTypeBuilder<RatePlanRoomType> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.RoomType).HasMaxLength(50);
        builder.Property(x => x.FixedPricePerNight).HasPrecision(18, 2);
        builder.Property(x => x.AdditionalAdjustment).HasPrecision(8, 2);
    }
}
