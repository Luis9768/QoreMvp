using System.Runtime.InteropServices;

namespace QaAgent.Api.Services;

/// <summary>
/// Garante que o Playwright Chromium Headless Shell e o FFmpeg estejam instalados
/// no container (ou ambiente local) para execução real de navegador, prints e gravação de vídeo WebM.
/// </summary>
public class PlaywrightBootstrapService
{
    private readonly ILogger<PlaywrightBootstrapService> _logger;
    private readonly IConfiguration _config;
    private readonly SemaphoreSlim _installLock = new(1, 1);

    private volatile bool _isInstalling;
    private string? _lastError;
    private Task<bool>? _backgroundTask;

    public PlaywrightBootstrapService(ILogger<PlaywrightBootstrapService> logger, IConfiguration config)
    {
        _logger = logger;
        _config = config;
    }

    public bool IsInstalling => _isInstalling;
    public string? LastError => _lastError;

    public string GetBrowsersCachePath()
    {
        var envPath = Environment.GetEnvironmentVariable("PLAYWRIGHT_BROWSERS_PATH");
        if (!string.IsNullOrWhiteSpace(envPath) && envPath != "0")
            return envPath;

        if (OperatingSystem.IsWindows())
            return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "ms-playwright");

        var home = Environment.GetEnvironmentVariable("HOME");
        if (string.IsNullOrWhiteSpace(home)) home = "/root";
        return Path.Combine(home, ".cache", "ms-playwright");
    }

    public string? FindBrowserExecutable()
    {
        var cacheDir = GetBrowsersCachePath();
        if (Directory.Exists(cacheDir))
        {
            // 1. Preferência: Playwright Chromium Headless Shell (ideal e rápido para Headless / Docker)
            var shellDirs = Directory.GetDirectories(cacheDir, "chromium_headless_shell-*");
            foreach (var dir in shellDirs.OrderByDescending(d => d))
            {
                var linuxX64 = Path.Combine(dir, "chrome-headless-shell-linux64", "chrome-headless-shell");
                if (File.Exists(linuxX64)) return linuxX64;

                var linuxArm = Path.Combine(dir, "chrome-headless-shell-linux-arm64", "chrome-headless-shell");
                if (File.Exists(linuxArm)) return linuxArm;

                var win64 = Path.Combine(dir, "chrome-headless-shell-win64", "chrome-headless-shell.exe");
                if (File.Exists(win64)) return win64;
            }

            // 2. Fallback: Playwright Chromium completo
            var chromiumDirs = Directory.GetDirectories(cacheDir, "chromium-*");
            foreach (var dir in chromiumDirs.OrderByDescending(d => d))
            {
                var linuxX64 = Path.Combine(dir, "chrome-linux64", "chrome");
                if (File.Exists(linuxX64)) return linuxX64;

                var linux = Path.Combine(dir, "chrome-linux", "chrome");
                if (File.Exists(linux)) return linux;

                var win64 = Path.Combine(dir, "chrome-win64", "chrome.exe");
                if (File.Exists(win64)) return win64;
            }
        }

        // 3. Chrome / Chromium do sistema operacional
        var candidates = new[]
        {
            Environment.GetEnvironmentVariable("PLAYWRIGHT_CHROME_PATH"),
            _config["Playwright:ChromePath"],
            OperatingSystem.IsWindows() ? @"C:\Program Files\Google\Chrome\Application\chrome.exe" : null,
            OperatingSystem.IsWindows() ? @"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" : null,
            "/usr/bin/chromium",
            "/usr/bin/chromium-browser",
            "/usr/bin/google-chrome"
        };

        return candidates.FirstOrDefault(p => !string.IsNullOrWhiteSpace(p) && File.Exists(p));
    }

    public bool IsFfmpegInstalled()
    {
        var cacheDir = GetBrowsersCachePath();
        if (!Directory.Exists(cacheDir)) return false;

        foreach (var dir in Directory.GetDirectories(cacheDir, "ffmpeg-*"))
        {
            if (File.Exists(Path.Combine(dir, "ffmpeg-linux")) ||
                File.Exists(Path.Combine(dir, "ffmpeg-win64.exe")) ||
                File.Exists(Path.Combine(dir, "ffmpeg-mac")))
            {
                return true;
            }
        }
        return false;
    }

    public object GetStatus()
    {
        var browserPath = FindBrowserExecutable();
        var browserReady = !string.IsNullOrWhiteSpace(browserPath);
        var ffmpegReady = IsFfmpegInstalled();
        var ready = browserReady && ffmpegReady;

        string message;
        if (_isInstalling)
            message = "Instalando Chromium Headless + FFmpeg no servidor...";
        else if (ready)
            message = "Chromium Headless + Gravador de Vídeo WebM prontos";
        else if (browserReady && !ffmpegReady)
            message = "Navegador encontrado; preparando FFmpeg para vídeo";
        else
            message = _lastError ?? "Aguardando instalação do Chromium Headless";

        return new
        {
            ready,
            installing = _isInstalling,
            browserReady,
            ffmpegReady,
            browserPath = browserReady ? Path.GetFileName(browserPath) : null,
            message,
            lastError = _lastError
        };
    }

    public void StartBackgroundWarmup()
    {
        if (_backgroundTask != null) return;
        _backgroundTask = Task.Run(() => EnsureReadyAsync(null));
    }

    public async Task<bool> EnsureReadyAsync(Func<string, Task>? logCallback = null)
    {
        var browserOk = !string.IsNullOrWhiteSpace(FindBrowserExecutable());
        var ffmpegOk = IsFfmpegInstalled();
        if (browserOk && ffmpegOk) return true;

        await _installLock.WaitAsync();
        try
        {
            browserOk = !string.IsNullOrWhiteSpace(FindBrowserExecutable());
            ffmpegOk = IsFfmpegInstalled();
            if (browserOk && ffmpegOk) return true;

            _isInstalling = true;
            _lastError = null;

            var cachePath = GetBrowsersCachePath();
            Directory.CreateDirectory(cachePath);

            if (!OperatingSystem.IsWindows())
            {
                Environment.SetEnvironmentVariable("PLAYWRIGHT_BROWSERS_PATH", cachePath);
            }
            Environment.SetEnvironmentVariable("PLAYWRIGHT_DRIVER_SEARCH_PATH", AppContext.BaseDirectory);

            EnsureLinuxNodeExecutablePermission();

            if (logCallback != null)
            {
                await logCallback("📥 Baixando Chromium Headless + FFmpeg (gravador de vídeo real) no servidor... aguarde alguns segundos.");
            }
            _logger.LogInformation("[PlaywrightBootstrap] Iniciando instalação de 'chromium --only-shell' em {CachePath}...", cachePath);

            var pwCli = new Microsoft.Playwright.Program();
            var result = await Task.Run(() =>
                pwCli.RunWithResult(new[] { "install", "chromium", "--only-shell" }));

            if (result.ExitCode != 0)
            {
                _logger.LogWarning("[PlaywrightBootstrap] 'install chromium --only-shell' retornou código {Code}: {Err}",
                    result.ExitCode, result.StandardError);

                // Fallback tentando instalar ffmpeg explícito e chromium padrão
                var fallback = await Task.Run(() =>
                    pwCli.RunWithResult(new[] { "install", "chromium", "ffmpeg" }));

                if (fallback.ExitCode != 0)
                {
                    _lastError = $"Falha ao instalar Playwright (exit {fallback.ExitCode}): {fallback.StandardError}";
                    _logger.LogError("[PlaywrightBootstrap] {Err}", _lastError);
                    if (logCallback != null) await logCallback($"✖ {_lastError}");
                    return false;
                }
            }
            else if (!IsFfmpegInstalled())
            {
                // Garante ffmpeg explícito caso --only-shell não tenha incluído por algum motivo
                await Task.Run(() => pwCli.RunWithResult(new[] { "install", "ffmpeg" }));
            }

            browserOk = !string.IsNullOrWhiteSpace(FindBrowserExecutable());
            ffmpegOk = IsFfmpegInstalled();

            if (browserOk && ffmpegOk)
            {
                _logger.LogInformation("[PlaywrightBootstrap] Chromium Headless e FFmpeg prontos!");
                if (logCallback != null) await logCallback("✔ Chromium Headless + FFmpeg prontos para gravação de vídeo e prints reais!");
                return true;
            }

            _lastError = $"Binários do Playwright incompletos após instalação (browser={browserOk}, ffmpeg={ffmpegOk}).";
            _logger.LogError("[PlaywrightBootstrap] {Err}", _lastError);
            if (logCallback != null) await logCallback($"✖ {_lastError}");
            return false;
        }
        catch (Exception ex)
        {
            _lastError = $"Exceção ao preparar Playwright: {ex.Message}";
            _logger.LogError(ex, "[PlaywrightBootstrap] Erro na instalação do Playwright");
            if (logCallback != null) await logCallback($"✖ {_lastError}");
            return false;
        }
        finally
        {
            _isInstalling = false;
            _installLock.Release();
        }
    }

    private void EnsureLinuxNodeExecutablePermission()
    {
        if (OperatingSystem.IsWindows()) return;
        try
        {
            var nodeDir = Path.Combine(AppContext.BaseDirectory, ".playwright", "node");
            if (!Directory.Exists(nodeDir)) return;

            var execMode = UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute |
                           UnixFileMode.GroupRead | UnixFileMode.GroupExecute |
                           UnixFileMode.OtherRead | UnixFileMode.OtherExecute;

            foreach (var sub in Directory.GetDirectories(nodeDir))
            {
                var nodeBin = Path.Combine(sub, "node");
                if (File.Exists(nodeBin))
                {
                    File.SetUnixFileMode(nodeBin, execMode);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[PlaywrightBootstrap] Não foi possível ajustar permissão do binário node.");
        }
    }
}
