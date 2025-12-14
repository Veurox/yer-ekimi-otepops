using HotelManagement.Business.DTOs;

namespace HotelManagement.Business.Interfaces;

public interface IRoomService
{
    Task<IEnumerable<RoomDto>> GetAllRoomsAsync();
    Task<RoomDto?> GetRoomByIdAsync(Guid id);
    Task<RoomDto> CreateRoomAsync(CreateRoomDto dto);
    Task UpdateRoomAsync(UpdateRoomDto dto);
    Task DeleteRoomAsync(Guid id);
    Task CompleteCleaningAsync(Guid roomId);
}
