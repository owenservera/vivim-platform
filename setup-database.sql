-- =============================================================================
-- VIVIM Database Setup Script
-- =============================================================================
-- This script creates the openscroll database and user with correct permissions
-- Run this as the postgres superuser
-- =============================================================================

-- Create the openscroll user with password
CREATE USER openscroll WITH PASSWORD 'openscroll_dev_password';

-- Create the openscroll database
CREATE DATABASE openscroll OWNER openscroll;

-- Grant all privileges on the database to the openscroll user
GRANT ALL PRIVILEGES ON DATABASE openscroll TO openscroll;

-- Connect to the openscroll database and grant schema privileges
\c openscroll

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO openscroll;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO openscroll;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO openscroll;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO openscroll;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO openscroll;

-- Display success message
SELECT 'Database setup complete! openscroll user and database are ready.' AS message;