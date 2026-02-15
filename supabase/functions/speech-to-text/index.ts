import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;
    if (!audioFile) throw new Error("No audio file provided");

    // Fetch user's own API keys from site_settings
    let userApiConfig: { provider: string; endpoint: string; apiKey: string; model: string } | null = null;
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
          const byTask = items.find((i: any) => i.useFor?.includes("speech_to_text"));
          const general = items.find((i: any) => i.useFor?.includes("general"));
          const pick = byTask || general || items[0];
          if (pick) {
            userApiConfig = { provider: pick.provider, endpoint: pick.apiEndpoint, apiKey: pick.apiKey, model: pick.model };
          }
        }
      }
    } catch (e) {
      console.log("Could not fetch user API config (non-fatal):", e);
    }

    if (!userApiConfig) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "No API key configured. Please add your own API key in Settings → AI Integrations.", 
        transcript: "" 
      }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use user's own API key
    console.log(`Using user's ${userApiConfig.provider} API key for speech-to-text`);
    
    if (userApiConfig.provider === "openai") {
      // Use Whisper API for OpenAI
      const whisperForm = new FormData();
      whisperForm.append("file", audioFile, "recording.webm");
      whisperForm.append("model", "whisper-1");
      const whisperEndpoint = userApiConfig.endpoint.endsWith("/v1")
        ? `${userApiConfig.endpoint}/audio/transcriptions`
        : `${userApiConfig.endpoint}/v1/audio/transcriptions`;
      const response = await fetch(whisperEndpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${userApiConfig.apiKey}` },
        body: whisperForm,
      });
      if (response.ok) {
        const whisperData = await response.json();
        return new Response(JSON.stringify({ success: true, transcript: whisperData.text || "" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error(`Whisper API failed (${response.status}):`, errText);
      throw new Error(`Speech-to-text failed: ${response.status}`);
    } else {
      // For other providers, try chat completions with audio
      const arrayBuffer = await audioFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
      }
      const base64Audio = btoa(binary);
      const mimeType = audioFile.type || "audio/webm";

      const fallbackEndpoint = userApiConfig.endpoint.endsWith("/chat/completions")
        ? userApiConfig.endpoint : `${userApiConfig.endpoint}/chat/completions`;
      const response = await fetch(fallbackEndpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${userApiConfig.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: userApiConfig.model,
          messages: [
            {
              role: "system",
              content: "You are a speech-to-text transcriber. Listen to the audio and transcribe it accurately in the SAME language that is spoken. If the speaker speaks Bangla, transcribe in Bangla. If English, transcribe in English. Preserve the original language. Return ONLY the transcribed text, nothing else.",
            },
            {
              role: "user",
              content: [
                {
                  type: "input_audio",
                  input_audio: {
                    data: base64Audio,
                    format: mimeType.includes("webm") ? "webm" : mimeType.includes("mp4") ? "mp4" : "wav",
                  },
                },
                { type: "text", text: "Transcribe this audio to text in its original spoken language. Do NOT translate." },
              ],
            },
          ],
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const transcript = data.choices?.[0]?.message?.content?.trim() || "";
        return new Response(JSON.stringify({ success: true, transcript }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error(`User API failed (${response.status}):`, errText);
      throw new Error(`Speech-to-text failed: ${response.status}`);
    }
  } catch (e) {
    console.error("speech-to-text error:", e);
    return new Response(JSON.stringify({
      success: false,
      error: e instanceof Error ? e.message : "Unknown error",
      transcript: "",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
