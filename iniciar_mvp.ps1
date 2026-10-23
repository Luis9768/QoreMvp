# Script de Inicialização da Plataforma QA Autonomous Copilot
Write-Host "===================================================================" -ForegroundColor Magenta
Write-Host " 🚀 QA AUTONOMOUS COPILOT - INICIALIZANDO MVP" -ForegroundColor Cyan
Write-Host "    • Backend: C# ASP.NET Core (.NET 10)" -ForegroundColor White
Write-Host "    • Frontend: Next.js + Tailwind CSS" -ForegroundColor White
Write-Host "    • Banco de Dados: PostgreSQL no Docker (porta 5432)" -ForegroundColor White
Write-Host "    • IA: Google Gemini 3.5/3.8 Flash" -ForegroundColor White
Write-Host "===================================================================" -ForegroundColor Magenta

$rootDir = $PSScriptRoot
Set-Location $rootDir

# 1. PostgreSQL no Docker
Write-Host "`n[1/3] Verificando PostgreSQL no Docker..." -ForegroundColor Yellow
try {
    docker compose up -d 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "      PostgreSQL iniciado com sucesso no Docker (porta 5432)!" -ForegroundColor Green
    } else {
        Write-Host "      Docker não detectado. Usando fallback inteligente para SQLite!" -ForegroundColor DarkYellow
    }
} catch {
    Write-Host "      Docker não encontrado. Usando fallback automático." -ForegroundColor DarkYellow
}

# 2. Inicia Backend C#
Write-Host "`n[2/3] Iniciando Backend C# (.NET 10) na porta 5000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootDir\backend'; dotnet run --no-build" -WindowStyle Normal

Start-Sleep -Seconds 3

# 3. Inicia Frontend Next.js
Write-Host "`n[3/3] Iniciando Frontend Next.js na porta 3000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootDir\frontend'; npm run start" -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host "`n===================================================================" -ForegroundColor Green
Write-Host " ✅ MVP ONLINE! Abrindo http://localhost:3000..." -ForegroundColor Green
Write-Host "===================================================================" -ForegroundColor Green
Start-Process "http://localhost:3000"
