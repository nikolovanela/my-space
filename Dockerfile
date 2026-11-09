# My Space: еден контејнер што го служи и API-то и React апликацијата.

# 1) React build -> backend/MySpace.Api/wwwroot
FROM node:22-alpine AS web
WORKDIR /src/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN mkdir -p ../backend/MySpace.Api && npm run build

# 2) .NET publish
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS api
WORKDIR /src/backend/MySpace.Api
COPY backend/MySpace.Api/MySpace.Api.csproj ./
RUN dotnet restore
COPY backend/MySpace.Api/ ./
COPY --from=web /src/backend/MySpace.Api/wwwroot ./wwwroot
RUN dotnet publish -c Release -o /app --no-restore

# 3) Мала слика само со runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=api /app ./
ENV ASPNETCORE_ENVIRONMENT=Production
# Render ја праќа портата во $PORT
CMD ["sh", "-c", "ASPNETCORE_HTTP_PORTS=${PORT:-8080} exec dotnet MySpace.Api.dll"]
