import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkRateLimit, trackUsage, checkQuota } from '../_shared/rate-limit.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_SECTION_TYPES = [
  'hero', 
  'features', 
  'pricing', 
  'testimonials', 
  'cta', 
  'footer', 
  'about', 
  'contact', 
  'products', 
  'services',
  'location-map',
  'shipping-info',
  'accessibility'
];

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

    const { sectionType, businessContext, language, style, tone, businessName, templateId } = await req.json();
    
    // Input validation
    if (!sectionType || !ALLOWED_SECTION_TYPES.includes(sectionType)) {
      return new Response(
        JSON.stringify({ error: `Invalid section type. Must be one of: ${ALLOWED_SECTION_TYPES.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!businessContext || typeof businessContext !== 'string' || businessContext.length === 0 || businessContext.length > 2000) {
      return new Response(
        JSON.stringify({ error: "Invalid business context. Please provide text between 1 and 2000 characters." }),
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

    // Section-specific prompts
    const sectionPrompts: Record<string, string> = {
      hero: `Create a compelling hero section for a landing page. Include:
- A powerful, attention-grabbing headline (max 10 words)
- A compelling subheadline that explains the value proposition (max 20 words)
- A clear, action-oriented call-to-action button text (2-4 words)
Make it engaging and conversion-focused.`,
      
      features: `Create a features section for a landing page. Include:
- 3-6 key features or benefits
- Each feature should have a short title (3-5 words) and description (1-2 sentences)
- Focus on what makes this business/product unique
Format as a JSON array of objects with "title" and "description" fields.`,
      
      pricing: `Create a pricing section for a landing page. Include:
- 2-3 pricing tiers
- Each tier should have: name, price (in CAD), description, and 3-5 features
- Include GST/HST information for Canadian pricing
- Make pricing clear and compelling
Format as a JSON array of objects with "name", "price", "description", and "features" (array) fields.`,
      
      testimonials: `Create a testimonials section for a landing page. Include:
- 3-4 customer testimonials
- Each testimonial should have: customer name, role/company (optional), and testimonial text (2-3 sentences)
- Make testimonials authentic and specific
Format as a JSON array of objects with "name", "role" (optional), and "text" fields.`,
      
      cta: `Create a call-to-action section for a landing page. Include:
- A compelling headline (max 8 words)
- A supporting subheadline (max 15 words)
- A clear, action-oriented button text (2-4 words)
- Optional: A secondary benefit or urgency element
Make it persuasive and conversion-focused.`,
      
      footer: `Create a footer section for a landing page. Include:
- Company name and tagline
- Contact information (email, phone, address if provided)
- Links to: About, Services, Contact, Privacy Policy, Terms of Service
- Social media links placeholder
- Copyright notice
Format as structured footer content with sections.`,
      
      about: `Create an about section for a landing page. Include:
- A compelling headline (max 8 words)
- 2-3 paragraphs describing the business, mission, and values
- What makes this business unique
- Optional: Founder/team information
Make it authentic and engaging.`,
      
      contact: `Create a contact section for a landing page. Include:
- A headline (e.g., "Get in Touch" / "Contactez-nous")
- Contact form fields: Name, Email, Phone (optional), Message
- Contact information: Email, Phone, Address (if provided)
- Office hours (if applicable)
Format as structured contact information and form fields.`,
      
      products: `Create a products section for a landing page. Include:
- 3-6 products or services
- Each product should have: name, description (2-3 sentences), price (in CAD), and key features (2-3 bullet points)
- Include product images placeholder
- Make products appealing and well-described
Format as a JSON array of objects with "name", "description", "price", and "features" (array) fields.`,
      
      services: `Create a services section for a landing page. Include:
- 3-6 services offered
- Each service should have: name, description (2-3 sentences), and key benefits (2-3 bullet points)
- Make services clear and valuable
Format as a JSON array of objects with "name", "description", and "benefits" (array) fields.`,
      
      'location-map': `Create a location section for a landing page. Include:
- Business name and address
- Map placeholder instructions
- Directions or nearby landmarks
- Parking information (if applicable)
- Public transit information (if applicable)
Format as structured location information.`,
      
      'shipping-info': `Create a shipping information section for an e-commerce landing page. Include:
- Shipping options (Standard, Express, Overnight)
- Shipping rates for Canada (by province/region if applicable)
- Free shipping threshold (if applicable)
- Estimated delivery times
- Return policy summary
Format as structured shipping information with clear pricing and timelines.`,
      
      accessibility: `Create an accessibility statement section for a government or public service landing page. Include:
- WCAG compliance level (AA)
- Accessibility features available
- How to request accommodations
- Contact information for accessibility concerns
- Commitment to accessibility
Format as a professional accessibility statement.`,
    };

    const sectionPrompt = sectionPrompts[sectionType] || sectionPrompts.hero;
    const businessNameText = businessName ? `Business Name: ${businessName}\n\n` : '';

    const systemPrompt = `You are a professional landing page copywriter specializing in creating conversion-optimized content for Canadian businesses.

${languageInstructions}

Style: ${style || 'Professional'}
Tone: ${tone || 'Professional'}

${sectionPrompt}

Business Context:
${businessNameText}${businessContext}

Generate content that is:
- Clear and compelling
- Conversion-focused
- Appropriate for Canadian audiences
- Culturally relevant
- Professional yet engaging

Return ONLY valid JSON matching the requested format. Do not include any explanatory text outside the JSON.`;

    console.log(`Generating ${sectionType} section for user:`, user.id);

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
          { role: "user", content: `Generate the ${sectionType} section content as specified.` }
        ],
        stream: false,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate content. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const generatedContent = data.choices?.[0]?.message?.content || "";

    if (!generatedContent) {
      return new Response(
        JSON.stringify({ error: "No content generated. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Track usage
    await trackUsage(supabaseClient, user.id, 'landing-section', sectionType);

    // Parse JSON if possible, otherwise return as text
    let parsedContent;
    try {
      parsedContent = JSON.parse(generatedContent);
    } catch {
      // If not JSON, return as text content
      parsedContent = { content: generatedContent };
    }

    return new Response(
      JSON.stringify({ 
        content: parsedContent,
        sectionType,
        language: targetLanguage,
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Error generating landing section:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
