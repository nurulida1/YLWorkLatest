using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using YLWorks.Model;
using YLWorks.Services;

namespace YLWorks.Controller;

/// <summary>
/// Generates PDFs via JasperReports Server REST API.
/// </summary>
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ReportController : ControllerBase
{
    private readonly JasperReportService _reportService;

    public ReportController(JasperReportService reportService)
    {
        _reportService = reportService;
    }

    /// <summary>
    /// Generates a PDF from JasperReports Server and returns it as a file download.
    /// </summary>
    [HttpPost("download")]
    [Produces("application/pdf")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> DownloadReport([FromBody] ReportRequest request, CancellationToken cancellationToken)
    {
        var pdfBytes = await _reportService.GeneratePdfAsync(request, cancellationToken).ConfigureAwait(false);
        return File(pdfBytes, "application/pdf", "report.pdf");
    }
}
