import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkRateLimit, trackUsage, checkQuota } from '../_shared/rate-limit.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_STYLES = ['creative', 'professional', 'casual', 'formal', 'playful'];
const ALLOWED_TONES = ['professional', 'friendly', 'formal', 'casual', 'enthusiastic'];

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
    const rateCheck = checkRateLimit(user.id, 10, 60000);
    if (!rateCheck.allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': rateCheck.retryAfter?.toString() || '60'
          } 
        }
      );
    }

    // Check daily quota
    const hasQuota = await checkQuota(supabaseClient, user.id, 100);
    if (!hasQuota) {
      return new Response(
        JSON.stringify({ error: 'Daily usage limit reached. Please try again tomorrow.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { prompt, style, tone, language } = await req.json();
    
    // Input validation
    if (!prompt || typeof prompt !== 'string' || prompt.length === 0 || prompt.length > 5000) {
      return new Response(
        JSON.stringify({ error: "Invalid prompt. Please provide text between 1 and 5000 characters." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (style && !ALLOWED_STYLES.includes(style)) {
      return new Response(
        JSON.stringify({ error: "Invalid style option. Please select a valid style." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (tone && !ALLOWED_TONES.includes(tone)) {
      return new Response(
        JSON.stringify({ error: "Invalid tone option. Please select a valid tone." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate language parameter
    const validLanguages = ['en', 'fr'];
    const targetLanguage = language && validLanguages.includes(language) ? language : 'en';
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build language-specific instructions
    const languageInstructions = targetLanguage === 'fr' 
      ? `IMPORTANT: Generate all content in Quebec French (Français québécois). Use Quebec French spelling, expressions, and cultural references. Ensure the tone and style are appropriate for Quebec French-speaking audiences.`
      : `IMPORTANT: Generate all content in English.`;

    const systemPrompt = `You are a creative content writer for Kolony, specializing in LongCat format - vertical, scrollable content optimized for mobile viewing.

${languageInstructions}

Style: ${style || 'Creative'}
Tone: ${tone || 'Professional'}

Create engaging, mobile-friendly content that flows naturally in a vertical format. Include:
- Attention-grabbing hook
- Clear sections with natural breaks
- Emoji usage where appropriate
- Mobile-optimized formatting
- Call-to-action at the end

Keep paragraphs short and scannable.`;

    console.log("Generating LongCat content for user:", user.id);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      console.error("AI API request failed with status:", response.status);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service quota exceeded. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Unable to generate content. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("Empty content received from AI API");
      return new Response(
        JSON.stringify({ error: "Unable to generate content. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("LongCat content generated successfully");

    // Track usage (non-blocking)
    trackUsage(supabaseClient, user.id, 'generate-longcat', 1).catch(err => 
      console.error('Usage tracking error:', err)
    );

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Request processing error:", error instanceof Error ? error.constructor.name : "Unknown");
    return new Response(
      JSON.stringify({ error: "Unable to generate content. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
