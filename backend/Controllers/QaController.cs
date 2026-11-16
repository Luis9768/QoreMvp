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
    private readonly PlaywrightBootstrapService _bootstrap;
    private readonly GitHubService _gitHub;
    private readonly QaDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<QaController> _logger;

    public QaController(
        IGeminiPlannerService planner,
        AgentRunner runner,
        PlaywrightBootstrapService bootstrap,
        GitHubService gitHub,
        QaDbContext db,
        IWebHostEnvironment env,
        ILogger<QaController> logger)
    {
        _planner = planner;
        _runner = runner;
        _bootstrap = bootstrap;
        _gitHub = gitHub;
        _db = db;
        _env = env;
        _logger = logger;
    }

    [HttpGet("status")]
    public IActionResult GetStatus()
    {
        return Ok(new
        {
            status = "Online",
            database = _db.Database.ProviderName ?? "Unknown",
            playwright = _bootstrap.GetStatus(),
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

    [HttpGet("executions/{id}/live")]
    public IActionResult GetLiveFrame(int id)
    {
        var livePath = Path.Combine(_env.ContentRootPath, "wwwroot", "evidencias", id.ToString(), "live.png");
        if (!System.IO.File.Exists(livePath))
            return NoContent();

        Response.Headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0";
        return PhysicalFile(livePath, "image/png");
    }

    // Fallback persistente: se o container reiniciou e apagou wwwroot/evidencias, restaura do PostgreSQL e serve com suporte a Range/seek (206)
    [HttpGet("/evidencias/{executionId:int}/{fileName}")]
    public async Task<IActionResult> GetEvidenceArtifact(int executionId, string fileName)
    {
        var safeFileName = Path.GetFileName(fileName);
        if (string.IsNullOrWhiteSpace(safeFileName) ||
            !string.Equals(safeFileName, fileName, StringComparison.Ordinal))
        {
            return BadRequest();
        }

        var ext = Path.GetExtension(safeFileName).ToLowerInvariant();
        var defaultContentType = ext switch
        {
            ".webm" => "video/webm",
            ".png" => "image/png",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".svg" => "image/svg+xml",
            ".webp" => "image/webp",
            _ => null
        };
        if (defaultContentType == null)
            return NotFound();

        var evidenceDir = Path.Combine(_env.ContentRootPath, "wwwroot", "evidencias", executionId.ToString());
        var diskPath = Path.Combine(evidenceDir, safeFileName);
        if (System.IO.File.Exists(diskPath))
        {
            return PhysicalFile(diskPath, defaultContentType, enableRangeProcessing: true);
        }

        var artifact = await _db.ExecutionArtifacts
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.TestExecutionId == executionId && a.FileName == safeFileName);

        if (artifact == null || artifact.Data.Length == 0)
            return NotFound();

        var mime = string.IsNullOrWhiteSpace(artifact.ContentType) ? defaultContentType : artifact.ContentType;
        try
        {
            Directory.CreateDirectory(evidenceDir);
            var tmpPath = diskPath + $".{Guid.NewGuid():N}.tmp";
            await System.IO.File.WriteAllBytesAsync(tmpPath, artifact.Data);
            System.IO.File.Move(tmpPath, diskPath, overwrite: true);
            return PhysicalFile(diskPath, mime, enableRangeProcessing: true);
        }
        catch
        {
            return File(artifact.Data, mime, enableRangeProcessing: true);
        }
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

    // Lista de usuários padrão do sistema (RBAC: 1 único perfil obrigatório por usuário -> 1=Dev, 2=QA, 3=Admin)
    private static readonly List<UserAccount> DefaultUsers = new()
    {
        new UserAccount { Id = 1, Name = "Luis Santos", Email = "luis.qa@qoreanalytics.com", Role = "QA", PerfilId = 2, CompanyName = "AfroKings Tech", CreatedAt = DateTime.UtcNow.AddDays(-30) },
        new UserAccount { Id = 2, Name = "Carlos Silva", Email = "carlos.dev@afrokings.com", Role = "Dev", PerfilId = 1, CompanyName = "AfroKings Tech", CreatedAt = DateTime.UtcNow.AddDays(-20) },
        new UserAccount { Id = 3, Name = "Mariana Costa", Email = "mariana.admin@qoreanalytics.com", Role = "Admin", PerfilId = 3, CompanyName = "Qore Analytics Global", CreatedAt = DateTime.UtcNow.AddDays(-60) },
        new UserAccount { Id = 4, Name = "Lucas Barber", Email = "lucas.dev@studiobarber.com", Role = "Dev", PerfilId = 1, CompanyName = "Studio Barber Ltda", CreatedAt = DateTime.UtcNow.AddDays(-10) }
    };

    // Lista de projetos cadastrados (DDD: cada projeto é obrigatoriamente vinculado a 1 ou mais usuários)
    private static readonly List<Project> DefaultProjects = new()
    {
        new Project
        {
            Id = 1,
            Name = "AfroKings BarberShop (Cloud)",
            TargetUrl = "https://tcc-senai-front-2.vercel.app/",
            SwaggerUrl = "https://afrokings.azurewebsites.net/swagger/v1/swagger.json",
            GithubUrl = "https://github.com/LuisSantos09/TCC_Senai_Front",
            EnvironmentType = "Cloud / Produção",
            UserIds = new List<int> { 1, 2, 3 },
            CreatedAt = DateTime.UtcNow.AddDays(-25)
        },
        new Project
        {
            Id = 2,
            Name = "Qore Analytics API & Portal (Homologação)",
            TargetUrl = "https://tcc-senai-front-2.vercel.app/login",
            SwaggerUrl = "https://afrokings.azurewebsites.net/swagger/v1/swagger.json",
            GithubUrl = "https://github.com/LuisSantos09/TCC_Senai_Back",
            EnvironmentType = "Homologação",
            UserIds = new List<int> { 1, 3 },
            CreatedAt = DateTime.UtcNow.AddDays(-12)
        },
        new Project
        {
            Id = 3,
            Name = "Meu Projeto Local via Túnel (Shift-Left)",
            TargetUrl = "https://meu-app-teste.loca.lt",
            SwaggerUrl = "",
            GithubUrl = "https://github.com/LuisSantos09/TCC_Senai_Front",
            EnvironmentType = "Túnel Local (Shift-Left)",
            UserIds = new List<int> { 1, 2, 4 },
            CreatedAt = DateTime.UtcNow.AddDays(-2)
        }
    };

    private static object EnrichProject(Project p)
    {
        var linkedUsers = DefaultUsers
            .Where(u => p.UserIds.Contains(u.Id))
            .Select(u => new
            {
                u.Id,
                u.Name,
                u.Email,
                u.Role,
                u.PerfilId,
                u.CompanyName
            })
            .ToList();

        return new
        {
            p.Id,
            p.Name,
            p.TargetUrl,
            p.SwaggerUrl,
            p.GithubUrl,
            p.EnvironmentType,
            p.UserIds,
            Users = linkedUsers,
            TotalUsers = linkedUsers.Count,
            p.CreatedAt
        };
    }

    private static string? ValidateProjectDto(CreateProjectRequestDto dto, int? ignoreId = null)
    {
        if (dto == null)
            return "Os dados do projeto não podem ser nulos.";

        var nome = dto.Name?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(nome))
            return "O nome do projeto é obrigatório.";
        if (nome.Length < 2 || nome.Length > 150)
            return "O nome do projeto deve ter entre 2 e 150 caracteres.";

        if (DefaultProjects.Any(p => p.Id != ignoreId && string.Equals(p.Name.Trim(), nome, StringComparison.OrdinalIgnoreCase)))
            return $"Já existe um projeto cadastrado com o nome '{nome}'.";

        var urlAlvo = dto.TargetUrl?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(urlAlvo))
            return "A URL Alvo (TargetUrl) do projeto é obrigatória.";
        if (!Uri.TryCreate(urlAlvo, UriKind.Absolute, out var targetUri) ||
            (targetUri.Scheme != Uri.UriSchemeHttp && targetUri.Scheme != Uri.UriSchemeHttps))
            return "A URL Alvo informada é inválida. Informe uma URL iniciando com http:// ou https://.";

        if (!string.IsNullOrWhiteSpace(dto.SwaggerUrl))
        {
            var swagger = dto.SwaggerUrl.Trim();
            if (!Uri.TryCreate(swagger, UriKind.Absolute, out var swaggerUri) ||
                (swaggerUri.Scheme != Uri.UriSchemeHttp && swaggerUri.Scheme != Uri.UriSchemeHttps))
                return "A URL do Swagger informada é inválida. Informe uma URL iniciando com http:// ou https://.";
        }

        var distinctUsers = dto.UserIds?.Where(id => id > 0).Distinct().ToList() ?? new List<int>();
        if (distinctUsers.Count == 0)
            return "Regra de Domínio: Um projeto deve estar obrigatoriamente vinculado a pelo menos 1 usuário.";

        var existingIds = DefaultUsers.Select(u => u.Id).ToHashSet();
        var missingIds = distinctUsers.Where(id => !existingIds.Contains(id)).ToList();
        if (missingIds.Count > 0)
            return $"Os seguintes IDs de usuários não existem: {string.Join(", ", missingIds)}.";

        return null;
    }

    private static string DetectEnvironmentType(string url)
    {
        var lower = (url ?? string.Empty).ToLowerInvariant();
        if (lower.Contains(".loca.lt") || lower.Contains("ngrok") || lower.Contains("trycloudflare.com") || lower.Contains("bore.pub") || lower.Contains("serveo.net"))
            return "Túnel Local (Shift-Left)";
        if (lower.Contains("localhost") || lower.Contains("127.0.0.1") || lower.Contains("host.docker.internal"))
            return "Localhost / Máquina Local";
        return "Cloud / Produção";
    }

    [HttpGet("projects")]
    public IActionResult GetProjects()
    {
        var result = DefaultProjects
            .OrderByDescending(p => p.Id)
            .Select(EnrichProject)
            .ToList();
        return Ok(result);
    }

    [HttpGet("projects/{id}")]
    public IActionResult GetProjectById(int id)
    {
        var proj = DefaultProjects.FirstOrDefault(p => p.Id == id);
        if (proj == null)
            return NotFound(new { error = $"Projeto com ID {id} não encontrado." });
        return Ok(EnrichProject(proj));
    }

    [HttpPost("projects")]
    public IActionResult CreateProject([FromBody] CreateProjectRequestDto dto)
    {
        var validationError = ValidateProjectDto(dto);
        if (validationError != null)
            return BadRequest(new { error = validationError });

        var newProject = new Project
        {
            Id = DefaultProjects.Count == 0 ? 1 : DefaultProjects.Max(p => p.Id) + 1,
            Name = dto.Name.Trim(),
            TargetUrl = dto.TargetUrl.Trim(),
            SwaggerUrl = string.IsNullOrWhiteSpace(dto.SwaggerUrl) ? null : dto.SwaggerUrl.Trim(),
            GithubUrl = string.IsNullOrWhiteSpace(dto.GithubUrl) ? null : dto.GithubUrl.Trim(),
            EnvironmentType = !string.IsNullOrWhiteSpace(dto.EnvironmentType) ? dto.EnvironmentType.Trim() : DetectEnvironmentType(dto.TargetUrl),
            UserIds = dto.UserIds.Where(id => id > 0).Distinct().ToList(),
            CreatedAt = DateTime.UtcNow
        };

        DefaultProjects.Add(newProject);
        return Created($"/api/qa/projects/{newProject.Id}", EnrichProject(newProject));
    }

    [HttpPut("projects/{id}")]
    public IActionResult UpdateProject(int id, [FromBody] CreateProjectRequestDto dto)
    {
        var existing = DefaultProjects.FirstOrDefault(p => p.Id == id);
        if (existing == null)
            return NotFound(new { error = $"Projeto com ID {id} não encontrado." });

        var validationError = ValidateProjectDto(dto, ignoreId: id);
        if (validationError != null)
            return BadRequest(new { error = validationError });

        existing.Name = dto.Name.Trim();
        existing.TargetUrl = dto.TargetUrl.Trim();
        existing.SwaggerUrl = string.IsNullOrWhiteSpace(dto.SwaggerUrl) ? null : dto.SwaggerUrl.Trim();
        existing.GithubUrl = string.IsNullOrWhiteSpace(dto.GithubUrl) ? null : dto.GithubUrl.Trim();
        existing.EnvironmentType = !string.IsNullOrWhiteSpace(dto.EnvironmentType) ? dto.EnvironmentType.Trim() : DetectEnvironmentType(dto.TargetUrl);
        existing.UserIds = dto.UserIds.Where(uId => uId > 0).Distinct().ToList();

        return Ok(EnrichProject(existing));
    }

    [HttpDelete("projects/{id}")]
    public IActionResult DeleteProject(int id)
    {
        var existing = DefaultProjects.FirstOrDefault(p => p.Id == id);
        if (existing == null)
            return NotFound(new { error = $"Projeto com ID {id} não encontrado." });

        DefaultProjects.Remove(existing);
        return NoContent();
    }

    [HttpGet("check-target")]
    public async Task<IActionResult> CheckTargetConnectivity([FromQuery] string url)
    {
        if (string.IsNullOrWhiteSpace(url))
            return BadRequest(new { error = "Informe uma URL para testar a conectividade." });

        var cleanUrl = url.Trim();
        if (!Uri.TryCreate(cleanUrl, UriKind.Absolute, out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
        {
            return BadRequest(new { error = "URL inválida. Certifique-se de incluir http:// ou https://." });
        }

        var lower = cleanUrl.ToLowerInvariant();
        var isContainer = string.Equals(Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER"), "true", StringComparison.OrdinalIgnoreCase);

        string detectedType = "Cloud / Produção";
        bool isTunnel = false;

        if (lower.Contains(".loca.lt"))
        {
            detectedType = "LocalTunnel (.loca.lt)";
            isTunnel = true;
        }
        else if (lower.Contains("ngrok"))
        {
            detectedType = "Ngrok Tunnel (.ngrok)";
            isTunnel = true;
        }
        else if (lower.Contains("trycloudflare.com"))
        {
            detectedType = "Cloudflare Quick Tunnel";
            isTunnel = true;
        }
        else if (lower.Contains("host.docker.internal"))
        {
            detectedType = "Docker Host Bridge";
        }
        else if (lower.Contains("localhost") || lower.Contains("127.0.0.1"))
        {
            detectedType = "Localhost (Máquina Local)";
        }

        var sw = System.Diagnostics.Stopwatch.StartNew();
        try
        {
            using var handler = new HttpClientHandler
            {
                ServerCertificateCustomValidationCallback = (_, _, _, _) => true
            };
            using var client = new HttpClient(handler) { Timeout = TimeSpan.FromSeconds(8) };
            client.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 (Windows NT 10.0; Win64; x64) QoreAnalyticsProbe/2.0");
            client.DefaultRequestHeaders.TryAddWithoutValidation("Bypass-Tunnel-Reminder", "true");
            client.DefaultRequestHeaders.TryAddWithoutValidation("ngrok-skip-browser-warning", "true");

            using var resp = await client.GetAsync(cleanUrl);
            sw.Stop();

            var statusCode = (int)resp.StatusCode;
            var reachable = statusCode >= 200 && statusCode < 500;

            return Ok(new TargetConnectivityResultDto
            {
                Reachable = reachable,
                StatusCode = statusCode,
                LatencyMs = sw.ElapsedMilliseconds,
                Url = cleanUrl,
                DetectedType = detectedType,
                IsTunnel = isTunnel,
                RunningInContainer = isContainer,
                Message = reachable
                    ? $"Conexão estabelecida com sucesso ({statusCode} {resp.ReasonPhrase}) em {sw.ElapsedMilliseconds}ms!"
                    : $"Servidor respondeu com status {statusCode} ({resp.ReasonPhrase}).",
                Recommendation = isTunnel
                    ? "Headers anti-bloqueio de túnel (Bypass-Tunnel-Reminder / ngrok-skip-browser-warning) ativos automaticamente no motor Playwright!"
                    : null
            });
        }
        catch (Exception ex)
        {
            sw.Stop();
            var isLocalhost = lower.Contains("localhost") || lower.Contains("127.0.0.1");
            string recommendation;

            if (isLocalhost && isContainer)
            {
                recommendation = "O Qore Analytics está rodando dentro de um Container/Easypanel. Para acessar um projeto na sua máquina local, gere um Túnel Reverso com 'npx localtunnel --port SUA_PORTA' e use a URL https://...loca.lt.";
            }
            else if (isLocalhost)
            {
                recommendation = "Verifique se o seu projeto local está rodando na porta informada ou use um túnel reverso caso o Qore esteja hospedado no Easypanel.";
            }
            else if (isTunnel)
            {
                recommendation = "O túnel parece offline ou fechado. Confira se o comando (npx localtunnel / ngrok / cloudflared) continua aberto no seu terminal.";
            }
            else
            {
                recommendation = "Verifique se a URL está correta e acessível publicamente.";
            }

            return Ok(new TargetConnectivityResultDto
            {
                Reachable = false,
                StatusCode = 0,
                LatencyMs = sw.ElapsedMilliseconds,
                Url = cleanUrl,
                DetectedType = detectedType,
                IsTunnel = isTunnel,
                RunningInContainer = isContainer,
                Message = $"Não foi possível alcançar {cleanUrl}: {ex.Message.Split('\n')[0]}",
                Recommendation = recommendation
            });
        }
    }

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

        if (DefaultUsers.Any(u => string.Equals(u.Email.Trim(), newUser.Email.Trim(), StringComparison.OrdinalIgnoreCase)))
            return BadRequest(new { error = "Já existe um usuário cadastrado com este e-mail." });

        newUser.Id = DefaultUsers.Count == 0 ? 1 : DefaultUsers.Max(u => u.Id) + 1;
        newUser.CreatedAt = DateTime.UtcNow;

        // Sincroniza Perfil Único (1=Dev, 2=QA, 3=Admin)
        if (newUser.PerfilId is >= 1 and <= 3)
        {
            newUser.Role = newUser.PerfilId switch
            {
                2 => "QA",
                3 => "Admin",
                _ => "Dev"
            };
        }
        else
        {
            if (string.IsNullOrWhiteSpace(newUser.Role)) newUser.Role = "Dev";
            newUser.PerfilId = newUser.Role.ToUpperInvariant() switch
            {
                "QA" => 2,
                "ADMIN" => 3,
                _ => 1
            };
        }

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
            client.DefaultRequestHeaders.TryAddWithoutValidation("Bypass-Tunnel-Reminder", "true");
            client.DefaultRequestHeaders.TryAddWithoutValidation("ngrok-skip-browser-warning", "true");
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

