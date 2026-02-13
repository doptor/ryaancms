// ============================================================
// Engine 5: Orchestrator — Multi-Agent Pipeline
// Requirement Agent → Planner → Architect → UI/UX → Reviewer
// ============================================================

import type { AppConfig } from "./component-registry";
import { validateAppConfig, ValidationResult } from "./security-validator";
import { generateDatabaseSchema, GeneratedSchema } from "./database-generator";

export type PipelineStage =
  | "idle"
  | "understanding"
  | "planning"
  | "architecting"
  | "designing"
  | "reviewing"
  | "generating"
  | "building_components"
  | "generating_database"
  | "validating_security"
  | "finalizing"
  | "complete"
  | "error";

export interface AgentResult {
  agent: string;
  step: number;
  data?: any;
  error?: string;
}

export interface PipelineState {
  stage: PipelineStage;
  config: AppConfig | null;
  validation: ValidationResult | null;
  schema: GeneratedSchema | null;
  error: string | null;
  // Multi-agent extended data
  requirements: string[];
  taskPlan: any[];
  suggestions: { text: string; prompt: string }[];
  apiEndpoints: any[];
  qualityScore: Record<string, number>;
  qualityIssues: any[];
  qualityImprovements: string[];
  qualityVerdict: string;
  agentLog: AgentResult[];
}

export interface PipelineEvent {
  stage: PipelineStage;
  message: string;
  timestamp: number;
  agentData?: any;
}

export type PipelineListener = (event: PipelineEvent) => void;

const INITIAL_STATE: PipelineState = {
  stage: "idle",
  config: null,
  validation: null,
  schema: null,
  error: null,
  requirements: [],
  taskPlan: [],
  suggestions: [],
  apiEndpoints: [],
  qualityScore: {},
  qualityIssues: [],
  qualityImprovements: [],
  qualityVerdict: "",
  agentLog: [],
};

export class AIPipelineOrchestrator {
  private listeners: PipelineListener[] = [];
  private state: PipelineState = { ...INITIAL_STATE };

  on(listener: PipelineListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private emit(stage: PipelineStage, message: string, agentData?: any) {
    this.state.stage = stage;
    const event: PipelineEvent = { stage, message, timestamp: Date.now(), agentData };
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  getState(): PipelineState {
    return { ...this.state };
  }

  async execute(prompt: string): Promise<PipelineState> {
    this.state = { ...INITIAL_STATE };

    try {
      this.emit("understanding", "🤖 Starting multi-agent pipeline...");

      // Call the multi-agent edge function with SSE streaming
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/ai-builder-agents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Pipeline request failed: ${response.status} — ${errText}`);
      }

      // Parse SSE stream
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n\n")) !== -1) {
          const chunk = buffer.slice(0, newlineIndex).trim();
          buffer = buffer.slice(newlineIndex + 2);

          if (!chunk.startsWith("data: ")) continue;
          const jsonStr = chunk.slice(6);

          try {
            const { event, data } = JSON.parse(jsonStr);
            this.handleStreamEvent(event, data);
          } catch {
            // ignore parse errors
          }
        }
      }

      // Process remaining buffer
      if (buffer.trim().startsWith("data: ")) {
        try {
          const { event, data } = JSON.parse(buffer.trim().slice(6));
          this.handleStreamEvent(event, data);
        } catch {}
      }

      // If we got a config, run local engines too
      if (this.state.config) {
        // Engine 3: Database Schema
        this.emit("generating_database", `Generating SQL for ${this.state.config.collections.length} collections...`);
        const schema = generateDatabaseSchema(this.state.config);
        this.state.schema = schema;

        // Engine 4: Security Validation
        this.emit("validating_security", "Running security checks...");
        const validation = validateAppConfig(this.state.config);
        this.state.validation = validation;

        // Complete
        this.emit("complete", "✅ Multi-agent pipeline complete!");
        this.state.stage = "complete";
      }

      return this.state;
    } catch (err: any) {
      const errorMsg = err?.message || "Unknown pipeline error";
      this.state.error = errorMsg;
      this.emit("error", errorMsg);
      return this.state;
    }
  }

  private handleStreamEvent(event: string, data: any) {
    const AGENT_STAGE_MAP: Record<string, PipelineStage> = {
      "Requirement Analyst": "understanding",
      "Task Planner": "planning",
      "System Architect": "architecting",
      "UI/UX Designer": "designing",
      "Quality Reviewer": "reviewing",
    };

    switch (event) {
      case "agent_start": {
        const stage = AGENT_STAGE_MAP[data.agent] || "generating";
        this.emit(stage, `🤖 Agent ${data.step}/5: ${data.agent}...`, data);
        break;
      }
      case "agent_done": {
        const stage = AGENT_STAGE_MAP[data.agent] || "generating";
        this.state.agentLog.push({ agent: data.agent, step: data.step, data: data.data });
        this.emit(stage, `✅ ${data.agent} complete`, data);
        break;
      }
      case "agent_error": {
        this.emit("error", `❌ ${data.agent} failed: ${data.error}`, data);
        break;
      }
      case "pipeline_complete": {
        if (data.success && data.config) {
          const c = data.config;
          // Build AppConfig from multi-agent output
          const appConfig: AppConfig = {
            project_type: c.project_type,
            title: c.title,
            description: c.description,
            modules: c.modules || [],
            roles: c.roles || [],
            features: c.features || [],
            pages: c.pages || [],
            collections: c.collections || [],
            style: c.style || {},
            multi_tenant: c.features?.includes("multi-tenant") || false,
          };
          this.state.config = appConfig;
          this.state.requirements = c.requirements || [];
          this.state.taskPlan = c.task_plan || [];
          this.state.suggestions = c.suggestions || [];
          this.state.apiEndpoints = c.api_endpoints || [];
          this.state.qualityScore = c.quality_score || {};
          this.state.qualityIssues = c.quality_issues || [];
          this.state.qualityImprovements = c.quality_improvements || [];
          this.state.qualityVerdict = c.quality_verdict || "";
          this.emit("finalizing", "Assembling final configuration...");
        } else {
          this.state.error = data.error || "Pipeline failed";
          this.emit("error", data.error || "Pipeline failed");
        }
        break;
      }
    }
  }

  exportConfig(): string {
    if (!this.state.config) return "";
    return JSON.stringify(
      {
        _meta: {
          generator: "RyaanCMS AI Builder (Multi-Agent)",
          version: "2.0.0",
          agents: ["Requirement Analyst", "Task Planner", "System Architect", "UI/UX Designer", "Quality Reviewer"],
          generated_at: new Date().toISOString(),
        },
        config: this.state.config,
        requirements: this.state.requirements,
        task_plan: this.state.taskPlan,
        api_endpoints: this.state.apiEndpoints,
        quality: {
          score: this.state.qualityScore,
          issues: this.state.qualityIssues,
          improvements: this.state.qualityImprovements,
          verdict: this.state.qualityVerdict,
        },
        validation: this.state.validation
          ? { score: this.state.validation.score, errors: this.state.validation.errors.length, warnings: this.state.validation.warnings.length }
          : null,
      },
      null,
      2
    );
  }

  exportSQL(): string {
    return this.state.schema?.sql || "";
  }
}
