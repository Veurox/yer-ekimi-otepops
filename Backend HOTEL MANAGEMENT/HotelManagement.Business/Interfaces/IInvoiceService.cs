using HotelManagement.Business.DTOs;

namespace HotelManagement.Business.Interfaces;

public interface IInvoiceService
{
    Task<InvoiceDto?> GetByReservationAsync(Guid reservationId);
    Task<InvoiceDto?> GetByIdAsync(Guid id);
    Task<InvoiceDto> GenerateAsync(GenerateInvoiceDto dto);
    Task<InvoiceDto> MarkAsPaidAsync(Guid invoiceId);
    Task<InvoiceDto> CancelAsync(Guid invoiceId);
    Task<IEnumerable<InvoiceDto>> GetAllAsync(DateTime? fromDate = null, DateTime? toDate = null);
}
