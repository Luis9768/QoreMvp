# QORE ANALYTICS — DOCUMENTAÇÃO TÉCNICA E FUNCIONAL DO PROJETO (MVP)

> **Projeto:** Qore Analytics  
> **Motor de Inteligência Artificial:** Quantum (Quantum AI)  
> **Versão:** 1.0 (MVP Fullstack)  
> **Objetivo:** Documentação Técnica, Arquitetural e Funcional para Apresentação Acadêmica / Corporativa (TCC / Documentação Oficial de Engenharia de Software)  
> **Tecnologias Centrais:** C# ASP.NET Core (.NET 10), Next.js 14, Microsoft Playwright, Quantum AI (Google Gemini Flash Core), GitHub REST API v3, PostgreSQL / SQLite.

---

## 1. RESUMO EXECUTIVO

O **Qore Analytics** é uma plataforma inteligente projetada para revolucionar o ciclo de garantia de qualidade de software (*Quality Assurance - QA*). O sistema utiliza o motor proprietário de inteligência artificial **Quantum** para resolver dois dos maiores gargalos enfrentados por equipes de engenharia de software:

1. **O esforço manual, repetitivo e lento na elaboração de casos de teste:** Engenheiros de QA e desenvolvedores perdem horas estruturando planilhas com IDs, critérios de aceite, passos de reprodução, massa de dados e resultados esperados.
2. **A perda de sincronia entre o código alterado e o que é testado:** Frequentemente, alterações de código em *branches* ou *commits* sobem para homologação sem que os testes cubram exatamente o que foi modificado no código-fonte, gerando bugs silenciosos e regressões em produção.

Para solucionar essas dores com máxima eficiência, o **Qore Analytics** foi arquitetado sobre **dois pilares fundamentais**:
- **Pilar 1 (Análise Estática e Diferencial de Commits Git/GitHub):** Conecta-se diretamente ao repositório (público ou privado), inspeciona o *diff* unificado das alterações e utiliza a IA **Quantum** para gerar casos de teste padronizados pelas normas internacionais do **ISTQB**, além de gerar prompts técnicos especializados para assistentes de código como Cursor, Copilot e ChatGPT.
- **Pilar 2 (Automação E2E com Microsoft Playwright):** Um *test runner* autônomo de alta precisão que abre o navegador real (Chromium), executa os fluxos da aplicação web, grava toda a sessão em **vídeo `.webm`** e captura **evidências fotográficas (prints) de antes e depois de cada ação crítica**, garantindo rastreabilidade total de bugs.

---

## 2. ARQUITETURA GERAL E STACK TECNOLÓGICA

O **Qore Analytics** adota uma arquitetura em camadas desacoplada (*Headless / API First*):

```text
                               [ USUÁRIO / ENGENHEIRO DE QA ]
                                              │
                                              ▼
                ┌────────────────────────────────────────────────────────────┐
                │          FRONTEND QORE ANALYTICS (Next.js 14 + React)      │
                │  - Dashboard SPA em Tailwind CSS                           │
                │  - Gestão de Commits, Branches e Diagnóstico de Token      │
                │  - Player de Vídeo .webm nativo e Galeria de Prints        │
                │  - Central de Exportação (CSV, Markdown, JSON e Prompts IA)│
                └─────────────────────────────┬──────────────────────────────┘
                                              │ HTTP REST (JSON + Headers)
                                              ▼
                ┌────────────────────────────────────────────────────────────┐
                │              BACKEND API (C# .NET 10 ASP.NET Core)         │
                │  - Orquestrador assíncrono de alta performance             │
                │  - Endpoints RESTful tipados e documentados                │
                │  - Higienização e Validação Avançada de Tokens PAT         │
                └───────┬──────────────────────┬──────────────────────┬──────┘
                        │                      │                      │
       ┌────────────────┘                      │                      └────────────────┐
       ▼                                       ▼                                       ▼
┌───────────────┐               ┌──────────────────────────────┐              ┌─────────────────┐
│  GITHUB API   │               │       IA QUANTUM CORE        │              │  PLAYWRIGHT E2E │
│ REST v3       │               │ (Google Gemini Flash Engine) │              │  RUNNER (.NET)  │
│ - Branches    │               │ - Análise do Diff de Código  │              │ - Navegador Web │
│ - Commits     │               │ - Engenharia de Prompt       │              │ - Vídeo .webm   │
│ - Diffs (.patch)              │ - Geração Estruturada ISTQB  │              │ - Prints Pré/Pós│
└───────────────┘               └──────────────────────────────┘              └─────────────────┘
                                               │
                                               ▼
                                ┌──────────────────────────────┐
                                │   CAMADA DE DADOS HÍBRIDA    │
                                │ - PostgreSQL 16 (Docker)     │
                                │ - SQLite Local (Fallback)    │
                                └──────────────────────────────┘
```

### Justificativa das Tecnologias

| Camada | Tecnologia | Papel no Qore Analytics |
| :--- | :--- | :--- |
| **Backend** | C# ASP.NET Core (.NET 10) | Responsável pela orquestração de testes, integração assíncrona com o GitHub, chamadas à IA Quantum e controle nativo do Microsoft Playwright. |
| **Frontend** | Next.js 14, React 18, Tailwind CSS | Dashboard dinâmico com renderização ultra-rápida, edição inline de casos de teste, player de vídeo nativo e feedback visual de diagnóstico. |
| **Inteligência Artificial** | Quantum (Gemini Flash Engine) | Motor de raciocínio de testes, responsável por interpretar alterações de código em nível de arquivo/linha e estruturar matrizes de risco e planos de teste formais. |
| **Automação Web** | Microsoft Playwright (.NET) | Executor E2E robusto, imune a instabilidades comuns do Selenium, com gravação contínua de frames de vídeo e monitoramento de rede (*NetworkIdle*). |
| **Banco de Dados** | PostgreSQL 16 + SQLite (Dual) | PostgreSQL conteinerizado para ambientes de produção e SQLite embutido para execução local instantânea sem dependências externas. |
| **Controle de Código** | GitHub REST API v3 | Extração de branches, histórico de commits recentes e arquivos diferenciais (.patch). |

---

## 3. O SISTEMA EM DETALHES (COMO FOI FEITO)

### 3.1. PILAR 1: ANÁLISE DE COMMITS, BRANCHES E GERAÇÃO ISTQB

#### Como funciona a Análise por Commit:
1. O usuário informa o link de qualquer repositório no GitHub (ex: `https://github.com/usuario/repositorio`).
2. O **Qore Analytics** consulta os metadados do repositório:
   - Permite listar e selecionar dinamicamente as **Branches** ativas.
   - Permite inspecionar os **Últimos 10 Commits** daquela branch (com nome do autor, data e mensagem).
   - Permite auditar um **Hash/SHA de Commit específico** (ex: `a1b2c3d`).
3. O serviço `GitHubService.cs` extrai o **Diff Unificado** (todas as linhas com `+` adicionadas e `-` removidas em arquivos de código).
4. Esse diff é injetado no motor de IA **Quantum** (`GeminiPlannerService.cs`), que realiza:
   - Mapeamento das regras de negócio afetadas (novos campos, validações, rotas de API, regras de cancelamento/agendamento).
   - Análise de impacto e cálculo de matriz de riscos.
   - Geração de casos de teste estruturados cobrindo exatamente o que foi alterado.

#### Padrão Internacional ISTQB nos Casos de Teste:
Cada caso de teste gerado pela IA Quantum contém:
- **ID Padronizado:** Identificadores únicos (`TC001`, `TC002`...).
- **Classificação por Tipo:** Funcional, Regressão, Negativo, BVA (Valor Limite), Integração ou Segurança.
- **Prioridade:** Alta, Média ou Baixa com tags visuais.
- **Pré-condição:** Estado inicial obrigatório do sistema antes do início da execução.
- **Ação / Passo a Passo:** Sequência exata de ações na tela.
- **Dados de Teste:** Exemplo real dos dados a serem digitados.
- **Resultado Esperado:** O comportamento correto do software para aprovação do teste.
- **Técnica de QA:** Indicação da técnica formal aplicada (Partição de Equivalência, Análise do Valor Limite, Tabela de Decisão).
- **Edição em Tempo Real:** O usuário pode clicar e editar qualquer valor de qualquer teste diretamente na tela antes de exportar.

#### Suporte a Repositórios Privados e Tokens PAT:
- Compatível com **Tokens Classic (`ghp_...`)** e **Fine-grained Tokens (`github_pat_...`)**.
- **Diagnóstico em Tempo Real:** A plataforma possui um botão **"Testar Acesso"** que valida se o token é válido, qual conta do GitHub ele representa (`@usuario`), se possui o escopo `repo`, se o repositório da Organização está acessível ou se falta autorização de SSO corporativo.
- **Armazenamento Seguro:** O token é guardado apenas no navegador do usuário (`localStorage`), sem exposição em banco de dados externo no MVP.

---

### 3.2. MATRIZ DE RASTREABILIDADE DE REQUISITOS (REQUIREMENTS TRACEABILITY MATRIX - RTM ISO/IEC/IEEE 29119)

Para garantir governança, conformidade com auditorias de software e cobertura de 100% das alterações, o **Qore Analytics** implementa nativamente a **Matriz de Rastreabilidade de Requisitos (RTM)** sob a norma internacional **ISO/IEC/IEEE 29119-3**:

#### Mapeamento Bidirecional em Três Camadas:
A RTM estabelece a ligação formal e verificável entre três dimensões do projeto:
1. **Requisitos de Negócio e Funcionais (`REQ-01`, `REQ-02`...):** Extraídos semanticamente a partir do objetivo das alterações de código e regras de sistema.
2. **Código-Fonte Alterado no Git (`git diff`):** Arquivos específicos modificados no commit (ex: componentes de UI, rotas de API, modelos de dados).
3. **Casos de Teste Padronizados (`TC-01`, `TC-02`...):** Casos de teste que validam especificamente aquele requisito sob técnicas formais ISTQB (Transição de Estado, Partição de Equivalência e Análise do Valor Limite).

#### Campos Padronizados da Matriz de Rastreabilidade:
* **ID do Requisito:** Código padronizado (ex: `REQ-01`, `REQ-02`).
* **Módulo & Categoria:** Identificação do domínio funcional (ex: *Autenticação*, *Agendamento*, *Notificações*) e categoria (*Regra de Negócio*, *Funcional*, *Segurança*).
* **Especificação do Requisito:** Título objetivo e descrição técnica da regra auditada.
* **Arquivos Afetados:** Lista de caminhos de arquivos alterados no commit associados ao requisito.
* **Casos de Teste Vinculados:** Códigos dos casos de teste executados para mitigar riscos de regressão no requisito.
* **Status de Cobertura:** Indicador auditável (`100% Coberto`).
* **Severidade / Prioridade:** Classificação de risco (*Crítica*, *Alta*, *Média*).
* **Justificativa Técnica:** Racional de como a suíte de testes assegura a integridade do requisito.

#### Exportação Especializada da RTM:
* **Exportação CSV (`.csv`):** Gera `Matriz_Rastreabilidade_RTM.csv` codificado em UTF-8 com BOM, compatível com Excel, Jira e ferramentas ALM.
* **Exportação Markdown (`.md`):** Tabela estruturada inclusa no Dossiê Técnico para compor monografias, TCC e PRs.

---

### 3.3. GERADOR DE PROMPTS PARA AGENTES DE IA (CURSOR, COPILOT, CLAUDE)

Para potencializar o desenvolvimento ágil, o **Qore Analytics** possui um gerador de prompts com 1 clique para alimentar assistentes de código como **Cursor IDE, GitHub Copilot, ChatGPT e Claude**:

* **Modo Detalhado (BDD & Automação):** Transforma os casos de teste em especificações **Gherkin / BDD** (`Dado que`, `Quando`, `Então`), adicionando instruções técnicas para que o assistente de IA escreva a automação em **Playwright / TypeScript** ou **Cypress**, com foco em seletores semânticos e boas práticas.
* **Modo Natural (Roteiro Exploratório):** Roteiro em linguagem natural, ideal para checklists de testes exploratórios ou manuais.
* **Cópia em 1 Clique:** Copia instantânea com feedback visual.

---

### 3.4. CENTRAL DE EXPORTAÇÃO UNIVERSAL

Os casos de teste e a documentação gerada podem ser exportados imediatamente:
1. **Matriz de Rastreabilidade CSV (`.csv`):** Planilha universal da RTM para **Jira (Xray), TestRail, Zephyr Scale e Microsoft Excel**.
2. **Dossiê Completo em Markdown (`.md`):** Documentação técnica abrangente com Resumo Executivo, Matriz de Riscos, RTM e Casos de Teste ISTQB.
3. **JSON Estruturado (`.json`):** Formato tipado para esteiras de CI/CD e automações de deploy.

---

### 3.5. PILAR 2: AUTOMAÇÃO E2E COM MICROSOFT PLAYWRIGHT

No modo de execução web ao vivo, o **Qore Analytics** opera como um executor autônomo de testes:

1. O backend instancia o **Microsoft Playwright (.NET)** em uma sessão isolada de navegação (*BrowserContext*) com gravação de vídeo HD (1280x720).
2. Para cada ação do plano de teste:
   - Localiza elementos no DOM por múltiplos seletores resilientes (CSS, XPath, texto visível, placeholders e acessibilidade).
   - Interage com a página simulando o comportamento humano.
   - **Mecanismo de Evidência Dupla (Pré e Pós Ação):** Captura um print antes da ação e um print **imediatamente após a conclusão da ação** (aguardando a estabilização da rede e do DOM), registrando modais abertos, alertas de validação e mudanças visuais.
3. Ao finalizar, o Playwright salva o vídeo completo em formato `.webm` no diretório estático do backend (`wwwroot/evidencias`).
4. O status de cada passo (`Passed`, `Failed`, `Warning`), os logs em tempo real e o player de vídeo são exibidos diretamente no dashboard.

---

## 4. DESAFIOS TÉCNICOS ENFRENTADOS E SOLUÇÕES IMPLEMENTADAS

### Desafio 1: Vídeos estáticos e prints cegos no Playwright
* **Problema:** Inicialmente, os prints de tela eram tirados no milissegundo do clique, sem aguardar o retorno da API ou renderização do DOM. Além disso, execuções rápidas finalizavam o processo sem que o container `.webm` de vídeo gravasse todos os quadros.
* **Solução:** Foi implementado um mecanismo de espera explícita pós-evento (`WaitForLoadStateAsync(LoadState.NetworkIdle)` e `WaitForTimeoutAsync`), além de um ciclo seguro de fechamento do navegador que garante o encerramento correto do arquivo de vídeo antes de disponibilizá-lo no player.

### Desafio 2: Limitações da API do GitHub e Repositórios Privados
* **Problema:** A API pública do GitHub restringe requisições anônimas a 60 chamadas por hora por IP e retorna erro 404 em repositórios privados quando o token não possui as permissões adequadas.
* **Solução:** Implementação de um **Fallback Triplo** com leitura de feeds Atom e arquivos `.patch` públicos, além de um motor de diagnóstico (`/api/qa/github/validate-token`) que analisa headers de SSO (`X-GitHub-SSO`) e escopos OAuth (`X-OAuth-Scopes`), instruindo o usuário com precisão sobre como resolver acessos bloqueados.

### Desafio 3: Respostas inconsistentes da IA
* **Problema:** LLMs convencionais podem oscilar respostas em texto livre, dificultando o parser do frontend.
* **Solução:** Engenharia de Prompt avançada aplicada à IA **Quantum**, utilizando saídas estruturadas em JSON estrito (*Structured Outputs*) com validação e tipagem idêntica aos DTOs em C#.

### Desafio 4: Portabilidade Local sem Dependência Obrigatória do Docker
* **Problema:** Máquinas de desenvolvimento sem Docker Desktop ativo falhavam ao tentar conectar no PostgreSQL.
* **Solução:** Arquitetura de banco de dados híbrida com chaveamento automático: se o PostgreSQL não responder na porta 5432, o sistema ativa instantaneamente o **SQLite local (`qaplatform_local.db`)** com zero atrito de configuração.

---

## 5. ESTRUTURA DO CÓDIGO FONTE

```text
QA_Platform_MVP/
│
├── DOCUMENTACAO_MVP.md           # Documentação completa do Qore Analytics
├── README.md                     # Guia de início rápido da aplicação
├── docker-compose.yml            # Orquestração do PostgreSQL 16
├── iniciar_mvp.bat               # Script Windows para inicialização em 1 clique
├── iniciar_mvp.ps1               # Script PowerShell para inicialização automatizada
│
├── backend/                      # Backend C# ASP.NET Core (.NET 10)
│   ├── Controllers/
│   │   └── QaController.cs       # Endpoints RESTful (Planos, Commits, Branches, Validação)
│   ├── Data/
│   │   └── QaDbContext.cs        # Contexto do Entity Framework Core (Postgres/SQLite)
│   ├── Models/
│   │   └── Entities.cs           # Modelos de dados (TestPlan, TestExecution, GitHub, ISTQB)
│   ├── Services/
│   │   ├── GeminiPlannerService.cs       # Motor da IA Quantum (Prompt Engineering)
│   │   ├── GitHubService.cs              # Integração GitHub, Diff e Diagnóstico de Tokens
│   │   ├── PlaywrightExecutionService.cs # Automação Playwright, prints e gravação .webm
│   │   └── AgentRunner.cs                # Fila de execução e ciclo de vida assíncrono
│   └── appsettings.json          # Configurações de API e conexões de banco
│
└── frontend/                     # Frontend Next.js 14 + React
    ├── pages/
    │   └── index.js              # Dashboard do Qore Analytics com abas, modais e player
    └── styles/
        └── globals.css           # Estilização Tailwind CSS e tema escuro moderno
```

---

## 6. COMO EXECUTAR O PROJETO

### Opção 1: Inicialização em 1 Clique (Recomendado)
Na pasta raiz do projeto:
- Execute o arquivo **`iniciar_mvp.bat`** (ou `.\iniciar_mvp.ps1` no PowerShell).
- O script prepara o banco de dados, compila o backend .NET 10, inicia o frontend Next.js e abre o navegador em `http://localhost:3000`.

### Opção 2: Inicialização Manual
```bash
# Terminal 1 - Backend (.NET 10)
cd QA_Platform_MVP/backend
dotnet run
# API ativa em: http://localhost:5000

# Terminal 2 - Frontend (Next.js)
cd QA_Platform_MVP/frontend
npm run start # ou npm run dev
# Dashboard ativo em: http://localhost:3000
```

---

## 7. ROADMAP PARA VERSÃO DE PRODUÇÃO (PRÓXIMOS PASSOS)

1. **Autenticação Multi-Tenant:** Sistema de login com criptografia bidirecional **AES-256-GCM** para salvar os tokens do GitHub diretamente no perfil do usuário no banco de dados.
2. **Integração OAuth oficial com o GitHub ("Login com GitHub"):** Conexão de repositórios com 1 clique sem necessidade de tokens manuais.
3. **Sincronização Direta com Jira / Azure DevOps:** Criação automática de *Issues* e casos de teste nas ferramentas de gestão via API oficial.
4. **Exportação de Scripts Executáveis:** Download direto de arquivos de teste prontos (`cenario.spec.ts` para Playwright ou Cypress).
5. **Integração Contínua (CI/CD):** Execução automática da IA Quantum a cada Pull Request aberto via GitHub Action.

---
*Documentação oficial do Qore Analytics com o motor de IA Quantum. Pronta para apresentações acadêmicas, relatórios de TCC e documentação técnica corporativa.*
