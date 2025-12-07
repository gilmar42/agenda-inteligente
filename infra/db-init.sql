-- Initialize PostgreSQL for local dev
-- Creates user 'app' with password 'app' and database 'agenda'

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app'
  ) THEN
    CREATE ROLE app LOGIN PASSWORD 'app';
  END IF;
END
$$;

-- Create database if not exists (Postgres lacks CREATE DATABASE IF NOT EXISTS, so do a check)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_database WHERE datname = 'agenda'
  ) THEN
    CREATE DATABASE agenda OWNER app ENCODING 'UTF8';
  END IF;
END
$$;

GRANT ALL PRIVILEGES ON DATABASE agenda TO app;
