import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { provider, apiEndpoint, apiKey, model } = await req.json();

    if (!provider || !apiEndpoint || !apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let testUrl = "";
    let testBody: string | null = null;
    let testHeaders: Record<string, string> = {};
    let method = "GET";

    switch (provider) {
      case "openai":
        // List models endpoint
        testUrl = `${apiEndpoint}/models`;
        testHeaders = { Authorization: `Bearer ${apiKey}` };
        break;

      case "gemini":
        // List models
        testUrl = `${apiEndpoint}/v1beta/models?key=${apiKey}`;
        break;

      case "anthropic":
        // Send a minimal message
        testUrl = `${apiEndpoint}/messages`;
        method = "POST";
        testHeaders = {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        };
        testBody = JSON.stringify({
          model: model || "claude-3-haiku-20240307",
          max_tokens: 5,
          messages: [{ role: "user", content: "Hi" }],
        });
        break;

      case "mistral":
        testUrl = `${apiEndpoint}/models`;
        testHeaders = { Authorization: `Bearer ${apiKey}` };
        break;

      case "cohere":
        testUrl = `${apiEndpoint}/models`;
        testHeaders = { Authorization: `Bearer ${apiKey}` };
        break;

      case "deepseek":
        testUrl = `${apiEndpoint}/models`;
        testHeaders = { Authorization: `Bearer ${apiKey}` };
        break;

      case "groq":
        testUrl = `${apiEndpoint}/models`;
        testHeaders = { Authorization: `Bearer ${apiKey}` };
        break;

      case "perplexity":
        // Perplexity uses chat completions
        testUrl = `${apiEndpoint}/chat/completions`;
        method = "POST";
        testHeaders = {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        };
        testBody = JSON.stringify({
          model: model || "sonar",
          messages: [{ role: "user", content: "Hi" }],
          max_tokens: 5,
        });
        break;

      case "xai":
        testUrl = `${apiEndpoint}/models`;
        testHeaders = { Authorization: `Bearer ${apiKey}` };
        break;

      case "meta":
        // Together/Fireworks style
        testUrl = `${apiEndpoint}/models`;
        testHeaders = { Authorization: `Bearer ${apiKey}` };
        break;

      default:
        // Custom - try models endpoint
        testUrl = `${apiEndpoint}/models`;
        testHeaders = { Authorization: `Bearer ${apiKey}` };
        break;
    }

    const fetchOptions: RequestInit = {
      method,
      headers: testHeaders,
    };
    if (testBody && method === "POST") {
      fetchOptions.body = testBody;
    }

    const response = await fetch(testUrl, fetchOptions);

    if (response.ok) {
      return new Response(
        JSON.stringify({
          success: true,
          status: response.status,
          message: "API connection successful",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      const errorText = await response.text();
      console.error(`API test failed [${response.status}]:`, errorText);
      const errorMessage = `Connection failed with status ${response.status}`;

      return new Response(
        JSON.stringify({
          success: false,
          status: response.status,
          error: errorMessage,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Test connection error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Connection failed",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
