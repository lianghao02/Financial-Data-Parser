[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::UTF8
# 重新編譯 css/tailwind.css。只在開發時需要網路（npx 下載 Tailwind CLI），網頁執行時完全離線。
$root = Split-Path -Parent $PSScriptRoot
Push-Location $root
try {
    & npx --yes tailwindcss@3.4.17 -c (Join-Path $PSScriptRoot 'tailwind.config.js') -i (Join-Path $PSScriptRoot 'tailwind-input.css') -o (Join-Path $root 'css\tailwind.css') --minify
    if ($LASTEXITCODE -ne 0) { throw 'Tailwind CSS 編譯失敗。' }
    Write-Output '已更新 css/tailwind.css。'
} finally { Pop-Location }
