using HotelManagement.Business.DTOs;
using HotelManagement.Business.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HotelManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InvoicesController : ControllerBase
{
    private readonly IInvoiceService _invoiceService;

    public InvoicesController(IInvoiceService invoiceService)
    {
        _invoiceService = invoiceService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<InvoiceDto>>> GetAll(
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate)
    {
        var invoices = await _invoiceService.GetAllAsync(fromDate, toDate);
        return Ok(invoices);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<InvoiceDto>> GetById(Guid id)
    {
        var inv = await _invoiceService.GetByIdAsync(id);
        return inv == null ? NotFound() : Ok(inv);
    }

    [HttpGet("reservation/{reservationId}")]
    public async Task<ActionResult<InvoiceDto>> GetByReservation(Guid reservationId)
    {
        var inv = await _invoiceService.GetByReservationAsync(reservationId);
        return inv == null ? NotFound() : Ok(inv);
    }

    /// <summary>Generate an invoice for a reservation</summary>
    [HttpPost("generate")]
    public async Task<ActionResult<InvoiceDto>> Generate([FromBody] GenerateInvoiceDto dto)
    {
        try
        {
            var inv = await _invoiceService.GenerateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = inv.Id }, inv);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    /// <summary>Mark invoice as paid</summary>
    [HttpPost("{id}/pay")]
    public async Task<ActionResult<InvoiceDto>> MarkAsPaid(Guid id)
    {
        try
        {
            var inv = await _invoiceService.MarkAsPaidAsync(id);
            return Ok(inv);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    /// <summary>Cancel an invoice</summary>
    [HttpPost("{id}/cancel")]
    public async Task<ActionResult<InvoiceDto>> Cancel(Guid id)
    {
        try
        {
            var inv = await _invoiceService.CancelAsync(id);
            return Ok(inv);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }
}
