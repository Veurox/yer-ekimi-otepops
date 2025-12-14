using HotelManagement.Business.DTOs;
using HotelManagement.Business.Interfaces;
using HotelManagement.Core.Entities;
using HotelManagement.Core.Interfaces;

namespace HotelManagement.Business.Services;

public class GuestService : IGuestService
{
    private readonly IGenericRepository<Guest> _repository;

    public GuestService(IGenericRepository<Guest> repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<GuestDto>> GetAllGuestsAsync()
    {
        var guests = await _repository.GetAllAsync();
        return guests.Select(MapToDto);
    }

    public async Task<GuestDto?> GetGuestByIdAsync(Guid id)
    {
        var guest = await _repository.GetByIdAsync(id);
        if (guest == null) return null;
        return MapToDto(guest);
    }

    public async Task<GuestDto> CreateGuestAsync(CreateGuestDto dto)
    {
        var guest = new Guest
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Email = dto.Email,
            Phone = dto.Phone,
            IdNumber = dto.IdNumber,
            Address = dto.Address,
            IsPrimaryGuest = false,
            IsActive = true,
            Visits = 0,
            TotalSpent = 0
        };

        await _repository.AddAsync(guest);
        await _repository.SaveChangesAsync();

        return MapToDto(guest);
    }

    public async Task UpdateGuestAsync(GuestDto dto)
    {
        var guest = await _repository.GetByIdAsync(dto.Id);
        if (guest == null) throw new KeyNotFoundException($"Guest {dto.Id} not found");
        
        guest.Name = dto.Name;
        guest.Email = dto.Email;
        guest.Phone = dto.Phone;
        guest.IdNumber = dto.IdNumber;
        guest.Address = dto.Address;
        guest.Visits = dto.Visits;
        guest.TotalSpent = dto.TotalSpent;

        await _repository.UpdateAsync(guest);
        await _repository.SaveChangesAsync();
    }

    public async Task DeleteGuestAsync(Guid id)
    {
        var guest = await _repository.GetByIdAsync(id);
        if (guest == null) throw new KeyNotFoundException($"Guest {id} not found");

        await _repository.DeleteAsync(guest);
        await _repository.SaveChangesAsync();
    }

    private static GuestDto MapToDto(Guest guest)
    {
        return new GuestDto
        {
            Id = guest.Id,
            Name = guest.Name,
            Email = guest.Email,
            Phone = guest.Phone,
            IdNumber = guest.IdNumber,
            Address = guest.Address,
            ReservationId = guest.ReservationId?.ToString(),
            IsPrimaryGuest = guest.IsPrimaryGuest,
            IsActive = guest.IsActive,
            Visits = guest.Visits,
            TotalSpent = guest.TotalSpent
        };
    }
}
