using Npgsql;

namespace MySpace.Api.Services;

// Neon (и Render, Railway...) даваат URL од видот postgresql://user:pass@host/db?sslmode=require.
// Npgsql бара формат Host=...;Username=..., па URL-то го претвораме тука.
public static class ConnectionString
{
    public static string Normalize(string value)
    {
        if (!value.StartsWith("postgres://") && !value.StartsWith("postgresql://")) return value;

        var uri = new Uri(value);
        var userInfo = uri.UserInfo.Split(':', 2);
        var b = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.IsDefaultPort || uri.Port <= 0 ? 5432 : uri.Port,
            Database = uri.AbsolutePath.TrimStart('/'),
            Username = Uri.UnescapeDataString(userInfo[0]),
            Password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : null,
            SslMode = SslMode.Require,
        };

        var query = System.Web.HttpUtility.ParseQueryString(uri.Query);
        if (Enum.TryParse<SslMode>(query["sslmode"], ignoreCase: true, out var ssl)) b.SslMode = ssl;
        return b.ConnectionString;
    }
}
