import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function getUserApiConfig(req: Request, taskType = "general") {
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
    const items = rows?.[0]?.value?.items?.filter((i: any) => i.status === "active" && i.apiKey?.length > 5) || [];
    const byTask = items.find((i: any) => i.useFor?.includes(taskType));
    if (byTask) return { provider: byTask.provider, endpoint: byTask.apiEndpoint, apiKey: byTask.apiKey, model: byTask.model };
    const general = items.find((i: any) => i.useFor?.includes("general"));
    if (general) return { provider: general.provider, endpoint: general.apiEndpoint, apiKey: general.apiKey, model: general.model };
    const any = items[0];
    if (any) return { provider: any.provider, endpoint: any.apiEndpoint, apiKey: any.apiKey, model: any.model };
    return null;
  } catch { return null; }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt } = await req.json();

    const userApiConfig = await getUserApiConfig(req, "content");
    if (!userApiConfig) {
      // Return empty title gracefully — title generation is non-critical
      return new Response(JSON.stringify({ title: "" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const parsed = {
      model: userApiConfig.model || "gpt-5",
      messages: [
        { role: "system", content: `You are a project naming assistant. Given a user prompt describing what they want to build, return ONLY a short project name (1-3 words max). Rules:\n- Remove filler words like "professional", "modern", "beautiful", "amazing", "simple"\n- Keep only the core identity (e.g. "Freelancer Portfolio" → "Freelancer", "E-commerce Store for Shoes" → "ShoeStore")\n- If it's a specific brand/product name, keep it\n- No quotes, no explanation, just the name\n- CamelCase or single word preferred` },
        { role: "user", content: prompt }
      ],
    };

    const userEndpoint = userApiConfig.endpoint.endsWith("/chat/completions")
      ? userApiConfig.endpoint : `${userApiConfig.endpoint}/chat/completions`;

    const response = await fetch(userEndpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${userApiConfig.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    });

    if (!response.ok) {
      console.error("AI error:", response.status);
      return new Response(JSON.stringify({ title: "" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const title = data.choices?.[0]?.message?.content?.trim() || "";

    return new Response(JSON.stringify({ title }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-title error:", e);
    return new Response(JSON.stringify({ title: "" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
