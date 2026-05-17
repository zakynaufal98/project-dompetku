$ErrorActionPreference = 'Stop'

$wrapperRoot = Split-Path -Parent $PSScriptRoot
$projectRoot = Split-Path -Parent $wrapperRoot
$distDir = Join-Path $projectRoot 'dist'
$wwwDir = Join-Path $wrapperRoot 'www'

if (-not (Test-Path $distDir)) {
  throw "Folder build tidak ditemukan di '$distDir'. Jalankan 'npm run build' dari root project dulu."
}

if (Test-Path $wwwDir) {
  Remove-Item -LiteralPath $wwwDir -Recurse -Force
}

New-Item -ItemType Directory -Path $wwwDir | Out-Null
Copy-Item -Path (Join-Path $distDir '*') -Destination $wwwDir -Recurse -Force

Write-Host "Web assets berhasil disalin ke $wwwDir"
