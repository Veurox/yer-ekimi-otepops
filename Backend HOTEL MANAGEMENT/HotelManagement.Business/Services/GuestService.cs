using HotelManagement.Business.DTOs;
using HotelManagement.Business.Interfaces;
using HotelManagement.Core.Entities;
using HotelManagement.Core.Interfaces;

namespace HotelManagement.Business.Services;

public class GuestService : IGuestService
{
    private readonly IGenericRepository<Guest> _repository;
    private readonly IGenericRepository<Reservation> _reservationRepository;

    public GuestService(
        IGenericRepository<Guest> repository,
        IGenericRepository<Reservation> reservationRepository)
    {
        _repository = repository;
        _reservationRepository = reservationRepository;
    }

    public async Task<IEnumerable<GuestDto>> GetAllGuestsAsync()
    {
        var guests = await _repository.GetAllAsync();
        // Only return active guests (soft-delete filter)
        return guests.Where(g => g.IsActive).Select(MapToDto);
    }

    public async Task<PagedResultDto<GuestDto>> GetPagedAsync(int page, int pageSize, string? search)
    {
        var guests = await _repository.GetAllAsync();
        var query = guests.Where(g => g.IsActive).AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var lowerSearch = search.ToLower();
            query = query.Where(g =>
                g.Name.ToLower().Contains(lowerSearch) ||
                g.Email.ToLower().Contains(lowerSearch) ||
                g.Phone.ToLower().Contains(lowerSearch) ||
                g.IdNumber.ToLower().Contains(lowerSearch));
        }

        var totalCount = query.Count();
        var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);
        var skip = (page - 1) * pageSize;

        var items = query
            .OrderBy(g => g.Name)
            .Skip(skip)
            .Take(pageSize)
            .Select(MapToDto)
            .ToList();

        return new PagedResultDto<GuestDto>(items, totalCount, page, pageSize, totalPages);
    }

    public async Task<GuestDto?> GetGuestByIdAsync(Guid id)
    {
        var guest = await _repository.GetByIdAsync(id);
        if (guest == null || !guest.IsActive) return null;
        return MapToDto(guest);
    }

    public async Task<GuestDto> CreateGuestAsync(CreateGuestDto dto)
    {
        // TC Kimlik benzersizlik kontrolu
        if (!string.IsNullOrWhiteSpace(dto.IdNumber))
        {
            var existing = await _repository.FindAsync(g => g.IdNumber == dto.IdNumber && g.IsActive);
            if (existing.Any())
                throw new InvalidOperationException($"Bu TC Kimlik numarasi ({dto.IdNumber}) ile kayitli misafir zaten mevcut.");
        }

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

        // TC Kimlik benzersizlik kontrolu (baskasinda ayni numara var mi)
        if (!string.IsNullOrWhiteSpace(dto.IdNumber) && guest.IdNumber != dto.IdNumber)
        {
            var existing = await _repository.FindAsync(g => g.IdNumber == dto.IdNumber && g.IsActive && g.Id != dto.Id);
            if (existing.Any())
                throw new InvalidOperationException($"Bu TC Kimlik numarasi ({dto.IdNumber}) baska bir misafirde kayitli.");
        }

        guest.Name = dto.Name;
        guest.Email = dto.Email;
        guest.Phone = dto.Phone;
        guest.IdNumber = dto.IdNumber;
        guest.Address = dto.Address;

        await _repository.UpdateAsync(guest);
        await _repository.SaveChangesAsync();
    }

    public async Task DeleteGuestAsync(Guid id)
    {
        var guest = await _repository.GetByIdAsync(id);
        if (guest == null) throw new KeyNotFoundException($"Guest {id} not found");

        // Aktif rezervasyonu olan misafir silinemez
        if (guest.ReservationId.HasValue)
        {
            var reservation = await _reservationRepository.GetByIdAsync(guest.ReservationId.Value);
            if (reservation != null &&
                reservation.Status != Core.Enums.ReservationStatus.CheckedOut &&
                reservation.Status != Core.Enums.ReservationStatus.Cancelled)
            {
                throw new InvalidOperationException("Aktif rezervasyonu olan misafir silinemez. Once rezervasyonu iptal edin.");
            }
        }

        // Soft-delete: IsActive = false (veri korunur)
        guest.IsActive = false;
        guest.ReservationId = null;
        await _repository.UpdateAsync(guest);
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
