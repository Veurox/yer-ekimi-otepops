using HotelManagement.Business.DTOs;
using HotelManagement.Business.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace HotelManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RoomServiceController : ControllerBase
{
    private readonly IRoomServiceOrderService _service;

    public RoomServiceController(IRoomServiceOrderService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<RoomServiceOrderDto>>> GetAll()
    {
        return Ok(await _service.GetAllOrdersAsync());
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<RoomServiceOrderDto>> GetById(Guid id)
    {
        var order = await _service.GetOrderByIdAsync(id);
        if (order == null) return NotFound();
        return Ok(order);
    }

    [HttpPost]
    public async Task<ActionResult<RoomServiceOrderDto>> Create(CreateRoomServiceOrderDto dto)
    {
        var order = await _service.CreateOrderAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = order.Id }, order);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<RoomServiceOrderDto>> Update(Guid id, RoomServiceOrderDto dto)
    {
        if (id != dto.Id) return BadRequest();
        try
        {
            await _service.UpdateOrderAsync(dto);
            var updated = await _service.GetOrderByIdAsync(id);
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
            await _service.DeleteOrderAsync(id);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        return NoContent();
    }
}
