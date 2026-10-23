using Microsoft.EntityFrameworkCore;
using QaAgent.Api.Models;

namespace QaAgent.Api.Data;

public class QaDbContext : DbContext
{
    public QaDbContext(DbContextOptions<QaDbContext> options) : base(options)
    {
    }

    public DbSet<Project> Projects => Set<Project>();
    public DbSet<TestPlan> TestPlans => Set<TestPlan>();
    public DbSet<TestExecution> TestExecutions => Set<TestExecution>();
    public DbSet<TestStepExecution> TestStepExecutions => Set<TestStepExecution>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<TestExecution>()
            .HasMany(e => e.Steps)
            .WithOne()
            .HasForeignKey(s => s.TestExecutionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
