import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkRateLimit, trackUsage, checkQuota } from '../_shared/rate-limit.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_PLATFORMS = ['instagram', 'youtube', 'tiktok', 'twitter', 'facebook'];

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

    const { content, platform } = await req.json();
    
    // Input validation
    if (!content || typeof content !== 'string' || content.length === 0 || content.length > 10000) {
      return new Response(
        JSON.stringify({ error: "Invalid content. Please provide text between 1 and 10000 characters." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!platform || !ALLOWED_PLATFORMS.includes(platform.toLowerCase())) {
      return new Response(
        JSON.stringify({ error: "Invalid platform. Please select a valid social media platform." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const platformPrompts = {
      instagram: `Format this content for Instagram:
- Add relevant hashtags (8-12)
- Optimize spacing and line breaks
- Include emojis strategically
- Keep caption under 2,200 characters
- Add call-to-action
- Suggest best posting times`,
      
      youtube: `Format this content for YouTube:
- Create compelling title (under 100 chars)
- Write detailed description (up to 5,000 chars)
- Add relevant tags (20-30)
- Include timestamps if applicable
- Add SEO-optimized keywords
- Suggest thumbnail ideas`,
      
      tiktok: `Format this content for TikTok:
- Create catchy hook (first 3 seconds)
- Add trending hashtags (5-8)
- Keep it short and engaging
- Include trending sounds suggestion
- Add call-to-action
- Optimize for vertical video (9:16)`,
      
      twitter: `Format this content for X (Twitter):
- Break into tweet thread if needed (280 chars per tweet)
- Add relevant hashtags (2-3 max)
- Include engaging opening hook
- Use line breaks for readability
- Add call-to-action in final tweet
- Suggest best posting times`,
      
      facebook: `Format this content for Facebook:
- Create attention-grabbing first line
- Optimize paragraph breaks
- Add relevant hashtags (3-5)
- Include call-to-action
- Suggest post type (text, link, video)
- Optimize for engagement`
    };

    const systemPrompt = platformPrompts[platform as keyof typeof platformPrompts] || 
      "Format this content for social media posting.";

    console.log(`Formatting content for ${platform}, user:`, user.id);

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
          { role: "user", content: `Content to format:\n\n${content}` }
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
        JSON.stringify({ error: "Unable to format content. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const formattedContent = data.choices?.[0]?.message?.content;

    if (!formattedContent) {
      console.error("Empty content received from AI API");
      return new Response(
        JSON.stringify({ error: "Unable to format content. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Content formatted successfully for ${platform}`);

    // Track usage (non-blocking)
    trackUsage(supabaseClient, user.id, 'export-social', 1).catch(err => 
      console.error('Usage tracking error:', err)
    );

    return new Response(
      JSON.stringify({ formattedContent, platform }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Request processing error:", error instanceof Error ? error.constructor.name : "Unknown");
    return new Response(
      JSON.stringify({ error: "Unable to format content. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
