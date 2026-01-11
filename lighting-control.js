#!/usr/bin/env node

// =====================================================
// ADGENXAI LIGHTING CONTROL SYSTEM
// War Room Atmosphere for Agent Orchestration
// =====================================================

const axios = require('axios');

// Configuration
const LIGHTING_SYSTEM = process.env.LIGHTING_SYSTEM || 'hue'; // 'hue', 'lifx', 'home-assistant'
const HUE_BRIDGE_IP = process.env.HUE_BRIDGE_IP || '192.168.1.100';
const HUE_API_KEY = process.env.HUE_API_KEY || 'your-hue-api-key';
const HOME_ASSISTANT_URL = process.env.HOME_ASSISTANT_URL || 'http://home-assistant.local:8123';
const HOME_ASSISTANT_TOKEN = process.env.HOME_ASSISTANT_TOKEN || 'your-ha-token';

// Modern Voyageur Color Palette
const VOYAGEUR_COLORS = {
  cognac: { hue: 25, sat: 200, bri: 150 },      // #3d2b1f
  gold: { hue: 45, sat: 254, bri: 200 },        // #d4af37
  glass: { hue: 0, sat: 0, bri: 50 },           // Smoked glass
  accent: { hue: 55, sat: 254, bri: 254 }       // Bright gold accent
};

// Lighting Scenes for Different Modes
const LIGHTING_SCENES = {
  // Default working mode
  DEFAULT: {
    name: 'Default',
    lights: {
      desk: VOYAGEUR_COLORS.gold,
      ambient: VOYAGEUR_COLORS.glass,
      accent: VOYAGEUR_COLORS.gold
    }
  },

  // Agent orchestration mode
  ORCHESTRATION_ACTIVE: {
    name: 'Orchestration Active',
    lights: {
      desk: VOYAGEUR_COLORS.gold,
      ambient: { hue: 25, sat: 150, bri: 100 },  // Deep cognac
      accent: VOYAGEUR_COLORS.accent
    },
    effects: ['pulse', 'color_loop']
  },

  // High-focus research mode
  RESEARCH_MODE: {
    name: 'Research Mode',
    lights: {
      desk: VOYAGEUR_COLORS.gold,
      ambient: VOYAGEUR_COLORS.glass,
      accent: { hue: 200, sat: 254, bri: 150 }   // Cool blue for concentration
    }
  },

  // Creative flow mode
  CREATIVE_MODE: {
    name: 'Creative Mode',
    lights: {
      desk: VOYAGEUR_COLORS.gold,
      ambient: { hue: 300, sat: 150, bri: 120 }, // Warm purple
      accent: VOYAGEUR_COLORS.accent
    },
    effects: ['breathe']
  },

  // Presentation/War Room mode
  WAR_ROOM: {
    name: 'War Room',
    lights: {
      desk: VOYAGEUR_COLORS.cognac,
      ambient: VOYAGEUR_COLORS.gold,
      accent: VOYAGEUR_COLORS.accent
    },
    effects: ['color_loop_slow']
  },

  // Success celebration mode
  SUCCESS: {
    name: 'Success',
    lights: {
      desk: VOYAGEUR_COLORS.accent,
      ambient: VOYAGEUR_COLORS.gold,
      accent: VOYAGEUR_COLORS.accent
    },
    effects: ['flash']
  },

  // Error/alert mode
  ALERT: {
    name: 'Alert',
    lights: {
      desk: { hue: 0, sat: 254, bri: 150 },      // Red alert
      ambient: VOYAGEUR_COLORS.glass,
      accent: { hue: 0, sat: 254, bri: 200 }
    },
    effects: ['flash_fast']
  }
};

// Philips Hue Integration
class HueController {
  constructor(bridgeIp, apiKey) {
    this.baseUrl = `http://${bridgeIp}/api/${apiKey}`;
    this.lights = {};
  }

  async discoverLights() {
    try {
      const response = await axios.get(`${this.baseUrl}/lights`);
      this.lights = response.data;
      console.log(`💡 Discovered ${Object.keys(this.lights).length} Hue lights`);
      return this.lights;
    } catch (error) {
      console.error('❌ Failed to discover Hue lights:', error.message);
      throw error;
    }
  }

  async setLightState(lightId, state) {
    try {
      const response = await axios.put(`${this.baseUrl}/lights/${lightId}/state`, state);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to set light ${lightId} state:`, error.message);
      throw error;
    }
  }

  async applyScene(sceneName) {
    const scene = LIGHTING_SCENES[sceneName];
    if (!scene) {
      throw new Error(`Unknown scene: ${sceneName}`);
    }

    console.log(`🎭 Applying Hue scene: ${scene.name}`);

    // Apply lighting states (assuming light IDs 1, 2, 3 for desk, ambient, accent)
    const lightMappings = {
      desk: 1,
      ambient: 2,
      accent: 3
    };

    for (const [lightType, color] of Object.entries(scene.lights)) {
      const lightId = lightMappings[lightType];
      if (lightId && this.lights[lightId]) {
        await this.setLightState(lightId, {
          on: true,
          hue: color.hue,
          sat: color.sat,
          bri: color.bri,
          transitiontime: 10  // 1 second transition
        });
      }
    }

    // Apply effects if specified
    if (scene.effects) {
      await this.applyEffects(scene.effects);
    }
  }

  async applyEffects(effects) {
    // Apply lighting effects (simplified implementation)
    for (const effect of effects) {
      switch (effect) {
        case 'pulse':
          await this.pulseEffect();
          break;
        case 'breathe':
          await this.breatheEffect();
          break;
        case 'color_loop':
          await this.colorLoopEffect();
          break;
        case 'flash':
          await this.flashEffect();
          break;
      }
    }
  }

  async pulseEffect() {
    // Implement pulse effect
    console.log('💫 Applying pulse effect');
  }

  async breatheEffect() {
    // Implement breathe effect
    console.log('🌬️ Applying breathe effect');
  }

  async colorLoopEffect() {
    // Implement color loop effect
    console.log('🌈 Applying color loop effect');
  }

  async flashEffect() {
    // Implement flash effect
    console.log('⚡ Applying flash effect');
  }
}

// Home Assistant Integration
class HomeAssistantController {
  constructor(url, token) {
    this.baseUrl = url;
    this.headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async callService(domain, service, data) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/services/${domain}/${service}`,
        data,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Home Assistant service call failed:', error.message);
      throw error;
    }
  }

  async applyScene(sceneName) {
    const scene = LIGHTING_SCENES[sceneName];
    if (!scene) {
      throw new Error(`Unknown scene: ${sceneName}`);
    }

    console.log(`🏠 Applying Home Assistant scene: ${scene.name}`);

    // Apply lighting states via Home Assistant
    for (const [lightType, color] of Object.entries(scene.lights)) {
      const lightEntity = `light.${lightType}_light`; // Assumes entity naming convention

      await this.callService('light', 'turn_on', {
        entity_id: lightEntity,
        hs_color: [color.hue / 65535 * 360, color.sat / 254 * 100], // Convert to HS
        brightness: Math.round(color.bri / 254 * 255)
      });
    }

    // Apply effects via Home Assistant scripts/scenes
    if (scene.effects) {
      for (const effect of scene.effects) {
        await this.callService('script', effect, {});
      }
    }
  }
}

// LIFX Integration (placeholder)
class LIFXController {
  async applyScene(sceneName) {
    console.log(`💡 LIFX scene ${sceneName} not implemented yet`);
    // LIFX API integration would go here
  }
}

// Main Lighting Controller
class LightingController {
  constructor() {
    this.controller = null;
    this.initializeController();
  }

  async initializeController() {
    switch (LIGHTING_SYSTEM) {
      case 'hue':
        this.controller = new HueController(HUE_BRIDGE_IP, HUE_API_KEY);
        await this.controller.discoverLights();
        break;
      case 'home-assistant':
        this.controller = new HomeAssistantController(HOME_ASSISTANT_URL, HOME_ASSISTANT_TOKEN);
        break;
      case 'lifx':
        this.controller = new LIFXController();
        break;
      default:
        console.log('💡 No lighting system configured');
    }
  }

  async applyScene(sceneName) {
    if (!this.controller) {
      console.log('💡 Lighting controller not initialized');
      return;
    }

    try {
      await this.controller.applyScene(sceneName);
      console.log(`✅ Applied lighting scene: ${sceneName}`);
    } catch (error) {
      console.error(`❌ Failed to apply lighting scene ${sceneName}:`, error);
    }
  }

  async triggerEvent(eventType, context = {}) {
    // Map AI agent events to lighting scenes
    const sceneMapping = {
      'orchestration_start': 'ORCHESTRATION_ACTIVE',
      'research_start': 'RESEARCH_MODE',
      'creative_start': 'CREATIVE_MODE',
      'campaign_success': 'SUCCESS',
      'agent_error': 'ALERT',
      'presentation_mode': 'WAR_ROOM'
    };

    const sceneName = sceneMapping[eventType];
    if (sceneName) {
      console.log(`🎭 AI Event "${eventType}" → Lighting Scene "${sceneName}"`);
      await this.applyScene(sceneName);
    }
  }
}

// Export for use by other modules
module.exports = { LightingController, LIGHTING_SCENES };

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const sceneName = args[1];

  console.log('🎨 ADGENXAI LIGHTING CONTROL SYSTEM');
  console.log('=====================================');
  console.log(`System: ${LIGHTING_SYSTEM.toUpperCase()}`);

  const controller = new LightingController();

  // Allow direct scene triggering from command line
  if (command === 'scene' && sceneName) {
    setTimeout(() => {
      controller.applyScene(sceneName);
    }, 2000); // Wait for initialization
  } else if (command === 'event' && sceneName) {
    setTimeout(() => {
      controller.triggerEvent(sceneName);
    }, 2000);
  } else {
    console.log('Usage:');
    console.log('  node lighting-control.js scene <scene_name>');
    console.log('  node lighting-control.js event <event_type>');
    console.log('');
    console.log('Available scenes:', Object.keys(LIGHTING_SCENES).join(', '));
    console.log('Available events: orchestration_start, research_start, creative_start, campaign_success, agent_error, presentation_mode');
  }
}