<#
.SYNOPSIS
  Builds Angular + .NET and stages a folder ready to copy to the IIS site.

.DESCRIPTION
  - ng build (production)
  - dotnet publish (Release)
  - Copies SPA into publish/wwwroot
  - Does NOT overwrite server uploads/ or appsettings.Production.json when -SitePath is set
    (sync skips those paths). Use -SitePath only on the Windows Server (or a mapped share).

.EXAMPLE
  .\scripts\Publish-YLWork.ps1

.EXAMPLE
  .\scripts\Publish-YLWork.ps1 -SitePath 'C:\inetpub\ylwork' -IisSiteName 'YLWork'
#>
[CmdletBinding()]
param(
    [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path,
    [string]$PublishDir = '',
    [string]$SitePath = '',
    [string]$IisSiteName = '',
    [switch]$SkipFrontend,
    [switch]$SkipBackend
)

$ErrorActionPreference = 'Stop'

if (-not $PublishDir) {
    $PublishDir = Join-Path $RepoRoot 'artifacts\publish'
}

$frontendDir = Join-Path $RepoRoot 'frontend'
$backendDir = Join-Path $RepoRoot 'backend'
$angularDist = Join-Path $frontendDir 'dist\YLWorkLatest\browser'

Write-Host "==> Repo: $RepoRoot"
Write-Host "==> Publish output: $PublishDir"

function Assert-LastExitCode([string]$step) {
    if ($null -eq $LASTEXITCODE) { return }
    if ($LASTEXITCODE -ne 0) {
        throw "$step failed with exit code $LASTEXITCODE"
    }
}

if (-not $SkipFrontend) {
    Write-Host '==> Building Angular (production)...'
    Write-Host '    Tip: stop `npm start` / `ng serve` first — they lock native modules and break npm ci.'
    Push-Location $frontendDir
    try {
        if (Test-Path (Join-Path $frontendDir 'package-lock.json')) {
            npm ci
            Assert-LastExitCode 'npm ci'
        } else {
            npm install
            Assert-LastExitCode 'npm install'
        }
        npx ng build --configuration=production
        Assert-LastExitCode 'ng build'
    } finally {
        Pop-Location
    }

    if (-not (Test-Path $angularDist)) {
        # Older Angular layouts put files directly under dist/YLWorkLatest
        $alt = Join-Path $frontendDir 'dist\YLWorkLatest'
        if (Test-Path (Join-Path $alt 'index.html')) {
            $angularDist = $alt
        } else {
            throw "Angular output not found. Expected index.html under dist/YLWorkLatest/browser or dist/YLWorkLatest"
        }
    }
}

if (-not $SkipBackend) {
    Write-Host '==> Publishing .NET (Release)...'
    if (Test-Path $PublishDir) {
        Remove-Item -Recurse -Force $PublishDir
    }
    New-Item -ItemType Directory -Path $PublishDir | Out-Null

    Push-Location $backendDir
    try {
        dotnet publish -c Release -o $PublishDir
        Assert-LastExitCode 'dotnet publish'
    } finally {
        Pop-Location
    }
}

$wwwroot = Join-Path $PublishDir 'wwwroot'
New-Item -ItemType Directory -Path $wwwroot -Force | Out-Null

if (-not $SkipFrontend) {
    Write-Host "==> Copying SPA into $wwwroot ..."
    Copy-Item -Path (Join-Path $angularDist '*') -Destination $wwwroot -Recurse -Force
}

$uploadsInPublish = Join-Path $PublishDir 'uploads'
New-Item -ItemType Directory -Path $uploadsInPublish -Force | Out-Null
$logsDir = Join-Path $PublishDir 'logs'
New-Item -ItemType Directory -Path $logsDir -Force | Out-Null

Write-Host '==> Staged publish folder ready.'

if ($SitePath) {
    if (-not (Test-Path $SitePath)) {
        New-Item -ItemType Directory -Path $SitePath -Force | Out-Null
    }

    $preserveUploads = Join-Path $SitePath 'uploads'
    $preserveSettings = Join-Path $SitePath 'appsettings.Production.json'
    $backupRoot = Join-Path (Split-Path $SitePath -Parent) ("ylwork-backup-{0:yyyyMMdd-HHmmss}" -f (Get-Date))

    Write-Host "==> Backing up current site to $backupRoot ..."
    if (Test-Path $SitePath) {
        New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null
        # Shallow backup of DLLs/config (uploads kept in place)
        Get-ChildItem $SitePath -Force |
            Where-Object { $_.Name -ne 'uploads' } |
            ForEach-Object {
                Copy-Item $_.FullName -Destination (Join-Path $backupRoot $_.Name) -Recurse -Force -ErrorAction SilentlyContinue
            }
    }

    if ($IisSiteName) {
        Write-Host "==> Stopping IIS site '$IisSiteName'..."
        Import-Module WebAdministration -ErrorAction Stop
        Stop-Website -Name $IisSiteName
    }

    Write-Host "==> Syncing publish -> $SitePath (preserving uploads + Production settings if present)..."
    $hadProductionSettings = Test-Path $preserveSettings
    $tempSettings = $null
    if ($hadProductionSettings) {
        $tempSettings = Join-Path $env:TEMP ("ylwork-appsettings.Production.{0}.json" -f ([guid]::NewGuid().ToString('N')))
        Copy-Item $preserveSettings $tempSettings -Force
    }

    # Robocopy: mirror app files but exclude uploads directory content wipe by not mirroring uploads away
    # /E copy subdirs including empty; /XD uploads; then restore settings
    $robolog = Join-Path $env:TEMP 'ylwork-robocopy.log'
    & robocopy $PublishDir $SitePath /E /XD uploads /NFL /NDL /NJH /NJS /nc /ns /np
    $rc = $LASTEXITCODE
    if ($rc -ge 8) {
        throw "robocopy failed with exit code $rc (see $robolog)"
    }

    if (-not (Test-Path $preserveUploads)) {
        New-Item -ItemType Directory -Path $preserveUploads -Force | Out-Null
    }

    if ($tempSettings) {
        Copy-Item $tempSettings $preserveSettings -Force
        Remove-Item $tempSettings -Force
        Write-Host '==> Restored existing appsettings.Production.json'
    } else {
        Write-Host '==> WARNING: No prior appsettings.Production.json on site. Edit placeholders before starting IIS.'
    }

    if ($IisSiteName) {
        Write-Host "==> Starting IIS site '$IisSiteName'..."
        Start-Website -Name $IisSiteName
    }

    Write-Host '==> Deploy to site path complete.'
} else {
    Write-Host @'
==> Next steps (on the Windows Server):
  1. Copy artifacts\publish\* to C:\inetpub\ylwork (or your site path)
  2. Do NOT wipe the existing uploads\ folder
  3. Edit appsettings.Production.json (connection string, JWT key, hostname)
  4. Set IIS App Pool identity write ACL on uploads\
  5. Recycle the app pool / start the site
  See docs\DEPLOY_IIS.md
'@
}
