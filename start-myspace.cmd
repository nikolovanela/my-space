@echo off
rem Ги стартува API-то и frontend-от во два прозорци и ја отвора апликацијата.
start "My Space API" cmd /k "cd /d %~dp0backend\MySpace.Api && dotnet run --launch-profile http"
start "My Space Web" cmd /k "cd /d %~dp0frontend && npm run dev -- --port 5175 --strictPort"
timeout /t 6 /nobreak >nul
start http://localhost:5175
