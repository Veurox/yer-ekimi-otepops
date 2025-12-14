using HotelManagement.Business.DTOs;
using HotelManagement.Business.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace HotelManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StaffController : ControllerBase
{
    private readonly IStaffService _service;

    public StaffController(IStaffService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<StaffDto>>> GetAll()
    {
        return Ok(await _service.GetAllStaffAsync());
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<StaffDto>> GetById(Guid id)
    {
        var staff = await _service.GetStaffByIdAsync(id);
        if (staff == null) return NotFound();
        return Ok(staff);
    }

    [HttpPost]
    public async Task<ActionResult<StaffDto>> Create(CreateStaffDto dto)
    {
        var staff = await _service.CreateStaffAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = staff.Id }, staff);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<StaffDto>> Update(Guid id, StaffDto dto)
    {
        if (id != dto.Id) return BadRequest();
        try
        {
            await _service.UpdateStaffAsync(dto);
            var updated = await _service.GetStaffByIdAsync(id);
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
            await _service.DeleteStaffAsync(id);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        return NoContent();
    }
}
