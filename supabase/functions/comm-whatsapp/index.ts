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

    const WA_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
    const WA_PHONE_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

    if (!WA_TOKEN || !WA_PHONE_ID) {
      throw new Error("WhatsApp credentials not configured. Please add WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID secrets.");
    }

    const waHeaders = {
      Authorization: `Bearer ${WA_TOKEN}`,
      "Content-Type": "application/json",
    };

    switch (action) {
      case "send-message": {
        const { to, message, contact_id } = payload;
        if (!to || !message) throw new Error("to and message are required");

        const waRes = await fetch(
          `https://graph.facebook.com/v21.0/${WA_PHONE_ID}/messages`,
          {
            method: "POST",
            headers: waHeaders,
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to,
              type: "text",
              text: { body: message },
            }),
          }
        );

        const waData = await waRes.json();
        if (!waRes.ok) throw new Error(waData.error?.message || "WhatsApp send failed");

        // Save message record
        const { data: msgRecord } = await supabase.from("comm_whatsapp_messages").insert({
          user_id: user.id,
          contact_id: contact_id || null,
          direction: "outbound",
          content: message,
          message_type: "text",
          status: "sent",
          provider_message_id: waData.messages?.[0]?.id || null,
        }).select().single();

        // Update conversation
        if (contact_id) {
          await supabase.from("comm_conversations")
            .update({ last_message: message, last_message_at: new Date().toISOString() })
            .eq("contact_id", contact_id)
            .eq("channel", "whatsapp");
        }

        return new Response(JSON.stringify({ success: true, message: msgRecord, whatsapp: waData }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "send-template": {
        const { to, template_name, language_code, components, contact_id } = payload;
        if (!to || !template_name) throw new Error("to and template_name are required");

        const waRes = await fetch(
          `https://graph.facebook.com/v21.0/${WA_PHONE_ID}/messages`,
          {
            method: "POST",
            headers: waHeaders,
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to,
              type: "template",
              template: {
                name: template_name,
                language: { code: language_code || "en" },
                components: components || [],
              },
            }),
          }
        );

        const waData = await waRes.json();
        if (!waRes.ok) throw new Error(waData.error?.message || "WhatsApp template send failed");

        await supabase.from("comm_whatsapp_messages").insert({
          user_id: user.id,
          contact_id: contact_id || null,
          direction: "outbound",
          content: `[Template: ${template_name}]`,
          message_type: "template",
          template_name,
          status: "sent",
          provider_message_id: waData.messages?.[0]?.id || null,
        });

        return new Response(JSON.stringify({ success: true, whatsapp: waData }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "send-media": {
        const { to, media_url, media_type, caption, contact_id } = payload;
        if (!to || !media_url) throw new Error("to and media_url are required");

        const type = media_type || "image";
        const body: any = {
          messaging_product: "whatsapp",
          to,
          type,
          [type]: { link: media_url },
        };
        if (caption && (type === "image" || type === "video" || type === "document")) {
          body[type].caption = caption;
        }

        const waRes = await fetch(
          `https://graph.facebook.com/v21.0/${WA_PHONE_ID}/messages`,
          { method: "POST", headers: waHeaders, body: JSON.stringify(body) }
        );

        const waData = await waRes.json();
        if (!waRes.ok) throw new Error(waData.error?.message || "WhatsApp media send failed");

        await supabase.from("comm_whatsapp_messages").insert({
          user_id: user.id,
          contact_id: contact_id || null,
          direction: "outbound",
          content: caption || `[${type}]`,
          message_type: type,
          media_url,
          status: "sent",
          provider_message_id: waData.messages?.[0]?.id || null,
        });

        return new Response(JSON.stringify({ success: true, whatsapp: waData }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get-templates": {
        const WA_BUSINESS_ID = Deno.env.get("WHATSAPP_BUSINESS_ACCOUNT_ID");
        if (!WA_BUSINESS_ID) throw new Error("WHATSAPP_BUSINESS_ACCOUNT_ID not configured");

        const res = await fetch(
          `https://graph.facebook.com/v21.0/${WA_BUSINESS_ID}/message_templates`,
          { headers: { Authorization: `Bearer ${WA_TOKEN}` } }
        );
        const data = await res.json();

        return new Response(JSON.stringify({ success: true, templates: data.data || [] }), {
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
