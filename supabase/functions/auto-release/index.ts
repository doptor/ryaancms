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
    const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");
    if (!GITHUB_TOKEN) {
      throw new Error("GITHUB_TOKEN is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get the latest release version
    const { data: latestRelease } = await supabase
      .from("releases")
      .select("version")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Calculate next version
    let nextVersion: string;
    if (!latestRelease) {
      nextVersion = "1.0.0";
    } else {
      const parts = latestRelease.version.split(".").map(Number);
      parts[2] += 1; // increment patch
      if (parts[2] >= 100) {
        parts[2] = 0;
        parts[1] += 1;
      }
      if (parts[1] >= 100) {
        parts[1] = 0;
        parts[0] += 1;
      }
      nextVersion = parts.join(".");
    }

    const tagName = `v${nextVersion}`;
    const today = new Date().toISOString().split("T")[0];
    const releaseName = `RyaanCMS ${tagName} — ${today}`;
    const body = `## RyaanCMS ${tagName}\n\n**Release Date:** ${today}\n\nAutomated daily release by RyaanCMS Release Engine.`;

    // Get repo info from GitHub token - find the connected repo
    // We need the owner/repo. Let's parse from request body or use env.
    let owner = "";
    let repo = "";

    try {
      const reqBody = await req.json();
      owner = reqBody.owner || "";
      repo = reqBody.repo || "";
    } catch {
      // no body provided
    }

    if (!owner || !repo) {
      throw new Error(
        "Missing owner/repo. Pass { owner, repo } in the request body."
      );
    }

    // Create GitHub release
    const ghResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/releases`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({
          tag_name: tagName,
          name: releaseName,
          body,
          draft: false,
          prerelease: false,
          generate_release_notes: true,
        }),
      }
    );

    const ghData = await ghResponse.json();

    if (!ghResponse.ok) {
      // Record failure
      await supabase.from("releases").insert({
        version: nextVersion,
        tag_name: tagName,
        status: "failed",
        release_url: null,
      });
      throw new Error(
        `GitHub API error [${ghResponse.status}]: ${JSON.stringify(ghData)}`
      );
    }

    // Record success
    await supabase.from("releases").insert({
      version: nextVersion,
      tag_name: tagName,
      status: "success",
      release_url: ghData.html_url,
    });

    return new Response(
      JSON.stringify({
        success: true,
        version: nextVersion,
        tag: tagName,
        url: ghData.html_url,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Auto-release error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
