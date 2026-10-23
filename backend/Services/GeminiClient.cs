using System.Text;
using System.Text.Json;

namespace QaAgent.Api.Services;

/// <summary>
/// Cliente HTTP otimizado para a API do Gemini com memorização do modelo mais rápido
/// e fallback sem desperdício de chamadas.
/// </summary>
public class GeminiClient
{
    private readonly HttpClient _http;
    private readonly IConfiguration _config;
    private readonly ILogger<GeminiClient> _logger;
    private volatile string? _preferredModel;
    private readonly HashSet<string> _disabledModels = new(StringComparer.OrdinalIgnoreCase);

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

        var configured = (_config["Gemini:Models"] ?? "gemini-3.5-flash-lite,gemini-3.5-flash")
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        // Se já temos um modelo que respondeu com sucesso, prioriza-o
        var models = new List<string>();
        if (!string.IsNullOrEmpty(_preferredModel) && !_disabledModels.Contains(_preferredModel))
            models.Add(_preferredModel);

        foreach (var m in configured)
        {
            if (!models.Contains(m, StringComparer.OrdinalIgnoreCase) && !_disabledModels.Contains(m))
                models.Add(m);
        }

        if (models.Count == 0)
        {
            _disabledModels.Clear();
            models.AddRange(configured);
        }

        var body = JsonSerializer.Serialize(new
        {
            systemInstruction = new { parts = new[] { new { text = systemPrompt } } },
            contents = new[] { new { role = "user", parts = new[] { new { text = userPrompt } } } },
            generationConfig = new { temperature, responseMimeType = "application/json" }
        });

        string lastError = "sem resposta";
        for (int attempt = 0; attempt < 2; attempt++)
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

                        if (status == 404)
                        {
                            _disabledModels.Add(model); // Não tenta mais esse modelo na sessão
                        }

                        if (log != null && status != 404) 
                            await log($"   (Gemini {lastError}, tentando alternativa...)");

                        if (status == 429)
                        {
                            await Task.Delay(1500); // pequeno respiro em rate limit
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

                    // Memoriza o modelo que funcionou para próximas chamadas irem direto nele
                    _preferredModel = model;
                    return (StripFences(sb.ToString()), model, null);
                }
                catch (Exception ex)
                {
                    lastError = $"{model}: {ex.Message}";
                    _logger.LogWarning(ex, "Falha ao chamar Gemini {Model}", model);
                }
            }
            await Task.Delay(1000);
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
