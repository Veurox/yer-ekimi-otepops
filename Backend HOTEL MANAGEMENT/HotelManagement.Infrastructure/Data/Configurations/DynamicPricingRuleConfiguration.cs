using HotelManagement.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HotelManagement.Infrastructure.Data.Configurations;

public class DynamicPricingRuleConfiguration : IEntityTypeConfiguration<DynamicPricingRule>
{
    public void Configure(EntityTypeBuilder<DynamicPricingRule> builder)
    {
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Name).HasMaxLength(200).IsRequired();
        builder.Property(r => r.Trigger).HasConversion<string>().HasMaxLength(50);
        builder.Property(r => r.ThresholdValue).HasPrecision(10, 2);
        builder.Property(r => r.AdjustmentPercent).HasPrecision(10, 2);
    }
}
