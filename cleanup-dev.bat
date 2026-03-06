@echo off
REM =============================================================================
REM Force cleanup of VIVIM development processes
REM This ensures all processes are killed when dev server exits
REM =============================================================================

echo Cleaning up VIVIM development processes...

REM Kill processes on specific ports
for %%p in (3000 5173 5174 5175 1235) do (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%%p "') do (
        if not "%%a"=="" (
            echo Killing process on port %%p: PID %%a
            powershell -Command "Stop-Process -Id %%a -Force -ErrorAction SilentlyContinue"
        )
    )
)

echo Cleanup complete.
timeout /t 1 >nul