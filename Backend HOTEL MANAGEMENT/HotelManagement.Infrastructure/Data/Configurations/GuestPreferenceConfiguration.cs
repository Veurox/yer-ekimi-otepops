using HotelManagement.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HotelManagement.Infrastructure.Data.Configurations;

public class GuestPreferenceConfiguration : IEntityTypeConfiguration<GuestPreference>
{
    public void Configure(EntityTypeBuilder<GuestPreference> builder)
    {
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Category).HasMaxLength(100).IsRequired();
        builder.Property(p => p.Key).HasMaxLength(200).IsRequired();
        builder.Property(p => p.Value).HasMaxLength(500).IsRequired();
        builder.Property(p => p.Notes).HasMaxLength(1000);
        builder.HasOne(p => p.Guest).WithMany(g => g.Preferences)
               .HasForeignKey(p => p.GuestId).OnDelete(DeleteBehavior.Cascade);
    }
}
