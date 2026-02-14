import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function getUserApiConfig(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return null;
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/site_settings?key=eq.ai_integrations&select=value`,
      { headers: { Authorization: authHeader, apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" } }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    const active = rows?.[0]?.value?.items?.find((i: any) => i.status === "active" && i.apiKey?.length > 5);
    if (!active) return null;
    return { provider: active.provider, endpoint: active.apiEndpoint, apiKey: active.apiKey, model: active.model };
  } catch { return null; }
}

async function aiRequest(url: string, headers: Record<string, string>, body: string, userApiConfig: any) {
  let response = await fetch(url, { method: "POST", headers, body });
  
  if (response.status === 402 && userApiConfig) {
    console.log("Lovable credits exhausted, falling back to user API key");
    await response.text();
    const parsed = JSON.parse(body);
    parsed.model = userApiConfig.model;
    const fallbackEndpoint = userApiConfig.endpoint.endsWith("/chat/completions")
      ? userApiConfig.endpoint : `${userApiConfig.endpoint}/chat/completions`;
    response = await fetch(fallbackEndpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${userApiConfig.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    });
  }
  return response;
}

const SYSTEM_PROMPT = `You are RyaanCMS AI Builder — a structured Application Generation Engine.

You do NOT generate raw code. You generate structured JSON configurations that the RyaanCMS engine uses to build applications.

When a user describes what they want to build, you MUST respond by calling the "generate_app_config" tool with a complete structured configuration.

Rules:
- Always identify the project_type (landing, blog, saas, ecommerce, portfolio, dashboard, marketplace, custom)
- Always identify required modules from: auth, blog, ecommerce, crm, analytics, payments, media, forms, api, marketplace, notifications, search
- Always identify user roles needed
- Always identify features needed
- Generate a complete page layout with components from the registry
- Generate database schema as structured collections
- Be thorough but realistic — only include what the user actually needs
- For each page, select components from: hero, navbar, footer, sidebar, crud_table, form, chart, card_grid, stats_row, auth_form, pricing_table, media_gallery, search_bar, notification_center, rich_text_editor, file_upload, calendar, kanban_board, timeline, map
- For each component, provide sensible default props`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, mode } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const userApiConfig = await getUserApiConfig(req);

    const tools = [
      {
        type: "function",
        function: {
          name: "generate_app_config",
          description: "Generate a complete structured application configuration from the user's requirements.",
          parameters: {
            type: "object",
            properties: {
              project_type: {
                type: "string",
                enum: ["landing", "blog", "saas", "ecommerce", "portfolio", "dashboard", "marketplace", "custom"],
                description: "The type of application to generate"
              },
              title: { type: "string", description: "A short title for the project" },
              description: { type: "string", description: "Brief description of what this app does" },
              modules: {
                type: "array",
                items: { type: "string", enum: ["auth", "blog", "ecommerce", "crm", "analytics", "payments", "media", "forms", "api", "marketplace", "notifications", "search"] },
                description: "Required modules"
              },
              roles: {
                type: "array",
                items: {
                  type: "object",
                  properties: { name: { type: "string" }, permissions: { type: "array", items: { type: "string" } } },
                  required: ["name", "permissions"], additionalProperties: false
                },
                description: "User roles and their permissions"
              },
              features: { type: "array", items: { type: "string" }, description: "Key features" },
              pages: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    route: { type: "string" },
                    layout: { type: "string", enum: ["public", "dashboard", "auth", "fullscreen"] },
                    components: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          type: { type: "string", enum: ["hero", "navbar", "footer", "sidebar", "crud_table", "form", "chart", "card_grid", "stats_row", "auth_form", "pricing_table", "media_gallery", "search_bar", "notification_center", "rich_text_editor", "file_upload", "calendar", "kanban_board", "timeline", "map"] },
                          props: { type: "object", description: "Component configuration props" }
                        },
                        required: ["type"], additionalProperties: false
                      }
                    }
                  },
                  required: ["name", "route", "layout", "components"], additionalProperties: false
                }
              },
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
                          default: { type: "string" }
                        },
                        required: ["name", "type"], additionalProperties: false
                      }
                    },
                    rls: { type: "boolean", description: "Enable row-level security" }
                  },
                  required: ["name", "fields"], additionalProperties: false
                },
                description: "Database collections/tables"
              },
              style: {
                type: "object",
                properties: {
                  primary_color: { type: "string" },
                  theme: { type: "string", enum: ["light", "dark", "auto"] },
                  font: { type: "string" },
                  border_radius: { type: "string", enum: ["none", "sm", "md", "lg", "full"] }
                },
                additionalProperties: false
              }
            },
            required: ["project_type", "title", "description", "modules", "pages", "collections"],
            additionalProperties: false
          }
        }
      }
    ];

    const requestBody = JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      tools,
      tool_choice: { type: "function", function: { name: "generate_app_config" } },
    });

    const response = await aiRequest(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      requestBody,
      userApiConfig
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please configure your own API key in Settings → AI Integrations." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("AI did not return structured config");

    const config = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ success: true, config }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("AI Builder error:", error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
