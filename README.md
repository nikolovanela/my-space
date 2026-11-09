# My Space 2.0

Лична апликација за задачи, цели, навики, дневник и дневен/неделен напредок.

- **Backend:** ASP.NET Core 10 Web API (C#), Entity Framework Core, JWT најава
- **База:** PostgreSQL 17 (база `myspace`)
- **Frontend:** React 19 + Vite

## Структура

```
my-space/
├─ backend/
│  ├─ dotnet-tools.json          dotnet-ef алатката (миграции)
│  └─ MySpace.Api/
│     ├─ Program.cs               конфигурација: база, JWT, CORS, статички фајлови
│     ├─ Models/Entities.cs       табелите: User, TaskItem, Goal, GoalStep, Habit, HabitLog, JournalEntry, WeeklyReview
│     ├─ Data/AppDbContext.cs     EF Core: релации и индекси
│     ├─ Dtos/Dtos.cs             што API-то прима и враќа
│     ├─ Services/Helpers.cs      JWT токени, датуми во локална зона, streak пресметки
│     ├─ Controllers/             Auth, Tasks, Goals, Habits, Journal, Stats (напредок + неделен преглед)
│     └─ Migrations/              историја на шемата на базата
└─ frontend/
   ├─ vite.config.js              /api проксира кон localhost:5080
   └─ src/
      ├─ App.jsx                  мени, навигација, темна/светла тема
      ├─ api.js                   fetch + токен
      ├─ lib.js                   области, датуми, помошни функции
      ├─ ui.jsx                   заеднички компоненти (TaskRow, Ring, Modal...)
      └─ pages/                   Today, Tasks, Goals, Habits, Journal, Progress, Review
```

## Стартување (секој ден)

Најлесно: двоен клик на **start-myspace.cmd**. Се отвораат два прозорци (API и Web) и прелистувачот на http://localhost:5175.

Или рачно, во два терминала:

```bash
cd C:/Users/Nela/my-space/backend/MySpace.Api
dotnet run --launch-profile http
```

```bash
cd C:/Users/Nela/my-space/frontend
npm run dev
```

Потоа отвори http://localhost:5173 (или портата што ја пишува Vite).
Од телефон на истата Wi-Fi мрежа: `http://<IP-адреса-на-компјутерот>:5173`.

## Тајни (не се во кодот)

Конекцијата кон базата и JWT клучот се чуваат во **dotnet user-secrets**, надвор од проектот:

```bash
cd C:/Users/Nela/my-space/backend/MySpace.Api
dotnet user-secrets list
```

Ако треба да се постават од нула:

```bash
dotnet user-secrets set "ConnectionStrings:Default" "Host=localhost;Port=5432;Database=myspace;Username=postgres;Password=ТВОЈА_ЛОЗИНКА"
dotnet user-secrets set "Jwt:Key" "барем-32-случајни-знаци-................"
```

На сервер истото се поставува со env варијабли: `ConnectionStrings__Default` и `Jwt__Key`.

## Промена на базата (миграции)

1. Смени нешто во `Models/Entities.cs`
2. `dotnet ef migrations add ИмеНаПромената`
3. Миграцијата се применува автоматски при следното стартување на API-то (или `dotnet ef database update`).

## Затворање на регистрацијата

Откако ќе ја направиш својата сметка, во `appsettings.json` стави `"AllowRegistration": false`, за никој друг да не може да се регистрира кога апликацијата ќе биде на интернет.

## Продукциски build (еден сервер)

```bash
cd frontend && npm run build
```

Ова го гради React-от во `backend/MySpace.Api/wwwroot`, па ASP.NET Core ги служи и API-то и страницата на една адреса.

## Deploy: Render (бесплатно) + Neon (бесплатна база)

`Dockerfile` го гради React-от и .NET API-то во еден контејнер. `render.yaml` го опишува сервисот.

1. **Neon** (neon.tech): нов проект, регион Frankfurt. Копирај го *connection string* (`postgresql://...sslmode=require`).
2. **Render** (render.com): најави се со GitHub, *New > Blueprint*, избери го `my-space` repo-то.
3. Кога ќе побара `ConnectionStrings__Default`, залепи го стрингот од Neon. `Jwt__Key` Render го генерира сам.
4. Чекај да заврши build-от (првиот пат неколку минути) и отвори го линкот `https://my-space-xxxx.onrender.com`.
5. Регистрирај се, а потоа во Render > Environment стави `Auth__AllowRegistration` = `false`.

Секој `git push` на `main` автоматски прави нов deploy. Бесплатниот сервис заспива по 15 минути без активност, па првото отворање трае околу минута.

## API

| Метод | Патека | Што прави |
|---|---|---|
| POST | /api/auth/register, /api/auth/login | сметка и најава (враќа JWT) |
| GET/POST/PUT/DELETE | /api/tasks | задачи (`?status=open\|done\|all&area=`) |
| PATCH | /api/tasks/{id}/toggle | заврши / врати |
| GET/POST/PUT/DELETE | /api/goals | цели со чекори |
| POST, PATCH, DELETE | /api/goals/{id}/steps... | чекори кон цел |
| GET/POST/PUT/DELETE | /api/habits | навики (со streak) |
| POST | /api/habits/{id}/toggle | означи ден `{ "date": "2026-11-09" }` |
| GET/POST/PUT/DELETE | /api/journal | дневник (`?q=` пребарување) |
| GET | /api/stats/overview | денес, оваа недела, 12 недели дневно, 8 недели неделно, области |
| GET/PUT | /api/reviews/{weekStart} | неделен преглед + рефлексија |

## Следни чекори (идеи)

- Deploy (на пр. Railway или Azure) за пристап од секаде
- PWA: икона на почетниот екран на телефонот
- Потсетници (навики, неделен преглед во недела навечер)
- AI неделен коментар врз основа на прегледот
- Финансии: приходи, трошоци, заштеда
