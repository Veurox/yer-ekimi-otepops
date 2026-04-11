using HotelManagement.Business.DTOs;

namespace HotelManagement.Business.Interfaces;

public interface IGuestCrmService
{
    Task<GuestProfileDto> GetProfileAsync(Guid guestId);
    Task AddPreferenceAsync(Guid guestId, AddPreferenceDto dto);
    Task DeletePreferenceAsync(Guid preferenceId);
    Task AddNoteAsync(Guid guestId, AddNoteDto dto, string? addedByUserName);
    Task DeleteNoteAsync(Guid noteId);
    Task RecalculateStatsAsync(Guid guestId);
}
