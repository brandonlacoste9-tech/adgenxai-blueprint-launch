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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rateCheck = checkRateLimit(user.id, 5, 60000);
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

    const hasQuota = await checkQuota(supabaseClient, user.id, 50);
    if (!hasQuota) {
      return new Response(
        JSON.stringify({ error: 'Daily usage limit reached. Please try again tomorrow.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { 
      templateId, 
      businessName, 
      businessDescription, 
      industry, 
      targetAudience, 
      language, 
      sections 
    } = await req.json();
    
    if (!businessName || typeof businessName !== 'string' || businessName.length === 0) {
      return new Response(
        JSON.stringify({ error: "Business name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!sections || !Array.isArray(sections) || sections.length === 0) {
      return new Response(
        JSON.stringify({ error: "Sections are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Generating landing page for:", businessName);

    // Generate content for each section
    const generatedSections = [];
    
    for (const sectionType of sections) {
      const sectionPrompt = buildSectionPrompt(
        sectionType, 
        businessName, 
        businessDescription, 
        industry, 
        targetAudience, 
        language
      );

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { 
              role: "system", 
              content: "You are an expert landing page copywriter. Generate compelling, conversion-focused content in JSON format. Always respond with valid JSON only, no markdown or explanations." 
            },
            { role: "user", content: sectionPrompt }
          ],
          stream: false,
        }),
      });

      if (!response.ok) {
        console.error("AI API request failed:", response.status);
        throw new Error("Failed to generate section content");
      }

      const data = await response.json();
      let content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("Empty content received from AI");
      }

      // Clean up markdown code blocks if present
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      try {
        const sectionContent = JSON.parse(content);
        generatedSections.push({
          type: sectionType,
          content: sectionContent
        });
      } catch (parseError) {
        console.error("Failed to parse section content:", content);
        throw new Error(`Failed to parse ${sectionType} section`);
      }
    }

    console.log("Landing page generated successfully");

    trackUsage(supabaseClient, user.id, 'generate-landing-page', sections.length).catch(err => 
      console.error('Usage tracking error:', err)
    );

    return new Response(
      JSON.stringify({ sections: generatedSections }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Request processing error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate landing page" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildSectionPrompt(
  sectionType: string, 
  businessName: string, 
  businessDescription: string, 
  industry: string, 
  targetAudience: string, 
  language: string
): string {
  const languageNote = language === 'fr' 
    ? 'Generate all content in Quebec French.' 
    : language === 'bilingual' 
    ? 'Generate content with both English and French versions where applicable.' 
    : 'Generate all content in English.';

  const businessContext = `
Business: ${businessName}
${businessDescription ? `Description: ${businessDescription}` : ''}
${industry ? `Industry: ${industry}` : ''}
${targetAudience ? `Target Audience: ${targetAudience}` : ''}
${languageNote}
`;

  switch (sectionType) {
    case 'hero':
      return `${businessContext}

Create a compelling hero section with:
- headline: Main attention-grabbing headline (max 10 words)
- subheadline: Supporting text that explains the value proposition (max 20 words)
- ctaText: Call-to-action button text (max 3 words)
- ctaLink: Use "#get-started"

Return JSON format:
{
  "headline": "...",
  "subheadline": "...",
  "ctaText": "...",
  "ctaLink": "#get-started"
}`;

    case 'features':
      return `${businessContext}

Create a features section with:
- title: Section title
- features: Array of 3-4 key features, each with:
  - title: Feature name (max 5 words)
  - description: Feature description (max 20 words)

Return JSON format:
{
  "title": "Features",
  "features": [
    {"title": "...", "description": "..."},
    {"title": "...", "description": "..."},
    {"title": "...", "description": "..."}
  ]
}`;

    case 'pricing':
      return `${businessContext}

Create a pricing section with:
- title: Section title
- plans: Array of 2-3 pricing tiers, each with:
  - name: Plan name
  - price: Price (include currency, e.g., "$29/mo" or "$29 CAD/mois" for French)
  - features: Array of 3-5 feature strings
  - ctaText: Button text
  - ctaLink: Use "#subscribe"

Return JSON format:
{
  "title": "Pricing",
  "plans": [
    {
      "name": "Starter",
      "price": "$29/mo",
      "features": ["Feature 1", "Feature 2", "Feature 3"],
      "ctaText": "Get Started",
      "ctaLink": "#subscribe"
    }
  ]
}`;

    case 'testimonials':
      return `${businessContext}

Create a testimonials section with:
- title: Section title
- testimonials: Array of 2-3 customer testimonials, each with:
  - quote: Customer quote (max 30 words)
  - author: Customer name and title

Return JSON format:
{
  "title": "Testimonials",
  "testimonials": [
    {"quote": "...", "author": "John Doe, CEO at Company"},
    {"quote": "...", "author": "Jane Smith, Marketing Director"}
  ]
}`;

    case 'cta':
      return `${businessContext}

Create a final call-to-action section with:
- headline: Compelling CTA headline (max 8 words)
- subheadline: Supporting text (max 15 words)
- ctaText: Button text (max 3 words)
- ctaLink: Use "#signup"

Return JSON format:
{
  "headline": "...",
  "subheadline": "...",
  "ctaText": "...",
  "ctaLink": "#signup"
}`;

    case 'footer':
      return `${businessContext}

Create a footer section with:
- copyright: Copyright text
- links: Array of 2-3 footer links with text and url properties

Return JSON format:
{
  "copyright": "© 2026 ${businessName}. All rights reserved.",
  "links": [
    {"text": "Privacy Policy", "url": "#privacy"},
    {"text": "Terms of Service", "url": "#terms"}
  ]
}`;

    default:
      return `${businessContext}

Create content for a ${sectionType} section. Return appropriate JSON structure.`;
  }
}
