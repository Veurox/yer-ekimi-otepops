using HotelManagement.Business.DTOs;
using HotelManagement.Business.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HotelManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;

    public PaymentsController(IPaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    /// <summary>Get all payments for a reservation</summary>
    [HttpGet("reservation/{reservationId}")]
    public async Task<ActionResult<IEnumerable<PaymentDto>>> GetByReservation(Guid reservationId)
    {
        var payments = await _paymentService.GetPaymentsByReservationAsync(reservationId);
        return Ok(payments);
    }

    /// <summary>Get payment summary (totals + list) for a reservation</summary>
    [HttpGet("reservation/{reservationId}/summary")]
    public async Task<ActionResult<ReservationPaymentSummaryDto>> GetSummary(Guid reservationId)
    {
        try
        {
            var summary = await _paymentService.GetPaymentSummaryAsync(reservationId);
            return Ok(summary);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>Add a payment to a reservation</summary>
    [HttpPost]
    public async Task<ActionResult<PaymentDto>> AddPayment([FromBody] CreatePaymentDto dto)
    {
        try
        {
            var payment = await _paymentService.AddPaymentAsync(dto);
            return CreatedAtAction(nameof(GetByReservation),
                new { reservationId = dto.ReservationId }, payment);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    /// <summary>Refund a payment</summary>
    [HttpPost("{paymentId}/refund")]
    public async Task<ActionResult<PaymentDto>> Refund(Guid paymentId, [FromQuery] string? reason)
    {
        try
        {
            var refund = await _paymentService.RefundPaymentAsync(paymentId, reason);
            return Ok(refund);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }
}
