namespace HotelManagement.Business.DTOs;

public record AuditLogDto(
    Guid Id,
    string EntityName,
    string EntityId,
    string Action,
    string? ChangedBy,
    string? OldValues,
    string? NewValues,
    string? Notes,
    DateTime Timestamp);
