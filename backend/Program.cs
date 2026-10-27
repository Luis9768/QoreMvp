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

// 2. Serviços da Plataforma QA e IA
builder.Services.AddHttpClient<GeminiClient>(c => c.Timeout = TimeSpan.FromSeconds(90));
builder.Services.AddHttpClient<GitHubService>(c => c.Timeout = TimeSpan.FromSeconds(30));
builder.Services.AddScoped<IGeminiPlannerService, GeminiPlannerService>();
builder.Services.AddSingleton<AgentRunner>();

// 3. Configuração do Banco de Dados (PostgreSQL no Docker com fallback inteligente)
var pgConnStr = builder.Configuration.GetConnectionString("PostgresConnection") 
    ?? "Host=localhost;Port=5432;Database=qaplatform_db;Username=postgres;Password=postgres";
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

// 4. Configuração de CORS para o Next.js
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowNextJs", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://127.0.0.1:3000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// 5. Garantir que o banco de dados e as tabelas estejam criados
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<QaDbContext>();
    db.Database.EnsureCreated();

    try { db.Database.ExecuteSqlRaw("ALTER TABLE TestStepExecutions ADD COLUMN Tipo TEXT;"); } catch { }
    try { db.Database.ExecuteSqlRaw("ALTER TABLE TestStepExecutions ADD COLUMN Prioridade TEXT;"); } catch { }
    try { db.Database.ExecuteSqlRaw("ALTER TABLE TestStepExecutions ADD COLUMN PreCondicao TEXT;"); } catch { }
    try { db.Database.ExecuteSqlRaw("ALTER TABLE TestStepExecutions ADD COLUMN ResultadoEsperado TEXT;"); } catch { }
    try { db.Database.ExecuteSqlRaw("ALTER TABLE TestStepExecutions ADD COLUMN Codigo TEXT;"); } catch { }
    try { db.Database.ExecuteSqlRaw("ALTER TABLE TestStepExecutions ADD COLUMN Tecnica TEXT;"); } catch { }
    try { db.Database.ExecuteSqlRaw("ALTER TABLE TestStepExecutions ADD COLUMN DadosTeste TEXT;"); } catch { }
    try { db.Database.ExecuteSqlRaw("ALTER TABLE TestStepExecutions ADD COLUMN CriterioMinimo INTEGER DEFAULT 1;"); } catch { }
    try { db.Database.ExecuteSqlRaw("ALTER TABLE TestStepExecutions ADD COLUMN CriterioMinimoDescricao TEXT;"); } catch { }
    try { db.Database.ExecuteSqlRaw("ALTER TABLE TestExecutions ADD COLUMN TotalCriteriosMinimos INTEGER DEFAULT 0;"); } catch { }
    try { db.Database.ExecuteSqlRaw("ALTER TABLE TestExecutions ADD COLUMN PassedCriteriosMinimos INTEGER DEFAULT 0;"); } catch { }
    try { db.Database.ExecuteSqlRaw("ALTER TABLE TestExecutions ADD COLUMN FailedCriteriosMinimos INTEGER DEFAULT 0;"); } catch { }
    try { db.Database.ExecuteSqlRaw("ALTER TABLE TestExecutions ADD COLUMN CriteriosMinimosAtingidos INTEGER DEFAULT 0;"); } catch { }
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

app.UseStaticFiles();

app.UseAuthorization();
app.MapControllers();

Console.WriteLine("==================================================================");
Console.WriteLine(" 🚀 QA AGENT BACKEND (C# .NET 10) INICIADO COM SUCESSO!");
Console.WriteLine($"    • Banco de Dados: {(usePostgres ? "PostgreSQL (Docker)" : "SQLite (Local Fallback)")}");
Console.WriteLine("    • IA: Google Gemini 3.5/3.8 Flash");
Console.WriteLine("    • Automação: Microsoft Playwright E2E");
Console.WriteLine("==================================================================");

app.Run();
