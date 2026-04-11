using HotelManagement.Business.DTOs;

namespace HotelManagement.Business.Interfaces;

public interface IAuditService
{
    Task LogAsync(
        string entityName,
        string entityId,
        string action,
        string? changedBy = null,
        object? oldValues = null,
        object? newValues = null,
        string? notes = null);

    Task<List<AuditLogDto>> GetLogsAsync(
        string? entityName = null,
        string? entityId = null,
        int page = 1,
        int pageSize = 20);
}
