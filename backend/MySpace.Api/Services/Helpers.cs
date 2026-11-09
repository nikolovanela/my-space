using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using MySpace.Api.Models;

namespace MySpace.Api.Services;

public static class UserExtensions
{
    public static int UserId(this ClaimsPrincipal p) =>
        int.Parse(p.FindFirstValue("sub")!);
}

public class TokenService(IConfiguration config)
{
    public string Create(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));
        return new JsonWebTokenHandler().CreateToken(new SecurityTokenDescriptor
        {
            Issuer = "myspace",
            Audience = "myspace",
            Subject = new ClaimsIdentity([new Claim("sub", user.Id.ToString()), new Claim("name", user.Name)]),
            Expires = DateTime.UtcNow.AddDays(30),
            SigningCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256),
        });
    }
}

// Пресметки со датуми во локалната временска зона на корисникот,
// за „денес“ и „оваа недела“ да значат исто што и на нејзиниот часовник.
public static class Clock
{
    public static TimeZoneInfo Zone(string id)
    {
        try { return TimeZoneInfo.FindSystemTimeZoneById(id); }
        catch { return TimeZoneInfo.Utc; }
    }

    public static DateOnly Today(TimeZoneInfo tz) =>
        DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz));

    public static DateOnly LocalDate(DateTime utc, TimeZoneInfo tz) =>
        DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(utc, DateTimeKind.Utc), tz));

    public static DateOnly WeekStart(DateOnly d) =>
        d.AddDays(-(((int)d.DayOfWeek + 6) % 7)); // понеделник

    // Почеток на локален ден, изразен во UTC (за филтрирање CompletedAt во базата).
    public static DateTime StartUtc(DateOnly d, TimeZoneInfo tz) =>
        TimeZoneInfo.ConvertTimeToUtc(d.ToDateTime(TimeOnly.MinValue), tz);

    // Тековна низа денови по ред (денес или вчера мора да е внатре).
    public static int CurrentStreak(HashSet<DateOnly> days, DateOnly today)
    {
        var d = days.Contains(today) ? today : today.AddDays(-1);
        var n = 0;
        while (days.Contains(d)) { n++; d = d.AddDays(-1); }
        return n;
    }

    public static int BestStreak(IEnumerable<DateOnly> days)
    {
        int best = 0, cur = 0; DateOnly? prev = null;
        foreach (var d in days.Distinct().OrderBy(x => x))
        {
            cur = prev.HasValue && prev.Value.AddDays(1) == d ? cur + 1 : 1;
            best = Math.Max(best, cur); prev = d;
        }
        return best;
    }
}
