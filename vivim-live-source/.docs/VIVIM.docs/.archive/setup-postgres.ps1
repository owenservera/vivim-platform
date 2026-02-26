# OpenScroll PostgreSQL Setup Script
# Installs required extensions for the dynamic context engine

Write-Host "Setting up OpenScroll PostgreSQL database extensions..." -ForegroundColor Green

# Configuration - adjust these values if your setup is different
$hostName = "localhost"
$port = "5432"
$dbName = "openscroll"
$username = "postgres"  # Change this if you're using a different admin user

Write-Host "Connecting to PostgreSQL at $hostName`:$port" -ForegroundColor Yellow
Write-Host "Database: $dbName" -ForegroundColor Yellow
Write-Host "User: $username" -ForegroundColor Yellow

# Check if psql is available
if (!(Get-Command psql -ErrorAction SilentlyContinue)) {
    Write-Host "Error: psql command not found. Please make sure PostgreSQL is installed and added to your PATH." -ForegroundColor Red
    Write-Host "You can download PostgreSQL from: https://www.postgresql.org/download/" -ForegroundColor Red
    exit 1
}

# Test connection first
Write-Host "`nTesting database connection..." -ForegroundColor Cyan
$result = $null
try {
    $result = psql -h $hostName -p $port -U $username -d $dbName -c "SELECT 1;" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Connection successful!" -ForegroundColor Green
    } else {
        Write-Host "✗ Connection failed. Please check your database configuration." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Connection failed. Please check your database configuration." -ForegroundColor Red
    exit 1
}

# Install extensions
$extensions = @(
    @{"name" = "vector"; "description" = "pgvector extension for vector search"},
    @{"name" = "pg_trgm"; "description" = "pg_trgm extension for fuzzy text search"},
    @{"name" = "uuid-ossp"; "description" = "uuid-ossp extension for UUID generation"}
)

foreach ($ext in $extensions) {
    Write-Host "`nInstalling $($ext.description)..." -ForegroundColor Cyan
    
    $sqlCmd = "CREATE EXTENSION IF NOT EXISTS $($ext.name);"
    
    try {
        $result = psql -h $hostName -p $port -U $username -d $dbName -c $sqlCmd
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ $($ext.description) installed successfully!" -ForegroundColor Green
        } else {
            Write-Host "✗ Failed to install $($ext.description)" -ForegroundColor Red
        }
    } catch {
        Write-Host "✗ Error installing $($ext.description): $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Verify extensions are installed
Write-Host "`nVerifying installed extensions..." -ForegroundColor Cyan
$sqlVerify = "SELECT extname FROM pg_extension WHERE extname IN ('vector', 'pg_trgm', 'uuid-ossp');"
$result = psql -h $hostName -p $port -U $username -d $dbName -c $sqlVerify

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Extensions verification completed!" -ForegroundColor Green
    Write-Host $result
} else {
    Write-Host "✗ Extensions verification failed" -ForegroundColor Red
}

# Create custom types if they don't exist
Write-Host "`nCreating custom enum types..." -ForegroundColor Cyan

$enumTypes = @(
    @{
        name = "acu_type"
        values = @("'statement'", "'question'", "'answer'", "'code_snippet'", "'formula'", "'table'", "'image'", "'tool_call'", "'unknown'")
    },
    @{
        name = "acu_category" 
        values = @("'technical'", "'conceptual'", "'procedural'", "'personal'", "'general'")
    },
    @{
        name = "sharing_policy"
        values = @("'self'", "'circle'", "'network'")
    }
)

foreach ($type in $enumTypes) {
    $sqlCmd = @"
DO \$\$ BEGIN
    CREATE TYPE $($type.name) AS ENUM (@($($type.values -join ',')));
EXCEPTION
    WHEN duplicate_object THEN null;
END \$\$;
"@
    
    try {
        $result = psql -h $hostName -p $port -U $username -d $dbName -c $sqlCmd
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Custom type $($type.name) created successfully!" -ForegroundColor Green
        } else {
            Write-Host "? Custom type $($type.name) may already exist (this is OK)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "? Error creating custom type $($type.name): $($_.Exception.Message) (this might be OK if it already exists)" -ForegroundColor Yellow
    }
}

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host "OpenScroll PostgreSQL setup completed!" -ForegroundColor Green
Write-Host "Required extensions have been installed." -ForegroundColor Green
Write-Host "The dynamic context engine should now work properly." -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Restart your server application if it's running" -ForegroundColor White
Write-Host "2. The AI integration with dynamic context engine should now work" -ForegroundColor White