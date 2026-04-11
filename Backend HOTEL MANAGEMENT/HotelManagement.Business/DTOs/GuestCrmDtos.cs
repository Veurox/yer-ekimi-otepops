namespace HotelManagement.Business.DTOs;

public record GuestPreferenceDto(Guid Id, string Category, string Key, string Value, string? Notes, DateTime CreatedAt);

public record GuestNoteDto(Guid Id, string Note, string? AddedBy, bool IsImportant, DateTime CreatedAt);

public record GuestProfileDto(
    Guid GuestId,
    string Name,
    string? Email,
    string? Phone,
    int TotalStays,
    decimal TotalSpent,
    int LoyaltyPoints,
    string? VipLevel,
    List<GuestPreferenceDto> Preferences,
    List<GuestNoteDto> Notes,
    List<string> RecentRoomTypes
);

public class AddPreferenceDto
{
    public string Category { get; set; } = "";
    public string Key { get; set; } = "";
    public string Value { get; set; } = "";
    public string? Notes { get; set; }
}

public class AddNoteDto
{
    public string Note { get; set; } = "";
    public bool IsImportant { get; set; }
}
