[CmdletBinding()]
param(
    [string]$Version = "v1.7.0",
    [string]$OutputDir = ""
)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path "$PSScriptRoot\..").Path

if ([string]::IsNullOrWhiteSpace($OutputDir)) {
    $OutputDir = Join-Path $root "dist"
}

Write-Host "Packaging Financial-Data-Parser $Version..." -ForegroundColor Cyan

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

$zipFileName = "Financial-Data-Parser-$Version.zip"
$zipFilePath = Join-Path $OutputDir $zipFileName
$tempStageDir = Join-Path $OutputDir "stage_$([Guid]::NewGuid().ToString().Substring(0,8))"

try {
    New-Item -ItemType Directory -Path $tempStageDir -Force | Out-Null

    Copy-Item (Join-Path $root "index.html") $tempStageDir
    Copy-Item (Join-Path $root "README.md") $tempStageDir
    Copy-Item (Join-Path $root "CHANGELOG.md") $tempStageDir
    Copy-Item (Join-Path $root "LICENSE") $tempStageDir
    Copy-Item (Join-Path $root "css") $tempStageDir -Recurse
    Copy-Item (Join-Path $root "js") $tempStageDir -Recurse

    $offlineTxt = Join-Path $root "docs\README_OFFLINE.txt"
    if (Test-Path $offlineTxt) {
        Copy-Item $offlineTxt (Join-Path $tempStageDir "README_OFFLINE.txt")
    }

    if (Test-Path $zipFilePath) {
        Remove-Item $zipFilePath -Force
    }

    Write-Host "Compressing to $zipFileName..." -ForegroundColor Yellow
    Compress-Archive -Path "$tempStageDir\*" -DestinationPath $zipFilePath -CompressionLevel Optimal

    $zipSize = (Get-Item $zipFilePath).Length / 1MB
    $sizeStr = [Math]::Round($zipSize, 2)
    Write-Host "Package created successfully: $zipFilePath ($sizeStr MB)" -ForegroundColor Green

} finally {
    if (Test-Path $tempStageDir) {
        Remove-Item $tempStageDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}
