using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MySpace.Api.Data;
using MySpace.Api.Dtos;
using MySpace.Api.Models;
using MySpace.Api.Services;

namespace MySpace.Api.Controllers;

[ApiController, Authorize]
[Route("api/habits")]
public class HabitsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<List<HabitDto>> List()
    {
        var today = await Today();
        var habits = await db.Habits.Include(h => h.Logs)
            .Where(h => h.UserId == User.UserId() && !h.IsArchived)
            .OrderBy(h => h.Id).ToListAsync();
        return habits.Select(h => ToDto(h, today)).ToList();
    }

    [HttpPost]
    public async Task<HabitDto> Create(HabitRequest req)
    {
        var h = new Habit { UserId = User.UserId(), Title = req.Title.Trim(), Area = req.Area ?? "Личен живот", Color = req.Color ?? "sage" };
        db.Habits.Add(h);
        await db.SaveChangesAsync();
        return ToDto(h, await Today());
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<HabitDto>> Update(int id, HabitRequest req)
    {
        var h = await Find(id);
        if (h is null) return NotFound();
        h.Title = req.Title.Trim();
        h.Area = req.Area ?? h.Area;
        h.Color = req.Color ?? h.Color;
        await db.SaveChangesAsync();
        return ToDto(h, await Today());
    }

    // Означи/одзначи навика за даден ден (стандардно денес).
    [HttpPost("{id:int}/toggle")]
    public async Task<ActionResult<HabitDto>> Toggle(int id, HabitToggleRequest req)
    {
        var h = await Find(id);
        if (h is null) return NotFound();
        var today = await Today();
        if (req.Date > today) return BadRequest(new { error = "Не можеш да означиш ден во иднина." });
        var log = h.Logs.FirstOrDefault(l => l.Date == req.Date);
        if (log is null) h.Logs.Add(new HabitLog { Date = req.Date });
        else h.Logs.Remove(log);
        await db.SaveChangesAsync();
        return ToDto(h, today);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var h = await Find(id);
        if (h is null) return NotFound();
        db.Habits.Remove(h);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private Task<Habit?> Find(int id) =>
        db.Habits.Include(h => h.Logs).FirstOrDefaultAsync(h => h.Id == id && h.UserId == User.UserId());

    private async Task<DateOnly> Today()
    {
        var tz = await db.Users.Where(u => u.Id == User.UserId()).Select(u => u.TimeZone).FirstAsync();
        return Clock.Today(Clock.Zone(tz));
    }

    private static HabitDto ToDto(Habit h, DateOnly today)
    {
        var days = h.Logs.Select(l => l.Date).OrderBy(d => d).ToList();
        return new HabitDto(h.Id, h.Title, h.Area, h.Color,
            days.Where(d => d >= today.AddDays(-120)).ToList(),
            Clock.CurrentStreak(days.ToHashSet(), today), Clock.BestStreak(days), days.Count);
    }
}
