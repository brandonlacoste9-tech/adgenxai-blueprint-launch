#!/bin/bash

# Deploy Studio Dashboard Edge Function
# Run this after setting up Supabase CLI authentication

echo "🚀 Deploying Studio Dashboard Vertex AI Function"
echo "================================================"

# Check if Supabase CLI is logged in
if ! supabase projects list > /dev/null 2>&1; then
    echo "❌ Please login to Supabase first:"
    echo "   supabase login"
    echo ""
    echo "Then link your project:"
    echo "   supabase link --project-ref tpsseyzezbmfxydeaibr"
    exit 1
fi

# Link project (in case it's not linked)
echo "🔗 Linking project..."
supabase link --project-ref tpsseyzezbmfxydeaibr

# Deploy the functions
echo "📦 Deploying adgen-orchestrator function..."
supabase functions deploy adgen-orchestrator --no-verify-jwt

echo "📦 Deploying receptionist-agent function..."
supabase functions deploy receptionist-agent --no-verify-jwt

# Set secrets (you'll need to replace with actual values)
echo "🔐 Don't forget to set these secrets in Supabase Dashboard:"
echo "   - GOOGLE_PROJECT_ID"
echo "   - GOOGLE_CLIENT_EMAIL"
echo "   - GOOGLE_PRIVATE_KEY"
echo ""
echo "Go to: https://supabase.com/dashboard/project/tpsseyzezbmfxydeaibr/settings/functions"

# Set Imagen 3 enable flag for visual generation
echo "🎨 Enabling Imagen 3 for visual generation..."
supabase secrets set GOOGLE_IMAGEN_ENABLED="true"

echo "✅ Deployment complete!"
echo "🎨 Imagen 3 visual generation enabled!"
echo "🌐 Test the Studio at: /studio"
echo ""
echo "📋 Ready for Tuesday Google presentation!"
echo "📖 Check GOOGLE_PRESENTATION_LAUNCH_CHECKLIST.md for demo script"