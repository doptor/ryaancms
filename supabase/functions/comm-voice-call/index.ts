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

    const TWILIO_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const TWILIO_FROM = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM) {
      throw new Error("Twilio credentials not configured. Please add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER secrets.");
    }

    const twilioAuth = btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`);

    switch (action) {
      case "start-call": {
        const { to_number, contact_id, script_id, call_type, twiml } = payload;
        if (!to_number) throw new Error("to_number is required");

        // Default TwiML or custom
        const callTwiml = twiml || `<Response><Say voice="alice">Hello, this is an automated call from your communication system. Thank you for your time.</Say></Response>`;

        const params = new URLSearchParams({
          To: to_number,
          From: TWILIO_FROM,
          Twiml: callTwiml,
        });

        const twilioRes = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Calls.json`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${twilioAuth}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
          }
        );

        const twilioData = await twilioRes.json();
        if (!twilioRes.ok) throw new Error(twilioData.message || "Twilio call failed");

        // Save call record
        const { data: callRecord } = await supabase.from("comm_calls").insert({
          user_id: user.id,
          contact_id: contact_id || null,
          script_id: script_id || null,
          call_type: call_type || "ai_automated",
          direction: "outbound",
          status: "initiated",
          from_number: TWILIO_FROM,
          to_number,
          provider: "twilio",
          provider_call_id: twilioData.sid,
          started_at: new Date().toISOString(),
        }).select().single();

        return new Response(JSON.stringify({ success: true, call: callRecord, twilio: { sid: twilioData.sid, status: twilioData.status } }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get-call-status": {
        const { call_sid } = payload;
        if (!call_sid) throw new Error("call_sid is required");

        const res = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Calls/${call_sid}.json`,
          { headers: { Authorization: `Basic ${twilioAuth}` } }
        );
        const data = await res.json();

        return new Response(JSON.stringify({ success: true, status: data.status, duration: data.duration }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "end-call": {
        const { call_sid, call_id } = payload;
        if (!call_sid) throw new Error("call_sid is required");

        await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Calls/${call_sid}.json`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${twilioAuth}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: "Status=completed",
          }
        );

        if (call_id) {
          await supabase.from("comm_calls").update({
            status: "completed",
            ended_at: new Date().toISOString(),
          }).eq("id", call_id);
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "list-recordings": {
        const { call_sid } = payload;
        const url = call_sid
          ? `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Calls/${call_sid}/Recordings.json`
          : `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Recordings.json?PageSize=20`;

        const res = await fetch(url, { headers: { Authorization: `Basic ${twilioAuth}` } });
        const data = await res.json();

        return new Response(JSON.stringify({ success: true, recordings: data.recordings || [] }), {
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
