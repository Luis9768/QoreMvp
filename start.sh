#!/bin/sh
set -e

echo "[Qore Analytics] Iniciando Backend .NET 10 na porta 5000..."
cd /app/backend
dotnet QaAgent.Api.dll --urls "http://0.0.0.0:5000" &

echo "[Qore Analytics] Aguardando Backend inicializar..."
sleep 3

echo "[Qore Analytics] Iniciando Frontend Next.js na porta ${PORT:-3000}..."
cd /app/frontend
PORT=${PORT:-3000} HOSTNAME=0.0.0.0 node server.js
