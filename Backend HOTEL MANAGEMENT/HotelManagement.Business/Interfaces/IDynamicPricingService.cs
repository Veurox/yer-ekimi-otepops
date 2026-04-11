using HotelManagement.Business.DTOs;

namespace HotelManagement.Business.Interfaces;

public interface IDynamicPricingService
{
    Task<List<DynamicPricingRuleDto>> GetRulesAsync();
    Task<DynamicPricingRuleDto> CreateRuleAsync(CreateDynamicPricingRuleDto dto);
    Task UpdateRuleAsync(Guid id, CreateDynamicPricingRuleDto dto);
    Task DeleteRuleAsync(Guid id);
    Task<DynamicPriceResultDto> CalculateDynamicPriceAsync(Guid roomId, DateTime checkIn);
}
