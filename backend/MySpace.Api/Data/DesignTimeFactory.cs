using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace MySpace.Api.Data;

// Го користат `dotnet ef` командите. Ја чита истата конекција од user-secrets / env,
// а ако ја нема, сепак може да прави миграции (без вистинска база).
public class DesignTimeFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var config = new ConfigurationBuilder()
            .AddUserSecrets<Program>(optional: true)
            .AddEnvironmentVariables()
            .Build();
        var conn = config.GetConnectionString("Default") ?? "Host=localhost;Database=myspace";
        return new(new DbContextOptionsBuilder<AppDbContext>().UseNpgsql(conn).Options);
    }
}
