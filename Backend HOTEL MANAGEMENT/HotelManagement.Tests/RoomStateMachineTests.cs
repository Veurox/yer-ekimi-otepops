using HotelManagement.Core.Entities;
using HotelManagement.Core.Enums;

namespace HotelManagement.Tests;

public class RoomStateMachineTests
{
    private static Room CreateRoom(RoomStatus status) => new Room
    {
        Id = Guid.NewGuid(),
        Number = "101",
        Type = RoomType.Single,
        Price = 500,
        Status = status,
        Capacity = 2,
        Floor = 1
    };

    [Fact]
    public void Available_CanTransitionTo_Occupied()
    {
        var room = CreateRoom(RoomStatus.Available);
        Assert.True(room.CanTransitionTo(RoomStatus.Occupied));
    }

    [Fact]
    public void Available_CanTransitionTo_Maintenance()
    {
        var room = CreateRoom(RoomStatus.Available);
        Assert.True(room.CanTransitionTo(RoomStatus.Maintenance));
    }

    [Fact]
    public void Available_CanTransitionTo_Reserved()
    {
        var room = CreateRoom(RoomStatus.Available);
        Assert.True(room.CanTransitionTo(RoomStatus.Reserved));
    }

    [Fact]
    public void Available_CannotTransitionTo_Cleaning()
    {
        var room = CreateRoom(RoomStatus.Available);
        Assert.False(room.CanTransitionTo(RoomStatus.Cleaning));
    }

    [Fact]
    public void Occupied_CanTransitionTo_Cleaning()
    {
        var room = CreateRoom(RoomStatus.Occupied);
        Assert.True(room.CanTransitionTo(RoomStatus.Cleaning));
    }

    [Fact]
    public void Occupied_CannotTransitionTo_Available_Directly()
    {
        var room = CreateRoom(RoomStatus.Occupied);
        Assert.False(room.CanTransitionTo(RoomStatus.Available));
    }

    [Fact]
    public void Cleaning_CanTransitionTo_Available()
    {
        var room = CreateRoom(RoomStatus.Cleaning);
        Assert.True(room.CanTransitionTo(RoomStatus.Available));
    }

    [Fact]
    public void Maintenance_CanTransitionTo_Available()
    {
        var room = CreateRoom(RoomStatus.Maintenance);
        Assert.True(room.CanTransitionTo(RoomStatus.Available));
    }

    [Fact]
    public void TransitionTo_ValidTransition_ChangesStatus()
    {
        var room = CreateRoom(RoomStatus.Available);
        room.TransitionTo(RoomStatus.Occupied);
        Assert.Equal(RoomStatus.Occupied, room.Status);
    }

    [Fact]
    public void TransitionTo_InvalidTransition_ThrowsException()
    {
        var room = CreateRoom(RoomStatus.Available);
        Assert.Throws<InvalidOperationException>(() => room.TransitionTo(RoomStatus.Cleaning));
    }
}
