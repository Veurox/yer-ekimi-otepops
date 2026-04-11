using HotelManagement.Business.DTOs;
using HotelManagement.Business.Interfaces;
using HotelManagement.Core.Entities;
using HotelManagement.Core.Interfaces;

namespace HotelManagement.Business.Services;

public class GuestCrmService : IGuestCrmService
{
    private readonly IGenericRepository<Guest> _guestRepo;
    private readonly IGenericRepository<GuestPreference> _prefRepo;
    private readonly IGenericRepository<GuestNote> _noteRepo;
    private readonly IGenericRepository<Reservation> _resRepo;
    private readonly IGenericRepository<Room> _roomRepo;

    public GuestCrmService(
        IGenericRepository<Guest> guestRepo,
        IGenericRepository<GuestPreference> prefRepo,
        IGenericRepository<GuestNote> noteRepo,
        IGenericRepository<Reservation> resRepo,
        IGenericRepository<Room> roomRepo)
    {
        _guestRepo = guestRepo;
        _prefRepo = prefRepo;
        _noteRepo = noteRepo;
        _resRepo = resRepo;
        _roomRepo = roomRepo;
    }

    public async Task<GuestProfileDto> GetProfileAsync(Guid guestId)
    {
        var guest = await _guestRepo.GetByIdAsync(guestId)
            ?? throw new Exception("Misafir bulunamadı.");

        var prefs = await _prefRepo.FindAsync(p => p.GuestId == guestId);
        var notes = await _noteRepo.FindAsync(n => n.GuestId == guestId);

        // Last 3 room types
        var reservations = await _resRepo.FindAsync(r => r.GuestId == guestId);
        var recentRoomTypes = new List<string>();
        foreach (var res in reservations.OrderByDescending(r => r.CheckInDate).Take(3))
        {
            var room = await _roomRepo.GetByIdAsync(res.RoomId);
            if (room != null) recentRoomTypes.Add(room.Type.ToString());
        }

        return new GuestProfileDto(
            guest.Id,
            guest.Name,
            guest.Email,
            guest.Phone,
            guest.TotalStays,
            guest.TotalSpent,
            guest.LoyaltyPoints,
            guest.VipLevel,
            prefs.OrderByDescending(p => p.CreatedAt).Select(p => new GuestPreferenceDto(p.Id, p.Category, p.Key, p.Value, p.Notes, p.CreatedAt)).ToList(),
            notes.OrderByDescending(n => n.CreatedAt).Select(n => new GuestNoteDto(n.Id, n.Note, n.AddedBy, n.IsImportant, n.CreatedAt)).ToList(),
            recentRoomTypes
        );
    }

    public async Task AddPreferenceAsync(Guid guestId, AddPreferenceDto dto)
    {
        var pref = new GuestPreference
        {
            Id = Guid.NewGuid(),
            GuestId = guestId,
            Category = dto.Category,
            Key = dto.Key,
            Value = dto.Value,
            Notes = dto.Notes,
            CreatedAt = DateTime.UtcNow
        };
        await _prefRepo.AddAsync(pref);
        await _prefRepo.SaveChangesAsync();
    }

    public async Task DeletePreferenceAsync(Guid preferenceId)
    {
        var pref = await _prefRepo.GetByIdAsync(preferenceId)
            ?? throw new Exception("Tercih bulunamadı.");
        await _prefRepo.DeleteAsync(pref);
        await _prefRepo.SaveChangesAsync();
    }

    public async Task AddNoteAsync(Guid guestId, AddNoteDto dto, string? addedByUserName)
    {
        var note = new GuestNote
        {
            Id = Guid.NewGuid(),
            GuestId = guestId,
            Note = dto.Note,
            AddedBy = addedByUserName,
            IsImportant = dto.IsImportant,
            CreatedAt = DateTime.UtcNow
        };
        await _noteRepo.AddAsync(note);
        await _noteRepo.SaveChangesAsync();
    }

    public async Task DeleteNoteAsync(Guid noteId)
    {
        var note = await _noteRepo.GetByIdAsync(noteId)
            ?? throw new Exception("Not bulunamadı.");
        await _noteRepo.DeleteAsync(note);
        await _noteRepo.SaveChangesAsync();
    }

    public async Task RecalculateStatsAsync(Guid guestId)
    {
        var guest = await _guestRepo.GetByIdAsync(guestId)
            ?? throw new Exception("Misafir bulunamadı.");

        var reservations = await _resRepo.FindAsync(r =>
            r.GuestId == guestId && r.Status == Core.Enums.ReservationStatus.CheckedOut);

        guest.TotalStays = reservations.Count();
        guest.TotalSpent = reservations.Sum(r => r.TotalAmount);

        guest.VipLevel = guest.TotalSpent switch
        {
            > 50000 => "Platinum",
            > 15000 => "Gold",
            > 5000  => "Silver",
            _       => "Bronze"
        };

        await _guestRepo.UpdateAsync(guest);
        await _guestRepo.SaveChangesAsync();
    }
}
