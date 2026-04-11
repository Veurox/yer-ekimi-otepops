using HotelManagement.Business.DTOs;
using HotelManagement.Business.Interfaces;
using HotelManagement.Core.Entities;
using HotelManagement.Core.Enums;
using HotelManagement.Core.Interfaces;

namespace HotelManagement.Business.Services;

public class ReportingService : IReportingService
{
    private readonly IGenericRepository<Room> _roomRepository;
    private readonly IGenericRepository<Reservation> _reservationRepository;
    private readonly IGenericRepository<Guest> _guestRepository;
    private readonly IGenericRepository<RoomServiceOrder> _roomServiceRepository;
    private readonly IGenericRepository<Payment> _paymentRepository;

    public ReportingService(
        IGenericRepository<Room> roomRepository,
        IGenericRepository<Reservation> reservationRepository,
        IGenericRepository<Guest> guestRepository,
        IGenericRepository<RoomServiceOrder> roomServiceRepository,
        IGenericRepository<Payment> paymentRepository)
    {
        _roomRepository        = roomRepository;
        _reservationRepository = reservationRepository;
        _guestRepository       = guestRepository;
        _roomServiceRepository = roomServiceRepository;
        _paymentRepository     = paymentRepository;
    }

    // ── Dashboard ──────────────────────────────────────────────────────────

    public async Task<DashboardSummaryDto> GetDashboardSummaryAsync()
    {
        var today  = DateTime.UtcNow.Date;
        var rooms  = (await _roomRepository.GetAllAsync()).ToList();
        var allRes = (await _reservationRepository.GetAllAsync()).ToList();

        int totalRooms       = rooms.Count;
        int occupiedRooms    = rooms.Count(r => r.Status == RoomStatus.Occupied);
        int availableRooms   = rooms.Count(r => r.Status == RoomStatus.Available);
        int cleaningRooms    = rooms.Count(r => r.Status == RoomStatus.Cleaning);
        int maintenanceRooms = rooms.Count(r => r.Status == RoomStatus.Maintenance);

        int todayCheckIns  = allRes.Count(r => r.CheckInDate.Date  == today && r.Status == ReservationStatus.CheckedIn);
        int todayCheckOuts = allRes.Count(r =>
            (r.ActualCheckOutDate?.Date ?? r.CheckOutDate.Date) == today &&
            r.Status == ReservationStatus.CheckedOut);
        int pending = allRes.Count(r => r.Status == ReservationStatus.Pending);

        // Revenue today: sum of PaidAmount for reservations that had any activity today
        var payments = (await _paymentRepository.GetAllAsync()).ToList();
        decimal todayRevenue = payments
            .Where(p => p.PaidAt.Date == today && p.Type != PaymentType.Refund && p.Status == PaymentStatus.Completed)
            .Sum(p => p.Amount);

        // Month revenue
        var monthStart = new DateTime(today.Year, today.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        decimal monthRevenue = payments
            .Where(p => p.PaidAt >= monthStart && p.Type != PaymentType.Refund && p.Status == PaymentStatus.Completed)
            .Sum(p => p.Amount);

        // Month ADR / RevPAR
        var monthRes = allRes.Where(r =>
            r.CheckInDate >= monthStart &&
            r.Status is ReservationStatus.CheckedIn or ReservationStatus.CheckedOut).ToList();

        int occupiedNights = monthRes.Sum(r =>
        {
            var co = r.ActualCheckOutDate ?? r.CheckOutDate;
            return Math.Max(1, (int)(co.Date - r.CheckInDate.Date).TotalDays);
        });
        int daysInPeriod = (today - monthStart).Days + 1;
        int totalAvailableRoomNights = totalRooms * daysInPeriod;

        decimal adr    = occupiedNights > 0 ? monthRevenue / occupiedNights : 0;
        decimal revpar = totalAvailableRoomNights > 0 ? monthRevenue / totalAvailableRoomNights : 0;
        decimal occRate = totalAvailableRoomNights > 0
            ? Math.Round((decimal)occupiedNights / totalAvailableRoomNights * 100, 1)
            : 0;

        return new DashboardSummaryDto
        {
            Date                = today,
            TotalRooms          = totalRooms,
            OccupiedRooms       = occupiedRooms,
            AvailableRooms      = availableRooms,
            CleaningRooms       = cleaningRooms,
            MaintenanceRooms    = maintenanceRooms,
            OccupancyRate       = occRate,
            TodayCheckIns       = todayCheckIns,
            TodayCheckOuts      = todayCheckOuts,
            PendingReservations = pending,
            TodayRevenue        = todayRevenue,
            MonthRevenue        = monthRevenue,
            MonthRevPAR         = Math.Round(revpar, 2),
            MonthADR            = Math.Round(adr, 2)
        };
    }

    // ── Occupancy ──────────────────────────────────────────────────────────

    public async Task<OccupancyReportDto> GetOccupancyReportAsync(DateTime fromDate, DateTime toDate)
    {
        fromDate = fromDate.Date;
        toDate   = toDate.Date;

        var rooms  = (await _roomRepository.GetAllAsync()).ToList();
        var allRes = (await _reservationRepository.GetAllAsync())
            .Where(r => r.Status is ReservationStatus.CheckedIn or ReservationStatus.CheckedOut or ReservationStatus.Confirmed)
            .ToList();

        int totalRooms    = rooms.Count;
        int totalNights   = (int)(toDate - fromDate).TotalDays + 1;
        int occupiedNights = 0;

        var daily = new List<DailyOccupancyDto>();
        for (var d = fromDate; d <= toDate; d = d.AddDays(1))
        {
            int occ = allRes.Count(r => r.CheckInDate.Date <= d && (r.ActualCheckOutDate ?? r.CheckOutDate).Date > d);
            occupiedNights += occ;
            daily.Add(new DailyOccupancyDto
            {
                Date          = d,
                OccupiedRooms = occ,
                TotalRooms    = totalRooms,
                OccupancyRate = totalRooms > 0 ? Math.Round((decimal)occ / totalRooms * 100, 1) : 0
            });
        }

        int totalRoomNights = totalRooms * totalNights;
        return new OccupancyReportDto
        {
            FromDate       = fromDate,
            ToDate         = toDate,
            TotalRooms     = totalRooms,
            OccupiedNights = occupiedNights,
            TotalNights    = totalRoomNights,
            OccupancyRate  = totalRoomNights > 0 ? Math.Round((decimal)occupiedNights / totalRoomNights * 100, 1) : 0,
            DailyBreakdown = daily
        };
    }

    // ── Revenue ───────────────────────────────────────────────────────────

    public async Task<RevenueReportDto> GetRevenueReportAsync(DateTime fromDate, DateTime toDate)
    {
        fromDate = fromDate.Date;
        var toDateEnd = toDate.Date.AddDays(1).AddTicks(-1);

        var payments = (await _paymentRepository.GetAllAsync())
            .Where(p => p.PaidAt >= fromDate && p.PaidAt <= toDateEnd && p.Status == PaymentStatus.Completed)
            .ToList();

        var allRes = (await _reservationRepository.GetAllAsync())
            .Where(r => r.CheckInDate >= fromDate && r.CheckInDate <= toDateEnd)
            .ToList();

        var rooms = (await _roomRepository.GetAllAsync()).ToList();

        decimal totalRevenue       = payments.Where(p => p.Type != PaymentType.Refund).Sum(p => p.Amount)
                                   - payments.Where(p => p.Type == PaymentType.Refund).Sum(p => p.Amount);
        decimal roomRevenue        = payments.Where(p => p.Type == PaymentType.Reservation).Sum(p => p.Amount);
        decimal roomServiceRevenue = payments.Where(p => p.Type == PaymentType.RoomService).Sum(p => p.Amount);

        // ADR & RevPAR
        int occupiedNights = allRes
            .Where(r => r.Status is ReservationStatus.CheckedIn or ReservationStatus.CheckedOut)
            .Sum(r => Math.Max(1, (int)((r.ActualCheckOutDate ?? r.CheckOutDate).Date - r.CheckInDate.Date).TotalDays));

        int periodDays             = (int)(toDate.Date - fromDate).TotalDays + 1;
        int totalAvailableNights   = rooms.Count * periodDays;

        decimal adr    = occupiedNights > 0 ? Math.Round(totalRevenue / occupiedNights, 2) : 0;
        decimal revpar = totalAvailableNights > 0 ? Math.Round(totalRevenue / totalAvailableNights, 2) : 0;

        // Daily breakdown
        var daily = new List<DailyRevenueDto>();
        for (var d = fromDate; d <= toDate.Date; d = d.AddDays(1))
        {
            var dEnd = d.AddDays(1).AddTicks(-1);
            decimal dayRev = payments
                .Where(p => p.PaidAt >= d && p.PaidAt <= dEnd && p.Type != PaymentType.Refund)
                .Sum(p => p.Amount);
            int checkIns  = allRes.Count(r => r.CheckInDate.Date  == d && r.Status == ReservationStatus.CheckedIn);
            int checkOuts = allRes.Count(r => (r.ActualCheckOutDate ?? r.CheckOutDate).Date == d && r.Status == ReservationStatus.CheckedOut);
            daily.Add(new DailyRevenueDto { Date = d, Revenue = dayRev, CheckIns = checkIns, CheckOuts = checkOuts });
        }

        // By room type
        var byType = new List<RevenueByRoomTypeDto>();
        var roomTypeGroups = allRes
            .Where(r => r.Status is ReservationStatus.CheckedIn or ReservationStatus.CheckedOut)
            .GroupBy(r => rooms.FirstOrDefault(rm => rm.Id == r.RoomId)?.Type.ToString() ?? "Unknown");
        foreach (var g in roomTypeGroups)
        {
            var nights = g.Sum(r => Math.Max(1, (int)((r.ActualCheckOutDate ?? r.CheckOutDate).Date - r.CheckInDate.Date).TotalDays));
            var rev    = g.Sum(r => r.TotalAmount);
            byType.Add(new RevenueByRoomTypeDto
            {
                RoomType      = g.Key,
                Revenue       = rev,
                Nights        = nights,
                OccupancyRate = totalAvailableNights > 0 ? Math.Round((decimal)nights / (rooms.Count(rm => rm.Type.ToString() == g.Key) * periodDays) * 100, 1) : 0
            });
        }

        return new RevenueReportDto
        {
            FromDate           = fromDate,
            ToDate             = toDate.Date,
            TotalRevenue       = totalRevenue,
            RoomRevenue        = roomRevenue,
            RoomServiceRevenue = roomServiceRevenue,
            ADR                = adr,
            RevPAR             = revpar,
            DailyBreakdown     = daily,
            ByRoomType         = byType
        };
    }

    // ── Reservation Statistics ────────────────────────────────────────────

    public async Task<ReservationStatisticsDto> GetReservationStatisticsAsync(DateTime fromDate, DateTime toDate)
    {
        fromDate = fromDate.Date;
        toDate   = toDate.Date.AddDays(1).AddTicks(-1);

        var res = (await _reservationRepository.GetAllAsync())
            .Where(r => r.CreatedAt >= fromDate && r.CreatedAt <= toDate)
            .ToList();

        int total      = res.Count;
        int cancelled  = res.Count(r => r.Status == ReservationStatus.Cancelled);
        int checkedOut = res.Count(r => r.Status == ReservationStatus.CheckedOut);

        double avgStay = res
            .Where(r => r.Status == ReservationStatus.CheckedOut)
            .Select(r => (r.ActualCheckOutDate ?? r.CheckOutDate).Date - r.CheckInDate.Date)
            .DefaultIfEmpty(TimeSpan.Zero)
            .Average(t => t.TotalDays);

        var methodGroups = res.GroupBy(r => r.PaymentMethod)
            .Select(g => new ReservationSourceDto
            {
                Name       = string.IsNullOrEmpty(g.Key) ? "Belirtilmemiş" : g.Key,
                Count      = g.Count(),
                Percentage = total > 0 ? Math.Round((decimal)g.Count() / total * 100, 1) : 0
            })
            .OrderByDescending(x => x.Count)
            .ToList();

        return new ReservationStatisticsDto
        {
            FromDate              = fromDate,
            ToDate                = toDate,
            TotalReservations     = total,
            PendingCount          = res.Count(r => r.Status == ReservationStatus.Pending),
            ConfirmedCount        = res.Count(r => r.Status == ReservationStatus.Confirmed),
            CheckedInCount        = res.Count(r => r.Status == ReservationStatus.CheckedIn),
            CheckedOutCount       = checkedOut,
            CancelledCount        = cancelled,
            CancellationRate      = total > 0 ? Math.Round((decimal)cancelled / total * 100, 1) : 0,
            AverageStayDuration   = (decimal)Math.Round(avgStay, 1),
            TopPaymentMethods     = methodGroups
        };
    }

    // ── Guest Statistics ──────────────────────────────────────────────────

    public async Task<GuestStatisticsDto> GetGuestStatisticsAsync(DateTime fromDate, DateTime toDate)
    {
        fromDate = fromDate.Date;
        toDate   = toDate.Date.AddDays(1).AddTicks(-1);

        var guests = (await _guestRepository.GetAllAsync()).Where(g => g.IsActive).ToList();
        var newGuests = guests.Count; // all active guests (visits tracked via Visits field)
        int returning = guests.Count(g => g.Visits > 1);

        decimal avgSpend = guests.Any()
            ? Math.Round(guests.Average(g => g.TotalSpent), 2)
            : 0;

        var top = guests
            .OrderByDescending(g => g.TotalSpent)
            .Take(10)
            .Select(g => new TopGuestDto
            {
                GuestId    = g.Id,
                GuestName  = g.Name,
                Visits     = g.Visits,
                TotalSpent = g.TotalSpent
            })
            .ToList();

        return new GuestStatisticsDto
        {
            TotalGuests           = guests.Count,
            NewGuestsThisPeriod   = newGuests,
            ReturningGuests       = returning,
            AverageSpendPerGuest  = avgSpend,
            TopGuests             = top
        };
    }
}
