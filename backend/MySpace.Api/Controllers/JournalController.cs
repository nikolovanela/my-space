using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MySpace.Api.Data;
using MySpace.Api.Dtos;
using MySpace.Api.Models;
using MySpace.Api.Services;

namespace MySpace.Api.Controllers;

[ApiController, Authorize]
[Route("api/journal")]
public class JournalController(AppDbContext db) : ControllerBase
{
    // GET /api/journal?q=збор
    [HttpGet]
    public async Task<List<JournalDto>> List(string? q = null)
    {
        var query = db.JournalEntries.Where(j => j.UserId == User.UserId());
        if (!string.IsNullOrWhiteSpace(q))
        {
            var p = $"%{q.Trim()}%";
            query = query.Where(j => EF.Functions.ILike(j.Body, p) || EF.Functions.ILike(j.Title ?? "", p)
                || EF.Functions.ILike(j.Win ?? "", p) || EF.Functions.ILike(j.Lesson ?? "", p));
        }
        var items = await query.OrderByDescending(j => j.Date).ThenByDescending(j => j.CreatedAt).ToListAsync();
        return items.Select(JournalDto.From).ToList();
    }

    [HttpPost]
    public async Task<JournalDto> Create(JournalRequest req)
    {
        var tz = await db.Users.Where(u => u.Id == User.UserId()).Select(u => u.TimeZone).FirstAsync();
        var j = new JournalEntry { UserId = User.UserId(), Date = req.Date ?? Clock.Today(Clock.Zone(tz)) };
        Apply(j, req);
        db.JournalEntries.Add(j);
        await db.SaveChangesAsync();
        return JournalDto.From(j);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<JournalDto>> Update(int id, JournalRequest req)
    {
        var j = await db.JournalEntries.FirstOrDefaultAsync(x => x.Id == id && x.UserId == User.UserId());
        if (j is null) return NotFound();
        if (req.Date.HasValue) j.Date = req.Date.Value;
        Apply(j, req);
        await db.SaveChangesAsync();
        return JournalDto.From(j);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var j = await db.JournalEntries.FirstOrDefaultAsync(x => x.Id == id && x.UserId == User.UserId());
        if (j is null) return NotFound();
        db.JournalEntries.Remove(j);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static void Apply(JournalEntry j, JournalRequest r)
    {
        j.Title = r.Title;
        j.Body = r.Body;
        j.Mood = r.Mood;
        j.Win = r.Win;
        j.Lesson = r.Lesson;
    }
}
