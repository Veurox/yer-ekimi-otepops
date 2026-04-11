using System.Text.Json;
using HotelManagement.Business.DTOs;
using HotelManagement.Business.Interfaces;
using HotelManagement.Core.Entities;
using HotelManagement.Core.Interfaces;

namespace HotelManagement.Business.Services;

public class AuditService : IAuditService
{
    private readonly IGenericRepository<AuditLog> _repository;

    public AuditService(IGenericRepository<AuditLog> repository)
    {
        _repository = repository;
    }

    public async Task LogAsync(
        string entityName,
        string entityId,
        string action,
        string? changedBy = null,
        object? oldValues = null,
        object? newValues = null,
        string? notes = null)
    {
        var log = new AuditLog
        {
            Id = Guid.NewGuid(),
            EntityName = entityName,
            EntityId = entityId,
            Action = action,
            ChangedBy = changedBy,
            OldValues = oldValues != null ? JsonSerializer.Serialize(oldValues) : null,
            NewValues = newValues != null ? JsonSerializer.Serialize(newValues) : null,
            Notes = notes,
            Timestamp = DateTime.UtcNow
        };

        await _repository.AddAsync(log);
        await _repository.SaveChangesAsync();
    }

    public async Task<List<AuditLogDto>> GetLogsAsync(
        string? entityName = null,
        string? entityId = null,
        int page = 1,
        int pageSize = 20)
    {
        var logs = await _repository.GetAllAsync();

        var query = logs.AsQueryable();

        if (!string.IsNullOrWhiteSpace(entityName))
            query = query.Where(l => l.EntityName == entityName);

        if (!string.IsNullOrWhiteSpace(entityId))
            query = query.Where(l => l.EntityId == entityId);

        var skip = (page - 1) * pageSize;

        return query
            .OrderByDescending(l => l.Timestamp)
            .Skip(skip)
            .Take(pageSize)
            .Select(l => new AuditLogDto(
                l.Id,
                l.EntityName,
                l.EntityId,
                l.Action,
                l.ChangedBy,
                l.OldValues,
                l.NewValues,
                l.Notes,
                l.Timestamp))
            .ToList();
    }
}
