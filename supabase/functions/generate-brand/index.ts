import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { prompt, projectId } = await req.json();

    const userApiConfig = await getUserApiConfig(req, "branding");
    if (!userApiConfig) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "No API key configured. Please add your own API key in Settings → AI Integrations.",
        brandName: "AppX", 
        logoUrl: null 
      }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Step 1: Generate brand name using user's API
    const userEndpoint = userApiConfig.endpoint.endsWith("/chat/completions")
      ? userApiConfig.endpoint : `${userApiConfig.endpoint}/chat/completions`;

    const nameResponse = await fetch(userEndpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${userApiConfig.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: userApiConfig.model || "gpt-5",
        messages: [
          { role: "system", content: "You are a brand naming expert. Given a project description, generate exactly ONE creative, catchy, memorable brand name. Rules: 1) Must be a single word, 2) 4-8 characters, 3) Easy to pronounce, 4) Modern and tech-friendly, 5) No existing major brand names. Respond with ONLY the brand name, nothing else." },
          { role: "user", content: `Project: ${prompt}` }
        ],
      }),
    });

    if (!nameResponse.ok) {
      const errText = await nameResponse.text();
      console.error("Name generation failed:", nameResponse.status, errText);
      throw new Error("Brand name generation failed");
    }

    const nameData = await nameResponse.json();
    const brandName = (nameData.choices?.[0]?.message?.content || "AppX").trim().split(/\s+/)[0].replace(/[^a-zA-Z0-9]/g, "");

    // Logo generation is skipped — it required Lovable AI Gateway image generation
    // Users can upload their own logo via project settings
    let logoUrl = null;

    // Step 2: Update project
    if (projectId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from("projects").update({ brand_name: brandName, logo_url: logoUrl }).eq("id", projectId);
      } catch (e) { console.error("Project update failed:", e); }
    }

    return new Response(JSON.stringify({ success: true, brandName, logoUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-brand error:", e);
    return new Response(JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Unknown error", brandName: "AppX", logoUrl: null }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
