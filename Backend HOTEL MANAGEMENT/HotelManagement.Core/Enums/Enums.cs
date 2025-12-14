namespace HotelManagement.Core.Enums;

public enum RoomStatus
{
    Available,
    Occupied,
    Cleaning,
    Maintenance,
    Reserved
}

public enum RoomType
{
    Single,
    Double,
    Suite,
    Deluxe
}

public enum StaffRole
{
    Manager,
    Receptionist,
    Housekeeping,
    Maintenance,
    RoomService,
    Customer
}

public enum ShiftType
{
    Morning,
    Afternoon,
    Night
}

public enum ReservationStatus
{
    Pending,
    Confirmed,
    CheckedIn,
    CheckedOut,
    Cancelled
}

public enum MaintenanceStatus
{
    Pending,
    InProgress,
    Completed
}

public enum MaintenancePriority
{
    Low,
    Medium,
    High,
    Urgent
}

public enum OrderStatus
{
    Pending,
    Preparing,
    Delivered,
    Cancelled
}

public enum InventoryCategory
{
    Cleaning,
    Food,
    Beverages,
    Toiletries,
    Linens,
    Other
}
