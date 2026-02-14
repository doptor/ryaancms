import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Simple hash function for API key verification
async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/marketplace-api\/?/, "");
  const params = url.searchParams;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // ─── POST /submit — Submit a plugin from self-hosted CMS ───
    if (req.method === "POST" && path === "submit") {
      const apiKey = req.headers.get("x-api-key");
      if (!apiKey) {
        return jsonResponse({ error: "Missing x-api-key header" }, 401);
      }

      // Verify API key
      const keyHash = await hashKey(apiKey);
      const { data: keyRecord, error: keyErr } = await supabase
        .from("developer_api_keys")
        .select("id, user_id, is_active")
        .eq("key_hash", keyHash)
        .eq("is_active", true)
        .single();

      if (keyErr || !keyRecord) {
        return jsonResponse({ error: "Invalid or inactive API key" }, 403);
      }

      // Update last_used_at
      await supabase
        .from("developer_api_keys")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", keyRecord.id);

      // Parse body
      const body = await req.json();
      const { name, slug, category, description, version, demo_url, download_url, tags, icon } = body;

      if (!name || !slug) {
        return jsonResponse({ error: "name and slug are required" }, 400);
      }

      // Check slug uniqueness
      const { data: existing } = await supabase
        .from("plugins")
        .select("id")
        .eq("slug", slug)
        .single();

      if (existing) {
        return jsonResponse({ error: "A product with this slug already exists" }, 409);
      }

      // Insert as pending
      const { data: plugin, error: insertErr } = await supabase
        .from("plugins")
        .insert({
          name,
          slug,
          category: category || "plugin",
          description: description || null,
          version: version || "1.0.0",
          demo_url: demo_url || null,
          download_url: download_url || null,
          tags: tags || [],
          icon: icon || null,
          author: name,
          submitted_by: keyRecord.user_id,
          approval_status: "pending",
          is_free: true,
        })
        .select("id, name, slug, approval_status")
        .single();

      if (insertErr) throw insertErr;

      return jsonResponse({
        success: true,
        message: "Submission received. It will be reviewed by an admin.",
        data: plugin,
      }, 201);
    }

    // ─── POST /keys/generate — Generate API key (authenticated user) ───
    if (req.method === "POST" && path === "keys/generate") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return jsonResponse({ error: "Unauthorized" }, 401);
      }

      const authClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );

      const { data: claims, error: claimsErr } = await authClient.auth.getClaims(
        authHeader.replace("Bearer ", "")
      );
      if (claimsErr || !claims?.claims?.sub) {
        return jsonResponse({ error: "Unauthorized" }, 401);
      }

      const userId = claims.claims.sub as string;
      const body = await req.json().catch(() => ({}));
      const label = (body as any).label || "Default";

      // Generate random API key
      const rawKey = `rcms_${crypto.randomUUID().replace(/-/g, "")}`;
      const keyHash = await hashKey(rawKey);
      const keyPrefix = rawKey.substring(0, 12);

      const { error: insertErr } = await supabase
        .from("developer_api_keys")
        .insert({
          user_id: userId,
          key_hash: keyHash,
          key_prefix: keyPrefix,
          label,
        });

      if (insertErr) throw insertErr;

      // Return the raw key ONCE — it won't be retrievable again
      return jsonResponse({
        success: true,
        message: "API key generated. Save it now — you won't see it again.",
        api_key: rawKey,
        prefix: keyPrefix,
        label,
      }, 201);
    }

    // ─── Only GET allowed for remaining routes ───
    if (req.method !== "GET") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    // ─── GET /products — list all approved products ───
    if (!path || path === "products") {
      let query = supabase
        .from("plugins")
        .select("id, name, slug, category, description, version, author, rating, install_count, tags, icon, is_official, price, is_free, demo_url, download_url, created_at")
        .eq("approval_status", "approved")
        .order("install_count", { ascending: false });

      const category = params.get("category");
      if (category) query = query.eq("category", category);

      const tag = params.get("tag");
      if (tag) query = query.contains("tags", [tag]);

      const freeOnly = params.get("free");
      if (freeOnly === "true") query = query.eq("is_free", true);

      const search = params.get("q");
      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }

      const page = parseInt(params.get("page") || "1");
      const limit = Math.min(parseInt(params.get("limit") || "50"), 100);
      const from = (page - 1) * limit;
      query = query.range(from, from + limit - 1);

      const { data, error } = await query;
      if (error) throw error;

      return jsonResponse({
        success: true,
        data: data || [],
        pagination: { page, limit },
      });
    }

    // ─── GET /products/:slug — single product detail ───
    const slugMatch = path.match(/^products\/(.+)$/);
    if (slugMatch) {
      const slug = slugMatch[1];
      const { data, error } = await supabase
        .from("plugins")
        .select("id, name, slug, category, description, version, author, rating, install_count, tags, icon, is_official, price, is_free, demo_url, download_url, config_schema, created_at, updated_at")
        .eq("slug", slug)
        .eq("approval_status", "approved")
        .single();

      if (error || !data) {
        return jsonResponse({ success: false, error: "Product not found" }, 404);
      }

      return jsonResponse({ success: true, data });
    }

    // ─── GET /categories ───
    if (path === "categories") {
      const { data, error } = await supabase
        .from("plugins")
        .select("category")
        .eq("approval_status", "approved");

      if (error) throw error;

      const categories = [...new Set((data || []).map((p: any) => p.category))];
      return jsonResponse({ success: true, data: categories });
    }

    return jsonResponse({ error: "Not found" }, 404);
  } catch (err: any) {
    return jsonResponse({ error: err.message || "Internal error" }, 500);
  }
});
