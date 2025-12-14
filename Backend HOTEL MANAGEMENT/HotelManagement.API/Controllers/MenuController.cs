using HotelManagement.Business.DTOs;
using HotelManagement.Business.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace HotelManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MenuController : ControllerBase
{
    private readonly IMenuService _service;

    public MenuController(IMenuService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<MenuItemDto>>> GetAll()
    {
        return Ok(await _service.GetAllMenuItemsAsync());
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<MenuItemDto>> GetById(Guid id)
    {
        var item = await _service.GetMenuItemByIdAsync(id);
        if (item == null) return NotFound();
        return Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<MenuItemDto>> Create(CreateMenuItemDto dto)
    {
        var item = await _service.CreateMenuItemAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<MenuItemDto>> Update(Guid id, MenuItemDto dto)
    {
        if (id != dto.Id) return BadRequest();
        try
        {
            await _service.UpdateMenuItemAsync(dto);
            var updated = await _service.GetMenuItemByIdAsync(id);
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
            await _service.DeleteMenuItemAsync(id);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        return NoContent();
    }
}
