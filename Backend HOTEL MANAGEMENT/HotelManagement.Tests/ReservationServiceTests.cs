using HotelManagement.Business.DTOs;
using HotelManagement.Business.Interfaces;
using HotelManagement.Business.Services;
using HotelManagement.Core.Entities;
using HotelManagement.Core.Enums;
using HotelManagement.Core.Interfaces;
using HotelManagement.Infrastructure.Data;
using HotelManagement.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace HotelManagement.Tests;

public class ReservationServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly ReservationService _service;
    private readonly Mock<ICacheService> _cacheMock;
    private readonly Mock<IEmailService> _emailMock;

    public ReservationServiceTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _context = new ApplicationDbContext(options);

        _cacheMock = new Mock<ICacheService>();
        _cacheMock.Setup(c => c.RemoveAsync(It.IsAny<string>())).Returns(Task.CompletedTask);
        _cacheMock.Setup(c => c.SetAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<TimeSpan?>())).Returns(Task.CompletedTask);
        _cacheMock.Setup(c => c.GetAsync<IEnumerable<Room>>(It.IsAny<string>())).ReturnsAsync((IEnumerable<Room>?)null);

        _emailMock = new Mock<IEmailService>();
        // Throw immediately so the fire-and-forget Task.Run in CreateReservationAsync
        // exits via catch{} before touching the shared DbContext from another thread.
        _emailMock.Setup(e => e.SendReservationConfirmationAsync(
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
            It.IsAny<string>(), It.IsAny<DateTime>(), It.IsAny<DateTime>(), It.IsAny<decimal>()))
            .ThrowsAsync(new InvalidOperationException("Email disabled in tests"));

        var reservationRepo = new GenericRepository<Reservation>(_context);
        var roomRepo = new GenericRepository<Room>(_context);
        var guestRepo = new GenericRepository<Guest>(_context);

        _service = new ReservationService(reservationRepo, roomRepo, guestRepo, _cacheMock.Object, _emailMock.Object);
    }

    public void Dispose() => _context.Dispose();

    private async Task<Room> SeedRoom(string number = "101", RoomStatus status = RoomStatus.Available)
    {
        var room = new Room { Id = Guid.NewGuid(), Number = number, Type = RoomType.Double, Price = 800, Status = status, Capacity = 2, Floor = 1 };
        _context.Rooms.Add(room);
        await _context.SaveChangesAsync();
        return room;
    }

    private CreateReservationDto MakeDto(Guid roomId, DateTime checkIn, DateTime checkOut, decimal total = 1600) =>
        new CreateReservationDto
        {
            RoomId = roomId,
            CheckInDate = checkIn,
            CheckOutDate = checkOut,
            NumberOfGuests = 2,
            TotalAmount = total,
            PaidAmount = total,
            PaymentMethod = "Cash",
            PrimaryGuestName = "Ali Yilmaz",
            PrimaryGuestEmail = "ali@test.com",
            PrimaryGuestPhone = "5551234567",
            PrimaryGuestIdNumber = "11111111111",
            PrimaryGuestAddress = "Test Mah. 1/1"
        };

    // ---- CREATE ----
    [Fact]
    public async Task Create_ValidReservation_Succeeds()
    {
        var room = await SeedRoom();
        var dto = MakeDto(room.Id, DateTime.UtcNow.AddDays(1), DateTime.UtcNow.AddDays(3));

        var result = await _service.CreateReservationAsync(dto);

        Assert.NotNull(result);
        Assert.Equal("pending", result.Status);
        Assert.Equal(room.Id, result.RoomId);
    }

    [Fact]
    public async Task Create_WithFullPayment_IsPaidTrue()
    {
        var room = await SeedRoom("102");
        var dto = MakeDto(room.Id, DateTime.UtcNow.AddDays(1), DateTime.UtcNow.AddDays(3), 800);
        dto.PaidAmount = 800;

        var result = await _service.CreateReservationAsync(dto);
        Assert.True(result.IsPaid);
    }

    [Fact]
    public async Task Create_ConflictingDates_ThrowsException()
    {
        var room = await SeedRoom("103");
        var checkIn = DateTime.UtcNow.AddDays(1);
        var checkOut = DateTime.UtcNow.AddDays(4);

        // First reservation
        await _service.CreateReservationAsync(MakeDto(room.Id, checkIn, checkOut));

        // Overlapping reservation
        var conflicting = MakeDto(room.Id, checkIn.AddDays(1), checkOut.AddDays(1));
        conflicting.PrimaryGuestIdNumber = "22222222222"; // different guest
        conflicting.PrimaryGuestName = "Ayse Kaya";

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.CreateReservationAsync(conflicting));
    }

    [Fact]
    public async Task Create_AdjacentDates_Succeeds()
    {
        // Checkout date of first = Checkin date of second — should be allowed (no overlap)
        var room = await SeedRoom("104");
        var firstIn = DateTime.UtcNow.AddDays(1);
        var firstOut = DateTime.UtcNow.AddDays(3);

        await _service.CreateReservationAsync(MakeDto(room.Id, firstIn, firstOut));

        var secondDto = MakeDto(room.Id, firstOut, firstOut.AddDays(2));
        secondDto.PrimaryGuestIdNumber = "33333333333";
        secondDto.PrimaryGuestName = "Mehmet Demir";

        var result = await _service.CreateReservationAsync(secondDto);
        Assert.NotNull(result);
    }

    // ---- CONFIRM ----
    [Fact]
    public async Task Confirm_PendingReservation_Succeeds()
    {
        var room = await SeedRoom("105");
        var created = await _service.CreateReservationAsync(MakeDto(room.Id, DateTime.UtcNow.AddDays(1), DateTime.UtcNow.AddDays(3)));

        var confirmed = await _service.ConfirmAsync(created.Id);
        Assert.Equal("confirmed", confirmed.Status);
    }

    [Fact]
    public async Task Confirm_AlreadyCheckedIn_ThrowsException()
    {
        var room = await SeedRoom("106");
        var created = await _service.CreateReservationAsync(MakeDto(room.Id, DateTime.UtcNow.AddDays(-1), DateTime.UtcNow.AddDays(2)));
        await _service.ConfirmAsync(created.Id);
        await _service.CheckInAsync(created.Id);

        // Cannot confirm again
        await Assert.ThrowsAsync<InvalidOperationException>(() => _service.ConfirmAsync(created.Id));
    }

    // ---- CHECK-IN ----
    [Fact]
    public async Task CheckIn_ConfirmedReservation_UpdatesRoomToOccupied()
    {
        var room = await SeedRoom("107");
        var created = await _service.CreateReservationAsync(MakeDto(room.Id, DateTime.UtcNow.AddDays(-1), DateTime.UtcNow.AddDays(2)));
        await _service.ConfirmAsync(created.Id);

        await _service.CheckInAsync(created.Id);

        var updatedRoom = await _context.Rooms.FindAsync(room.Id);
        Assert.Equal(RoomStatus.Occupied, updatedRoom!.Status);
    }

    [Fact]
    public async Task CheckIn_PendingReservation_ThrowsException()
    {
        var room = await SeedRoom("108");
        var created = await _service.CreateReservationAsync(MakeDto(room.Id, DateTime.UtcNow.AddDays(-1), DateTime.UtcNow.AddDays(2)));
        // Not confirmed — direct check-in should fail (Pending -> CheckedIn is invalid)
        await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CheckInAsync(created.Id));
    }

    // ---- CHECK-OUT ----
    [Fact]
    public async Task CheckOut_PaidReservation_Succeeds()
    {
        var room = await SeedRoom("109");
        var created = await _service.CreateReservationAsync(MakeDto(room.Id, DateTime.UtcNow.AddDays(-1), DateTime.UtcNow.AddDays(2)));
        await _service.ConfirmAsync(created.Id);
        await _service.CheckInAsync(created.Id);

        var result = await _service.CheckOutAsync(created.Id);

        Assert.True(result.Success);
        var updatedRoom = await _context.Rooms.FindAsync(room.Id);
        Assert.Equal(RoomStatus.Cleaning, updatedRoom!.Status);
    }

    [Fact]
    public async Task CheckOut_UnpaidReservation_Blocked()
    {
        var room = await SeedRoom("110");
        var dto = MakeDto(room.Id, DateTime.UtcNow.AddDays(-1), DateTime.UtcNow.AddDays(2), 800);
        dto.PaidAmount = 0; // Not paid
        var created = await _service.CreateReservationAsync(dto);
        await _service.ConfirmAsync(created.Id);
        await _service.CheckInAsync(created.Id);

        var result = await _service.CheckOutAsync(created.Id, forceCheckout: false);

        Assert.False(result.Success);
        Assert.True(result.RequiresPayment);
        Assert.Equal(800, result.RemainingAmount);
    }

    [Fact]
    public async Task CheckOut_ForceCheckout_Succeeds_EvenUnpaid()
    {
        var room = await SeedRoom("111");
        var dto = MakeDto(room.Id, DateTime.UtcNow.AddDays(-1), DateTime.UtcNow.AddDays(2), 800);
        dto.PaidAmount = 0;
        var created = await _service.CreateReservationAsync(dto);
        await _service.ConfirmAsync(created.Id);
        await _service.CheckInAsync(created.Id);

        var result = await _service.CheckOutAsync(created.Id, forceCheckout: true, forceReason: "Acil cikarma");

        Assert.True(result.Success);
    }

    // ---- CANCEL ----
    [Fact]
    public async Task Cancel_PendingReservation_Succeeds()
    {
        var room = await SeedRoom("112");
        var created = await _service.CreateReservationAsync(MakeDto(room.Id, DateTime.UtcNow.AddDays(1), DateTime.UtcNow.AddDays(3)));
        await Task.Delay(50); // Let fire-and-forget email task complete/fail

        var cancelled = await _service.CancelAsync(created.Id, "Misafir iptal etti");
        Assert.Equal("cancelled", cancelled.Status);
    }

    [Fact]
    public async Task Cancel_ConfirmedReservation_Succeeds()
    {
        var room = await SeedRoom("113");
        var created = await _service.CreateReservationAsync(MakeDto(room.Id, DateTime.UtcNow.AddDays(1), DateTime.UtcNow.AddDays(3)));
        await _service.ConfirmAsync(created.Id);

        var cancelled = await _service.CancelAsync(created.Id);
        Assert.Equal("cancelled", cancelled.Status);
    }

    [Fact]
    public async Task Cancel_CheckedInReservation_ThrowsException()
    {
        var room = await SeedRoom("114");
        var created = await _service.CreateReservationAsync(MakeDto(room.Id, DateTime.UtcNow.AddDays(-1), DateTime.UtcNow.AddDays(2)));
        await _service.ConfirmAsync(created.Id);
        await _service.CheckInAsync(created.Id);

        await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CancelAsync(created.Id));
    }

    // ---- RESERVATION STATE MACHINE ----
    [Theory]
    [InlineData(ReservationStatus.Pending, ReservationStatus.Confirmed, true)]
    [InlineData(ReservationStatus.Pending, ReservationStatus.Cancelled, true)]
    [InlineData(ReservationStatus.Pending, ReservationStatus.CheckedIn, false)]
    [InlineData(ReservationStatus.Pending, ReservationStatus.CheckedOut, false)]
    [InlineData(ReservationStatus.Confirmed, ReservationStatus.CheckedIn, true)]
    [InlineData(ReservationStatus.Confirmed, ReservationStatus.Cancelled, true)]
    [InlineData(ReservationStatus.Confirmed, ReservationStatus.CheckedOut, false)]
    [InlineData(ReservationStatus.CheckedIn, ReservationStatus.CheckedOut, true)]
    [InlineData(ReservationStatus.CheckedIn, ReservationStatus.Cancelled, false)]
    [InlineData(ReservationStatus.CheckedOut, ReservationStatus.Pending, false)]
    [InlineData(ReservationStatus.Cancelled, ReservationStatus.Pending, false)]
    public void ReservationStateMachine_TransitionsAreCorrect(ReservationStatus from, ReservationStatus to, bool expected)
    {
        var reservation = new Reservation { Id = Guid.NewGuid(), Status = from, GuestId = Guid.NewGuid(), RoomId = Guid.NewGuid(), CheckInDate = DateTime.UtcNow, CheckOutDate = DateTime.UtcNow.AddDays(1), TotalAmount = 100 };
        Assert.Equal(expected, reservation.CanTransitionTo(to));
    }
}
