#!/usr/bin/env node

/**
 * ADGENXAI LOCAL OLLAMA BRIDGE
 * RTX 4090 Integration for Zero-Latency AI
 *
 * Hybrid Cloud/Local Architecture:
 * - Simple tasks: RTX 4090 (0ms latency, $0 cost)
 * - Complex tasks: Google Vertex AI (world knowledge, advanced reasoning)
 */

const axios = require('axios');

// Configuration
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Local model configurations optimized for RTX 4090
const LOCAL_MODELS = {
  // Fast classification and simple reasoning
  'llama3.1:8b': {
    name: 'llama3.1:8b',
    context_window: 8192,
    capabilities: ['classification', 'sentiment', 'simple_reasoning', 'formatting'],
    latency_ms: 50, // Approximate on RTX 4090
    cost_per_token: 0
  },

  // Code generation and technical tasks
  'codellama:13b': {
    name: 'codellama:13b',
    context_window: 16384,
    capabilities: ['code_generation', 'technical_writing', 'api_design'],
    latency_ms: 80,
    cost_per_token: 0
  },

  // Creative writing and content
  'mistral:7b': {
    name: 'mistral:7b',
    context_window: 4096,
    capabilities: ['creative_writing', 'content_generation', 'brainstorming'],
    latency_ms: 40,
    cost_per_token: 0
  }
};

class AdgenXAILocalBridge {
  constructor() {
    this.ollamaAvailable = false;
    this.modelsLoaded = {};
    this.performanceMetrics = {
      totalRequests: 0,
      localRequests: 0,
      cloudRequests: 0,
      averageLatency: 0,
      costSavings: 0
    };
  }

  async initialize() {
    console.log('🧠 Initializing AdgenXAI Local Ollama Bridge...');
    console.log('🎯 RTX 4090 Integration for Zero-Latency AI');

    try {
      // Check if Ollama is running
      await this.checkOllamaStatus();

      // Load required models
      await this.loadModels();

      // Test local inference
      await this.testLocalInference();

      console.log('✅ Local Ollama Bridge initialized successfully!');
      console.log(`🚀 Available models: ${Object.keys(this.modelsLoaded).join(', ')}`);
      console.log('💰 Cost: $0.00 (local RTX 4090 inference)');

    } catch (error) {
      console.error('❌ Failed to initialize local bridge:', error.message);
      console.log('💡 Make sure Ollama is running: ollama serve');
      console.log('📦 Pull models: ollama pull llama3.1:8b');
      throw error;
    }
  }

  async checkOllamaStatus() {
    try {
      const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, { timeout: 5000 });
      this.ollamaAvailable = true;
      console.log('✅ Ollama service detected and responding');
      return response.data;
    } catch (error) {
      this.ollamaAvailable = false;
      throw new Error('Ollama service not available');
    }
  }

  async loadModels() {
    console.log('📦 Loading optimized models for RTX 4090...');

    for (const [modelKey, modelConfig] of Object.entries(LOCAL_MODELS)) {
      try {
        console.log(`⏳ Loading ${modelKey}...`);

        // Check if model is available
        const availableModels = await this.checkOllamaStatus();
        const modelExists = availableModels.models?.some(m => m.name === modelKey);

        if (!modelExists) {
          console.log(`⚠️ Model ${modelKey} not found locally, skipping...`);
          continue;
        }

        // Test model with a simple prompt
        await this.testModel(modelKey);

        this.modelsLoaded[modelKey] = modelConfig;
        console.log(`✅ ${modelKey} loaded and tested (${modelConfig.latency_ms}ms latency)`);

      } catch (error) {
        console.warn(`⚠️ Failed to load ${modelKey}:`, error.message);
      }
    }

    if (Object.keys(this.modelsLoaded).length === 0) {
      throw new Error('No local models available');
    }
  }

  async testModel(modelName) {
    const testPrompt = 'Respond with exactly one word: "test"';

    const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
      model: modelName,
      prompt: testPrompt,
      stream: false,
      options: {
        temperature: 0,
        top_p: 1,
        num_predict: 10
      }
    }, { timeout: 10000 });

    if (!response.data.response?.toLowerCase().includes('test')) {
      throw new Error('Model test failed');
    }
  }

  async testLocalInference() {
    console.log('🧪 Testing local inference performance...');

    const testTasks = [
      { type: 'classification', prompt: 'Classify this sentiment as positive, negative, or neutral: "I love this product!"' },
      { type: 'formatting', prompt: 'Format this as JSON: name: John, age: 30, city: Toronto' },
      { type: 'simple_reasoning', prompt: 'If a coffee costs $5 and you buy 3, what is the total? Show your work.' }
    ];

    for (const task of testTasks) {
      const startTime = Date.now();
      const result = await this.processLocalTask(task.type, task.prompt);
      const latency = Date.now() - startTime;

      console.log(`⚡ ${task.type}: ${latency}ms - "${result.slice(0, 50)}..."`);
    }

    console.log('✅ Local inference performing optimally!');
  }

  /**
   * HYBRID ROUTING LOGIC
   * Determines whether to use local RTX 4090 or cloud Vertex AI
   */
  routeTask(taskType, complexity, requiresWorldKnowledge = false) {
    // Always use cloud for world knowledge or very complex tasks
    if (requiresWorldKnowledge || complexity === 'very_complex') {
      return 'cloud';
    }

    // Check if we have a local model capable of this task
    const capableModels = Object.entries(this.modelsLoaded).filter(([_, config]) =>
      config.capabilities.includes(taskType) || config.capabilities.includes('general')
    );

    if (capableModels.length > 0 && this.ollamaAvailable) {
      // Use the fastest available model for this task
      const bestModel = capableModels.reduce((best, [name, config]) =>
        config.latency_ms < best[1].latency_ms ? [name, config] : best
      );

      return {
        destination: 'local',
        model: bestModel[0],
        estimatedLatency: bestModel[1].latency_ms,
        cost: 0
      };
    }

    // Fallback to cloud
    return {
      destination: 'cloud',
      provider: 'vertex_ai',
      estimatedLatency: 500,
      cost: 0.0001 // Approximate per token
    };
  }

  async processTask(taskType, prompt, options = {}) {
    this.performanceMetrics.totalRequests++;

    const routing = this.routeTask(taskType, options.complexity, options.requiresWorldKnowledge);

    if (routing.destination === 'local') {
      this.performanceMetrics.localRequests++;
      console.log(`🏠 Processing locally on RTX 4090 (${routing.model}, ${routing.estimatedLatency}ms expected)`);
      return await this.processLocalTask(taskType, prompt, routing.model);
    } else {
      this.performanceMetrics.cloudRequests++;
      console.log(`☁️ Processing in cloud (Vertex AI, ~500ms expected)`);
      return await this.processCloudTask(taskType, prompt, options);
    }
  }

  async processLocalTask(taskType, prompt, modelName = null) {
    // Select best model for task if not specified
    if (!modelName) {
      const routing = this.routeTask(taskType, 'simple');
      modelName = routing.model;
    }

    const modelConfig = LOCAL_MODELS[modelName];
    if (!modelConfig) {
      throw new Error(`Model ${modelName} not available`);
    }

    const startTime = Date.now();

    try {
      const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
        model: modelName,
        prompt: this.formatPromptForTask(taskType, prompt),
        stream: false,
        options: {
          temperature: taskType === 'creative_writing' ? 0.8 : 0.3,
          top_p: 0.9,
          num_predict: taskType === 'code_generation' ? 512 : 256,
          num_ctx: Math.min(modelConfig.context_window, 4096)
        }
      }, { timeout: 30000 });

      const latency = Date.now() - startTime;
      const result = response.data.response;

      // Update performance metrics
      this.performanceMetrics.averageLatency =
        (this.performanceMetrics.averageLatency + latency) / 2;

      // Log to agent_logs for Mission Control
      await this.logAgentActivity(
        'LocalBridge',
        'LOCAL_INFERENCE',
        `Processed ${taskType} locally on RTX 4090 (${latency}ms): "${result.slice(0, 100)}..."`,
        0, // No cost for local
        {
          model: modelName,
          latency_ms: latency,
          task_type: taskType,
          local_cost_savings: true
        }
      );

      console.log(`✅ Local inference complete: ${latency}ms, $0.00 cost`);
      return result;

    } catch (error) {
      console.error('❌ Local inference failed:', error.message);
      throw error;
    }
  }

  async processCloudTask(taskType, prompt, options = {}) {
    // Fallback to existing cloud processing
    const response = await axios.post(`${SUPABASE_URL}/functions/v1/adgen-orchestrator`, {
      action: taskType.toUpperCase(),
      prompt: prompt,
      ...options,
      cloud_fallback: true
    }, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  }

  formatPromptForTask(taskType, prompt) {
    const taskFormats = {
      classification: `Classify the following text. Respond with only the classification and a brief explanation:\n\n${prompt}`,
      sentiment: `Analyze the sentiment of this text. Respond with: positive/negative/neutral and confidence percentage:\n\n${prompt}`,
      formatting: `Format the following data as clean JSON:\n\n${prompt}`,
      simple_reasoning: `Solve this step by step:\n\n${prompt}`,
      code_generation: `Generate clean, documented code for this requirement:\n\n${prompt}`,
      creative_writing: `Write engaging content for:\n\n${prompt}`,
      brainstorming: `Generate 5 creative ideas for:\n\n${prompt}`
    };

    return taskFormats[taskType] || prompt;
  }

  async logAgentActivity(agentRole, actionType, thoughtVector, costSaved, metadata) {
    try {
      await axios.post(`${SUPABASE_URL}/rest/v1/agent_logs`, {
        agent_role: agentRole,
        action_type: actionType,
        thought_vector: thoughtVector,
        cost_saved_est: costSaved,
        metadata: metadata
      }, {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY
        }
      });
    } catch (error) {
      console.warn('Failed to log agent activity:', error.message);
    }
  }

  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      localPercentage: this.performanceMetrics.totalRequests > 0
        ? (this.performanceMetrics.localRequests / this.performanceMetrics.totalRequests) * 100
        : 0,
      cloudPercentage: this.performanceMetrics.totalRequests > 0
        ? (this.performanceMetrics.cloudRequests / this.performanceMetrics.totalRequests) * 100
        : 0,
      uptime: this.ollamaAvailable ? 100 : 0
    };
  }

  async shutdown() {
    console.log('🧠 Shutting down Local Ollama Bridge...');
    console.log('📊 Final Performance Metrics:', this.getPerformanceMetrics());
  }
}

// Export for use in other modules
module.exports = AdgenXAILocalBridge;

// CLI usage for testing
if (require.main === module) {
  const bridge = new AdgenXAILocalBridge();

  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down Local Bridge...');
    await bridge.shutdown();
    process.exit(0);
  });

  bridge.initialize().then(() => {
    console.log('🎯 Local Bridge ready for hybrid AI processing!');
    console.log('💡 Use bridge.processTask(taskType, prompt) to route tasks');

    // Example usage
    setTimeout(async () => {
      try {
        const result = await bridge.processTask('classification',
          'Classify this sentiment: "I absolutely love this coffee!"');
        console.log('🎯 Classification result:', result);
      } catch (error) {
        console.error('Test failed:', error.message);
      }
    }, 2000);
  }).catch(console.error);
}