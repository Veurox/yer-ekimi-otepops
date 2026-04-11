using HotelManagement.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HotelManagement.Infrastructure.Data.Configurations;

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.EntityName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.EntityId)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.Action)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.ChangedBy)
            .HasMaxLength(200);

        builder.Property(x => x.OldValues)
            .HasMaxLength(4000);

        builder.Property(x => x.NewValues)
            .HasMaxLength(4000);

        builder.Property(x => x.Notes)
            .HasMaxLength(1000);

        builder.Property(x => x.Timestamp)
            .IsRequired();

        // No cascade deletes — audit logs are independent
        builder.HasIndex(x => new { x.EntityName, x.EntityId });
        builder.HasIndex(x => x.Timestamp);
    }
}
