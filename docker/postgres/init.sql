-- OpenProvena — PostgreSQL init script
-- Runs once on first container startup

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- Full-text similarity search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- GIN indexes for JSONB

-- Useful indexes (SQLAlchemy creates tables; this adds extras)
-- Applied after table creation by the app startup

-- Read-only analytics role (for Grafana / BI tools)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'provena_readonly') THEN
    CREATE ROLE provena_readonly LOGIN PASSWORD 'readonly_provena';
    GRANT CONNECT ON DATABASE openprovena TO provena_readonly;
    GRANT USAGE ON SCHEMA public TO provena_readonly;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO provena_readonly;
  END IF;
END $$;
