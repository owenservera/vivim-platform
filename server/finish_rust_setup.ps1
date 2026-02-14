# OpenScroll Rust Core Build Script
# This script builds the native NAPI module and installs it

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  OpenScroll Rust Core Build Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$CoreDir = Join-Path $ScriptDir "openscroll-core"
$NativeDir = Join-Path $ScriptDir "native"
$DataDir = Join-Path $ScriptDir "data\core-storage"

# Check if Cargo is available
if (!(Get-Command "cargo" -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Cargo/Rust not found. Please install Rust first:" -ForegroundColor Red
    Write-Host "  https://rustup.rs/" -ForegroundColor Yellow
    exit 1
}

# Check if openscroll-core exists
if (!(Test-Path $CoreDir)) {
    Write-Host "ERROR: openscroll-core directory not found at: $CoreDir" -ForegroundColor Red
    exit 1
}

Write-Host "[1/4] Building Rust Core with NAPI bindings..." -ForegroundColor Green
Set-Location $CoreDir

# Build with the 'node' feature for NAPI bindings
$env:CARGO_TARGET_DIR = "target_node"
cargo build --release --features "node"

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Cargo build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "[2/4] Locating compiled artifact..." -ForegroundColor Green

# Find the compiled .node file or .dll
$ArtifactPaths = @(
    (Join-Path $CoreDir "target_node\release\openscroll_core.node"),
    (Join-Path $CoreDir "target_node\release\openscroll_core.dll"),
    (Join-Path $CoreDir "target_node\release\libopenscroll_core.dll"),
    (Join-Path $CoreDir "target_node\release\libopenscroll_core.so")
)

$SourceArtifact = $null
foreach ($path in $ArtifactPaths) {
    if (Test-Path $path) {
        $SourceArtifact = $path
        break
    }
}

if (!$SourceArtifact) {
    Write-Host "ERROR: Could not find compiled artifact. Checking target_node/release/..." -ForegroundColor Red
    Get-ChildItem (Join-Path $CoreDir "target_node\release") | Where-Object { $_.Name -like "*openscroll*" } | Format-Table Name, Length
    exit 1
}

Write-Host "  Found: $SourceArtifact" -ForegroundColor Cyan

Write-Host "[3/4] Installing to native directory..." -ForegroundColor Green

# Ensure native directory exists
if (!(Test-Path $NativeDir)) {
    New-Item -ItemType Directory -Path $NativeDir -Force | Out-Null
}

# Copy and rename to .node
$DestPath = Join-Path $NativeDir "openscroll_core.node"
Copy-Item $SourceArtifact $DestPath -Force
Write-Host "  Installed: $DestPath" -ForegroundColor Cyan

Write-Host "[4/4] Creating data directory..." -ForegroundColor Green

# Ensure data directory exists
if (!(Test-Path $DataDir)) {
    New-Item -ItemType Directory -Path $DataDir -Force | Out-Null
    Write-Host "  Created: $DataDir" -ForegroundColor Cyan
} else {
    Write-Host "  Already exists: $DataDir" -ForegroundColor Gray
}

Set-Location $ScriptDir

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Build Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Native module installed at: $DestPath" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Run 'bun install' to install dependencies" -ForegroundColor White
Write-Host "  2. Run 'bun run dev' to start the server" -ForegroundColor White
Write-Host ""
