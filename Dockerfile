# ==============================================================================
# Qore Analytics MVP — Dockerfile All-in-One para Deploy no Easypanel
# ==============================================================================

# 1. Build do Frontend Next.js (Standalone)
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --legacy-peer-deps || npm install
COPY frontend/ ./
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 2. Build do Backend .NET 10
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS backend-build
WORKDIR /src
COPY backend/QaAgent.Api.csproj ./backend/
RUN dotnet restore backend/QaAgent.Api.csproj
COPY backend/ ./backend/
RUN dotnet publish backend/QaAgent.Api.csproj -c Release -o /app/backend-out /p:UseAppHost=false

# 3. Runtime Final (ASP.NET 10 + Node 20 + Chromium para Playwright)
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

ENV DOTNET_RUNNING_IN_CONTAINER=true
ENV ASPNETCORE_URLS=http://+:5000
ENV BACKEND_INTERNAL_URL=http://127.0.0.1:5000
ENV PLAYWRIGHT_CHROME_PATH=/usr/bin/chromium
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
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
    dos2unix \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

COPY --from=backend-build /app/backend-out ./backend
COPY --from=frontend-build /app/frontend/.next/standalone ./frontend
COPY --from=frontend-build /app/frontend/.next/static ./frontend/.next/static
COPY --from=frontend-build /app/frontend/public ./frontend/public

COPY start.sh ./start.sh
RUN dos2unix ./start.sh && chmod +x ./start.sh

RUN mkdir -p /app/backend/wwwroot/evidencias

EXPOSE 3000

ENTRYPOINT ["./start.sh"]
