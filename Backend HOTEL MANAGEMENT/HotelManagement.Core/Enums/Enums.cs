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

public enum PaymentStatus
{
    Pending,
    Completed,
    PartiallyPaid,
    Refunded,
    Failed
}

public enum PaymentType
{
    Reservation,
    RoomService,
    Deposit,
    Refund,
    AdditionalCharge,
    RestaurantCharge,
    BarCharge
}

public enum PosCategory
{
    Restaurant,
    Bar,
    Spa,
    Minibar,
    Laundry,
    Other
}

public enum PosStatus
{
    Pending,
    ChargedToRoom,
    Paid,
    Cancelled
}

public enum HousekeepingTaskType
{
    DailyClean,
    DeepClean,
    TurnDown,
    LinenChange,
    CheckoutClean
}

public enum HousekeepingStatus
{
    Pending,
    InProgress,
    Completed,
    Skipped
}

public enum InvoiceStatus
{
    Draft,
    Issued,
    Paid,
    Cancelled
}

public enum DynamicPricingTrigger
{
    OccupancyBased,
    DaysBefore,
    SeasonBased
}
