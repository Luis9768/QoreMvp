# Qore Analytics 🚀

> Plataforma inteligente de garantia de qualidade (QA) movida pelo motor de **Inteligência Artificial Quantum**, com orquestração em **C# ASP.NET Core (.NET 10)**, execução E2E em **Microsoft Playwright**, análise diferencial de repositórios do **GitHub** e dashboard em **Next.js**.

📖 **Para a documentação técnica e de arquitetura completa para relatórios e TCC, consulte:** [DOCUMENTACAO_MVP.md](file:///C:/Users/58069799897/Desktop/QA_Platform_MVP/DOCUMENTACAO_MVP.md)

---

## 🌟 Principais Recursos do Qore Analytics

1. **Modo Análise de Repositório GitHub & Commits (Zero-Config):**
   - Análise direta via URL de repositório (público ou privado).
   - Busca dinâmica de **Branches** e seletor visual de **Commits Recentes** (mensagens, autor e data).
   - Inspeção do **Diff de código** para focar os testes exatamente no que foi alterado.
   - Suporte a **GitHub Token (PAT)** com botão de **"Testar Acesso"** e diagnóstico em tempo real.
2. **Matriz de Rastreabilidade de Requisitos (RTM - ISO/IEC/IEEE 29119 & ISTQB):**
   - Mapeamento bidirecional: **Requisitos de Negócio (`REQ-01`) ↔ Código Alterado (Git Diff) ↔ Casos de Teste (`TC-01`)**.
   - Métricas de governança: taxa de cobertura calculada (100% Coberto), módulos auditados e justificativa técnica.
   - Tabela interativa no dashboard e exportação dedicada em **CSV (`.csv`)** e **Markdown (`.md`)**.
3. **Padrão Internacional ISTQB de Casos de Teste com a IA Quantum:**
   - Casos gerados com `Código (TC-01...)`, `Tipo (Funcional, Regressão, Negativo, Borda)`, `Prioridade`, `Pré-condições`, `Ação`, `Dados de Teste`, `Resultado Esperado` e `Técnica ISTQB`.
   - Edição inline em tempo real dos passos diretamente no dashboard.
4. **Gerador de Prompts Especializados para IAs:**
   - Modal com 1 clique para gerar prompts otimizados para **Cursor IDE, Copilot, ChatGPT e Claude**.
   - Formatos em **BDD / Gherkin** com instruções para Playwright/Cypress ou **Linguagem Natural**.
5. **Central de Exportação de Testes & RTM:**
   - Exportação da **Matriz de Rastreabilidade (RTM)** em **CSV (`.csv`)** para Excel e Jira.
   - Exportação do **Dossiê Completo** em **Markdown (`.md`)** para Pull Requests e relatórios.
   - Exportação em **JSON (`.json`)** para pipelines de CI/CD.
6. **Modo Automação Web E2E (Microsoft Playwright):**
   - Execução autônoma no navegador Chromium.
   - Gravação de vídeo (`.webm`) sincronizado com player nativo.
   - Captura de screenshots antes e depois de cada ação crítica.
   - Painel de logs em tempo real e histórico de execuções persistido.

---

## 🏛️ Arquitetura do Sistema

```text
[ Usuário / Engenheiro de QA ]
       │
       ▼ (Interface Next.js: Repositórios, Commits, Branches, Token PAT, Prompts)
[ Frontend Qore Analytics (Porta 3000) ]
       │  (JSON REST API com cabeçalho X-GitHub-Token)
       ▼
[ Backend C# ASP.NET Core (.NET 10) (Porta 5000) ]
       ├──► [ GitHub REST API v3 ] (Obtém Branches, Commits Recentes e Diffs)
       │
       ├──► [ IA Quantum Core ] (Engenharia de Prompt estruturada em JSON)
       │
       ├──► [ Banco de Dados Dual ]
       │      ├── PostgreSQL 16 no Docker (Porta 5432 - Produção)
       │      └── SQLite Local (Fallback automático sem necessidade de Docker)
       │
       └──► [ Microsoft Playwright Runner ] (Execução de testes web, vídeo .webm e prints)
```

---

## 🚀 Como Iniciar com 1 Clique

Na raiz da pasta `QA_Platform_MVP`:

* **Opção 1 (Windows):** Duplo clique no arquivo `iniciar_mvp.bat`
* **Opção 2 (PowerShell):** Execute `.\iniciar_mvp.ps1`

Isso irá:
1. Subir o container do **PostgreSQL** via `docker compose up -d` (ou ativar o SQLite se o Docker estiver desligado)
2. Iniciar o **Backend C# (.NET 10)** em `http://localhost:5000`
3. Iniciar o **Frontend Next.js** em `http://localhost:3000`
4. Abrir automaticamente seu navegador no dashboard do Qore Analytics!

---

## 📁 Estrutura de Pastas

```text
QA_Platform_MVP/
├── DOCUMENTACAO_MVP.md      # Documentação técnica e arquitetural completa do Qore Analytics
├── README.md                # Visão geral e guia rápido
├── docker-compose.yml       # Orquestração do PostgreSQL no Docker
├── iniciar_mvp.bat          # Inicializador automático para Windows
├── iniciar_mvp.ps1          # Inicializador automático em PowerShell
├── backend/                 # API em C# ASP.NET Core (.NET 10)
│   ├── Controllers/         # QaController (Rotas de QA, Commits e Diagnóstico)
│   ├── Data/                # QaDbContext (Dual Database: Postgres/SQLite)
│   ├── Models/              # Entidades: Project, TestPlan, TestStepExecution, ISTQB
│   ├── Services/            # GeminiPlannerService (IA Quantum), GitHubService, PlaywrightExecutionService
│   └── appsettings.json     # Chaves de API e configurações
└── frontend/                # Aplicação Next.js 14
    ├── pages/               # index.js (Dashboard SPA do Qore Analytics)
    └── styles/              # globals.css (Tailwind CSS)
```
