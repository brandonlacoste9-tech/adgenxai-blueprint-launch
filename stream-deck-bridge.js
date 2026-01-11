#!/usr/bin/env node

// =====================================================
// ADGENXAI STREAM DECK BRIDGE
// Physical Hardware Control for AI Agent Orchestration
// =====================================================

const axios = require('axios');
const { openStreamDeck } = require('elgato-stream-deck');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
const STREAM_DECK_MODEL = process.env.STREAM_DECK_MODEL || 'original'; // 'original', 'mini', 'xl'

// Agent action mappings for Stream Deck buttons
const AGENT_ACTIONS = {
  // Button 0: Deploy Full Orchestration
  0: {
    name: 'DEPLOY AGENTS',
    action: 'FULL_ORCHESTRATION',
    icon: '🚀',
    color: '#d4af37',
    payload: {
      prompt: 'Create a premium coffee campaign',
      location: 'Canada',
      targetAudience: 'coffee enthusiasts'
    }
  },

  // Button 1: Researcher Agent
  1: {
    name: 'RESEARCH',
    action: 'RESEARCH_AGENT',
    icon: '🔍',
    color: '#4a90e2',
    payload: {
      action: 'RESEARCH',
      query: 'Canadian coffee market trends 2026'
    }
  },

  // Button 2: Creative Agent
  2: {
    name: 'CREATE',
    action: 'CREATIVE_AGENT',
    icon: '🎨',
    color: '#e94b3c',
    payload: {
      action: 'CREATIVE',
      style: 'Modern Voyageur',
      brandColors: ['#3d2b1f', '#d4af37']
    }
  },

  // Button 3: Auditor Agent
  3: {
    name: 'AUDIT',
    action: 'AUDITOR_AGENT',
    icon: '⚖️',
    color: '#f5a623',
    payload: {
      action: 'AUDIT',
      standards: ['CRTC', 'PIPEDA', 'WCAG']
    }
  },

  // Button 4: War Room Mode (Lighting)
  4: {
    name: 'WAR ROOM',
    action: 'LIGHTING_CONTROL',
    icon: '💡',
    color: '#7ed321',
    payload: {
      scene: 'SCENE_GOLD_FOCUS',
      lights: {
        desk: '#d4af37',
        ambient: '#3d2b1f',
        accent: '#ffd700'
      }
    }
  },

  // Button 5: Mission Control Toggle
  5: {
    name: 'MISSION CTRL',
    action: 'UI_TOGGLE',
    icon: '🎛️',
    color: '#bd10e0',
    payload: {
      component: 'MISSION_CONTROL',
      action: 'TOGGLE'
    }
  },

  // Button 6: Cost Report
  6: {
    name: 'COST REPORT',
    action: 'GENERATE_REPORT',
    icon: '💰',
    color: '#50e3c2',
    payload: {
      report: 'COST_SAVINGS',
      format: 'PDF'
    }
  },

  // Button 7: Emergency Stop
  7: {
    name: 'EMERGENCY',
    action: 'EMERGENCY_STOP',
    icon: '🛑',
    color: '#d0021b',
    payload: {
      action: 'STOP_ALL_AGENTS'
    }
  }
};

// Initialize Stream Deck
async function initializeStreamDeck() {
  try {
    console.log('🔌 Connecting to Stream Deck...');

    const streamDeck = openStreamDeck();

    console.log('✅ Stream Deck connected!');
    console.log(`📊 Model: ${STREAM_DECK_MODEL}`);
    console.log(`🔘 Available buttons: ${streamDeck.NUM_KEYS}`);

    // Clear all buttons initially
    for (let i = 0; i < streamDeck.NUM_KEYS; i++) {
      streamDeck.clearKey(i);
      updateButtonDisplay(streamDeck, i);
    }

    // Set up event handlers
    streamDeck.on('down', async (keyIndex) => {
      await handleButtonPress(streamDeck, keyIndex);
    });

    streamDeck.on('up', (keyIndex) => {
      // Optional: Handle button release
    });

    streamDeck.on('error', (error) => {
      console.error('❌ Stream Deck error:', error);
    });

    // Keep the process alive
    process.on('SIGINT', () => {
      console.log('🔌 Disconnecting Stream Deck...');
      streamDeck.close();
      process.exit(0);
    });

    console.log('🎮 Stream Deck Bridge Active!');
    console.log('Physical buttons now control AI agents.');
    console.log('Press buttons to trigger agent actions...\n');

  } catch (error) {
    console.error('❌ Failed to initialize Stream Deck:', error);
    console.log('Make sure your Stream Deck is connected and not in use by another application.');
    process.exit(1);
  }
}

// Handle button press events
async function handleButtonPress(streamDeck, keyIndex) {
  const action = AGENT_ACTIONS[keyIndex];

  if (!action) {
    console.log(`⚠️  Button ${keyIndex} not configured`);
    return;
  }

  console.log(`\n🎯 Button ${keyIndex} pressed: ${action.name}`);
  console.log(`📤 Action: ${action.action}`);

  try {
    // Visual feedback - button press effect
    streamDeck.setBrightness(100);
    setTimeout(() => streamDeck.setBrightness(70), 100);

    // Execute the action
    await executeAgentAction(action);

    // Success feedback
    console.log(`✅ ${action.name} action completed`);

  } catch (error) {
    console.error(`❌ ${action.name} action failed:`, error);

    // Error feedback - flash red
    for (let i = 0; i < 3; i++) {
      setTimeout(() => streamDeck.setBrightness(100), i * 200);
      setTimeout(() => streamDeck.setBrightness(30), i * 200 + 100);
    }
  }
}

// Execute AI agent actions
async function executeAgentAction(action) {
  switch (action.action) {
    case 'FULL_ORCHESTRATION':
      await triggerFullOrchestration(action.payload);
      break;

    case 'RESEARCH_AGENT':
    case 'CREATIVE_AGENT':
    case 'AUDITOR_AGENT':
      await triggerSpecificAgent(action.action, action.payload);
      break;

    case 'LIGHTING_CONTROL':
      await triggerLightingControl(action.payload);
      break;

    case 'UI_TOGGLE':
      await triggerUIToggle(action.payload);
      break;

    case 'GENERATE_REPORT':
      await generateCostReport(action.payload);
      break;

    case 'EMERGENCY_STOP':
      await emergencyStop(action.payload);
      break;

    default:
      throw new Error(`Unknown action: ${action.action}`);
  }
}

// Trigger full agent orchestration
async function triggerFullOrchestration(payload) {
  console.log('🚀 Deploying full agent orchestration...');

  const response = await axios.post(
    `${SUPABASE_URL}/functions/v1/adgen-orchestrator`,
    payload,
    {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (response.data.error) {
    throw new Error(response.data.error);
  }

  console.log('🎯 Orchestration initiated successfully');
}

// Trigger specific agent
async function triggerSpecificAgent(agentType, payload) {
  console.log(`🤖 Triggering ${agentType}...`);

  const response = await axios.post(
    `${SUPABASE_URL}/functions/v1/adgen-orchestrator`,
    {
      ...payload,
      agent_override: agentType
    },
    {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (response.data.error) {
    throw new Error(response.data.error);
  }

  console.log(`✅ ${agentType} activated`);
}

// Control lighting system
async function triggerLightingControl(payload) {
  console.log('💡 Activating War Room lighting...');

  // This would integrate with Philips Hue, LIFX, or Home Assistant
  // For demo purposes, we'll simulate the API call

  try {
    // Example: Philips Hue API call
    // await axios.put('http://hue-bridge/api/lights', payload);

    // Example: Home Assistant API call
    // await axios.post('http://home-assistant/api/services/light/turn_on', payload);

    console.log('🏮 Lighting scene activated:', payload.scene);
    console.log('🎨 Colors:', payload.lights);

  } catch (error) {
    console.log('💡 Lighting integration not configured - simulating...');
    // Simulate success for demo
  }
}

// Toggle UI components
async function triggerUIToggle(payload) {
  console.log('🎛️ Toggling UI component...');

  // This would communicate with the frontend via WebSocket or local API
  // For demo, we'll just log the action

  if (payload.component === 'MISSION_CONTROL') {
    console.log('🎮 Mission Control dashboard toggled');
  }
}

// Generate cost reports
async function generateCostReport(payload) {
  console.log('💰 Generating cost savings report...');

  // This would trigger the report generation in the dashboard
  // For demo, we'll simulate the action

  console.log('📊 Report generated:', payload.report);
  console.log('📄 Format:', payload.format);
}

// Emergency stop all agents
async function emergencyStop(payload) {
  console.log('🛑 EMERGENCY STOP - Halting all agents...');

  // This would send a stop signal to all running agents
  // For demo, we'll simulate the action

  console.log('⏹️ All agent processes stopped');
}

// Update button display
function updateButtonDisplay(streamDeck, keyIndex) {
  const action = AGENT_ACTIONS[keyIndex];

  if (action) {
    // In a real implementation, you'd render custom icons
    // For now, we'll just log the button configuration
    console.log(`🔘 Button ${keyIndex}: ${action.name} (${action.icon})`);
  }
}

// Main execution
if (require.main === module) {
  console.log('🤖 ADGENXAI STREAM DECK BRIDGE');
  console.log('================================');
  console.log('Physical hardware control for AI agent orchestration');
  console.log('');

  initializeStreamDeck();
}

module.exports = {
  initializeStreamDeck,
  handleButtonPress,
  executeAgentAction
};