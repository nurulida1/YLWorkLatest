namespace YLWorks.Model;

/// <summary>
/// Request payload for generating a JasperReports PDF via the REST API.
/// </summary>
public class ReportRequest
{
    /// <summary>
    /// Repository path to the report (e.g. <c>/reports/Invoice/Invoice1</c>), appended after <c>/rest_v2/reports</c>.
    /// </summary>
    public string ReportUri { get; set; } = string.Empty;

    /// <summary>
    /// Report input control parameters passed as query string key/value pairs.
    /// </summary>
    public Dictionary<string, string> Parameters { get; set; } = new();
}
