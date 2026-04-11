using HotelManagement.API.Hubs;
using HotelManagement.Business.DTOs;
using HotelManagement.Business.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace HotelManagement.API.Controllers;

[ApiController]
[Route("api/housekeeping")]
[Authorize]
public class HousekeepingController : ControllerBase
{
    private readonly IHousekeepingService _housekeepingService;
    private readonly IHubContext<HousekeepingHub> _hub;

    public HousekeepingController(IHousekeepingService housekeepingService, IHubContext<HousekeepingHub> hub)
    {
        _housekeepingService = housekeepingService;
        _hub = hub;
    }

    [HttpGet]
    public async Task<IActionResult> GetTasks(
        [FromQuery] DateTime? date = null,
        [FromQuery] Guid? roomId = null,
        [FromQuery] Guid? assignedToId = null,
        [FromQuery] string? status = null)
    {
        var tasks = await _housekeepingService.GetTasksAsync(date, roomId, assignedToId, status);
        return Ok(tasks);
    }

    [HttpPost]
    public async Task<IActionResult> CreateTask([FromBody] CreateHousekeepingTaskDto dto)
    {
        try
        {
            var task = await _housekeepingService.CreateTaskAsync(dto);
            await _hub.Clients.Group("housekeeping").SendAsync("TaskCreated", task);
            return CreatedAtAction(nameof(GetTasks), task);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateHousekeepingStatusDto dto)
    {
        try
        {
            var task = await _housekeepingService.UpdateStatusAsync(id, dto.Status);
            await _hub.Clients.Group("housekeeping").SendAsync("TaskUpdated", task);
            return Ok(task);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPatch("{id:guid}/assign")]
    public async Task<IActionResult> AssignStaff(Guid id, [FromBody] AssignHousekeepingStaffDto dto)
    {
        try
        {
            var task = await _housekeepingService.AssignStaffAsync(id, dto.StaffId);
            await _hub.Clients.Group("housekeeping").SendAsync("TaskAssigned", task);
            return Ok(task);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetTodaysSummary()
    {
        var summary = await _housekeepingService.GetTodaysSummaryAsync();
        return Ok(summary);
    }
}
