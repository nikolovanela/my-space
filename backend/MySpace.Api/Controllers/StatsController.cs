using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MySpace.Api.Data;
using MySpace.Api.Dtos;
using MySpace.Api.Models;
using MySpace.Api.Services;

namespace MySpace.Api.Controllers;

// Дневен и неделен напредок: сè што Dashboard и Progress страницата прикажуваат.
[ApiController, Authorize]
[Route("api")]
public class StatsController(AppDbContext db) : ControllerBase
{
    private const int DayWindow = 84;   // 12 недели за heatmap
    private const int WeekWindow = 8;

    [HttpGet("stats/overview")]
    public async Task<IActionResult> Overview()
    {
        var uid = User.UserId();
        var tz = Clock.Zone(await db.Users.Where(u => u.Id == uid).Select(u => u.TimeZone).FirstAsync());
        var today = Clock.Today(tz);
        var from = today.AddDays(-(DayWindow - 1));
        var fromUtc = Clock.StartUtc(from, tz);

        var completed = (await db.Tasks.Where(t => t.UserId == uid && t.CompletedAt >= fromUtc)
                .Select(t => new { t.CompletedAt, t.Area }).ToListAsync())
            .Select(t => new { Date = Clock.LocalDate(t.CompletedAt!.Value, tz), t.Area }).ToList();

        var habits = await db.Habits.Where(h => h.UserId == uid && !h.IsArchived)
            .Select(h => new { h.Id, h.CreatedAt }).ToListAsync();
        var habitIds = habits.Select(h => h.Id).ToList();
        var logs = await db.HabitLogs.Where(l => habitIds.Contains(l.HabitId) && l.Date >= from)
            .Select(l => new { l.HabitId, l.Date }).ToListAsync();
        var journal = await db.JournalEntries.Where(j => j.UserId == uid && j.Date >= from)
            .Select(j => new { j.Date, j.Mood }).ToListAsync();

        // Навиката „постои“ од денот кога е креирана, или од првиот означен ден ако е означен и претходно.
        var habitStart = habits.ToDictionary(h => h.Id, h =>
        {
            var created = Clock.LocalDate(h.CreatedAt, tz);
            var firstLog = logs.Where(l => l.HabitId == h.Id).Select(l => (DateOnly?)l.Date).Min();
            return firstLog.HasValue && firstLog.Value < created ? firstLog.Value : created;
        });
        int HabitsTotal(DateOnly d) => habitStart.Values.Count(s => s <= d);

        var days = Enumerable.Range(0, DayWindow).Select(i => from.AddDays(i)).Select(d =>
        {
            var moods = journal.Where(j => j.Date == d && j.Mood.HasValue).Select(j => j.Mood!.Value).ToList();
            return new
            {
                date = d,
                tasksCompleted = completed.Count(c => c.Date == d),
                habitsDone = logs.Count(l => l.Date == d),
                habitsTotal = HabitsTotal(d),
                journal = journal.Any(j => j.Date == d),
                mood = moods.Count > 0 ? Math.Round(moods.Average(), 1) : (double?)null,
            };
        }).ToList();

        var thisWeek = Clock.WeekStart(today);
        var weeks = Enumerable.Range(0, WeekWindow).Select(i => thisWeek.AddDays(-7 * (WeekWindow - 1 - i))).Select(ws =>
        {
            var we = ws.AddDays(6);
            var span = days.Where(d => d.date >= ws && d.date <= we && d.date <= today).ToList();
            var possible = span.Sum(d => d.habitsTotal);
            return new
            {
                weekStart = ws,
                tasksCompleted = span.Sum(d => d.tasksCompleted),
                habitRate = possible > 0 ? (int)Math.Round(100.0 * span.Sum(d => d.habitsDone) / possible) : 0,
                journalDays = span.Count(d => d.journal),
            };
        }).ToList();

        var openTasks = await db.Tasks.Where(t => t.UserId == uid && !t.IsDone).Select(t => new { t.DueDate, t.Area }).ToListAsync();
        var areas = openTasks.Select(t => t.Area).Concat(completed.Select(c => c.Area)).Distinct().Select(a => new
        {
            area = a,
            open = openTasks.Count(t => t.Area == a),
            doneThisWeek = completed.Count(c => c.Area == a && c.Date >= thisWeek),
        }).OrderByDescending(a => a.open + a.doneThisWeek).ToList();

        var activeDays = days.Where(d => d.tasksCompleted > 0 || d.habitsDone > 0 || d.journal).Select(d => d.date).ToHashSet();
        var todayRow = days.Last();
        var weekRow = weeks.Last();

        return Ok(new
        {
            today = new
            {
                date = today,
                tasksCompleted = todayRow.tasksCompleted,
                tasksDue = openTasks.Count(t => t.DueDate <= today),
                habitsDone = todayRow.habitsDone,
                habitsTotal = todayRow.habitsTotal,
                journal = todayRow.journal,
            },
            week = new
            {
                weekStart = thisWeek,
                tasksCompleted = weekRow.tasksCompleted,
                lastWeekTasksCompleted = weeks[^2].tasksCompleted,
                habitRate = weekRow.habitRate,
                journalDays = weekRow.journalDays,
            },
            activityStreak = Clock.CurrentStreak(activeDays, today),
            days,
            weeks,
            areas,
        });
    }

    // Неделен преглед: автоматски резиме за неделата + твоја рефлексија.
    [HttpGet("reviews/{weekStart?}")]
    public async Task<IActionResult> GetReview(DateOnly? weekStart = null)
    {
        var uid = User.UserId();
        var tz = Clock.Zone(await db.Users.Where(u => u.Id == uid).Select(u => u.TimeZone).FirstAsync());
        var today = Clock.Today(tz);
        var ws = Clock.WeekStart(weekStart ?? today);
        var we = ws.AddDays(6);
        var fromUtc = Clock.StartUtc(ws, tz);
        var toUtc = Clock.StartUtc(we.AddDays(1), tz);
        var lastDay = we < today ? we : today;

        var done = await db.Tasks.Where(t => t.UserId == uid && t.CompletedAt >= fromUtc && t.CompletedAt < toUtc)
            .OrderBy(t => t.CompletedAt).ToListAsync();
        // Одложени = отворени задачи чиј рок веќе поминал (за тековната недела: до вчера).
        var lateCutoff = we < today ? we : today.AddDays(-1);
        var postponed = await db.Tasks.Where(t => t.UserId == uid && !t.IsDone && t.DueDate != null && t.DueDate <= lateCutoff)
            .OrderBy(t => t.DueDate).ToListAsync();
        var created = await db.Tasks.CountAsync(t => t.UserId == uid && t.CreatedAt >= fromUtc && t.CreatedAt < toUtc);

        var habits = await db.Habits.Include(h => h.Logs).Where(h => h.UserId == uid && !h.IsArchived).ToListAsync();
        var habitRows = habits.Select(h =>
        {
            var start = Clock.LocalDate(h.CreatedAt, tz);
            var firstLog = h.Logs.Select(l => (DateOnly?)l.Date).Min();
            if (firstLog.HasValue && firstLog.Value < start) start = firstLog.Value;
            var first = start > ws ? start : ws;
            var possible = Math.Max(0, lastDay.DayNumber - first.DayNumber + 1);
            var count = h.Logs.Count(l => l.Date >= ws && l.Date <= we);
            return new { h.Id, h.Title, done = count, possible };
        }).ToList();
        var possibleAll = habitRows.Sum(h => h.possible);

        var entries = await db.JournalEntries.Where(j => j.UserId == uid && j.Date >= ws && j.Date <= we).OrderBy(j => j.Date).ToListAsync();
        var moods = entries.Where(e => e.Mood.HasValue).Select(e => e.Mood!.Value).ToList();

        var steps = await db.GoalSteps.Where(s => s.CompletedAt >= fromUtc && s.CompletedAt < toUtc)
            .Join(db.Goals.Where(g => g.UserId == uid), s => s.GoalId, g => g.Id, (s, g) => new { step = s.Title, goal = g.Title })
            .ToListAsync();

        var review = await db.WeeklyReviews.FirstOrDefaultAsync(r => r.UserId == uid && r.WeekStart == ws);

        return Ok(new
        {
            weekStart = ws,
            weekEnd = we,
            isCurrent = ws == Clock.WeekStart(today),
            completed = done.Select(TaskDto.From),
            postponed = postponed.Select(TaskDto.From),
            createdCount = created,
            habits = habitRows,
            habitRate = possibleAll > 0 ? (int)Math.Round(100.0 * habitRows.Sum(h => h.done) / possibleAll) : 0,
            journalCount = entries.Count,
            avgMood = moods.Count > 0 ? Math.Round(moods.Average(), 1) : (double?)null,
            wins = entries.Where(e => !string.IsNullOrWhiteSpace(e.Win)).Select(e => new { e.Date, text = e.Win }),
            lessons = entries.Where(e => !string.IsNullOrWhiteSpace(e.Lesson)).Select(e => new { e.Date, text = e.Lesson }),
            goalSteps = steps,
            review = review is null ? null : new { review.WentWell, review.ToImprove, review.NextFocus, review.Rating, review.UpdatedAt },
        });
    }

    [HttpPut("reviews/{weekStart}")]
    public async Task<IActionResult> SaveReview(DateOnly weekStart, ReviewRequest req)
    {
        var uid = User.UserId();
        var ws = Clock.WeekStart(weekStart);
        var r = await db.WeeklyReviews.FirstOrDefaultAsync(x => x.UserId == uid && x.WeekStart == ws);
        if (r is null) db.WeeklyReviews.Add(r = new WeeklyReview { UserId = uid, WeekStart = ws });
        r.WentWell = req.WentWell;
        r.ToImprove = req.ToImprove;
        r.NextFocus = req.NextFocus;
        r.Rating = req.Rating;
        r.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(new { r.WentWell, r.ToImprove, r.NextFocus, r.Rating, r.UpdatedAt });
    }
}
