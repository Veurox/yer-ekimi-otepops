using HotelManagement.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HotelManagement.Infrastructure.Data.Configurations;

public class InvoiceConfiguration : IEntityTypeConfiguration<Invoice>
{
    public void Configure(EntityTypeBuilder<Invoice> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.InvoiceNumber)
            .HasMaxLength(30)
            .IsRequired();

        builder.HasIndex(x => x.InvoiceNumber)
            .IsUnique();

        builder.Property(x => x.RoomCharges).HasPrecision(18, 2);
        builder.Property(x => x.RoomServiceCharges).HasPrecision(18, 2);
        builder.Property(x => x.OtherCharges).HasPrecision(18, 2);
        builder.Property(x => x.Discount).HasPrecision(18, 2);
        builder.Property(x => x.TaxRate).HasPrecision(5, 4);
        builder.Property(x => x.TaxAmount).HasPrecision(18, 2);
        builder.Property(x => x.SubTotal).HasPrecision(18, 2);
        builder.Property(x => x.TotalAmount).HasPrecision(18, 2);

        builder.Property(x => x.Currency).HasMaxLength(3);

        builder.Property(x => x.Status)
            .HasConversion<string>();

        builder.HasOne(x => x.Reservation)
            .WithMany()
            .HasForeignKey(x => x.ReservationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Guest)
            .WithMany()
            .HasForeignKey(x => x.GuestId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.LineItems)
            .WithOne(x => x.Invoice)
            .HasForeignKey(x => x.InvoiceId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class InvoiceLineItemConfiguration : IEntityTypeConfiguration<InvoiceLineItem>
{
    public void Configure(EntityTypeBuilder<InvoiceLineItem> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Description).HasMaxLength(300).IsRequired();
        builder.Property(x => x.Category).HasMaxLength(50);
        builder.Property(x => x.UnitPrice).HasPrecision(18, 2);
        builder.Property(x => x.TotalPrice).HasPrecision(18, 2);
    }
}
