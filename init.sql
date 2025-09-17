-- Initialize database for trading app
-- This file will run when the container starts for the first time

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set up any initial database configurations
ALTER DATABASE trading_app_db SET timezone TO 'UTC';
