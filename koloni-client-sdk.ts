/**
 * KOLONI Studio → ColonyOS Client SDK
 *
 * Provides integration between KOLONI Studio and ColonyOS for task submission,
 * status tracking, and telemetry reporting.
 *
 * Usage:
 * ```ts
 * const colonyOS = new ColonyOSClient("http://localhost:8000");
 *
 * // Register KOLONI as a bee
 * await colonyOS.registerBee({
 *   bee_id: "koloni-001",
 *   bee_type: "koloni_creator_studio",
 *   model_capabilities: ["LongCat", "EMU"]
 * });
 *
 * // Submit task
 * const { task_id } = await colonyOS.submitTask({
 *   task_type: "generate_text",
 *   description: "Write blog post",
 *   payload: { prompt: "AI trends 2024" }
 * });
 *
 * // Wait for completion
 * const result = await colonyOS.waitForCompletion(task_id);
 * ```
 */

export interface Bee {
  bee_id: string;
  bee_type: string;
  model_capabilities: string[];
  version?: string;
  metadata?: Record<string, any>;
}

export interface TaskSubmission {
  task_type: "generate_text" | "generate_image" | string;
  description: string;
  payload?: Record<string, any>;
  callback_url?: string;
}

export interface TaskStatus {
  task_id: string;
  task_type: string;
  description: string;
  status: "pending" | "processing" | "completed" | "failed";
  submitted_at: string;
  completed_at?: string;
  result?: any;
  error?: string;
}

export interface TelemetryEvent {
  bee_id: string;
  event: string;
  data: Record<string, any>;
  timestamp?: string;
}

export interface BeeRegistration {
  bee_id: string;
  bee_type: string;
  status: "ACTIVE" | "INACTIVE";
  model_capabilities: string[];
  registered_at: string;
  last_heartbeat: string;
}

export class ColonyOSClient {
  private apiUrl: string;
  private beeId?: string;
  private apiKey?: string;

  constructor(apiUrl: string = "http://localhost:8000", apiKey?: string) {
    this.apiUrl = apiUrl.replace(/\/$/, ""); // Remove trailing slash
    this.apiKey = apiKey;
  }

  /**
   * Register KOLONI as a bee in ColonyOS
   */
  async registerBee(bee: Bee): Promise<BeeRegistration> {
    const response = await this.fetch("/api/v1/bees/register", {
      method: "POST",
      body: JSON.stringify(bee),
    });

    if (!response.ok) {
      throw new Error(`Failed to register bee: ${response.statusText}`);
    }

    this.beeId = bee.bee_id;
    return response.json();
  }

  /**
   * Send heartbeat to indicate bee is alive
   */
  async sendHeartbeat(beeId?: string): Promise<void> {
    const id = beeId || this.beeId;
    if (!id) throw new Error("No bee_id provided");

    const response = await this.fetch(`/api/v1/bees/${id}/heartbeat`, {
      method: "POST",
      body: JSON.stringify({
        status: "ACTIVE",
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send heartbeat: ${response.statusText}`);
    }
  }

  /**
   * Send telemetry event
   */
  async sendTelemetry(event: TelemetryEvent): Promise<void> {
    const response = await this.fetch("/api/v1/telemetry", {
      method: "POST",
      body: JSON.stringify({
        ...event,
        timestamp: event.timestamp || new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send telemetry: ${response.statusText}`);
    }
  }

  /**
   * Submit task to ColonyOS
   */
  async submitTask(task: TaskSubmission): Promise<{ task_id: string }> {
    const response = await this.fetch("/api/v1/tasks", {
      method: "POST",
      body: JSON.stringify(task),
    });

    if (!response.ok) {
      throw new Error(`Failed to submit task: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get task status
   */
  async getTaskStatus(taskId: string): Promise<TaskStatus> {
    const response = await this.fetch(`/api/v1/tasks/${taskId}/status`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`Failed to get task status: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Update task status (called by bee when task completes)
   */
  async updateTaskStatus(
    taskId: string,
    status: "success" | "failed",
    result?: any,
    error?: string
  ): Promise<{ success: boolean; task_id: string }> {
    const response = await this.fetch(`/api/v1/tasks/${taskId}/status`, {
      method: "POST",
      body: JSON.stringify({
        status,
        result,
        error,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update task status: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * List tasks
   */
  async listTasks(
    filters?: {
      status?: "pending" | "completed" | "failed";
      bee_id?: string;
      limit?: number;
    }
  ): Promise<{ tasks: TaskStatus[]; count: number; total: number }> {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.bee_id) params.append("bee_id", filters.bee_id);
    if (filters?.limit) params.append("limit", filters.limit.toString());

    const response = await this.fetch(`/api/v1/tasks?${params.toString()}`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`Failed to list tasks: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Poll task until completion or timeout
   */
  async waitForCompletion(
    taskId: string,
    options?: {
      pollInterval?: number; // ms
      timeout?: number; // ms
    }
  ): Promise<TaskStatus> {
    const pollInterval = options?.pollInterval || 1000; // 1s default
    const timeout = options?.timeout || 300000; // 5m default
    const startTime = Date.now();

    while (true) {
      const task = await this.getTaskStatus(taskId);

      // Task completed (success or failed)
      if (task.status === "completed" || task.status === "failed") {
        return task;
      }

      // Check timeout
      if (Date.now() - startTime > timeout) {
        throw new Error(
          `Task ${taskId} timeout after ${timeout / 1000}s`
        );
      }

      // Wait before next poll
      await new Promise((resolve) =>
        setTimeout(resolve, pollInterval)
      );
    }
  }

  /**
   * Get list of registered bees
   */
  async listBees(): Promise<{
    bees: BeeRegistration[];
    count: number;
  }> {
    const response = await this.fetch("/api/v1/bees", {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`Failed to list bees: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get specific bee details
   */
  async getBee(beeId: string): Promise<BeeRegistration> {
    const response = await this.fetch(`/api/v1/bees/${beeId}`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`Failed to get bee: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Internal helper for fetch with auth
   */
  private async fetch(
    path: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const headers = {
      "Content-Type": "application/json",
      ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
      ...(options.headers as Record<string, string>),
    };

    return fetch(`${this.apiUrl}${path}`, {
      ...options,
      headers,
    });
  }
}

/**
 * Helper: Create KOLONI-specific client with sensible defaults
 */
export function createKoloniClient(apiUrl: string = "http://localhost:8000") {
  return new ColonyOSClient(apiUrl);
}

/**
 * Helper: Full workflow for KOLONI Studio integration
 */
export async function koloniGenerateWithColonyOS(
  client: ColonyOSClient,
  taskType: "text" | "image",
  prompt: string,
  beeId: string
): Promise<any> {
  try {
    // Send telemetry: generation started
    await client.sendTelemetry({
      bee_id: beeId,
      event: "generation.started",
      data: {
        task_type: taskType,
        prompt: prompt.substring(0, 100),
      },
    });

    // Submit task to ColonyOS
    const { task_id } = await client.submitTask({
      task_type: taskType === "text" ? "generate_text" : "generate_image",
      description: prompt,
      payload: { prompt },
    });

    // Wait for completion with 5 minute timeout
    const result = await client.waitForCompletion(task_id, {
      pollInterval: 500,
      timeout: 5 * 60 * 1000,
    });

    // Send telemetry: generation completed
    await client.sendTelemetry({
      bee_id: beeId,
      event: "generation.completed",
      data: {
        task_id,
        task_type: taskType,
        result_size: JSON.stringify(result.result).length,
      },
    });

    return result.result;
  } catch (error) {
    // Send telemetry: generation failed
    await client.sendTelemetry({
      bee_id: beeId,
      event: "generation.failed",
      data: {
        task_type: taskType,
        error: error instanceof Error ? error.message : String(error),
      },
    });

    throw error;
  }
}
