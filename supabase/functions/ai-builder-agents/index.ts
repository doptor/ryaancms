import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================================
// RyaanCMS AI Builder — MASTER SYSTEM PROMPT + 10-Agent Pipeline
// ============================================================

const MASTER_SYSTEM_PREFIX = `You are RyaanCMS AI Builder, an autonomous senior full-stack engineer and product architect.

GLOBAL RULES:
1. Always create COMPLETE working projects, not partial snippets.
2. Output must be production-grade: clean structure, reusable code, consistent naming.
3. Every module must include: UI pages, backend API, database schema, validation, error handling.
4. Follow the FIXED TECH STACK: React (Vite) + TailwindCSS + React Router for frontend; Node.js + Express.js + JWT Auth + RBAC + Prisma ORM + MySQL for backend.
5. Never leave missing imports, undefined variables, or broken routes.
6. Never generate fake/pseudo code that cannot run.
7. Always generate seed demo data and default admin login credentials.
8. Must include installer-like setup for environment config (.env.example, INSTALL.md).
9. Store all progress into Project Memory JSON (PROJECT_STATE_JSON).
10. Use service layer separation — avoid spaghetti code.
11. Create reusable UI components; ensure responsive layouts.
12. Implement pagination for large tables.
13. Include audit logs table for enterprise apps.

STANDARD API RESPONSE FORMAT (all endpoints MUST use):
Success: { "success": true, "message": "ok", "data": {} }
Error: { "success": false, "message": "error", "errors": [] }

SMART REQUIREMENT MODE:
- If user says "Build a CRM", auto-assume: contacts, leads, deals pipeline, notes, tasks, follow-ups, invoices, reporting.
- If user says "Build an E-commerce", auto-assume: products, categories, cart, checkout, orders, inventory, reviews.
- Only ask questions if user requires truly custom/unclear flows.

SECURITY REQUIREMENTS:
- bcrypt password hashing
- JWT expiry 1 day
- Role-based middleware
- Input validation with zod
- Prevent CORS issues
- Store secrets only in env
- Never expose API keys in frontend
- Rate limiting (express-rate-limit)

MODULE GENERATOR PATTERN (every feature module MUST follow):
- Model → Migration → Controller → Service → Validator → Routes → Frontend Table Page → Frontend Create/Edit Form → API integration

AUTO DOCUMENTATION (always generate):
- README.md (overview + features)
- INSTALL.md (setup guide)
- API.md (API endpoint list)
- DB_SCHEMA.md (database schema explanation)

ERROR FIX MEMORY:
- When a bug is found and fixed, record: error_signature, fix_applied, files_changed
- Future projects should reference these fixes to avoid repeating mistakes

QUALITY SCORE SYSTEM:
- After completion, compute: UI completeness, Backend completeness, Security, Test coverage, Performance (each 0-100)
- If overall < 90%, run improvement loop automatically

PLUGIN-READY ARCHITECTURE:
- Support plugin modules: payments, sms, whatsapp, email_marketing
- Use event-driven hooks for extensibility

TEMPLATE HYBRID MODE:
- Use 20% stable boilerplate templates + 80% dynamic AI generation
- This ensures marketplace stability

UI STYLE SYSTEM (default):
- Professional admin dashboard theme
- Left sidebar navigation + top header
- Dashboard cards + stats rows
- Tables with search/filter/pagination
- Modal forms or separate pages
- Clean Tailwind design

FORBIDDEN:
- Do NOT generate incomplete projects
- Do NOT leave TODO placeholders
- Do NOT output pseudo code
- Do NOT skip database integration
- Do NOT skip authentication unless user explicitly says so
`;

interface AgentConfig {
  name: string;
  system: string;
  tool: { name: string; description: string; parameters: Record<string, unknown> };
}

const AGENT_CONFIGS: Record<string, AgentConfig> = {
  // Agent 1: Requirement Analyst
  requirements: {
    name: "Requirement Analyst",
    system: `${MASTER_SYSTEM_PREFIX}

AGENT ROLE: You are the Requirement Analyst (Agent 1/10).
Your job: Analyze the user's prompt and extract a complete FRS/SRS.
You MUST call the "extract_requirements" tool.

Rules:
- Identify project type (landing, blog, saas, ecommerce, portfolio, dashboard, marketplace, crm, custom)
- Extract ALL functional requirements (what the app must do)
- Extract non-functional requirements (performance, security, scalability)
- Identify user roles needed
- Identify required modules from: auth, blog, ecommerce, crm, analytics, payments, media, forms, api, marketplace, notifications, search, reports, settings
- List key features (multi-tenant, realtime, i18n, etc.)
- Be thorough — extract implicit requirements too (e.g. "CRM" implies contacts, leads, deals, pipeline)
- Use SMART REQUIREMENT MODE: auto-assume standard requirements for known app types
- If unclear, identify max 5 essential clarification questions but still produce best-effort output`,
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
          default_admin_credentials: { type: "object", properties: { email: { type: "string" }, password: { type: "string" } }, additionalProperties: false },
          clarification_questions: { type: "array", items: { type: "string" } },
        },
        required: ["title", "description", "project_type", "functional_requirements", "modules", "roles", "features", "suggested_modules_breakdown"],
        additionalProperties: false,
      },
    },
  },

  // Agent 2: Product Manager
  product_manager: {
    name: "Product Manager",
    system: `${MASTER_SYSTEM_PREFIX}

AGENT ROLE: You are the Product Manager (Agent 2/10).
You receive extracted requirements and define the product workflow, user journeys, and business logic.
You MUST call the "define_product" tool.

Rules:
- Define user workflows for each role (what they do step by step)
- Identify core business rules and validations
- Define notification triggers (when to send emails/notifications)
- Map permission matrices (which role can do what on which resource)
- Identify integration points (payment gateways, email services, etc.)
- Define data relationships and ownership rules
- Include installer/setup workflow for first-time users`,
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
          installer_steps: { type: "array", items: { type: "string" } },
        },
        required: ["workflows", "business_rules", "permission_matrix"],
        additionalProperties: false,
      },
    },
  },

  // Agent 3: Task Planner
  planner: {
    name: "Task Planner",
    system: `${MASTER_SYSTEM_PREFIX}

AGENT ROLE: You are the Task Planner (Agent 3/10).
You receive requirements and product definition, then create a step-by-step build plan.
You MUST call the "create_task_plan" tool.

Rules:
- Break the project into sequential, buildable tasks/modules following MODULE GENERATOR PATTERN
- Each task should be self-contained (Auth, Dashboard, specific features)
- Order tasks by dependency (auth first, then core modules, then advanced features)
- Include database setup as early tasks
- Include documentation generation as final task
- Max 15 tasks for any project
- Each task produces: pages, components, collections`,
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
          documentation_plan: { type: "array", items: { type: "string" } },
        },
        required: ["tasks", "total_estimated_complexity", "suggestions"],
        additionalProperties: false,
      },
    },
  },

  // Agent 4: System Architect
  architect: {
    name: "System Architect",
    system: `${MASTER_SYSTEM_PREFIX}

AGENT ROLE: You are the System Architect (Agent 4/10).
You MUST call the "design_system" tool.

Rules:
- Define the REQUIRED folder structure (frontend/src/components, pages, layouts, routes, services, hooks, utils + backend/src/config, controllers, middleware, routes, services, validators, utils, prisma)
- Choose appropriate middleware and services
- Define environment variables needed (.env.example format)
- Plan deployment architecture
- Define module boundaries and interfaces
- Ensure plugin-ready architecture with event hooks`,
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
          plugin_hooks: { type: "array", items: { type: "string" } },
        },
        required: ["folder_structure", "services", "env_variables"],
        additionalProperties: false,
      },
    },
  },

  // Agent 5: Database Agent
  database: {
    name: "Database Agent",
    system: `${MASTER_SYSTEM_PREFIX}

AGENT ROLE: You are the Database Engineer (Agent 5/10).
You MUST call the "design_database" tool.

Rules:
- Design MySQL/Prisma schema with proper fields, types, and relationships
- Field types: text, number, boolean, date, relation, json, media, enum, uuid, email, url, password, timestamp
- Enable RLS on all user-facing tables
- Mark tenant-isolated tables if multi-tenant
- Add proper indexes for frequently queried fields
- Every user-data table needs user_id or tenant_id
- Include audit fields (created_at, updated_at) by default
- Include audit_logs table for enterprise apps
- Design seed data with default admin credentials
- Generate Prisma schema and migration plan`,
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
          prisma_schema_hint: { type: "string" },
        },
        required: ["collections"],
        additionalProperties: false,
      },
    },
  },

  // Agent 6: Backend Agent
  backend: {
    name: "Backend Agent",
    system: `${MASTER_SYSTEM_PREFIX}

AGENT ROLE: You are the Backend Engineer (Agent 6/10).
You MUST call the "design_backend" tool.

Rules:
- Design REST API endpoints following STANDARD API RESPONSE FORMAT
- Every endpoint must return { success, message, data } or { success, message, errors }
- Define request/response schemas
- Include authentication (JWT) and authorization (RBAC) on each endpoint
- Design webhook endpoints where needed
- Define rate limiting rules (express-rate-limit)
- Include file upload endpoints if media module exists
- Follow service layer separation: routes → controllers → services → models
- Include global error middleware`,
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
                request_schema: { type: "object" },
                response_format: { type: "string" },
              },
              required: ["method", "path", "description", "auth_required"],
              additionalProperties: false,
            },
          },
          webhooks: { type: "array", items: { type: "object", properties: { event: { type: "string" }, url: { type: "string" }, description: { type: "string" } }, required: ["event", "description"], additionalProperties: false } },
          edge_functions: { type: "array", items: { type: "object", properties: { name: { type: "string" }, description: { type: "string" }, trigger: { type: "string" } }, required: ["name", "description"], additionalProperties: false } },
          middleware_stack: { type: "array", items: { type: "string" } },
        },
        required: ["api_endpoints"],
        additionalProperties: false,
      },
    },
  },

  // Agent 7: UI/UX Designer (with Design System Lock + Section Composer)
  uiux: {
    name: "UI/UX Designer",
    system: `${MASTER_SYSTEM_PREFIX}

AGENT ROLE: You are the Frontend Engineer & UI/UX Designer (Agent 7/10).
You MUST call the "design_ui" tool.

=== DESIGN SYSTEM LOCK (MANDATORY) ===
All generated UIs MUST follow these hard rules. No exceptions:

TYPOGRAPHY:
- Font: Inter (always)
- Headings: text-4xl md:text-6xl font-extrabold tracking-tight (hero), text-3xl md:text-4xl font-extrabold (sections)
- Subheadings: text-base text-muted-foreground leading-relaxed max-w-xl mx-auto
- Body: text-sm text-muted-foreground leading-relaxed

SPACING (8px grid):
- Section padding: py-20 (80px vertical)
- Inner spacing: space-y-3 between elements
- Section header bottom margin: mb-14
- Container: max-w-5xl mx-auto (1200px max)

CONSISTENCY:
- All sections centered with consistent max-width
- All buttons use the same style (primary filled + outline secondary)
- All cards: rounded-2xl border border-border bg-card, hover:shadow-lg hover:border-primary/20 hover:-translate-y-1 transition-all duration-300
- All section badges: Badge variant="secondary" text-xs px-3 py-1 font-medium
- Border radius: rounded-2xl for cards, rounded-xl for inputs

=== LANDING PAGE SECTION COMPOSER (DYNAMIC WITH GUARDRAILS) ===
For landing/marketing/portfolio pages, compose from section components. You CAN create new section types dynamically, but MUST follow design system rules.

CORE LANDING SECTIONS (always available):
1. "navbar" - Top navigation (always first)
2. "hero" - Hero section with headline + CTA (always after navbar)
3. "trusted_by" - Logo cloud showing partner brands
4. "features_grid" - Feature cards grid (3 or 6 cards)
5. "feature_split" - Side-by-side: visual + text + bullet points
6. "how_it_works" - Step-by-step process (3 steps)
7. "testimonials" - Customer testimonial cards
8. "pricing_table" - Pricing plans comparison
9. "faq" - FAQ accordion section
10. "final_cta" - Bottom CTA with gradient background
11. "footer" - Site footer (always last)

DYNAMIC SECTIONS (use when appropriate):
12. "stats_banner" - Full-width stats counter section
13. "video_section" - Video demo with play button
14. "comparison_table" - Feature comparison table
15. "integrations_grid" - Integration partner logos grid
16. "contact_form" - Contact form with info sidebar
17. "newsletter_cta" - Email newsletter signup
18. "blog_preview" - Latest blog post cards
19. "use_cases" - Use case showcase cards/tabs
20. "team_section" - Team member cards
21. "cta_with_image" - CTA with side image

AI CAN ALSO CREATE NEW SECTION TYPES if the prompt requires it. Just ensure:
- Follow the Design System Lock (py-20, max-w-5xl, Inter font, rounded-2xl cards)
- Provide rich default props
- Use consistent naming (snake_case)

STANDARD LANDING PAGE FORMULA (baseline, can be extended):
navbar → hero → trusted_by → features_grid → feature_split → how_it_works → testimonials → pricing_table → faq → final_cta → footer

For portfolio: navbar → hero → card_grid → stats_banner → media_gallery → testimonials → contact_form → footer
For SaaS: navbar → hero → trusted_by → features_grid → video_section → how_it_works → comparison_table → pricing_table → testimonials → faq → final_cta → footer
For E-commerce: navbar → hero → features_grid → use_cases → pricing_table → testimonials → newsletter_cta → faq → footer

=== CRUD GENERATOR (for application pages) ===
When generating dashboard/application pages, use the CRUD pattern:
- Each entity gets: stats_row + crud_table components
- Include proper collection binding and column definitions
- Add search, sort, pagination, and bulk actions
- Generate matching database collections with RLS

COMPONENT TYPES AVAILABLE:
hero, navbar, footer, sidebar, crud_table, form, chart, card_grid, stats_row, auth_form, pricing_table, media_gallery, search_bar, notification_center, rich_text_editor, file_upload, calendar, kanban_board, timeline, map, role_manager, payment_page, dashboard_layout, data_import, settings_panel, api_docs, trusted_by, features_grid, feature_split, how_it_works, testimonials, faq, final_cta, stats_banner, video_section, comparison_table, integrations_grid, contact_form, newsletter_cta, blog_preview, use_cases, team_section, cta_with_image

MICRO-INTERACTIONS (always include in style):
- Cards: hover:shadow-lg hover:-translate-y-1
- Buttons: hover shadow transition
- Smooth transitions: transition-all duration-300
- Navbar: sticky top

Rules:
- Landing pages MUST use the Section Composer — never build raw HTML sections
- Dashboard pages use sidebar + header + content layout
- Provide rich default props with premium marketing copy for every component
- Mark pages that require authentication
- Include login/register flow + protected routes`,
    tool: {
      name: "design_ui",
      description: "Design page layouts with components using the section composer system",
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
          reusable_components: { type: "array", items: { type: "string" } },
        },
        required: ["pages", "style"],
        additionalProperties: false,
      },
    },
  },

  // Agent 8: Copywriter Agent (NEW - Premium Marketing Copy)
  copywriter: {
    name: "Copywriter Agent",
    system: `${MASTER_SYSTEM_PREFIX}

AGENT ROLE: You are the Marketing Copywriter (Agent 8/12).
You receive the UI design and rewrite ALL text content to be premium, conversion-focused marketing copy.
You MUST call the "rewrite_copy" tool.

COPYWRITING RULES:
- Hero headline: 6-10 words, benefit-first, no jargon. Power words: "effortless", "instant", "powerful", "seamless"
  Examples: "Ship faster. Build smarter. Scale effortlessly." / "The modern platform teams love."
- Hero subtitle: 1-2 sentences, clear value proposition with specific outcome
  Example: "Join 2,000+ teams who reduced their development time by 60%."
- CTA text: Action-oriented, 2-4 words. "Get Started Free", "Start Building Today", "Try It Now"
- Secondary CTA: Softer. "Watch Demo", "See How It Works", "Talk to Sales"
- Feature titles: 2-3 words, benefit-focused. "Lightning Fast", "Zero Config", "Built-in Security"
- Feature descriptions: 15-25 words, outcome-focused. Start with what the user GETS, not what the product DOES.
- Testimonial quotes: Include specific results with numbers. "Reduced our deploy time from 2 hours to 5 minutes."
- FAQ answers: 1-2 sentences max. Clear, helpful, confidence-building.
- Trusted By label: "Trusted by 2,000+ teams worldwide" or "Powering the world's best teams"

TONE: Professional but approachable. Confident but not arrogant. Clear and concise.
AVOID: Generic phrases like "Welcome to our platform", buzzwords without substance, exclamation marks.`,
    tool: {
      name: "rewrite_copy",
      description: "Rewrite all UI text content with premium marketing copy",
      parameters: {
        type: "object",
        properties: {
          page_copy: {
            type: "array",
            items: {
              type: "object",
              properties: {
                page_name: { type: "string" },
                components: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string" },
                      updated_props: { type: "object" },
                    },
                    required: ["type", "updated_props"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["page_name", "components"],
              additionalProperties: false,
            },
          },
          brand_voice: { type: "string" },
          tagline: { type: "string" },
        },
        required: ["page_copy", "brand_voice", "tagline"],
        additionalProperties: false,
      },
    },
  },

  // Agent 9: Testing Agent
  testing: {
    name: "Testing Agent",
    system: `${MASTER_SYSTEM_PREFIX}

AGENT ROLE: You are the QA/Test Engineer (Agent 9/12).
You MUST call the "generate_tests" tool.

Rules:
- Generate test scenarios for each page/component (happy path + error path)
- Generate seed data for each collection with realistic demo data
- Define integration test scenarios
- Check for edge cases (empty states, large data, concurrent access)
- Validate all CRUD operations
- Generate Postman collection or API test scripts
- Validate main auth flows (login, register, logout, token refresh)`,
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
          postman_collection_hint: { type: "string" },
        },
        required: ["test_scenarios", "seed_data"],
        additionalProperties: false,
      },
    },
  },

  // Agent 10: Debugger Agent
  debugger: {
    name: "Debugger Agent",
    system: `${MASTER_SYSTEM_PREFIX}

AGENT ROLE: You are the Debugger/Auto-Fixer (Agent 10/12).
You MUST call the "debug_analysis" tool.

Rules:
- Check for missing references (components referencing non-existent collections)
- Check for circular dependencies
- Verify all routes are unique and valid
- Check for missing authentication on sensitive pages
- Verify all required props are provided
- Check for potential N+1 query issues
- Identify missing error handling scenarios
- Flag any security vulnerabilities (SQL injection, XSS, CORS)
- Apply ERROR FIX MEMORY: record error_signature + fix_applied + files_changed
- Auto-retry fixes: if build fails, analyze logs, patch code, retry (max 5)
- Verify password hashing, JWT expiry, env secrets not leaked`,
    tool: {
      name: "debug_analysis",
      description: "Analyze project for bugs and auto-fix",
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
                error_signature: { type: "string" },
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
                files_changed: { type: "array", items: { type: "string" } },
              },
              required: ["description", "applied"],
              additionalProperties: false,
            },
          },
          risk_score: { type: "integer" },
          error_fix_memory: { type: "array", items: { type: "object", properties: { error_signature: { type: "string" }, fix_applied: { type: "string" }, files_changed: { type: "array", items: { type: "string" } } }, required: ["error_signature", "fix_applied"], additionalProperties: false } },
        },
        required: ["bugs", "auto_fixes", "risk_score"],
        additionalProperties: false,
      },
    },
  },

  // Agent 11: UI Reviewer Agent (NEW - Visual Quality Gate)
  ui_reviewer: {
    name: "UI Reviewer Agent",
    system: `${MASTER_SYSTEM_PREFIX}

AGENT ROLE: You are the UI Reviewer (Agent 11/12).
You receive the complete UI design and copy, then perform a strict visual quality audit.
You MUST call the "review_ui" tool.

CHECK EVERY ITEM:
1. SPACING: All sections have py-20? Header margins mb-14? 8px grid respected?
2. TYPOGRAPHY: Hero uses text-4xl md:text-6xl font-extrabold? Section headings text-3xl md:text-4xl? Body text-sm text-muted-foreground?
3. CONTAINER: All content within max-w-5xl mx-auto (1200px)?
4. BUTTONS: Primary + secondary CTA pair? Consistent styling? Shadow on primary?
5. CARDS: All use rounded-2xl border border-border bg-card? hover:shadow-lg hover:-translate-y-1?
6. CONTRAST: Text readable? CTA buttons visible? No white-on-white?
7. ALIGNMENT: Marketing sections text-center? Dashboard content text-left?
8. SECTION ORDER: Landing pages follow formula? navbar→hero→sections→footer?
9. MISSING SECTIONS: Does landing page have at least navbar, hero, features_grid, final_cta, footer?
10. MICRO-INTERACTIONS: hover effects on cards? button transitions? smooth animations?
11. COPY QUALITY: Headlines benefit-first? CTAs action-oriented? No generic text?
12. RESPONSIVE: Grid columns adjust for mobile?

For each issue found, provide a specific fix instruction.
If score is below 90, mark must_fix issues.`,
    tool: {
      name: "review_ui",
      description: "Audit UI design for visual quality and consistency",
      parameters: {
        type: "object",
        properties: {
          ui_score: { type: "integer" },
          checks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                check: { type: "string" },
                passed: { type: "boolean" },
                issue: { type: "string" },
                fix: { type: "string" },
                severity: { type: "string", enum: ["critical", "warning", "info"] },
              },
              required: ["check", "passed"],
              additionalProperties: false,
            },
          },
          must_fix: { type: "array", items: { type: "string" } },
          overall_verdict: { type: "string", enum: ["professional", "acceptable", "needs_work"] },
        },
        required: ["ui_score", "checks", "overall_verdict"],
        additionalProperties: false,
      },
    },
  },

  // Agent 12: Quality Reviewer
  reviewer: {
    name: "Quality Reviewer",
    system: `${MASTER_SYSTEM_PREFIX}

AGENT ROLE: You are the Security & Performance Reviewer + Quality Reviewer (Agent 12/12).
You MUST call the "quality_review" tool.

Rules:
- Score the project on: ui_completeness, backend_completeness, security, test_coverage, performance (each 0-100)
- Calculate overall_score as weighted average (security 25%, others 18.75%)
- Check for: SQL injection risks, password hashing, JWT expiry, rate limiting, env secrets not leaked, CORS config
- List specific issues found with severity
- List specific improvements recommended
- If overall_score < 90, flag critical improvements and recommend auto-improvement loop
- Generate documentation checklist (README, INSTALL, API, DB_SCHEMA)
- Provide final verdict: pass (90+), needs_improvement (70-89), fail (<70)
- Be strict — enterprise-grade means 90+`,
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
          documentation_checklist: { type: "object", properties: { readme: { type: "boolean" }, install_guide: { type: "boolean" }, api_docs: { type: "boolean" }, db_schema_docs: { type: "boolean" } }, additionalProperties: false },
          security_checklist: { type: "object", properties: { password_hashing: { type: "boolean" }, jwt_expiry: { type: "boolean" }, rate_limiting: { type: "boolean" }, input_validation: { type: "boolean" }, cors_configured: { type: "boolean" }, env_secrets_safe: { type: "boolean" } }, additionalProperties: false },
        },
        required: ["scores", "issues", "improvements", "verdict"],
        additionalProperties: false,
      },
    },
  },
};

type AgentName = keyof typeof AGENT_CONFIGS;

interface UserApiConfig {
  provider: string;
  endpoint: string;
  apiKey: string;
  model: string;
}

// Map pipeline agent keys to their agent_N useFor tag
const AGENT_KEY_TO_NUM: Record<string, number> = {
  requirements: 1, product_manager: 2, planner: 3, architect: 4,
  database: 5, backend: 6, uiux: 7, copywriter: 8,
  testing: 8, debugger: 9, ui_reviewer: 9, reviewer: 10,
};

function pickApiConfig(agentKey: string, allConfigs: UserApiConfig[]): UserApiConfig | null {
  if (allConfigs.length === 0) return null;
  const agentNum = AGENT_KEY_TO_NUM[agentKey];
  // 1. Try exact agent match (agent_N)
  const byAgent = allConfigs.find((c: any) => c._useFor?.includes(`agent_${agentNum}`));
  if (byAgent) return byAgent;
  // 2. Try app_builder task match
  const byTask = allConfigs.find((c: any) => c._useFor?.includes("app_builder"));
  if (byTask) return byTask;
  // 3. Try general
  const general = allConfigs.find((c: any) => c._useFor?.includes("general"));
  if (general) return general;
  // 4. Fallback to first active
  return allConfigs[0];
}

async function callGemini(apiKey: string, model: string, systemPrompt: string, userPrompt: string, tool: any): Promise<Response> {
  // Gemini uses its own REST API format
  const geminiModel = model.startsWith("gemini-") ? model : "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`;
  
  const body = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    tools: [{
      functionDeclarations: [{
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      }],
    }],
    toolConfig: { functionCallingConfig: { mode: "ANY", allowedFunctionNames: [tool.name] } },
  };

  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function parseGeminiResponse(data: any): { toolName: string; args: any } | null {
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!parts) return null;
  const fnCall = parts.find((p: any) => p.functionCall);
  if (!fnCall) return null;
  return { toolName: fnCall.functionCall.name, args: fnCall.functionCall.args };
}

async function callAnthropic(apiKey: string, model: string, systemPrompt: string, userPrompt: string, tool: any): Promise<Response> {
  const url = "https://api.anthropic.com/v1/messages";
  const body = {
    model: model || "claude-sonnet-4-20250514",
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
    tools: [{
      name: tool.name,
      description: tool.description,
      input_schema: tool.parameters,
    }],
    tool_choice: { type: "tool", name: tool.name },
  };

  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });
}

function parseAnthropicResponse(data: any): { toolName: string; args: any } | null {
  const toolBlock = data?.content?.find((b: any) => b.type === "tool_use");
  if (!toolBlock) return null;
  return { toolName: toolBlock.name, args: toolBlock.input };
}

async function callOpenAI(endpoint: string, apiKey: string, model: string, systemPrompt: string, userPrompt: string, tool: any): Promise<Response> {
  const url = endpoint.endsWith("/chat/completions") ? endpoint : `${endpoint}/chat/completions`;
  const body = {
    model: model || "gpt-5",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    tools: [{ type: "function", function: { name: tool.name, description: tool.description, parameters: tool.parameters } }],
    tool_choice: { type: "function", function: { name: tool.name } },
  };

  return fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function parseOpenAIResponse(data: any): { toolName: string; args: any } | null {
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) return null;
  return { toolName: toolCall.function.name, args: JSON.parse(toolCall.function.arguments) };
}

async function runAgent(
  agentName: AgentName,
  userPrompt: string,
  context: Record<string, unknown>,
  allConfigs: UserApiConfig[]
): Promise<{ success: boolean; data?: unknown; error?: string; agentName: string }> {
  const agent = AGENT_CONFIGS[agentName];
  const config = pickApiConfig(agentName, allConfigs);

  if (!config) {
    return { success: false, error: "No API key configured for this agent. Please add your API key in Settings → AI Integrations.", agentName: agent.name };
  }

  const contextEntries = Object.entries(context);
  let contextStr = "";
  for (const [k, v] of contextEntries) {
    const json = JSON.stringify(v, null, 2);
    contextStr += `## ${k}\n${json.length > 4000 ? json.slice(0, 4000) + "\n...(truncated)" : json}\n\n`;
  }

  const fullPrompt = contextStr
    ? `User Request: "${userPrompt}"\n\n--- Previous Agent Outputs ---\n${contextStr}`
    : `User Request: "${userPrompt}"`;

  try {
    console.log(`Agent ${agent.name}: using ${config.provider}/${config.model}`);
    
    let response: Response;
    let parsed: { toolName: string; args: any } | null = null;

    if (config.provider === "gemini") {
      response = await callGemini(config.apiKey, config.model, agent.system, fullPrompt, agent.tool);
      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        console.error(`Agent ${agent.name} (Gemini) failed: HTTP ${response.status} — ${errText}`);
        if (response.status === 429) return { success: false, error: "Rate limit exceeded. Please try again shortly.", agentName: agent.name };
        return { success: false, error: `Agent ${agent.name} failed: HTTP ${response.status}`, agentName: agent.name };
      }
      const data = await response.json();
      parsed = parseGeminiResponse(data);
    } else if (config.provider === "anthropic") {
      response = await callAnthropic(config.apiKey, config.model, agent.system, fullPrompt, agent.tool);
      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        console.error(`Agent ${agent.name} (Anthropic) failed: HTTP ${response.status} — ${errText}`);
        if (response.status === 429) return { success: false, error: "Rate limit exceeded. Please try again shortly.", agentName: agent.name };
        return { success: false, error: `Agent ${agent.name} failed: HTTP ${response.status}`, agentName: agent.name };
      }
      const data = await response.json();
      parsed = parseAnthropicResponse(data);
    } else {
      // OpenAI or OpenAI-compatible
      response = await callOpenAI(config.endpoint, config.apiKey, config.model, agent.system, fullPrompt, agent.tool);
      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        console.error(`Agent ${agent.name} (OpenAI) failed: HTTP ${response.status} — ${errText}`);
        if (response.status === 429) return { success: false, error: "Rate limit exceeded. Please try again shortly.", agentName: agent.name };
        if (response.status === 402) return { success: false, error: "AI credits exhausted.", agentName: agent.name };
        return { success: false, error: `Agent ${agent.name} failed: HTTP ${response.status}`, agentName: agent.name };
      }
      const data = await response.json();
      parsed = parseOpenAIResponse(data);
    }

    if (!parsed) return { success: false, error: `Agent ${agent.name} did not return structured output`, agentName: agent.name };

    return { success: true, data: parsed.args, agentName: agent.name };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error", agentName: agent.name };
  }
}

const PIPELINE: { key: AgentName; fatal: boolean }[] = [
  { key: "requirements", fatal: true },
  { key: "product_manager", fatal: false },
  { key: "planner", fatal: true },
  { key: "architect", fatal: false },
  { key: "database", fatal: true },
  { key: "backend", fatal: false },
  { key: "uiux", fatal: true },
  { key: "copywriter", fatal: false },
  { key: "testing", fatal: false },
  { key: "debugger", fatal: false },
  { key: "ui_reviewer", fatal: false },
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

    // Fetch ALL user API keys from site_settings for per-agent routing
    let allApiConfigs: (UserApiConfig & { _useFor: string[] })[] = [];
    try {
      const authHeader = req.headers.get("authorization");
      if (authHeader) {
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
        const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
        const settingsRes = await fetch(
          `${SUPABASE_URL}/rest/v1/site_settings?key=eq.ai_integrations&select=value`,
          { headers: { Authorization: authHeader, apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" } }
        );
        if (settingsRes.ok) {
          const rows = await settingsRes.json();
          const items = rows?.[0]?.value?.items?.filter((i: any) => i.status === "active" && i.apiKey?.length > 5) || [];
          allApiConfigs = items.map((i: any) => ({
            provider: i.provider,
            endpoint: i.apiEndpoint,
            apiKey: i.apiKey,
            model: i.model,
            _useFor: i.useFor || [],
          }));
          console.log(`Loaded ${allApiConfigs.length} API configs for per-agent routing`);
        }
      }
    } catch (e) {
      console.log("Could not fetch user API configs (non-fatal):", e);
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ event, data })}\n\n`));
        };

        const agentLog: unknown[] = [];
        const context: Record<string, unknown> = {};
        const totalAgents = PIPELINE.length;

        const CONTEXT_KEYS: Record<string, string> = {
          requirements: "requirements",
          product_manager: "product_definition",
          planner: "task_plan",
          architect: "system_architecture",
          database: "database_design",
          backend: "backend_design",
          uiux: "ui_design",
          copywriter: "copywriter_output",
          testing: "test_plan",
          debugger: "debug_analysis",
          ui_reviewer: "ui_review",
          reviewer: "quality_review",
        };

        for (let i = 0; i < PIPELINE.length; i++) {
          const { key, fatal } = PIPELINE[i];
          const agent = AGENT_CONFIGS[key];
          const step = i + 1;

          send("agent_start", { agent: agent.name, step, total: totalAgents });

          const result = await runAgent(key, prompt, context, allApiConfigs as any);
          agentLog.push({ agent: key, ...result });

          if (!result.success) {
            send("agent_error", { agent: agent.name, step, error: result.error });
            if (fatal) {
              send("pipeline_complete", { success: false, error: `${agent.name} failed: ${result.error}` });
              controller.close();
              return;
            }
            send("agent_done", { agent: agent.name, step, data: {}, skipped: true });
          } else {
            context[CONTEXT_KEYS[key]] = result.data;
            send("agent_done", { agent: agent.name, step, data: result.data });
          }

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
        const copy_data = (context.copywriter_output || {}) as any;
        const test_data = (context.test_plan || {}) as any;
        const debug_data = (context.debug_analysis || {}) as any;
        const ui_review_data = (context.ui_review || {}) as any;
        const review_data = (context.quality_review || { scores: {}, issues: [], improvements: [], verdict: "pass" }) as any;

        // Merge copywriter output into pages (update component props with polished copy)
        let finalPages = ui_data.pages || [];
        if (copy_data.page_copy && Array.isArray(copy_data.page_copy)) {
          finalPages = finalPages.map((page: any) => {
            const copyPage = copy_data.page_copy.find((cp: any) => cp.page_name === page.name);
            if (!copyPage) return page;
            const updatedComponents = page.components.map((comp: any) => {
              const copyComp = copyPage.components.find((cc: any) => cc.type === comp.type);
              if (!copyComp) return comp;
              return { ...comp, props: { ...comp.props, ...copyComp.updated_props } };
            });
            return { ...page, components: updatedComponents };
          });
        }

        const finalConfig = {
          project_type: req_data.project_type,
          title: req_data.title,
          description: req_data.description,
          modules: req_data.modules || [],
          roles: req_data.roles || [],
          features: req_data.features || [],
          pages: finalPages,
          collections: db_data.collections || [],
          style: ui_data.style || {},
          // Copywriter data
          brand_voice: copy_data.brand_voice || "",
          tagline: copy_data.tagline || "",
          // UI Review data
          ui_review_score: ui_review_data.ui_score || 0,
          ui_review_checks: ui_review_data.checks || [],
          ui_review_verdict: ui_review_data.overall_verdict || "",
          // Extended multi-agent data
          requirements: req_data.functional_requirements || [],
          non_functional_requirements: req_data.non_functional_requirements || [],
          default_admin_credentials: req_data.default_admin_credentials || { email: "admin@admin.com", password: "admin123" },
          workflows: prod_data.workflows || [],
          business_rules: prod_data.business_rules || [],
          permission_matrix: prod_data.permission_matrix || [],
          notification_triggers: prod_data.notification_triggers || [],
          installer_steps: prod_data.installer_steps || [],
          task_plan: plan_data.tasks || [],
          suggestions: plan_data.suggestions || [],
          documentation_plan: plan_data.documentation_plan || ["README.md", "INSTALL.md", "API.md", "DB_SCHEMA.md"],
          folder_structure: sys_data.folder_structure || {},
          services: sys_data.services || [],
          env_variables: sys_data.env_variables || [],
          plugin_hooks: sys_data.plugin_hooks || [],
          seed_data: db_data.seed_data || test_data.seed_data || [],
          prisma_schema_hint: db_data.prisma_schema_hint || "",
          api_endpoints: api_data.api_endpoints || [],
          webhooks: api_data.webhooks || [],
          edge_functions: api_data.edge_functions || [],
          middleware_stack: api_data.middleware_stack || [],
          reusable_components: ui_data.reusable_components || [],
          test_scenarios: test_data.test_scenarios || [],
          coverage_targets: test_data.coverage_targets || {},
          bugs: debug_data.bugs || [],
          auto_fixes: debug_data.auto_fixes || [],
          risk_score: debug_data.risk_score || 0,
          error_fix_memory: debug_data.error_fix_memory || [],
          quality_score: review_data.scores || {},
          quality_issues: review_data.issues || [],
          quality_improvements: review_data.improvements || [],
          quality_verdict: review_data.verdict || "pass",
          documentation_checklist: review_data.documentation_checklist || {},
          security_checklist: review_data.security_checklist || {},
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
    console.error("12-agent pipeline error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
