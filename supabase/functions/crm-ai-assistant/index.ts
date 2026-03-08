import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    let prompt = "";

    switch (action) {
      case "score_leads":
        prompt = `You are an AI sales assistant. Analyze these leads and provide a score (0-100) for each based on their likelihood to convert. Consider: source quality, completeness of contact info, engagement signals.

Leads data:
${JSON.stringify(data.leads, null, 2)}

Respond in JSON format:
[{"id": "lead_id", "score": 85, "reason": "brief reason"}]`;
        break;

      case "predict_deals":
        prompt = `You are an AI sales assistant. Analyze these deals and predict which are most likely to close this month. Consider: deal value, stage, probability, expected close date.

Deals data:
${JSON.stringify(data.deals, null, 2)}

Today's date: ${new Date().toISOString().split("T")[0]}

Respond in JSON format:
[{"id": "deal_id", "title": "deal title", "predicted_probability": 85, "recommendation": "brief action to take"}]
Sort by predicted_probability descending.`;
        break;

      case "suggest_followups":
        prompt = `You are an AI sales assistant. Based on these activities and deals, suggest follow-up actions the sales team should take today.

Activities data:
${JSON.stringify(data.activities, null, 2)}

Deals data:
${JSON.stringify(data.deals, null, 2)}

Respond in JSON format:
[{"type": "call|email|meeting", "target": "contact/company name", "reason": "why this follow-up", "priority": "high|medium|low", "suggested_message": "brief template"}]
Limit to top 5 suggestions.`;
        break;

      case "generate_email":
        prompt = `You are an AI sales assistant. Generate a professional sales email based on this context:

Context: ${JSON.stringify(data.context)}

Respond in JSON format:
{"subject": "email subject", "body": "email body in plain text"}`;
        break;

      case "analyze_pipeline":
        prompt = `You are an AI sales analyst. Analyze this sales pipeline and provide insights.

Pipeline stages and deals:
${JSON.stringify(data.pipeline, null, 2)}

Provide analysis in JSON format:
{
  "health_score": 75,
  "bottleneck_stage": "stage name where deals are stuck",
  "insights": ["insight 1", "insight 2", "insight 3"],
  "recommendations": ["action 1", "action 2"],
  "forecast": {"this_month": 50000, "next_month": 75000, "confidence": "medium"}
}`;
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`AI API error [${response.status}]: ${err}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "";

    // Try to parse JSON from the response
    let parsed;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : content;
    } catch {
      parsed = content;
    }

    return new Response(
      JSON.stringify({ success: true, result: parsed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
