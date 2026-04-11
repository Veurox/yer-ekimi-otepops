using HotelManagement.Business.DTOs;
using HotelManagement.Business.Interfaces;
using HotelManagement.Core.Entities;
using HotelManagement.Core.Enums;
using HotelManagement.Core.Interfaces;

namespace HotelManagement.Business.Services;

public class InvoiceService : IInvoiceService
{
    private readonly IGenericRepository<Invoice> _invoiceRepository;
    private readonly IGenericRepository<InvoiceLineItem> _lineItemRepository;
    private readonly IGenericRepository<Reservation> _reservationRepository;
    private readonly IGenericRepository<Guest> _guestRepository;
    private readonly IGenericRepository<Room> _roomRepository;
    private readonly IGenericRepository<RoomServiceOrder> _roomServiceRepository;

    public InvoiceService(
        IGenericRepository<Invoice> invoiceRepository,
        IGenericRepository<InvoiceLineItem> lineItemRepository,
        IGenericRepository<Reservation> reservationRepository,
        IGenericRepository<Guest> guestRepository,
        IGenericRepository<Room> roomRepository,
        IGenericRepository<RoomServiceOrder> roomServiceRepository)
    {
        _invoiceRepository = invoiceRepository;
        _lineItemRepository = lineItemRepository;
        _reservationRepository = reservationRepository;
        _guestRepository = guestRepository;
        _roomRepository = roomRepository;
        _roomServiceRepository = roomServiceRepository;
    }

    public async Task<InvoiceDto?> GetByReservationAsync(Guid reservationId)
    {
        var invoices = await _invoiceRepository.FindAsync(i => i.ReservationId == reservationId);
        var invoice = invoices.OrderByDescending(i => i.CreatedAt).FirstOrDefault();
        return invoice == null ? null : await EnrichDto(invoice);
    }

    public async Task<InvoiceDto?> GetByIdAsync(Guid id)
    {
        var invoices = await _invoiceRepository.FindAsync(i => i.Id == id);
        var invoice = invoices.FirstOrDefault();
        return invoice == null ? null : await EnrichDto(invoice);
    }

    public async Task<IEnumerable<InvoiceDto>> GetAllAsync(DateTime? fromDate = null, DateTime? toDate = null)
    {
        var all = await _invoiceRepository.GetAllAsync();
        var filtered = all.Where(i =>
            (!fromDate.HasValue || i.CreatedAt >= fromDate.Value) &&
            (!toDate.HasValue   || i.CreatedAt <= toDate.Value))
            .OrderByDescending(i => i.CreatedAt);

        var result = new List<InvoiceDto>();
        foreach (var inv in filtered)
            result.Add(await EnrichDto(inv));
        return result;
    }

    public async Task<InvoiceDto> GenerateAsync(GenerateInvoiceDto dto)
    {
        var reservation = await _reservationRepository.GetByIdAsync(dto.ReservationId);

        if (reservation.Status == ReservationStatus.Cancelled)
            throw new InvalidOperationException("İptal edilmiş rezervasyon için fatura oluşturulamaz.");

        var existing = await _invoiceRepository.FindAsync(
            i => i.ReservationId == dto.ReservationId && i.Status != InvoiceStatus.Cancelled);
        if (existing.Any())
            throw new InvalidOperationException("Bu rezervasyon için zaten aktif bir fatura mevcut.");

        var guest = await _guestRepository.GetByIdAsync(reservation.GuestId);
        var room  = await _roomRepository.GetByIdAsync(reservation.RoomId);

        var checkOut = reservation.ActualCheckOutDate ?? reservation.CheckOutDate;
        var nights   = Math.Max(1, (int)(checkOut.Date - reservation.CheckInDate.Date).TotalDays);

        decimal roomCharges = reservation.TotalAmount;

        // Room service charges during the stay
        var orders = await _roomServiceRepository.FindAsync(o => o.RoomId == reservation.RoomId);
        var stayOrders = orders.Where(o =>
            o.OrderedAt >= reservation.CheckInDate &&
            o.OrderedAt <= checkOut);
        decimal roomServiceCharges = stayOrders.Sum(o => o.TotalPrice);

        decimal discount  = dto.Discount ?? 0m;
        decimal subTotal  = roomCharges + roomServiceCharges - discount;
        decimal taxRate   = 0.10m;
        decimal taxAmount = Math.Round(subTotal * taxRate, 2);
        decimal total     = subTotal + taxAmount;

        var allInvoices   = await _invoiceRepository.GetAllAsync();
        var invoiceNumber = $"INV-{DateTime.UtcNow.Year}-{(allInvoices.Count() + 1):D5}";

        var invoiceId = Guid.NewGuid();
        var lineItems = new List<InvoiceLineItem>
        {
            new()
            {
                Id          = Guid.NewGuid(),
                InvoiceId   = invoiceId,
                Description = $"Oda {room.Number} - {nights} Gece Konaklama ({reservation.CheckInDate:dd.MM.yyyy} – {checkOut:dd.MM.yyyy})",
                Category    = "Room",
                Quantity    = nights,
                UnitPrice   = Math.Round(roomCharges / nights, 2),
                TotalPrice  = roomCharges,
                ServiceDate = reservation.CheckInDate
            }
        };

        if (roomServiceCharges > 0)
        {
            lineItems.Add(new()
            {
                Id          = Guid.NewGuid(),
                InvoiceId   = invoiceId,
                Description = "Oda Servisi Harcamaları",
                Category    = "RoomService",
                Quantity    = 1,
                UnitPrice   = roomServiceCharges,
                TotalPrice  = roomServiceCharges,
                ServiceDate = reservation.CheckInDate
            });
        }

        var invoice = new Invoice
        {
            Id                  = invoiceId,
            InvoiceNumber       = invoiceNumber,
            ReservationId       = dto.ReservationId,
            GuestId             = reservation.GuestId,
            RoomCharges         = roomCharges,
            RoomServiceCharges  = roomServiceCharges,
            OtherCharges        = 0,
            Discount            = discount,
            SubTotal            = subTotal,
            TaxRate             = taxRate,
            TaxAmount           = taxAmount,
            TotalAmount         = total,
            Status              = InvoiceStatus.Issued,
            Notes               = dto.Notes,
            BillingAddress      = dto.BillingAddress ?? guest.Address,
            IssuedAt            = DateTime.UtcNow,
            CreatedAt           = DateTime.UtcNow
        };

        await _invoiceRepository.AddAsync(invoice);

        foreach (var item in lineItems)
            await _lineItemRepository.AddAsync(item);

        await _invoiceRepository.SaveChangesAsync();

        invoice.LineItems = lineItems;
        return await EnrichDto(invoice);
    }

    public async Task<InvoiceDto> MarkAsPaidAsync(Guid invoiceId)
    {
        var invoice = await _invoiceRepository.GetByIdAsync(invoiceId);
        invoice.Status    = InvoiceStatus.Paid;
        invoice.PaidAt    = DateTime.UtcNow;
        invoice.UpdatedAt = DateTime.UtcNow;
        await _invoiceRepository.UpdateAsync(invoice);
        await _invoiceRepository.SaveChangesAsync();
        return await EnrichDto(invoice);
    }

    public async Task<InvoiceDto> CancelAsync(Guid invoiceId)
    {
        var invoice = await _invoiceRepository.GetByIdAsync(invoiceId);
        if (invoice.Status == InvoiceStatus.Paid)
            throw new InvalidOperationException("Ödenmiş fatura iptal edilemez. Önce iade işlemi yapınız.");
        invoice.Status    = InvoiceStatus.Cancelled;
        invoice.UpdatedAt = DateTime.UtcNow;
        await _invoiceRepository.UpdateAsync(invoice);
        await _invoiceRepository.SaveChangesAsync();
        return await EnrichDto(invoice);
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private async Task<InvoiceDto> EnrichDto(Invoice invoice)
    {
        Guest?       guest       = null;
        Room?        room        = null;
        Reservation? reservation = null;

        try { guest       = await _guestRepository.GetByIdAsync(invoice.GuestId); }       catch { }
        try { reservation = await _reservationRepository.GetByIdAsync(invoice.ReservationId); } catch { }
        if (reservation != null)
            try { room = await _roomRepository.GetByIdAsync(reservation.RoomId); } catch { }

        var checkOut = reservation?.ActualCheckOutDate ?? reservation?.CheckOutDate ?? DateTime.UtcNow;
        var nights   = reservation != null
            ? Math.Max(1, (int)(checkOut.Date - reservation.CheckInDate.Date).TotalDays)
            : 0;

        var lineItems = await _lineItemRepository.FindAsync(li => li.InvoiceId == invoice.Id);

        return new InvoiceDto
        {
            Id                 = invoice.Id,
            InvoiceNumber      = invoice.InvoiceNumber,
            ReservationId      = invoice.ReservationId,
            GuestId            = invoice.GuestId,
            GuestName          = guest?.Name ?? "",
            GuestEmail         = guest?.Email,
            BillingAddress     = invoice.BillingAddress,
            RoomNumber         = room?.Number ?? "",
            CheckInDate        = reservation?.CheckInDate ?? DateTime.MinValue,
            CheckOutDate       = checkOut,
            NightCount         = nights,
            RoomCharges        = invoice.RoomCharges,
            RoomServiceCharges = invoice.RoomServiceCharges,
            OtherCharges       = invoice.OtherCharges,
            Discount           = invoice.Discount,
            SubTotal           = invoice.SubTotal,
            TaxRate            = invoice.TaxRate,
            TaxAmount          = invoice.TaxAmount,
            TotalAmount        = invoice.TotalAmount,
            Currency           = invoice.Currency,
            Status             = invoice.Status.ToString(),
            Notes              = invoice.Notes,
            IssuedAt           = invoice.IssuedAt,
            PaidAt             = invoice.PaidAt,
            CreatedAt          = invoice.CreatedAt,
            LineItems          = lineItems.Select(li => new InvoiceLineItemDto
            {
                Id          = li.Id,
                Description = li.Description,
                Category    = li.Category,
                Quantity    = li.Quantity,
                UnitPrice   = li.UnitPrice,
                TotalPrice  = li.TotalPrice,
                ServiceDate = li.ServiceDate
            }).ToList()
        };
    }
}
