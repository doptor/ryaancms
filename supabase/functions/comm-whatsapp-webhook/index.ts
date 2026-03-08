import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // WhatsApp webhook verification (GET)
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get verify token from settings
    const { data: setting } = await supabase
      .from("comm_settings")
      .select("setting_value")
      .eq("setting_key", "whatsapp_verify_token")
      .limit(1)
      .maybeSingle();

    const verifyToken = setting?.setting_value || Deno.env.get("WHATSAPP_VERIFY_TOKEN") || "ryaancms_webhook_verify";

    if (mode === "subscribe" && token === verifyToken) {
      return new Response(challenge, { status: 200, headers: corsHeaders });
    }
    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // POST - incoming messages
  try {
    const body = await req.json();
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value) {
      return new Response(JSON.stringify({ status: "no_data" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle message status updates
    if (value.statuses) {
      for (const status of value.statuses) {
        const updateFields: Record<string, string> = {};
        if (status.status === "delivered") updateFields.delivered_at = new Date(parseInt(status.timestamp) * 1000).toISOString();
        if (status.status === "read") updateFields.read_at = new Date(parseInt(status.timestamp) * 1000).toISOString();

        if (Object.keys(updateFields).length > 0) {
          await supabase.from("comm_whatsapp_messages")
            .update({ ...updateFields, status: status.status })
            .eq("provider_message_id", status.id);
        }
      }
    }

    // Handle incoming messages
    if (value.messages) {
      for (const msg of value.messages) {
        const fromNumber = msg.from;
        const messageContent = msg.text?.body || msg.caption || `[${msg.type}]`;
        const mediaUrl = msg.image?.id || msg.video?.id || msg.audio?.id || msg.document?.id || null;

        // Find or create contact
        let { data: contact } = await supabase
          .from("comm_contacts")
          .select("id, user_id")
          .eq("whatsapp_number", fromNumber)
          .limit(1)
          .maybeSingle();

        if (!contact) {
          // Try to find by phone
          const { data: phoneContact } = await supabase
            .from("comm_contacts")
            .select("id, user_id")
            .eq("phone", fromNumber)
            .limit(1)
            .maybeSingle();
          contact = phoneContact;
        }

        if (!contact) {
          // Find the first user who has comm_settings to assign the contact
          const { data: firstUser } = await supabase
            .from("comm_settings")
            .select("user_id")
            .limit(1)
            .maybeSingle();

          if (firstUser) {
            const { data: newContact } = await supabase.from("comm_contacts").insert({
              name: value.contacts?.[0]?.profile?.name || fromNumber,
              whatsapp_number: fromNumber,
              phone: fromNumber,
              user_id: firstUser.user_id,
              source: "whatsapp",
            }).select().single();
            contact = newContact;
          }
        }

        if (!contact) continue;

        // Save incoming message
        await supabase.from("comm_whatsapp_messages").insert({
          contact_id: contact.id,
          user_id: contact.user_id,
          direction: "inbound",
          content: messageContent,
          message_type: msg.type || "text",
          media_url: mediaUrl,
          status: "received",
          provider_message_id: msg.id,
        });

        // Update or create conversation
        const { data: existingConv } = await supabase
          .from("comm_conversations")
          .select("id, unread_count, is_bot_active")
          .eq("contact_id", contact.id)
          .eq("channel", "whatsapp")
          .limit(1)
          .maybeSingle();

        if (existingConv) {
          await supabase.from("comm_conversations").update({
            last_message: messageContent,
            last_message_at: new Date().toISOString(),
            unread_count: (existingConv.unread_count || 0) + 1,
          }).eq("id", existingConv.id);

          // Auto-respond with AI if bot is active
          if (existingConv.is_bot_active) {
            await handleBotResponse(supabase, contact, messageContent, fromNumber);
          }
        } else {
          await supabase.from("comm_conversations").insert({
            contact_id: contact.id,
            user_id: contact.user_id,
            channel: "whatsapp",
            last_message: messageContent,
            last_message_at: new Date().toISOString(),
            unread_count: 1,
            is_bot_active: true,
          });

          // Auto-respond for new conversations
          await handleBotResponse(supabase, contact, messageContent, fromNumber);
        }

        // Update contact stats
        await supabase.from("comm_contacts").update({
          total_messages: (contact as any).total_messages ? (contact as any).total_messages + 1 : 1,
          last_contacted_at: new Date().toISOString(),
        }).eq("id", contact.id);
      }
    }

    return new Response(JSON.stringify({ status: "ok" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleBotResponse(
  supabase: any,
  contact: { id: string; user_id: string },
  incomingMessage: string,
  fromNumber: string,
) {
  try {
    const WA_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
    const WA_PHONE_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
    if (!WA_TOKEN || !WA_PHONE_ID) return;

    // Get AI response using the comm-ai-voice function's logic
    const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

    let botReply = "Thank you for your message. An agent will respond shortly.";

    if (LOVABLE_KEY) {
      try {
        const aiRes = await fetch(`${SUPABASE_URL}/functions/v1/comm-ai-voice`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${LOVABLE_KEY}`,
          },
          body: JSON.stringify({
            action: "ai-conversation",
            message: incomingMessage,
            context: "WhatsApp chatbot for customer support. Be helpful and concise.",
            language: "auto",
          }),
        });
        if (aiRes.ok) {
          const data = await aiRes.json();
          if (data.success && data.reply) botReply = data.reply;
        }
      } catch { /* fallback to default reply */ }
    }

    // Send bot reply via WhatsApp
    const waRes = await fetch(`https://graph.facebook.com/v21.0/${WA_PHONE_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WA_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: fromNumber,
        type: "text",
        text: { body: botReply },
      }),
    });

    const waData = await waRes.json();

    // Save bot response
    await supabase.from("comm_whatsapp_messages").insert({
      contact_id: contact.id,
      user_id: contact.user_id,
      direction: "outbound",
      content: botReply,
      message_type: "text",
      status: "sent",
      is_bot_response: true,
      ai_generated: true,
      provider_message_id: waData.messages?.[0]?.id || null,
    });

    // Update conversation
    await supabase.from("comm_conversations").update({
      last_message: botReply,
      last_message_at: new Date().toISOString(),
    }).eq("contact_id", contact.id).eq("channel", "whatsapp");
  } catch (err) {
    console.error("Bot response error:", err);
  }
}
