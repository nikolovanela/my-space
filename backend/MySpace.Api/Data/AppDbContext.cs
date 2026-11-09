using Microsoft.EntityFrameworkCore;
using MySpace.Api.Models;

namespace MySpace.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<TaskItem> Tasks => Set<TaskItem>();
    public DbSet<Goal> Goals => Set<Goal>();
    public DbSet<GoalStep> GoalSteps => Set<GoalStep>();
    public DbSet<Habit> Habits => Set<Habit>();
    public DbSet<HabitLog> HabitLogs => Set<HabitLog>();
    public DbSet<JournalEntry> JournalEntries => Set<JournalEntry>();
    public DbSet<WeeklyReview> WeeklyReviews => Set<WeeklyReview>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<User>().HasIndex(u => u.Email).IsUnique();
        b.Entity<User>().Property(u => u.Email).HasMaxLength(200);
        b.Entity<User>().Property(u => u.Name).HasMaxLength(100);

        b.Entity<TaskItem>().HasIndex(t => new { t.UserId, t.IsDone });
        b.Entity<TaskItem>().Property(t => t.Title).HasMaxLength(300);
        b.Entity<TaskItem>().HasOne<User>().WithMany().HasForeignKey(t => t.UserId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<TaskItem>().HasOne<Goal>().WithMany().HasForeignKey(t => t.GoalId).OnDelete(DeleteBehavior.SetNull);

        b.Entity<Goal>().HasOne<User>().WithMany().HasForeignKey(g => g.UserId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<Goal>().Property(g => g.Title).HasMaxLength(300);
        b.Entity<Goal>().HasMany(g => g.Steps).WithOne().HasForeignKey(s => s.GoalId).OnDelete(DeleteBehavior.Cascade);

        b.Entity<Habit>().HasOne<User>().WithMany().HasForeignKey(h => h.UserId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<Habit>().HasMany(h => h.Logs).WithOne().HasForeignKey(l => l.HabitId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<HabitLog>().HasIndex(l => new { l.HabitId, l.Date }).IsUnique();

        b.Entity<JournalEntry>().HasOne<User>().WithMany().HasForeignKey(j => j.UserId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<JournalEntry>().HasIndex(j => new { j.UserId, j.Date });

        b.Entity<WeeklyReview>().HasOne<User>().WithMany().HasForeignKey(r => r.UserId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<WeeklyReview>().HasIndex(r => new { r.UserId, r.WeekStart }).IsUnique();
    }
}
