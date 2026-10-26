using System.ComponentModel.DataAnnotations;

namespace QaAgent.Api.Models;

public class Project
{
    [Key]
    public int Id { get; set; }
    [Required]
    public string Name { get; set; } = string.Empty;
    [Required]
    public string TargetUrl { get; set; } = string.Empty;
    public string? SwaggerUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class TestPlan
{
    [Key]
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Prompt { get; set; } = string.Empty;
    public string TargetUrl { get; set; } = string.Empty;
    public string StepsJson { get; set; } = "[]";
    public string ModelUsed { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class TestExecution
{
    [Key]
    public int Id { get; set; }
    public int? TestPlanId { get; set; }
    public string TargetUrl { get; set; } = string.Empty;
    public string Prompt { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending"; // Pending, Running, Passed, Failed
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? FinishedAt { get; set; }
    public int TotalSteps { get; set; }
    public int PassedSteps { get; set; }
    public int FailedSteps { get; set; }
    public string? VideoFileName { get; set; }
    public string? VideoUrl { get; set; }
    public string Logs { get; set; } = string.Empty;

    public List<TestStepExecution> Steps { get; set; } = new();
}

public class TestStepExecution
{
    [Key]
    public int Id { get; set; }
    public int TestExecutionId { get; set; }
    public int StepNumber { get; set; }
    public string? Codigo { get; set; } // "TC-01", "TC-02"
    public string StepTitle { get; set; } = string.Empty;
    public string? Descricao { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? Tipo { get; set; } // "Funcional", "Regressão", "Negativo", "Borda"
    public string? Tecnica { get; set; } // "Transição de Estado", "Partição de Equivalência", etc.
    public string? Prioridade { get; set; } // "Crítica", "Alta", "Média"
    public string? PreCondicao { get; set; }
    public string? DadosTeste { get; set; }
    public string? ResultadoEsperado { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Running, Passed, Failed, Skipped
    public string? ScreenshotFileName { get; set; }
    public string? ScreenshotUrl { get; set; }
    public string? ErrorDetails { get; set; }
    public int ActionsCount { get; set; }
    public long DurationMs { get; set; }
}

public class PlanRequestDto
{
    public string TargetUrl { get; set; } = string.Empty;
    public string? SwaggerUrl { get; set; }
    public string Prompt { get; set; } = string.Empty;
    public string? GithubUrl { get; set; }
    public string? GithubBranch { get; set; } // Nome da branch (ex: "main", "dev", "feature/...")
    public string? CommitSha { get; set; }    // Código do commit (hash curto ou SHA completo)
    public string? GithubToken { get; set; }  // Token opcional do GitHub (PAT) para evitar limites de taxa
    public string? Mode { get; set; } // "prompt" ou "github"
}

public class ExecuteRequestDto
{
    public string TargetUrl { get; set; } = string.Empty;
    public string? Prompt { get; set; }
    public int? TestPlanId { get; set; }
    public bool Headless { get; set; } = true;
    public List<StepItemDto> Steps { get; set; } = new();
}

public class StepItemDto
{
    public int Id { get; set; }
    public string? Codigo { get; set; } // "TC-01"
    public string Titulo { get; set; } = string.Empty;
    public string Acao { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public string? Alvo { get; set; }
    public string? Tipo { get; set; } // "Funcional", "Regressão", "Negativo", "Borda"
    public string? Tecnica { get; set; } // "Transição de Estado", "Partição de Equivalência", etc.
    public string? Prioridade { get; set; } // "Crítica", "Alta", "Média"
    public string? PreCondicao { get; set; }
    public string? DadosTeste { get; set; }
    public string? ResultadoEsperado { get; set; }
}

public class GitHubCommitInfo
{
    public string Sha { get; set; } = string.Empty;
    public string ShortSha => Sha.Length >= 7 ? Sha[..7] : Sha;
    public string Message { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public DateTime? Date { get; set; }
    public string HtmlUrl { get; set; } = string.Empty;
    public string? Branch { get; set; }
    public List<GitHubCommitFile> Files { get; set; } = new();
    public string SummaryText { get; set; } = string.Empty;
}

public class GitHubCommitFile
{
    public string Filename { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int Additions { get; set; }
    public int Deletions { get; set; }
    public string? Patch { get; set; }
}

public class GitHubBranchInfo
{
    public string Name { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
}

public class GitHubCommitSimple
{
    public string Sha { get; set; } = string.Empty;
    public string ShortSha => Sha.Length >= 7 ? Sha[..7] : Sha;
    public string Message { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public DateTime? Date { get; set; }
    public string HtmlUrl { get; set; } = string.Empty;
}

public class GitHubTokenTestResult
{
    public bool Valid { get; set; }
    public string TokenType { get; set; } = "Desconhecido"; // "Classic (PAT)" ou "Fine-grained"
    public string? Username { get; set; }
    public string? Name { get; set; }
    public List<string> Scopes { get; set; } = new();
    public bool HasRepoScope { get; set; }
    public bool RepoAccessible { get; set; }
    public string? RepoStatus { get; set; }
    public bool SsoRequired { get; set; }
    public string? SsoUrl { get; set; }
    public string? Message { get; set; }
    public string? Recommendation { get; set; }
}

public class RequirementTraceabilityItem
{
    public string IdRequisito { get; set; } = string.Empty; // "REQ-01", "REQ-02"
    public string Titulo { get; set; } = string.Empty;
    public string Categoria { get; set; } = "Funcional"; // "Funcional", "Regra de Negócio", "Segurança", "Interface"
    public string Modulo { get; set; } = string.Empty; // "Autenticação", "Agendamento", etc.
    public List<string> ArquivosAfetados { get; set; } = new();
    public List<string> CasosTesteIds { get; set; } = new(); // ["TC-01", "TC-02"]
    public string StatusCobertura { get; set; } = "100% Coberto"; // "100% Coberto", "Parcial", "Não Coberto"
    public string Prioridade { get; set; } = "Alta"; // "Crítica", "Alta", "Média"
    public string Justificativa { get; set; } = string.Empty;
}

public class UserAccount
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = "QA"; // "Dev", "QA", "Admin"
    public string CompanyName { get; set; } = "AfroKings Tech";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Company
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Domain { get; set; } = string.Empty;
    public string Plan { get; set; } = "Enterprise";
}

public class TestSignatureDto
{
    public int? TestPlanId { get; set; }
    public string SignerName { get; set; } = string.Empty;
    public string SignerRole { get; set; } = "QA Lead";
    public string Decision { get; set; } = "Aprovado para Teste Manual"; // "Aprovado para Teste Manual", "Aprovado com Ressalvas", "Reprovado"
    public string? Notes { get; set; }
    public DateTime SignedAt { get; set; } = DateTime.UtcNow;
    public string SignatureHash { get; set; } = string.Empty;
}

public class CreateBranchDto
{
    public string RepoUrl { get; set; } = string.Empty;
    public string BaseBranch { get; set; } = "main";
    public string NewBranchName { get; set; } = string.Empty;
    public string? CommitSha { get; set; }
    public string? GithubToken { get; set; }
}

public class TestAuthProfileDto
{
    public string RoleName { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Environment { get; set; } = "Homologação";
    public string Description { get; set; } = string.Empty;
}

