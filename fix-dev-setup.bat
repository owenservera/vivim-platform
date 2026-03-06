@echo off
REM =============================================================================
REM VIVIM Development Environment Fix Script
REM This script fixes the database and setup issues
REM =============================================================================

echo ============================================================
echo VIVIM Development Environment Fix Script
echo ============================================================
echo.

REM Step 1: Check if PostgreSQL is running
echo [1/5] Checking PostgreSQL status...
netstat -ano | findstr ":5432" >nul
if %errorlevel% equ 0 (
    echo ✓ PostgreSQL is running on port 5432
) else (
    echo ✗ PostgreSQL is not running
    echo Please start PostgreSQL service first
    pause
    exit /b 1
)
echo.

REM Step 2: Create the database and user
echo [2/5] Setting up database...
echo You may be prompted for the postgres superuser password
echo.

REM Try to run the SQL setup script
psql -U postgres -h localhost -f setup-database.sql
if %errorlevel% equ 0 (
    echo ✓ Database setup completed successfully
) else (
    echo ✗ Database setup failed
    echo Please run the SQL script manually with the postgres superuser
    echo Command: psql -U postgres -h localhost -f setup-database.sql
)
echo.

REM Step 3: Test database connection
echo [3/5] Testing database connection...
node server/test-db-connection.js
if %errorlevel% equ 0 (
    echo ✓ Database connection test passed
) else (
    echo ✗ Database connection test failed
)
echo.

REM Step 4: Run Prisma migrations
echo [4/5] Running Prisma migrations...
cd server
bun run db:generate
if %errorlevel% equ 0 (
    echo ✓ Prisma client generated
) else (
    echo ✗ Prisma client generation failed
)

bun run db:migrate
if %errorlevel% equ 0 (
    echo ✓ Database migrations applied
) else (
    echo ✗ Database migrations failed
)
cd ..
echo.

REM Step 5: Start Redis (optional)
echo [5/5] Redis setup (optional)...
echo Redis is optional - the system will work with in-memory fallback
echo To enable Redis, run: docker run -d -p 6379:6379 --name vivim-redis redis:latest
echo.

echo ============================================================
echo Setup complete! You can now run: bun run dev
echo ============================================================
pause