using HotelManagement.Business.DTOs;
using HotelManagement.Business.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HotelManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SurveysController : ControllerBase
{
    private readonly ISurveyService _service;

    public SurveysController(ISurveyService service)
    {
        _service = service;
    }

    [HttpPost]
    public async Task<IActionResult> Submit([FromBody] SubmitSurveyDto dto)
    {
        try { return Ok(await _service.SubmitAsync(dto)); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        => Ok(await _service.GetAllAsync(page, pageSize));

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats() => Ok(await _service.GetStatsAsync());

    [HttpGet("guest/{guestId}")]
    public async Task<IActionResult> GetByGuest(Guid guestId)
        => Ok(await _service.GetByGuestAsync(guestId));
}
