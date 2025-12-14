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
