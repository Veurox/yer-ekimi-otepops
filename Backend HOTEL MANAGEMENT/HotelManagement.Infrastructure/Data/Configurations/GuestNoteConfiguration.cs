using HotelManagement.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HotelManagement.Infrastructure.Data.Configurations;

public class GuestNoteConfiguration : IEntityTypeConfiguration<GuestNote>
{
    public void Configure(EntityTypeBuilder<GuestNote> builder)
    {
        builder.HasKey(n => n.Id);
        builder.Property(n => n.Note).HasMaxLength(2000).IsRequired();
        builder.Property(n => n.AddedBy).HasMaxLength(200);
        builder.HasOne(n => n.Guest).WithMany(g => g.Notes)
               .HasForeignKey(n => n.GuestId).OnDelete(DeleteBehavior.Cascade);
    }
}
