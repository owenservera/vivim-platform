-- OpenScroll Database Initialization
-- This script runs when the database is first created

-- Enable pgvector extension for vector search
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable pg_trgm for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enable uuid-ossp for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE acu_type AS ENUM (
        'statement',
        'question',
        'answer',
        'code_snippet',
        'formula',
        'table',
        'image',
        'tool_call',
        'unknown'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE acu_category AS ENUM (
        'technical',
        'conceptual',
        'procedural',
        'personal',
        'general'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE sharing_policy AS ENUM (
        'self',
        'circle',
        'network'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE openscroll TO openscroll;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO openscroll;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO openscroll;

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'OpenScroll database initialized successfully';
    RAISE NOTICE 'Extensions enabled: vector, pg_trgm, uuid-ossp';
    RAISE NOTICE 'Custom types created: acu_type, acu_category, sharing_policy';
END $$;
