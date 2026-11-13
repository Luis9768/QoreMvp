# Deploy do Qore Analytics MVP no Easypanel

O MVP já está 100% configurado para rodar no **Easypanel** em um único serviço (All-in-One) usando o `Dockerfile` da raiz.

## 1. Passo a Passo no Easypanel
1. Crie um novo projeto no Easypanel e adicione um serviço do tipo **App** (via GitHub ou Upload).
2. Em **Source / Build**, selecione **Dockerfile** apontando para `/Dockerfile`.
3. Em **Domains / Ports**, exponha a porta **3000**.
4. Em **Environment Variables**, adicione:
   ```env
   Gemini__ApiKey=SUA_CHAVE_GEMINI_AQUI
   ConnectionStrings__PostgresConnection=Host=seu-postgres;Port=5432;Database=qaplatform_db;Username=postgres;Password=SUA_SENHA
   ```
   *(Se não informar Postgres, o sistema usa SQLite automaticamente sem travar).*
5. Clique em **Deploy**.

## 2. Como Testar um Projeto Local (Shift-Left) usando o Qore no Easypanel
1. Suba o seu projeto na sua máquina (ex: `http://localhost:3000` ou `:5044`).
2. Abra o terminal na sua máquina e rode:
   ```bash
   npx localtunnel --port 3000
   ```
   *(ou `ngrok http 3000`)*
3. Copie a URL `https://...loca.lt` gerada.
4. No **Qore Analytics** (hospedado no Easypanel), vá na aba **1. Projetos & Túnel Local**, cole a URL, clique em **Testar Conexão** e depois em **Aplicar URL & Ir para Automação E2E**.
5. O Playwright do servidor já envia os headers `Bypass-Tunnel-Reminder: true` e `ngrok-skip-browser-warning: true` automaticamente!
