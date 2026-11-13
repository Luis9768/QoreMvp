# Guia Definitivo de Deploy no Easypanel (Qore Analytics MVP)

Você tem **duas formas** de rodar no Easypanel:

---

### Opção 1: Serviço Único (All-in-One — Recomendado e mais simples)
Um único container que sobe o Backend .NET 10 + Chromium + Frontend Next.js juntos.

1. No Easypanel, crie uma **App**.
2. Em **Source / Repositório Git**:
   - URL: `https://github.com/Luis9768/QoreMvp.git`
   - Branch: `main`
3. Em **Build**:
   - Build Type: **Dockerfile**
   - Dockerfile Path: `/Dockerfile` (ou deixe em branco se o padrão for a raiz)
4. Em **Port**:
   - Defina **3000** (que é onde o frontend e proxy respondem).
5. Em **Environment**:
   - `Gemini__ApiKey`: (sua chave do Google Gemini)
   - `ConnectionStrings__PostgresConnection`: `Host=...;Port=5432;Database=...;Username=...;Password=...` *(opcional, se não colocar roda SQLite automático)*
6. Clique em **Implantar / Deploy**.

---

### Opção 2: Se você criou o serviço separado apenas para o Backend (`back-mvp`)
Se no Easypanel você criou um serviço chamado `back-mvp` apontando para o C#:

1. Em **Build**:
   - Build Type: **Dockerfile**
   - Dockerfile Path: `backend/Dockerfile`
2. Em **Port**:
   - Defina **5000** (a porta da API C#).
3. Em **Environment**:
   - `Gemini__ApiKey`: sua chave do Gemini
   - `ASPNETCORE_URLS`: `http://+:5000`
4. Clique em **Implantar / Deploy**.
