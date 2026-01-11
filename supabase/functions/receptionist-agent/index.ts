import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReceptionistResponse {
  response: string;
  confidence: number;
  suggested_actions: string[];
  agent_insights: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { campaignId, userMessage, thoughtLog } = await req.json();

    if (!campaignId || !userMessage) {
      throw new Error('Missing required parameters: campaignId and userMessage');
    }

    // Import Vertex AI SDK dynamically for cost optimization
    const { VertexAI } = await import('https://esm.sh/@google-cloud/vertexai@1.0.0');

    // Initialize Vertex AI with credentials (use Flash-Lite for cost savings)
    const vertexAI = new VertexAI({
      project: Deno.env.get('GOOGLE_PROJECT_ID'),
      location: 'us-central1',
      googleAuthOptions: {
        credentials: {
          client_email: Deno.env.get('GOOGLE_CLIENT_EMAIL'),
          private_key: Deno.env.get('GOOGLE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
        },
      },
    });

    // Use Flash-Lite for receptionist responses (cost-optimized)
    const receptionistModel = vertexAI.getGenerativeModel({
      model: 'gemini-2.0-flash-lite',
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1024,
        responseMimeType: "application/json",
      },
    });

    // Get campaign context and thought log
    const thoughtContext = thoughtLog ? JSON.stringify(thoughtLog.slice(-10), null, 2) : 'No recent agent activity';

    // Get current campaign status
    const { data: campaignData } = await supabaseClient
      .from('campaigns')
      .select('status, created_at, metadata')
      .eq('id', campaignId)
      .single();

    const campaignContext = campaignData ? JSON.stringify({
      status: campaignData.status,
      age: Date.now() - new Date(campaignData.created_at).getTime(),
      metadata: campaignData.metadata
    }, null, 2) : 'Campaign not found';

    // Generate context-aware response using Flash-Lite
    const receptionistPrompt = `You are the Modern Voyageur Receptionist Agent - an AI assistant that provides helpful, context-aware responses to user feedback and questions about their campaigns.

CAMPAIGN CONTEXT:
${campaignContext}

RECENT AGENT THOUGHT LOG:
${thoughtContext}

USER MESSAGE:
"${userMessage}"

INSTRUCTIONS:
- Analyze the user's message in the context of the campaign and agent activities
- Provide specific, actionable responses based on what actually happened
- Reference specific agent actions or issues from the thought log when relevant
- Suggest concrete next steps or solutions
- Maintain the Modern Voyageur professional, Canadian-centric tone
- Keep responses concise but helpful

Respond in JSON format with:
{
  "response": "Your helpful response to the user",
  "confidence": 0.0-1.0 (how confident you are in your analysis),
  "suggested_actions": ["action1", "action2"],
  "agent_insights": "What you learned from the agent logs about this campaign"
}`;

    const result = await receptionistModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: receptionistPrompt }] }],
    });

    const response = await result.response;
    const responseData: ReceptionistResponse = JSON.parse(response.text());

    // Save the response back to the database
    const { error: updateError } = await supabaseClient
      .from('campaign_feedback')
      .update({
        ai_response: responseData.response,
        response_confidence: responseData.confidence,
        suggested_actions: responseData.suggested_actions,
        agent_insights: responseData.agent_insights,
        responded_at: new Date().toISOString()
      })
      .eq('campaign_id', campaignId)
      .eq('user_message', userMessage)
      .order('created_at', { ascending: false })
      .limit(1);

    if (updateError) {
      console.error('Error saving receptionist response:', updateError);
    }

    // Log the receptionist activity
    await supabaseClient
      .from('system_logs')
      .insert({
        component: 'receptionist_agent',
        event_type: 'response_generated',
        message: `Generated response for campaign ${campaignId}`,
        metadata: {
          confidence: responseData.confidence,
          response_length: responseData.response.length,
          suggested_actions_count: responseData.suggested_actions.length
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        response: responseData,
        cost_savings: "Used Flash-Lite for 75% cost reduction vs full Flash model"
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Receptionist Agent Error:', error);

    // Log the error
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await supabaseClient
      .from('system_logs')
      .insert({
        component: 'receptionist_agent',
        event_type: 'error',
        message: error.message,
        metadata: { error_details: error.stack }
      });

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});