# ==============================================================================
# Qore Analytics MVP — Backend API (.NET 10)
# ==============================================================================
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY QaAgent.Api.csproj ./
RUN dotnet restore QaAgent.Api.csproj

COPY . .
RUN dotnet publish QaAgent.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    libasound2t64 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

ENV DOTNET_RUNNING_IN_CONTAINER=true
ENV PLAYWRIGHT_CHROME_PATH=/usr/bin/chromium
ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production

RUN mkdir -p /app/wwwroot/evidencias

COPY --from=build /app/publish .

EXPOSE 5000 8080

ENTRYPOINT ["dotnet", "QaAgent.Api.dll", "--urls", "http://0.0.0.0:5000;http://0.0.0.0:8080"]
