using HotelManagement.Core.Entities;

namespace HotelManagement.Business.Interfaces;

public interface ITokenService
{
    string GenerateToken(Staff user);
}
