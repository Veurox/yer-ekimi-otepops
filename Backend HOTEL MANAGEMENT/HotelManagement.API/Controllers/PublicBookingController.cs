using HotelManagement.Business.DTOs;
using HotelManagement.Business.Interfaces;
using HotelManagement.Core.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HotelManagement.API.Controllers;

[ApiController]
[Route("api/public/booking")]
[AllowAnonymous]
public class PublicBookingController : ControllerBase
{
    private readonly IRoomService _roomService;
    private readonly IReservationService _reservationService;
    private readonly IDynamicPricingService _dynamicPricingService;

    public PublicBookingController(
        IRoomService roomService,
        IReservationService reservationService,
        IDynamicPricingService dynamicPricingService)
    {
        _roomService = roomService;
        _reservationService = reservationService;
        _dynamicPricingService = dynamicPricingService;
    }

    [HttpGet("available-rooms")]
    public async Task<ActionResult<List<AvailableRoomDto>>> GetAvailableRooms(
        [FromQuery] DateTime checkIn,
        [FromQuery] DateTime checkOut,
        [FromQuery] int guests = 1)
    {
        if (checkIn.Date < DateTime.UtcNow.Date)
            return BadRequest("Giriş tarihi geçmiş bir tarih olamaz.");
        if (checkOut <= checkIn)
            return BadRequest("Çıkış tarihi, giriş tarihinden sonra olmalıdır.");
        if (guests < 1 || guests > 10)
            return BadRequest("Misafir sayısı 1-10 arasında olmalıdır.");

        var allRooms = await _roomService.GetAllRoomsAsync();
        var allReservations = await _reservationService.GetAllReservationsAsync();

        // Find rooms with overlapping active reservations
        var occupiedRoomIds = allReservations
            .Where(r => r.Status != "Cancelled" && r.Status != "CheckedOut" &&
                        DateTime.Parse(r.CheckInDate.ToString("yyyy-MM-dd")) < checkOut.Date &&
                        DateTime.Parse(r.CheckOutDate.ToString("yyyy-MM-dd")) > checkIn.Date)
            .Select(r => r.RoomId)
            .ToHashSet();

        var nightCount = (int)(checkOut.Date - checkIn.Date).TotalDays;

        var availableRooms = new List<AvailableRoomDto>();

        foreach (var room in allRooms)
        {
            // Skip occupied, maintenance, or cleaning rooms
            if (occupiedRoomIds.Contains(room.Id))
                continue;
            if (room.Status.Equals("Maintenance", StringComparison.OrdinalIgnoreCase) ||
                room.Status.Equals("Cleaning", StringComparison.OrdinalIgnoreCase))
                continue;
            // Capacity check
            if (room.Capacity < guests)
                continue;

            // Calculate dynamic price
            decimal finalPricePerNight = room.Price;
            var appliedRules = new List<string>();

            try
            {
                var priceResult = await _dynamicPricingService.CalculateDynamicPriceAsync(room.Id, checkIn);
                finalPricePerNight = priceResult.AdjustedPrice;
                appliedRules = priceResult.AppliedRules;
            }
            catch
            {
                // If dynamic pricing fails, use base price
            }

            availableRooms.Add(new AvailableRoomDto
            {
                Id = room.Id,
                Number = room.Number,
                Type = room.Type,
                Floor = room.Floor,
                Capacity = room.Capacity,
                Features = room.Features,
                BasePrice = room.Price,
                FinalPricePerNight = finalPricePerNight,
                NightCount = nightCount,
                TotalPrice = finalPricePerNight * nightCount,
                AppliedRules = appliedRules
            });
        }

        // Sort by price ascending
        availableRooms = availableRooms.OrderBy(r => r.TotalPrice).ToList();

        return Ok(availableRooms);
    }

    [HttpPost("reserve")]
    public async Task<ActionResult<BookingConfirmationDto>> Reserve(PublicReservationRequest request)
    {
        // Map to CreateReservationDto with forced pay-at-hotel
        var dto = new CreateReservationDto
        {
            RoomId = request.RoomId,
            CheckInDate = request.CheckInDate,
            CheckOutDate = request.CheckOutDate,
            NumberOfGuests = request.NumberOfGuests,
            SpecialRequests = request.SpecialRequests,
            PrimaryGuestName = request.PrimaryGuestName,
            PrimaryGuestEmail = request.PrimaryGuestEmail,
            PrimaryGuestPhone = request.PrimaryGuestPhone,
            PrimaryGuestIdNumber = request.PrimaryGuestIdNumber,
            PrimaryGuestAddress = request.PrimaryGuestAddress,
            AdditionalGuests = request.AdditionalGuests,
            PaymentMethod = "PayAtHotel",
            PaidAmount = 0
        };

        // Calculate total amount
        var nightCount = (int)(request.CheckOutDate.Date - request.CheckInDate.Date).TotalDays;
        decimal pricePerNight;

        try
        {
            var priceResult = await _dynamicPricingService.CalculateDynamicPriceAsync(request.RoomId, request.CheckInDate);
            pricePerNight = priceResult.AdjustedPrice;
        }
        catch
        {
            var room = await _roomService.GetRoomByIdAsync(request.RoomId);
            if (room == null) return NotFound("Oda bulunamadı.");
            pricePerNight = room.Price;
        }

        dto.TotalAmount = pricePerNight * nightCount;

        try
        {
            var reservation = await _reservationService.CreateReservationAsync(dto);

            var roomInfo = await _roomService.GetRoomByIdAsync(request.RoomId);

            return Ok(new BookingConfirmationDto
            {
                ReservationId = reservation.Id,
                RoomNumber = roomInfo?.Number ?? "",
                RoomType = roomInfo?.Type ?? "",
                CheckInDate = reservation.CheckInDate,
                CheckOutDate = reservation.CheckOutDate,
                NightCount = nightCount,
                TotalAmount = reservation.TotalAmount,
                GuestName = request.PrimaryGuestName,
                Status = reservation.Status
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
