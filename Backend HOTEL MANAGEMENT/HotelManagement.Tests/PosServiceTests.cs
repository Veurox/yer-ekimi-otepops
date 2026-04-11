using HotelManagement.Business.DTOs;
using HotelManagement.Business.Services;
using HotelManagement.Core.Entities;
using HotelManagement.Core.Enums;
using HotelManagement.Infrastructure.Data;
using HotelManagement.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Tests;

public class PosServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly PosService _service;

    public PosServiceTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);

        var posRepo = new GenericRepository<PosTransaction>(_context);
        var reservationRepo = new GenericRepository<Reservation>(_context);
        var guestRepo = new GenericRepository<Guest>(_context);
        var roomRepo = new GenericRepository<Room>(_context);
        var paymentRepo = new GenericRepository<Payment>(_context);

        _service = new PosService(posRepo, reservationRepo, guestRepo, roomRepo, paymentRepo);
    }

    public void Dispose() => _context.Dispose();

    private async Task<(Room room, Guest guest, Reservation reservation)> SeedActiveReservation()
    {
        var room = new Room { Id = Guid.NewGuid(), Number = "101", Type = RoomType.Single, Price = 500, Status = RoomStatus.Occupied, Capacity = 2, Floor = 1 };
        var guest = new Guest { Id = Guid.NewGuid(), Name = "Ali Yilmaz", Email = "ali@test.com", Phone = "5551234567", IdNumber = "12345678901" };
        var reservation = new Reservation
        {
            Id = Guid.NewGuid(),
            RoomId = room.Id,
            GuestId = guest.Id,
            CheckInDate = DateTime.UtcNow.AddDays(-1),
            CheckOutDate = DateTime.UtcNow.AddDays(2),
            TotalAmount = 1000,
            Status = ReservationStatus.CheckedIn,
            CreatedAt = DateTime.UtcNow
        };

        _context.Rooms.Add(room);
        _context.Guests.Add(guest);
        _context.Reservations.Add(reservation);
        await _context.SaveChangesAsync();

        return (room, guest, reservation);
    }

    [Fact]
    public async Task CreateTransaction_ForCheckedInReservation_Succeeds()
    {
        var (_, _, reservation) = await SeedActiveReservation();

        var dto = new CreatePosTransactionDto
        {
            ReservationId = reservation.Id,
            Description = "Akşam yemeği",
            Amount = 150,
            Category = PosCategory.Restaurant,
            CreatedBy = "receptionist1"
        };

        var result = await _service.CreateTransactionAsync(dto);

        Assert.NotNull(result);
        Assert.Equal(150, result.Amount);
        Assert.Equal("Pending", result.Status);
    }

    [Fact]
    public async Task CreateTransaction_ForCancelledReservation_ThrowsException()
    {
        var room = new Room { Id = Guid.NewGuid(), Number = "102", Type = RoomType.Double, Price = 800, Status = RoomStatus.Available, Capacity = 2, Floor = 1 };
        var guest = new Guest { Id = Guid.NewGuid(), Name = "Ayse Kaya", Email = "ayse@test.com", Phone = "5559876543", IdNumber = "98765432101" };
        var reservation = new Reservation
        {
            Id = Guid.NewGuid(),
            RoomId = room.Id,
            GuestId = guest.Id,
            CheckInDate = DateTime.UtcNow,
            CheckOutDate = DateTime.UtcNow.AddDays(1),
            TotalAmount = 800,
            Status = ReservationStatus.Cancelled,
            CreatedAt = DateTime.UtcNow
        };
        _context.Rooms.Add(room);
        _context.Guests.Add(guest);
        _context.Reservations.Add(reservation);
        await _context.SaveChangesAsync();

        var dto = new CreatePosTransactionDto
        {
            ReservationId = reservation.Id,
            Description = "Bar içeceği",
            Amount = 50,
            Category = PosCategory.Bar,
            CreatedBy = "staff1"
        };

        await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CreateTransactionAsync(dto));
    }

    [Fact]
    public async Task GetTransactions_ReturnsAllTransactions()
    {
        var (room, guest, reservation) = await SeedActiveReservation();

        _context.PosTransactions.AddRange(
            new PosTransaction { Id = Guid.NewGuid(), ReservationId = reservation.Id, GuestId = guest.Id, RoomId = room.Id, Description = "Kahvaltı", Amount = 80, Category = PosCategory.Restaurant, Status = PosStatus.Pending, CreatedBy = "staff", CreatedAt = DateTime.UtcNow },
            new PosTransaction { Id = Guid.NewGuid(), ReservationId = reservation.Id, GuestId = guest.Id, RoomId = room.Id, Description = "Spa", Amount = 200, Category = PosCategory.Spa, Status = PosStatus.ChargedToRoom, CreatedBy = "staff", CreatedAt = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        var result = await _service.GetTransactionsAsync();

        Assert.Equal(2, result.Count());
    }

    [Fact]
    public async Task GetTransactions_FilteredByReservation_ReturnsOnlyMatching()
    {
        var (room, guest, reservation) = await SeedActiveReservation();
        var otherId = Guid.NewGuid();

        _context.PosTransactions.AddRange(
            new PosTransaction { Id = Guid.NewGuid(), ReservationId = reservation.Id, GuestId = guest.Id, RoomId = room.Id, Description = "Kahvaltı", Amount = 80, Category = PosCategory.Restaurant, Status = PosStatus.Pending, CreatedBy = "staff", CreatedAt = DateTime.UtcNow },
            new PosTransaction { Id = Guid.NewGuid(), ReservationId = otherId, GuestId = guest.Id, RoomId = room.Id, Description = "Diğer", Amount = 50, Category = PosCategory.Bar, Status = PosStatus.Pending, CreatedBy = "staff", CreatedAt = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        var result = await _service.GetTransactionsAsync(reservation.Id);

        Assert.Single(result);
        Assert.Equal("Kahvaltı", result.First().Description);
    }
}
