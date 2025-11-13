import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, platform } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
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

    console.log(`Formatting content for ${platform}`);

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
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const formattedContent = data.choices?.[0]?.message?.content;

    if (!formattedContent) {
      throw new Error("No formatted content generated");
    }

    console.log(`Content formatted successfully for ${platform}`);

    return new Response(
      JSON.stringify({ formattedContent, platform }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in export-social:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
