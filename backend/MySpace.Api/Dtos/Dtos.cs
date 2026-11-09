using System.ComponentModel.DataAnnotations;
using MySpace.Api.Models;

namespace MySpace.Api.Dtos;

// Auth
public record RegisterRequest([Required, MaxLength(100)] string Name, [Required, EmailAddress] string Email, [Required, MinLength(8)] string Password);
public record LoginRequest([Required] string Email, [Required] string Password);
public record UserDto(int Id, string Name, string Email);
public record AuthResponse(string Token, UserDto User);

// Tasks
public record TaskRequest([Required, MaxLength(300)] string Title, string? Notes, string? Area, Priority Priority, DateOnly? DueDate, int? GoalId);
public record TaskDto(int Id, string Title, string? Notes, string Area, Priority Priority, DateOnly? DueDate, bool IsDone, DateTime? CompletedAt, DateTime CreatedAt, int? GoalId)
{
    public static TaskDto From(TaskItem t) => new(t.Id, t.Title, t.Notes, t.Area, t.Priority, t.DueDate, t.IsDone, t.CompletedAt, t.CreatedAt, t.GoalId);
}

// Goals
public record GoalRequest([Required, MaxLength(300)] string Title, string? Why, string? Area, DateOnly? TargetDate, [Range(0, 100)] int ManualProgress, List<string>? Steps);
public record StepRequest([Required, MaxLength(300)] string Title);
public record StepDto(int Id, string Title, bool IsDone, int Order);
public record GoalDto(int Id, string Title, string? Why, string Area, DateOnly? TargetDate, int Progress, int ManualProgress, bool IsArchived, List<StepDto> Steps)
{
    public static GoalDto From(Goal g)
    {
        var steps = g.Steps.OrderBy(s => s.Order).ThenBy(s => s.Id).ToList();
        // Ако целта има чекори, напредокот се пресметува автоматски од нив.
        var progress = steps.Count > 0 ? (int)Math.Round(100.0 * steps.Count(s => s.IsDone) / steps.Count) : g.ManualProgress;
        return new(g.Id, g.Title, g.Why, g.Area, g.TargetDate, progress, g.ManualProgress, g.IsArchived,
            steps.Select(s => new StepDto(s.Id, s.Title, s.IsDone, s.Order)).ToList());
    }
}

// Habits
public record HabitRequest([Required, MaxLength(200)] string Title, string? Area, string? Color);
public record HabitToggleRequest(DateOnly Date);
public record HabitDto(int Id, string Title, string Area, string Color, List<DateOnly> Days, int CurrentStreak, int BestStreak, int TotalDays);

// Journal
public record JournalRequest(DateOnly? Date, [MaxLength(200)] string? Title, [Required] string Body, [Range(1, 5)] int? Mood, string? Win, string? Lesson);
public record JournalDto(int Id, DateOnly Date, string? Title, string Body, int? Mood, string? Win, string? Lesson)
{
    public static JournalDto From(JournalEntry j) => new(j.Id, j.Date, j.Title, j.Body, j.Mood, j.Win, j.Lesson);
}

// Weekly review
public record ReviewRequest(string? WentWell, string? ToImprove, string? NextFocus, [Range(1, 10)] int? Rating);
