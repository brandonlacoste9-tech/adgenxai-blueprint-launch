-- =====================================================
-- MISSION CONTROL DASHBOARD SCHEMA
-- Real-time agent logging and cost tracking
-- =====================================================

-- Create agent_logs table for live dashboard
CREATE TABLE IF NOT EXISTS agent_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_role TEXT NOT NULL CHECK (agent_role IN ('Planner', 'Researcher', 'Creative', 'Auditor', 'Receptionist')),
  action_type TEXT NOT NULL, -- 'CACHE_HIT', 'MODEL_ROUTING', 'RESEARCH_QUERY', etc.
  thought_vector TEXT NOT NULL, -- The actual thought/log message
  metadata JSONB DEFAULT '{}', -- Additional context data
  cost_saved_est DECIMAL(10,4), -- Estimated cost savings in USD
  campaign_id UUID REFERENCES campaigns(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_logs_agent_role ON agent_logs(agent_role);
CREATE INDEX IF NOT EXISTS idx_agent_logs_action_type ON agent_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_agent_logs_created_at ON agent_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_logs_campaign_id ON agent_logs(campaign_id);

-- Function to automatically log agent activities
CREATE OR REPLACE FUNCTION log_agent_activity(
  p_agent_role TEXT,
  p_action_type TEXT,
  p_thought_vector TEXT,
  p_metadata JSONB DEFAULT '{}',
  p_cost_saved_est DECIMAL(10,4) DEFAULT NULL,
  p_campaign_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO agent_logs (
    agent_role,
    action_type,
    thought_vector,
    metadata,
    cost_saved_est,
    campaign_id
  ) VALUES (
    p_agent_role,
    p_action_type,
    p_thought_vector,
    p_metadata,
    p_cost_saved_est,
    p_campaign_id
  ) RETURNING id INTO log_id;

  RETURN log_id;
END;
$$;

-- Function to get cost savings summary
CREATE OR REPLACE FUNCTION get_cost_savings_summary()
RETURNS TABLE (
  total_savings DECIMAL(10,2),
  cache_hits BIGINT,
  flash_lite_usage BIGINT,
  receptionist_responses BIGINT,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(cost_saved_est), 0) as total_savings,
    COUNT(*) FILTER (WHERE action_type = 'CACHE_HIT') as cache_hits,
    COUNT(*) FILTER (WHERE action_type = 'FLASH_LITE_ROUTING') as flash_lite_usage,
    COUNT(*) FILTER (WHERE agent_role = 'Receptionist') as receptionist_responses,
    MIN(created_at) as period_start,
    MAX(created_at) as period_end
  FROM agent_logs
  WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';
END;
$$;

-- Grant permissions
GRANT ALL ON agent_logs TO authenticated;
GRANT EXECUTE ON FUNCTION log_agent_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_cost_savings_summary TO authenticated;

-- =====================================================
-- INSERT DEMO DATA FOR MISSION CONTROL
-- =====================================================

-- Insert realistic demo agent logs that show the cost optimizations in action
INSERT INTO agent_logs (agent_role, action_type, thought_vector, metadata, cost_saved_est, created_at) VALUES
('Planner', 'CACHE_HIT', 'Loading Modern Voyageur brand guidelines from context cache - 90% token savings achieved', '{"cache_type": "brand_guidelines", "tokens_saved": 5000}', 4.50, NOW() - INTERVAL '5 minutes'),
('Planner', 'FLASH_LITE_ROUTING', 'Using Flash-Lite for campaign planning - optimal for structured analysis tasks', '{"model": "gemini-2.0-flash-lite", "task_complexity": "simple"}', 0.30, NOW() - INTERVAL '4 minutes'),
('Researcher', 'GROUNDING_SEARCH', 'Grounding with Google Search for Canadian coffee market trends - real-time data verified', '{"search_queries": 3, "sources_verified": 12}', 1.20, NOW() - INTERVAL '3 minutes'),
('Researcher', 'VECTOR_BATCHING', 'Batching market research queries - 45% efficiency improvement on API calls', '{"queries_batched": 5, "api_calls_saved": 3}', 0.90, NOW() - INTERVAL '2 minutes'),
('Creative', 'BRAND_DNA_EXTRACTION', 'Analyzing uploaded Aurora Coffee storefront - extracted #2c241b coffee brown and #d4af37 gold', '{"colors_extracted": ["#2c241b", "#d4af37"], "brand_archetype": "Artisan"}', 2.10, NOW() - INTERVAL '1 minute'),
('Auditor', 'COMPLIANCE_CHECK', 'CRTC compliance verified - Canadian broadcasting standards met', '{"standards_checked": ["CRTC", "PIPEDA"], "risk_level": "low"}', 0.45, NOW() - INTERVAL '30 seconds'),
('Receptionist', 'AUTO_RESPONSE', 'User feedback received: "Love the coffee campaign!" - generating contextual response using thought log analysis', '{"response_confidence": 0.95, "user_sentiment": "positive"}', 0.75, NOW() - INTERVAL '15 seconds'),
('Creative', 'IMAGEN_GENERATION', 'Generating hero image with extracted brand colors using Imagen 3 - premium visual asset created', '{"resolution": "8k", "style": "commercial photography"}', 1.80, NOW() - INTERVAL '10 seconds');

-- Insert additional historical data for the dashboard
INSERT INTO agent_logs (agent_role, action_type, thought_vector, metadata, cost_saved_est, created_at)
SELECT
  (ARRAY['Planner', 'Researcher', 'Creative', 'Auditor', 'Receptionist'])[floor(random() * 5) + 1] as agent_role,
  CASE floor(random() * 4)
    WHEN 0 THEN 'CACHE_HIT'
    WHEN 1 THEN 'FLASH_LITE_ROUTING'
    WHEN 2 THEN 'GROUNDING_SEARCH'
    WHEN 3 THEN 'AUTO_RESPONSE'
  END as action_type,
  CASE
    WHEN agent_role = 'Planner' THEN 'Strategic campaign planning completed with Flash-Lite optimization'
    WHEN agent_role = 'Researcher' THEN 'Market research data retrieved with grounding verification'
    WHEN agent_role = 'Creative' THEN 'Brand-aligned creative assets generated using extracted DNA'
    WHEN agent_role = 'Auditor' THEN 'Compliance and legal standards validated successfully'
    WHEN agent_role = 'Receptionist' THEN 'Automated user support response generated and delivered'
  END as thought_vector,
  jsonb_build_object('demo_data', true, 'cost_optimized', true),
  round((random() * 4 + 0.1)::numeric, 2) as cost_saved_est,
  NOW() - (floor(random() * 24 * 60) || ' minutes')::interval as created_at
FROM generate_series(1, 50);

-- Log the mission control setup
DO $$
BEGIN
  INSERT INTO system_logs (component, event_type, message, metadata)
  VALUES ('mission_control', 'dashboard_initialized', 'Mission Control dashboard and agent logging system initialized',
    jsonb_build_object(
      'features_enabled', jsonb_build_array(
        'real_time_agent_logs',
        'cost_tracking_metrics',
        'live_dashboard_updates',
        'economic_optimization_display'
      ),
      'demo_data_populated', true,
      'cost_savings_tracked', true
    ));
END $$;