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

  // Twilio webhook for call status updates
  try {
    const contentType = req.headers.get("content-type") || "";
    let callSid: string | null = null;
    let callStatus: string | null = null;
    let callDuration: string | null = null;
    let recordingUrl: string | null = null;

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      callSid = formData.get("CallSid") as string;
      callStatus = formData.get("CallStatus") as string;
      callDuration = formData.get("CallDuration") as string;
      recordingUrl = formData.get("RecordingUrl") as string;
    } else {
      const body = await req.json();
      callSid = body.CallSid;
      callStatus = body.CallStatus;
      callDuration = body.CallDuration;
      recordingUrl = body.RecordingUrl;
    }

    if (!callSid) {
      return new Response(JSON.stringify({ error: "No CallSid" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const updates: Record<string, any> = {};

    // Map Twilio statuses to our statuses
    const statusMap: Record<string, string> = {
      queued: "initiated",
      ringing: "ringing",
      "in-progress": "in_progress",
      completed: "completed",
      busy: "busy",
      "no-answer": "no_answer",
      canceled: "failed",
      failed: "failed",
    };

    if (callStatus) updates.status = statusMap[callStatus] || callStatus;
    if (callDuration) updates.duration = parseInt(callDuration);
    if (recordingUrl) updates.recording_url = recordingUrl;
    if (callStatus === "completed" || callStatus === "busy" || callStatus === "no-answer" || callStatus === "failed") {
      updates.ended_at = new Date().toISOString();
    }
    if (callStatus === "in-progress") {
      updates.answered_at = new Date().toISOString();
    }

    await supabase.from("comm_calls")
      .update(updates)
      .eq("provider_call_id", callSid);

    // Return TwiML empty response for Twilio
    return new Response("<Response></Response>", {
      headers: { ...corsHeaders, "Content-Type": "application/xml" },
    });
  } catch (error) {
    console.error("Call webhook error:", error);
    return new Response("<Response></Response>", {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/xml" },
    });
  }
});
