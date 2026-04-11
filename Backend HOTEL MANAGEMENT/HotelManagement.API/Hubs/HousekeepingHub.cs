using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace HotelManagement.API.Hubs;

[AllowAnonymous]
public class HousekeepingHub : Hub
{
    public async Task JoinHousekeepingGroup()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "housekeeping");
    }

    public async Task LeaveHousekeepingGroup()
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, "housekeeping");
    }
}
