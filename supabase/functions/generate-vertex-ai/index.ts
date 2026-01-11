import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkRateLimit, trackUsage, checkQuota } from '../_shared/rate-limit.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit
    const rateCheck = checkRateLimit(user.id, 20, 60000);
    if (!rateCheck.allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check quota
    const quotaCheck = await checkQuota(user.id);
    if (!quotaCheck.allowed) {
      return new Response(
        JSON.stringify({ error: 'Quota exceeded. Please upgrade your plan.' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    const { prompt, model = 'gemini-2.0-flash-exp', temperature = 0.7 } = await req.json();

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required and must be a non-empty string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate model
    const validModels = ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash'];
    const selectedModel = validModels.includes(model) ? model : 'gemini-2.0-flash-exp';

    // Validate temperature
    const validTemperature = Math.max(0, Math.min(1, temperature));

    // Get Google Cloud credentials from environment
    const projectId = Deno.env.get('GOOGLE_PROJECT_ID');
    const clientEmail = Deno.env.get('GOOGLE_CLIENT_EMAIL');
    const privateKey = Deno.env.get('GOOGLE_PRIVATE_KEY');

    if (!projectId || !clientEmail || !privateKey) {
      console.error('Missing Google Cloud credentials');
      return new Response(
        JSON.stringify({ error: 'Vertex AI configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Import Vertex AI SDK dynamically
          const { VertexAI } = await import('https://esm.sh/@google-cloud/vertexai@1.0.0');

          // Initialize Vertex AI with credentials
          const vertexAI = new VertexAI({
            project: projectId,
            location: 'us-central1',
            googleAuthOptions: {
              credentials: {
                client_email: clientEmail,
                private_key: privateKey.replace(/\\n/g, '\n'),
              },
            },
          });

          const generativeModel = vertexAI.getGenerativeModel({
            model: selectedModel,
            generationConfig: {
              temperature: validTemperature,
              maxOutputTokens: 8192,
            },
          });

          // Create streaming request
          const chat = generativeModel.startChat({
            history: [],
          });

          const result = await chat.sendMessageStream(prompt);

          // Stream the response
          for await (const chunk of result.stream) {
            const chunkText = chunk.response.text();
            if (chunkText) {
              const data = `data: ${JSON.stringify({ text: chunkText })}\n\n`;
              controller.enqueue(new TextEncoder().encode(data));
            }
          }

          // Track usage
          await trackUsage(user.id, 'vertex-ai', 1);

          controller.close();
        } catch (error) {
          console.error('Vertex AI error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const errorData = `data: ${JSON.stringify({ error: errorMessage })}\n\n`;
          controller.enqueue(new TextEncoder().encode(errorData));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
