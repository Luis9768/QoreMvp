using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using QaAgent.Api.Models;

namespace QaAgent.Api.Services;

public class GitHubService
{
    private readonly HttpClient _http;
    private readonly IConfiguration _config;
    private readonly ILogger<GitHubService> _logger;

    public GitHubService(HttpClient http, IConfiguration config, ILogger<GitHubService> logger)
    {
        _http = http;
        _config = config;
        _logger = logger;
    }

    public Task<(GitHubCommitInfo? Commit, string? Error)> GetLatestCommitDiffAsync(string githubUrl, string? token = null)
        => GetCommitDiffAsync(githubUrl, null, null, token);

    public async Task<(GitHubCommitInfo? Commit, string? Error)> GetCommitDiffAsync(string githubUrl, string? branch = null, string? commitSha = null, string? token = null)
    {
        if (string.IsNullOrWhiteSpace(githubUrl))
            return (null, "URL do GitHub não fornecida.");

        var (owner, repo, detectedBranch, detectedSha, parseErr) = ParseRepo(githubUrl);
        if (parseErr != null)
            return (null, parseErr);

        var finalBranch = !string.IsNullOrWhiteSpace(branch) ? branch.Trim() : detectedBranch;
        var finalSha = !string.IsNullOrWhiteSpace(commitSha) ? commitSha.Trim() : detectedSha;

        try
        {
            string? targetSha = finalSha;

            // 1. Se não temos o commit SHA, tentamos obter o mais recente via API
            if (string.IsNullOrEmpty(targetSha))
            {
                var queryUrl = !string.IsNullOrEmpty(finalBranch)
                    ? $"https://api.github.com/repos/{owner}/{repo}/commits?sha={Uri.EscapeDataString(finalBranch)}&per_page=1"
                    : $"https://api.github.com/repos/{owner}/{repo}/commits?per_page=1";

                using var req = CreateRequest(queryUrl, token);
                var resp = await _http.SendAsync(req);

                if (resp.IsSuccessStatusCode)
                {
                    var jsonStr = await resp.Content.ReadAsStringAsync();
                    var commitsArray = JsonNode.Parse(jsonStr)?.AsArray();
                    if (commitsArray != null && commitsArray.Count > 0)
                    {
                        targetSha = commitsArray[0]?["sha"]?.ToString();
                    }
                }
                else if (resp.StatusCode == System.Net.HttpStatusCode.Forbidden || (int)resp.StatusCode == 429)
                {
                    _logger.LogWarning("GitHub REST API rate limit atingido ao buscar commit mais recente. Ativando fallback para Atom feed.");
                    var (fallbackCommits, _) = await GetRecentCommitsViaAtomAsync(owner!, repo!, finalBranch);
                    if (fallbackCommits != null && fallbackCommits.Count > 0)
                    {
                        targetSha = fallbackCommits[0].Sha;
                    }
                }
                else if (resp.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    if (resp.Headers.TryGetValues("X-GitHub-SSO", out var ssoVals))
                    {
                        return (null, $"Autorização SSO necessária! A organização '{owner}' exige autorização SAML/SSO para este token. Acesse github.com/settings/tokens, localize seu token e clique em 'Configure SSO' ➔ 'Authorize' ao lado de '{owner}'.");
                    }

                    var cleanTok = token?.Trim() ?? "";
                    if (cleanTok.StartsWith("github_pat_"))
                    {
                        return (null, $"Branch ou repositório não encontrado: {owner}/{repo} (branch: '{finalBranch}'). Atenção: Seu token é Fine-grained (github_pat_). Para repositórios da organização '{owner}', o 'Resource Owner' ao gerar o token DEVE ser a organização '{owner}' (não seu usuário pessoal) com permissão 'Contents: Read-only'. Alternativa recomendada: use um token Classic (ghp_) com a caixinha '[x] repo' marcada.");
                    }

                    var hint = string.IsNullOrWhiteSpace(token)
                        ? " Se o repositório for PRIVADO, informe um GitHub Personal Access Token (PAT) com permissão 'Contents: Read' ou 'repo'."
                        : $" Verifique se o token Classic (ghp_) possui a permissão '[x] repo' marcada, se a branch '{finalBranch}' existe e se sua conta tem acesso ao repositório '{owner}/{repo}'.";
                    return (null, $"Branch ou repositório não encontrado: {owner}/{repo} (branch: '{finalBranch}').{hint}");
                }
            }

            // Se ainda não temos o SHA, tenta fallback pelo Atom feed
            if (string.IsNullOrEmpty(targetSha))
            {
                var (fallbackCommits, _) = await GetRecentCommitsViaAtomAsync(owner!, repo!, finalBranch);
                if (fallbackCommits != null && fallbackCommits.Count > 0)
                {
                    targetSha = fallbackCommits[0].Sha;
                }
            }

            if (string.IsNullOrEmpty(targetSha))
            {
                return (null, $"Não foi possível identificar o commit alvo no repositório {owner}/{repo}. Tente informar o código do commit manualmente.");
            }

            // 2. Tenta buscar detalhes do commit via API REST
            var commitUrl = $"https://api.github.com/repos/{owner}/{repo}/commits/{targetSha}";
            using var commitReq = CreateRequest(commitUrl, token);
            var commitResp = await _http.SendAsync(commitReq);

            if (commitResp.IsSuccessStatusCode)
            {
                var detailJson = await commitResp.Content.ReadAsStringAsync();
                var commitNode = JsonNode.Parse(detailJson);
                if (commitNode != null)
                {
                    var fullSha = commitNode["sha"]?.ToString() ?? targetSha;
                    var info = new GitHubCommitInfo
                    {
                        Sha = fullSha,
                        Branch = finalBranch,
                        Message = commitNode["commit"]?["message"]?.ToString() ?? "Sem mensagem",
                        Author = commitNode["commit"]?["author"]?["name"]?.ToString() ?? "Desconhecido",
                        HtmlUrl = commitNode["html_url"]?.ToString() ?? $"https://github.com/{owner}/{repo}/commit/{fullSha}"
                    };

                    if (DateTime.TryParse(commitNode["commit"]?["author"]?["date"]?.ToString(), out var dt))
                        info.Date = dt;

                    var sbSummary = new StringBuilder();
                    sbSummary.AppendLine($"REPOSITÓRIO: {owner}/{repo}");
                    if (!string.IsNullOrEmpty(finalBranch))
                        sbSummary.AppendLine($"BRANCH: {finalBranch}");
                    sbSummary.AppendLine($"COMMIT: {info.ShortSha} ({info.Sha}) - {info.Message}");
                    sbSummary.AppendLine($"AUTOR: {info.Author} em {info.Date:dd/MM/yyyy HH:mm}");
                    sbSummary.AppendLine("ARQUIVOS MODIFICADOS:");

                    if (commitNode["files"] is JsonArray filesArr)
                    {
                        foreach (var f in filesArr)
                        {
                            var filename = f?["filename"]?.ToString() ?? "";
                            var status = f?["status"]?.ToString() ?? "modified";
                            var adds = f?["additions"]?.GetValue<int>() ?? 0;
                            var dels = f?["deletions"]?.GetValue<int>() ?? 0;
                            var patch = f?["patch"]?.ToString();

                            info.Files.Add(new GitHubCommitFile
                            {
                                Filename = filename,
                                Status = status,
                                Additions = adds,
                                Deletions = dels,
                                Patch = patch
                            });

                            sbSummary.AppendLine($"- {filename} ({status}, +{adds}/-{dels})");
                            if (!string.IsNullOrWhiteSpace(patch))
                            {
                                var snippet = patch.Length > 800 ? patch[..800] + "\n[... diff truncado ...]" : patch;
                                sbSummary.AppendLine("  Trecho do diff:");
                                sbSummary.AppendLine(Indent(snippet, "    "));
                            }
                        }
                    }

                    info.SummaryText = sbSummary.ToString();
                    return (info, null);
                }
            }

            // 3. Fallback: se a API REST retornou 403 (Rate limit exceeded) ou falhou
            _logger.LogWarning("GitHub REST API retornou {Status} para commit {Sha}. Ativando fallback para patch público.", commitResp.StatusCode, targetSha);
            var (patchInfo, patchErr) = await GetCommitDiffViaPatchAsync(owner!, repo!, finalBranch, targetSha);
            if (patchInfo != null)
            {
                return (patchInfo, null);
            }

            var errBody = await commitResp.Content.ReadAsStringAsync();
            return (null, $"Erro ao buscar commit '{targetSha}' ({commitResp.StatusCode}): {Trunc(errBody, 250)}. {patchErr}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao consultar GitHub para {Url} (Branch: {Branch}, Commit: {Commit})", githubUrl, finalBranch, finalSha);
            return (null, $"Falha na comunicação com o GitHub: {ex.Message}");
        }
    }

    public async Task<(List<GitHubBranchInfo>? Branches, string? Error)> GetBranchesAsync(string githubUrl, string? token = null)
    {
        if (string.IsNullOrWhiteSpace(githubUrl))
            return (null, "URL do GitHub não fornecida.");

        var (owner, repo, _, _, parseErr) = ParseRepo(githubUrl);
        if (parseErr != null)
            return (null, parseErr);

        try
        {
            var url = $"https://api.github.com/repos/{owner}/{repo}/branches?per_page=50";
            using var req = CreateRequest(url, token);
            var resp = await _http.SendAsync(req);

            if (resp.IsSuccessStatusCode)
            {
                var jsonStr = await resp.Content.ReadAsStringAsync();
                var arr = JsonNode.Parse(jsonStr)?.AsArray();
                var list = new List<GitHubBranchInfo>();

                if (arr != null)
                {
                    foreach (var b in arr)
                    {
                        var name = b?["name"]?.ToString();
                        if (!string.IsNullOrEmpty(name))
                        {
                            list.Add(new GitHubBranchInfo { Name = name });
                        }
                    }
                }

                return (list, null);
            }

            if (resp.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                if (resp.Headers.TryGetValues("X-GitHub-SSO", out var ssoVals))
                {
                    return (null, $"Autorização SSO necessária! A organização '{owner}' exige autorização SAML/SSO para este token. Acesse github.com/settings/tokens, localize seu token e clique em 'Configure SSO' ➔ 'Authorize' ao lado de '{owner}'.");
                }

                var cleanTok = token?.Trim() ?? "";
                if (cleanTok.StartsWith("github_pat_"))
                {
                    return (null, $"Repositório {owner}/{repo} não encontrado (404). Atenção: Seu token é Fine-grained (github_pat_). Para repositórios da organização '{owner}', o 'Resource Owner' ao gerar o token DEVE ser a organização '{owner}' (não seu usuário pessoal) com permissão 'Contents: Read-only'. Alternativa recomendada: use um token Classic (ghp_) com a caixinha '[x] repo' marcada.");
                }

                var hint = string.IsNullOrWhiteSpace(token)
                    ? " Se o repositório for PRIVADO, informe um GitHub Personal Access Token (PAT) com escopo 'repo' ou 'Contents: Read'."
                    : $" Verifique se o token Classic (ghp_) possui a permissão '[x] repo' marcada e se sua conta tem acesso ao repositório '{owner}/{repo}'.";
                return (null, $"Repositório {owner}/{repo} não encontrado.{hint}");
            }

            // Fallback se API estiver bloqueada por rate limit
            _logger.LogWarning("GitHub REST API branches retornou {Status}. Ativando fallback público.", resp.StatusCode);
            var fallbackBranches = await GetBranchesViaWebAsync(owner!, repo!);
            if (fallbackBranches != null && fallbackBranches.Count > 0)
            {
                return (fallbackBranches, null);
            }

            return (null, $"Limite da API pública do GitHub excedido (60 req/hora). Adicione um GitHub Token ou digite o nome da branch diretamente.");
        }
        catch (Exception ex)
        {
            return (null, $"Falha ao buscar branches: {ex.Message}");
        }
    }

    public async Task<(List<GitHubCommitSimple>? Commits, string? Error)> GetRecentCommitsAsync(string githubUrl, string? branch = null, string? token = null)
    {
        if (string.IsNullOrWhiteSpace(githubUrl))
            return (null, "URL do GitHub não fornecida.");

        var (owner, repo, detectedBranch, _, parseErr) = ParseRepo(githubUrl);
        if (parseErr != null)
            return (null, parseErr);

        var finalBranch = !string.IsNullOrWhiteSpace(branch) ? branch.Trim() : detectedBranch;

        try
        {
            var url = $"https://api.github.com/repos/{owner}/{repo}/commits?per_page=15";
            if (!string.IsNullOrEmpty(finalBranch))
            {
                url += $"&sha={Uri.EscapeDataString(finalBranch)}";
            }

            using var req = CreateRequest(url, token);
            var resp = await _http.SendAsync(req);

            if (resp.IsSuccessStatusCode)
            {
                var jsonStr = await resp.Content.ReadAsStringAsync();
                var arr = JsonNode.Parse(jsonStr)?.AsArray();
                var list = new List<GitHubCommitSimple>();

                if (arr != null)
                {
                    foreach (var c in arr)
                    {
                        var sha = c?["sha"]?.ToString() ?? "";
                        var msg = c?["commit"]?["message"]?.ToString() ?? "";
                        var author = c?["commit"]?["author"]?["name"]?.ToString() ?? "";
                        var htmlUrl = c?["html_url"]?.ToString() ?? "";
                        DateTime? date = null;
                        if (DateTime.TryParse(c?["commit"]?["author"]?["date"]?.ToString(), out var dt))
                            date = dt;

                        list.Add(new GitHubCommitSimple
                        {
                            Sha = sha,
                            Message = msg.Split('\n')[0],
                            Author = author,
                            Date = date,
                            HtmlUrl = htmlUrl
                        });
                    }
                }

                return (list, null);
            }

            if (resp.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                if (resp.Headers.TryGetValues("X-GitHub-SSO", out var ssoVals))
                {
                    return (null, $"Autorização SSO necessária! A organização '{owner}' exige autorização SAML/SSO para este token. Acesse github.com/settings/tokens, localize seu token e clique em 'Configure SSO' ➔ 'Authorize' ao lado de '{owner}'.");
                }

                var cleanTok = token?.Trim() ?? "";
                if (cleanTok.StartsWith("github_pat_"))
                {
                    return (null, $"Repositório {owner}/{repo} ou branch '{finalBranch}' não encontrada (404). Atenção: Seu token é Fine-grained (github_pat_). Para repositórios da organização '{owner}', o 'Resource Owner' ao gerar o token DEVE ser a organização '{owner}' (não seu usuário pessoal) com permissão 'Contents: Read-only'. Alternativa recomendada: use um token Classic (ghp_) com a permissão '[x] repo'.");
                }

                var hint = string.IsNullOrWhiteSpace(token)
                    ? " Se o repositório for PRIVADO, informe um GitHub Personal Access Token (PAT) com escopo 'repo' ou 'Contents: Read'."
                    : $" Verifique se o token Classic (ghp_) possui a permissão '[x] repo' marcada, se a branch '{finalBranch}' existe e se sua conta tem acesso ao repositório '{owner}/{repo}'.";
                return (null, $"Repositório {owner}/{repo} ou branch '{finalBranch}' não encontrada.{hint}");
            }

            // Fallback inteligente via Atom feed público se API der 403 (Rate limit exceeded)
            _logger.LogWarning("GitHub REST API commits retornou {Status}. Ativando fallback para Atom feed público.", resp.StatusCode);
            var (fallbackCommits, fallbackErr) = await GetRecentCommitsViaAtomAsync(owner!, repo!, finalBranch);
            if (fallbackCommits != null && fallbackCommits.Count > 0)
            {
                return (fallbackCommits, null);
            }

            var body = await resp.Content.ReadAsStringAsync();
            return (null, $"Erro ao buscar commits recentes: limite de requisições excedido pelo GitHub. Adicione um GitHub Token ou digite o código do commit manualmente.");
        }
        catch (Exception ex)
        {
            return (null, $"Falha ao buscar commits: {ex.Message}");
        }
    }

    /// <summary>
    /// Fallback para buscar commits recentes via feed Atom público do GitHub (não consome rate limit da API).
    /// </summary>
    public async Task<(List<GitHubCommitSimple>? Commits, string? Error)> GetRecentCommitsViaAtomAsync(string owner, string repo, string? branch)
    {
        try
        {
            var atomUrl = !string.IsNullOrWhiteSpace(branch)
                ? $"https://github.com/{owner}/{repo}/commits/{Uri.EscapeDataString(branch)}.atom"
                : $"https://github.com/{owner}/{repo}/commits.atom";

            using var req = new HttpRequestMessage(HttpMethod.Get, atomUrl);
            req.Headers.UserAgent.Add(new ProductInfoHeaderValue("Mozilla", "5.0"));
            var resp = await _http.SendAsync(req);

            if (!resp.IsSuccessStatusCode)
                return (null, $"Feed Atom não disponível ({resp.StatusCode})");

            var atomXml = await resp.Content.ReadAsStringAsync();
            var doc = XDocument.Parse(atomXml);
            XNamespace ns = "http://www.w3.org/2005/Atom";
            var list = new List<GitHubCommitSimple>();

            foreach (var entry in doc.Root?.Elements(ns + "entry") ?? Enumerable.Empty<XElement>())
            {
                var id = entry.Element(ns + "id")?.Value ?? "";
                var link = entry.Element(ns + "link")?.Attribute("href")?.Value ?? "";
                var title = entry.Element(ns + "title")?.Value?.Trim() ?? "Sem mensagem";
                var firstLine = title.Split('\n')[0].Trim();

                var dateStr = entry.Element(ns + "updated")?.Value;
                DateTime? date = null;
                if (DateTime.TryParse(dateStr, out var dt)) date = dt;

                var author = entry.Element(ns + "author")?.Element(ns + "name")?.Value?.Trim();
                if (string.IsNullOrEmpty(author))
                    author = entry.Element(ns + "author")?.Element(ns + "email")?.Value?.Trim() ?? "Git Author";

                var sha = "";
                var matchId = Regex.Match(id, @"Commit/([a-fA-F0-9]+)");
                if (matchId.Success)
                    sha = matchId.Groups[1].Value;
                else
                {
                    var matchLink = Regex.Match(link, @"/commit/([a-fA-F0-9]+)");
                    if (matchLink.Success)
                        sha = matchLink.Groups[1].Value;
                }

                if (!string.IsNullOrEmpty(sha))
                {
                    list.Add(new GitHubCommitSimple
                    {
                        Sha = sha,
                        Message = firstLine,
                        Author = author,
                        Date = date,
                        HtmlUrl = !string.IsNullOrEmpty(link) ? link : $"https://github.com/{owner}/{repo}/commit/{sha}"
                    });
                }
            }

            return (list, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Falha no fallback Atom para {Owner}/{Repo}", owner, repo);
            return (null, ex.Message);
        }
    }

    /// <summary>
    /// Fallback para buscar o diff de um commit via arquivo .patch público (não consome rate limit da API).
    /// </summary>
    public async Task<(GitHubCommitInfo? Commit, string? Error)> GetCommitDiffViaPatchAsync(string owner, string repo, string? branch, string sha)
    {
        try
        {
            var patchUrl = $"https://github.com/{owner}/{repo}/commit/{sha}.patch";
            using var req = new HttpRequestMessage(HttpMethod.Get, patchUrl);
            req.Headers.UserAgent.Add(new ProductInfoHeaderValue("Mozilla", "5.0"));
            var resp = await _http.SendAsync(req);

            if (!resp.IsSuccessStatusCode)
                return (null, $"Patch público não acessível ({resp.StatusCode})");

            var patchContent = await resp.Content.ReadAsStringAsync();
            var info = ParsePatch(patchContent, owner, repo, sha, branch);
            return (info, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Falha ao obter .patch para {Owner}/{Repo} commit {Sha}", owner, repo, sha);
            return (null, ex.Message);
        }
    }

    /// <summary>
    /// Fallback para obter lista de branches raspando a página HTML pública do GitHub.
    /// </summary>
    public async Task<List<GitHubBranchInfo>?> GetBranchesViaWebAsync(string owner, string repo)
    {
        try
        {
            var branchUrl = $"https://github.com/{owner}/{repo}/branches/all";
            using var req = new HttpRequestMessage(HttpMethod.Get, branchUrl);
            req.Headers.UserAgent.Add(new ProductInfoHeaderValue("Mozilla", "5.0"));
            var resp = await _http.SendAsync(req);

            var html = resp.IsSuccessStatusCode ? await resp.Content.ReadAsStringAsync() : "";
            var branches = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            var matches = Regex.Matches(html, $@"href=""/{Regex.Escape(owner)}/{Regex.Escape(repo)}/tree/([^""/#\?]+)""");
            foreach (Match m in matches)
            {
                var b = m.Groups[1].Value.Trim();
                if (!string.IsNullOrEmpty(b) && !b.Equals("tags", StringComparison.OrdinalIgnoreCase))
                    branches.Add(b);
            }

            if (branches.Count == 0)
            {
                branches.Add("main");
                branches.Add("master");
                branches.Add("develop");
            }

            return branches.Select(b => new GitHubBranchInfo { Name = b }).ToList();
        }
        catch
        {
            return new List<GitHubBranchInfo>
            {
                new() { Name = "develop" },
                new() { Name = "main" },
                new() { Name = "master" }
            };
        }
    }

    private static GitHubCommitInfo ParsePatch(string patchContent, string owner, string repo, string sha, string? branch)
    {
        var info = new GitHubCommitInfo
        {
            Sha = sha,
            Branch = branch,
            HtmlUrl = $"https://github.com/{owner}/{repo}/commit/{sha}"
        };

        var lines = patchContent.Split('\n');
        var sbMessage = new StringBuilder();
        bool inSubject = false;
        bool inHeader = true;

        foreach (var rawLine in lines)
        {
            var line = rawLine.TrimEnd('\r');
            if (inHeader)
            {
                if (line.StartsWith("From: ", StringComparison.OrdinalIgnoreCase) && string.IsNullOrEmpty(info.Author))
                {
                    var authorRaw = line["From: ".Length..].Trim();
                    var emailIdx = authorRaw.IndexOf('<');
                    info.Author = emailIdx > 0 ? authorRaw[..emailIdx].Trim() : authorRaw;
                }
                else if (line.StartsWith("Date: ", StringComparison.OrdinalIgnoreCase) && info.Date == null)
                {
                    var dateRaw = line["Date: ".Length..].Trim();
                    if (DateTime.TryParse(dateRaw, out var dt))
                        info.Date = dt;
                }
                else if (line.StartsWith("Subject: [PATCH] ", StringComparison.OrdinalIgnoreCase))
                {
                    inSubject = true;
                    sbMessage.Append(line["Subject: [PATCH] ".Length..].Trim());
                }
                else if (inSubject)
                {
                    if (line.StartsWith("---"))
                    {
                        inSubject = false;
                        inHeader = false;
                    }
                    else if (line.StartsWith(" ") || line.StartsWith("\t"))
                    {
                        sbMessage.Append(' ').Append(line.Trim());
                    }
                    else if (string.IsNullOrWhiteSpace(line))
                    {
                        // blank line after subject
                    }
                    else if (line.StartsWith("diff --git", StringComparison.OrdinalIgnoreCase))
                    {
                        inSubject = false;
                        inHeader = false;
                    }
                }
            }
        }

        info.Message = sbMessage.ToString().Trim();
        if (string.IsNullOrWhiteSpace(info.Message))
            info.Message = "Alteração de código no commit";

        // Parse files from diff --git
        var fileBlocks = patchContent.Split("diff --git a/");
        for (int i = 1; i < fileBlocks.Length; i++)
        {
            var block = fileBlocks[i];
            var firstNewline = block.IndexOf('\n');
            if (firstNewline <= 0) continue;

            var headerLine = block[..firstNewline].Trim();
            var fname = headerLine.Split(' ')[0];

            var status = "modified";
            if (block.Contains("new file mode", StringComparison.OrdinalIgnoreCase))
                status = "added";
            else if (block.Contains("deleted file mode", StringComparison.OrdinalIgnoreCase))
                status = "deleted";

            int adds = 0;
            int dels = 0;
            string? patchSnippet = null;

            var hunkStart = block.IndexOf("@@", StringComparison.Ordinal);
            if (hunkStart >= 0)
            {
                var diffBody = block[hunkStart..];
                patchSnippet = diffBody.TrimEnd();
                var diffLines = diffBody.Split('\n');
                foreach (var dl in diffLines)
                {
                    if (dl.StartsWith('+') && !dl.StartsWith("+++")) adds++;
                    else if (dl.StartsWith('-') && !dl.StartsWith("---")) dels++;
                }
            }

            info.Files.Add(new GitHubCommitFile
            {
                Filename = fname,
                Status = status,
                Additions = adds,
                Deletions = dels,
                Patch = patchSnippet
            });
        }

        var sbSummary = new StringBuilder();
        sbSummary.AppendLine($"REPOSITÓRIO: {owner}/{repo}");
        if (!string.IsNullOrEmpty(branch))
            sbSummary.AppendLine($"BRANCH: {branch}");
        sbSummary.AppendLine($"COMMIT: {info.ShortSha} ({info.Sha}) - {info.Message}");
        sbSummary.AppendLine($"AUTOR: {info.Author} em {info.Date:dd/MM/yyyy HH:mm}");
        sbSummary.AppendLine("ARQUIVOS MODIFICADOS:");

        foreach (var f in info.Files)
        {
            sbSummary.AppendLine($"- {f.Filename} ({f.Status}, +{f.Additions}/-{f.Deletions})");
            if (!string.IsNullOrWhiteSpace(f.Patch))
            {
                var snippet = f.Patch.Length > 800 ? f.Patch[..800] + "\n[... diff truncado ...]" : f.Patch;
                sbSummary.AppendLine("  Trecho do diff:");
                sbSummary.AppendLine(Indent(snippet, "    "));
            }
        }

        info.SummaryText = sbSummary.ToString();
        return info;
    }

    public static (string? Owner, string? Repo, string? DetectedBranch, string? DetectedCommitSha, string? Error) ParseRepo(string url)
    {
        if (string.IsNullOrWhiteSpace(url))
            return (null, null, null, null, "URL do GitHub não fornecida.");

        var clean = url.Trim();
        if (clean.EndsWith(".git", StringComparison.OrdinalIgnoreCase))
            clean = clean[..^4];
        clean = clean.TrimEnd('/');

        if (clean.StartsWith("https://github.com/", StringComparison.OrdinalIgnoreCase))
            clean = clean["https://github.com/".Length..];
        else if (clean.StartsWith("http://github.com/", StringComparison.OrdinalIgnoreCase))
            clean = clean["http://github.com/".Length..];
        else if (clean.StartsWith("github.com/", StringComparison.OrdinalIgnoreCase))
            clean = clean["github.com/".Length..];

        var parts = clean.Split('/', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length < 2)
            return (null, null, null, null, "URL do GitHub inválida. Use o formato: https://github.com/usuario/repositorio");

        var owner = parts[0];
        var repo = parts[1];
        string? branch = null;
        string? commitSha = null;

        if (parts.Length >= 4)
        {
            if (parts[2].Equals("commit", StringComparison.OrdinalIgnoreCase))
            {
                commitSha = parts[3];
            }
            else if (parts[2].Equals("tree", StringComparison.OrdinalIgnoreCase))
            {
                branch = string.Join("/", parts.Skip(3));
            }
        }

        return (owner, repo, branch, commitSha, null);
    }

    public async Task<GitHubTokenTestResult> TestTokenAccessAsync(string? token, string? githubUrl = null)
    {
        var result = new GitHubTokenTestResult();
        var cleanToken = token?.Trim();
        if (string.IsNullOrWhiteSpace(cleanToken))
        {
            result.Valid = false;
            result.Message = "Nenhum token fornecido.";
            result.Recommendation = "Insira um token do GitHub (PAT) para acessar repositórios privados.";
            return result;
        }

        if (cleanToken.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            cleanToken = cleanToken["Bearer ".Length..].Trim();
        else if (cleanToken.StartsWith("token ", StringComparison.OrdinalIgnoreCase))
            cleanToken = cleanToken["token ".Length..].Trim();

        result.TokenType = cleanToken.StartsWith("github_pat_") 
            ? "Fine-grained (Beta)" 
            : (cleanToken.StartsWith("ghp_") ? "Classic (PAT)" : "Personal Token");

        try
        {
            using var userReq = CreateRequest("https://api.github.com/user", cleanToken);
            var userResp = await _http.SendAsync(userReq);

            if (userResp.StatusCode == System.Net.HttpStatusCode.Unauthorized)
            {
                result.Valid = false;
                result.Message = "Token inválido ou expirado (HTTP 401 Unauthorized).";
                result.Recommendation = "Gere um novo Personal Access Token no GitHub e certifique-se de copiar o código completo sem espaços.";
                return result;
            }

            if (!userResp.IsSuccessStatusCode)
            {
                result.Valid = false;
                result.Message = $"Falha ao validar token no GitHub (HTTP {(int)userResp.StatusCode} {userResp.StatusCode}).";
                return result;
            }

            result.Valid = true;
            var userJson = await userResp.Content.ReadAsStringAsync();
            var userNode = JsonNode.Parse(userJson);
            result.Username = userNode?["login"]?.ToString();
            result.Name = userNode?["name"]?.ToString() ?? result.Username;

            if (userResp.Headers.TryGetValues("X-OAuth-Scopes", out var scopeHeaders))
            {
                var scopeList = string.Join(",", scopeHeaders)
                    .Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(s => s.Trim())
                    .ToList();
                result.Scopes = scopeList;
                result.HasRepoScope = scopeList.Contains("repo") || scopeList.Contains("public_repo");
            }
            else
            {
                result.HasRepoScope = result.TokenType.Contains("Fine-grained");
            }

            if (!string.IsNullOrWhiteSpace(githubUrl))
            {
                var (owner, repo, _, _, parseErr) = ParseRepo(githubUrl);
                if (parseErr != null)
                {
                    result.RepoStatus = parseErr;
                    return result;
                }

                using var repoReq = CreateRequest($"https://api.github.com/repos/{owner}/{repo}", cleanToken);
                var repoResp = await _http.SendAsync(repoReq);

                if (repoResp.IsSuccessStatusCode)
                {
                    result.RepoAccessible = true;
                    result.RepoStatus = "Acessível e Autorizado";
                    result.Message = $"Token válido para @{result.Username}! Acesso confirmado ao repositório {owner}/{repo}.";
                    return result;
                }

                if (repoResp.Headers.TryGetValues("X-GitHub-SSO", out var ssoHeaders))
                {
                    result.SsoRequired = true;
                    result.SsoUrl = string.Join("; ", ssoHeaders);
                    result.RepoStatus = "SSO Não Autorizado";
                    result.Message = $"A organização '{owner}' exige autorização SAML/SSO para este token!";
                    result.Recommendation = $"Acesse github.com/settings/tokens, localize este token e clique no botão 'Configure SSO' ➔ 'Authorize' ao lado da organização '{owner}'.";
                    return result;
                }

                if (repoResp.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    result.RepoAccessible = false;
                    result.RepoStatus = "Não Encontrado (404)";

                    if (result.TokenType.Contains("Fine-grained"))
                    {
                        result.Message = $"O repositório '{owner}/{repo}' retornou 404 para o seu token Fine-grained.";
                        result.Recommendation = $"Ao gerar um token Fine-grained para a organização '{owner}', o campo 'Resource Owner' deve ser selecionado como a organização '{owner}' (não seu usuário pessoal) e com permissão 'Contents: Read-only'. Ou prefira gerar um token Classic (ghp_) com escopo '[x] repo'.";
                    }
                    else if (!result.Scopes.Contains("repo"))
                    {
                        result.Message = $"O token Classic do usuário @{result.Username} NÃO tem a permissão 'repo' para ler repositórios privados.";
                        result.Recommendation = "Gere um novo Personal Access Token (Classic) marcando obrigatoriamente a caixinha '[x] repo' (Full control of private repositories).";
                    }
                    else
                    {
                        result.Message = $"O repositório '{owner}/{repo}' retornou 404 para a conta @{result.Username}.";
                        result.Recommendation = $"Verifique se sua conta @{result.Username} é membro da organização '{owner}' com permissão de leitura no repositório '{repo}'. Se a organização usa SSO, clique em 'Configure SSO' no GitHub para autorizar.";
                    }
                    return result;
                }

                if (repoResp.StatusCode == System.Net.HttpStatusCode.Forbidden)
                {
                    result.RepoAccessible = false;
                    result.RepoStatus = "Acesso Negado (403)";
                    result.Message = $"Acesso negado pelo GitHub (403 Forbidden).";
                    result.Recommendation = "Verifique as políticas de segurança da organização.";
                    return result;
                }

                result.RepoStatus = $"Status HTTP {(int)repoResp.StatusCode}";
            }
            else
            {
                result.Message = $"Token válido para @{result.Username}!";
            }
        }
        catch (Exception ex)
        {
            result.Valid = false;
            result.Message = $"Erro ao validar token: {ex.Message}";
        }

        return result;
    }

    private HttpRequestMessage CreateRequest(string url, string? token = null)
    {
        var req = new HttpRequestMessage(HttpMethod.Get, url);
        req.Headers.UserAgent.Add(new ProductInfoHeaderValue("QaAgent-Platform", "1.0"));
        req.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.github.v3+json"));

        var effectiveToken = !string.IsNullOrWhiteSpace(token)
            ? token.Trim()
            : (_config["GitHub:Token"] ?? Environment.GetEnvironmentVariable("GITHUB_TOKEN"));

        if (!string.IsNullOrWhiteSpace(effectiveToken))
        {
            if (effectiveToken.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                effectiveToken = effectiveToken["Bearer ".Length..].Trim();
            else if (effectiveToken.StartsWith("token ", StringComparison.OrdinalIgnoreCase))
                effectiveToken = effectiveToken["token ".Length..].Trim();

            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", effectiveToken);
        }

        return req;
    }

    private static string Indent(string text, string indent)
    {
        var lines = text.Split('\n');
        return string.Join("\n", lines.Select(l => indent + l));
    }

    private static string Trunc(string s, int max) => s.Length <= max ? s : s[..max] + "...";
}
