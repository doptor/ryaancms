import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;
    if (!audioFile) throw new Error("No audio file provided");

    // Convert audio to base64 (chunk-safe for large files)
    const arrayBuffer = await audioFile.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    const base64Audio = btoa(binary);
    const mimeType = audioFile.type || "audio/webm";

    // Fetch user's own API keys from site_settings for fallback
    let userApiConfig: { provider: string; endpoint: string; apiKey: string; model: string } | null = null;
    try {
      const authHeader = req.headers.get("authorization");
      if (authHeader) {
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
        const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
        const settingsRes = await fetch(
          `${SUPABASE_URL}/rest/v1/site_settings?key=eq.ai_integrations&select=value`,
          {
            headers: {
              Authorization: authHeader,
              apikey: SUPABASE_ANON_KEY,
              "Content-Type": "application/json",
            },
          }
        );
        if (settingsRes.ok) {
          const rows = await settingsRes.json();
          if (rows?.[0]?.value?.items) {
            const active = rows[0].value.items.find(
              (i: any) => i.status === "active" && i.apiKey && i.apiKey.length > 5
            );
            if (active) {
              userApiConfig = {
                provider: active.provider,
                endpoint: active.apiEndpoint,
                apiKey: active.apiKey,
                model: active.model,
              };
            }
          }
        }
      }
    } catch (e) {
      console.log("Could not fetch user API config (non-fatal):", e);
    }

    const geminiBody = JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [
        {
          role: "system",
          content: "You are a speech-to-text transcriber. Listen to the audio and transcribe it accurately. Return ONLY the transcribed text, nothing else. If you cannot understand the audio, return an empty string.",
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
            { type: "text", text: "Transcribe this audio to text." },
          ],
        },
      ],
    });

    // Try Lovable AI Gateway first
    let response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: geminiBody,
    });

    // If 402 (credits exhausted), fallback to user's own API key
    if (response.status === 402 && userApiConfig) {
      console.log(`Lovable AI credits exhausted, falling back to user's ${userApiConfig.provider} key`);
      await response.text(); // consume body

      // For OpenAI Whisper-compatible providers, use /audio/transcriptions
      if (userApiConfig.provider === "openai") {
        const whisperForm = new FormData();
        whisperForm.append("file", audioFile, "recording.webm");
        whisperForm.append("model", "whisper-1");

        const whisperEndpoint = userApiConfig.endpoint.endsWith("/v1")
          ? `${userApiConfig.endpoint}/audio/transcriptions`
          : `${userApiConfig.endpoint}/v1/audio/transcriptions`;

        response = await fetch(whisperEndpoint, {
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
      } else {
        // For other providers, try chat completions with the audio
        const fallbackBody = JSON.stringify({
          ...JSON.parse(geminiBody),
          model: userApiConfig.model,
        });
        const fallbackEndpoint = userApiConfig.endpoint.endsWith("/chat/completions")
          ? userApiConfig.endpoint
          : `${userApiConfig.endpoint}/chat/completions`;

        response = await fetch(fallbackEndpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${userApiConfig.apiKey}`,
            "Content-Type": "application/json",
          },
          body: fallbackBody,
        });
      }
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error("Transcription failed:", response.status, errText);
      if (response.status === 402) {
        return new Response(JSON.stringify({ success: false, error: "no_credits", transcript: "" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Transcription failed");
    }

    const data = await response.json();
    const transcript = data.choices?.[0]?.message?.content?.trim() || data.text || "";

    return new Response(JSON.stringify({ success: true, transcript }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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
