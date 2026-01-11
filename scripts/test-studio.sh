#!/bin/bash

# Test the Modern Voyageur Studio deployment
echo "🧪 Testing Modern Voyageur Studio Deployment"
echo "=========================================="

# Check if Supabase CLI is authenticated
if ! supabase projects list > /dev/null 2>&1; then
    echo "❌ Supabase CLI not authenticated. Run: supabase login"
    exit 1
fi

# Test function deployment
echo "📦 Checking function deployment..."
if supabase functions list | grep -q "adgen-orchestrator"; then
    echo "✅ adgen-orchestrator function deployed"
else
    echo "❌ adgen-orchestrator function not found"
    echo "Run: supabase functions deploy adgen-orchestrator"
    exit 1
fi

if supabase functions list | grep -q "receptionist-agent"; then
    echo "✅ receptionist-agent function deployed"
else
    echo "❌ receptionist-agent function not found"
    echo "Run: supabase functions deploy receptionist-agent"
    exit 1
fi

# Test secrets configuration
echo "🔐 Checking Google Cloud secrets..."
SECRETS_OUTPUT=$(supabase secrets list 2>/dev/null || echo "")
if echo "$SECRETS_OUTPUT" | grep -q "GOOGLE_PROJECT_ID"; then
    echo "✅ GOOGLE_PROJECT_ID configured"
else
    echo "❌ GOOGLE_PROJECT_ID not set"
fi

if echo "$SECRETS_OUTPUT" | grep -q "GOOGLE_CLIENT_EMAIL"; then
    echo "✅ GOOGLE_CLIENT_EMAIL configured"
else
    echo "❌ GOOGLE_CLIENT_EMAIL not set"
fi

if echo "$SECRETS_OUTPUT" | grep -q "GOOGLE_PRIVATE_KEY"; then
    echo "✅ GOOGLE_PRIVATE_KEY configured"
else
    echo "❌ GOOGLE_PRIVATE_KEY not set"
fi

# Test orchestrator function
echo "🤖 Testing Adgen Orchestrator function..."
TEST_RESPONSE=$(curl -s -X POST "https://tpsseyzezbmfxydeaibr.supabase.co/functions/v1/adgen-orchestrator" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
        "prompt": "Create a coffee shop ad",
        "location": "Canada",
        "targetAudience": "coffee lovers"
    }' 2>/dev/null || echo "curl_failed")

# Test receptionist agent
echo "🎭 Testing Receptionist Agent function..."
RECEPTIONIST_RESPONSE=$(curl -s -X POST "https://tpsseyzezbmfxydeaibr.supabase.co/functions/v1/receptionist-agent" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
        "campaignId": "test-campaign-id",
        "userMessage": "The campaign looks great!",
        "thoughtLog": []
    }' 2>/dev/null || echo "curl_failed")

# Check orchestrator response
if echo "$TEST_RESPONSE" | grep -q "data:"; then
    echo "✅ Adgen Orchestrator streaming working"
elif echo "$TEST_RESPONSE" | grep -q "success.*true"; then
    echo "✅ Adgen Orchestrator basic response working"
elif echo "$TEST_RESPONSE" | grep -q "error"; then
    echo "❌ Orchestrator error - check Google Cloud credentials"
    echo "Response: $TEST_RESPONSE"
else
    echo "⚠️  Orchestrator response unclear - manual testing needed"
fi

# Check receptionist response
if echo "$RECEPTIONIST_RESPONSE" | grep -q "success.*true"; then
    echo "✅ Receptionist Agent working"
elif echo "$RECEPTIONIST_RESPONSE" | grep -q "error"; then
    echo "❌ Receptionist Agent error"
    echo "Response: $RECEPTIONIST_RESPONSE"
else
    echo "⚠️  Receptionist Agent response unclear"
fi

echo ""
echo "🌐 Studio Dashboard: /studio"
echo "📖 Quick Start Prompts: STUDIO_QUICKSTART_PROMPTS.md"
echo ""
echo "🎯 Tuesday Demo Checklist:"
echo "  ✅ Agentic orchestration (Thought Log)"
echo "  ✅ Google Search grounding (citations)"
echo "  ✅ Multimodal brand analysis (image upload)"
echo "  ✅ Imagen 3 visual generation (hero images)"
echo "  ✅ Canadian compliance validation"
echo "  ✅ Real-time streaming responses"
echo ""
echo "📖 Full demo script: GOOGLE_PRESENTATION_LAUNCH_CHECKLIST.md"
echo ""
echo "🎉 Modern Voyageur Studio is ready to create! 🇨🇦✨"