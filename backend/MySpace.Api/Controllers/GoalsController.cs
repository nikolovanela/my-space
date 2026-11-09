using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MySpace.Api.Data;
using MySpace.Api.Dtos;
using MySpace.Api.Models;
using MySpace.Api.Services;

namespace MySpace.Api.Controllers;

[ApiController, Authorize]
[Route("api/goals")]
public class GoalsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<List<GoalDto>> List(bool archived = false)
    {
        var goals = await db.Goals.Include(g => g.Steps)
            .Where(g => g.UserId == User.UserId() && g.IsArchived == archived)
            .OrderBy(g => g.TargetDate == null).ThenBy(g => g.TargetDate).ThenBy(g => g.Id)
            .ToListAsync();
        return goals.Select(GoalDto.From).ToList();
    }

    [HttpPost]
    public async Task<GoalDto> Create(GoalRequest req)
    {
        var g = new Goal { UserId = User.UserId() };
        Apply(g, req);
        var order = 0;
        foreach (var s in (req.Steps ?? []).Where(s => !string.IsNullOrWhiteSpace(s)))
            g.Steps.Add(new GoalStep { Title = s.Trim(), Order = order++ });
        db.Goals.Add(g);
        await db.SaveChangesAsync();
        return GoalDto.From(g);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<GoalDto>> Update(int id, GoalRequest req)
    {
        var g = await Find(id);
        if (g is null) return NotFound();
        Apply(g, req);
        await db.SaveChangesAsync();
        return GoalDto.From(g);
    }

    [HttpPatch("{id:int}/archive")]
    public async Task<ActionResult<GoalDto>> Archive(int id)
    {
        var g = await Find(id);
        if (g is null) return NotFound();
        g.IsArchived = !g.IsArchived;
        await db.SaveChangesAsync();
        return GoalDto.From(g);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var g = await Find(id);
        if (g is null) return NotFound();
        db.Goals.Remove(g);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id:int}/steps")]
    public async Task<ActionResult<GoalDto>> AddStep(int id, StepRequest req)
    {
        var g = await Find(id);
        if (g is null) return NotFound();
        g.Steps.Add(new GoalStep { Title = req.Title.Trim(), Order = g.Steps.Count == 0 ? 0 : g.Steps.Max(s => s.Order) + 1 });
        await db.SaveChangesAsync();
        return GoalDto.From(g);
    }

    [HttpPatch("{id:int}/steps/{stepId:int}/toggle")]
    public async Task<ActionResult<GoalDto>> ToggleStep(int id, int stepId)
    {
        var g = await Find(id);
        var s = g?.Steps.FirstOrDefault(x => x.Id == stepId);
        if (g is null || s is null) return NotFound();
        s.IsDone = !s.IsDone;
        s.CompletedAt = s.IsDone ? DateTime.UtcNow : null;
        await db.SaveChangesAsync();
        return GoalDto.From(g);
    }

    [HttpDelete("{id:int}/steps/{stepId:int}")]
    public async Task<ActionResult<GoalDto>> DeleteStep(int id, int stepId)
    {
        var g = await Find(id);
        var s = g?.Steps.FirstOrDefault(x => x.Id == stepId);
        if (g is null || s is null) return NotFound();
        g.Steps.Remove(s);
        await db.SaveChangesAsync();
        return GoalDto.From(g);
    }

    private Task<Goal?> Find(int id) =>
        db.Goals.Include(g => g.Steps).FirstOrDefaultAsync(g => g.Id == id && g.UserId == User.UserId());

    private static void Apply(Goal g, GoalRequest r)
    {
        g.Title = r.Title.Trim();
        g.Why = r.Why;
        g.Area = string.IsNullOrWhiteSpace(r.Area) ? "Личен развој" : r.Area;
        g.TargetDate = r.TargetDate;
        g.ManualProgress = Math.Clamp(r.ManualProgress, 0, 100);
    }
}
