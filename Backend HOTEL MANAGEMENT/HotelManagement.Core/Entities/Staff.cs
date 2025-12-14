using HotelManagement.Core.Enums;
using HotelManagement.Core.Interfaces;

namespace HotelManagement.Core.Entities;

public class Staff : IEntity
{
    public Guid Id { get; set; }
    
    public string UserName { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty; // Backend needs password

    public string FirstName { get; set; } = string.Empty;
    
    public string LastName { get; set; } = string.Empty;
    
    public string Email { get; set; } = string.Empty;
    
    public string PhoneNumber { get; set; } = string.Empty;
    
    public StaffRole Role { get; set; }
    
    public ShiftType Shift { get; set; }
    
    public decimal Salary { get; set; }
    
    public DateTime HireDate { get; set; }
    
    public bool IsActive { get; set; }
}
