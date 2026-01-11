import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    const { projectName, html, metadata } = await req.json();
    
    if (!projectName || !html) {
      return new Response(
        JSON.stringify({ error: "Project name and HTML content are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const VERCEL_TOKEN = Deno.env.get("VERCEL_TOKEN");
    if (!VERCEL_TOKEN) {
      return new Response(
        JSON.stringify({ error: "Vercel integration not configured. Please contact support." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Deploying to Vercel:", projectName);

    // Create deployment using Vercel API
    const files = [
      {
        file: "index.html",
        data: html,
      },
      {
        file: "vercel.json",
        data: JSON.stringify({
          version: 2,
          builds: [
            {
              src: "index.html",
              use: "@vercel/static"
            }
          ]
        })
      }
    ];

    const deploymentResponse = await fetch("https://api.vercel.com/v13/deployments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${VERCEL_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: projectName,
        files: files,
        projectSettings: {
          framework: null,
        },
        target: "production",
      }),
    });

    if (!deploymentResponse.ok) {
      const error = await deploymentResponse.json();
      console.error("Vercel API error:", error);
      throw new Error(error.error?.message || "Failed to deploy to Vercel");
    }

    const deploymentData = await deploymentResponse.json();
    const deploymentUrl = `https://${deploymentData.url}`;

    console.log("Deployed to Vercel:", deploymentUrl);

    return new Response(
      JSON.stringify({ 
        url: deploymentUrl,
        inspectorUrl: deploymentData.inspectorUrl,
        message: "Deployed to Vercel successfully"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Vercel deployment error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to deploy to Vercel" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
