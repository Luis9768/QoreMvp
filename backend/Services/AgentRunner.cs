using System.Diagnostics;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Playwright;
using QaAgent.Api.Data;
using QaAgent.Api.Models;

namespace QaAgent.Api.Services;

/// <summary>
/// Executa o plano de teste em navegador real (Playwright) com ações em lote (batch),
/// suporte completo a testes negativos e positivos, e modelo ultra-rápido do Gemini.
/// </summary>
public class AgentRunner
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IConfiguration _config;
    private readonly ILogger<AgentRunner> _logger;
    private readonly IWebHostEnvironment _env;

    private const int MaxRoundsPerStep = 4;

    public AgentRunner(IServiceScopeFactory scopeFactory, IConfiguration config, ILogger<AgentRunner> logger, IWebHostEnvironment env)
    {
        _scopeFactory = scopeFactory;
        _config = config;
        _logger = logger;
        _env = env;
    }

    public async Task<int> StartAsync(ExecuteRequestDto req)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<QaDbContext>();

        var exec = new TestExecution
        {
            TargetUrl = req.TargetUrl,
            TestPlanId = req.TestPlanId,
            Prompt = req.Prompt ?? string.Empty,
            Status = "Running",
            StartedAt = DateTime.UtcNow,
            TotalSteps = req.Steps.Count,
            TotalCriteriosMinimos = req.Steps.Count(s => s.CriterioMinimo)
        };
        int n = 1;
        foreach (var s in req.Steps)
        {
            var minList = s.CriteriosMinimos != null && s.CriteriosMinimos.Count > 0
                ? s.CriteriosMinimos.Where(c => !string.IsNullOrWhiteSpace(c)).Select(c => c.Trim()).ToList()
                : (!string.IsNullOrWhiteSpace(s.CriterioMinimoDescricao) ? new List<string> { s.CriterioMinimoDescricao.Trim() } : new List<string>());

            if (minList.Count == 0 && !string.IsNullOrWhiteSpace(s.ResultadoEsperado))
            {
                minList.Add(s.ResultadoEsperado.Trim());
            }

            var minDesc = minList.Count > 0 ? string.Join(" | ", minList) : s.ResultadoEsperado;
            var minJson = System.Text.Json.JsonSerializer.Serialize(minList);

            exec.Steps.Add(new TestStepExecution
            {
                StepNumber = n++,
                Codigo = string.IsNullOrWhiteSpace(s.Codigo) ? $"TC-{(n - 1):D2}" : s.Codigo,
                StepTitle = s.Titulo,
                Descricao = s.Descricao,
                Action = s.Acao,
                Tipo = s.Tipo ?? "Funcional",
                Tecnica = s.Tecnica ?? "ISTQB",
                Prioridade = s.Prioridade ?? "Alta",
                PreCondicao = s.PreCondicao,
                DadosTeste = s.DadosTeste,
                ResultadoEsperado = s.ResultadoEsperado,
                CriterioMinimo = s.CriterioMinimo,
                CriterioMinimoDescricao = minDesc,
                CriteriosMinimosJson = minJson,
                Status = "Pending"
            });
        }
        db.TestExecutions.Add(exec);
        await db.SaveChangesAsync();

        var id = exec.Id;
        _ = Task.Run(() => RunAsync(id, req));
        return id;
    }

    private async Task RunAsync(int id, ExecuteRequestDto req)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<QaDbContext>();
        var gemini = scope.ServiceProvider.GetRequiredService<GeminiClient>();
        var exec = await db.TestExecutions.Include(e => e.Steps).FirstAsync(e => e.Id == id);

        var logBuffer = new StringBuilder();
        async Task Log(string msg)
        {
            _logger.LogInformation("[Execução {Id}] {Msg}", id, msg);
            logBuffer.AppendLine($"[{DateTime.Now:HH:mm:ss}] {msg}");
            exec.Logs = logBuffer.ToString();
            await db.SaveChangesAsync();
        }

        var evidenceDir = Path.Combine(_env.ContentRootPath, "wwwroot", "evidencias", id.ToString());
        Directory.CreateDirectory(evidenceDir);
        var data = TestData.Create();

        IPlaywright? pw = null;
        IBrowser? browser = null;
        IBrowserContext? ctx = null;
        IPage? page = null;

        try
        {
            await Log($"Iniciando Chromium (headless={req.Headless})...");
            pw = await Playwright.CreateAsync();
            var launch = new BrowserTypeLaunchOptions
            {
                Headless = req.Headless,
                SlowMo = 70, // 70ms garante composição fluida de frames no vídeo WebM sem degradar performance
                Args = new[]
                {
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--ignore-certificate-errors",
                    "--disable-features=NetworkServiceSandbox",
                    "--disable-web-security"
                }
            };
            var chrome = _config["Playwright:ChromePath"] ?? @"C:\Program Files\Google\Chrome\Application\chrome.exe";
            if (File.Exists(chrome)) launch.ExecutablePath = chrome;
            browser = await pw.Chromium.LaunchAsync(launch);

            ctx = await browser.NewContextAsync(new BrowserNewContextOptions
            {
                RecordVideoDir = evidenceDir,
                RecordVideoSize = new RecordVideoSize { Width = 1280, Height = 720 },
                ViewportSize = new ViewportSize { Width = 1280, Height = 720 },
                IgnoreHTTPSErrors = true
            });
            await ctx.AddInitScriptAsync(VisualHudAndRippleJs);
            page = await ctx.NewPageAsync();

            // Rastreia abas ativas/popups (ex: target="_blank" abrindo Google Maps ou rota externa)
            var activePage = page;
            ctx.Page += (_, p) => { activePage = p; };

            await Log($"Abrindo {req.TargetUrl}");
            try
            {
                await page.GotoAsync(req.TargetUrl, new PageGotoOptions { WaitUntil = WaitUntilState.DOMContentLoaded, Timeout = 30000 });
            }
            catch (Exception ex)
            {
                await Log($"   Reconectando a {req.TargetUrl} ({ex.Message.Split('\n')[0]})...");
                await Task.Delay(1500);
                await page.GotoAsync(req.TargetUrl, new PageGotoOptions { WaitUntil = WaitUntilState.DOMContentLoaded, Timeout = 30000 });
            }

            await EnsureVisualEngineAsync(page);

            await Log($"Dados de teste gerados: e-mail {data.Email} | CPF {data.Cpf}");

            var history = new List<string>();

            foreach (var step in exec.Steps.OrderBy(s => s.StepNumber))
            {
                // Verifica se a página ainda está aberta e viva
                if (page.IsClosed)
                {
                    step.Status = "Skipped";
                    step.ErrorDetails = "Navegador foi fechado";
                    continue;
                }

                await EnsureVisualEngineAsync(page);

                var codeTag = string.IsNullOrWhiteSpace(step.Codigo) ? $"TC-{step.StepNumber:D2}" : step.Codigo;
                step.Status = "Running";
                await Log($"▶ [{codeTag}] Passo {step.StepNumber}/{exec.TotalSteps} ({step.Tipo ?? "Funcional"} | {step.Prioridade ?? "Alta"} | {step.Tecnica ?? "ISTQB"}): {step.StepTitle}");
                if (!string.IsNullOrWhiteSpace(step.PreCondicao)) await Log($"   📌 Pré-condição: {step.PreCondicao}");
                if (!string.IsNullOrWhiteSpace(step.DadosTeste)) await Log($"   📋 Dados de Teste: {step.DadosTeste}");
                if (!string.IsNullOrWhiteSpace(step.ResultadoEsperado)) await Log($"   🎯 Critério de Aceite: {step.ResultadoEsperado}");
                
                try
                {
                    await page.EvaluateAsync("([t, s, st]) => window.__qa_set_hud && window.__qa_set_hud(t, s, st)",
                        new object[] { $"{codeTag}: {step.StepTitle}", "IA analisando a tela e planejando...", "thinking" });
                }
                catch { }

                var sw = Stopwatch.StartNew();
                var (ok, reason, actions, decision) = await RunStepAsync(page, step, exec, data, history, gemini, Log);
                sw.Stop();

                if (ok)
                {
                    try
                    {
                        await page.EvaluateAsync("([t, s, st]) => window.__qa_set_hud && window.__qa_set_hud(t, s, st)",
                            new object[] { $"✔ {codeTag} Aprovado", reason, "success" });
                    }
                    catch { }

                    // Se a IA indicou o elemento que comprova o assert, rola até ele e destaca em verde neon
                    if (decision?.ElementoValidado.HasValue == true)
                    {
                        var idx = decision.ElementoValidado.Value;
                        try
                        {
                            var loc = page.Locator($"[data-qa-idx=\"{idx}\"]").First;
                            if (await loc.CountAsync() > 0)
                            {
                                await loc.ScrollIntoViewIfNeededAsync(new() { Timeout = 2000 });
                                var box = await loc.BoundingBoxAsync();
                                if (box != null)
                                {
                                    var cx = box.X + box.Width / 2;
                                    var cy = box.Y + box.Height / 2;
                                    await page.EvaluateAsync("([x, y, idx, label]) => { " +
                                        "window.__qa_move_cursor && window.__qa_move_cursor(x, y, label); " +
                                        "const el = document.querySelector(`[data-qa-idx=\"${idx}\"]`); " +
                                        "if (el) window.__qa_highlight && window.__qa_highlight(el, 'success'); " +
                                        "}", new object[] { cx, cy, idx, "✔ VALIDADO" });
                                    await Task.Delay(400);
                                }
                            }
                        }
                        catch { }
                    }
                    else if (actions == 0)
                    {
                        // Validação pura sem ações de clique/digitação: localiza no texto o critério esperado ou o texto citado pela IA e destaca
                        try
                        {
                            await page.EvaluateAsync(@"([crit, reason]) => {
                                const elements = Array.from(document.querySelectorAll('address, [class*=""address""], [class*=""location""], footer, p, h1, h2, h3, h4, h5, span, a, div, [class*=""badge""]'));
                                
                                // 1. Tenta extrair texto entre aspas ou parênteses do motivo fornecido pela IA (ex: 'R. Gertrudes de Lima' ou (R. Gertrudes...))
                                const match = (reason || '').match(/['""\(]([^'""\(\)]{4,80})['""\)]/);
                                const targetQuote = match ? match[1].trim().toLowerCase() : '';
                                if (targetQuote) {
                                    for (const el of elements) {
                                        const t = (el.innerText || '').trim().toLowerCase();
                                        if (t.length > 5 && (t.includes(targetQuote) || targetQuote.includes(t.slice(0, 30)))) {
                                            el.scrollIntoView({ behavior: 'auto', block: 'center' });
                                            window.__qa_highlight && window.__qa_highlight(el, 'success');
                                            const r = el.getBoundingClientRect();
                                            window.__qa_move_cursor && window.__qa_move_cursor(r.left + r.width/2, r.top + r.height/2, '✔ VALIDADO');
                                            return;
                                        }
                                    }
                                }

                                // 2. Tenta encontrar por palavras-chave relevantes do critério de aceite
                                const words = (crit || '').toLowerCase().replace(/[^a-z0-9áéíóúãõâêîôûç\s]/gi, ' ').split(/\s+/).filter(w => w.length >= 4);
                                for (const el of elements) {
                                    const t = (el.innerText || '').trim().toLowerCase();
                                    if (t.length > 6 && t.length < 200 && words.some(w => t.includes(w))) {
                                        el.scrollIntoView({ behavior: 'auto', block: 'center' });
                                        window.__qa_highlight && window.__qa_highlight(el, 'success');
                                        const r = el.getBoundingClientRect();
                                        window.__qa_move_cursor && window.__qa_move_cursor(r.left + r.width/2, r.top + r.height/2, '✔ VALIDADO');
                                        return;
                                    }
                                }
                            }", new object[] { step.ResultadoEsperado ?? step.StepTitle, reason });
                            await Task.Delay(500);
                        }
                        catch { }
                    }
                    else
                    {
                        await Task.Delay(350);
                    }
                }

                var shotName = $"passo_{step.StepNumber}.png";
                var targetShotPage = (activePage != null && !activePage.IsClosed) ? activePage : page;
                try
                {
                    if (targetShotPage != page)
                    {
                        await Log($"   Aba externa detectada ({targetShotPage.Url}). Capturando evidência na nova aba...");
                        try { await targetShotPage.WaitForLoadStateAsync(LoadState.DOMContentLoaded, new() { Timeout = 4000 }); } catch { }
                        await targetShotPage.WaitForTimeoutAsync(500);
                    }

                    await targetShotPage.ScreenshotAsync(new PageScreenshotOptions { Path = Path.Combine(evidenceDir, shotName) });
                    step.ScreenshotFileName = shotName;
                    step.ScreenshotUrl = $"/evidencias/{id}/{shotName}";
                }
                catch (Exception ex)
                {
                    await Log($"   Não foi possível tirar o print: {ex.Message}");
                }
                finally
                {
                    // Se abriu uma nova aba externa (ex: Google Maps), fecha e retorna o foco à página de teste
                    if (targetShotPage != page && !targetShotPage.IsClosed)
                    {
                        try { await targetShotPage.CloseAsync(); } catch { }
                        activePage = page;
                        try { await page.BringToFrontAsync(); } catch { }
                    }
                }

                step.DurationMs = sw.ElapsedMilliseconds;
                step.ActionsCount = actions;
                step.Status = ok ? "Passed" : "Failed";
                step.ErrorDetails = ok ? null : reason;

                if (ok) exec.PassedSteps++;
                else exec.FailedSteps++;

                await Log(ok
                    ? $"✔ Passo {step.StepNumber} aprovado: {reason}"
                    : $"✖ Passo {step.StepNumber} com falha: {reason}");

                // NÃO aborta a suíte inteira! Permite testar os passos seguintes caso a página continue utilizável
            }

            var minSteps = exec.Steps.Where(s => s.CriterioMinimo).ToList();
            exec.TotalCriteriosMinimos = minSteps.Count;
            exec.PassedCriteriosMinimos = minSteps.Count(s => s.Status == "Passed");
            exec.FailedCriteriosMinimos = minSteps.Count(s => s.Status == "Failed");

            bool allMinPassed = minSteps.Count > 0
                ? exec.PassedCriteriosMinimos == minSteps.Count
                : (exec.FailedSteps == 0);
            exec.CriteriosMinimosAtingidos = allMinPassed;

            if (exec.FailedSteps == 0 && exec.PassedSteps == exec.TotalSteps)
            {
                exec.Status = "Passed";
                await Log($"\n🏆 SUÍTE APROVADA COM EXCELÊNCIA: 100% dos testes passaram com sucesso ({exec.PassedSteps}/{exec.TotalSteps})!");
            }
            else if (allMinPassed)
            {
                exec.Status = "PassedWithWarnings";
                await Log($"\n⚡ APROVADO COM RESSALVAS (CRITÉRIOS MÍNIMOS ATINGIDOS): 100% dos Critérios Mínimos de Aceitação ({exec.PassedCriteriosMinimos}/{exec.TotalCriteriosMinimos}) foram ATENDIDOS com sucesso! Houve {exec.FailedSteps} falha(s) secundária(s) não-bloqueante(s). Versão liberada para homologação / teste manual.");
            }
            else
            {
                exec.Status = "Failed";
                await Log($"\n🛑 SUÍTE REPROVADA (BLOQUEANTE): {exec.FailedCriteriosMinimos} de {exec.TotalCriteriosMinimos} Critério(s) Mínimo(s) de Aceitação falharam. Bloqueado para teste manual e release.");
            }
        }
        catch (Exception ex)
        {
            exec.Status = "Failed";
            exec.CriteriosMinimosAtingidos = false;
            foreach (var s in exec.Steps.Where(s => s.Status is "Pending" or "Running"))
            {
                s.ErrorDetails ??= s.Status == "Running" ? ex.Message : null;
                s.Status = s.Status == "Running" ? "Failed" : "Skipped";
            }
            await Log($"ERRO FATAL: {ex.Message}");
        }
        finally
        {
            try
            {
                if (ctx != null)
                {
                    // Mantém visualização final por 1.8s para gravar o desfecho completo no vídeo
                    try { await Task.Delay(1800); } catch { }
                    await ctx.CloseAsync(); // finaliza e grava o .webm
                    if (page?.Video != null)
                    {
                        var rawPath = await page.Video.PathAsync();
                        var dest = Path.Combine(evidenceDir, "video.webm");
                        if (File.Exists(rawPath) && !string.Equals(rawPath, dest, StringComparison.OrdinalIgnoreCase))
                            File.Move(rawPath, dest, true);
                        if (File.Exists(dest))
                        {
                            exec.VideoFileName = "video.webm";
                            exec.VideoUrl = $"/evidencias/{id}/video.webm";
                        }
                    }
                }
                if (browser != null) await browser.CloseAsync();
                pw?.Dispose();
            }
            catch (Exception ex)
            {
                logBuffer.AppendLine($"[{DateTime.Now:HH:mm:ss}] Erro ao finalizar navegador: {ex.Message}");
            }

            exec.FinishedAt = DateTime.UtcNow;
            await Log($"Execução finalizada: {exec.Status} ({exec.PassedSteps}/{exec.TotalSteps} passos aprovados)");
        }
    }

    private async Task<(bool Ok, string Reason, int Actions, StepBatchDecision? Decision)> RunStepAsync(
        IPage page,
        TestStepExecution step,
        TestExecution exec,
        TestData data,
        List<string> history,
        GeminiClient gemini,
        Func<string, Task> log)
    {
        int totalActionsCount = 0;
        var codeTag = string.IsNullOrWhiteSpace(step.Codigo) ? $"TC-{step.StepNumber:D2}" : step.Codigo;

        for (int round = 1; round <= MaxRoundsPerStep; round++)
        {
            try
            {
                await page.EvaluateAsync("([t, s, st]) => window.__qa_set_hud && window.__qa_set_hud(t, s, st)",
                    new object[] { $"{codeTag}: {step.StepTitle}", $"IA analisando a tela e decidindo... (Ciclo {round}/{MaxRoundsPerStep})", "thinking" });
            }
            catch { }

            var snapshot = await SnapshotAsync(page);
            var userPrompt = BuildPrompt(step, exec, data, history, snapshot);

            var (json, _, error) = await gemini.GenerateJsonAsync(AgentSystemPrompt, userPrompt, log, temperature: 0.1);
            if (json == null) return (false, $"IA indisponível: {error}", totalActionsCount, null);

            StepBatchDecision? decision = null;
            try
            {
                decision = JsonSerializer.Deserialize<StepBatchDecision>(json, JsonOpts);
            }
            catch
            {
                try
                {
                    var singleAct = JsonSerializer.Deserialize<AgentAction>(json, JsonOpts);
                    if (singleAct != null)
                    {
                        decision = new StepBatchDecision
                        {
                            Concluido = singleAct.Acao == "concluido",
                            Falhou = singleAct.Acao == "falhou",
                            Motivo = singleAct.Motivo,
                            Acoes = singleAct.Acao is not ("concluido" or "falhou") ? new List<AgentAction> { singleAct } : new()
                        };
                    }
                }
                catch
                {
                    await log($"   Resposta inválida da IA: {Trunc(json, 150)}");
                    continue;
                }
            }

            if (decision == null) continue;

            // Se a IA determinou conclusão antes ou durante
            if (decision.Concluido)
            {
                return (true, decision.Motivo ?? "objetivo do passo concluído", totalActionsCount, decision);
            }
            if (decision.Falhou)
            {
                return (false, decision.Motivo ?? "falha identificada pela IA", totalActionsCount, decision);
            }

            if (decision.Acoes == null || decision.Acoes.Count == 0)
            {
                return (true, decision.Motivo ?? "ações do passo finalizadas", totalActionsCount, decision);
            }

            // Executa o lote de ações no Playwright com feedback dinâmico visual e mouse virtual
            foreach (var act in decision.Acoes)
            {
                var acao = (act.Acao ?? "").Trim().ToLowerInvariant();
                if (acao is "concluido") return (true, act.Motivo ?? "objetivo concluído", totalActionsCount, decision);
                if (acao is "falhou") return (false, act.Motivo ?? "falha detectada", totalActionsCount, decision);

                await log($"   🤖 {acao}{(act.Indice.HasValue ? $" #{act.Indice}" : "")}{(string.IsNullOrEmpty(act.Valor) ? "" : $" \"{Trunc(act.Valor, 40)}\"")} — {act.Motivo}");

                try
                {
                    await page.EvaluateAsync("([t, s, st]) => window.__qa_set_hud && window.__qa_set_hud(t, s, st)",
                        new object[] { $"{codeTag}: {step.StepTitle}", $"{acao.ToUpper()} #{act.Indice}: {Trunc(act.Motivo ?? act.Valor ?? "", 35)}", "action" });
                }
                catch { }

                var result = await ExecuteActionAsync(page, act, acao, exec.TargetUrl);
                totalActionsCount++;
                history.Add($"[passo {step.StepNumber}] {acao} #{act.Indice} \"{Trunc(act.Valor ?? "", 30)}\" => {result}");

                if (result != "ok")
                {
                    await log($"   ⚠ {result}");
                }
            }

            // Aguarda a aplicação processar as ações
            try
            {
                await page.WaitForLoadStateAsync(LoadState.NetworkIdle, new PageWaitForLoadStateOptions { Timeout = 3000 });
            }
            catch { }
            await page.WaitForTimeoutAsync(400);

            // Se o lote de ações já encerrou o passo previsto pelo modelo
            if (decision.ConcluidoAposAcoes)
            {
                return (true, decision.Motivo ?? "lote de ações concluído com sucesso", totalActionsCount, decision);
            }
        }

        return (true, "Passo concluído após execução das ações", totalActionsCount, null);
    }

    private static async Task<string> ExecuteActionAsync(IPage page, AgentAction act, string acao, string baseUrl)
    {
        try
        {
            ILocator? loc = act.Indice.HasValue ? page.Locator($"[data-qa-idx=\"{act.Indice}\"]").First : null;

            switch (acao)
            {
                case "clicar":
                    if (loc == null) return "ação 'clicar' sem índice";
                    try { await loc.ScrollIntoViewIfNeededAsync(new() { Timeout = 2000 }); } catch { }
                    var box = await loc.BoundingBoxAsync();
                    if (box != null)
                    {
                        var cx = box.X + box.Width / 2;
                        var cy = box.Y + box.Height / 2;
                        await page.EvaluateAsync("([x, y, label]) => window.__qa_move_cursor && window.__qa_move_cursor(x, y, label)",
                            new object[] { cx, cy, $"Clicar: {Trunc(act.Motivo ?? "", 25)}" });
                        await Task.Delay(100);
                        await page.EvaluateAsync("([x, y]) => window.__qa_click_cursor && window.__qa_click_cursor(x, y)",
                            new object[] { cx, cy });
                    }
                    await loc.EvaluateAsync("el => window.__qa_highlight && window.__qa_highlight(el, 'action')");
                    await Task.Delay(100);
                    await loc.ClickAsync(new LocatorClickOptions { Timeout = 5000 });
                    // Aguarda estabilização pós-clique para re-renderização, modais e transições
                    await Task.Delay(450);
                    break;

                case "preencher":
                    if (loc == null) return "ação 'preencher' sem índice";
                    try { await loc.ScrollIntoViewIfNeededAsync(new() { Timeout = 2000 }); } catch { }
                    var fBox = await loc.BoundingBoxAsync();
                    if (fBox != null)
                    {
                        var cx = fBox.X + fBox.Width / 2;
                        var cy = fBox.Y + fBox.Height / 2;
                        await page.EvaluateAsync("([x, y, label]) => window.__qa_move_cursor && window.__qa_move_cursor(x, y, label)",
                            new object[] { cx, cy, $"Digitar: {Trunc(act.Valor ?? "", 20)}" });
                        await Task.Delay(80);
                    }
                    await loc.EvaluateAsync("el => window.__qa_highlight && window.__qa_highlight(el, 'action')");
                    var type = (await loc.GetAttributeAsync("type") ?? "").ToLowerInvariant();
                    if (type is "date" or "time" or "datetime-local" or "month")
                    {
                        await loc.EvaluateAsync(@"(el, v) => {
                            const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
                            if (setter) setter.call(el, v);
                            else el.value = v;
                            el.dispatchEvent(new Event('input', { bubbles: true }));
                            el.dispatchEvent(new Event('change', { bubbles: true }));
                        }", act.Valor ?? "");
                        await Task.Delay(300);
                    }
                    else
                    {
                        await loc.ClickAsync(new LocatorClickOptions { Timeout = 3000 });
                        await loc.FillAsync("");
                        var val = act.Valor ?? "";
                        if (!string.IsNullOrEmpty(val))
                        {
                            int delay = val.Length > 25 ? 18 : 28;
                            await loc.PressSequentiallyAsync(val, new LocatorPressSequentiallyOptions { Delay = delay, Timeout = 5000 });
                        }
                        await Task.Delay(250);
                    }
                    break;

                case "limpar":
                    if (loc != null)
                    {
                        try { await loc.ScrollIntoViewIfNeededAsync(new() { Timeout = 2000 }); } catch { }
                        await loc.EvaluateAsync("el => window.__qa_highlight && window.__qa_highlight(el, 'action')");
                        await loc.FillAsync("", new LocatorFillOptions { Timeout = 5000 });
                        await Task.Delay(150);
                    }
                    break;

                case "selecionar":
                    if (loc == null) return "ação 'selecionar' sem índice";
                    try { await loc.ScrollIntoViewIfNeededAsync(new() { Timeout = 2000 }); } catch { }
                    var sBox = await loc.BoundingBoxAsync();
                    if (sBox != null)
                    {
                        await page.EvaluateAsync("([x, y, label]) => window.__qa_move_cursor && window.__qa_move_cursor(x, y, label)",
                            new object[] { sBox.X + sBox.Width / 2, sBox.Y + sBox.Height / 2, $"Selecionar: {Trunc(act.Valor ?? "", 20)}" });
                    }
                    await loc.EvaluateAsync("el => window.__qa_highlight && window.__qa_highlight(el, 'action')");
                    await loc.SelectOptionAsync(act.Valor ?? "");
                    await Task.Delay(250);
                    break;

                case "pressionar":
                    if (loc != null) await loc.PressAsync(string.IsNullOrEmpty(act.Valor) ? "Enter" : act.Valor);
                    else await page.Keyboard.PressAsync(string.IsNullOrEmpty(act.Valor) ? "Enter" : act.Valor);
                    await Task.Delay(200);
                    break;

                case "navegar":
                    var url = new Uri(new Uri(baseUrl), string.IsNullOrEmpty(act.Valor) ? "/" : act.Valor).ToString();
                    await page.GotoAsync(url, new PageGotoOptions { Timeout = 20000, WaitUntil = WaitUntilState.DOMContentLoaded });
                    await Task.Delay(350);
                    break;

                case "aguardar":
                    var ms = int.TryParse(act.Valor, out var v) ? v : 1000;
                    await page.WaitForTimeoutAsync(Math.Clamp(ms, 100, 2000));
                    break;

                default:
                    return $"ação desconhecida '{acao}'";
            }

            return "ok";
        }
        catch (Exception ex)
        {
            return "erro: " + ex.Message.Split('\n')[0];
        }
    }

    private static async Task EnsureVisualEngineAsync(IPage page)
    {
        try
        {
            await page.EvaluateAsync(VisualHudAndRippleJs);
        }
        catch { }
    }

    private const string VisualHudAndRippleJs = @"() => {
        if (window.__qa_hud_installed) {
            if (typeof window.__qa_init_dom === 'function') window.__qa_init_dom();
            return;
        }
        window.__qa_hud_installed = true;

        const style = document.createElement('style');
        style.id = '__qa_visual_engine_styles';
        style.innerHTML = `
            /* Cursor Virtual com Efeito de Sombra e Movimento */
            #__qa_virtual_cursor {
                position: fixed;
                top: 0;
                left: 0;
                width: 24px;
                height: 24px;
                pointer-events: none;
                z-index: 2147483647;
                transform: translate(120px, 120px);
                transition: transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1), filter 0.15s ease;
                filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.7));
            }
            #__qa_virtual_cursor svg {
                width: 100%;
                height: 100%;
                fill: #9333ea;
                stroke: #ffffff;
                stroke-width: 1.5;
                filter: drop-shadow(0 0 3px rgba(147, 51, 234, 0.8));
            }
            #__qa_virtual_cursor.clicking svg {
                transform: scale(0.85);
                fill: #ef4444;
            }

            /* Tooltip flutuante do cursor */
            #__qa_cursor_tooltip {
                position: fixed;
                top: 0;
                left: 0;
                pointer-events: none;
                z-index: 2147483647;
                background: rgba(15, 23, 42, 0.92);
                color: #ffffff;
                border: 1px solid rgba(168, 85, 247, 0.7);
                padding: 3px 10px;
                border-radius: 8px;
                font-family: system-ui, -apple-system, sans-serif;
                font-size: 11px;
                font-weight: 600;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
                white-space: nowrap;
                opacity: 0;
                transform: translate(140px, 136px);
                transition: transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.2s ease;
            }
            #__qa_cursor_tooltip.visible {
                opacity: 1;
            }

            /* Efeito de Ondulação / Clique Realçado */
            .__qa_click_ripple {
                position: fixed;
                border-radius: 50%;
                background: radial-gradient(circle, rgba(168, 85, 247, 0.9) 0%, rgba(239, 68, 68, 0.7) 60%, transparent 100%);
                transform: translate(-50%, -50%) scale(0);
                pointer-events: none;
                z-index: 2147483646;
                animation: __qa_ripple 0.5s cubic-bezier(0, 0, 0.2, 1) forwards;
                box-shadow: 0 0 16px rgba(168, 85, 247, 0.9);
            }
            @keyframes __qa_ripple {
                0% { width: 10px; height: 10px; transform: translate(-50%, -50%) scale(1); opacity: 1; }
                100% { width: 68px; height: 68px; transform: translate(-50%, -50%) scale(1.9); opacity: 0; }
            }

            /* Destaque do Elemento em Ação */
            .__qa_action_highlight {
                outline: 3px solid #9333ea !important;
                outline-offset: 3px !important;
                box-shadow: 0 0 20px rgba(147, 51, 234, 0.85) !important;
                transition: outline 0.15s ease, box-shadow 0.15s ease !important;
                animation: __qa_pulse_action 1s infinite alternate;
            }
            @keyframes __qa_pulse_action {
                0% { outline-color: #9333ea; box-shadow: 0 0 12px rgba(147, 51, 234, 0.7); }
                100% { outline-color: #ec4899; box-shadow: 0 0 24px rgba(236, 72, 153, 0.9); }
            }

            /* Destaque de Validação Aprovada (Verde Neon) */
            .__qa_validation_highlight {
                outline: 3px solid #10b981 !important;
                outline-offset: 4px !important;
                box-shadow: 0 0 25px rgba(16, 185, 129, 0.9) !important;
                transition: all 0.2s ease !important;
                animation: __qa_pulse_valid 1.2s infinite alternate;
            }
            @keyframes __qa_pulse_valid {
                0% { outline-color: #10b981; box-shadow: 0 0 15px rgba(16, 185, 129, 0.7); }
                100% { outline-color: #34d399; box-shadow: 0 0 30px rgba(52, 211, 153, 0.95); }
            }

            /* HUD Principal Superior Flutuante */
            #__qa_hud_container {
                position: fixed;
                top: 12px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 2147483645;
                pointer-events: none;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 5px;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, sans-serif;
            }
            #__qa_hud {
                background: rgba(10, 15, 30, 0.94);
                border: 1.5px solid rgba(168, 85, 247, 0.6);
                backdrop-filter: blur(12px);
                color: #f8fafc;
                padding: 8px 20px;
                border-radius: 30px;
                font-size: 13px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 12px;
                box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6), 0 0 15px rgba(168, 85, 247, 0.25);
                transition: all 0.3s ease;
                max-width: 90vw;
            }
            #__qa_hud .badge {
                background: linear-gradient(135deg, #7c3aed, #4f46e5);
                color: #ffffff;
                font-size: 10px;
                font-weight: 800;
                padding: 2px 8px;
                border-radius: 12px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            #__qa_hud .status_icon {
                display: inline-block;
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background: #a855f7;
                box-shadow: 0 0 10px currentColor;
                animation: __qa_pulse 1.2s infinite ease-in-out;
            }
            #__qa_hud .status_icon.thinking {
                background: #f59e0b;
            }
            #__qa_hud .status_icon.success {
                background: #10b981;
            }
            #__qa_hud .status_icon.action {
                background: #ec4899;
            }
            #__qa_hud_sub {
                background: rgba(15, 23, 42, 0.9);
                border: 1px solid rgba(148, 163, 184, 0.25);
                color: #cbd5e1;
                font-size: 11px;
                font-weight: 500;
                padding: 3px 14px;
                border-radius: 14px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                transition: all 0.2s ease;
            }
            @keyframes __qa_pulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.45; transform: scale(0.8); }
            }
        `;

        const initDom = () => {
            if (!document.body) return;

            if (!document.getElementById('__qa_visual_engine_styles')) {
                (document.head || document.body).appendChild(style);
            }

            let hudContainer = document.getElementById('__qa_hud_container');
            if (!hudContainer) {
                hudContainer = document.createElement('div');
                hudContainer.id = '__qa_hud_container';
                hudContainer.innerHTML = `
                    <div id=""__qa_hud"">
                        <span class=""badge"">QA Bot</span>
                        <span class=""status_icon""></span>
                        <span id=""__qa_hud_title"">Iniciando teste E2E...</span>
                    </div>
                    <div id=""__qa_hud_sub"">Aguardando...</div>
                `;
                document.body.appendChild(hudContainer);
            } else if (hudContainer.parentElement !== document.body) {
                document.body.appendChild(hudContainer);
            }

            let cursor = document.getElementById('__qa_virtual_cursor');
            if (!cursor) {
                cursor = document.createElement('div');
                cursor.id = '__qa_virtual_cursor';
                cursor.innerHTML = `
                    <svg viewBox=""0 0 24 24"">
                        <path d=""M4 2l16 11-7.5 1.5L8 22 4 2z""/>
                    </svg>
                `;
                document.body.appendChild(cursor);
            } else if (cursor.parentElement !== document.body) {
                document.body.appendChild(cursor);
            }

            let tooltip = document.getElementById('__qa_cursor_tooltip');
            if (!tooltip) {
                tooltip = document.createElement('div');
                tooltip.id = '__qa_cursor_tooltip';
                document.body.appendChild(tooltip);
            } else if (tooltip.parentElement !== document.body) {
                document.body.appendChild(tooltip);
            }
        };

        window.__qa_init_dom = initDom;
        initDom();
        document.addEventListener('DOMContentLoaded', initDom);
        window.addEventListener('load', initDom);

        // Pulso contínuo para forçar o compositor do Chromium Headless a gravar frames no vídeo mesmo com a página ociosa
        let __qa_frame_tick = 0;
        setInterval(() => {
            initDom();
            const dot = document.querySelector('#__qa_hud .status_icon');
            if (dot) {
                __qa_frame_tick = (__qa_frame_tick + 15) % 360;
                dot.style.filter = `hue-rotate(${__qa_frame_tick}deg)`;
            }
        }, 120);

        window.__qa_move_cursor = (x, y, label) => {
            initDom();
            const cursor = document.getElementById('__qa_virtual_cursor');
            const tooltip = document.getElementById('__qa_cursor_tooltip');
            if (cursor) {
                cursor.style.transform = `translate(${x}px, ${y}px)`;
            }
            if (tooltip) {
                tooltip.style.transform = `translate(${x + 18}px, ${y + 16}px)`;
                if (label) {
                    tooltip.textContent = label;
                    tooltip.classList.add('visible');
                } else {
                    tooltip.classList.remove('visible');
                }
            }
        };

        window.__qa_click_cursor = (x, y) => {
            initDom();
            window.__qa_move_cursor(x, y);
            const cursor = document.getElementById('__qa_virtual_cursor');
            if (cursor) cursor.classList.add('clicking');
            
            const ripple = document.createElement('div');
            ripple.className = '__qa_click_ripple';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            (document.body || document.documentElement).appendChild(ripple);
            
            setTimeout(() => {
                if (cursor) cursor.classList.remove('clicking');
                ripple.remove();
            }, 500);
        };

        window.__qa_highlight = (elOrSelector, type, label) => {
            document.querySelectorAll('.__qa_action_highlight, .__qa_validation_highlight').forEach(e => {
                e.classList.remove('__qa_action_highlight', '__qa_validation_highlight');
            });
            const el = typeof elOrSelector === 'string' ? document.querySelector(elOrSelector) : elOrSelector;
            if (!el) return;
            const cls = type === 'success' ? '__qa_validation_highlight' : '__qa_action_highlight';
            el.classList.add(cls);
            setTimeout(() => el.classList.remove(cls), 2500);
        };

        window.__qa_set_hud = (title, subtext, status) => {
            initDom();
            const titleEl = document.getElementById('__qa_hud_title');
            const subEl = document.getElementById('__qa_hud_sub');
            const iconEl = document.querySelector('#__qa_hud .status_icon');
            const hud = document.getElementById('__qa_hud');

            if (titleEl && title) titleEl.textContent = title;
            if (subEl) {
                if (subtext) {
                    subEl.textContent = subtext;
                    subEl.style.display = 'block';
                } else {
                    subEl.style.display = 'none';
                }
            }
            if (iconEl) {
                iconEl.className = 'status_icon ' + (status || '');
            }
            if (hud) {
                if (status === 'success') {
                    hud.style.borderColor = 'rgba(16, 185, 129, 0.8)';
                } else if (status === 'thinking') {
                    hud.style.borderColor = 'rgba(245, 158, 11, 0.8)';
                } else if (status === 'action') {
                    hud.style.borderColor = 'rgba(236, 72, 153, 0.8)';
                } else {
                    hud.style.borderColor = 'rgba(168, 85, 247, 0.6)';
                }
            }
        };

        window.__qa_update_hud = (title, isDone) => {
            window.__qa_set_hud(title, isDone ? 'Passo finalizado com sucesso' : 'Em andamento', isDone ? 'success' : 'action');
        };
    };";

    private static async Task<string> SnapshotAsync(IPage page)
    {
        for (int i = 0; i < 3; i++)
        {
            try
            {
                return await page.EvaluateAsync<string>(SnapshotJs);
            }
            catch
            {
                await page.WaitForTimeoutAsync(300);
            }
        }
        return "{\"url\":\"" + page.Url + "\",\"elements\":[]}";
    }

    private static string BuildPrompt(TestStepExecution step, TestExecution exec, TestData data, List<string> history, string snapshot)
    {
        var hoje = DateTime.Today;
        var ontem = hoje.AddDays(-1);
        var amanha = hoje.AddDays(1);
        var daquiADoisDias = hoje.AddDays(2);

        var sb = new StringBuilder();
        sb.AppendLine($"OBJETIVO GERAL DO TESTE: {exec.Prompt}");
        if (!string.IsNullOrEmpty(step.Codigo)) sb.AppendLine($"CÓDIGO FORMAL DO CASO: {step.Codigo}");
        sb.AppendLine($"PASSO ATUAL ({step.StepNumber}/{exec.TotalSteps}): {step.StepTitle}");
        if (!string.IsNullOrEmpty(step.Tipo)) sb.AppendLine($"Categoria: {step.Tipo} | Prioridade: {step.Prioridade ?? "Alta"} | Técnica: {step.Tecnica ?? "ISTQB"}");
        if (!string.IsNullOrEmpty(step.PreCondicao)) sb.AppendLine($"Pré-condição exigida: {step.PreCondicao}");
        if (!string.IsNullOrEmpty(step.DadosTeste)) sb.AppendLine($"Dados de Teste Padronizados: {step.DadosTeste}");
        sb.AppendLine($"Descrição detalhada do passo: {step.Descricao}");
        if (!string.IsNullOrEmpty(step.ResultadoEsperado)) sb.AppendLine($"Critério de Aceite / Resultado Esperado: {step.ResultadoEsperado}");
        sb.AppendLine();
        sb.AppendLine("CALENDÁRIO & DATAS CALCULADAS (use para agendamentos):");
        sb.AppendLine($"- Data de ONTEM (dia anterior ao atual): {ontem:yyyy-MM-dd}");
        sb.AppendLine($"- Data de HOJE (dia atual): {hoje:yyyy-MM-dd}");
        sb.AppendLine($"- Data de AMANHÃ (dia seguinte ao atual): {amanha:yyyy-MM-dd}");
        sb.AppendLine($"- Data FUTURA (+2 dias): {daquiADoisDias:yyyy-MM-dd}");
        sb.AppendLine();
        sb.AppendLine("DADOS DISPONÍVEIS:");
        sb.AppendLine($"- Nome: {data.Nome} | E-mail gerado: {data.Email} | Senha gerada: {data.Senha}");
        sb.AppendLine($"- CPF: {data.Cpf} | Telefone: {data.Telefone} | Data Nasc: {data.Nascimento}");
        sb.AppendLine($"- Se o objetivo citar credenciais específicas (ex: lebron@email.com / afrokings), use-as!");
        sb.AppendLine();
        sb.AppendLine("HISTÓRICO RECENTE DE AÇÕES:");
        if (history.Count == 0) sb.AppendLine("(nenhuma)");
        foreach (var h in history.TakeLast(6)) sb.AppendLine(h);
        sb.AppendLine();
        sb.AppendLine("ELEMENTOS DA TELA (campos, botões e alertas):");
        sb.AppendLine(snapshot);
        return sb.ToString();
    }

    private const string AgentSystemPrompt = @"Você é um agente autônomo de testes E2E com Playwright.
Dado o PASSO ATUAL, a DESCRIÇÃO DO PASSO e os elementos na tela, responda com o lote de ações necessárias para realizar/completar o passo.

REGRAS CRÍTICAS PARA TESTES (NEGATIVOS E POSITIVOS):
1. TESTE NEGATIVO (Ex.: 'tentar login com dados inválidos e esperar erro' OU 'tentar agendar no passado e esperar bloqueio'):
   - O objetivo do teste é justamente CONFIRMAR que o sistema REJEITA a ação inválida!
   - Se a tela já exibir mensagem de erro, toast de credenciais incorretas, aviso de data inválida ou bloqueio: ISSO É SUCESSO DO TESTE! Responda ""concluido"": true com o motivo 'O sistema bloqueou a ação inválida e exibiu o erro esperado'.
   - Responda ""falhou"": true apenas se o sistema aceitar indevidamente dados inválidos ou se quebrar a aplicação (ex: tela branca/500).
   - Ao enviar dados inválidos para testar rejeição, deixe ""concluidoAposAcoes"": false para que na próxima rodada você possa inspecionar e confirmar a mensagem de erro ou bloqueio.

2. TESTE POSITIVO (Ex.: 'fazer login com credenciais válidas' OU 'agendar para amanhã'):
   - Responda ""concluido"": true quando o login for bem-sucedido ou quando o agendamento for confirmado.

3. FLUXOS E WIZARDS (Ex: Agendamento em etapas):
   - Se o passo requer escolher data/horário mas a tela ainda estiver na seleção de serviço ou barbeiro, selecione o primeiro serviço/barbeiro clicando no card correspondente e clique no botão de avançar.
   - Para agendamento em data futura, selecione a data de amanhã, clique em um botão de horário disponível (ex: 09:00, 10:00) e avance até a tela de confirmação.

4. PREENCHIMENTO RÁPIDO:
   - Se for um formulário (ex: login), você pode enviar todos os campos (e-mail, senha) e o clique de entrar no mesmo array 'acoes'.
   - Para inputs de data, use o formato AAAA-MM-DD das DATAS CALCULADAS fornecidas.

5. VALIDAÇÃO VISUAL & ASSERÇÕES DE DADOS (Ex: 'validar endereço na Navbar ou Seção de Localização', 'validar CEP', 'validar badge de status'):
   - Se o critério do passo for apenas constatar que um texto/informação está presente e correta na tela atual:
     - Responda ""concluido"": true com a explicação no ""motivo"".
     - OBRIGATÓRIO: preencha ""elementoValidado"": <indice 'i'> com o número do elemento que comprova a informação! O robô usará isso para rolar a tela até o elemento, apontar o mouse para ele, destacá-lo em verde e tirar o print evidenciando exatamente o elemento validado!

Responda ESTRITAMENTE em JSON:
{
  ""concluido"": false, // true se o objetivo do passo já foi atingido na tela atual
  ""concluidoAposAcoes"": false, // true APENAS se tiver certeza absoluta que não precisa inspecionar o resultado
  ""falhou"": false, // true se o sistema violou a regra de negócio esperada
  ""motivo"": ""explicação sucinta em português"",
  ""elementoValidado"": null, // índice numérico 'i' do elemento que comprova o assert/resultado (ex: 12)
  ""acoes"": [
    { ""acao"": ""preencher|clicar|limpar|selecionar|pressionar|navegar|aguardar"", ""indice"": 0, ""valor"": ""texto/data/url"", ""motivo"": ""curto"" }
  ]
}

Regras adicionais:
- Use os índices numéricos 'i' dos elementos fornecidos.
- 'navegar' aceita rotas relativas (ex: /admin ou /login).";

    // Snapshot otimizado: inclui elementos acionáveis, cards clicáveis, textos informativos (endereços, CEPs, badges) e alertas/toasts
    private const string SnapshotJs = @"() => {
        document.querySelectorAll('[data-qa-idx]').forEach(e => e.removeAttribute('data-qa-idx'));
        const isVisible = (el) => {
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) return false;
            const s = getComputedStyle(el);
            return s.visibility !== 'hidden' && s.display !== 'none' && s.opacity !== '0';
        };
        const targets = Array.from(document.querySelectorAll('input, button, a[href], select, textarea, [role=button], [role=tab], [role=menuitem], [role=alert], .alert, .toast, [class*=""error""], [class*=""danger""], [class*=""success""], [class*=""card""], [class*=""option""], [class*=""item""], [class*=""slot""], [class*=""address""], [class*=""badge""], [class*=""location""], p, h1, h2, h3, h4, h5, address'))
            .filter(isVisible);

        const elements = [];
        for (const el of targets) {
            if (elements.length >= 180) break;
            const tag = el.tagName.toLowerCase();
            const s = getComputedStyle(el);
            const txt = (el.innerText || el.value || el.getAttribute('aria-label') || el.getAttribute('placeholder') || '').replace(/\s+/g, ' ').trim();
            if (!txt && !['input', 'select', 'textarea'].includes(tag)) continue;
            // Ignora nós pais muito longos para focar em nós folha com o dado real
            if (txt.length > 150 && el.children.length > 2) continue;

            const i = elements.length;
            el.setAttribute('data-qa-idx', String(i));
            const item = { i, tag };
            if (el.getAttribute('type')) item.type = el.getAttribute('type');
            if (el.id) item.id = el.id;
            if (el.getAttribute('name')) item.name = el.getAttribute('name');
            if (el.disabled) item.disabled = true;
            if (txt) item.text = txt.slice(0, 90);
            elements.push(item);
        }
        const text = (document.body ? document.body.innerText : '').replace(/\s+/g, ' ').slice(0, 900);
        return JSON.stringify({ url: location.href, title: document.title, elements, text });
    }";

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true,
        NumberHandling = JsonNumberHandling.AllowReadingFromString
    };

    private static string Trunc(string s, int max) => s.Length <= max ? s : s[..max] + "...";

    private class StepBatchDecision
    {
        [JsonPropertyName("concluido")]
        public bool Concluido { get; set; }

        [JsonPropertyName("concluidoAposAcoes")]
        public bool ConcluidoAposAcoes { get; set; } = false;

        [JsonPropertyName("concluido_apos_acoes")]
        public bool ConcluidoAposAcoesSnake { set => ConcluidoAposAcoes = value; }

        [JsonPropertyName("falhou")]
        public bool Falhou { get; set; }

        [JsonPropertyName("motivo")]
        public string? Motivo { get; set; }

        [JsonPropertyName("elementoValidado")]
        public int? ElementoValidado { get; set; }

        [JsonPropertyName("elemento_validado")]
        public int? ElementoValidadoSnake { set => ElementoValidado = value; }

        [JsonPropertyName("acoes")]
        public List<AgentAction> Acoes { get; set; } = new();
    }

    private class AgentAction
    {
        public string? Acao { get; set; }
        public int? Indice { get; set; }
        public string? Valor { get; set; }
        public string? Motivo { get; set; }
    }
}

public record TestData(string Nome, string Email, string Senha, string Cpf, string Telefone, string Nascimento)
{
    public static TestData Create()
    {
        var ts = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        return new TestData("Usuario Teste QA", $"qa_{ts}@teste.com", "Teste@2026", GenerateCpf(), "(11) 98765-4321", "1995-05-20");
    }

    private static string GenerateCpf()
    {
        var n = Enumerable.Range(0, 9).Select(_ => Random.Shared.Next(10)).ToArray();
        int d1 = 11 - (n.Select((v, i) => v * (10 - i)).Sum() % 11);
        if (d1 >= 10) d1 = 0;
        int d2 = 11 - ((n.Select((v, i) => v * (11 - i)).Sum() + d1 * 2) % 11);
        if (d2 >= 10) d2 = 0;
        return $"{n[0]}{n[1]}{n[2]}.{n[3]}{n[4]}{n[5]}.{n[6]}{n[7]}{n[8]}-{d1}{d2}";
    }
}
