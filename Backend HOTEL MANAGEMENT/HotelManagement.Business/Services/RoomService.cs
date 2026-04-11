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
        await _cacheService.SetAsync(CacheKey, dtos, TimeSpan.FromMinutes(5));

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
        // Validate price
        if (dto.Price < 0)
            throw new InvalidOperationException("Oda fiyati negatif olamaz.");

        // Validate capacity
        if (dto.Capacity <= 0 || dto.Capacity > 20)
            throw new InvalidOperationException("Oda kapasitesi 1-20 arasi olmali.");

        // Validate room number uniqueness
        var existing = await _repository.FindAsync(r => r.Number == dto.Number);
        if (existing.Any())
            throw new InvalidOperationException($"'{dto.Number}' numarali oda zaten mevcut.");

        if (!Enum.TryParse<RoomType>(dto.Type, true, out var roomType))
        {
            roomType = RoomType.Single;
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
            Status = RoomStatus.Available
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

        // Validate price
        if (dto.Price < 0)
            throw new InvalidOperationException("Oda fiyati negatif olamaz.");

        // Validate room number uniqueness (if changed)
        if (room.Number != dto.Number)
        {
            var existing = await _repository.FindAsync(r => r.Number == dto.Number && r.Id != dto.Id);
            if (existing.Any())
                throw new InvalidOperationException($"'{dto.Number}' numarali oda zaten mevcut.");
        }

        room.Number = dto.Number;

        if (Enum.TryParse<RoomType>(dto.Type, true, out var roomType))
        {
            room.Type = roomType;
        }

        room.Price = dto.Price;

        // Status change with state machine validation
        if (Enum.TryParse<RoomStatus>(dto.Status, true, out var newStatus))
        {
            if (newStatus != room.Status)
            {
                room.TransitionTo(newStatus);
            }
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

        // State machine enforces: only Cleaning -> Available
        room.TransitionTo(RoomStatus.Available);

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
