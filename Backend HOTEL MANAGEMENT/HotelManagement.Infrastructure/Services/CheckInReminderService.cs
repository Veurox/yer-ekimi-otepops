using HotelManagement.Business.Interfaces;
using HotelManagement.Core.Entities;
using HotelManagement.Core.Enums;
using HotelManagement.Core.Interfaces;
using HotelManagement.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace HotelManagement.Infrastructure.Services;

/// <summary>
/// Background service that runs once per hour and sends check-in reminder emails
/// to guests whose check-in is exactly tomorrow.
/// </summary>
public class CheckInReminderService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<CheckInReminderService> _logger;
    private static readonly TimeSpan _interval = TimeSpan.FromHours(1);

    public CheckInReminderService(IServiceScopeFactory scopeFactory, ILogger<CheckInReminderService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("CheckInReminderService started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessRemindersAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in CheckInReminderService.");
            }

            await Task.Delay(_interval, stoppingToken);
        }
    }

    private async Task ProcessRemindersAsync()
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

        var tomorrow = DateTime.UtcNow.Date.AddDays(1);

        var reservations = await db.Reservations
            .Where(r =>
                r.CheckInDate.Date == tomorrow &&
                r.Status == ReservationStatus.Confirmed &&
                !r.ReminderEmailSent)
            .Include(r => r.Room)
            .ToListAsync();

        if (!reservations.Any())
        {
            _logger.LogDebug("No reminders to send for {Date}.", tomorrow.ToString("yyyy-MM-dd"));
            return;
        }

        _logger.LogInformation("Sending {Count} check-in reminder(s) for {Date}.", reservations.Count, tomorrow.ToString("yyyy-MM-dd"));

        foreach (var res in reservations)
        {
            var guest = await db.Guests.FindAsync(res.GuestId);
            if (guest == null || string.IsNullOrWhiteSpace(guest.Email))
            {
                _logger.LogWarning("No email for guest {GuestId}, skipping reminder.", res.GuestId);
                res.ReminderEmailSent = true;
                continue;
            }

            try
            {
                await emailService.SendCheckInReminderAsync(
                    toEmail: guest.Email,
                    guestName: guest.Name,
                    reservationId: res.Id.ToString(),
                    roomNumber: res.Room?.Number ?? "?",
                    checkIn: res.CheckInDate);

                res.ReminderEmailSent = true;
                res.ReminderEmailSentAt = DateTime.UtcNow;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send reminder to {Email}.", guest.Email);
            }
        }

        await db.SaveChangesAsync();
    }
}
