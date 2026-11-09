namespace MySpace.Api.Models;

// Сите ентитети (табели) во базата. Секој запис припаѓа на еден корисник (UserId),
// па секој корисник ги гледа само своите податоци.

public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string TimeZone { get; set; } = "Europe/Skopje";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public enum Priority { Low = 0, Medium = 1, High = 2 }

public class TaskItem
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Title { get; set; } = "";
    public string? Notes { get; set; }
    public string Area { get; set; } = "Личен живот";
    public Priority Priority { get; set; } = Priority.Medium;
    public DateOnly? DueDate { get; set; }
    public bool IsDone { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int? GoalId { get; set; }
}

public class Goal
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Title { get; set; } = "";
    public string? Why { get; set; }
    public string Area { get; set; } = "Личен развој";
    public DateOnly? TargetDate { get; set; }
    public int ManualProgress { get; set; }
    public bool IsArchived { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<GoalStep> Steps { get; set; } = new();
}

public class GoalStep
{
    public int Id { get; set; }
    public int GoalId { get; set; }
    public string Title { get; set; } = "";
    public bool IsDone { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int Order { get; set; }
}

public class Habit
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Title { get; set; } = "";
    public string Area { get; set; } = "Личен живот";
    public string Color { get; set; } = "sage";
    public bool IsArchived { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<HabitLog> Logs { get; set; } = new();
}

public class HabitLog
{
    public int Id { get; set; }
    public int HabitId { get; set; }
    public DateOnly Date { get; set; }
}

public class JournalEntry
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public DateOnly Date { get; set; }
    public string? Title { get; set; }
    public string Body { get; set; } = "";
    public int? Mood { get; set; }          // 1 до 5
    public string? Win { get; set; }        // мала победа денес
    public string? Lesson { get; set; }     // што научив
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class WeeklyReview
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public DateOnly WeekStart { get; set; } // секогаш понеделник
    public string? WentWell { get; set; }
    public string? ToImprove { get; set; }
    public string? NextFocus { get; set; }
    public int? Rating { get; set; }        // 1 до 10
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
