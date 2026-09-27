using System.IO;
using System.Text.Json;

namespace TokenTrackerWin;

/// <summary>Keep dashboard appearance across loopback port changes.</summary>
internal static class LimitBarAppearanceStore
{
    private static readonly string StorePath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "TokenTracker", "limit-bar-appearance.json");

    public static string? Read()
    {
        try { return File.Exists(StorePath) ? File.ReadAllText(StorePath) : null; }
        catch (IOException) { return null; }
        catch (UnauthorizedAccessException) { return null; }
    }

    public static void Save(string value)
    {
        if (value.Length > 4096) return;
        try
        {
            using var document = JsonDocument.Parse(value);
            if (document.RootElement.ValueKind != JsonValueKind.Object) return;
            Directory.CreateDirectory(Path.GetDirectoryName(StorePath)!);
            File.WriteAllText(StorePath + ".tmp", value);
            File.Move(StorePath + ".tmp", StorePath, overwrite: true);
        }
        catch (JsonException) { }
        catch (IOException) { }
        catch (UnauthorizedAccessException) { }
    }
}
