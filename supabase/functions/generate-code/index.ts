import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Component types that have pre-built templates (stable code)
const TEMPLATE_COMPONENTS = new Set([
  "auth_form", "hero", "crud_table", "pricing_table",
  "notification_center", "role_manager", "settings_panel", "dashboard_layout",
]);

const SYSTEM_PROMPT = `You are a React/Tailwind code generator for RyaanCMS.

You receive a page configuration and generate a single complete React component file.

Rules:
- Output ONLY the React component code, no markdown fences, no explanation
- Use TypeScript (.tsx)
- Use Tailwind CSS with semantic color tokens (bg-background, text-foreground, bg-primary, text-primary-foreground, bg-card, border-border, text-muted-foreground, bg-accent)
- Import React and any hooks needed
- Make the component fully functional with sample data
- Use modern React patterns (hooks, functional components)
- Make it responsive (mobile-first)
- Include proper TypeScript types
- Export the component as default
- For charts, use recharts
- For icons, use lucide-react
- IMPORTANT: If a template component is provided, integrate it into the page layout seamlessly

Component types: hero, navbar, footer, sidebar, crud_table, form, chart, card_grid, stats_row, auth_form, pricing_table, media_gallery, search_bar, notification_center, rich_text_editor, file_upload, calendar, kanban_board, timeline, map`;

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
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const generatedFiles: { filename: string; pageName: string; route: string; code: string; isTemplate?: boolean }[] = [];

    for (const page of config.pages) {
      // Check if this page only has template components
      const templateComponents = page.components.filter((c: any) => TEMPLATE_COMPONENTS.has(c.type));
      const customComponents = page.components.filter((c: any) => !TEMPLATE_COMPONENTS.has(c.type));

      // If ALL components are templates, we can skip AI generation for faster/stable output
      // But we still want a cohesive page, so only skip for single-component template pages
      const isSingleTemplatePageSkippable = page.components.length === 1 && templateComponents.length === 1;

      if (isSingleTemplatePageSkippable) {
        // Mark as template-based — the frontend will use the pre-built module template
        const filename = page.name.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "") + "Page.tsx";
        generatedFiles.push({
          filename,
          pageName: page.name,
          route: page.route,
          code: `// Template: ${templateComponents[0].type}\n// This page uses a pre-built module template for stability.\n// The template will be automatically applied by the RyaanCMS engine.\n\n// Props: ${JSON.stringify(templateComponents[0].props || {})}\n`,
          isTemplate: true,
        });
        continue;
      }

      // AI-generate for complex/multi-component pages
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
          console.warn("Rate limited, returning partial results");
          break;
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: "AI credits exhausted. Please add funds in workspace settings." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        console.error(`Failed for ${page.name}:`, response.status);
        continue;
      }

      const data = await response.json();
      let code = data.choices?.[0]?.message?.content || "";
      code = code.replace(/^```(?:tsx?|jsx?|typescript|javascript)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

      const filename = page.name.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "") + "Page.tsx";
      generatedFiles.push({ filename, pageName: page.name, route: page.route, code });

      if (config.pages.indexOf(page) < config.pages.length - 1) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    // Generate App.tsx router
    const appCode = generateAppRouter(config, generatedFiles);
    generatedFiles.push({ filename: "App.tsx", pageName: "App Router", route: "/", code: appCode });

    // Generate scaffold files
    const scaffoldFiles = generateScaffold(config);
    generatedFiles.push(...scaffoldFiles);

    return new Response(
      JSON.stringify({ success: true, files: generatedFiles }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Code generation error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateAppRouter(config: any, files: { filename: string; route: string }[]): string {
  const pageFiles = files.filter(f => f.filename !== "App.tsx" && !f.filename.startsWith("_"));
  const imports = pageFiles.map(f => `import ${f.filename.replace(".tsx", "")} from "./pages/${f.filename.replace(".tsx", "")}";`).join("\n");
  const routes = pageFiles.map(f => `        <Route path="${f.route}" element={<${f.filename.replace(".tsx", "")} />} />`).join("\n");

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

function generateScaffold(config: any): { filename: string; pageName: string; route: string; code: string }[] {
  const files: { filename: string; pageName: string; route: string; code: string }[] = [];

  // package.json
  files.push({
    filename: "_scaffold/package.json",
    pageName: "Package Config",
    route: "",
    code: JSON.stringify({
      name: (config.title || "my-app").toLowerCase().replace(/\s+/g, "-"),
      private: true,
      version: "1.0.0",
      type: "module",
      scripts: {
        dev: "vite",
        build: "tsc && vite build",
        preview: "vite preview",
      },
      dependencies: {
        react: "^18.3.1",
        "react-dom": "^18.3.1",
        "react-router-dom": "^6.30.0",
        recharts: "^2.15.0",
        "lucide-react": "^0.460.0",
        "tailwind-merge": "^2.6.0",
        clsx: "^2.1.1",
      },
      devDependencies: {
        "@types/react": "^18.3.0",
        "@types/react-dom": "^18.3.0",
        typescript: "^5.5.0",
        vite: "^5.4.0",
        "@vitejs/plugin-react": "^4.3.0",
        tailwindcss: "^3.4.0",
        postcss: "^8.4.0",
        autoprefixer: "^10.4.0",
      },
    }, null, 2),
  });

  // vite.config.ts
  files.push({
    filename: "_scaffold/vite.config.ts",
    pageName: "Vite Config",
    route: "",
    code: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
`,
  });

  // tailwind.config.js
  const primaryColor = config.style?.primary_color || "#6366f1";
  files.push({
    filename: "_scaffold/tailwind.config.js",
    pageName: "Tailwind Config",
    route: "",
    code: `/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
      },
      borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)" },
    },
  },
  plugins: [],
}
`,
  });

  // index.html
  files.push({
    filename: "_scaffold/index.html",
    pageName: "HTML Entry",
    route: "",
    code: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${config.title || "My App"}</title>
    <meta name="description" content="${config.description || ""}" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
  });

  // index.css with design tokens
  files.push({
    filename: "_scaffold/src/index.css",
    pageName: "Global CSS",
    route: "",
    code: `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 243 75% 59%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 243 75% 59%;
    --radius: 0.75rem;
  }
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --primary: 243 75% 59%;
    --primary-foreground: 210 40% 98%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 243 75% 59%;
  }
}

@layer base {
  * { @apply border-border; }
  body { @apply bg-background text-foreground; }
}
`,
  });

  // main.tsx
  files.push({
    filename: "_scaffold/src/main.tsx",
    pageName: "App Entry",
    route: "",
    code: `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,
  });

  // tsconfig.json
  files.push({
    filename: "_scaffold/tsconfig.json",
    pageName: "TS Config",
    route: "",
    code: JSON.stringify({
      compilerOptions: {
        target: "ES2020",
        useDefineForClassFields: true,
        lib: ["ES2020", "DOM", "DOM.Iterable"],
        module: "ESNext",
        skipLibCheck: true,
        moduleResolution: "bundler",
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: "react-jsx",
        strict: true,
        noUnusedLocals: false,
        noUnusedParameters: false,
        noFallthroughCasesInSwitch: true,
        baseUrl: ".",
        paths: { "@/*": ["./src/*"] },
      },
      include: ["src"],
    }, null, 2),
  });

  return files;
}
