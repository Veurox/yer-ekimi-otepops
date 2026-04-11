using HotelManagement.Business.DTOs;
using HotelManagement.Business.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HotelManagement.API.Controllers;

[ApiController]
[Route("api/pos")]
[Authorize]
public class PosController : ControllerBase
{
    private readonly IPosService _posService;

    public PosController(IPosService posService)
    {
        _posService = posService;
    }

    [HttpGet]
    public async Task<IActionResult> GetTransactions([FromQuery] Guid? reservationId = null)
    {
        var transactions = await _posService.GetTransactionsAsync(reservationId);
        return Ok(transactions);
    }

    [HttpPost]
    public async Task<IActionResult> CreateTransaction([FromBody] CreatePosTransactionDto dto)
    {
        try
        {
            var transaction = await _posService.CreateTransactionAsync(dto);
            return CreatedAtAction(nameof(GetTransactions), new { reservationId = dto.ReservationId }, transaction);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id:guid}/charge-to-room")]
    public async Task<IActionResult> ChargeToRoom(Guid id)
    {
        try
        {
            var transaction = await _posService.ChargeToRoomAsync(id);
            return Ok(transaction);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("room-charges/{reservationId:guid}")]
    public async Task<IActionResult> GetRoomCharges(Guid reservationId)
    {
        try
        {
            var summary = await _posService.GetRoomChargesAsync(reservationId);
            return Ok(summary);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> CancelTransaction(Guid id)
    {
        try
        {
            var transaction = await _posService.CancelTransactionAsync(id);
            if (transaction == null) return NotFound();
            return Ok(transaction);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
