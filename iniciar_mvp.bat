@echo off
chcp 65001 > nul
echo ===================================================================
echo  🚀 QA AUTONOMOUS COPILOT - INICIALIZANDO MVP
echo     • Backend: C# ASP.NET Core (.NET 10)
echo     • Frontend: Next.js + Tailwind CSS
echo     • Banco de Dados: PostgreSQL no Docker (porta 5432)
echo     • IA: Google Gemini 3.5/3.8 Flash
echo ===================================================================
echo.

cd /d "%~dp0"

echo [1/3] Tentando subir o PostgreSQL no Docker...
docker compose up -d 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [Docker] PostgreSQL container iniciado na porta 5432!
) else (
    echo [Aviso] Docker Desktop não detectado. O backend usará fallback inteligente para SQLite!
)

echo.
echo [2/3] Iniciando Backend C# (.NET 10) na porta 5000...
start "QA Backend (C# .NET)" cmd /k "cd backend && dotnet run --no-build"

timeout /t 3 > nul

echo [3/3] Iniciando Frontend Next.js na porta 3000...
start "QA Frontend (Next.js)" cmd /k "cd frontend && npm run start"

timeout /t 3 > nul

echo.
echo ===================================================================
echo  ✅ PLATAFORMA PRONTA! ABRINDO NO SEU NAVEGADOR...
echo     URL: http://localhost:3000
echo ===================================================================
start http://localhost:3000

exit
