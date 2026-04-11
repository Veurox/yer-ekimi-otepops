using HotelManagement.Business.DTOs;
using HotelManagement.Business.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HotelManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RatePlansController : ControllerBase
{
    private readonly IRatePlanService _ratePlanService;

    public RatePlansController(IRatePlanService ratePlanService)
    {
        _ratePlanService = ratePlanService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<RatePlanDto>>> GetAll()
        => Ok(await _ratePlanService.GetAllAsync());

    [HttpGet("{id}")]
    public async Task<ActionResult<RatePlanDto>> GetById(Guid id)
    {
        var plan = await _ratePlanService.GetByIdAsync(id);
        return plan == null ? NotFound() : Ok(plan);
    }

    /// <summary>Calculate the effective rate for a room for given dates</summary>
    [HttpGet("calculate")]
    public async Task<ActionResult<CalculatedRateDto>> Calculate(
        [FromQuery] Guid roomId,
        [FromQuery] DateTime checkIn,
        [FromQuery] DateTime checkOut)
    {
        try
        {
            var rate = await _ratePlanService.CalculateRateAsync(roomId, checkIn, checkOut);
            return Ok(rate);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPost]
    public async Task<ActionResult<RatePlanDto>> Create([FromBody] CreateRatePlanDto dto)
    {
        try
        {
            var plan = await _ratePlanService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = plan.Id }, plan);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<RatePlanDto>> Update(Guid id, [FromBody] CreateRatePlanDto dto)
    {
        try
        {
            var plan = await _ratePlanService.UpdateAsync(id, dto);
            return Ok(plan);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            await _ratePlanService.DeleteAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }
}
