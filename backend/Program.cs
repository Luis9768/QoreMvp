using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using QaAgent.Api.Data;
using QaAgent.Api.Services;

// wwwroot precisa existir ANTES do builder, senão o ASP.NET não serve os prints/vídeos
Directory.CreateDirectory(Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "evidencias"));

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddJsonFile("appsettings.local.json", optional: true, reloadOnChange: true);

// 1. Serviços Web e Controllers
builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddHealthChecks();

// 2. Serviços da Plataforma QA e IA
builder.Services.AddHttpClient<GeminiClient>(c => c.Timeout = TimeSpan.FromSeconds(90));
builder.Services.AddHttpClient<GitHubService>(c => c.Timeout = TimeSpan.FromSeconds(30));
builder.Services.AddScoped<IGeminiPlannerService, GeminiPlannerService>();
builder.Services.AddSingleton<PlaywrightBootstrapService>();
builder.Services.AddSingleton<AgentRunner>();

// 3. Configuração do Banco de Dados (PostgreSQL no Docker com fallback inteligente)
var pgConnStrRaw = builder.Configuration.GetConnectionString("PostgresConnection") 
    ?? builder.Configuration["DATABASE_URL"]
    ?? "Host=localhost;Port=5432;Database=qaplatform_db;Username=postgres;Password=postgres";

// Suporte automático para URLs no formato URI do Easypanel (postgres://user:pass@host:port/db)
string pgConnStr;
if (pgConnStrRaw.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) || 
    pgConnStrRaw.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
{
    try
    {
        var uri = new Uri(pgConnStrRaw);
        var userInfo = uri.UserInfo.Split(':');
        var user = userInfo.Length > 0 ? Uri.UnescapeDataString(userInfo[0]) : "postgres";
        var pass = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";
        var db = uri.AbsolutePath.TrimStart('/');
        var port = uri.Port > 0 ? uri.Port : 5432;
        var host = uri.Host;

        pgConnStr = $"Host={host};Port={port};Database={db};Username={user};Password={pass};SSL Mode=Disable;Trust Server Certificate=true;";
    }
    catch
    {
        pgConnStr = pgConnStrRaw;
    }
}
else
{
    pgConnStr = pgConnStrRaw;
}

var sqliteConnStr = builder.Configuration.GetConnectionString("SqliteFallback") 
    ?? "Data Source=qaplatform_local.db";

bool usePostgres = false;
try
{
    using var testConn = new NpgsqlConnection(pgConnStr);
    testConn.Open();
    usePostgres = true;
    Console.WriteLine("[Database] Conexão com PostgreSQL no Docker estabelecida com sucesso!");
}
catch
{
    Console.WriteLine("[Database] PostgreSQL no Docker não está rodando no momento (porta 5432).");
    Console.WriteLine("[Database] Iniciando com SQLite local para o MVP funcionar imediatamente sem travamentos!");
    Console.WriteLine("[Database] Para usar o PostgreSQL, execute: docker compose up -d");
}

if (usePostgres)
{
    builder.Services.AddDbContext<QaDbContext>(options =>
        options.UseNpgsql(pgConnStr));
}
else
{
    builder.Services.AddDbContext<QaDbContext>(options =>
        options.UseSqlite(sqliteConnStr));
}

// 4. Configuração de CORS para o Next.js e Deploy no Easypanel
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowNextJs", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// 5. Garantir que o banco de dados e as tabelas estejam criados
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<QaDbContext>();
    db.Database.EnsureCreated();

    // Migrações dinâmicas seguras (só executa se a coluna não existir, compatível com Postgres e SQLite)
    if (usePostgres)
    {
        try { db.Database.ExecuteSqlRaw("ALTER TABLE \"TestStepExecutions\" ADD COLUMN IF NOT EXISTS \"Tipo\" TEXT;"); } catch { }
        try { db.Database.ExecuteSqlRaw("ALTER TABLE \"TestStepExecutions\" ADD COLUMN IF NOT EXISTS \"Prioridade\" TEXT;"); } catch { }
        try { db.Database.ExecuteSqlRaw("ALTER TABLE \"TestStepExecutions\" ADD COLUMN IF NOT EXISTS \"PreCondicao\" TEXT;"); } catch { }
        try { db.Database.ExecuteSqlRaw("ALTER TABLE \"TestStepExecutions\" ADD COLUMN IF NOT EXISTS \"ResultadoEsperado\" TEXT;"); } catch { }
        try { db.Database.ExecuteSqlRaw("ALTER TABLE \"TestStepExecutions\" ADD COLUMN IF NOT EXISTS \"Codigo\" TEXT;"); } catch { }
        try { db.Database.ExecuteSqlRaw("ALTER TABLE \"TestStepExecutions\" ADD COLUMN IF NOT EXISTS \"Tecnica\" TEXT;"); } catch { }
        try { db.Database.ExecuteSqlRaw("ALTER TABLE \"TestStepExecutions\" ADD COLUMN IF NOT EXISTS \"DadosTeste\" TEXT;"); } catch { }
        try { db.Database.ExecuteSqlRaw("ALTER TABLE \"TestStepExecutions\" ADD COLUMN IF NOT EXISTS \"CriterioMinimo\" BOOLEAN DEFAULT TRUE;"); } catch { }
        try { db.Database.ExecuteSqlRaw("ALTER TABLE \"TestStepExecutions\" ADD COLUMN IF NOT EXISTS \"CriterioMinimoDescricao\" TEXT;"); } catch { }
        try { db.Database.ExecuteSqlRaw("ALTER TABLE \"TestStepExecutions\" ADD COLUMN IF NOT EXISTS \"CriteriosMinimosJson\" TEXT;"); } catch { }
        try { db.Database.ExecuteSqlRaw("ALTER TABLE \"TestStepExecutions\" ADD COLUMN IF NOT EXISTS \"ExecutedActions\" TEXT;"); } catch { }
        try { db.Database.ExecuteSqlRaw("ALTER TABLE \"TestStepExecutions\" ADD COLUMN IF NOT EXISTS \"VisitedUrl\" TEXT;"); } catch { }
        try { db.Database.ExecuteSqlRaw("ALTER TABLE \"TestExecutions\" ADD COLUMN IF NOT EXISTS \"InitialScreenshotUrl\" TEXT;"); } catch { }
        try { db.Database.ExecuteSqlRaw("ALTER TABLE \"TestExecutions\" ADD COLUMN IF NOT EXISTS \"TotalCriteriosMinimos\" INTEGER DEFAULT 0;"); } catch { }
        try { db.Database.ExecuteSqlRaw("ALTER TABLE \"TestExecutions\" ADD COLUMN IF NOT EXISTS \"PassedCriteriosMinimos\" INTEGER DEFAULT 0;"); } catch { }
        try { db.Database.ExecuteSqlRaw("ALTER TABLE \"TestExecutions\" ADD COLUMN IF NOT EXISTS \"FailedCriteriosMinimos\" INTEGER DEFAULT 0;"); } catch { }
        try { db.Database.ExecuteSqlRaw("ALTER TABLE \"TestExecutions\" ADD COLUMN IF NOT EXISTS \"CriteriosMinimosAtingidos\" BOOLEAN DEFAULT FALSE;"); } catch { }
        try
        {
            db.Database.ExecuteSqlRaw(@"
                CREATE TABLE IF NOT EXISTS ""ExecutionArtifacts"" (
                    ""Id"" SERIAL PRIMARY KEY,
                    ""TestExecutionId"" INTEGER NOT NULL,
                    ""FileName"" TEXT NOT NULL,
                    ""ContentType"" TEXT NOT NULL,
                    ""SizeBytes"" BIGINT NOT NULL DEFAULT 0,
                    ""Data"" BYTEA NOT NULL,
                    ""CreatedAt"" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
                );
                CREATE UNIQUE INDEX IF NOT EXISTS ""IX_ExecutionArtifacts_TestExecutionId_FileName""
                ON ""ExecutionArtifacts"" (""TestExecutionId"", ""FileName"");");
        }
        catch { }
    }
    else
    {
        try { db.Database.ExecuteSqlRaw("ALTER TABLE TestStepExecutions ADD COLUMN Tipo TEXT;"); } catch { }
        try { db.Database.ExecuteSqlRaw("ALTER TABLE TestStepExecutions ADD COLUMN Prioridade TEXT;"); } catch { }
        try { db.Database.ExecuteSqlRaw("ALTER TABLE TestStepExecutions ADD COLUMN PreCondicao TEXT;"); } catch { }
        try { db.Database.ExecuteSqlRaw("ALTER TABLE TestStepExecutions ADD COLUMN ResultadoEsperado TEXT;"); } catch { }
        try { db.Database.ExecuteSqlRaw("ALTER TABLE TestStepExecutions ADD COLUMN Codigo TEXT;"); } catch { }
        try { db.Database.ExecuteSqlRaw("ALTER TABLE TestStepExecutions ADD COLUMN Tecnica TEXT;"); } catch { }
        try { db.Database.ExecuteSqlRaw("ALTER TABLE TestStepExecutions ADD COLUMN DadosTeste TEXT;"); } catch { }
        try { db.Database.ExecuteSqlRaw("ALTER TABLE TestStepExecutions ADD COLUMN CriterioMinimo INTEGER DEFAULT 1;"); } catch { }
        try { db.Database.ExecuteSqlRaw("ALTER TABLE TestStepExecutions ADD COLUMN CriterioMinimoDescricao TEXT;"); } catch { }
        try { db.Database.ExecuteSqlRaw("ALTER TABLE TestStepExecutions ADD COLUMN CriteriosMinimosJson TEXT;"); } catch { }
        try { db.Database.ExecuteSqlRaw("ALTER TABLE TestStepExecutions ADD COLUMN ExecutedActions TEXT;"); } catch { }
        try { db.Database.ExecuteSqlRaw("ALTER TABLE TestStepExecutions ADD COLUMN VisitedUrl TEXT;"); } catch { }
        try { db.Database.ExecuteSqlRaw("ALTER TABLE TestExecutions ADD COLUMN InitialScreenshotUrl TEXT;"); } catch { }
        try { db.Database.ExecuteSqlRaw("ALTER TABLE TestExecutions ADD COLUMN TotalCriteriosMinimos INTEGER DEFAULT 0;"); } catch { }
        try { db.Database.ExecuteSqlRaw("ALTER TABLE TestExecutions ADD COLUMN PassedCriteriosMinimos INTEGER DEFAULT 0;"); } catch { }
        try { db.Database.ExecuteSqlRaw("ALTER TABLE TestExecutions ADD COLUMN FailedCriteriosMinimos INTEGER DEFAULT 0;"); } catch { }
        try { db.Database.ExecuteSqlRaw("ALTER TABLE TestExecutions ADD COLUMN CriteriosMinimosAtingidos INTEGER DEFAULT 0;"); } catch { }
        try
        {
            db.Database.ExecuteSqlRaw(@"
                CREATE TABLE IF NOT EXISTS ExecutionArtifacts (
                    Id INTEGER PRIMARY KEY AUTOINCREMENT,
                    TestExecutionId INTEGER NOT NULL,
                    FileName TEXT NOT NULL,
                    ContentType TEXT NOT NULL,
                    SizeBytes INTEGER NOT NULL DEFAULT 0,
                    Data BLOB NOT NULL,
                    CreatedAt TEXT NOT NULL
                );
                CREATE UNIQUE INDEX IF NOT EXISTS IX_ExecutionArtifacts_TestExecutionId_FileName
                ON ExecutionArtifacts (TestExecutionId, FileName);");
        }
        catch { }
    }

    // Encerra execuções órfãs presas em Running/Pending após reinício ou redeploy do servidor
    try
    {
        var orphaned = db.TestExecutions
            .Include(e => e.Steps)
            .Where(e => e.Status == "Running" || e.Status == "Pending")
            .ToList();

        if (orphaned.Count > 0)
        {
            foreach (var exec in orphaned)
            {
                exec.Status = "Failed";
                exec.FinishedAt ??= DateTime.UtcNow;
                exec.Logs = (exec.Logs ?? string.Empty).TrimEnd()
                    + "\n[Sistema] Execução interrompida por reinício ou atualização do container.";

                foreach (var st in exec.Steps.Where(s => s.Status is "Running" or "Pending"))
                {
                    st.ErrorDetails ??= st.Status == "Running"
                        ? "Execução interrompida por reinício do servidor."
                        : null;
                    st.Status = st.Status == "Running" ? "Failed" : "Skipped";
                }
            }
            db.SaveChanges();
            Console.WriteLine($"[Startup] {orphaned.Count} execução(ões) órfã(s) marcada(s) como Failed após reinício.");
        }
    }
    catch { }
}

// 6. Pipeline HTTP
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowNextJs");

// Loga cada requisição recebida (exceto o polling de status, para não poluir)
app.Use(async (ctx, next) =>
{
    var path = ctx.Request.Path.Value ?? "";
    var noisy = path.EndsWith("/status") || (ctx.Request.Method == "GET" && path.Contains("/executions/"));
    if (!noisy) Console.WriteLine($"[{DateTime.Now:HH:mm:ss}] --> {ctx.Request.Method} {path}");
    await next();
    if (!noisy) Console.WriteLine($"[{DateTime.Now:HH:mm:ss}] <-- {ctx.Response.StatusCode} {ctx.Request.Method} {path}");
});

var contentTypeProvider = new FileExtensionContentTypeProvider();
contentTypeProvider.Mappings[".webm"] = "video/webm";
contentTypeProvider.Mappings[".png"] = "image/png";
contentTypeProvider.Mappings[".svg"] = "image/svg+xml";

app.UseStaticFiles(new StaticFileOptions
{
    ContentTypeProvider = contentTypeProvider,
    OnPrepareResponse = ctx =>
    {
        if (ctx.File.Name.StartsWith("live", StringComparison.OrdinalIgnoreCase))
        {
            ctx.Context.Response.Headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0";
            ctx.Context.Response.Headers["Pragma"] = "no-cache";
        }
    }
});

// Dispara aquecimento do Chromium Headless + FFmpeg em background sem bloquear subida da API
app.Services.GetRequiredService<PlaywrightBootstrapService>().StartBackgroundWarmup();

app.UseAuthorization();
app.MapGet("/", () => Results.Ok(new { status = "Healthy", service = "Qore Analytics API", timestamp = DateTime.UtcNow }));
app.MapGet("/health", () => Results.Ok(new { status = "Healthy", timestamp = DateTime.UtcNow }));
app.MapControllers();

Console.WriteLine("==================================================================");
Console.WriteLine(" 🚀 QA AGENT BACKEND (C# .NET 10) INICIADO COM SUCESSO!");
Console.WriteLine($"    • Banco de Dados: {(usePostgres ? "PostgreSQL (Docker)" : "SQLite (Local Fallback)")}");
Console.WriteLine("    • IA: Google Gemini 3.5/3.8 Flash");
Console.WriteLine("    • Automação: Microsoft Playwright E2E");
Console.WriteLine("==================================================================");

app.Run();
