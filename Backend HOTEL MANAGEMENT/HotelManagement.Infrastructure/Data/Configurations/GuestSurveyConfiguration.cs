using HotelManagement.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HotelManagement.Infrastructure.Data.Configurations;

public class GuestSurveyConfiguration : IEntityTypeConfiguration<GuestSurvey>
{
    public void Configure(EntityTypeBuilder<GuestSurvey> builder)
    {
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Comments).HasMaxLength(2000);
        builder.HasIndex(s => s.GuestId);
        builder.HasIndex(s => s.ReservationId);
    }
}
