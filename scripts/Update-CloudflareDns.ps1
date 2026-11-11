<#
.SYNOPSIS
  Updates a Cloudflare DNS A record when this machine's public IP changes (DDNS).

.DESCRIPTION
  Intended for Windows Server behind a dynamic ISP IP. Run on a schedule
  (Task Scheduler every 5–15 minutes). Creates or updates one A record.

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

  [string]$LogPath = 'C:\inetpub\ylwork\logs\cloudflare-ddns.log'
)

$ErrorActionPreference = 'Stop'
$headers = @{
  Authorization  = "Bearer $ApiToken"
  'Content-Type' = 'application/json'
}

function Write-Log([string]$Message) {
  $line = '{0:u} {1}' -f (Get-Date).ToUniversalTime(), $Message
  $dir = Split-Path -Parent $LogPath
  if ($dir -and -not (Test-Path $dir)) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
  }
  Add-Content -Path $LogPath -Value $line
  Write-Host $line
}

function Invoke-CfApi([string]$Method, [string]$Uri, $Body = $null) {
  $params = @{
    Method  = $Method
    Uri     = $Uri
    Headers = $headers
  }
  if ($null -ne $Body) {
    $params.Body = ($Body | ConvertTo-Json -Compress)
  }
  $response = Invoke-RestMethod @params
  if (-not $response.success) {
    throw ("Cloudflare API error: {0}" -f ($response.errors | ConvertTo-Json -Compress))
  }
  return $response
}

try {
  $publicIp = (Invoke-RestMethod -Uri 'https://api.ipify.org?format=json').ip
  if ($publicIp -notmatch '^\d{1,3}(\.\d{1,3}){3}$') {
    throw "Could not determine public IPv4 (got: $publicIp)"
  }

  $zoneResp = Invoke-CfApi GET "https://api.cloudflare.com/client/v4/zones?name=$([uri]::EscapeDataString($ZoneName))"
  if (-not $zoneResp.result -or $zoneResp.result.Count -lt 1) {
    throw "Zone not found: $ZoneName"
  }
  $zoneId = $zoneResp.result[0].id

  $encodedName = [uri]::EscapeDataString($RecordName)
  $dnsResp = Invoke-CfApi GET "https://api.cloudflare.com/client/v4/zones/$zoneId/dns_records?type=A&name=$encodedName"
  $existing = $null
  if ($dnsResp.result -and $dnsResp.result.Count -gt 0) {
    $existing = $dnsResp.result[0]
  }

  if ($existing -and $existing.content -eq $publicIp) {
    Write-Log "No change: $RecordName -> $publicIp"
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
    Invoke-CfApi PUT "https://api.cloudflare.com/client/v4/zones/$zoneId/dns_records/$($existing.id)" $payload | Out-Null
    Write-Log "Updated: $RecordName $($existing.content) -> $publicIp"
  }
  else {
    Invoke-CfApi POST "https://api.cloudflare.com/client/v4/zones/$zoneId/dns_records" $payload | Out-Null
    Write-Log "Created: $RecordName -> $publicIp (proxied=$Proxied)"
  }
}
catch {
  Write-Log "ERROR: $($_.Exception.Message)"
  exit 1
}
