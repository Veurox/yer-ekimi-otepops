using HotelManagement.Core.Entities;

namespace HotelManagement.Business.Interfaces;

public interface IAuthService
{
    Task<Staff?> LoginAsync(string userName, string password);
    Task<Staff?> RegisterAsync(Staff staff, string password);
}
