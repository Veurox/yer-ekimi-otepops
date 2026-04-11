using HotelManagement.Core.Entities;
using Microsoft.EntityFrameworkCore;
using System.Reflection;

namespace HotelManagement.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }


    public DbSet<Room> Rooms { get; set; }
    public DbSet<Staff> Staff { get; set; }
    public DbSet<Guest> Guests { get; set; }
    public DbSet<Reservation> Reservations { get; set; }
    public DbSet<MaintenanceRequest> MaintenanceRequests { get; set; }
    public DbSet<MenuItem> MenuItems { get; set; }
    public DbSet<RoomServiceOrder> RoomServiceOrders { get; set; }
    public DbSet<InventoryItem> InventoryItems { get; set; }
    public DbSet<Payment> Payments { get; set; }
    public DbSet<Invoice> Invoices { get; set; }
    public DbSet<InvoiceLineItem> InvoiceLineItems { get; set; }
    public DbSet<RatePlan> RatePlans { get; set; }
    public DbSet<RatePlanRoomType> RatePlanRoomTypes { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }

    // Faz 4
    public DbSet<PosTransaction> PosTransactions { get; set; }
    public DbSet<HousekeepingTask> HousekeepingTasks { get; set; }

    // Faz 3
    public DbSet<GuestPreference> GuestPreferences { get; set; }
    public DbSet<GuestNote> GuestNotes { get; set; }
    public DbSet<DynamicPricingRule> DynamicPricingRules { get; set; }
    public DbSet<LoyaltyTransaction> LoyaltyTransactions { get; set; }
    public DbSet<GuestSurvey> GuestSurveys { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // Apply all configurations from the current assembly
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
    }
    
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        // Ensure lazy loading is disabled (it is by default unless proxies are used, but user asked for "Lazy loading KAPALI")
        // No action needed for default, but sticking to explicit configuration via Program.cs is better.
        base.OnConfiguring(optionsBuilder);
    }
}
