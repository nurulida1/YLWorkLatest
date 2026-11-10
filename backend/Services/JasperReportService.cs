using System.Net.Http.Headers;

using System.Text;

using System.Text.Json;

using YLWorks.Model;



namespace YLWorks.Services;



/// <summary>

/// Calls JasperReports Server REST API v2 to generate report PDFs.

/// </summary>

public class JasperReportService

{

    private const int MaxGetQueryStringLength = 1800;



    private readonly HttpClient _httpClient;

    private readonly IConfiguration _configuration;



    public JasperReportService(HttpClient httpClient, IConfiguration configuration)

    {

        _httpClient = httpClient;

        _configuration = configuration;

    }



    public async Task<byte[]> GeneratePdfAsync(ReportRequest request, CancellationToken cancellationToken = default)

    {

        ArgumentNullException.ThrowIfNull(request);



        if (string.IsNullOrWhiteSpace(request.ReportUri))

        {

            throw new ArgumentException("ReportUri is required.", nameof(request));

        }



        var baseUrl = _configuration["JasperReports:BaseUrl"];

        var username = _configuration["JasperReports:Username"];

        var password = _configuration["JasperReports:Password"];



        if (string.IsNullOrWhiteSpace(baseUrl))

        {

            throw new ArgumentException("JasperReports:BaseUrl is not configured.", nameof(request));

        }



        if (string.IsNullOrWhiteSpace(username) || password is null)

        {

            throw new ArgumentException("JasperReports:Username and JasperReports:Password must be configured.", nameof(request));

        }



        var normalizedBase = baseUrl.TrimEnd('/');

        var reportPath = request.ReportUri.StartsWith('/') ? request.ReportUri : "/" + request.ReportUri;

        var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{username}:{password}"));



        var parameters = request.Parameters ?? new Dictionary<string, string>();

        var query = BuildQueryString(parameters);



        try

        {

            if (ShouldUseReportExecutions(parameters, query.Length))

            {

                return await GeneratePdfViaReportExecutionsAsync(

                    normalizedBase,

                    reportPath,

                    parameters,

                    credentials,

                    cancellationToken).ConfigureAwait(false);

            }



            return await GeneratePdfViaGetAsync(

                normalizedBase,

                reportPath,

                query,

                credentials,

                cancellationToken).ConfigureAwait(false);

        }

        catch (HttpRequestException ex)

        {

            throw new InvalidOperationException(

                $"Failed to connect to JasperReports Server at '{normalizedBase}'. Verify BaseUrl, network access, and TLS settings. {ex.Message}",

                ex);

        }

        catch (TaskCanceledException ex) when (!cancellationToken.IsCancellationRequested)

        {

            throw new InvalidOperationException(

                "The request to JasperReports Server timed out or was canceled by the HTTP client.",

                ex);

        }

    }



    private static bool ShouldUseReportExecutions(Dictionary<string, string> parameters, int queryLength)

    {

        if (queryLength > MaxGetQueryStringLength)

        {

            return true;

        }



        return parameters.Values.Any(value => value.Length > 500);

    }



    private async Task<byte[]> GeneratePdfViaGetAsync(

        string normalizedBase,

        string reportPath,

        string query,

        string credentials,

        CancellationToken cancellationToken)

    {

        var encodedReportPath = EncodeReportPath(reportPath);

        var url = $"{normalizedBase}/rest_v2/reports{encodedReportPath}.pdf";

        if (query.Length > 0)

        {

            url += "?" + query;

        }



        using var httpRequest = new HttpRequestMessage(HttpMethod.Get, url);

        httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Basic", credentials);



        var response = await _httpClient.SendAsync(httpRequest, HttpCompletionOption.ResponseHeadersRead, cancellationToken).ConfigureAwait(false);

        return await ReadPdfResponseAsync(response, cancellationToken).ConfigureAwait(false);

    }



    private async Task<byte[]> GeneratePdfViaReportExecutionsAsync(

        string normalizedBase,

        string reportPath,

        Dictionary<string, string> parameters,

        string credentials,

        CancellationToken cancellationToken)

    {

        var payload = new

        {

            reportUnitUri = reportPath,

            async = false,

            outputFormat = "pdf",

            parameters = new

            {

                reportParameter = parameters.Select(p => new

                {

                    name = p.Key,

                    value = new[] { p.Value }

                }).ToArray()

            }

        };



        var executeUrl = $"{normalizedBase}/rest_v2/reportExecutions";

        using var executeRequest = new HttpRequestMessage(HttpMethod.Post, executeUrl);

        executeRequest.Headers.Authorization = new AuthenticationHeaderValue("Basic", credentials);

        executeRequest.Content = new StringContent(

            JsonSerializer.Serialize(payload),

            Encoding.UTF8,

            "application/json");



        var executeResponse = await _httpClient.SendAsync(executeRequest, cancellationToken).ConfigureAwait(false);

        if (!executeResponse.IsSuccessStatusCode)

        {

            var errorBody = await ReadErrorBodyAsync(executeResponse, cancellationToken).ConfigureAwait(false);

            var message = $"JasperReports Server returned {(int)executeResponse.StatusCode} {executeResponse.ReasonPhrase}. {errorBody}".Trim();

            throw new InvalidOperationException(message);

        }



        await using var responseStream = await executeResponse.Content.ReadAsStreamAsync(cancellationToken).ConfigureAwait(false);

        using var document = await JsonDocument.ParseAsync(responseStream, cancellationToken: cancellationToken).ConfigureAwait(false);



        var requestId = document.RootElement.GetProperty("requestId").GetString();

        var exportId = document.RootElement.GetProperty("exports")[0].GetProperty("id").GetString();



        if (string.IsNullOrWhiteSpace(requestId) || string.IsNullOrWhiteSpace(exportId))

        {

            throw new InvalidOperationException("JasperReports Server did not return a valid report execution export.");

        }



        var pdfUrl = $"{normalizedBase}/rest_v2/reportExecutions/{requestId}/exports/{exportId}/outputResource";

        using var pdfRequest = new HttpRequestMessage(HttpMethod.Get, pdfUrl);

        pdfRequest.Headers.Authorization = new AuthenticationHeaderValue("Basic", credentials);



        var pdfResponse = await _httpClient.SendAsync(pdfRequest, HttpCompletionOption.ResponseHeadersRead, cancellationToken).ConfigureAwait(false);

        return await ReadPdfResponseAsync(pdfResponse, cancellationToken).ConfigureAwait(false);

    }



    private static async Task<byte[]> ReadPdfResponseAsync(HttpResponseMessage response, CancellationToken cancellationToken)

    {

        if (!response.IsSuccessStatusCode)

        {

            var errorBody = await ReadErrorBodyAsync(response, cancellationToken).ConfigureAwait(false);

            var message = $"JasperReports Server returned {(int)response.StatusCode} {response.ReasonPhrase}. {errorBody}".Trim();

            throw new InvalidOperationException(message);

        }



        return await response.Content.ReadAsByteArrayAsync(cancellationToken).ConfigureAwait(false);

    }



    private static string EncodeReportPath(string reportPath)

    {

        var trimmed = reportPath.TrimStart('/');

        if (string.IsNullOrEmpty(trimmed))

        {

            return string.Empty;

        }



        var segments = trimmed.Split('/', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        return "/" + string.Join("/", segments.Select(Uri.EscapeDataString));

    }



    private static string BuildQueryString(Dictionary<string, string>? parameters)

    {

        if (parameters is null || parameters.Count == 0)

        {

            return string.Empty;

        }



        return string.Join("&", parameters.Select(p => $"{Uri.EscapeDataString(p.Key)}={Uri.EscapeDataString(p.Value)}"));

    }



    private static string SummarizeErrorBody(string? text)

    {

        if (string.IsNullOrWhiteSpace(text))

        {

            return string.Empty;

        }



        if (text.TrimStart().StartsWith("<!", StringComparison.OrdinalIgnoreCase))

        {

            return "Jasper returned an HTML error page (check JasperReports:BaseUrl and reportUri).";

        }



        return text.Length > 500 ? text[..500] + "..." : text;

    }



    private static async Task<string> ReadErrorBodyAsync(HttpResponseMessage response, CancellationToken cancellationToken)

    {

        try

        {

            var text = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);

            return SummarizeErrorBody(text);

        }

        catch

        {

            return string.Empty;

        }

    }

}


