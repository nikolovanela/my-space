using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MySpace.Api.Data;
using MySpace.Api.Dtos;
using MySpace.Api.Models;
using MySpace.Api.Services;

namespace MySpace.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AppDbContext db, TokenService tokens, IPasswordHasher<User> hasher, IConfiguration config) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest req)
    {
        // Ова е лична апликација: регистрацијата може да се исклучи по првата сметка (Auth:AllowRegistration=false).
        if (!config.GetValue("Auth:AllowRegistration", true))
            return StatusCode(403, new { error = "Регистрацијата е исклучена." });

        var email = req.Email.Trim().ToLowerInvariant();
        if (await db.Users.AnyAsync(u => u.Email == email))
            return Conflict(new { error = "Веќе постои сметка со оваа е-пошта." });

        var user = new User { Name = req.Name.Trim(), Email = email };
        user.PasswordHash = hasher.HashPassword(user, req.Password);
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return new AuthResponse(tokens.Create(user), new UserDto(user.Id, user.Name, user.Email));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest req)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user is null || hasher.VerifyHashedPassword(user, user.PasswordHash, req.Password) == PasswordVerificationResult.Failed)
            return Unauthorized(new { error = "Погрешна е-пошта или лозинка." });
        return new AuthResponse(tokens.Create(user), new UserDto(user.Id, user.Name, user.Email));
    }

    [Authorize, HttpGet("me")]
    public async Task<ActionResult<UserDto>> Me()
    {
        var user = await db.Users.FindAsync(User.UserId());
        return user is null ? Unauthorized() : new UserDto(user.Id, user.Name, user.Email);
    }
}
