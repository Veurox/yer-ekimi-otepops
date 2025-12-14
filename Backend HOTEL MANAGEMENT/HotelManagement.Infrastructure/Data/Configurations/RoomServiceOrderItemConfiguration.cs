using HotelManagement.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HotelManagement.Infrastructure.Data.Configurations;

public class RoomServiceOrderItemConfiguration : IEntityTypeConfiguration<RoomServiceOrderItem>
{
    public void Configure(EntityTypeBuilder<RoomServiceOrderItem> builder)
    {
        builder.HasKey(x => x.Id);
        
        builder.HasOne(x => x.MenuItem)
            .WithMany()
            .HasForeignKey(x => x.MenuItemId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
