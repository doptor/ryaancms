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
      case "start-campaign": {
        const { campaign_id } = payload;
        if (!campaign_id) throw new Error("campaign_id is required");

        // Get campaign
        const { data: campaign, error: campErr } = await supabase
          .from("comm_campaigns").select("*, comm_scripts(*)").eq("id", campaign_id).single();
        if (campErr || !campaign) throw new Error("Campaign not found");

        // Get contacts based on filter
        let contactsQuery = supabase.from("comm_contacts").select("*").eq("user_id", user.id).eq("is_active", true);
        
        if (campaign.contact_filter) {
          const filter = campaign.contact_filter as Record<string, any>;
          if (filter.tags?.length) {
            contactsQuery = contactsQuery.overlaps("tags", filter.tags);
          }
        }

        const { data: contacts } = await contactsQuery;
        if (!contacts?.length) throw new Error("No contacts match campaign filter");

        // Update campaign status
        await supabase.from("comm_campaigns").update({
          status: "running",
          started_at: new Date().toISOString(),
          total_contacts: contacts.length,
          contacted: 0,
          successful: 0,
          failed: 0,
        }).eq("id", campaign_id);

        const TWILIO_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
        const TWILIO_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
        const TWILIO_FROM = Deno.env.get("TWILIO_PHONE_NUMBER");
        const WA_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
        const WA_PHONE_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

        let contacted = 0, successful = 0, failed = 0;

        for (const contact of contacts) {
          try {
            if (campaign.type === "voice" || campaign.type === "ai_voice") {
              if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM) throw new Error("Twilio not configured");
              if (!contact.phone) { failed++; continue; }

              const scriptSteps = campaign.comm_scripts?.steps as any[] || [];
              const sayText = scriptSteps.map((s: any) => s.content || s.text || "").filter(Boolean).join(". ") ||
                "Hello, this is an automated message. Thank you for your time.";

              const twiml = `<Response><Say voice="alice">${sayText}</Say></Response>`;

              const params = new URLSearchParams({ To: contact.phone, From: TWILIO_FROM, Twiml: twiml });
              const res = await fetch(
                `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Calls.json`,
                {
                  method: "POST",
                  headers: { Authorization: `Basic ${btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`)}`, "Content-Type": "application/x-www-form-urlencoded" },
                  body: params.toString(),
                }
              );
              if (res.ok) {
                const data = await res.json();
                await supabase.from("comm_calls").insert({
                  user_id: user.id, contact_id: contact.id, campaign_id,
                  call_type: campaign.type === "ai_voice" ? "ai_automated" : "campaign",
                  direction: "outbound", status: "initiated", from_number: TWILIO_FROM,
                  to_number: contact.phone, provider: "twilio", provider_call_id: data.sid,
                  script_id: campaign.script_id, started_at: new Date().toISOString(),
                });
                successful++;
              } else { failed++; }
            } else if (campaign.type === "whatsapp") {
              if (!WA_TOKEN || !WA_PHONE_ID) throw new Error("WhatsApp not configured");
              if (!contact.whatsapp_number) { failed++; continue; }

              const scriptSteps = campaign.comm_scripts?.steps as any[] || [];
              const message = scriptSteps.map((s: any) => s.content || s.text || "").filter(Boolean).join("\n") ||
                "Hello! Thank you for being our valued customer.";

              const res = await fetch(`https://graph.facebook.com/v21.0/${WA_PHONE_ID}/messages`, {
                method: "POST",
                headers: { Authorization: `Bearer ${WA_TOKEN}`, "Content-Type": "application/json" },
                body: JSON.stringify({ messaging_product: "whatsapp", to: contact.whatsapp_number, type: "text", text: { body: message } }),
              });
              if (res.ok) {
                const data = await res.json();
                await supabase.from("comm_whatsapp_messages").insert({
                  user_id: user.id, contact_id: contact.id, campaign_id,
                  direction: "outbound", content: message, message_type: "text",
                  status: "sent", provider_message_id: data.messages?.[0]?.id,
                });
                successful++;
              } else { failed++; }
            } else if (campaign.type === "sms") {
              if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM) throw new Error("Twilio not configured");
              if (!contact.phone) { failed++; continue; }

              const scriptSteps = campaign.comm_scripts?.steps as any[] || [];
              const message = scriptSteps.map((s: any) => s.content || s.text || "").filter(Boolean).join(" ") ||
                "Hello! This is an automated message.";

              const params = new URLSearchParams({ To: contact.phone, From: TWILIO_FROM, Body: message });
              const res = await fetch(
                `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
                {
                  method: "POST",
                  headers: { Authorization: `Basic ${btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`)}`, "Content-Type": "application/x-www-form-urlencoded" },
                  body: params.toString(),
                }
              );
              if (res.ok) { successful++; } else { failed++; }
            }
            contacted++;

            // Progress update every 10 contacts
            if (contacted % 10 === 0) {
              await supabase.from("comm_campaigns").update({ contacted, successful, failed }).eq("id", campaign_id);
            }
          } catch {
            failed++;
            contacted++;
          }
        }

        // Final update
        await supabase.from("comm_campaigns").update({
          status: "completed", contacted, successful, failed,
          completed_at: new Date().toISOString(),
        }).eq("id", campaign_id);

        return new Response(JSON.stringify({ success: true, results: { total: contacts.length, contacted, successful, failed } }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "pause-campaign": {
        const { campaign_id } = payload;
        await supabase.from("comm_campaigns").update({ status: "paused" }).eq("id", campaign_id);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "resume-campaign": {
        const { campaign_id } = payload;
        await supabase.from("comm_campaigns").update({ status: "running" }).eq("id", campaign_id);
        return new Response(JSON.stringify({ success: true }), {
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
