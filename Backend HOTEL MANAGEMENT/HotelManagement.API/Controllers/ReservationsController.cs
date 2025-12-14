using HotelManagement.Business.DTOs;
using HotelManagement.Business.Interfaces;
using Microsoft.AspNetCore.Mvc;

using HotelManagement.Business.Validation;

namespace HotelManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReservationsController : ControllerBase
{
    private readonly IReservationService _reservationService;
    private readonly ReservationValidator _validator;

    public ReservationsController(
        IReservationService reservationService,
        ReservationValidator validator)
    {
        _reservationService = reservationService;
        _validator = validator;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ReservationDto>>> GetAll()
    {
        return Ok(await _reservationService.GetAllReservationsAsync());
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ReservationDto>> GetById(Guid id)
    {
        var reservation = await _reservationService.GetReservationByIdAsync(id);
        if (reservation == null) return NotFound();
        return Ok(reservation);
    }

    [HttpPost]
    public async Task<ActionResult<ReservationDto>> Create(CreateReservationDto dto)
    {
        var validationResult = await _validator.ValidateCreateReservation(dto);
        if (!validationResult.IsValid)
        {
            var errorMsg = string.Join(", ", validationResult.Errors);
            Console.WriteLine($"[Reservation Create Error] Validation failed: {errorMsg}");
            return BadRequest(new { Errors = validationResult.Errors });
        }

        var reservation = await _reservationService.CreateReservationAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = reservation.Id }, reservation);
    }

    [HttpPost("{id}/checkin")]
    public async Task<ActionResult<ReservationDto>> CheckIn(Guid id)
    {
        try
        {
            var result = await _reservationService.CheckInAsync(id);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/checkout")]
    public async Task<ActionResult<CheckOutResult>> CheckOut(Guid id, [FromQuery] bool force = false)
    {
        try
        {
            var result = await _reservationService.CheckOutAsync(id, force);
            if (!result.Success && result.RequiresPayment)
            {
                // Return 402 Payment Required or 400 Bad Request depending on preference
                // Here using 200 OK with success=false to let frontend handle the UI flow
                return Ok(result);
            }
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ReservationDto>> Update(Guid id, ReservationDto dto)
    {
        if (id != dto.Id) return BadRequest();
        try
        {
            await _reservationService.UpdateReservationAsync(dto);
            var updated = await _reservationService.GetReservationByIdAsync(id);
            return Ok(updated);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            await _reservationService.DeleteReservationAsync(id);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        return NoContent();
    }
}
