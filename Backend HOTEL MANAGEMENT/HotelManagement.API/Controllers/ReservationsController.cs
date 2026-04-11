using HotelManagement.Business.DTOs;
using HotelManagement.Business.Interfaces;
using HotelManagement.Business.Validation;
using Microsoft.AspNetCore.Mvc;

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

    [HttpGet("paged")]
    public async Task<ActionResult<PagedResultDto<ReservationDto>>> GetPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? status = null,
        [FromQuery] string? search = null)
    {
        var result = await _reservationService.GetPagedAsync(page, pageSize, status, search);
        return Ok(result);
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

    [HttpPost("{id}/confirm")]
    public async Task<ActionResult<ReservationDto>> Confirm(Guid id)
    {
        try
        {
            var result = await _reservationService.ConfirmAsync(id);
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
    public async Task<ActionResult<CheckOutResult>> CheckOut(Guid id, [FromQuery] bool force = false, [FromQuery] string? reason = null)
    {
        try
        {
            var result = await _reservationService.CheckOutAsync(id, force, reason);
            if (!result.Success && result.RequiresPayment)
            {
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

    [HttpPost("{id}/cancel")]
    public async Task<ActionResult<ReservationDto>> Cancel(Guid id, [FromQuery] string? reason = null)
    {
        try
        {
            var result = await _reservationService.CancelAsync(id, reason);
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
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("walkin")]
    public async Task<ActionResult<ReservationDto>> WalkIn([FromBody] WalkInPayload payload)
    {
        try
        {
            var reservation = await _reservationService.WalkInAsync(payload);
            var dto = await _reservationService.GetReservationByIdAsync(reservation.Id);
            return CreatedAtAction(nameof(GetById), new { id = reservation.Id }, dto);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
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
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        return NoContent();
    }
}
