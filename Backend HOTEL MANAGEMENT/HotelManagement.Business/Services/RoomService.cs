using HotelManagement.Business.DTOs;
using HotelManagement.Business.Interfaces;
using HotelManagement.Core.Entities;
using HotelManagement.Core.Interfaces;
using HotelManagement.Core.Enums;

namespace HotelManagement.Business.Services;

public class RoomService : IRoomService
{
    private readonly IGenericRepository<Room> _repository;
    private readonly ICacheService _cacheService;
    private const string CacheKey = "all_rooms";

    public RoomService(IGenericRepository<Room> repository, ICacheService cacheService)
    {
        _repository = repository;
        _cacheService = cacheService;
    }

    public async Task<IEnumerable<RoomDto>> GetAllRoomsAsync()
    {
        // 1. Check Cache
        var cachedRooms = await _cacheService.GetAsync<List<RoomDto>>(CacheKey);
        if (cachedRooms != null)
        {
            return cachedRooms;
        }

        // 2. Fetch from DB
        var rooms = await _repository.GetAllAsync();
        var dtos = rooms.Select(MapToDto).ToList();

        // 3. Set Cache
        await _cacheService.SetAsync(CacheKey, dtos, TimeSpan.FromMinutes(30));

        return dtos;
    }

    public async Task<RoomDto?> GetRoomByIdAsync(Guid id)
    {
        var room = await _repository.GetByIdAsync(id);
        if (room == null) return null;
        return MapToDto(room);
    }

    public async Task<RoomDto> CreateRoomAsync(CreateRoomDto dto)
    {
        // Parse Type string to enum
        if (!Enum.TryParse<RoomType>(dto.Type, true, out var roomType))
        {
            roomType = RoomType.Single; // Default fallback
        }
        
        var room = new Room
        {
            Id = Guid.NewGuid(),
            Number = dto.Number,
            Type = roomType,
            Price = dto.Price,
            Floor = dto.Floor,
            Capacity = dto.Capacity,
            Features = dto.Features,
            Status = RoomStatus.Available // Default
        };

        await _repository.AddAsync(room);
        await _repository.SaveChangesAsync();
        await _cacheService.RemoveAsync(CacheKey);

        return MapToDto(room);
    }

    public async Task UpdateRoomAsync(UpdateRoomDto dto)
    {
        var room = await _repository.GetByIdAsync(dto.Id);
        if (room == null) throw new KeyNotFoundException($"Room {dto.Id} not found");

        room.Number = dto.Number;
        
        // Parse Type string to enum
        if (Enum.TryParse<RoomType>(dto.Type, true, out var roomType))
        {
            room.Type = roomType;
        }
        
        room.Price = dto.Price;
        
        // Parse Status string to enum
        if (Enum.TryParse<RoomStatus>(dto.Status, true, out var roomStatus))
        {
            room.Status = roomStatus;
        }
        
        room.Floor = dto.Floor;
        room.Capacity = dto.Capacity;
        room.Features = dto.Features;

        await _repository.UpdateAsync(room);
        await _repository.SaveChangesAsync();
        await _cacheService.RemoveAsync(CacheKey);
    }

    public async Task DeleteRoomAsync(Guid id)
    {
        var room = await _repository.GetByIdAsync(id);
        if (room == null) throw new KeyNotFoundException($"Room {id} not found");

        await _repository.DeleteAsync(room); // GenericRepository now takes Entity
        await _repository.SaveChangesAsync();
        await _cacheService.RemoveAsync(CacheKey);
    }

    public async Task CompleteCleaningAsync(Guid roomId)
    {
        var room = await _repository.GetByIdAsync(roomId);
        if (room == null) throw new KeyNotFoundException($"Room {roomId} not found");

        // Consider validating if room.Status == RoomStatus.Cleaning
        // For flexibility, maybe allow cleaning from other states or enforce strict flow
        if (room.Status != RoomStatus.Cleaning)
        {
            // You can either throw exception or just allow it.
            // Let's enforce strict flow for better control:
            throw new InvalidOperationException($"Room {room.Number} is not in Cleaning status (Current: {room.Status})");
        }

        room.Status = RoomStatus.Available;
        await _repository.UpdateAsync(room);
        await _repository.SaveChangesAsync();
        await _cacheService.RemoveAsync(CacheKey);
    }

    // Manual Mapping Helper
    private static RoomDto MapToDto(Room room)
    {
        return new RoomDto
        {
            Id = room.Id,
            Number = room.Number,
            Type = room.Type.ToString().ToLower(),
            Price = room.Price,
            Status = room.Status.ToString().ToLower(),
            Floor = room.Floor,
            Capacity = room.Capacity,
            Features = room.Features
        };
    }
}
