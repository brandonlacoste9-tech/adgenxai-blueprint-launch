#!/usr/bin/env node

/**
 * ADGENXAI STREAM DECK BRIDGE
 * Physical Command Center Integration
 *
 * Connects Elgato Stream Deck buttons to AI Agent orchestration
 * Part of the Iron Man Protocol for Tuesday Google Presentation
 */

const axios = require('axios');

// Configuration - Update these for your setup
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const MISSION_CONTROL_URL = process.env.MISSION_CONTROL_URL || 'http://localhost:3000/mission-control';

// Button mappings for different agent actions
const BUTTON_ACTIONS = {
  0: { name: 'DEPLOY_RESEARCHER', icon: '🔍', color: '#3b82f6' },
  1: { name: 'DEPLOY_CREATIVE', icon: '🎨', color: '#d4af37' },
  2: { name: 'DEPLOY_AUDITOR', icon: '⚖️', color: '#ef4444' },
  3: { name: 'COST_OPTIMIZATION', icon: '💰', color: '#10b981' },
  4: { name: 'WAR_ROOM_LIGHTING', icon: '💡', color: '#f59e0b' },
  5: { name: 'VOICE_ACTIVATION', icon: '🎤', color: '#8b5cf6' },
  6: { name: 'SYSTEM_STATUS', icon: '📊', color: '#06b6d4' },
  7: { name: 'EMERGENCY_STOP', icon: '⏹️', color: '#dc2626' },
  8: { name: 'DEMO_MODE', icon: '🎭', color: '#ec4899' },
  9: { name: 'FULL_ORCHESTRATION', icon: '🚀', color: '#059669' }
};

class AdgenXAIStreamDeck {
  constructor() {
    this.streamDeck = null;
    this.isConnected = false;
    this.lastPressTime = 0;
    this.cooldownMs = 1000; // Prevent button spam
  }

  async initialize() {
    try {
      console.log('🎛️ Initializing AdgenXAI Stream Deck Bridge...');

      // Dynamic import for streamdeck-util
      const { openStreamDeck } = await import('streamdeck-util');

      this.streamDeck = openStreamDeck();

      if (!this.streamDeck) {
        throw new Error('No Stream Deck device found');
      }

      this.setupButtonHandlers();
      this.updateButtonDisplays();

      this.isConnected = true;
      console.log('✅ Stream Deck connected and ready!');
      console.log('🎯 Button mappings loaded for Iron Man Protocol');

    } catch (error) {
      console.error('❌ Failed to initialize Stream Deck:', error.message);
      console.log('💡 Make sure your Stream Deck is connected and drivers are installed');
      process.exit(1);
    }
  }

  setupButtonHandlers() {
    this.streamDeck.on('down', async (keyIndex) => {
      const now = Date.now();

      // Prevent button spam
      if (now - this.lastPressTime < this.cooldownMs) {
        return;
      }

      this.lastPressTime = now;
      await this.handleButtonPress(keyIndex);
    });

    this.streamDeck.on('up', (keyIndex) => {
      // Optional: Handle button release if needed
    });

    this.streamDeck.on('error', (error) => {
      console.error('🎛️ Stream Deck error:', error);
    });
  }

  async handleButtonPress(keyIndex) {
    const action = BUTTON_ACTIONS[keyIndex];

    if (!action) {
      console.log(`⚠️ Unmapped button ${keyIndex} pressed`);
      return;
    }

    console.log(`🔥 ${action.icon} ${action.name} activated!`);

    try {
      switch (action.name) {
        case 'DEPLOY_RESEARCHER':
          await this.deployResearcherAgent();
          break;
        case 'DEPLOY_CREATIVE':
          await this.deployCreativeAgent();
          break;
        case 'DEPLOY_AUDITOR':
          await this.deployAuditorAgent();
          break;
        case 'COST_OPTIMIZATION':
          await this.showCostOptimization();
          break;
        case 'WAR_ROOM_LIGHTING':
          await this.triggerWarRoomLighting();
          break;
        case 'VOICE_ACTIVATION':
          await this.toggleVoiceActivation();
          break;
        case 'SYSTEM_STATUS':
          await this.showSystemStatus();
          break;
        case 'EMERGENCY_STOP':
          await this.emergencyStop();
          break;
        case 'DEMO_MODE':
          await this.activateDemoMode();
          break;
        case 'FULL_ORCHESTRATION':
          await this.fullOrchestration();
          break;
      }

      // Visual feedback - flash button
      this.flashButton(keyIndex, action.color);

    } catch (error) {
      console.error(`❌ Error executing ${action.name}:`, error.message);
      this.flashButton(keyIndex, '#dc2626'); // Red flash for error
    }
  }

  async deployResearcherAgent() {
    console.log('🔍 Deploying Researcher Agent - Grounding with Google Search...');

    const response = await axios.post(`${SUPABASE_URL}/functions/v1/adgen-orchestrator`, {
      action: 'RESEARCH',
      prompt: 'Analyze current Canadian coffee market trends and competitor analysis',
      location: 'Canada',
      grounding_required: true
    }, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Researcher Agent deployed successfully');
    return response.data;
  }

  async deployCreativeAgent() {
    console.log('🎨 Deploying Creative Agent - Modern Voyageur brand DNA extraction...');

    const response = await axios.post(`${SUPABASE_URL}/functions/v1/adgen-orchestrator`, {
      action: 'CREATIVE',
      prompt: 'Generate Aurora Coffee campaign with leather and gold aesthetic',
      brand_style: 'Modern Voyageur',
      colors: ['#3d2b1f', '#d4af37']
    }, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Creative Agent deployed successfully');
    return response.data;
  }

  async deployAuditorAgent() {
    console.log('⚖️ Deploying Auditor Agent - CRTC compliance verification...');

    const response = await axios.post(`${SUPABASE_URL}/functions/v1/adgen-orchestrator`, {
      action: 'AUDIT',
      standards: ['CRTC', 'PIPEDA', 'WCAG'],
      region: 'Canada'
    }, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Auditor Agent deployed successfully');
    return response.data;
  }

  async showCostOptimization() {
    console.log('💰 Activating cost optimization mode...');

    // Open Mission Control with cost focus
    await axios.post(`${MISSION_CONTROL_URL}/api/focus`, {
      mode: 'cost_optimization',
      highlight_metrics: ['totalSavings', 'cacheHitRate', 'costPerCampaign']
    });

    console.log('✅ Cost optimization dashboard activated');
  }

  async triggerWarRoomLighting() {
    console.log('💡 Activating War Room lighting - Cognac & Gold focus...');

    // This would integrate with Philips Hue, LIFX, or Home Assistant
    // For demo purposes, we'll simulate the lighting change
    try {
      await axios.post('http://localhost:8123/api/services/light/turn_on', {
        entity_id: 'light.war_room_main',
        brightness: 150,
        rgb_color: [212, 175, 55], // Gold color
        transition: 2
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.HOME_ASSISTANT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ War Room lighting activated - Modern Voyageur ambiance');
    } catch (error) {
      console.log('💡 War Room lighting simulated (Home Assistant not connected)');
    }
  }

  async toggleVoiceActivation() {
    console.log('🎤 Toggling voice activation for agent commands...');

    // This would integrate with voice recognition (Google Speech-to-Text, etc.)
    // For demo, we'll toggle a voice command mode
    await axios.post(`${MISSION_CONTROL_URL}/api/voice-mode`, {
      enabled: true,
      wake_word: 'AdgenXAI',
      commands: ['deploy researcher', 'deploy creative', 'show costs', 'emergency stop']
    });

    console.log('✅ Voice activation enabled - Say "AdgenXAI, deploy researcher"');
  }

  async showSystemStatus() {
    console.log('📊 Displaying comprehensive system status...');

    // Get real-time system metrics
    const response = await axios.get(`${SUPABASE_URL}/functions/v1/system-status`);

    console.log('📈 System Status:');
    console.log(`   • Active Campaigns: ${response.data.activeCampaigns}`);
    console.log(`   • Agent Uptime: ${response.data.agentUptime}%`);
    console.log(`   • Cost Savings: $${response.data.totalSavings}`);
    console.log(`   • Cache Hit Rate: ${response.data.cacheHitRate}%`);
  }

  async emergencyStop() {
    console.log('⏹️ EMERGENCY STOP activated - halting all agent operations...');

    // Stop all running agents and processes
    await axios.post(`${SUPABASE_URL}/functions/v1/emergency-stop`, {}, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    // Reset lighting to normal
    await this.resetWarRoomLighting();

    console.log('✅ All systems safely stopped');
  }

  async activateDemoMode() {
    console.log('🎭 Activating Demo Mode - Aurora Coffee campaign pre-loaded...');

    await axios.post(`${SUPABASE_URL}/functions/v1/demo-mode`, {
      campaign: 'Aurora Coffee Winter Launch',
      assets: ['storefront-photo.jpg', 'brand-guidelines.pdf'],
      target_audience: 'coffee-enthusiasts'
    }, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Demo Mode activated - Ready for Google presentation');
  }

  async fullOrchestration() {
    console.log('🚀 Initiating FULL ORCHESTRATION - Complete Aurora Coffee campaign...');

    await axios.post(`${SUPABASE_URL}/functions/v1/adgen-orchestrator`, {
      action: 'FULL_ORCHESTRATION',
      prompt: 'Create complete Aurora Coffee winter campaign with research, creative, and compliance',
      brand_image: 'aurora-coffee-storefront.jpg',
      location: 'Toronto',
      target_audience: 'coffee-enthusiasts',
      budget_optimization: true,
      real_time_demo: true
    }, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Full orchestration initiated - Watch Mission Control for live agent activity!');
  }

  async resetWarRoomLighting() {
    try {
      await axios.post('http://localhost:8123/api/services/light/turn_on', {
        entity_id: 'light.war_room_main',
        brightness: 255,
        rgb_color: [255, 255, 255], // Reset to white
        transition: 1
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.HOME_ASSISTANT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      // Silently fail if Home Assistant not connected
    }
  }

  flashButton(keyIndex, color) {
    if (!this.streamDeck) return;

    // Quick visual feedback
    setTimeout(() => {
      // Reset button after flash
    }, 200);
  }

  updateButtonDisplays() {
    if (!this.streamDeck) return;

    // Update button labels and colors based on current state
    Object.entries(BUTTON_ACTIONS).forEach(([keyIndex, action]) => {
      // Set button color and icon
      this.streamDeck.fillColor(Number(keyIndex), action.color);
    });
  }

  cleanup() {
    if (this.streamDeck) {
      console.log('🎛️ Cleaning up Stream Deck connection...');
      this.streamDeck.close();
    }
  }
}

// Main execution
async function main() {
  console.log('🔥 ADGENXAI IRON MAN PROTOCOL ACTIVATED');
  console.log('=====================================');
  console.log('Physical Command Center Online');
  console.log('Stream Deck → AI Agents → Mission Control');
  console.log('');

  const bridge = new AdgenXAIStreamDeck();

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Stream Deck Bridge...');
    bridge.cleanup();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down Stream Deck Bridge...');
    bridge.cleanup();
    process.exit(0);
  });

  await bridge.initialize();

  // Keep the process running
  console.log('🎯 Stream Deck Bridge active. Press buttons to command AI agents!');
  console.log('📋 Button mappings:');
  Object.entries(BUTTON_ACTIONS).forEach(([key, action]) => {
    console.log(`   Button ${key}: ${action.icon} ${action.name}`);
  });
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = AdgenXAIStreamDeck;