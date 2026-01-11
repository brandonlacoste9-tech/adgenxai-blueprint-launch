-- Enable the pg_cron extension (should already be enabled in Supabase)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Function to refresh market research data
CREATE OR REPLACE FUNCTION refresh_market_research()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Log the cron job execution
  INSERT INTO cron_job_logs (job_name, executed_at, status, details)
  VALUES ('market-research-refresh', NOW(), 'started', 'Beginning market research refresh');

  -- Here you would implement the actual market research refresh logic
  -- For example:
  -- 1. Clear old cached research data
  -- 2. Trigger new research via edge functions
  -- 3. Update market trends cache
  -- 4. Send notifications if significant changes detected

  -- Example implementation:
  -- UPDATE market_research_cache
  -- SET last_updated = NOW(),
  --     status = 'refreshing'
  -- WHERE last_updated < NOW() - INTERVAL '24 hours';

  -- Log successful completion
  INSERT INTO cron_job_logs (job_name, executed_at, status, details)
  VALUES ('market-research-refresh', NOW(), 'completed', 'Market research refresh completed successfully');

EXCEPTION
  WHEN OTHERS THEN
    -- Log any errors
    INSERT INTO cron_job_logs (job_name, executed_at, status, details)
    VALUES ('market-research-refresh', NOW(), 'failed', SQLERRM);

    -- Re-raise the exception
    RAISE;
END;
$$;

-- Function to clean up old demo campaigns
CREATE OR REPLACE FUNCTION cleanup_old_demo_campaigns()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete demo campaigns older than 7 days
  DELETE FROM campaigns
  WHERE created_at < NOW() - INTERVAL '7 days'
    AND is_demo = true;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Log the cleanup
  INSERT INTO cron_job_logs (job_name, executed_at, status, details)
  VALUES ('demo-cleanup', NOW(), 'completed',
    format('Cleaned up %s old demo campaigns', deleted_count));

EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO cron_job_logs (job_name, executed_at, status, details)
    VALUES ('demo-cleanup', NOW(), 'failed', SQLERRM);
    RAISE;
END;
$$;

-- Function to send daily usage reports
CREATE OR REPLACE FUNCTION send_daily_usage_report()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  user_count INTEGER;
  campaign_count INTEGER;
  total_credits_used INTEGER;
BEGIN
  -- Get usage stats
  SELECT COUNT(*) INTO user_count FROM auth.users WHERE created_at >= NOW() - INTERVAL '24 hours';
  SELECT COUNT(*) INTO campaign_count FROM campaigns WHERE created_at >= NOW() - INTERVAL '24 hours';
  SELECT COALESCE(SUM(credits_used), 0) INTO total_credits_used FROM campaigns WHERE created_at >= NOW() - INTERVAL '24 hours';

  -- Log the report
  INSERT INTO cron_job_logs (job_name, executed_at, status, details)
  VALUES ('daily-usage-report', NOW(), 'completed',
    format('Daily Report: %s new users, %s campaigns, %s credits used',
           user_count, campaign_count, total_credits_used));

EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO cron_job_logs (job_name, executed_at, status, details)
    VALUES ('daily-usage-report', NOW(), 'failed', SQLERRM);
    RAISE;
END;
$$;

-- Create the cron jobs using pg_cron

-- Daily market research refresh at 9:00 AM EST
SELECT cron.schedule(
  'daily-research-refresh',
  '0 13 * * *',  -- 9 AM EST (UTC-4) = 1 PM UTC, adjust for your timezone
  $$ SELECT refresh_market_research(); $$
);

-- Weekly demo cleanup every Sunday at 2:00 AM EST
SELECT cron.schedule(
  'weekly-demo-cleanup',
  '0 6 * * 0',  -- 2 AM EST Sunday (UTC-4) = 6 AM UTC Sunday
  $$ SELECT cleanup_old_demo_campaigns(); $$
);

-- Daily usage report at 6:00 AM EST
SELECT cron.schedule(
  'daily-usage-report',
  '0 10 * * *',  -- 6 AM EST (UTC-4) = 10 AM UTC
  $$ SELECT send_daily_usage_report(); $$
);

-- Create a table to log cron job executions (if it doesn't exist)
CREATE TABLE IF NOT EXISTS cron_job_logs (
  id SERIAL PRIMARY KEY,
  job_name TEXT NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL, -- 'started', 'completed', 'failed'
  details TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cron_job_logs_job_name ON cron_job_logs(job_name);
CREATE INDEX IF NOT EXISTS idx_cron_job_logs_executed_at ON cron_job_logs(executed_at);
CREATE INDEX IF NOT EXISTS idx_cron_job_logs_status ON cron_job_logs(status);

-- Grant permissions
GRANT ALL ON cron_job_logs TO authenticated;
GRANT USAGE ON SEQUENCE cron_job_logs_id_seq TO authenticated;