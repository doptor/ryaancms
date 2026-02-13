import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================================
// Multi-Agent AI Builder Pipeline
// 6 Sequential Agents, each with specialized system prompts
// ============================================================

const AGENT_CONFIGS = {
  // Agent 1: Requirement Analyst
  requirements: {
    name: "Requirement Analyst",
    system: `You are a Requirements Analyst AI Agent for RyaanCMS AI Builder.

Your job: Analyze the user's prompt and extract a complete Software Requirements Specification.

You MUST call the "extract_requirements" tool with structured output.

Rules:
- Identify the project type (landing, blog, saas, ecommerce, portfolio, dashboard, marketplace, crm, custom)
- Extract ALL functional requirements (what the app must do)
- Extract non-functional requirements (performance, security, scalability)
- Identify user roles needed
- Identify required modules from: auth, blog, ecommerce, crm, analytics, payments, media, forms, api, marketplace, notifications, search, reports, settings
- List key features (multi-tenant, realtime, i18n, etc.)
- Suggest a project title and description
- Be thorough — extract implicit requirements too (e.g. "CRM" implies contacts, leads, deals, pipeline)`,
    tool: {
      name: "extract_requirements",
      description: "Extract structured requirements from the user prompt",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          project_type: { type: "string", enum: ["landing", "blog", "saas", "ecommerce", "portfolio", "dashboard", "marketplace", "crm", "custom"] },
          functional_requirements: { type: "array", items: { type: "string" } },
          non_functional_requirements: { type: "array", items: { type: "string" } },
          modules: { type: "array", items: { type: "string" } },
          roles: { type: "array", items: { type: "object", properties: { name: { type: "string" }, permissions: { type: "array", items: { type: "string" } } }, required: ["name", "permissions"], additionalProperties: false } },
          features: { type: "array", items: { type: "string" } },
          suggested_modules_breakdown: { type: "array", items: { type: "object", properties: { module_name: { type: "string" }, description: { type: "string" }, priority: { type: "string", enum: ["critical", "high", "medium", "low"] } }, required: ["module_name", "description", "priority"], additionalProperties: false } },
        },
        required: ["title", "description", "project_type", "functional_requirements", "modules", "roles", "features", "suggested_modules_breakdown"],
        additionalProperties: false,
      },
    },
  },

  // Agent 2: Task Planner
  planner: {
    name: "Task Planner",
    system: `You are a Task Planner AI Agent for RyaanCMS AI Builder.

You receive extracted requirements and create a step-by-step build plan.

You MUST call the "create_task_plan" tool.

Rules:
- Break the project into sequential, buildable tasks/modules
- Each task should be a self-contained module (Auth, Dashboard, specific feature modules)
- Order tasks by dependency (auth first, then core modules, then advanced features)
- Each task gets a name, description, estimated complexity, and the components/pages it will produce
- Include database setup as early tasks
- Max 12 tasks for any project`,
    tool: {
      name: "create_task_plan",
      description: "Create a sequential build plan with tasks",
      parameters: {
        type: "object",
        properties: {
          tasks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                step: { type: "integer" },
                name: { type: "string" },
                description: { type: "string" },
                complexity: { type: "string", enum: ["simple", "moderate", "complex"] },
                produces_pages: { type: "array", items: { type: "string" } },
                produces_components: { type: "array", items: { type: "string" } },
                produces_collections: { type: "array", items: { type: "string" } },
                depends_on: { type: "array", items: { type: "integer" } },
              },
              required: ["step", "name", "description", "complexity", "produces_pages"],
              additionalProperties: false,
            },
          },
          total_estimated_complexity: { type: "string", enum: ["simple", "moderate", "complex", "enterprise"] },
          suggestions: {
            type: "array",
            items: { type: "object", properties: { text: { type: "string" }, prompt: { type: "string" } }, required: ["text", "prompt"], additionalProperties: false },
            description: "Follow-up suggestions the user can click to enhance the project"
          },
        },
        required: ["tasks", "total_estimated_complexity", "suggestions"],
        additionalProperties: false,
      },
    },
  },

  // Agent 3: System Architect (DB + API)
  architect: {
    name: "System Architect",
    system: `You are a System Architect AI Agent for RyaanCMS AI Builder.

You receive requirements and task plan, and design the database schema and API structure.

You MUST call the "design_architecture" tool.

Rules:
- Design database collections/tables with proper fields, types, and relationships
- Field types: text, number, boolean, date, relation, json, media, enum, uuid, email
- Enable RLS on all user-facing tables
- Mark tenant-isolated tables if multi-tenant
- Design REST API endpoints for each module
- Include proper indexes and constraints in your design
- Every table that stores user data must have a user_id or tenant_id field`,
    tool: {
      name: "design_architecture",
      description: "Design the database schema and API structure",
      parameters: {
        type: "object",
        properties: {
          collections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                fields: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      type: { type: "string", enum: ["text", "number", "boolean", "date", "relation", "json", "media", "enum", "uuid", "email"] },
                      required: { type: "boolean" },
                      default: { type: "string" },
                    },
                    required: ["name", "type"],
                    additionalProperties: false,
                  },
                },
                rls: { type: "boolean" },
                tenant_isolated: { type: "boolean" },
              },
              required: ["name", "fields", "rls"],
              additionalProperties: false,
            },
          },
          api_endpoints: {
            type: "array",
            items: {
              type: "object",
              properties: {
                method: { type: "string", enum: ["GET", "POST", "PUT", "DELETE"] },
                path: { type: "string" },
                description: { type: "string" },
                auth_required: { type: "boolean" },
              },
              required: ["method", "path", "description", "auth_required"],
              additionalProperties: false,
            },
          },
        },
        required: ["collections", "api_endpoints"],
        additionalProperties: false,
      },
    },
  },

  // Agent 4: UI/UX Designer
  uiux: {
    name: "UI/UX Designer",
    system: `You are a UI/UX Designer AI Agent for RyaanCMS AI Builder.

You receive requirements, task plan, and database schema, then design the page layouts with components.

You MUST call the "design_ui" tool.

Rules:
- Design pages with appropriate layouts: public, dashboard, auth, fullscreen
- Select components from the registry: hero, navbar, footer, sidebar, crud_table, form, chart, card_grid, stats_row, auth_form, pricing_table, media_gallery, search_bar, notification_center, rich_text_editor, file_upload, calendar, kanban_board, timeline, map, role_manager, payment_page, dashboard_layout, data_import, settings_panel, api_docs
- Provide sensible default props for each component
- Mark pages that require authentication
- Include a style configuration (colors, theme, fonts)
- Every dashboard page should have sidebar and navbar
- Landing pages need hero, features section, pricing, footer`,
    tool: {
      name: "design_ui",
      description: "Design page layouts with components",
      parameters: {
        type: "object",
        properties: {
          pages: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                route: { type: "string" },
                layout: { type: "string", enum: ["public", "dashboard", "auth", "fullscreen"] },
                requires_auth: { type: "boolean" },
                components: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string" },
                      props: { type: "object" },
                    },
                    required: ["type"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["name", "route", "layout", "components"],
              additionalProperties: false,
            },
          },
          style: {
            type: "object",
            properties: {
              primary_color: { type: "string" },
              theme: { type: "string", enum: ["light", "dark", "auto"] },
              font: { type: "string" },
              border_radius: { type: "string", enum: ["none", "sm", "md", "lg", "full"] },
            },
            additionalProperties: false,
          },
        },
        required: ["pages", "style"],
        additionalProperties: false,
      },
    },
  },

  // Agent 5: Quality Reviewer
  reviewer: {
    name: "Quality Reviewer",
    system: `You are a Quality Reviewer AI Agent for RyaanCMS AI Builder.

You receive the complete project configuration and perform a thorough quality review.

You MUST call the "quality_review" tool.

Rules:
- Score the project on: ui_completeness, backend_completeness, security, test_coverage, performance (each 0-100)
- Calculate overall_score as weighted average
- List specific issues found (missing pages, missing RLS, weak auth, etc.)
- List specific improvements recommended
- If overall_score < 80, flag critical improvements
- Be strict but fair — enterprise-grade means 90+`,
    tool: {
      name: "quality_review",
      description: "Review and score the complete project configuration",
      parameters: {
        type: "object",
        properties: {
          scores: {
            type: "object",
            properties: {
              ui_completeness: { type: "integer" },
              backend_completeness: { type: "integer" },
              security: { type: "integer" },
              test_coverage: { type: "integer" },
              performance: { type: "integer" },
              overall_score: { type: "integer" },
            },
            required: ["ui_completeness", "backend_completeness", "security", "test_coverage", "performance", "overall_score"],
            additionalProperties: false,
          },
          issues: { type: "array", items: { type: "object", properties: { severity: { type: "string", enum: ["error", "warning", "info"] }, message: { type: "string" }, category: { type: "string" } }, required: ["severity", "message", "category"], additionalProperties: false } },
          improvements: { type: "array", items: { type: "string" } },
          verdict: { type: "string", enum: ["pass", "needs_improvement", "fail"] },
        },
        required: ["scores", "issues", "improvements", "verdict"],
        additionalProperties: false,
      },
    },
  },
};

type AgentName = keyof typeof AGENT_CONFIGS;

async function runAgent(
  agentName: AgentName,
  userPrompt: string,
  context: Record<string, unknown>,
  apiKey: string
): Promise<{ success: boolean; data?: unknown; error?: string; agentName: string }> {
  const agent = AGENT_CONFIGS[agentName];

  const contextStr = Object.entries(context)
    .map(([k, v]) => `## ${k}\n${JSON.stringify(v, null, 2)}`)
    .join("\n\n");

  const fullPrompt = contextStr
    ? `User Request: "${userPrompt}"\n\n--- Previous Agent Outputs ---\n${contextStr}`
    : `User Request: "${userPrompt}"`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: agent.system },
          { role: "user", content: fullPrompt },
        ],
        tools: [{ type: "function", function: { name: agent.tool.name, description: agent.tool.description, parameters: agent.tool.parameters } }],
        tool_choice: { type: "function", function: { name: agent.tool.name } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return { success: false, error: "Rate limit exceeded. Please try again shortly.", agentName: agent.name };
      if (response.status === 402) return { success: false, error: "AI credits exhausted. Please add funds in workspace settings.", agentName: agent.name };
      return { success: false, error: `Agent ${agent.name} failed: HTTP ${response.status}`, agentName: agent.name };
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) return { success: false, error: `Agent ${agent.name} did not return structured output`, agentName: agent.name };

    return { success: true, data: JSON.parse(toolCall.function.arguments), agentName: agent.name };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error", agentName: agent.name };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, mode } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Use streaming response to send progress updates
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ event, data })}\n\n`));
        };

        const agentLog: unknown[] = [];
        const context: Record<string, unknown> = {};

        // ===== Agent 1: Requirements =====
        send("agent_start", { agent: "Requirement Analyst", step: 1, total: 5 });
        const reqResult = await runAgent("requirements", prompt, {}, LOVABLE_API_KEY);
        agentLog.push({ agent: "requirements", ...reqResult });
        if (!reqResult.success) {
          send("agent_error", { agent: "Requirement Analyst", error: reqResult.error });
          send("pipeline_complete", { success: false, error: reqResult.error });
          controller.close();
          return;
        }
        context.requirements = reqResult.data;
        send("agent_done", { agent: "Requirement Analyst", step: 1, data: reqResult.data });

        // Small delay to avoid rate limits
        await new Promise(r => setTimeout(r, 300));

        // ===== Agent 2: Task Planner =====
        send("agent_start", { agent: "Task Planner", step: 2, total: 5 });
        const planResult = await runAgent("planner", prompt, context, LOVABLE_API_KEY);
        agentLog.push({ agent: "planner", ...planResult });
        if (!planResult.success) {
          send("agent_error", { agent: "Task Planner", error: planResult.error });
          send("pipeline_complete", { success: false, error: planResult.error });
          controller.close();
          return;
        }
        context.task_plan = planResult.data;
        send("agent_done", { agent: "Task Planner", step: 2, data: planResult.data });

        await new Promise(r => setTimeout(r, 300));

        // ===== Agent 3: System Architect =====
        send("agent_start", { agent: "System Architect", step: 3, total: 5 });
        const archResult = await runAgent("architect", prompt, context, LOVABLE_API_KEY);
        agentLog.push({ agent: "architect", ...archResult });
        if (!archResult.success) {
          send("agent_error", { agent: "System Architect", error: archResult.error });
          send("pipeline_complete", { success: false, error: archResult.error });
          controller.close();
          return;
        }
        context.architecture = archResult.data;
        send("agent_done", { agent: "System Architect", step: 3, data: archResult.data });

        await new Promise(r => setTimeout(r, 300));

        // ===== Agent 4: UI/UX Designer =====
        send("agent_start", { agent: "UI/UX Designer", step: 4, total: 5 });
        const uiResult = await runAgent("uiux", prompt, context, LOVABLE_API_KEY);
        agentLog.push({ agent: "uiux", ...uiResult });
        if (!uiResult.success) {
          send("agent_error", { agent: "UI/UX Designer", error: uiResult.error });
          send("pipeline_complete", { success: false, error: uiResult.error });
          controller.close();
          return;
        }
        context.ui_design = uiResult.data;
        send("agent_done", { agent: "UI/UX Designer", step: 4, data: uiResult.data });

        await new Promise(r => setTimeout(r, 300));

        // ===== Agent 5: Quality Reviewer =====
        send("agent_start", { agent: "Quality Reviewer", step: 5, total: 5 });
        const reviewResult = await runAgent("reviewer", prompt, context, LOVABLE_API_KEY);
        agentLog.push({ agent: "reviewer", ...reviewResult });
        if (!reviewResult.success) {
          // Reviewer failure is non-fatal, continue
          send("agent_done", { agent: "Quality Reviewer", step: 5, data: { scores: { overall_score: 0 }, issues: [], improvements: [], verdict: "needs_improvement" } });
        } else {
          context.quality_review = reviewResult.data;
          send("agent_done", { agent: "Quality Reviewer", step: 5, data: reviewResult.data });
        }

        // ===== Assemble Final Config =====
        const req_data = context.requirements as any;
        const plan_data = context.task_plan as any;
        const arch_data = context.architecture as any;
        const ui_data = context.ui_design as any;
        const review_data = (context.quality_review || { scores: {}, issues: [], improvements: [], verdict: "pass" }) as any;

        const finalConfig = {
          project_type: req_data.project_type,
          title: req_data.title,
          description: req_data.description,
          modules: req_data.modules || [],
          roles: req_data.roles || [],
          features: req_data.features || [],
          pages: ui_data.pages || [],
          collections: arch_data.collections || [],
          style: ui_data.style || {},
          // Extended data from multi-agent pipeline
          requirements: req_data.functional_requirements || [],
          non_functional_requirements: req_data.non_functional_requirements || [],
          task_plan: plan_data.tasks || [],
          suggestions: plan_data.suggestions || [],
          api_endpoints: arch_data.api_endpoints || [],
          quality_score: review_data.scores || {},
          quality_issues: review_data.issues || [],
          quality_improvements: review_data.improvements || [],
          quality_verdict: review_data.verdict || "pass",
          agent_log: agentLog,
        };

        send("pipeline_complete", { success: true, config: finalConfig });
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Multi-agent pipeline error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
