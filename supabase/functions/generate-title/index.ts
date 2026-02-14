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

async function aiRequest(url: string, headers: Record<string, string>, body: string, userApiConfig: any) {
  if (userApiConfig) {
    console.log(`Using user's ${userApiConfig.provider} API key as primary`);
    const parsed = JSON.parse(body);
    parsed.model = userApiConfig.model || "gpt-5";
    const userEndpoint = userApiConfig.endpoint.endsWith("/chat/completions")
      ? userApiConfig.endpoint : `${userApiConfig.endpoint}/chat/completions`;
    const userResponse = await fetch(userEndpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${userApiConfig.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    });
    if (userResponse.ok) return userResponse;
    console.log(`User API failed (${userResponse.status}), falling back to Lovable AI`);
    await userResponse.text();
  }
  return await fetch(url, { method: "POST", headers, body });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const userApiConfig = await getUserApiConfig(req, "content");

    const response = await aiRequest(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: `You are a project naming assistant. Given a user prompt describing what they want to build, return ONLY a short project name (1-3 words max). Rules:\n- Remove filler words like "professional", "modern", "beautiful", "amazing", "simple"\n- Keep only the core identity (e.g. "Freelancer Portfolio" → "Freelancer", "E-commerce Store for Shoes" → "ShoeStore")\n- If it's a specific brand/product name, keep it\n- No quotes, no explanation, just the name\n- CamelCase or single word preferred` },
          { role: "user", content: prompt }
        ],
      }),
      userApiConfig
    );

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI request failed");
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
