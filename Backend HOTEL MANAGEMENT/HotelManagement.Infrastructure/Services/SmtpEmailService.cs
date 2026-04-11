using HotelManagement.Business.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net;
using System.Net.Mail;

namespace HotelManagement.Infrastructure.Services;

public class SmtpEmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<SmtpEmailService> _logger;

    public SmtpEmailService(IConfiguration config, ILogger<SmtpEmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    private bool IsEnabled => bool.TryParse(_config["Email:IsEnabled"], out var v) && v;

    public async Task SendReservationConfirmationAsync(
        string toEmail, string guestName, string reservationId,
        string roomNumber, DateTime checkIn, DateTime checkOut, decimal totalAmount)
    {
        var subject = "Rezervasyon Onayı – OtelOPS";
        var body = $@"
<html><body style='font-family: Arial, sans-serif; color: #333;'>
<div style='max-width:600px; margin:auto; border:1px solid #e5e7eb; border-radius:8px; overflow:hidden;'>
  <div style='background:#2563eb; padding:20px 30px;'>
    <h1 style='color:#fff; margin:0; font-size:22px;'>🏨 OtelOPS</h1>
    <p style='color:#bfdbfe; margin:4px 0 0;'>Rezervasyon Onayı</p>
  </div>
  <div style='padding:30px;'>
    <p>Sayın <strong>{guestName}</strong>,</p>
    <p>Rezervasyonunuz başarıyla oluşturulmuştur. Aşağıda rezervasyon bilgilerinizi bulabilirsiniz:</p>
    <table style='width:100%; border-collapse:collapse; margin:20px 0;'>
      <tr style='background:#f3f4f6;'>
        <td style='padding:10px 14px; font-weight:600;'>Rezervasyon No</td>
        <td style='padding:10px 14px;'>{reservationId}</td>
      </tr>
      <tr>
        <td style='padding:10px 14px; font-weight:600;'>Oda</td>
        <td style='padding:10px 14px;'>{roomNumber}</td>
      </tr>
      <tr style='background:#f3f4f6;'>
        <td style='padding:10px 14px; font-weight:600;'>Giriş Tarihi</td>
        <td style='padding:10px 14px;'>{checkIn:dd MMMM yyyy}</td>
      </tr>
      <tr>
        <td style='padding:10px 14px; font-weight:600;'>Çıkış Tarihi</td>
        <td style='padding:10px 14px;'>{checkOut:dd MMMM yyyy}</td>
      </tr>
      <tr style='background:#f3f4f6;'>
        <td style='padding:10px 14px; font-weight:600;'>Toplam Tutar</td>
        <td style='padding:10px 14px; font-size:16px; color:#2563eb;'><strong>{totalAmount:C2}</strong></td>
      </tr>
    </table>
    <p style='color:#6b7280; font-size:13px;'>Check-in saatimiz 14:00, check-out saatimiz 12:00'dir.</p>
    <p>Görüşmek üzere! 🌟</p>
  </div>
  <div style='background:#f9fafb; padding:16px 30px; text-align:center; color:#9ca3af; font-size:12px;'>
    OtelOPS — Otel Yönetim Sistemi
  </div>
</div>
</body></html>";

        await SendAsync(toEmail, subject, body);
    }

    public async Task SendCheckInReminderAsync(
        string toEmail, string guestName, string reservationId,
        string roomNumber, DateTime checkIn)
    {
        var subject = "Yarın Check-in Hatırlatıcısı – OtelOPS";
        var body = $@"
<html><body style='font-family: Arial, sans-serif; color: #333;'>
<div style='max-width:600px; margin:auto; border:1px solid #e5e7eb; border-radius:8px; overflow:hidden;'>
  <div style='background:#059669; padding:20px 30px;'>
    <h1 style='color:#fff; margin:0; font-size:22px;'>🏨 OtelOPS</h1>
    <p style='color:#a7f3d0; margin:4px 0 0;'>Check-in Hatırlatıcısı</p>
  </div>
  <div style='padding:30px;'>
    <p>Sayın <strong>{guestName}</strong>,</p>
    <p>Yarın otelimize giriş yapacağınızı hatırlatmak istedik! 🎉</p>
    <table style='width:100%; border-collapse:collapse; margin:20px 0;'>
      <tr style='background:#f3f4f6;'>
        <td style='padding:10px 14px; font-weight:600;'>Rezervasyon No</td>
        <td style='padding:10px 14px;'>{reservationId}</td>
      </tr>
      <tr>
        <td style='padding:10px 14px; font-weight:600;'>Oda</td>
        <td style='padding:10px 14px;'>{roomNumber}</td>
      </tr>
      <tr style='background:#f3f4f6;'>
        <td style='padding:10px 14px; font-weight:600;'>Giriş Tarihi</td>
        <td style='padding:10px 14px; font-size:15px; color:#059669;'><strong>{checkIn:dd MMMM yyyy}</strong></td>
      </tr>
    </table>
    <p>Check-in saatimiz <strong>14:00</strong>'tir. Sizi bekliyoruz!</p>
  </div>
  <div style='background:#f9fafb; padding:16px 30px; text-align:center; color:#9ca3af; font-size:12px;'>
    OtelOPS — Otel Yönetim Sistemi
  </div>
</div>
</body></html>";

        await SendAsync(toEmail, subject, body);
    }

    private async Task SendAsync(string toEmail, string subject, string htmlBody)
    {
        if (!IsEnabled)
        {
            _logger.LogInformation("[Email disabled] To: {To} | Subject: {Subject}", toEmail, subject);
            return;
        }

        var host = _config["Email:SmtpHost"] ?? "smtp.gmail.com";
        var port = int.TryParse(_config["Email:SmtpPort"], out var p) ? p : 587;
        var from = _config["Email:SenderAddress"] ?? "noreply@otelops.com";
        var fromName = _config["Email:SenderName"] ?? "OtelOPS";
        var password = _config["Email:Password"] ?? "";
        var enableSsl = !bool.TryParse(_config["Email:EnableSsl"], out var ssl) || ssl;

        using var client = new SmtpClient(host, port)
        {
            Credentials = new NetworkCredential(from, password),
            EnableSsl = enableSsl,
        };

        var msg = new MailMessage
        {
            From = new MailAddress(from, fromName),
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true,
        };
        msg.To.Add(toEmail);

        await client.SendMailAsync(msg);
        _logger.LogInformation("[Email sent] To: {To} | Subject: {Subject}", toEmail, subject);
    }
}
