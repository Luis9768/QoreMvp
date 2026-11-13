# Estágio de Compilação (SDK .NET 10)
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY QaAgent.Api.csproj ./
RUN dotnet restore QaAgent.Api.csproj

COPY . .
RUN dotnet publish QaAgent.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

# Estágio de Execução Enxuto + Bibliotecas Nativas Mínimas do Chromium Headless (~45MB)
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    fonts-liberation \
    libasound2t64 \
    libatk-bridge2.0-0t64 \
    libatk1.0-0t64 \
    libatspi2.0-0t64 \
    libcairo2 \
    libcups2t64 \
    libdbus-1-3 \
    libdrm2 \
    libexpat1 \
    libfontconfig1 \
    libfreetype6 \
    libgbm1 \
    libglib2.0-0t64 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libx11-6 \
    libxcb1 \
    libxcb-shm0 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxkbcommon0 \
    libxrandr2 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*

ENV DOTNET_RUNNING_IN_CONTAINER=true
ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production
ENV PLAYWRIGHT_BROWSERS_PATH=/root/.cache/ms-playwright

RUN mkdir -p /app/wwwroot/evidencias /root/.cache/ms-playwright

COPY --from=build /app/publish .
RUN chmod +x /app/.playwright/node/*/node || true

EXPOSE 5000

ENTRYPOINT ["dotnet", "QaAgent.Api.dll"]
