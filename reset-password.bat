@echo off
REM =============================================================================
REM Quick Password Reset for Existing Database
REM This script helps you reset the openscroll user password
REM =============================================================================

echo ============================================================
echo VIVIM Database Password Reset
echo ============================================================
echo.
echo Your database EXISTS (migrations found), but the password
echo authentication is failing. Let's fix this.
echo.

echo [Step 1] Try common PostgreSQL superuser passwords...
echo.

REM Create a temporary SQL script
echo -- Try to reset openscroll user password > temp_reset.sql
echo -- This will work if you can connect as postgres superuser >> temp_reset.sql
echo. >> temp_reset.sql
echo -- First, try to alter the user password >> temp_reset.sql
echo ALTER USER openscroll WITH PASSWORD 'openscroll_dev_password'; >> temp_reset.sql
echo. >> temp_reset.sql
echo -- If that fails, the user might not exist, so create it >> temp_reset.sql
echo DO $$ >> temp_reset.sql
echo BEGIN >> temp_reset.sql
echo    IF NOT EXISTS (SELECT 1 FROM pg_user WHERE usename = 'openscroll') THEN >> temp_reset.sql
echo        CREATE USER openscroll WITH PASSWORD 'openscroll_dev_password'; >> temp_reset.sql
echo        GRANT ALL PRIVILEGES ON DATABASE openscroll TO openscroll; >> temp_reset.sql
echo        \c openscroll >> temp_reset.sql
echo        GRANT ALL ON SCHEMA public TO openscroll; >> temp_reset.sql
echo        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO openscroll; >> temp_reset.sql
echo        GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO openscroll; >> temp_reset.sql
echo    END IF; >> temp_reset.sql
echo END $$; >> temp_reset.sql
echo. >> temp_reset.sql
echo SELECT 'Password reset complete!' AS message; >> temp_reset.sql

REM Try common postgres passwords
for %%p in (postgres password root "" admin) do (
    echo Trying postgres password: %%p
    psql -U postgres -h localhost -f temp_reset.sql 2>nul
    if %errorlevel% equ 0 (
        echo.
        echo ✓ SUCCESS! Password reset complete with password: %%p
        echo.
        echo You can now run: bun run dev
        del temp_reset.sql
        pause
        exit /b 0
    )
)

echo.
echo ============================================================
echo Automatic reset failed. Let's try manual methods...
echo ============================================================
echo.
echo Please try one of these methods:
echo.
echo [Method 1] Use pgAdmin (recommended)
echo   1. Open pgAdmin (should be installed with PostgreSQL)
echo   2. Connect to your PostgreSQL server
echo   3. Find the openscroll user and reset password to: openscroll_dev_password
echo.
echo [Method 2] Modify pg_hba.conf temporarily (advanced)
echo   1. Open: C:/Program Files/PostgreSQL/18/data/pg_hba.conf
echo   2. Change 'scram-sha-256' to 'trust' for local connections
echo   3. Restart PostgreSQL service
echo   4. Run: psql -U postgres -h localhost -c "ALTER USER openscroll WITH PASSWORD 'openscroll_dev_password';"
echo   5. Change pg_hba.conf back to 'scram-sha-256'
echo   6. Restart PostgreSQL service
echo.
echo [Method 3] Reset postgres superuser password
echo   1. Stop PostgreSQL service
echo   2. Edit: C:/Program Files/PostgreSQL/18/data/pg_hba.conf
echo   3. Change 'scram-sha-256' to 'trust' for local connections
echo   4. Start PostgreSQL service
echo   5. Connect: psql -U postgres -h localhost
echo   6. Run: ALTER USER postgres WITH PASSWORD 'your_new_password';
echo   7. Change pg_hba.conf back to 'scram-sha-256'
echo   8. Restart PostgreSQL service
echo.
echo ============================================================
echo After fixing the password, run: bun run dev
echo ============================================================
del temp_reset.sql
pause