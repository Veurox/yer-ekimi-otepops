using HotelManagement.Business.DTOs;
using HotelManagement.Business.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HotelManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DynamicPricingController : ControllerBase
{
    private readonly IDynamicPricingService _service;

    public DynamicPricingController(IDynamicPricingService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetRules() => Ok(await _service.GetRulesAsync());

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDynamicPricingRuleDto dto)
        => Ok(await _service.CreateRuleAsync(dto));

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CreateDynamicPricingRuleDto dto)
    {
        try { await _service.UpdateRuleAsync(id, dto); return Ok(); }
        catch (Exception ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try { await _service.DeleteRuleAsync(id); return Ok(); }
        catch (Exception ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpGet("calculate")]
    public async Task<IActionResult> Calculate([FromQuery] Guid roomId, [FromQuery] DateTime checkIn)
    {
        try { return Ok(await _service.CalculateDynamicPriceAsync(roomId, checkIn)); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }
}
