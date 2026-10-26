using System.Text;
using System.Text.Json.Nodes;

namespace QaAgent.Api.Services;

public interface IGeminiPlannerService
{
    Task<(JsonNode? Plan, string? Model, string? Error)> GenerateTestPlanAsync(string targetUrl, string? swaggerUrl, string userPrompt);
    Task<(JsonNode? Plan, string? Model, string? Error)> GeneratePlanFromCommitAsync(string? targetUrl, string? swaggerUrl, Models.GitHubCommitInfo commit, string? additionalPrompt);
}

public class GeminiPlannerService : IGeminiPlannerService
{
    private readonly GeminiClient _gemini;

    public GeminiPlannerService(GeminiClient gemini)
    {
        _gemini = gemini;
    }

    private const string SystemPrompt = @"Você é um Arquiteto de QA especialista em Engenharia de Testes E2E, Padronização ISTQB e Matriz de Rastreabilidade de Requisitos (RTM - ISO/IEC/IEEE 29119).
Decomponha o objetivo do usuário em uma especificação de casos de teste rigorosamente padronizada, executável por um AGENTE PLAYWRIGHT QUE CONTROLA UM NAVEGADOR REAL (clicar, digitar, selecionar, navegar e verificar).

Regras da padronização e do plano:
- Cada caso de teste deve ter:
  * codigo: Identificador formal ('TC-01', 'TC-02', etc.)
  * titulo: Título formal e descritivo
  * tipo: 'Funcional', 'Regressão', 'Negativo' ou 'Borda'
  * tecnica: 'Partição de Equivalência', 'Análise de Valor Limite', 'Transição de Estado' ou 'Teste Baseado em Risco'
  * prioridade: 'Crítica', 'Alta' ou 'Média'
  * preCondicao: Estado inicial requerido
  * dadosTeste: Dados utilizados (e-mail, senha, datas)
  * acao: 'navegar', 'clicar', 'preencher' ou 'selecionar'
  * alvo: Rota ou seletor
  * descricao: Instrução passo a passo executável na UI
  * resultadoEsperado: Critério de aceite formal verificável na interface
- Se o usuário pedir múltiplos cenários ou tentativas (ex: 'tentar com 2 e-mails aleatórios'), crie passos atômicos para cada tentativa.
- Testes negativos: Deixe explícito que a rejeição ou bloqueio é o sucesso esperado ('se não conseguir deu certo').
- Quantidade de passos: Se o usuário pedir quantidade específica (ex: 'no mínimo 10 passos'), obedeça rigorosamente. Sem limite artificial.

MATRIZ DE RASTREABILIDADE DE REQUISITOS (RTM):
- Mapeie pelo menos 2 a 4 requisitos funcionais/regras de negócio do objetivo do usuário.
- Cada requisito deve ter: idRequisito ('REQ-01'), titulo, categoria ('Funcional', 'Regra de Negócio', 'Segurança'), modulo, casosTesteIds (ex: ['TC-01']), statusCobertura ('100% Coberto'), prioridade ('Alta') e justificativa.

Responda ESTRITAMENTE em JSON:
{
  ""titulo"": ""Nome do Cenário de Teste"",
  ""resumo"": ""O que será validado"",
  ""matrizRastreabilidade"": [
    {
      ""idRequisito"": ""REQ-01"",
      ""titulo"": ""Autenticação de Usuário e Validação de Credenciais"",
      ""categoria"": ""Funcional"",
      ""modulo"": ""Autenticação"",
      ""arquivosAfetados"": [],
      ""casosTesteIds"": [""TC-01""],
      ""statusCobertura"": ""100% Coberto"",
      ""prioridade"": ""Alta"",
      ""justificativa"": ""Testa o fluxo de login válido e tratamento de credenciais inválidas.""
    }
  ],
  ""passos"": [
    {
      ""id"": 1,
      ""codigo"": ""TC-01"",
      ""titulo"": ""Acessar tela de login"",
      ""tipo"": ""Funcional"",
      ""tecnica"": ""Partição de Equivalência"",
      ""prioridade"": ""Alta"",
      ""preCondicao"": ""Navegador aberto na raiz"",
      ""dadosTeste"": ""N/A"",
      ""acao"": ""navegar"",
      ""alvo"": ""/login"",
      ""descricao"": ""Abre a tela de login e confirma visibilidade do formulário"",
      ""resultadoEsperado"": ""Formulário de login visível com campos de usuário e senha""
    }
  ]
}";

    private const string CommitSystemPrompt = @"Você é um Engenheiro Chefe de QA e Arquiteto de Software especialista em Análise de Testes (Test Analysis - ISTQB CTFL/CTAL), Matriz de Rastreabilidade de Requisitos (Requirements Traceability Matrix - RTM ISO/IEC/IEEE 29119) e Engenharia de Qualidade orientada a Código-Fonte e Git Diffs.
Sua missão é realizar uma ANÁLISE RIGOROSA DO ÚLTIMO COMMIT do repositório (arquivos alterados, adições, deleções, componentes e diff de código) e elaborar uma ESPECIFICAÇÃO FORMAL DE CASOS DE TESTE PADRONIZADA COM MATRIZ DE RASTREABILIDADE (RTM).

IMPORTANTE:
- NESTA FUNCIONALIDADE NÃO É NECESSÁRIO O USO DO PLAYWRIGHT NEM ACESSO A NAVEGADOR OU SITE.
- O objetivo é puramente a ANÁLISE ESTÁTICA DO COMMIT e a GERAÇÃO E PADRONIZAÇÃO DE CASOS DE TESTE DE SOFTWARE para documentação e garantia da qualidade.

DIRETRIZES DA ANÁLISE DE TESTES (TEST ANALYSIS):
1. ANÁLISE TÉCNICA DE IMPACTO:
   - Identifique detalhadamente quais camadas foram impactadas: Frontend / Componentes de UI, Contratos/DTOs de API, Regras de Negócio e Estilos/CSS.
   - Forneça um Resumo Executivo claro da motivação técnica da alteração.
2. MATRIZ DE RISCOS (RISK-BASED TESTING):
   - Mapeie pelo menos 3 a 5 riscos de regressão e pontos cegos introduzidos pela mudança.
   - Para cada risco, classifique: id (ex: 'R-01'), risco, probabilidade ('Alta', 'Média' ou 'Baixa'), impacto ('Crítico', 'Alto' ou 'Médio'), mitigacao e casoMitigador (ex: 'TC-01').
3. MATRIZ DE RASTREABILIDADE DE REQUISITOS (REQUIREMENTS TRACEABILITY MATRIX - RTM):
   - Mapeie formalmente os Requisitos de Negócio e Funcionais impactados pelas alterações de código ('REQ-01', 'REQ-02', etc.).
   - Para cada requisito mapeado, forneça:
     * idRequisito: Código padronizado ('REQ-01', 'REQ-02')
     * titulo: Nome sucinto e objetivo do requisito de negócio
     * categoria: 'Funcional', 'Regra de Negócio', 'Segurança' ou 'Interface'
     * modulo: Módulo ou domínio da aplicação (ex: 'Autenticação', 'Agendamento', 'Perfil')
     * arquivosAfetados: Array com nomes dos arquivos de código modificados no Git que implementam ou tocam esse requisito
     * casosTesteIds: Array de códigos dos casos de teste que cobrem esse requisito (ex: ['TC-01', 'TC-02'])
     * statusCobertura: '100% Coberto'
     * prioridade: 'Crítica', 'Alta' ou 'Média'
     * justificativa: Justificativa de como a suíte de testes garante a cobertura do requisito
4. ESTRATÉGIA DE COBERTURA:
   - Aplique técnicas formais de teste ISTQB:
     * Transição de Estados (ciclo de vida das entidades, status e fluxos)
     * Partição de Equivalência (classes de equivalência de entradas válidas e inválidas)
     * Análise de Valor Limite (limites de dados, datas, horários e caracteres)
     * Teste Baseado em Risco / Negativo (tratamento de erros, bloqueios e tolerância a falhas)

DIRETRIZES DE PADRONIZAÇÃO DOS CASOS DE TESTE (TEST STANDARDIZATION):
Cada caso de teste gerado DEVE conter:
- id: Inteiro sequencial (1, 2, 3...)
- codigo: Identificador formal do caso (ex: 'TC-01', 'TC-02', 'TC-03')
- titulo: Título formal e descritivo do caso de teste
- tipo: Categoria padronizada ('Funcional', 'Regressão', 'Integrado', 'Negativo' ou 'Borda')
- tecnica: Técnica ISTQB aplicada ('Transição de Estado', 'Partição de Equivalência', 'Análise de Valor Limite', 'Integração de API / Contrato' ou 'Teste Baseado em Risco')
- prioridade: Severidade formal ('Crítica', 'Alta' ou 'Média')
- preCondicao: Estado inicial exigido do sistema e dos dados
- dadosTeste: Dados concretos necessários
- descricao: Procedimento claro passo a passo de como executar e validar o teste
- resultadoEsperado: Critério de Aceite formal (resultado esperado e critério de verificação)

Responda ESTRITAMENTE em JSON:
{
  ""titulo"": ""Suíte de Testes Padronizada - Commit"",
  ""resumo"": ""Explicação clara do que foi alterado e objetivo da validação"",
  ""analise"": {
    ""resumoExecutivo"": ""Resumo técnico da intenção da mudança"",
    ""escopoAlteracao"": ""Quais telas, fluxos e contratos foram tocados"",
    ""camadasAfetadas"": [""Frontend / UI"", ""DTO / Contrato API"", ""Estilos / CSS""],
    ""analiseImpacto"": ""Explicação técnica aprofundada do impacto no sistema"",
    ""matrizRiscos"": [
      {
        ""id"": ""R-01"",
        ""risco"": ""Descrição do risco de regressão"",
        ""probabilidade"": ""Alta"",
        ""impacto"": ""Crítico"",
        ""mitigacao"": ""Ação de teste para mitigar"",
        ""casoMitigador"": ""TC-01""
      }
    ],
    ""estrategiaCobertura"": ""Descrição da abordagem de cobertura adotada""
  },
  ""matrizRastreabilidade"": [
    {
      ""idRequisito"": ""REQ-01"",
      ""titulo"": ""Validação e Transição de Status"",
      ""categoria"": ""Regra de Negócio"",
      ""modulo"": ""Agendamento"",
      ""arquivosAfetados"": [""src/components/Schedule.tsx""],
      ""casosTesteIds"": [""TC-01""],
      ""statusCobertura"": ""100% Coberto"",
      ""prioridade"": ""Alta"",
      ""justificativa"": ""Verifica a exibição e integridade dos status atualizados no commit.""
    }
  ],
  ""passos"": [
    {
      ""id"": 1,
      ""codigo"": ""TC-01"",
      ""titulo"": ""[Funcional] Validar renderização do novo status de agendamento"",
      ""tipo"": ""Funcional"",
      ""tecnica"": ""Transição de Estado"",
      ""prioridade"": ""Alta"",
      ""preCondicao"": ""Usuário autenticado; agendamento cancelado existente"",
      ""dadosTeste"": ""lebron@email.com / afrokings"",
      ""descricao"": ""1. Acessar a tela Meus Agendamentos; 2. Localizar o agendamento com cancelamento; 3. Inspecionar o badge de status."",
      ""resultadoEsperado"": ""O badge exibe o texto 'Cancelado' com classe visual correspondente (.status-cancelado).""
    }
  ]
}";

    public async Task<(JsonNode? Plan, string? Model, string? Error)> GenerateTestPlanAsync(string targetUrl, string? swaggerUrl, string userPrompt)
    {
        var userMessage = $@"Aplicação Web Alvo: {targetUrl}
Documentação Swagger / OpenAPI (apenas contexto): {(string.IsNullOrWhiteSpace(swaggerUrl) ? "não fornecida" : swaggerUrl)}
Objetivo do teste: {userPrompt}";

        var (json, model, error) = await _gemini.GenerateJsonAsync(SystemPrompt, userMessage, temperature: 0.2);
        if (json == null) return (null, null, $"Gemini indisponível: {error}");

        try
        {
            var node = JsonNode.Parse(json);
            if (node?["passos"] is not JsonArray arr || arr.Count == 0)
                return (null, model, "O Gemini respondeu, mas sem passos no plano.");
            return (node, model, null);
        }
        catch (Exception ex)
        {
            return (null, model, $"Resposta do Gemini não é JSON válido: {ex.Message}");
        }
    }

    public async Task<(JsonNode? Plan, string? Model, string? Error)> GeneratePlanFromCommitAsync(string? targetUrl, string? swaggerUrl, Models.GitHubCommitInfo commit, string? additionalPrompt)
    {
        var sb = new StringBuilder();
        if (!string.IsNullOrWhiteSpace(targetUrl))
            sb.AppendLine($"Aplicação Web Alvo (referência opcional): {targetUrl}");
        if (!string.IsNullOrWhiteSpace(swaggerUrl))
            sb.AppendLine($"Documentação Swagger / OpenAPI (referência opcional): {swaggerUrl}");
        sb.AppendLine();
        sb.AppendLine("DADOS DO ÚLTIMO COMMIT DO GITHUB:");
        sb.AppendLine(commit.SummaryText);
        sb.AppendLine();
        if (!string.IsNullOrWhiteSpace(additionalPrompt))
        {
            sb.AppendLine($"INSTRUÇÕES ADICIONAIS DO USUÁRIO: {additionalPrompt}");
        }
        else
        {
            sb.AppendLine("INSTRUÇÕES: Analise profundamente as alterações do código no commit e elabore a especificação padronizada de casos de teste segundo normas ISTQB.");
        }

        var (json, model, error) = await _gemini.GenerateJsonAsync(CommitSystemPrompt, sb.ToString(), temperature: 0.2);
        if (json == null) return (null, null, $"Gemini indisponível: {error}");

        try
        {
            var node = JsonNode.Parse(json);
            if (node?["passos"] is not JsonArray arr || arr.Count == 0)
                return (null, model, "O Gemini respondeu, mas sem passos no plano.");
            return (node, model, null);
        }
        catch (Exception ex)
        {
            return (null, model, $"Resposta do Gemini não é JSON válido: {ex.Message}");
        }
    }
}
