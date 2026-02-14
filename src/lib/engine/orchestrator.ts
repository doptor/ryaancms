// ============================================================
// Engine 5: Orchestrator — Multi-Agent Pipeline
// Requirement Agent → Planner → Architect → UI/UX → Reviewer
// ============================================================

import type { AppConfig } from "./component-registry";
import { validateAppConfig, ValidationResult } from "./security-validator";
import { generateDatabaseSchema, GeneratedSchema } from "./database-generator";
import { generateRBAC, RBACOutput } from "./rbac-generator";
import { generateTestSuite, TestSuite } from "./test-generator";
import { generateDocumentation, GeneratedDocs } from "./docs-generator";
import { generateThemeFromStyle, GeneratedTheme } from "./theme-generator";

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
  rbac: RBACOutput | null;
  testSuite: TestSuite | null;
  docs: GeneratedDocs | null;
  theme: GeneratedTheme | null;
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
  // Phase 4: 10-agent extended data
  workflows: any[];
  businessRules: any[];
  permissionMatrix: any[];
  folderStructure: Record<string, any>;
  testScenarios: any[];
  seedData: any[];
  bugs: any[];
  autoFixes: any[];
  riskScore: number;
  webhooks: any[];
  edgeFunctions: any[];
  // Master Prompt enterprise additions
  errorFixMemory: any[];
  documentationPlan: string[];
  documentationChecklist: Record<string, boolean>;
  securityChecklist: Record<string, boolean>;
  defaultAdminCredentials: { email: string; password: string };
  installerSteps: string[];
  pluginHooks: string[];
  middlewareStack: string[];
  reusableComponents: string[];
  prismaSchemaHint: string;
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
  rbac: null,
  testSuite: null,
  docs: null,
  theme: null,
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
  workflows: [],
  businessRules: [],
  permissionMatrix: [],
  folderStructure: {},
  testScenarios: [],
  seedData: [],
  bugs: [],
  autoFixes: [],
  riskScore: 0,
  webhooks: [],
  edgeFunctions: [],
  errorFixMemory: [],
  documentationPlan: ["README.md", "INSTALL.md", "API.md", "DB_SCHEMA.md"],
  documentationChecklist: {},
  securityChecklist: {},
  defaultAdminCredentials: { email: "admin@admin.com", password: "admin123" },
  installerSteps: [],
  pluginHooks: [],
  middlewareStack: [],
  reusableComponents: [],
  prismaSchemaHint: "",
};

export class AIPipelineOrchestrator {
  private listeners: PipelineListener[] = [];
  private state: PipelineState = { ...INITIAL_STATE };
  private themePreset: import("./theme-generator").ThemePreset | null = null;

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

  setThemePreset(preset: import("./theme-generator").ThemePreset) {
    this.themePreset = preset;
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

        // Engine 5: RBAC Generator
        this.emit("validating_security", "Generating RBAC system...");
        const rbac = generateRBAC(this.state.config);
        this.state.rbac = rbac;

        // Engine 6: Test Suite Generator
        this.emit("generating", "Generating test scenarios...");
        const testSuite = generateTestSuite(this.state.config);
        this.state.testSuite = testSuite;

        // Engine 7: Documentation Generator
        this.emit("finalizing", "Generating documentation...");
        const docs = generateDocumentation(this.state.config, schema, validation, rbac);
        this.state.docs = docs;

        // Engine 8: Theme Generator — use preset if selected, else from config style
        if (this.themePreset) {
          this.emit("finalizing", "Applying theme preset...");
          const { generateTheme } = await import("./theme-generator");
          const theme = generateTheme(this.themePreset.tokens);
          this.state.theme = theme;
          // Also inject style into config
          const radiusMap: Record<string, "none" | "sm" | "md" | "lg" | "full"> = {
            "0": "none", "0.25rem": "sm", "0.375rem": "sm", "0.5rem": "md", "0.75rem": "lg", "1rem": "lg", "9999px": "full",
          };
          this.state.config!.style = {
            primary_color: this.themePreset.tokens.primary_color,
            font: this.themePreset.tokens.font,
            border_radius: radiusMap[this.themePreset.tokens.border_radius] || "lg",
            theme: this.themePreset.tokens.theme_mode,
          };
        } else if (this.state.config.style) {
          this.emit("finalizing", "Generating theme tokens...");
          const theme = generateThemeFromStyle(this.state.config.style);
          this.state.theme = theme;
        }

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
      "Product Manager": "understanding",
      "Task Planner": "planning",
      "System Architect": "architecting",
      "Database Agent": "architecting",
      "Backend Agent": "generating",
      "UI/UX Designer": "designing",
      "Copywriter Agent": "designing",
      "Testing Agent": "generating",
      "Debugger Agent": "reviewing",
      "UI Reviewer Agent": "reviewing",
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
          // Phase 4: 10-agent extended data
          this.state.workflows = c.workflows || [];
          this.state.businessRules = c.business_rules || [];
          this.state.permissionMatrix = c.permission_matrix || [];
          this.state.folderStructure = c.folder_structure || {};
          this.state.testScenarios = c.test_scenarios || [];
          this.state.seedData = c.seed_data || [];
          this.state.bugs = c.bugs || [];
          this.state.autoFixes = c.auto_fixes || [];
          this.state.riskScore = c.risk_score || 0;
          this.state.webhooks = c.webhooks || [];
          this.state.edgeFunctions = c.edge_functions || [];
          // Master Prompt enterprise data
          this.state.errorFixMemory = c.error_fix_memory || [];
          this.state.documentationPlan = c.documentation_plan || ["README.md", "INSTALL.md", "API.md", "DB_SCHEMA.md"];
          this.state.documentationChecklist = c.documentation_checklist || {};
          this.state.securityChecklist = c.security_checklist || {};
          this.state.defaultAdminCredentials = c.default_admin_credentials || { email: "admin@admin.com", password: "admin123" };
          this.state.installerSteps = c.installer_steps || [];
          this.state.pluginHooks = c.plugin_hooks || [];
          this.state.middlewareStack = c.middleware_stack || [];
          this.state.reusableComponents = c.reusable_components || [];
          this.state.prismaSchemaHint = c.prisma_schema_hint || "";
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
        rbac: this.state.rbac
          ? { roles: this.state.rbac.roles.length, permissions: this.state.rbac.permissions.length, policies: this.state.rbac.policies.length }
          : null,
        test_suite: this.state.testSuite
          ? { scenarios: this.state.testSuite.coverage_summary.total_scenarios, coverage: this.state.testSuite.coverage_summary.estimated_coverage }
          : null,
        docs: this.state.docs ? this.state.docs.checklist : null,
        theme: this.state.theme ? this.state.theme.preset_name : null,
      },
      null,
      2
    );
  }

  exportSQL(): string {
    return this.state.schema?.sql || "";
  }
}
