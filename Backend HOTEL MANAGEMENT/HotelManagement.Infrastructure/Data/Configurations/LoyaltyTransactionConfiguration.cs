using HotelManagement.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HotelManagement.Infrastructure.Data.Configurations;

public class LoyaltyTransactionConfiguration : IEntityTypeConfiguration<LoyaltyTransaction>
{
    public void Configure(EntityTypeBuilder<LoyaltyTransaction> builder)
    {
        builder.HasKey(t => t.Id);
        builder.Property(t => t.TransactionType).HasMaxLength(50).IsRequired();
        builder.Property(t => t.Description).HasMaxLength(500).IsRequired();
        builder.HasOne(t => t.Guest).WithMany()
               .HasForeignKey(t => t.GuestId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(t => t.GuestId);
    }
}
