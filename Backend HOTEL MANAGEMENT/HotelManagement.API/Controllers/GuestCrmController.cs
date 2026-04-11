using HotelManagement.Business.DTOs;
using HotelManagement.Business.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HotelManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GuestCrmController : ControllerBase
{
    private readonly IGuestCrmService _crmService;

    public GuestCrmController(IGuestCrmService crmService)
    {
        _crmService = crmService;
    }

    [HttpGet("{guestId}/profile")]
    public async Task<IActionResult> GetProfile(Guid guestId)
    {
        try { return Ok(await _crmService.GetProfileAsync(guestId)); }
        catch (Exception ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPost("{guestId}/preferences")]
    public async Task<IActionResult> AddPreference(Guid guestId, [FromBody] AddPreferenceDto dto)
    {
        await _crmService.AddPreferenceAsync(guestId, dto);
        return Ok(new { message = "Tercih eklendi." });
    }

    [HttpDelete("preferences/{id}")]
    public async Task<IActionResult> DeletePreference(Guid id)
    {
        try { await _crmService.DeletePreferenceAsync(id); return Ok(); }
        catch (Exception ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPost("{guestId}/notes")]
    public async Task<IActionResult> AddNote(Guid guestId, [FromBody] AddNoteDto dto)
    {
        var userName = User.FindFirstValue(ClaimTypes.Name);
        await _crmService.AddNoteAsync(guestId, dto, userName);
        return Ok(new { message = "Not eklendi." });
    }

    [HttpDelete("notes/{id}")]
    public async Task<IActionResult> DeleteNote(Guid id)
    {
        try { await _crmService.DeleteNoteAsync(id); return Ok(); }
        catch (Exception ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPost("{guestId}/recalculate")]
    public async Task<IActionResult> Recalculate(Guid guestId)
    {
        try { await _crmService.RecalculateStatsAsync(guestId); return Ok(new { message = "İstatistikler güncellendi." }); }
        catch (Exception ex) { return NotFound(new { message = ex.Message }); }
    }
}
