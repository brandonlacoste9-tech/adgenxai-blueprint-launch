// =====================================================
// THE LOCAL NEURAL BRIDGE
// Connects AdgenXAI to your RTX 4090 via Ollama
// =====================================================

export interface LocalBrainResponse {
  response: string;
  latency: number;
  cost: number;
  model: string;
  success: boolean;
}

export async function consultLocalBrain(
  prompt: string,
  model: string = 'llama3',
  systemPrompt?: string
): Promise<LocalBrainResponse> {
  const start = performance.now();

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model, // Running on your RTX 4090
        prompt: prompt,
        stream: false,
        system: systemPrompt || "You are the AdgenXAI Local Neural Engine. Be strategic, brief, and Canadian. Focus on actionable insights.",
        options: {
          temperature: 0.7,
          top_p: 0.9,
          num_predict: 512, // Keep responses concise
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    const end = performance.now();
    const latency = parseFloat((end - start).toFixed(2));

    // LOG THIS FLEX TO THE DASHBOARD
    console.log(`⚡ RTX 4090 INFERENCE: ${latency}ms | COST: $0.00 | MODEL: ${model}`);

    return {
      response: data.response,
      latency: latency,
      cost: 0.00,
      model: model,
      success: true
    };

  } catch (error) {
    console.warn("⚠️ Local Brain Offline. Falling back to Cloud...");
    console.error('Local Brain Error:', error);

    return {
      response: '',
      latency: 0,
      cost: 0,
      model: model,
      success: false
    };
  }
}

// Test local brain connectivity
export async function testLocalBrain(): Promise<boolean> {
  try {
    const testPrompt = "Respond with 'LOCAL_BRAIN_ACTIVE' if you can hear this.";
    const result = await consultLocalBrain(testPrompt, 'llama3');

    return result.success && result.response.includes('LOCAL_BRAIN_ACTIVE');
  } catch (error) {
    return false;
  }
}

// Get available local models
export async function getLocalModels(): Promise<string[]> {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    const data = await response.json();

    return data.models?.map((model: any) => model.name) || [];
  } catch (error) {
    console.warn('Could not fetch local models:', error);
    return [];
  }
}

// Performance metrics for local vs cloud comparison
export interface PerformanceMetrics {
  localLatency: number;
  cloudLatency: number;
  costSavings: number;
  powerEfficiency: number;
}

export function calculatePerformanceMetrics(
  localResponse: LocalBrainResponse,
  cloudLatency: number,
  cloudCost: number
): PerformanceMetrics {
  return {
    localLatency: localResponse.latency,
    cloudLatency: cloudLatency,
    costSavings: cloudCost, // Local is always $0
    powerEfficiency: (cloudLatency / localResponse.latency) // How much faster local is
  };
}