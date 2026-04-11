using HotelManagement.Business.DTOs;
using HotelManagement.Business.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HotelManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IReportingService _reportingService;

    public ReportsController(IReportingService reportingService)
    {
        _reportingService = reportingService;
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<DashboardSummaryDto>> GetDashboard()
    {
        var summary = await _reportingService.GetDashboardSummaryAsync();
        return Ok(summary);
    }

    [HttpGet("occupancy")]
    public async Task<ActionResult<OccupancyReportDto>> GetOccupancy(
        [FromQuery] DateTime fromDate,
        [FromQuery] DateTime toDate)
    {
        if (fromDate == default) fromDate = DateTime.UtcNow.AddDays(-30);
        if (toDate   == default) toDate   = DateTime.UtcNow;
        var report = await _reportingService.GetOccupancyReportAsync(fromDate, toDate);
        return Ok(report);
    }

    [HttpGet("revenue")]
    public async Task<ActionResult<RevenueReportDto>> GetRevenue(
        [FromQuery] DateTime fromDate,
        [FromQuery] DateTime toDate)
    {
        if (fromDate == default) fromDate = DateTime.UtcNow.AddDays(-30);
        if (toDate   == default) toDate   = DateTime.UtcNow;
        var report = await _reportingService.GetRevenueReportAsync(fromDate, toDate);
        return Ok(report);
    }

    [HttpGet("reservations")]
    public async Task<ActionResult<ReservationStatisticsDto>> GetReservationStats(
        [FromQuery] DateTime fromDate,
        [FromQuery] DateTime toDate)
    {
        if (fromDate == default) fromDate = DateTime.UtcNow.AddDays(-30);
        if (toDate   == default) toDate   = DateTime.UtcNow;
        var stats = await _reportingService.GetReservationStatisticsAsync(fromDate, toDate);
        return Ok(stats);
    }

    [HttpGet("guests")]
    public async Task<ActionResult<GuestStatisticsDto>> GetGuestStats(
        [FromQuery] DateTime fromDate,
        [FromQuery] DateTime toDate)
    {
        if (fromDate == default) fromDate = DateTime.UtcNow.AddDays(-30);
        if (toDate   == default) toDate   = DateTime.UtcNow;
        var stats = await _reportingService.GetGuestStatisticsAsync(fromDate, toDate);
        return Ok(stats);
    }
}
