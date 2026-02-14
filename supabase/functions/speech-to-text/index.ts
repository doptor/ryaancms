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

    // Use Gemini for audio transcription
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
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
              {
                type: "text",
                text: "Transcribe this audio to text.",
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Transcription failed:", response.status, errText);
      throw new Error("Transcription failed");
    }

    const data = await response.json();
    const transcript = data.choices?.[0]?.message?.content?.trim() || "";

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
