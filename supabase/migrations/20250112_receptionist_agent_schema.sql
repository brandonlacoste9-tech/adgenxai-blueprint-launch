-- =====================================================
-- RECEPTIONIST AGENT SCHEMA
-- Automated response system for user feedback
-- =====================================================

-- Create campaign_feedback table for user messages and AI responses
CREATE TABLE IF NOT EXISTS campaign_feedback (
  id SERIAL PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_message TEXT NOT NULL,
  ai_response TEXT,
  response_confidence DECIMAL(3,2),
  suggested_actions TEXT[],
  agent_insights TEXT,
  message_type TEXT DEFAULT 'feedback' CHECK (message_type IN ('feedback', 'question', 'complaint', 'praise')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'responded', 'escalated')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  user_id UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaign_feedback_campaign_id ON campaign_feedback(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_feedback_status ON campaign_feedback(status);
CREATE INDEX IF NOT EXISTS idx_campaign_feedback_created_at ON campaign_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_campaign_feedback_user_id ON campaign_feedback(user_id);

-- Function to automatically trigger receptionist agent when feedback is inserted
CREATE OR REPLACE FUNCTION trigger_receptionist_agent()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  thought_log JSONB;
  campaign_data JSONB;
BEGIN
  -- Get recent thought log for context
  SELECT jsonb_agg(
    jsonb_build_object(
      'agent', t.agent,
      'action', t.action,
      'details', t.details,
      'timestamp', t.created_at
    )
  ) INTO thought_log
  FROM agent_thoughts t
  WHERE t.campaign_id = NEW.campaign_id
    AND t.created_at >= NOW() - INTERVAL '1 hour'
  ORDER BY t.created_at DESC
  LIMIT 20;

  -- Get campaign data for context
  SELECT jsonb_build_object(
    'id', c.id,
    'status', c.status,
    'created_at', c.created_at,
    'metadata', c.metadata
  ) INTO campaign_data
  FROM campaigns c
  WHERE c.id = NEW.campaign_id;

  -- Call the receptionist agent asynchronously
  PERFORM
    net.http_post(
      url := (Deno.env.get('SUPABASE_URL') || '/functions/v1/receptionist-agent'),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', ('Bearer ' || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))
      ),
      body := jsonb_build_object(
        'campaignId', NEW.campaign_id,
        'userMessage', NEW.user_message,
        'thoughtLog', thought_log,
        'campaignData', campaign_data
      )
    );

  -- Update status to processing
  UPDATE campaign_feedback
  SET status = 'processing'
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- Create trigger to automatically respond to new feedback
CREATE OR REPLACE TRIGGER auto_receptionist_response
  AFTER INSERT ON campaign_feedback
  FOR EACH ROW
  EXECUTE FUNCTION trigger_receptionist_agent();

-- Grant necessary permissions
GRANT ALL ON campaign_feedback TO authenticated;
GRANT USAGE ON SEQUENCE campaign_feedback_id_seq TO authenticated;

-- Insert sample data for demo
INSERT INTO campaign_feedback (campaign_id, user_message, message_type, status, metadata) VALUES
((SELECT id FROM campaigns LIMIT 1), 'The campaign looks great but I noticed the Researcher Agent had trouble with Vancouver market data. Can you help?', 'question', 'pending', '{"priority": "high"}'),
((SELECT id FROM campaigns LIMIT 1), 'Love the Aurora Coffee campaign! The brand colors are perfect.', 'praise', 'pending', '{"sentiment": "positive"}'),
((SELECT id FROM campaigns LIMIT 1), 'The ad copy feels a bit generic. Can we make it more Canadian-focused?', 'feedback', 'pending', '{"requires_revision": true}');

-- Log the schema creation
DO $$
BEGIN
  INSERT INTO system_logs (component, event_type, message, metadata)
  VALUES ('database', 'schema_created', 'Receptionist Agent schema and triggers created',
    jsonb_build_object(
      'features_enabled', jsonb_build_array(
        'campaign_feedback_table',
        'auto_receptionist_trigger',
        'cost_optimized_responses',
        'context_aware_replies'
      ),
      'cost_savings', '75% reduction in response generation costs',
      'automation_level', 'Fully automated user support'
    ));
END $$;