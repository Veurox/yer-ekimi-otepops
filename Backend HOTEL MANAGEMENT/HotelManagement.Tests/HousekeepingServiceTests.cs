using HotelManagement.Business.DTOs;
using HotelManagement.Business.Services;
using HotelManagement.Core.Entities;
using HotelManagement.Core.Enums;
using HotelManagement.Infrastructure.Data;
using HotelManagement.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Tests;

public class HousekeepingServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly HousekeepingService _service;

    public HousekeepingServiceTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);

        var taskRepo = new GenericRepository<HousekeepingTask>(_context);
        var roomRepo = new GenericRepository<Room>(_context);
        var staffRepo = new GenericRepository<Staff>(_context);

        _service = new HousekeepingService(taskRepo, roomRepo, staffRepo);
    }

    public void Dispose() => _context.Dispose();

    private async Task<Room> SeedRoom(RoomStatus status = RoomStatus.Occupied)
    {
        var room = new Room { Id = Guid.NewGuid(), Number = "101", Type = RoomType.Single, Price = 500, Status = status, Capacity = 2, Floor = 1 };
        _context.Rooms.Add(room);
        await _context.SaveChangesAsync();
        return room;
    }

    [Fact]
    public async Task CreateTask_ValidRoom_Succeeds()
    {
        var room = await SeedRoom();

        var dto = new CreateHousekeepingTaskDto
        {
            RoomId = room.Id,
            TaskType = HousekeepingTaskType.DailyClean,
            Priority = 2,
            Notes = "Standart temizlik",
            ScheduledDate = DateTime.UtcNow.Date
        };

        var result = await _service.CreateTaskAsync(dto);

        Assert.NotNull(result);
        Assert.Equal("DailyClean", result.TaskType);
        Assert.Equal("Pending", result.Status);
    }

    [Fact]
    public async Task UpdateStatus_ToCompleted_SetsRoomToAvailable()
    {
        var room = await SeedRoom(RoomStatus.Occupied);
        var task = new HousekeepingTask
        {
            Id = Guid.NewGuid(),
            RoomId = room.Id,
            TaskType = HousekeepingTaskType.CheckoutClean,
            Status = HousekeepingStatus.InProgress,
            Priority = 3,
            ScheduledDate = DateTime.UtcNow.Date,
            CreatedAt = DateTime.UtcNow
        };
        _context.HousekeepingTasks.Add(task);
        await _context.SaveChangesAsync();

        var result = await _service.UpdateStatusAsync(task.Id, "Completed");

        Assert.Equal("Completed", result.Status);

        var updatedRoom = await _context.Rooms.FindAsync(room.Id);
        Assert.Equal(RoomStatus.Available, updatedRoom!.Status);
    }

    [Fact]
    public async Task GetTasks_FilteredByStatus_ReturnsMatching()
    {
        var room = await SeedRoom();
        _context.HousekeepingTasks.AddRange(
            new HousekeepingTask { Id = Guid.NewGuid(), RoomId = room.Id, TaskType = HousekeepingTaskType.DailyClean, Status = HousekeepingStatus.Pending, Priority = 1, ScheduledDate = DateTime.UtcNow.Date, CreatedAt = DateTime.UtcNow },
            new HousekeepingTask { Id = Guid.NewGuid(), RoomId = room.Id, TaskType = HousekeepingTaskType.DeepClean, Status = HousekeepingStatus.Completed, Priority = 2, ScheduledDate = DateTime.UtcNow.Date, CreatedAt = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        var result = await _service.GetTasksAsync(status: "Pending");

        Assert.Single(result);
        Assert.All(result, t => Assert.Equal("Pending", t.Status));
    }

    [Fact]
    public async Task GetSummary_ReturnsCorrectCounts()
    {
        var room = await SeedRoom();
        var today = DateTime.UtcNow.Date;
        _context.HousekeepingTasks.AddRange(
            new HousekeepingTask { Id = Guid.NewGuid(), RoomId = room.Id, TaskType = HousekeepingTaskType.DailyClean, Status = HousekeepingStatus.Pending, Priority = 1, ScheduledDate = today, CreatedAt = DateTime.UtcNow },
            new HousekeepingTask { Id = Guid.NewGuid(), RoomId = room.Id, TaskType = HousekeepingTaskType.TurnDown, Status = HousekeepingStatus.InProgress, Priority = 2, ScheduledDate = today, CreatedAt = DateTime.UtcNow },
            new HousekeepingTask { Id = Guid.NewGuid(), RoomId = room.Id, TaskType = HousekeepingTaskType.CheckoutClean, Status = HousekeepingStatus.Completed, Priority = 3, ScheduledDate = today, CreatedAt = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        var summary = await _service.GetTodaysSummaryAsync();

        Assert.Equal(1, summary.Pending);
        Assert.Equal(1, summary.InProgress);
        Assert.Equal(1, summary.Completed);
        Assert.Equal(3, summary.Total);
    }
}
