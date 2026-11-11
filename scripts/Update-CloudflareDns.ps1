<#
.SYNOPSIS
  Updates a Cloudflare DNS A record when this machine's public IP changes (DDNS).

.DESCRIPTION
  Intended for Windows Server behind a dynamic ISP IP. Run on a schedule
  (Task Scheduler every 5–15 minutes). Creates or updates one A record.

  All HTTPS uses curl.exe with -4 (IPv4 only). Some Windows Servers hang for
  ~30s on api.cloudflare.com when .NET tries IPv6 first; curl -4 avoids that.
  Request bodies are written to a temp file (--data-binary @file) so GET never
  sends an empty --data-binary argument.

  Requires a Cloudflare API token with:
    Zone → Zone → Read
    Zone → DNS → Edit
  scoped to the zone that owns the hostname.

.EXAMPLE
  .\Update-CloudflareDns.ps1 `
    -ApiToken $env:CF_API_TOKEN `
    -ZoneName 'ylsduotower.com' `
    -RecordName 'ylworks.ylsduotower.com'

.NOTES
  ScriptVersion: 2026-11-11f
  Prefer storing the token in an environment variable or Task Scheduler
  "hidden" argument — do not commit tokens to git.
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$ApiToken,

  [Parameter(Mandatory = $true)]
  [string]$ZoneName,

  [Parameter(Mandatory = $true)]
  [string]$RecordName,

  [bool]$Proxied = $true,

  [string]$LogPath = 'C:\inetpub\ylwork\logs\cloudflare-ddns.log',

  # Optional: skip the zone lookup round-trip once you know the ID
  [string]$ZoneId = '',

  [int]$IpLookupTimeoutSec = 5,

  [int]$ApiTimeoutSec = 30
)

$ErrorActionPreference = 'Stop'
$Script:ScriptVersion = '2026-11-11f'

function Write-Log([string]$Message) {
  # Local server time with offset (e.g. 2026-11-11 09:47:01 +08:00), not UTC
  $line = '{0:yyyy-MM-dd HH:mm:ss zzz} {1}' -f (Get-Date), $Message
  $dir = Split-Path -Parent $LogPath
  if ($dir -and -not (Test-Path $dir)) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
  }
  Add-Content -Path $LogPath -Value $line
  Write-Host $line
}

function Get-CurlPath {
  $cmd = Get-Command curl.exe -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  throw 'curl.exe not found. Install curl or use Windows 10/11 / Server 2019+ where it is built in.'
}

function Invoke-Curl {
  param(
    [Parameter(Mandatory = $true)][string[]]$CurlArgs
  )

  $curl = Get-CurlPath
  $stderrFile = [System.IO.Path]::GetTempFileName()
  try {
    $stdout = & $curl @CurlArgs 2>$stderrFile
    $exit = $LASTEXITCODE
    $stderr = ''
    if (Test-Path $stderrFile) {
      $stderr = (Get-Content -Path $stderrFile -Raw -ErrorAction SilentlyContinue)
    }
    return @{
      ExitCode = $exit
      StdOut   = $stdout
      StdErr   = $(if ($stderr) { $stderr.Trim() } else { '' })
    }
  }
  finally {
    Remove-Item -Path $stderrFile -Force -ErrorAction SilentlyContinue
  }
}

function Invoke-CfApi {
  param(
    [Parameter(Mandatory = $true)][ValidateSet('GET', 'POST', 'PUT', 'PATCH', 'DELETE')]
    [string]$Method,
    [Parameter(Mandatory = $true)][string]$Uri,
    $Body = $null
  )

  $bodyFile = $null
  $userAgent = "User-Agent: YLWork-Cloudflare-DDNS/$Script:ScriptVersion"
  $curlArgs = @(
    '-4', '-sS',
    '-m', "$ApiTimeoutSec",
    '--connect-timeout', "$ApiTimeoutSec",
    '-X', $Method,
    '-H', "Authorization: Bearer $ApiToken",
    '-H', $userAgent
  )

  try {
    if ($null -ne $Body) {
      $json = ($Body | ConvertTo-Json -Compress)
      $bodyFile = [System.IO.Path]::GetTempFileName()
      # curl --data-binary @file requires a non-empty path argument; never pass inline JSON.
      [System.IO.File]::WriteAllText($bodyFile, $json, [Text.UTF8Encoding]::new($false))
      $curlArgs += @(
        '-H', 'Content-Type: application/json',
        '--data-binary', "@$bodyFile"
      )
    }

    $curlArgs += $Uri
    $result = Invoke-Curl -CurlArgs $curlArgs

    if ($result.ExitCode -ne 0) {
      $detail = if ($result.StdErr) { $result.StdErr } elseif ($result.StdOut) { $result.StdOut } else { "curl exit $($result.ExitCode)" }
      if ($detail -match 'timed out|Timeout was reached') {
        throw "Cloudflare API timed out after ${ApiTimeoutSec}s ($Method $Uri). From this server run: curl.exe -4 -v -m 20 https://api.cloudflare.com/client/v4/zones"
      }
      throw "Cloudflare API curl failed ($Method $Uri): $detail"
    }

    if ([string]::IsNullOrWhiteSpace($result.StdOut)) {
      throw "Empty response from $Uri"
    }

    $parsed = $result.StdOut | ConvertFrom-Json
    if (-not $parsed.success) {
      throw ("Cloudflare API error: {0}" -f ($parsed.errors | ConvertTo-Json -Compress))
    }
    return $parsed
  }
  finally {
    if ($bodyFile -and (Test-Path $bodyFile)) {
      Remove-Item -Path $bodyFile -Force -ErrorAction SilentlyContinue
    }
  }
}

function Get-PublicIPv4 {
  $sources = @(
    @{ Uri = 'https://1.1.1.1/cdn-cgi/trace'; Parse = 'trace' },
    @{ Uri = 'https://cloudflare.com/cdn-cgi/trace'; Parse = 'trace' },
    @{ Uri = 'https://ifconfig.me/ip'; Parse = 'plain' }
  )

  foreach ($source in $sources) {
    $result = Invoke-Curl -CurlArgs @(
      '-4', '-sS',
      '-m', "$IpLookupTimeoutSec",
      '--connect-timeout', "$IpLookupTimeoutSec",
      $source.Uri
    )
    if ($result.ExitCode -ne 0 -or [string]::IsNullOrWhiteSpace($result.StdOut)) { continue }

    $candidate = $null
    switch ($source.Parse) {
      'plain' { $candidate = $result.StdOut.Trim() }
      'trace' {
        $match = [regex]::Match($result.StdOut, '(?m)^ip=([0-9.]+)$')
        if ($match.Success) { $candidate = $match.Groups[1].Value }
      }
    }
    if ($candidate -match '^\d{1,3}(\.\d{1,3}){3}$') {
      return $candidate
    }
  }
  throw "Could not determine public IPv4 within ${IpLookupTimeoutSec}s per source"
}

try {
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  Write-Log "Start Update-CloudflareDns.ps1 $Script:ScriptVersion"
  $publicIp = Get-PublicIPv4
  Write-Log "Public IP detected: $publicIp"

  if (-not $ZoneId) {
    $zoneResp = Invoke-CfApi -Method GET -Uri "https://api.cloudflare.com/client/v4/zones?name=$([uri]::EscapeDataString($ZoneName))"
    if (-not $zoneResp.result -or $zoneResp.result.Count -lt 1) {
      throw "Zone not found: $ZoneName"
    }
    $ZoneId = $zoneResp.result[0].id
  }

  $encodedName = [uri]::EscapeDataString($RecordName)
  $dnsResp = Invoke-CfApi -Method GET -Uri "https://api.cloudflare.com/client/v4/zones/$ZoneId/dns_records?type=A&name=$encodedName"
  $existing = $null
  if ($dnsResp.result -and $dnsResp.result.Count -gt 0) {
    $existing = $dnsResp.result[0]
  }

  if ($existing -and $existing.content -eq $publicIp) {
    Write-Log ("No change: {0} -> {1} ({2}ms)" -f $RecordName, $publicIp, $sw.ElapsedMilliseconds)
    exit 0
  }

  $payload = @{
    type    = 'A'
    name    = $RecordName
    content = $publicIp
    ttl     = 1   # Auto
    proxied = $Proxied
  }

  if ($existing) {
    Invoke-CfApi -Method PUT -Uri "https://api.cloudflare.com/client/v4/zones/$ZoneId/dns_records/$($existing.id)" -Body $payload | Out-Null
    Write-Log ("Updated: {0} {1} -> {2} ({3}ms)" -f $RecordName, $existing.content, $publicIp, $sw.ElapsedMilliseconds)
  }
  else {
    Invoke-CfApi -Method POST -Uri "https://api.cloudflare.com/client/v4/zones/$ZoneId/dns_records" -Body $payload | Out-Null
    Write-Log ("Created: {0} -> {1} (proxied={2}, {3}ms)" -f $RecordName, $publicIp, $Proxied, $sw.ElapsedMilliseconds)
  }
}
catch {
  Write-Log "ERROR: $($_.Exception.Message)"
  exit 1
}
