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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, projectId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const userApiConfig = await getUserApiConfig(req, "branding");

    // Step 1: Generate brand name
    const nameResponse = await aiRequest(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "You are a brand naming expert. Given a project description, generate exactly ONE creative, catchy, memorable brand name. Rules: 1) Must be a single word, 2) 4-8 characters, 3) Easy to pronounce, 4) Modern and tech-friendly, 5) No existing major brand names. Respond with ONLY the brand name, nothing else." },
          { role: "user", content: `Project: ${prompt}` }
        ],
      }),
      userApiConfig
    );

    if (!nameResponse.ok) {
      const errText = await nameResponse.text();
      console.error("Name generation failed:", nameResponse.status, errText);
      throw new Error("Brand name generation failed");
    }

    const nameData = await nameResponse.json();
    const brandName = (nameData.choices?.[0]?.message?.content || "AppX").trim().split(/\s+/)[0].replace(/[^a-zA-Z0-9]/g, "");

    // Step 2: Generate logo (only via Lovable gateway since it needs image generation)
    let logoUrl = null;
    const logoResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          { role: "user", content: `Create a minimalist, modern app logo icon for a brand called "${brandName}". The logo should be: a simple geometric shape or abstract symbol, flat design with a single vibrant color on white background, professional and clean, suitable for a ${prompt.slice(0, 100)} application. Square format, no text, no words, just the icon symbol.` }
        ],
        modalities: ["image", "text"],
      }),
    });

    if (logoResponse.ok) {
      const logoData = await logoResponse.json();
      const imageData = logoData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (imageData && projectId) {
        try {
          const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
          const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
          const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
          const supabase = createClient(supabaseUrl, supabaseKey);
          const fileName = `${projectId}/logo.png`;
          const { error: uploadError } = await supabase.storage.from("project-logos").upload(fileName, binaryData, { contentType: "image/png", upsert: true });
          if (!uploadError) {
            const { data: urlData } = supabase.storage.from("project-logos").getPublicUrl(fileName);
            logoUrl = urlData.publicUrl;
          } else { console.error("Upload error:", uploadError); }
        } catch (e) { console.error("Logo upload failed:", e); }
      }
    } else { console.error("Logo generation failed:", logoResponse.status); }

    // Step 3: Update project
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
