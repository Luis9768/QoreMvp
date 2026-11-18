using System.Collections.Concurrent;
using System.Text;
using System.Text.Json;

namespace QaAgent.Api.Services;

/// <summary>
/// Cliente HTTP otimizado para a API do Gemini com memorização do modelo mais rápido,
/// cooldown automático em picos HTTP 503/429 e cadeia multi-modelo de fallback.
/// </summary>
public class GeminiClient
{
    private readonly HttpClient _http;
    private readonly IConfiguration _config;
    private readonly ILogger<GeminiClient> _logger;
    private static volatile string? _preferredModel;
    private static readonly ConcurrentDictionary<string, byte> _disabledModels = new(StringComparer.OrdinalIgnoreCase);
    private static readonly ConcurrentDictionary<string, DateTime> _cooldownUntil = new(StringComparer.OrdinalIgnoreCase);

    private static readonly string[] DefaultFallbackChain =
    {
        "gemini-3.5-flash-lite",
        "gemini-3.5-flash",
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite",
        "gemini-3.5-pro",
        "gemini-2.0-flash"
    };

    public GeminiClient(HttpClient http, IConfiguration config, ILogger<GeminiClient> logger)
    {
        _http = http;
        _config = config;
        _logger = logger;
    }

    public async Task<(string? Json, string? Model, string? Error)> GenerateJsonAsync(
        string systemPrompt,
        string userPrompt,
        Func<string, Task>? log = null,
        double temperature = 0.1)
    {
        var apiKey = _config["Gemini:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey) || apiKey.Equals("YOUR_GEMINI_API_KEY_HERE", StringComparison.OrdinalIgnoreCase))
        {
            apiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY");
        }
        if (string.IsNullOrWhiteSpace(apiKey) || apiKey.Equals("YOUR_GEMINI_API_KEY_HERE", StringComparison.OrdinalIgnoreCase))
            return (null, null, "Gemini:ApiKey não configurada no appsettings.local.json ou variável de ambiente GEMINI_API_KEY.");

        var configured = (_config["Gemini:Models"] ?? string.Join(",", DefaultFallbackChain))
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        var allCandidates = configured
            .Concat(DefaultFallbackChain)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var now = DateTime.UtcNow;
        var models = new List<string>();
        var coolingDown = new List<string>();

        if (!string.IsNullOrEmpty(_preferredModel) &&
            !_disabledModels.ContainsKey(_preferredModel) &&
            (!_cooldownUntil.TryGetValue(_preferredModel, out var prefUntil) || prefUntil <= now))
        {
            models.Add(_preferredModel);
        }

        foreach (var m in allCandidates)
        {
            if (_disabledModels.ContainsKey(m) || models.Contains(m, StringComparer.OrdinalIgnoreCase))
                continue;

            if (_cooldownUntil.TryGetValue(m, out var until) && until > now)
                coolingDown.Add(m);
            else
                models.Add(m);
        }

        // Adiciona os modelos em cooldown ao final da fila caso todos os principais estejam ocupados
        foreach (var m in coolingDown)
        {
            if (!models.Contains(m, StringComparer.OrdinalIgnoreCase))
                models.Add(m);
        }

        if (models.Count == 0)
        {
            _disabledModels.Clear();
            _cooldownUntil.Clear();
            models.AddRange(allCandidates);
        }

        var body = JsonSerializer.Serialize(new
        {
            systemInstruction = new { parts = new[] { new { text = systemPrompt } } },
            contents = new[] { new { role = "user", parts = new[] { new { text = userPrompt } } } },
            generationConfig = new { temperature, responseMimeType = "application/json" }
        });

        string lastError = "sem resposta";
        for (int attempt = 0; attempt < 3; attempt++)
        {
            foreach (var model in models)
            {
                try
                {
                    var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";
                    using var req = new HttpRequestMessage(HttpMethod.Post, url)
                    {
                        Content = new StringContent(body, Encoding.UTF8, "application/json")
                    };
                    using var resp = await _http.SendAsync(req);
                    var text = await resp.Content.ReadAsStringAsync();

                    if (!resp.IsSuccessStatusCode)
                    {
                        var status = (int)resp.StatusCode;
                        lastError = $"{model} retornou HTTP {status}";
                        _logger.LogWarning("Gemini {Model} HTTP {Status}: {Body}", model, status, Truncate(text, 200));

                        if (status == 404 || status == 400)
                        {
                            _disabledModels.TryAdd(model, 1); // Modelo inexistente/incompatível na conta
                        }
                        else if (status == 503 || status == 429 || status == 500 || status == 502 || status == 504)
                        {
                            // Coloca o modelo congestionado em cooldown curto (40s) para priorizar modelos livres
                            _cooldownUntil[model] = DateTime.UtcNow.AddSeconds(40);
                            if (string.Equals(_preferredModel, model, StringComparison.OrdinalIgnoreCase))
                                _preferredModel = null;
                        }

                        if (log != null && status != 404)
                            await log($"   (Gemini {lastError}, alternando automaticamente para outro modelo...)");

                        if (status == 429 || status == 503)
                        {
                            await Task.Delay(350);
                        }
                        continue;
                    }

                    using var doc = JsonDocument.Parse(text);
                    var parts = doc.RootElement.GetProperty("candidates")[0].GetProperty("content").GetProperty("parts");
                    var sb = new StringBuilder();
                    foreach (var p in parts.EnumerateArray())
                    {
                        if (p.TryGetProperty("thought", out var th) && th.ValueKind == JsonValueKind.True) continue;
                        if (p.TryGetProperty("text", out var t)) sb.Append(t.GetString());
                    }

                    _cooldownUntil.TryRemove(model, out _);
                    _preferredModel = model;
                    return (StripFences(sb.ToString()), model, null);
                }
                catch (Exception ex)
                {
                    lastError = $"{model}: {ex.Message}";
                    _logger.LogWarning(ex, "Falha ao chamar Gemini {Model}", model);
                }
            }
            await Task.Delay(800 * (attempt + 1));
        }
        return (null, null, lastError);
    }

    private static string StripFences(string s)
    {
        s = s.Trim();
        if (s.StartsWith("```"))
        {
            var firstNl = s.IndexOf('\n');
            if (firstNl > 0) s = s[(firstNl + 1)..];
            if (s.EndsWith("```")) s = s[..^3];
        }
        return s.Trim();
    }

    private static string Truncate(string s, int max) => s.Length <= max ? s : s[..max] + "...";
}
