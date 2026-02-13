import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a React/Tailwind code generator for RyaanCMS.

You receive a page configuration (name, route, layout, components with props) and generate a single complete React component file.

Rules:
- Output ONLY the React component code, no markdown fences, no explanation
- Use TypeScript (.tsx)
- Use Tailwind CSS for all styling — use semantic color tokens (bg-background, text-foreground, bg-primary, text-primary-foreground, bg-card, border-border, text-muted-foreground, bg-accent, etc.)
- Import React and any hooks needed
- Make the component fully functional with sample data
- Use modern React patterns (hooks, functional components)
- Make it responsive (mobile-first)
- Include proper TypeScript types
- Export the component as default
- For charts, use recharts (already installed)
- For icons, use lucide-react
- Component should be self-contained and render a complete page

Component type mapping:
- hero: Large hero section with heading, subheading, CTA buttons
- navbar: Navigation bar with links and logo
- footer: Footer with links and copyright
- sidebar: Sidebar navigation
- crud_table: Data table with CRUD operations (use sample data array)
- form: Form with inputs, validation
- chart: Charts using recharts (BarChart, LineChart, PieChart)
- card_grid: Grid of cards displaying items
- stats_row: Row of stat cards with numbers
- auth_form: Login/signup form
- pricing_table: Pricing tiers with features
- media_gallery: Image/media grid
- search_bar: Search input with filters
- notification_center: Notification list/panel
- rich_text_editor: Text editing area
- file_upload: File upload dropzone
- calendar: Calendar/date picker view
- kanban_board: Kanban columns with draggable cards
- timeline: Vertical timeline of events
- map: Map placeholder with location info

For each component, use its props to customize the rendering (titles, colors, data, etc.)`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { config } = await req.json();

    if (!config || !config.pages) {
      return new Response(
        JSON.stringify({ error: "Config with pages is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const generatedFiles: { filename: string; pageName: string; route: string; code: string }[] = [];

    // Generate code for each page (sequential to avoid rate limits)
    for (const page of config.pages) {
      const prompt = `Generate a React component for this page:

Page: "${page.name}"
Route: "${page.route}"
Layout: "${page.layout}"
Project: "${config.title}" (${config.project_type})
Style: ${JSON.stringify(config.style || {})}

Components on this page:
${page.components.map((c: any, i: number) => `${i + 1}. Type: "${c.type}" — Props: ${JSON.stringify(c.props || {})}`).join("\n")}

Generate a single React component that renders ALL these components together as a complete page.
The component should be named "${page.name.replace(/[^a-zA-Z0-9]/g, "")}Page".`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited — return what we have so far
          console.warn("Rate limited during code generation, returning partial results");
          break;
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: "AI credits exhausted. Please add funds in workspace settings." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const errorText = await response.text();
        console.error(`Failed to generate code for ${page.name}:`, response.status, errorText);
        continue;
      }

      const data = await response.json();
      let code = data.choices?.[0]?.message?.content || "";

      // Strip markdown code fences if present
      code = code.replace(/^```(?:tsx?|jsx?|typescript|javascript)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

      const filename = page.name
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .replace(/\s+/g, "")
        + "Page.tsx";

      generatedFiles.push({
        filename,
        pageName: page.name,
        route: page.route,
        code,
      });

      // Small delay between requests to avoid rate limiting
      if (config.pages.indexOf(page) < config.pages.length - 1) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    // Generate an App.tsx router file
    const appCode = generateAppRouter(config, generatedFiles);
    generatedFiles.push({
      filename: "App.tsx",
      pageName: "App Router",
      route: "/",
      code: appCode,
    });

    return new Response(
      JSON.stringify({ success: true, files: generatedFiles }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Code generation error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateAppRouter(
  config: any,
  files: { filename: string; pageName: string; route: string }[]
): string {
  const imports = files
    .filter(f => f.filename !== "App.tsx")
    .map(f => `import ${f.filename.replace(".tsx", "")} from "./pages/${f.filename.replace(".tsx", "")}";`)
    .join("\n");

  const routes = files
    .filter(f => f.filename !== "App.tsx")
    .map(f => `        <Route path="${f.route}" element={<${f.filename.replace(".tsx", "")} />} />`)
    .join("\n");

  return `import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

${imports}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
${routes}
      </Routes>
    </BrowserRouter>
  );
}
`;
}
