using HotelManagement.Business.DTOs;
using HotelManagement.Business.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HotelManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AuditController : ControllerBase
{
    private readonly IAuditService _auditService;

    public AuditController(IAuditService auditService)
    {
        _auditService = auditService;
    }

    [HttpGet]
    public async Task<ActionResult<List<AuditLogDto>>> GetLogs(
        [FromQuery] string? entityName = null,
        [FromQuery] string? entityId = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var logs = await _auditService.GetLogsAsync(entityName, entityId, page, pageSize);
        return Ok(logs);
    }
}
