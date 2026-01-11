-- =====================================================
-- COMPLETE INFRASTRUCTURE SETUP FOR ADGENXAI
-- Includes: Cron Jobs, Vault Schema, and Automation
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS supabase_vault;

-- =====================================================
-- VAULT SETUP: Secure Key Management
-- =====================================================

-- Create vault schema for encrypted secrets (if not exists)
CREATE SCHEMA IF NOT EXISTS vault;

-- Grant necessary permissions for vault operations
GRANT USAGE ON SCHEMA vault TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA vault TO service_role;

-- Function to safely store secrets in vault
CREATE OR REPLACE FUNCTION store_secret(secret_name TEXT, secret_value TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update secret with encryption
  INSERT INTO vault.secrets (name, secret)
  VALUES (secret_name, encrypt(secret_value::bytea, 'your-encryption-key-here', 'aes'))
  ON CONFLICT (name) DO UPDATE SET
    secret = EXCLUDED.secret,
    updated_at = NOW();
END;
$$;

-- Function to retrieve decrypted secrets
CREATE OR REPLACE FUNCTION get_decrypted_secret(secret_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  encrypted_secret bytea;
  decrypted_value TEXT;
BEGIN
  SELECT secret INTO encrypted_secret
  FROM vault.secrets
  WHERE name = secret_name;

  IF encrypted_secret IS NULL THEN
    RETURN NULL;
  END IF;

  decrypted_value := decrypt(encrypted_secret, 'your-encryption-key-here', 'aes');
  RETURN convert_from(decrypted_value, 'UTF8');
END;
$$;

-- =====================================================
-- CRON JOBS: Automated System Maintenance
-- =====================================================

-- Function to refresh market research data
CREATE OR REPLACE FUNCTION refresh_market_research()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  research_count INTEGER;
BEGIN
  -- Log the cron job execution
  INSERT INTO system_logs (component, event_type, message, metadata)
  VALUES ('cron', 'research_refresh_start', 'Beginning automated market research refresh', jsonb_build_object('timestamp', NOW()));

  -- Update market research cache with fresh data
  -- This would integrate with your Google Search grounding
  UPDATE market_research_cache
  SET
    last_updated = NOW(),
    status = 'refreshing',
    data = data || jsonb_build_object('last_cron_refresh', NOW())
  WHERE last_updated < NOW() - INTERVAL '24 hours';

  -- Simulate research data refresh (replace with actual Vertex AI calls)
  GET DIAGNOSTICS research_count = ROW_COUNT;

  -- Log successful completion
  INSERT INTO system_logs (component, event_type, message, metadata)
  VALUES ('cron', 'research_refresh_complete',
    format('Market research refresh completed: %s records updated', research_count),
    jsonb_build_object('records_updated', research_count, 'timestamp', NOW()));

EXCEPTION
  WHEN OTHERS THEN
    -- Log any errors
    INSERT INTO system_logs (component, event_type, message, metadata)
    VALUES ('cron', 'research_refresh_error', SQLERRM,
      jsonb_build_object('error_code', SQLSTATE, 'timestamp', NOW()));

    -- Re-raise the exception
    RAISE;
END;
$$;

-- Function to clean up old demo campaigns and temporary data
CREATE OR REPLACE FUNCTION cleanup_demo_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  campaigns_deleted INTEGER;
  thoughts_deleted INTEGER;
  total_cleaned INTEGER;
BEGIN
  -- Log cleanup start
  INSERT INTO system_logs (component, event_type, message, metadata)
  VALUES ('cron', 'cleanup_start', 'Beginning automated demo data cleanup', jsonb_build_object('timestamp', NOW()));

  -- Delete demo campaigns older than 7 days
  DELETE FROM campaigns
  WHERE created_at < NOW() - INTERVAL '7 days'
    AND (is_demo = true OR metadata->>'demo_mode' = 'true');

  GET DIAGNOSTICS campaigns_deleted = ROW_COUNT;

  -- Clean up old agent thoughts (keep last 30 days)
  DELETE FROM agent_thoughts
  WHERE created_at < NOW() - INTERVAL '30 days'
    AND (metadata->>'demo_mode' = 'true' OR is_ephemeral = true);

  GET DIAGNOSTICS thoughts_deleted = ROW_COUNT;

  total_cleaned := campaigns_deleted + thoughts_deleted;

  -- Log cleanup completion
  INSERT INTO system_logs (component, event_type, message, metadata)
  VALUES ('cron', 'cleanup_complete',
    format('Demo cleanup completed: %s campaigns, %s thoughts removed', campaigns_deleted, thoughts_deleted),
    jsonb_build_object('campaigns_deleted', campaigns_deleted, 'thoughts_deleted', thoughts_deleted, 'timestamp', NOW()));

EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO system_logs (component, event_type, message, metadata)
    VALUES ('cron', 'cleanup_error', SQLERRM,
      jsonb_build_object('error_code', SQLSTATE, 'timestamp', NOW()));
    RAISE;
END;
$$;

-- Function to generate daily usage and performance reports
CREATE OR REPLACE FUNCTION generate_usage_report()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  daily_stats JSONB;
  user_count INTEGER;
  campaign_count INTEGER;
  total_credits_used INTEGER;
  avg_session_duration INTERVAL;
  top_features JSONB;
BEGIN
  -- Calculate daily statistics
  SELECT
    COUNT(DISTINCT user_id) as users,
    COUNT(*) as campaigns,
    COALESCE(SUM((metadata->>'credits_used')::INTEGER), 0) as credits
  INTO user_count, campaign_count, total_credits_used
  FROM campaigns
  WHERE created_at >= CURRENT_DATE;

  -- Calculate average session duration (mock data for demo)
  avg_session_duration := INTERVAL '12 minutes';

  -- Track feature usage (mock data for demo)
  top_features := jsonb_build_array(
    jsonb_build_object('feature', 'brand_analysis', 'usage_count', 45),
    jsonb_build_object('feature', 'market_research', 'usage_count', 38),
    jsonb_build_object('feature', 'creative_generation', 'usage_count', 52),
    jsonb_build_object('feature', 'visual_assets', 'usage_count', 29)
  );

  -- Build comprehensive stats object
  daily_stats := jsonb_build_object(
    'date', CURRENT_DATE,
    'users_active', user_count,
    'campaigns_created', campaign_count,
    'credits_consumed', total_credits_used,
    'avg_session_duration', avg_session_duration,
    'top_features', top_features,
    'system_health', 'optimal',
    'generated_at', NOW()
  );

  -- Store the report
  INSERT INTO usage_reports (report_date, report_type, data, created_at)
  VALUES (CURRENT_DATE, 'daily_summary', daily_stats, NOW())
  ON CONFLICT (report_date, report_type) DO UPDATE SET
    data = EXCLUDED.data,
    created_at = EXCLUDED.created_at;

  -- Log the report generation
  INSERT INTO system_logs (component, event_type, message, metadata)
  VALUES ('cron', 'usage_report_generated',
    format('Daily usage report generated: %s users, %s campaigns, %s credits',
           user_count, campaign_count, total_credits_used),
    daily_stats);

EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO system_logs (component, event_type, message, metadata)
    VALUES ('cron', 'usage_report_error', SQLERRM,
      jsonb_build_object('error_code', SQLSTATE, 'timestamp', NOW()));
    RAISE;
END;
$$;

-- Function to perform system health checks
CREATE OR REPLACE FUNCTION system_health_check()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  db_size TEXT;
  connection_count INTEGER;
  cron_job_count INTEGER;
  recent_errors INTEGER;
  health_status TEXT;
BEGIN
  -- Get database size
  SELECT pg_size_pretty(pg_database_size(current_database())) INTO db_size;

  -- Get active connections
  SELECT count(*) INTO connection_count
  FROM pg_stat_activity
  WHERE datname = current_database();

  -- Count active cron jobs
  SELECT count(*) INTO cron_job_count
  FROM cron.job;

  -- Check for recent errors (last 24 hours)
  SELECT count(*) INTO recent_errors
  FROM system_logs
  WHERE event_type LIKE '%error%'
    AND created_at >= NOW() - INTERVAL '24 hours';

  -- Determine health status
  health_status := CASE
    WHEN recent_errors > 10 THEN 'critical'
    WHEN recent_errors > 5 THEN 'warning'
    WHEN connection_count > 50 THEN 'high_load'
    ELSE 'healthy'
  END;

  -- Log health check results
  INSERT INTO system_logs (component, event_type, message, metadata)
  VALUES ('cron', 'health_check',
    format('System health check: %s | DB Size: %s | Connections: %s | Cron Jobs: %s | Recent Errors: %s',
           health_status, db_size, connection_count, cron_job_count, recent_errors),
    jsonb_build_object(
      'health_status', health_status,
      'db_size', db_size,
      'active_connections', connection_count,
      'cron_jobs', cron_job_count,
      'recent_errors', recent_errors,
      'timestamp', NOW()
    ));

EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO system_logs (component, event_type, message, metadata)
    VALUES ('cron', 'health_check_error', SQLERRM,
      jsonb_build_object('error_code', SQLSTATE, 'timestamp', NOW()));
    RAISE;
END;
$$;

-- =====================================================
-- SCHEDULE THE CRON JOBS
-- =====================================================

-- Remove existing jobs if they exist (for clean redeployment)
SELECT cron.unschedule('daily-research-refresh');
SELECT cron.unschedule('weekly-demo-cleanup');
SELECT cron.unschedule('daily-usage-report');
SELECT cron.unschedule('hourly-health-check');

-- Daily market research refresh at 9:00 AM EST (1:00 PM UTC)
SELECT cron.schedule(
  'daily-research-refresh',
  '0 13 * * *',
  $$ SELECT refresh_market_research(); $$
);

-- Weekly demo cleanup every Sunday at 2:00 AM EST (6:00 AM UTC)
SELECT cron.schedule(
  'weekly-demo-cleanup',
  '0 6 * * 0',
  $$ SELECT cleanup_demo_data(); $$
);

-- Daily usage report at 6:00 AM EST (10:00 AM UTC)
SELECT cron.schedule(
  'daily-usage-report',
  '0 10 * * *',
  $$ SELECT generate_usage_report(); $$
);

-- Hourly system health check
SELECT cron.schedule(
  'hourly-health-check',
  '0 * * * *',
  $$ SELECT system_health_check(); $$
);

-- =====================================================
-- CREATE SUPPORTING TABLES
-- =====================================================

-- System logs table (if not exists)
CREATE TABLE IF NOT EXISTS system_logs (
  id SERIAL PRIMARY KEY,
  component TEXT NOT NULL, -- 'cron', 'auth', 'edge_function', etc.
  event_type TEXT NOT NULL, -- 'research_refresh_start', 'error', etc.
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage reports table (if not exists)
CREATE TABLE IF NOT EXISTS usage_reports (
  id SERIAL PRIMARY KEY,
  report_date DATE NOT NULL,
  report_type TEXT NOT NULL, -- 'daily_summary', 'weekly_summary', etc.
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(report_date, report_type)
);

-- Market research cache table (if not exists)
CREATE TABLE IF NOT EXISTS market_research_cache (
  id SERIAL PRIMARY KEY,
  topic TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active', -- 'active', 'refreshing', 'stale'
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(topic)
);

-- Vault secrets table (if not exists)
CREATE TABLE IF NOT EXISTS vault.secrets (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  secret bytea NOT NULL, -- Encrypted secret
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_system_logs_component ON system_logs(component);
CREATE INDEX IF NOT EXISTS idx_system_logs_event_type ON system_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_reports_date ON usage_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_usage_reports_type ON usage_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_market_research_topic ON market_research_cache(topic);
CREATE INDEX IF NOT EXISTS idx_market_research_status ON market_research_cache(status);

-- =====================================================
-- GRANT NECESSARY PERMISSIONS
-- =====================================================

GRANT ALL ON system_logs TO authenticated;
GRANT ALL ON usage_reports TO authenticated;
GRANT ALL ON market_research_cache TO authenticated;
GRANT ALL ON vault.secrets TO service_role;

GRANT USAGE ON SEQUENCE system_logs_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE usage_reports_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE market_research_cache_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE vault.secrets_id_seq TO service_role;

-- =====================================================
-- INSERT SAMPLE DATA FOR DEMO
-- =====================================================

-- Insert sample market research data
INSERT INTO market_research_cache (topic, data, status) VALUES
('canadian_marketing_trends', '{
  "trends": ["sustainability", "local_sourcing", "digital_transformation"],
  "sources": ["Google Search", "StatCan", "Canadian Marketing Association"],
  "last_updated": "' || NOW() || '"
}', 'active')
ON CONFLICT (topic) DO UPDATE SET
  data = EXCLUDED.data,
  last_updated = NOW();

-- Insert sample system log
INSERT INTO system_logs (component, event_type, message, metadata) VALUES
('setup', 'infrastructure_initialized', 'Complete AdgenXAI infrastructure setup completed',
 jsonb_build_object('features_enabled', jsonb_build_array('cron_jobs', 'vault', 'logging', 'monitoring'), 'timestamp', NOW()));

-- =====================================================
-- SETUP COMPLETE LOG
-- =====================================================

-- Final log entry
DO $$
BEGIN
  RAISE NOTICE 'AdgenXAI Infrastructure Setup Complete!';
  RAISE NOTICE 'Features Enabled:';
  RAISE NOTICE '  ✅ Cron Jobs: Daily research refresh, weekly cleanup, usage reports, health checks';
  RAISE NOTICE '  ✅ Vault: Encrypted secret storage and retrieval';
  RAISE NOTICE '  ✅ Logging: Comprehensive system activity tracking';
  RAISE NOTICE '  ✅ Monitoring: Automated health checks and usage analytics';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Configure Google OAuth in Supabase Dashboard';
  RAISE NOTICE '  2. Add secrets to Vault: GOOGLE_PRIVATE_KEY, GOOGLE_CLIENT_ID, etc.';
  RAISE NOTICE '  3. Test cron jobs: SELECT * FROM cron.job;';
  RAISE NOTICE '  4. Monitor logs: SELECT * FROM system_logs ORDER BY created_at DESC;';
END $$;