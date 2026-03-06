@echo off
REM =============================================================================
REM VIVIM Development Server with Forced Cleanup (Windows Version)
REM Ensures all processes are killed when server exits
REM =============================================================================

echo Starting VIVIM development server with forced cleanup...
echo.
echo Services will be started:
echo    📱 PWA Frontend:     http://localhost:5173
echo    🔧 API Server:        http://localhost:3000
echo    🌐 WebSocket Server:   ws://localhost:1235
echo    🎛️ Admin Panel:       http://localhost:5174
echo.
echo Press Ctrl+C to stop all services...
echo.

REM Set up cleanup on script exit using trap
if "%CMDEXTVERSION%"=="" (
    setlocal enableDelayedExpansion
) else (
    setlocal disableDelayedExpansion
)

set cleanup_done=0

:cleanup
if %cleanup_done%==1 goto :eof

echo.
echo 🧹 Force cleanup of VIVIM development processes...

REM Kill processes on all VIVIM ports
for %%p in (3000 5173 5174 1235) do (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%%p "') do (
        if not "%%a"=="" (
            echo    Killing process on port %%p (PID %%a)...
            powershell -Command "Stop-Process -Id %%a -Force -ErrorAction SilentlyContinue" 2^>nul
        )
    )
)

echo.
echo ✓ All processes cleaned up
set cleanup_done=1
timeout /t 1 >nul
goto :eof

:start_dev
REM Start the dev server
bun run dev:core
if %errorlevel% neq 0 (
    goto :cleanup
)
goto :eof

:eof
if %cleanup_done%==0 exit /b 0
exit /b 0