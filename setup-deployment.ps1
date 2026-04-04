# VIVIM PWA - Deployment Setup Script
# Run this after setting up your Supabase and Vercel accounts

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  VIVIM PWA Deployment Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
$envFile = "pwa\.env.local"
if (Test-Path $envFile) {
    Write-Host "[✓] Environment file exists: $envFile" -ForegroundColor Green
} else {
    Write-Host "[!] Creating environment file template..." -ForegroundColor Yellow
    
    $envContent = @"
# Supabase Configuration (REQUIRED)
# Get these from: https://supabase.com/dashboard/project/_/settings/api
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# API Configuration (Optional - if using custom backend)
# VITE_API_BASE_URL=http://localhost:3000
# VITE_WS_URL=ws://localhost:3000
"@
    
    $envContent | Out-File -FilePath $envFile -Encoding UTF8
    Write-Host "[✓] Created: $envFile" -ForegroundColor Green
    Write-Host "[!] Please fill in your Supabase credentials" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Next Steps" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Setup Supabase:" -ForegroundColor White
Write-Host "   - Go to: https://supabase.com/dashboard" -ForegroundColor DarkGray
Write-Host "   - Create a new project" -ForegroundColor DarkGray
Write-Host "   - Copy Project URL and anon key" -ForegroundColor DarkGray
Write-Host "   - Run SQL migration: supabase/migrations/001_initial_schema.sql" -ForegroundColor DarkGray
Write-Host ""
Write-Host "2. Update Environment:" -ForegroundColor White
Write-Host "   - Edit: pwa\.env.local" -ForegroundColor DarkGray
Write-Host "   - Add VITE_SUPABASE_URL" -ForegroundColor DarkGray
Write-Host "   - Add VITE_SUPABASE_ANON_KEY" -ForegroundColor DarkGray
Write-Host ""
Write-Host "3. Test Locally:" -ForegroundColor White
Write-Host "   - Run: bun run dev" -ForegroundColor DarkGray
Write-Host "   - Visit: http://localhost:5173" -ForegroundColor DarkGray
Write-Host ""
Write-Host "4. Deploy to Vercel:" -ForegroundColor White
Write-Host "   - Go to: https://vercel.com/new" -ForegroundColor DarkGray
Write-Host "   - Import your GitHub repository" -ForegroundColor DarkGray
Write-Host "   - Add environment variables" -ForegroundColor DarkGray
Write-Host "   - Click Deploy!" -ForegroundColor DarkGray
Write-Host ""
Write-Host "5. Setup GitHub Actions (Optional):" -ForegroundColor White
Write-Host "   - Add secrets to your GitHub repository" -ForegroundColor DarkGray
Write-Host "   - See: PWA_QUICK_START.md for details" -ForegroundColor DarkGray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Documentation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📖 PWA_QUICK_START.md - Quick 5-minute setup" -ForegroundColor White
Write-Host "📖 PWA_PUBLISHING_ARCHITECTURE.md - Complete technical guide" -ForegroundColor White
Write-Host "📖 PWA_IMPLEMENTATION_CHECKLIST.md - Track your progress" -ForegroundColor White
Write-Host "📖 PWA_PUBLISHING_SUMMARY.md - Visual overview" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test build
Write-Host "Testing build..." -ForegroundColor Yellow
Write-Host ""

& bun run build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✓ Build Successful!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your PWA is ready for deployment! 🚀" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  ✗ Build Failed" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please fix the errors above and try again." -ForegroundColor Yellow
    Write-Host ""
}
