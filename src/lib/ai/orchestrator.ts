import { createClient } from '@supabase/supabase-js';

interface ThoughtUpdate {
  agent: "planner" | "researcher" | "creative" | "auditor";
  action: string;
  details?: string;
  citations?: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
  metadata?: Record<string, any>;
  timestamp?: number;
}

interface OrchestratorConfig {
  onThoughtUpdate: (thought: ThoughtUpdate) => void;
  supabaseUrl: string;
  supabaseKey: string;
  userId: string;
}

interface CampaignRequest {
  prompt: string;
  brandImage?: string;
  location?: string;
  targetAudience?: string;
}

interface CampaignResult {
  researchSummary: string;
  adCopy: {
    headline: string;
    subheadline: string;
    body: string;
    callToAction: string;
  };
  brandAnalysis: {
    primaryColor: string;
    secondaryColor: string;
    fontVibe: string;
    brandArchetype: string;
    canadianElements: string[];
  };
  targeting: {
    location: string;
    demographics: string[];
    interests: string[];
  };
  compliance: {
    canadianStandards: boolean;
    legalClearance: boolean;
    accessibilityScore: number;
  };
  visualAssets?: {
    heroImage: string;
    brandColors: string[];
    typography: string;
  };
}

export class AdgenOrchestrator {
  private config: OrchestratorConfig;
  private supabase: any;
  private abortController: AbortController | null = null;

  constructor(config: OrchestratorConfig) {
    this.config = config;
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
  }

  async orchestrateCampaign(request: CampaignRequest): Promise<CampaignResult> {
    this.abortController = new AbortController();

    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }

      // Stream the orchestration process
      const response = await fetch(`${this.config.supabaseUrl}/functions/v1/adgen-orchestrator`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(request),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      let finalResult: CampaignResult | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.thought) {
                // Handle thought streaming
                this.config.onThoughtUpdate({
                  agent: data.thought.agent,
                  action: data.thought.action,
                  details: data.thought.details,
                  citations: data.thought.citations,
                  metadata: data.thought.metadata,
                  timestamp: data.thought.timestamp,
                });
              } else if (data.result) {
                // Handle final result
                finalResult = data.result;
              } else if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {
              console.warn("Failed to parse streaming data:", e);
            }
          }
        }
      }

      if (!finalResult) {
        throw new Error("No result received from orchestration");
      }

      return finalResult;

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Orchestration cancelled');
      }
      console.error('Orchestration error:', error);
      throw error;
    }
  }

  cancelOrchestration() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  // State machine for agent orchestration (for future expansion)
  private async runStateMachine(request: CampaignRequest): Promise<CampaignResult> {
    // Phase 1: Planning
    this.config.onThoughtUpdate({
      agent: "planner",
      action: "Analyzing campaign objectives",
      details: `Processing: "${request.prompt.substring(0, 50)}..."`
    });

    // Phase 2: Research
    this.config.onThoughtUpdate({
      agent: "researcher",
      action: "Grounding with Google Search",
      details: "Researching current market trends and competitor analysis"
    });

    // Phase 3: Creative
    this.config.onThoughtUpdate({
      agent: "creative",
      action: "Analyzing brand assets",
      details: request.brandImage ? "Processing uploaded brand image for color and style extraction" : "Using Modern Voyageur defaults"
    });

    // Phase 4: Audit
    this.config.onThoughtUpdate({
      agent: "auditor",
      action: "Validating Canadian compliance",
      details: "Checking CRTC standards, accessibility, and legal requirements"
    });

    // This would call the actual orchestration function
    return this.orchestrateCampaign(request);
  }
}

// Factory function for easy instantiation
export function createOrchestrator(
  onThoughtUpdate: (thought: ThoughtUpdate) => void,
  supabaseUrl: string,
  supabaseKey: string,
  userId: string
): AdgenOrchestrator {
  return new AdgenOrchestrator({
    onThoughtUpdate,
    supabaseUrl,
    supabaseKey,
    userId,
  });
}