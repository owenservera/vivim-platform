# Bun Install Script with Custom Temp Cache
$ErrorActionPreference = "Stop"

# Change to script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

# Set custom temp cache for Bun
$env:BUN_TEMP_CACHE = "C:\Users\VIVIM.inc\AppData\Local\Temp\bun-cache"

# Create the directory if it doesn't exist
New-Item -ItemType Directory -Force -Path $env:BUN_TEMP_CACHE | Out-Null

Write-Host "Using Bun temp cache: $env:BUN_TEMP_CACHE" -ForegroundColor Cyan
Write-Host ""

# Run bun install
Write-Host "Running bun install..." -ForegroundColor Yellow
bun install

Write-Host ""
Write-Host "Installation complete!" -ForegroundColor Green
