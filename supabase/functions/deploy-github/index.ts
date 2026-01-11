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

    const { repositoryName, html, metadata } = await req.json();
    
    if (!repositoryName || !html) {
      return new Response(
        JSON.stringify({ error: "Repository name and HTML content are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get GitHub token from user metadata or environment
    const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");
    if (!GITHUB_TOKEN) {
      return new Response(
        JSON.stringify({ error: "GitHub integration not configured. Please contact support." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Creating GitHub repository:", repositoryName);

    // Create repository
    const createRepoResponse = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GITHUB_TOKEN}`,
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: repositoryName,
        description: metadata?.description || `Landing page for ${metadata?.businessName}`,
        private: false,
        auto_init: true,
      }),
    });

    if (!createRepoResponse.ok) {
      const error = await createRepoResponse.json();
      console.error("GitHub API error:", error);
      throw new Error(error.message || "Failed to create repository");
    }

    const repoData = await createRepoResponse.json();
    const owner = repoData.owner.login;
    const repo = repoData.name;

    console.log("Repository created:", repoData.html_url);

    // Get the default branch SHA
    const branchResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/main`, {
      headers: {
        "Authorization": `Bearer ${GITHUB_TOKEN}`,
        "Accept": "application/vnd.github.v3+json",
      },
    });

    if (!branchResponse.ok) {
      throw new Error("Failed to get branch reference");
    }

    const branchData = await branchResponse.json();
    const latestCommitSha = branchData.object.sha;

    // Create or update index.html
    const content = btoa(html); // Base64 encode
    
    const createFileResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/index.html`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${GITHUB_TOKEN}`,
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Add landing page",
        content: content,
        branch: "main",
      }),
    });

    if (!createFileResponse.ok) {
      const error = await createFileResponse.json();
      console.error("Failed to create file:", error);
      throw new Error("Failed to add HTML file to repository");
    }

    console.log("HTML file added to repository");

    // Enable GitHub Pages
    const pagesResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/pages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GITHUB_TOKEN}`,
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: {
          branch: "main",
          path: "/",
        },
      }),
    });

    let pagesUrl = `https://${owner}.github.io/${repo}/`;
    
    if (pagesResponse.ok) {
      const pagesData = await pagesResponse.json();
      pagesUrl = pagesData.html_url || pagesUrl;
      console.log("GitHub Pages enabled:", pagesUrl);
    } else {
      console.log("GitHub Pages may need manual activation");
    }

    return new Response(
      JSON.stringify({ 
        repositoryUrl: repoData.html_url,
        pagesUrl: pagesUrl,
        message: "Deployed to GitHub successfully. Pages may take a few minutes to become available."
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("GitHub deployment error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to deploy to GitHub" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
