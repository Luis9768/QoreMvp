using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QaAgent.Api.Data;
using QaAgent.Api.Models;
using QaAgent.Api.Services;

namespace QaAgent.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class QaController : ControllerBase
{
    private readonly IGeminiPlannerService _planner;
    private readonly AgentRunner _runner;
    private readonly GitHubService _gitHub;
    private readonly QaDbContext _db;
    private readonly ILogger<QaController> _logger;

    public QaController(IGeminiPlannerService planner, AgentRunner runner, GitHubService gitHub, QaDbContext db, ILogger<QaController> logger)
    {
        _planner = planner;
        _runner = runner;
        _gitHub = gitHub;
        _db = db;
        _logger = logger;
    }

    [HttpGet("status")]
    public IActionResult GetStatus()
    {
        return Ok(new
        {
            status = "Online",
            database = _db.Database.ProviderName ?? "Unknown",
            timestamp = DateTime.UtcNow
        });
    }

    private string? ExtractGithubToken(PlanRequestDto? dto = null)
    {
        var raw = Request.Headers["X-GitHub-Token"].FirstOrDefault()
            ?? Request.Headers["Authorization"].FirstOrDefault()?.Replace("Bearer ", "")
            ?? Request.Query["token"].FirstOrDefault()
            ?? dto?.GithubToken;

        if (string.IsNullOrWhiteSpace(raw)) return null;

        var clean = raw.Trim();
        if (clean.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            clean = clean["Bearer ".Length..].Trim();
        else if (clean.StartsWith("token ", StringComparison.OrdinalIgnoreCase))
            clean = clean["token ".Length..].Trim();

        return clean;
    }

    [HttpGet("github/validate-token")]
    public async Task<IActionResult> ValidateToken([FromQuery] string? url = null, [FromQuery] string? token = null)
    {
        var effectiveToken = !string.IsNullOrWhiteSpace(token) ? token : ExtractGithubToken();
        var result = await _gitHub.TestTokenAccessAsync(effectiveToken, url);
        return Ok(result);
    }

    [HttpPost("github-preview")]
    public async Task<IActionResult> PreviewGithub([FromBody] PlanRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.GithubUrl))
            return BadRequest(new { error = "URL do repositório GitHub é obrigatória." });

        var token = ExtractGithubToken(request);
        var (commit, err) = await _gitHub.GetCommitDiffAsync(request.GithubUrl, request.GithubBranch, request.CommitSha, token);
        if (commit == null)
            return BadRequest(new { error = err ?? "Não foi possível obter dados do GitHub." });

        return Ok(commit);
    }

    [HttpGet("github/branches")]
    public async Task<IActionResult> GetBranches([FromQuery] string url, [FromQuery] string? token = null)
    {
        if (string.IsNullOrWhiteSpace(url))
            return BadRequest(new { error = "URL do GitHub é obrigatória." });

        var effectiveToken = !string.IsNullOrWhiteSpace(token) ? token : ExtractGithubToken();
        var (branches, err) = await _gitHub.GetBranchesAsync(url, effectiveToken);
        if (branches == null)
            return BadRequest(new { error = err ?? "Não foi possível obter as branches." });

        return Ok(branches);
    }

    [HttpGet("github/commits")]
    public async Task<IActionResult> GetRecentCommits([FromQuery] string url, [FromQuery] string? branch = null, [FromQuery] string? token = null)
    {
        if (string.IsNullOrWhiteSpace(url))
            return BadRequest(new { error = "URL do GitHub é obrigatória." });

        var effectiveToken = !string.IsNullOrWhiteSpace(token) ? token : ExtractGithubToken();
        var (commits, err) = await _gitHub.GetRecentCommitsAsync(url, branch, effectiveToken);
        if (commits == null)
            return BadRequest(new { error = err ?? "Não foi possível obter os commits recentes." });

        return Ok(commits);
    }

    [HttpPost("plan")]
    public async Task<IActionResult> GeneratePlan([FromBody] PlanRequestDto request)
    {
        var isGithub = string.Equals(request.Mode, "github", StringComparison.OrdinalIgnoreCase) || !string.IsNullOrWhiteSpace(request.GithubUrl);

        if (!isGithub && string.IsNullOrWhiteSpace(request.TargetUrl))
            return BadRequest(new { error = "TargetUrl é obrigatória para o modo de automação E2E." });

        if (isGithub && string.IsNullOrWhiteSpace(request.GithubUrl))
            return BadRequest(new { error = "URL do GitHub é necessária para o modo de análise de commit." });

        _logger.LogInformation("POST /plan -> gerando plano (Modo: {Mode}, Target: {Url}, GitHub: {Github}, Branch: {Branch}, Commit: {Commit})", 
            request.Mode, request.TargetUrl, request.GithubUrl, request.GithubBranch, request.CommitSha);

        System.Text.Json.Nodes.JsonNode? plan = null;
        string? model = null;
        string? error = null;
        GitHubCommitInfo? commitInfo = null;

        if (isGithub)
        {
            var token = ExtractGithubToken(request);
            var (commit, commitErr) = await _gitHub.GetCommitDiffAsync(request.GithubUrl!, request.GithubBranch, request.CommitSha, token);
            if (commit == null)
                return BadRequest(new { error = commitErr ?? "Falha ao consultar commit no GitHub." });

            commitInfo = commit;
            (plan, model, error) = await _planner.GeneratePlanFromCommitAsync(request.TargetUrl, request.SwaggerUrl, commit, request.Prompt);
        }
        else
        {
            (plan, model, error) = await _planner.GenerateTestPlanAsync(request.TargetUrl, request.SwaggerUrl, request.Prompt);
        }

        if (plan == null)
        {
            _logger.LogWarning("Falha ao gerar plano: {Error}", error);
            return StatusCode(502, new { error });
        }

        var entity = new TestPlan
        {
            TargetUrl = !string.IsNullOrWhiteSpace(request.TargetUrl) ? request.TargetUrl : (request.GithubUrl ?? "github"),
            Prompt = request.Prompt,
            Title = plan["titulo"]?.ToString() ?? "Cenário de teste",
            StepsJson = plan.ToJsonString(),
            ModelUsed = model ?? "",
            CreatedAt = DateTime.UtcNow
        };
        _db.TestPlans.Add(entity);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Plano #{Id} gerado com {Model} ({Count} passos)", entity.Id, model, plan["passos"]?.AsArray().Count);
        return Ok(new
        {
            planId = entity.Id,
            titulo = entity.Title,
            resumo = plan["resumo"]?.ToString() ?? "",
            analise = plan["analise"],
            analiseImpacto = plan["analise"]?["analiseImpacto"]?.ToString() ?? plan["analiseImpacto"]?.ToString() ?? "",
            matrizRisco = plan["analise"]?["matrizRiscos"] ?? plan["matrizRisco"],
            matrizRastreabilidade = plan["matrizRastreabilidade"] ?? plan["analise"]?["matrizRastreabilidade"] ?? plan["rtm"],
            rtm = plan["matrizRastreabilidade"] ?? plan["analise"]?["matrizRastreabilidade"] ?? plan["rtm"],
            commit = commitInfo,
            modelUsed = model,
            passos = plan["passos"]
        });
    }

    [HttpPost("execute")]
    public async Task<IActionResult> ExecutePlan([FromBody] ExecuteRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.TargetUrl))
            return BadRequest(new { error = "TargetUrl é obrigatória." });
        if (request.Steps.Count == 0)
            return BadRequest(new { error = "O plano não tem passos. Gere um plano antes de executar." });

        var id = await _runner.StartAsync(request);
        _logger.LogInformation("POST /execute -> execução #{Id} iniciada ({Count} passos)", id, request.Steps.Count);
        return Accepted(new { executionId = id });
    }

    [HttpGet("executions")]
    public async Task<IActionResult> GetExecutions()
    {
        var list = await _db.TestExecutions
            .AsNoTracking()
            .Include(e => e.Steps.OrderBy(s => s.StepNumber))
            .OrderByDescending(e => e.StartedAt)
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("executions/{id}")]
    public async Task<IActionResult> GetExecution(int id)
    {
        var exec = await _db.TestExecutions
            .AsNoTracking()
            .Include(e => e.Steps.OrderBy(s => s.StepNumber))
            .FirstOrDefaultAsync(e => e.Id == id);
        return exec == null ? NotFound() : Ok(exec);
    }

    [HttpPost("github/create-branch")]
    public async Task<IActionResult> CreateBranch([FromBody] CreateBranchDto request)
    {
        if (string.IsNullOrWhiteSpace(request.RepoUrl))
            return BadRequest(new { error = "RepoUrl é obrigatória." });

        var token = ExtractGithubToken();
        if (!string.IsNullOrWhiteSpace(request.GithubToken)) token = request.GithubToken;

        var (success, msg, cmd) = await _gitHub.CreateBranchAsync(
            request.RepoUrl, request.BaseBranch, request.NewBranchName, request.CommitSha, token);

        return Ok(new
        {
            success,
            message = msg,
            gitCommand = cmd,
            branchName = string.IsNullOrWhiteSpace(request.NewBranchName) ? "test/qa-run" : request.NewBranchName
        });
    }

    // Lista de usuários padrão do sistema (Mock persistente em memória para RBAC e Multi-tenant)
    private static readonly List<UserAccount> DefaultUsers = new()
    {
        new UserAccount { Id = 1, Name = "Luis Santos", Email = "luis.qa@qoreanalytics.com", Role = "QA", CompanyName = "AfroKings Tech", CreatedAt = DateTime.UtcNow.AddDays(-30) },
        new UserAccount { Id = 2, Name = "Carlos Silva (Dev)", Email = "carlos.dev@afrokings.com", Role = "Dev", CompanyName = "AfroKings Tech", CreatedAt = DateTime.UtcNow.AddDays(-20) },
        new UserAccount { Id = 3, Name = "Mariana Costa (Admin)", Email = "mariana.admin@qoreanalytics.com", Role = "Admin", CompanyName = "Qore Analytics Global", CreatedAt = DateTime.UtcNow.AddDays(-60) },
        new UserAccount { Id = 4, Name = "Lucas Barber (Dev)", Email = "lucas.dev@studiobarber.com", Role = "Dev", CompanyName = "Studio Barber Ltda", CreatedAt = DateTime.UtcNow.AddDays(-10) }
    };

    [HttpGet("users")]
    public IActionResult GetUsers()
    {
        return Ok(DefaultUsers);
    }

    [HttpPost("users")]
    public IActionResult CreateUser([FromBody] UserAccount newUser)
    {
        if (string.IsNullOrWhiteSpace(newUser.Name) || string.IsNullOrWhiteSpace(newUser.Email))
            return BadRequest(new { error = "Nome e e-mail são obrigatórios." });

        newUser.Id = DefaultUsers.Count + 1;
        newUser.CreatedAt = DateTime.UtcNow;
        if (string.IsNullOrWhiteSpace(newUser.Role)) newUser.Role = "Dev";
        if (string.IsNullOrWhiteSpace(newUser.CompanyName)) newUser.CompanyName = "AfroKings Tech";

        DefaultUsers.Add(newUser);
        return Created($"/api/qa/users/{newUser.Id}", newUser);
    }

    [HttpPost("sign-off")]
    public IActionResult SignTest([FromBody] TestSignatureDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.SignerName))
            return BadRequest(new { error = "Nome do responsável técnico é obrigatório para assinar." });

        if (string.Equals(dto.SignerRole, "Dev", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "Desenvolvedores (Dev) não têm permissão para assinar aprovação de release. Assinatura restrita a perfis QA e Admin." });

        dto.SignedAt = DateTime.UtcNow;
        var rawString = $"{dto.TestPlanId}-{dto.SignerName}-{dto.SignerRole}-{dto.Decision}-{dto.SignedAt:O}";
        using var sha = System.Security.Cryptography.SHA256.Create();
        var bytes = sha.ComputeHash(System.Text.Encoding.UTF8.GetBytes(rawString));
        dto.SignatureHash = $"QA-SIG-{Convert.ToHexString(bytes)[..16]}";

        return Ok(new
        {
            success = true,
            signature = dto,
            message = $"Teste assinado com sucesso por {dto.SignerName} ({dto.SignerRole}) com parecer '{dto.Decision}'."
        });
    }

    [HttpGet("preview-html")]
    public async Task<IActionResult> PreviewHtml([FromQuery] string url)
    {
        if (string.IsNullOrWhiteSpace(url))
            return BadRequest(new { error = "URL é obrigatória para pré-visualização." });

        try
        {
            using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
            client.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
            var html = await client.GetStringAsync(url);
            var clean = html.Length > 25000 ? html[..25000] + "\n<!-- HTML truncado para pré-visualização rápida -->" : html;
            return Ok(new { url, html = clean, length = html.Length });
        }
        catch (Exception ex)
        {
            return Ok(new
            {
                url,
                html = $"<div class='p-4 text-amber-300 font-mono text-xs'>Não foi possível capturar o HTML ao vivo da URL ({ex.Message}). Exibindo estrutura DOM inferida pela IA Quantum.</div>",
                length = 0
            });
        }
    }
}

