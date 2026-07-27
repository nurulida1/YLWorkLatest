using Microsoft.AspNetCore.DataProtection;

namespace YLWorks.Services.Leave
{
    public class LeaveCalendarTokenProtector
    {
        private readonly IDataProtector _protector;

        public LeaveCalendarTokenProtector(IDataProtectionProvider provider) =>
            _protector = provider.CreateProtector("LeaveCalendarTokens");

        public string Protect(string value) => _protector.Protect(value);

        public string Unprotect(string protectedValue) => _protector.Unprotect(protectedValue);
    }
}
