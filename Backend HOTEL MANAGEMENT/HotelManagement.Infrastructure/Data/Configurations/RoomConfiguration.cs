using HotelManagement.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HotelManagement.Infrastructure.Data.Configurations;

public class RoomConfiguration : IEntityTypeConfiguration<Room>
{
    public void Configure(EntityTypeBuilder<Room> builder)
    {
        builder.HasKey(x => x.Id);
        
        builder.Property(x => x.Number)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(x => x.Price)
            .HasPrecision(18, 2);

        // One-to-Many: Hotel -> Rooms (If Hotel implies this, but Hotel entity has List<Room>)
        // Assuming HotelId is in Room? I missed checking HotelId in Room during Core refactor!
        // Let's check Room again. If it lacks HotelId, I need to add it to Entity first.
    }
}
