// ============================================================
// Engine 5: Orchestrator — Ties all engines together
// Requirement → Component → Database → Validate → Output
// ============================================================

import type { AppConfig } from "./component-registry";
import { validateAppConfig, ValidationResult } from "./security-validator";
import { generateDatabaseSchema, GeneratedSchema } from "./database-generator";
import { supabase } from "@/integrations/supabase/client";

export type PipelineStage =
  | "idle"
  | "understanding"
  | "generating"
  | "building_components"
  | "generating_database"
  | "validating_security"
  | "finalizing"
  | "complete"
  | "error";

export interface PipelineState {
  stage: PipelineStage;
  config: AppConfig | null;
  validation: ValidationResult | null;
  schema: GeneratedSchema | null;
  error: string | null;
}

export interface PipelineEvent {
  stage: PipelineStage;
  message: string;
  timestamp: number;
}

export type PipelineListener = (event: PipelineEvent) => void;

export class AIPipelineOrchestrator {
  private listeners: PipelineListener[] = [];
  private state: PipelineState = {
    stage: "idle",
    config: null,
    validation: null,
    schema: null,
    error: null,
  };

  on(listener: PipelineListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private emit(stage: PipelineStage, message: string) {
    this.state.stage = stage;
    const event: PipelineEvent = { stage, message, timestamp: Date.now() };
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  getState(): PipelineState {
    return { ...this.state };
  }

  async execute(prompt: string): Promise<PipelineState> {
    this.state = { stage: "idle", config: null, validation: null, schema: null, error: null };

    try {
      // Stage 1: Understanding Requirements
      this.emit("understanding", "Analyzing your requirements with AI...");
      await this.delay(300);

      // Stage 2: Call AI Engine (Edge Function)
      this.emit("generating", "Generating structured application config...");

      const { data, error } = await supabase.functions.invoke("ai-builder", {
        body: { prompt },
      });

      if (error) throw new Error(error.message || "AI engine request failed");
      if (!data?.success || !data?.config) {
        throw new Error(data?.error || "AI failed to generate configuration");
      }

      const config: AppConfig = data.config;
      this.state.config = config;

      // Stage 3: Component Layout
      this.emit("building_components", `Mapping ${config.pages.length} pages with components...`);
      await this.delay(500);

      // Stage 4: Database Generation (Engine 3)
      this.emit("generating_database", `Generating schema for ${config.collections.length} collections...`);
      const schema = generateDatabaseSchema(config);
      this.state.schema = schema;

      if (schema.warnings.length > 0) {
        console.warn("Schema warnings:", schema.warnings);
      }
      await this.delay(400);

      // Stage 5: Security Validation (Engine 4)
      this.emit("validating_security", "Running security and validation checks...");
      const validation = validateAppConfig(config);
      this.state.validation = validation;
      await this.delay(300);

      if (!validation.valid) {
        console.warn("Validation errors:", validation.errors);
        // Don't fail — report to user
      }

      // Stage 6: Finalize
      this.emit("finalizing", "Assembling final configuration...");
      await this.delay(200);

      // Complete
      this.emit("complete", "Application configuration ready!");
      this.state.stage = "complete";

      return this.state;
    } catch (err: any) {
      const errorMsg = err?.message || "Unknown pipeline error";
      this.state.error = errorMsg;
      this.emit("error", errorMsg);
      return this.state;
    }
  }

  // Export config as downloadable JSON
  exportConfig(): string {
    if (!this.state.config) return "";
    return JSON.stringify(
      {
        _meta: {
          generator: "RyaanCMS AI Builder",
          version: "1.0.0",
          generated_at: new Date().toISOString(),
        },
        config: this.state.config,
        validation: this.state.validation
          ? {
              score: this.state.validation.score,
              errors: this.state.validation.errors.length,
              warnings: this.state.validation.warnings.length,
            }
          : null,
      },
      null,
      2
    );
  }

  // Export database SQL
  exportSQL(): string {
    return this.state.schema?.sql || "";
  }

  private delay(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}
