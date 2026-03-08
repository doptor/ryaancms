import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authErr || !user) throw new Error("Unauthorized");

    const { action, ...payload } = await req.json();

    switch (action) {
      case "generate-voice": {
        const { text, voice_id } = payload;
        if (!text) throw new Error("text is required");

        const ELEVENLABS_KEY = Deno.env.get("ELEVENLABS_API_KEY");
        if (!ELEVENLABS_KEY) throw new Error("ELEVENLABS_API_KEY not configured");

        const vid = voice_id || "EXAVITQu4vr4xnSDxMaL"; // Default Rachel voice

        const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${vid}`, {
          method: "POST",
          headers: {
            "xi-api-key": ELEVENLABS_KEY,
            "Content-Type": "application/json",
            Accept: "audio/mpeg",
          },
          body: JSON.stringify({
            text,
            model_id: "eleven_multilingual_v2",
            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          }),
        });

        if (!res.ok) {
          const err = await res.text();
          throw new Error(`ElevenLabs error: ${err}`);
        }

        const audioBuffer = await res.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

        return new Response(JSON.stringify({ success: true, audio_base64: base64, content_type: "audio/mpeg" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "transcribe": {
        const { audio_url } = payload;
        if (!audio_url) throw new Error("audio_url is required");

        // Use Lovable AI for transcription via Whisper-compatible endpoint
        const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY");
        if (!OPENAI_KEY) throw new Error("OPENAI_API_KEY not configured for transcription");

        // Fetch audio
        const audioRes = await fetch(audio_url);
        if (!audioRes.ok) throw new Error("Failed to fetch audio");
        const audioBlob = await audioRes.blob();

        const formData = new FormData();
        formData.append("file", audioBlob, "audio.mp3");
        formData.append("model", "whisper-1");

        const transcribeRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${OPENAI_KEY}` },
          body: formData,
        });

        const transcription = await transcribeRes.json();
        if (!transcribeRes.ok) throw new Error(transcription.error?.message || "Transcription failed");

        return new Response(JSON.stringify({ success: true, text: transcription.text }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "ai-conversation": {
        const { message, context, language, script_steps } = payload;
        if (!message) throw new Error("message is required");

        // Use Lovable AI for conversation
        const systemPrompt = `You are an AI voice assistant for a business communication system.
${context ? `Context: ${context}` : ""}
${language ? `Respond in: ${language}` : "Respond in the same language as the user."}
${script_steps ? `Follow this conversation script: ${JSON.stringify(script_steps)}` : ""}
Be concise, professional, and helpful. Keep responses under 3 sentences for voice delivery.`;

        const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: message },
            ],
            max_tokens: 200,
          }),
        });

        const aiData = await aiRes.json();
        if (!aiRes.ok) throw new Error(aiData.error?.message || "AI conversation failed");

        const reply = aiData.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that.";

        return new Response(JSON.stringify({ success: true, reply }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "list-voices": {
        const ELEVENLABS_KEY = Deno.env.get("ELEVENLABS_API_KEY");
        if (!ELEVENLABS_KEY) throw new Error("ELEVENLABS_API_KEY not configured");

        const res = await fetch("https://api.elevenlabs.io/v1/voices", {
          headers: { "xi-api-key": ELEVENLABS_KEY },
        });
        const data = await res.json();

        return new Response(JSON.stringify({ success: true, voices: data.voices || [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
