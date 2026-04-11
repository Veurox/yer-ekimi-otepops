using HotelManagement.Business.DTOs;
using HotelManagement.Business.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HotelManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LoyaltyController : ControllerBase
{
    private readonly ILoyaltyService _service;

    public LoyaltyController(ILoyaltyService service)
    {
        _service = service;
    }

    [HttpGet("{guestId}/summary")]
    public async Task<IActionResult> GetSummary(Guid guestId)
    {
        try { return Ok(await _service.GetSummaryAsync(guestId)); }
        catch (Exception ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpGet("{guestId}/transactions")]
    public async Task<IActionResult> GetTransactions(Guid guestId)
        => Ok(await _service.GetTransactionsAsync(guestId));

    [HttpPost("earn")]
    public async Task<IActionResult> Earn([FromBody] EarnPointsDto dto)
    {
        try { await _service.EarnPointsAsync(dto); return Ok(new { message = "Puan eklendi." }); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPost("redeem")]
    public async Task<IActionResult> Redeem([FromBody] RedeemPointsDto dto)
    {
        try { await _service.RedeemPointsAsync(dto); return Ok(new { message = "Puan kullanıldı." }); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }
}
