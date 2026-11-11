<#
.SYNOPSIS
  Updates a Cloudflare DNS A record when this machine's public IP changes (DDNS).

.DESCRIPTION
  Intended for Windows Server behind a dynamic ISP IP. Run on a schedule
  (Task Scheduler every 5–15 minutes). Creates or updates one A record.

  Uses curl.exe with short hard timeouts so a dead IP-lookup host cannot
  hang PowerShell for 1–2 minutes (Invoke-RestMethod -TimeoutSec often
  does not cancel TCP connect delays on Windows PowerShell 5.1).

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

  [int]$HttpTimeoutSec = 5
)

$ErrorActionPreference = 'Stop'

function Write-Log([string]$Message) {
  $line = '{0:u} {1}' -f (Get-Date).ToUniversalTime(), $Message
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

function Invoke-CurlJson {
  param(
    [Parameter(Mandatory = $true)][ValidateSet('GET', 'POST', 'PUT', 'PATCH', 'DELETE')]
    [string]$Method,
    [Parameter(Mandatory = $true)][string]$Uri,
    [hashtable]$Headers = @{},
    [string]$Body = $null
  )

  $curl = Get-CurlPath
  $args = @(
    '-4', '-sS', '--fail-with-body',
    '-m', "$HttpTimeoutSec",
    '--connect-timeout', "$HttpTimeoutSec",
    '-X', $Method,
    $Uri
  )
  foreach ($key in $Headers.Keys) {
    $args += @('-H', ('{0}: {1}' -f $key, $Headers[$key]))
  }
  if ($null -ne $Body) {
    $args += @('-H', 'Content-Type: application/json', '--data-binary', $Body)
  }

  $stderrFile = [System.IO.Path]::GetTempFileName()
  try {
    $stdout = & $curl @args 2>$stderrFile
    $exit = $LASTEXITCODE
    $stderr = (Get-Content -Path $stderrFile -Raw -ErrorAction SilentlyContinue)
    if ($exit -ne 0) {
      $detail = if ($stdout) { $stdout } elseif ($stderr) { $stderr.Trim() } else { "curl exit $exit" }
      throw $detail
    }
    if ([string]::IsNullOrWhiteSpace($stdout)) {
      throw "Empty response from $Uri"
    }
    return ($stdout | ConvertFrom-Json)
  }
  finally {
    Remove-Item -Path $stderrFile -Force -ErrorAction SilentlyContinue
  }
}

function Invoke-CfApi([string]$Method, [string]$Uri, $Body = $null) {
  $headers = @{ Authorization = "Bearer $ApiToken" }
  $jsonBody = $null
  if ($null -ne $Body) {
    $jsonBody = ($Body | ConvertTo-Json -Compress)
  }
  $response = Invoke-CurlJson -Method $Method -Uri $Uri -Headers $headers -Body $jsonBody
  if (-not $response.success) {
    throw ("Cloudflare API error: {0}" -f ($response.errors | ConvertTo-Json -Compress))
  }
  return $response
}

function Get-PublicIPv4 {
  # Prefer endpoints that worked quickly on this network; avoid slow/blocked hosts.
  $sources = @(
    @{ Uri = 'https://1.1.1.1/cdn-cgi/trace'; Parse = 'trace' },
    @{ Uri = 'https://cloudflare.com/cdn-cgi/trace'; Parse = 'trace' },
    @{ Uri = 'https://ifconfig.me/ip'; Parse = 'plain' }
  )

  $curl = Get-CurlPath
  foreach ($source in $sources) {
    try {
      $stdout = & $curl -4 -sS -m $HttpTimeoutSec --connect-timeout $HttpTimeoutSec $source.Uri 2>$null
      if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($stdout)) { continue }

      $candidate = $null
      switch ($source.Parse) {
        'plain' { $candidate = $stdout.Trim() }
        'trace' {
          $match = [regex]::Match($stdout, '(?m)^ip=([0-9.]+)$')
          if ($match.Success) { $candidate = $match.Groups[1].Value }
        }
      }
      if ($candidate -match '^\d{1,3}(\.\d{1,3}){3}$') {
        return $candidate
      }
    }
    catch {
      # try next source
    }
  }
  throw "Could not determine public IPv4 within ${HttpTimeoutSec}s per source"
}

try {
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  $publicIp = Get-PublicIPv4

  if (-not $ZoneId) {
    $zoneResp = Invoke-CfApi GET "https://api.cloudflare.com/client/v4/zones?name=$([uri]::EscapeDataString($ZoneName))"
    if (-not $zoneResp.result -or $zoneResp.result.Count -lt 1) {
      throw "Zone not found: $ZoneName"
    }
    $ZoneId = $zoneResp.result[0].id
  }

  $encodedName = [uri]::EscapeDataString($RecordName)
  $dnsResp = Invoke-CfApi GET "https://api.cloudflare.com/client/v4/zones/$ZoneId/dns_records?type=A&name=$encodedName"
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
    Invoke-CfApi PUT "https://api.cloudflare.com/client/v4/zones/$ZoneId/dns_records/$($existing.id)" $payload | Out-Null
    Write-Log ("Updated: {0} {1} -> {2} ({3}ms)" -f $RecordName, $existing.content, $publicIp, $sw.ElapsedMilliseconds)
  }
  else {
    Invoke-CfApi POST "https://api.cloudflare.com/client/v4/zones/$ZoneId/dns_records" $payload | Out-Null
    Write-Log ("Created: {0} -> {1} (proxied={2}, {3}ms)" -f $RecordName, $publicIp, $Proxied, $sw.ElapsedMilliseconds)
  }
}
catch {
  Write-Log "ERROR: $($_.Exception.Message)"
  exit 1
}
