using HotelManagement.Business.Interfaces;
using HotelManagement.Core.Entities;

namespace HotelManagement.Business.Services;

public class TokenService : ITokenService
{
    public string GenerateToken(Staff user)
    {
        // TODO: Implement real JWT here in next step.
        return $"mock-jwt-token-for-{user.UserName}-{Guid.NewGuid()}";
    }
}
