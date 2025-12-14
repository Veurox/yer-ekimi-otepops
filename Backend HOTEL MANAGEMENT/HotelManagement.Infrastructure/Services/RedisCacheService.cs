using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;
using HotelManagement.Core.Interfaces;

namespace HotelManagement.Infrastructure.Services;

public class RedisCacheService : ICacheService
{
    private readonly IDistributedCache _cache;

    public RedisCacheService(IDistributedCache cache)
    {
        _cache = cache;
    }

    public async Task<T?> GetAsync<T>(string key)
    {
        var jsonString = await _cache.GetStringAsync(key);
        if (string.IsNullOrEmpty(jsonString))
        {
            return default;
        }

        return JsonSerializer.Deserialize<T>(jsonString);
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expirationTime = null)
    {
        var options = new DistributedCacheEntryOptions();
        
        // Default 10 minutes
        options.AbsoluteExpirationRelativeToNow = expirationTime ?? TimeSpan.FromMinutes(10);

        var jsonString = JsonSerializer.Serialize(value);
        await _cache.SetStringAsync(key, jsonString, options);
    }

    public async Task RemoveAsync(string key)
    {
        await _cache.RemoveAsync(key);
    }
}
