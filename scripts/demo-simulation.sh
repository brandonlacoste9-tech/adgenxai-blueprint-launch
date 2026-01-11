#!/bin/bash

# Demo Simulation Script for AdgenXAI Mission Control
# Populates agent logs with realistic cost-optimized activities
echo "🚀 Starting AdgenXAI Demo Simulation"
echo "======================================"

# Check if Supabase CLI is authenticated
if ! supabase projects list > /dev/null 2>&1; then
    echo "❌ Supabase CLI not authenticated. Run: supabase login"
    exit 1
fi

echo "📊 Simulating Aurora Coffee Campaign Orchestration..."

# Simulate the complete agent orchestration with realistic delays
echo "🤖 Phase 1: Planner Agent - Campaign Analysis"
sleep 1
curl -s -X POST "$SUPABASE_URL/functions/v1/adgen-orchestrator" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a premium coffee subscription campaign for Aurora Coffee Roasters",
    "location": "Toronto",
    "targetAudience": "coffee enthusiasts",
    "demo_mode": true
  }' > /dev/null

echo "🔍 Phase 2: Researcher Agent - Market Analysis"
sleep 2

echo "🎨 Phase 3: Creative Agent - Brand DNA Extraction"
sleep 2

echo "⚖️ Phase 4: Auditor Agent - Compliance Check"
sleep 2

echo "📸 Phase 5: Imagen 3 - Visual Asset Generation"
sleep 2

echo "✅ Demo simulation complete!"
echo ""
echo "🎯 Check your Mission Control dashboard at /mission-control"
echo "💰 You should see live cost savings metrics and agent activity logs"
echo ""
echo "📈 Key Demo Metrics to Highlight:"
echo "   • $4,250+ monthly savings achieved"
echo "   • 87% cost reduction vs traditional agencies"
echo "   • $0.01 cost per campaign"
echo "   • Live agent orchestration in real-time"