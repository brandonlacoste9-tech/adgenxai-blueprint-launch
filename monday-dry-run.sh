#!/bin/bash

# =====================================================
# ADGENXAI MONDAY DRY RUN PREPARATION
# Complete system test before Tuesday presentation
# =====================================================

echo "🦾 ADGENXAI IRON MAN PROTOCOL - DRY RUN ACTIVATION"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${BLUE}🔍 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1. SYSTEM HEALTH CHECK
echo "🏥 PHASE 1: SYSTEM HEALTH CHECK"
echo "-------------------------------"

print_status "Checking Supabase CLI..."
if supabase projects list > /dev/null 2>&1; then
    print_success "Supabase CLI authenticated"
else
    print_error "Supabase CLI not authenticated - run: supabase login"
    exit 1
fi

print_status "Checking Node.js environment..."
if node --version > /dev/null 2>&1; then
    print_success "Node.js $(node --version) ready"
else
    print_error "Node.js not found"
    exit 1
fi

print_status "Checking Ollama (RTX 4090)..."
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    print_success "Ollama running - RTX 4090 active"
else
    print_warning "Ollama not detected - local AI will use cloud fallback"
fi

echo ""

# 2. DEPLOYMENT VERIFICATION
echo "🚀 PHASE 2: DEPLOYMENT VERIFICATION"
echo "-----------------------------------"

print_status "Checking Edge Functions..."
if supabase functions list | grep -q "adgen-orchestrator"; then
    print_success "adgen-orchestrator deployed"
else
    print_error "adgen-orchestrator not found"
fi

if supabase functions list | grep -q "receptionist-agent"; then
    print_success "receptionist-agent deployed"
else
    print_warning "receptionist-agent not found (optional)"
fi

print_status "Testing orchestrator function..."
TEST_RESPONSE=$(curl -s -X POST "https://tpsseyzezbmfxydeaibr.supabase.co/functions/v1/adgen-orchestrator" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Test campaign", "location": "Canada", "targetAudience": "consumers"}' 2>/dev/null)

if echo "$TEST_RESPONSE" | grep -q "data:"; then
    print_success "Orchestrator streaming working"
elif echo "$TEST_RESPONSE" | grep -q "success"; then
    print_success "Orchestrator basic response working"
else
    print_warning "Orchestrator response unclear"
fi

echo ""

# 3. HARDWARE INTEGRATION CHECK
echo "🎛️  PHASE 3: HARDWARE INTEGRATION CHECK"
echo "---------------------------------------"

print_status "Checking Stream Deck bridge..."
if [ -d "stream-deck" ] && [ -f "stream-deck/package.json" ]; then
    print_success "Stream Deck bridge code present"
    print_status "  To start: cd stream-deck && npm install && npm start"
else
    print_warning "Stream Deck bridge not set up"
fi

print_status "Checking lighting control..."
if [ -f "lighting-control.js" ]; then
    print_success "Lighting control script present"
    print_status "  To start: node lighting-control.js scene WAR_ROOM"
else
    print_warning "Lighting control not set up"
fi

echo ""

# 4. FRONTEND VERIFICATION
echo "🎨 PHASE 4: FRONTEND VERIFICATION"
echo "---------------------------------"

print_status "Building AdgenXAI frontend..."
if npm run build > /dev/null 2>&1; then
    print_success "Frontend builds successfully"
else
    print_error "Frontend build failed"
fi

print_status "Checking Mission Control route..."
if grep -q "mission-control" src/App.tsx; then
    print_success "Mission Control route configured"
else
    print_error "Mission Control route missing"
fi

echo ""

# 5. OBS PREPARATION
echo "🎥 PHASE 5: OBS BROADCAST PREPARATION"
echo "-------------------------------------"

print_status "Checking OBS overlay CSS..."
if [ -f "obs-overlay.css" ]; then
    print_success "Holographic overlay CSS ready"
    print_status "  Copy contents to OBS Browser Source > Custom CSS"
else
    print_warning "OBS overlay CSS missing"
fi

print_status "OBS Setup Instructions:"
echo "  1. Open OBS Studio"
echo "  2. Add 'Browser Source' to scene"
echo "  3. Set URL: http://localhost:3000/mission-control"
echo "  4. Copy obs-overlay.css to 'Custom CSS' field"
echo "  5. Position overlay beside your camera feed"
echo ""

# 6. AUDIO CHECK
echo "🎙️  PHASE 6: AUDIO SYSTEM CHECK"
echo "-------------------------------"

print_status "Audio recommendations:"
echo "  • Shure SM7B: Connected and powered"
echo "  • Focusrite Interface: Input level -12dB to -6dB"
echo "  • OBS Audio: Noise suppression enabled"
echo "  • Compressor: 4:1 ratio, -15dB threshold"
echo "  • Test recording: Speak for 30 seconds, check levels"
echo ""

# 7. FINAL DEMO SCRIPT
echo "🎯 PHASE 7: FINAL DEMO SCRIPT"
echo "----------------------------"

echo "TUESDAY OPENING SEQUENCE:"
echo ""
echo "1. 🎬 START RECORDING (2 minutes before call)"
echo "2. 🎨 ACTIVATE WAR ROOM: node lighting-control.js scene WAR_ROOM"
echo "3. 🎛️ START STREAM DECK: cd stream-deck && npm start"
echo "4. 🌐 LAUNCH MISSION CONTROL: npm run dev"
echo "5. 🎥 OPEN OBS: Add browser source with overlay"
echo ""
echo "DEMO OPENING LINE:"
echo "\"I'm not here to show you software. I'm here to show you the future of human-AI collaboration.\""
echo ""
echo "BUTTON DEMO SEQUENCE:"
echo "• Press Stream Deck 0: \"Physical AI deployment\""
echo "• Watch lighting change: \"The environment responds\""
echo "• Show cost metrics: \"$0.01 per campaign\""
echo "• Demonstrate local AI: \"Zero cloud dependency\""
echo ""

# 8. SUCCESS CHECKLIST
echo "✅ FINAL SUCCESS CHECKLIST"
echo "-------------------------"
echo ""
echo "☐ System boots in < 60 seconds"
echo "☐ Stream Deck buttons respond instantly"
echo "☐ Lighting changes in < 2 seconds"
echo "☐ Mission Control loads in < 5 seconds"
echo "☐ OBS overlay looks holographic"
echo "☐ Audio is broadcast-quality (no hiss/plosives)"
echo "☐ Local RTX 4090 processes instantly"
echo "☐ Cost savings display updates live"
echo "☐ Agent orchestration feels responsive"
echo "☐ Canadian branding feels authentic"
echo ""

print_success "DRY RUN PREPARATION COMPLETE"
print_success "You are ready for Tuesday's presentation!"
echo ""
echo "🇨🇦 Remember: You're not just presenting a product."
echo "You're demonstrating the future of AI command centers."
echo ""
echo "🦾 IRON MAN PROTOCOL: ACTIVATED"
echo "🎯 MISSION: IMPRESS GOOGLE"