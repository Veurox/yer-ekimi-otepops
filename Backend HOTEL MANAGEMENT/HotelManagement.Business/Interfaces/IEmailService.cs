namespace HotelManagement.Business.Interfaces;

public interface IEmailService
{
    Task SendReservationConfirmationAsync(
        string toEmail,
        string guestName,
        string reservationId,
        string roomNumber,
        DateTime checkIn,
        DateTime checkOut,
        decimal totalAmount);

    Task SendCheckInReminderAsync(
        string toEmail,
        string guestName,
        string reservationId,
        string roomNumber,
        DateTime checkIn);
}
