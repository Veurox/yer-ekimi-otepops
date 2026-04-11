using HotelManagement.Business.DTOs;

namespace HotelManagement.Business.Interfaces;

public interface IReportingService
{
    Task<DashboardSummaryDto> GetDashboardSummaryAsync();
    Task<OccupancyReportDto> GetOccupancyReportAsync(DateTime fromDate, DateTime toDate);
    Task<RevenueReportDto> GetRevenueReportAsync(DateTime fromDate, DateTime toDate);
    Task<ReservationStatisticsDto> GetReservationStatisticsAsync(DateTime fromDate, DateTime toDate);
    Task<GuestStatisticsDto> GetGuestStatisticsAsync(DateTime fromDate, DateTime toDate);
}
