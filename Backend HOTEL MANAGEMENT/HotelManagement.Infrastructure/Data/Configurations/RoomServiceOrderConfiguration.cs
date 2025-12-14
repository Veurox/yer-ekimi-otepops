using HotelManagement.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HotelManagement.Infrastructure.Data.Configurations;

public class RoomServiceOrderConfiguration : IEntityTypeConfiguration<RoomServiceOrder>
{
    public void Configure(EntityTypeBuilder<RoomServiceOrder> builder)
    {
        builder.HasKey(x => x.Id);
        
        builder.Property(x => x.TotalPrice)
            .HasPrecision(18, 2);

        builder.Property(x => x.Status)
            .HasConversion<string>();

        builder.HasOne(x => x.Room)
            .WithMany()
            .HasForeignKey(x => x.RoomId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(x => x.Items)
            .WithOne()
            .HasForeignKey(x => x.RoomServiceOrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
