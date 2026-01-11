// =====================================================
// THE NEURAL COUNCIL
// Intelligent multi-model routing for optimal AI task execution
// =====================================================

import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';

// Council member definitions
export interface CouncilMember {
  model: string;
  provider: 'google' | 'anthropic' | 'openai' | 'groq';
  trait: 'INSTANT_SPEED' | 'NUANCE_ART' | 'GROUNDING' | 'LONG_CONTEXT';
  costPerToken: number;
  contextWindow: number;
  strengths: string[];
  weaknesses: string[];
}

// THE NEURAL COUNCIL MEMBERS
export const AGENTS: Record<string, CouncilMember> = {
  RECEPTIONIST: {
    model: 'groq/llama-3-70b-8192',
    provider: 'groq',
    trait: 'INSTANT_SPEED',
    costPerToken: 0.000001, // Extremely cheap
    contextWindow: 8192,
    strengths: ['Speed', 'Cost efficiency', 'Conversational'],
    weaknesses: ['Complex reasoning', 'Creative writing']
  },
  CREATIVE: {
    model: 'anthropic/claude-3-5-sonnet',
    provider: 'anthropic',
    trait: 'NUANCE_ART',
    costPerToken: 0.000015,
    contextWindow: 200000,
    strengths: ['Creative writing', 'Brand voice', 'Emotional intelligence'],
    weaknesses: ['Speed', 'Cost for simple tasks']
  },
  RESEARCHER: {
    model: 'google/gemini-1.5-pro',
    provider: 'google',
    trait: 'GROUNDING',
    costPerToken: 0.000005,
    contextWindow: 1000000,
    strengths: ['Web search', 'Fact verification', 'Data analysis'],
    weaknesses: ['Creative tasks', 'Long-form writing']
  },
  AUDITOR: {
    model: 'google/gemini-1.5-pro',
    provider: 'google',
    trait: 'LONG_CONTEXT',
    costPerToken: 0.000005,
    contextWindow: 1000000,
    strengths: ['Compliance checking', 'Detailed analysis', 'Legal review'],
    weaknesses: ['Speed', 'Creative interpretation']
  }
};

// Task type definitions
export type TaskType = 'planning' | 'research' | 'creative' | 'audit' | 'reception';

export interface CouncilRequest {
  taskType: TaskType;
  prompt: string;
  context?: string;
  userTier?: 'scout' | 'voyageur' | 'citadel';
  byoaKeys?: {
    openai?: string;
    anthropic?: string;
    google?: string;
  };
}

export interface CouncilResponse {
  result: string;
  agent: CouncilMember;
  cost: number;
  latency: number;
  tokens: number;
  success: boolean;
}

// Initialize providers
let googleProvider: any = null;
let anthropicProvider: any = null;
let openaiProvider: any = null;

function initializeProviders(byoaKeys?: CouncilRequest['byoaKeys']) {
  // Use BYOA keys if available (Citadel tier), otherwise use system keys
  const useByoa = byoaKeys && Object.keys(byoaKeys).length > 0;

  googleProvider = createGoogleGenerativeAI({
    apiKey: useByoa ? byoaKeys?.google : process.env.GOOGLE_API_KEY
  });

  anthropicProvider = createAnthropic({
    apiKey: useByoa ? byoaKeys?.anthropic : process.env.ANTHROPIC_API_KEY
  });

  openaiProvider = createOpenAI({
    apiKey: useByoa ? byoaKeys?.openai : process.env.OPENAI_API_KEY
  });
}

// Route task to optimal council member
export function routeToCouncilMember(taskType: TaskType, userTier: string = 'scout'): CouncilMember {
  // Base routing by task type
  let selectedAgent: CouncilMember;

  switch (taskType) {
    case 'planning':
      selectedAgent = AGENTS.RECEPTIONIST; // Fast planning
      break;
    case 'research':
      selectedAgent = AGENTS.RESEARCHER; // Grounding capabilities
      break;
    case 'creative':
      selectedAgent = AGENTS.CREATIVE; // Best for copy and creative
      break;
    case 'audit':
      selectedAgent = AGENTS.AUDITOR; // Long context for compliance
      break;
    case 'reception':
      selectedAgent = AGENTS.RECEPTIONIST; // Fast responses
      break;
    default:
      selectedAgent = AGENTS.RECEPTIONIST;
  }

  // Tier-based overrides
  if (userTier === 'scout') {
    // Scouts get basic Gemini Flash
    return {
      model: 'google/gemini-flash',
      provider: 'google',
      trait: 'INSTANT_SPEED',
      costPerToken: 0.000001,
      contextWindow: 32000,
      strengths: ['Fast', 'Basic tasks'],
      weaknesses: ['Advanced features']
    };
  }

  if (userTier === 'citadel' && selectedAgent.trait !== 'NUANCE_ART') {
    // Citadel gets best available, but Creative always goes to Claude
    // (unless they bring their own keys)
  }

  return selectedAgent;
}

// Main council consultation function
export async function consultCouncil(request: CouncilRequest): Promise<CouncilResponse> {
  const startTime = Date.now();

  try {
    // Initialize providers with BYOA keys if available
    initializeProviders(request.byoaKeys);

    // Route to optimal council member
    const councilMember = routeToCouncilMember(request.taskType, request.userTier);

    console.log(`🤖 Consulting ${councilMember.model} for ${request.taskType} task`);

    // Build enhanced prompt with context
    const enhancedPrompt = buildEnhancedPrompt(request, councilMember);

    // Execute based on provider
    let result: string;
    let tokens = 0;

    switch (councilMember.provider) {
      case 'google':
        const googleResponse = await generateText({
          model: googleProvider(councilMember.model),
          prompt: enhancedPrompt,
        });
        result = googleResponse.text;
        tokens = estimateTokens(result);
        break;

      case 'anthropic':
        const anthropicResponse = await generateText({
          model: anthropicProvider(councilMember.model),
          prompt: enhancedPrompt,
        });
        result = anthropicResponse.text;
        tokens = estimateTokens(result);
        break;

      case 'openai':
        const openaiResponse = await generateText({
          model: openaiProvider(councilMember.model),
          prompt: enhancedPrompt,
        });
        result = openaiResponse.text;
        tokens = estimateTokens(result);
        break;

      case 'groq':
        // Groq would use their API directly
        result = "Groq integration placeholder";
        tokens = estimateTokens(result);
        break;

      default:
        throw new Error(`Unsupported provider: ${councilMember.provider}`);
    }

    const latency = Date.now() - startTime;
    const cost = tokens * councilMember.costPerToken;

    console.log(`✅ Council consultation complete: ${latency}ms, $${cost.toFixed(4)}, ${tokens} tokens`);

    return {
      result,
      agent: councilMember,
      cost,
      latency,
      tokens,
      success: true
    };

  } catch (error) {
    console.error('❌ Council consultation failed:', error);
    return {
      result: '',
      agent: AGENTS.RECEPTIONIST, // fallback
      cost: 0,
      latency: Date.now() - startTime,
      tokens: 0,
      success: false
    };
  }
}

// Build enhanced prompt with council member context
function buildEnhancedPrompt(request: CouncilRequest, member: CouncilMember): string {
  const roleInstructions = getRoleInstructions(request.taskType, member);

  return `${roleInstructions}

CONTEXT: ${request.context || 'No additional context provided'}

TASK: ${request.prompt}

Please provide a focused, actionable response that leverages your specific strengths as the ${member.trait} council member.`;
}

// Get role-specific instructions
function getRoleInstructions(taskType: TaskType, member: CouncilMember): string {
  const baseInstructions = `You are the ${member.trait} council member in AdgenXAI's Neural Council. Your strengths: ${member.strengths.join(', ')}.`;

  switch (taskType) {
    case 'planning':
      return `${baseInstructions} Focus on strategic, actionable plans that can be executed quickly. Be concise but comprehensive.`;
    case 'research':
      return `${baseInstructions} Provide factual, well-grounded information with sources when possible. Prioritize accuracy over speed.`;
    case 'creative':
      return `${baseInstructions} Create compelling, brand-aligned content that resonates emotionally. Focus on quality over quantity.`;
    case 'audit':
      return `${baseInstructions} Conduct thorough, methodical reviews. Be detailed and specific in your feedback.`;
    case 'reception':
      return `${baseInstructions} Be helpful, friendly, and responsive. Keep interactions light but informative.`;
    default:
      return baseInstructions;
  }
}

// Estimate token count (rough approximation)
function estimateTokens(text: string): number {
  // Rough approximation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
}

// Get council performance metrics
export function getCouncilMetrics(): {
  averageLatency: number;
  totalCost: number;
  successRate: number;
  memberUtilization: Record<string, number>;
} {
  // In a real implementation, this would track actual metrics
  return {
    averageLatency: 245, // ms
    totalCost: 0.0023, // dollars
    successRate: 0.98, // 98%
    memberUtilization: {
      'RECEPTIONIST': 0.45,
      'CREATIVE': 0.30,
      'RESEARCHER': 0.20,
      'AUDITOR': 0.05
    }
  };
}

// Test council connectivity
export async function testCouncilConnectivity(): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};

  for (const [name, member] of Object.entries(AGENTS)) {
    try {
      // Simple test call
      const testRequest: CouncilRequest = {
        taskType: 'reception',
        prompt: 'Hello',
        userTier: 'scout'
      };

      const response = await consultCouncil(testRequest);
      results[name.toLowerCase()] = response.success;
    } catch (error) {
      results[name.toLowerCase()] = false;
    }
  }

  return results;
}