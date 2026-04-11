namespace HotelManagement.Business.DTOs;

public class OccupancyReportDto
{
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public int TotalRooms { get; set; }
    public int OccupiedNights { get; set; }
    public int TotalNights { get; set; }
    public decimal OccupancyRate { get; set; }       // %
    public List<DailyOccupancyDto> DailyBreakdown { get; set; } = new();
}

public class DailyOccupancyDto
{
    public DateTime Date { get; set; }
    public int OccupiedRooms { get; set; }
    public int TotalRooms { get; set; }
    public decimal OccupancyRate { get; set; }
}

public class RevenueReportDto
{
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal RoomRevenue { get; set; }
    public decimal RoomServiceRevenue { get; set; }
    public decimal ADR { get; set; }                 // Average Daily Rate
    public decimal RevPAR { get; set; }              // Revenue Per Available Room
    public List<DailyRevenueDto> DailyBreakdown { get; set; } = new();
    public List<RevenueByRoomTypeDto> ByRoomType { get; set; } = new();
}

public class DailyRevenueDto
{
    public DateTime Date { get; set; }
    public decimal Revenue { get; set; }
    public int CheckIns { get; set; }
    public int CheckOuts { get; set; }
}

public class RevenueByRoomTypeDto
{
    public string RoomType { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public int Nights { get; set; }
    public decimal OccupancyRate { get; set; }
}

public class ReservationStatisticsDto
{
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public int TotalReservations { get; set; }
    public int PendingCount { get; set; }
    public int ConfirmedCount { get; set; }
    public int CheckedInCount { get; set; }
    public int CheckedOutCount { get; set; }
    public int CancelledCount { get; set; }
    public decimal CancellationRate { get; set; }
    public decimal AverageStayDuration { get; set; }  // nights
    public List<ReservationSourceDto> TopPaymentMethods { get; set; } = new();
}

public class ReservationSourceDto
{
    public string Name { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal Percentage { get; set; }
}

public class GuestStatisticsDto
{
    public int TotalGuests { get; set; }
    public int NewGuestsThisPeriod { get; set; }
    public int ReturningGuests { get; set; }
    public decimal AverageSpendPerGuest { get; set; }
    public List<TopGuestDto> TopGuests { get; set; } = new();
}

public class TopGuestDto
{
    public Guid GuestId { get; set; }
    public string GuestName { get; set; } = string.Empty;
    public int Visits { get; set; }
    public decimal TotalSpent { get; set; }
}

public class DashboardSummaryDto
{
    public DateTime Date { get; set; }
    public int TotalRooms { get; set; }
    public int OccupiedRooms { get; set; }
    public int AvailableRooms { get; set; }
    public int CleaningRooms { get; set; }
    public int MaintenanceRooms { get; set; }
    public decimal OccupancyRate { get; set; }
    public int TodayCheckIns { get; set; }
    public int TodayCheckOuts { get; set; }
    public int PendingReservations { get; set; }
    public decimal TodayRevenue { get; set; }
    public decimal MonthRevenue { get; set; }
    public decimal MonthRevPAR { get; set; }
    public decimal MonthADR { get; set; }
}
