using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace YLWorks.Hubs
{
    [Authorize]
    public class NotificationHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            var userId = Context.User?
                .FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (Guid.TryParse(userId, out var id))
            {
                await Groups.AddToGroupAsync(
                    Context.ConnectionId,
                    $"user-{id}"
                );
            }

            await base.OnConnectedAsync();
        }
    }
}
