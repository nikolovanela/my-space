using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MySpace.Api.Data;
using MySpace.Api.Dtos;
using MySpace.Api.Models;
using MySpace.Api.Services;

namespace MySpace.Api.Controllers;

[ApiController, Authorize]
[Route("api/tasks")]
public class TasksController(AppDbContext db) : ControllerBase
{
    // GET /api/tasks?status=open|done|all&area=Работа
    [HttpGet]
    public async Task<List<TaskDto>> List(string status = "all", string? area = null)
    {
        var q = db.Tasks.Where(t => t.UserId == User.UserId());
        if (status == "open") q = q.Where(t => !t.IsDone);
        if (status == "done") q = q.Where(t => t.IsDone);
        if (!string.IsNullOrEmpty(area)) q = q.Where(t => t.Area == area);
        var items = await q.OrderBy(t => t.IsDone).ThenBy(t => t.DueDate == null).ThenBy(t => t.DueDate)
            .ThenByDescending(t => t.Priority).ThenByDescending(t => t.CreatedAt).ToListAsync();
        return items.Select(TaskDto.From).ToList();
    }

    [HttpPost]
    public async Task<TaskDto> Create(TaskRequest req)
    {
        var t = new TaskItem { UserId = User.UserId() };
        Apply(t, req);
        db.Tasks.Add(t);
        await db.SaveChangesAsync();
        return TaskDto.From(t);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<TaskDto>> Update(int id, TaskRequest req)
    {
        var t = await Find(id);
        if (t is null) return NotFound();
        Apply(t, req);
        await db.SaveChangesAsync();
        return TaskDto.From(t);
    }

    [HttpPatch("{id:int}/toggle")]
    public async Task<ActionResult<TaskDto>> Toggle(int id)
    {
        var t = await Find(id);
        if (t is null) return NotFound();
        t.IsDone = !t.IsDone;
        t.CompletedAt = t.IsDone ? DateTime.UtcNow : null;
        await db.SaveChangesAsync();
        return TaskDto.From(t);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var t = await Find(id);
        if (t is null) return NotFound();
        db.Tasks.Remove(t);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private Task<TaskItem?> Find(int id) => db.Tasks.FirstOrDefaultAsync(t => t.Id == id && t.UserId == User.UserId());

    private static void Apply(TaskItem t, TaskRequest r)
    {
        t.Title = r.Title.Trim();
        t.Notes = r.Notes;
        t.Area = string.IsNullOrWhiteSpace(r.Area) ? "Личен живот" : r.Area;
        t.Priority = r.Priority;
        t.DueDate = r.DueDate;
        t.GoalId = r.GoalId;
    }
}
