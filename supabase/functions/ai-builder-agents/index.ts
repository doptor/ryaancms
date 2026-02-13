import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================================
// 10-Agent AI Builder Pipeline (Enterprise Grade)
// Requirement → Product Manager → Task Planner → System Architect
// → Database Agent → Backend Agent → Frontend/UI Agent
// → Testing Agent → Debugger Agent → Quality Reviewer
// ============================================================

interface AgentConfig {
  name: string;
  system: string;
  tool: { name: string; description: string; parameters: Record<string, unknown> };
}

const AGENT_CONFIGS: Record<string, AgentConfig> = {
  // Agent 1: Requirement Analyst
  requirements: {
    name: "Requirement Analyst",
    system: `You are a Requirements Analyst AI Agent for RyaanCMS AI Builder.
Your job: Analyze the user's prompt and extract a complete Software Requirements Specification (FRS/SRS).
You MUST call the "extract_requirements" tool.
Rules:
- Identify project type (landing, blog, saas, ecommerce, portfolio, dashboard, marketplace, crm, custom)
- Extract ALL functional requirements (what the app must do)
- Extract non-functional requirements (performance, security, scalability)
- Identify user roles needed
- Identify required modules from: auth, blog, ecommerce, crm, analytics, payments, media, forms, api, marketplace, notifications, search, reports, settings
- List key features (multi-tenant, realtime, i18n, etc.)
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

  // Agent 2: Product Manager
  product_manager: {
    name: "Product Manager",
    system: `You are a Product Manager AI Agent for RyaanCMS AI Builder.
You receive extracted requirements and define the product workflow, user journeys, and business logic.
You MUST call the "define_product" tool.
Rules:
- Define user workflows for each role (what they do step by step)
- Identify core business rules and validations
- Define notification triggers (when to send emails/notifications)
- Map permission matrices (which role can do what on which resource)
- Identify integration points (payment gateways, email services, etc.)
- Define data relationships and ownership rules`,
    tool: {
      name: "define_product",
      description: "Define product workflows and business logic",
      parameters: {
        type: "object",
        properties: {
          workflows: { type: "array", items: { type: "object", properties: { role: { type: "string" }, steps: { type: "array", items: { type: "string" } }, trigger: { type: "string" } }, required: ["role", "steps"], additionalProperties: false } },
          business_rules: { type: "array", items: { type: "object", properties: { rule: { type: "string" }, applies_to: { type: "string" }, validation: { type: "string" } }, required: ["rule", "applies_to"], additionalProperties: false } },
          notification_triggers: { type: "array", items: { type: "object", properties: { event: { type: "string" }, channel: { type: "string" }, recipients: { type: "string" } }, required: ["event", "channel"], additionalProperties: false } },
          permission_matrix: { type: "array", items: { type: "object", properties: { role: { type: "string" }, resource: { type: "string" }, actions: { type: "array", items: { type: "string" } } }, required: ["role", "resource", "actions"], additionalProperties: false } },
          integrations: { type: "array", items: { type: "string" } },
        },
        required: ["workflows", "business_rules", "permission_matrix"],
        additionalProperties: false,
      },
    },
  },

  // Agent 3: Task Planner
  planner: {
    name: "Task Planner",
    system: `You are a Task Planner AI Agent for RyaanCMS AI Builder.
You receive requirements and product definition, then create a step-by-step build plan.
You MUST call the "create_task_plan" tool.
Rules:
- Break the project into sequential, buildable tasks/modules
- Each task should be a self-contained module (Auth, Dashboard, specific features)
- Order tasks by dependency (auth first, then core modules, then advanced features)
- Each task gets a name, description, estimated complexity
- Include database setup as early tasks
- Max 15 tasks for any project`,
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
          },
        },
        required: ["tasks", "total_estimated_complexity", "suggestions"],
        additionalProperties: false,
      },
    },
  },

  // Agent 4: System Architect
  architect: {
    name: "System Architect",
    system: `You are a System Architect AI Agent for RyaanCMS AI Builder.
You receive requirements, product definition, and task plan, then design the overall system architecture, folder structure, and technology decisions.
You MUST call the "design_system" tool.
Rules:
- Define the folder structure for the project
- Choose appropriate middleware and services
- Design caching strategy
- Define environment variables needed
- Plan deployment architecture
- Define module boundaries and interfaces`,
    tool: {
      name: "design_system",
      description: "Design overall system architecture",
      parameters: {
        type: "object",
        properties: {
          folder_structure: { type: "object" },
          middleware: { type: "array", items: { type: "string" } },
          services: { type: "array", items: { type: "object", properties: { name: { type: "string" }, purpose: { type: "string" } }, required: ["name", "purpose"], additionalProperties: false } },
          env_variables: { type: "array", items: { type: "object", properties: { name: { type: "string" }, description: { type: "string" }, required: { type: "boolean" } }, required: ["name", "description"], additionalProperties: false } },
          deployment_notes: { type: "array", items: { type: "string" } },
        },
        required: ["folder_structure", "services", "env_variables"],
        additionalProperties: false,
      },
    },
  },

  // Agent 5: Database Agent
  database: {
    name: "Database Agent",
    system: `You are a Database Design AI Agent for RyaanCMS AI Builder.
You receive all prior context and design the complete database schema with tables, relationships, indexes, and RLS policies.
You MUST call the "design_database" tool.
Rules:
- Design collections/tables with proper fields, types, and relationships
- Field types: text, number, boolean, date, relation, json, media, enum, uuid, email, url, password, timestamp
- Enable RLS on all user-facing tables
- Mark tenant-isolated tables if multi-tenant
- Add proper indexes for frequently queried fields
- Every user-data table needs user_id or tenant_id
- Include audit fields (created_at, updated_at) by default
- Design seed data structure`,
    tool: {
      name: "design_database",
      description: "Design database schema with tables and relationships",
      parameters: {
        type: "object",
        properties: {
          collections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                fields: { type: "array", items: { type: "object", properties: { name: { type: "string" }, type: { type: "string" }, required: { type: "boolean" }, default: { type: "string" }, unique: { type: "boolean" }, indexed: { type: "boolean" }, relation_to: { type: "string" } }, required: ["name", "type"], additionalProperties: false } },
                rls: { type: "boolean" },
                tenant_isolated: { type: "boolean" },
                audit_fields: { type: "boolean" },
                soft_delete: { type: "boolean" },
              },
              required: ["name", "fields", "rls"],
              additionalProperties: false,
            },
          },
          seed_data: { type: "array", items: { type: "object", properties: { collection: { type: "string" }, count: { type: "integer" }, sample: { type: "object" } }, required: ["collection", "count"], additionalProperties: false } },
        },
        required: ["collections"],
        additionalProperties: false,
      },
    },
  },

  // Agent 6: Backend Agent
  backend: {
    name: "Backend Agent",
    system: `You are a Backend/API Design AI Agent for RyaanCMS AI Builder.
You receive all context and design the REST API endpoints, edge functions, and server-side logic.
You MUST call the "design_backend" tool.
Rules:
- Design REST API endpoints for each module
- Define request/response schemas
- Include authentication and authorization on each endpoint
- Design webhook endpoints where needed
- Define rate limiting rules
- Include file upload endpoints if media module exists`,
    tool: {
      name: "design_backend",
      description: "Design API endpoints and backend logic",
      parameters: {
        type: "object",
        properties: {
          api_endpoints: {
            type: "array",
            items: {
              type: "object",
              properties: {
                method: { type: "string", enum: ["GET", "POST", "PUT", "DELETE", "PATCH"] },
                path: { type: "string" },
                description: { type: "string" },
                auth_required: { type: "boolean" },
                roles: { type: "array", items: { type: "string" } },
                rate_limit: { type: "string" },
              },
              required: ["method", "path", "description", "auth_required"],
              additionalProperties: false,
            },
          },
          webhooks: { type: "array", items: { type: "object", properties: { event: { type: "string" }, url: { type: "string" }, description: { type: "string" } }, required: ["event", "description"], additionalProperties: false } },
          edge_functions: { type: "array", items: { type: "object", properties: { name: { type: "string" }, description: { type: "string" }, trigger: { type: "string" } }, required: ["name", "description"], additionalProperties: false } },
        },
        required: ["api_endpoints"],
        additionalProperties: false,
      },
    },
  },

  // Agent 7: Frontend/UI Agent
  uiux: {
    name: "UI/UX Designer",
    system: `You are a UI/UX Designer AI Agent for RyaanCMS AI Builder.
You receive all context and design page layouts with components.
You MUST call the "design_ui" tool.
Rules:
- Design pages with appropriate layouts: public, dashboard, auth, fullscreen, marketing
- Select components from: hero, navbar, footer, sidebar, crud_table, form, chart, card_grid, stats_row, auth_form, pricing_table, media_gallery, search_bar, notification_center, rich_text_editor, file_upload, calendar, kanban_board, timeline, map, role_manager, payment_page, dashboard_layout, data_import, settings_panel, api_docs
- Provide sensible default props for each component
- Mark pages that require authentication
- Every dashboard page needs sidebar and navbar
- Landing pages need hero, features, pricing, footer
- Include responsive design considerations`,
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
                layout: { type: "string", enum: ["public", "dashboard", "auth", "fullscreen", "marketing"] },
                requires_auth: { type: "boolean" },
                roles: { type: "array", items: { type: "string" } },
                components: { type: "array", items: { type: "object", properties: { type: { type: "string" }, props: { type: "object" } }, required: ["type"], additionalProperties: false } },
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

  // Agent 8: Testing Agent
  testing: {
    name: "Testing Agent",
    system: `You are a Testing AI Agent for RyaanCMS AI Builder.
You receive the complete project config and generate test scenarios, seed data, and validation checks.
You MUST call the "generate_tests" tool.
Rules:
- Generate test scenarios for each page/component
- Include happy path and error path tests
- Generate seed data for each collection
- Define integration test scenarios
- Check for edge cases (empty states, large data, concurrent access)
- Validate all CRUD operations work correctly`,
    tool: {
      name: "generate_tests",
      description: "Generate test scenarios and seed data",
      parameters: {
        type: "object",
        properties: {
          test_scenarios: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                type: { type: "string", enum: ["unit", "integration", "e2e"] },
                module: { type: "string" },
                steps: { type: "array", items: { type: "string" } },
                expected: { type: "string" },
              },
              required: ["name", "type", "module", "steps", "expected"],
              additionalProperties: false,
            },
          },
          seed_data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                collection: { type: "string" },
                records: { type: "integer" },
                sample_fields: { type: "object" },
              },
              required: ["collection", "records"],
              additionalProperties: false,
            },
          },
          coverage_targets: { type: "object", properties: { unit: { type: "integer" }, integration: { type: "integer" }, e2e: { type: "integer" } }, additionalProperties: false },
        },
        required: ["test_scenarios", "seed_data"],
        additionalProperties: false,
      },
    },
  },

  // Agent 9: Debugger Agent
  debugger: {
    name: "Debugger Agent",
    system: `You are a Debugger AI Agent for RyaanCMS AI Builder.
You receive the complete project config and analyze it for potential bugs, inconsistencies, and issues that would cause runtime errors.
You MUST call the "debug_analysis" tool.
Rules:
- Check for missing references (components referencing non-existent collections)
- Check for circular dependencies
- Verify all routes are unique and valid
- Check for missing authentication on sensitive pages
- Verify all required props are provided
- Check for potential N+1 query issues
- Identify missing error handling scenarios
- Flag any security vulnerabilities`,
    tool: {
      name: "debug_analysis",
      description: "Analyze project for bugs and issues",
      parameters: {
        type: "object",
        properties: {
          bugs: {
            type: "array",
            items: {
              type: "object",
              properties: {
                severity: { type: "string", enum: ["critical", "high", "medium", "low"] },
                category: { type: "string" },
                description: { type: "string" },
                location: { type: "string" },
                fix: { type: "string" },
              },
              required: ["severity", "category", "description", "fix"],
              additionalProperties: false,
            },
          },
          auto_fixes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                description: { type: "string" },
                applied: { type: "boolean" },
                change: { type: "string" },
              },
              required: ["description", "applied"],
              additionalProperties: false,
            },
          },
          risk_score: { type: "integer" },
        },
        required: ["bugs", "auto_fixes", "risk_score"],
        additionalProperties: false,
      },
    },
  },

  // Agent 10: Quality Reviewer
  reviewer: {
    name: "Quality Reviewer",
    system: `You are a Quality Reviewer AI Agent for RyaanCMS AI Builder.
You receive the COMPLETE project configuration including all agent outputs and perform a thorough final review.
You MUST call the "quality_review" tool.
Rules:
- Score the project on: ui_completeness, backend_completeness, security, test_coverage, performance (each 0-100)
- Calculate overall_score as weighted average (security gets 25% weight, others 18.75%)
- List specific issues found
- List specific improvements recommended
- If overall_score < 80, flag critical improvements
- Consider ALL previous agent outputs in your assessment
- Be strict but fair — enterprise-grade means 90+`,
    tool: {
      name: "quality_review",
      description: "Review and score the complete project",
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

  // Build context string (limit size to avoid token overflow)
  const contextEntries = Object.entries(context);
  let contextStr = "";
  for (const [k, v] of contextEntries) {
    const json = JSON.stringify(v, null, 2);
    // Truncate large context entries
    contextStr += `## ${k}\n${json.length > 4000 ? json.slice(0, 4000) + "\n...(truncated)" : json}\n\n`;
  }

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
        model: "google/gemini-2.5-flash",
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
      if (response.status === 402) return { success: false, error: "AI credits exhausted.", agentName: agent.name };
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

// Agent pipeline definition with order and fatal flag
const PIPELINE: { key: AgentName; fatal: boolean }[] = [
  { key: "requirements", fatal: true },
  { key: "product_manager", fatal: false },
  { key: "planner", fatal: true },
  { key: "architect", fatal: false },
  { key: "database", fatal: true },
  { key: "backend", fatal: false },
  { key: "uiux", fatal: true },
  { key: "testing", fatal: false },
  { key: "debugger", fatal: false },
  { key: "reviewer", fatal: false },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ event, data })}\n\n`));
        };

        const agentLog: unknown[] = [];
        const context: Record<string, unknown> = {};
        const totalAgents = PIPELINE.length;

        // Context key mapping for each agent's output
        const CONTEXT_KEYS: Record<string, string> = {
          requirements: "requirements",
          product_manager: "product_definition",
          planner: "task_plan",
          architect: "system_architecture",
          database: "database_design",
          backend: "backend_design",
          uiux: "ui_design",
          testing: "test_plan",
          debugger: "debug_analysis",
          reviewer: "quality_review",
        };

        for (let i = 0; i < PIPELINE.length; i++) {
          const { key, fatal } = PIPELINE[i];
          const agent = AGENT_CONFIGS[key];
          const step = i + 1;

          send("agent_start", { agent: agent.name, step, total: totalAgents });

          const result = await runAgent(key, prompt, context, LOVABLE_API_KEY);
          agentLog.push({ agent: key, ...result });

          if (!result.success) {
            send("agent_error", { agent: agent.name, step, error: result.error });
            if (fatal) {
              send("pipeline_complete", { success: false, error: `${agent.name} failed: ${result.error}` });
              controller.close();
              return;
            }
            // Non-fatal: continue with empty data
            send("agent_done", { agent: agent.name, step, data: {}, skipped: true });
          } else {
            context[CONTEXT_KEYS[key]] = result.data;
            send("agent_done", { agent: agent.name, step, data: result.data });
          }

          // Rate limit delay between agents
          if (i < PIPELINE.length - 1) {
            await new Promise(r => setTimeout(r, 250));
          }
        }

        // ===== Assemble Final Config =====
        const req_data = (context.requirements || {}) as any;
        const prod_data = (context.product_definition || {}) as any;
        const plan_data = (context.task_plan || {}) as any;
        const sys_data = (context.system_architecture || {}) as any;
        const db_data = (context.database_design || {}) as any;
        const api_data = (context.backend_design || {}) as any;
        const ui_data = (context.ui_design || {}) as any;
        const test_data = (context.test_plan || {}) as any;
        const debug_data = (context.debug_analysis || {}) as any;
        const review_data = (context.quality_review || { scores: {}, issues: [], improvements: [], verdict: "pass" }) as any;

        const finalConfig = {
          project_type: req_data.project_type,
          title: req_data.title,
          description: req_data.description,
          modules: req_data.modules || [],
          roles: req_data.roles || [],
          features: req_data.features || [],
          pages: ui_data.pages || [],
          collections: db_data.collections || [],
          style: ui_data.style || {},
          // Extended multi-agent data
          requirements: req_data.functional_requirements || [],
          non_functional_requirements: req_data.non_functional_requirements || [],
          workflows: prod_data.workflows || [],
          business_rules: prod_data.business_rules || [],
          permission_matrix: prod_data.permission_matrix || [],
          notification_triggers: prod_data.notification_triggers || [],
          task_plan: plan_data.tasks || [],
          suggestions: plan_data.suggestions || [],
          folder_structure: sys_data.folder_structure || {},
          services: sys_data.services || [],
          env_variables: sys_data.env_variables || [],
          seed_data: db_data.seed_data || test_data.seed_data || [],
          api_endpoints: api_data.api_endpoints || [],
          webhooks: api_data.webhooks || [],
          edge_functions: api_data.edge_functions || [],
          test_scenarios: test_data.test_scenarios || [],
          coverage_targets: test_data.coverage_targets || {},
          bugs: debug_data.bugs || [],
          auto_fixes: debug_data.auto_fixes || [],
          risk_score: debug_data.risk_score || 0,
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
    console.error("10-agent pipeline error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
