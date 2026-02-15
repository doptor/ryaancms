import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function getUserApiConfig(req: Request, taskType = "general") {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return null;
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/site_settings?key=eq.ai_integrations&select=value`,
      { headers: { Authorization: authHeader, apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" } }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    const items = rows?.[0]?.value?.items?.filter((i: any) => i.status === "active" && i.apiKey?.length > 5) || [];
    const byTask = items.find((i: any) => i.useFor?.includes(taskType));
    if (byTask) return { provider: byTask.provider, endpoint: byTask.apiEndpoint, apiKey: byTask.apiKey, model: byTask.model };
    const general = items.find((i: any) => i.useFor?.includes("general"));
    if (general) return { provider: general.provider, endpoint: general.apiEndpoint, apiKey: general.apiKey, model: general.model };
    const any = items[0];
    if (any) return { provider: any.provider, endpoint: any.apiEndpoint, apiKey: any.apiKey, model: any.model };
    return null;
  } catch { return null; }
}

async function aiRequest(body: string, userApiConfig: any) {
  if (!userApiConfig) {
    throw new Error("No API key configured. Please add your own API key in Settings → AI Integrations.");
  }
  console.log(`Using user's ${userApiConfig.provider} API key`);
  const parsed = JSON.parse(body);
  parsed.model = userApiConfig.model || "gpt-5";
  const userEndpoint = userApiConfig.endpoint.endsWith("/chat/completions")
    ? userApiConfig.endpoint : `${userApiConfig.endpoint}/chat/completions`;
  const response = await fetch(userEndpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${userApiConfig.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(parsed),
  });
  if (!response.ok) {
    const errText = await response.text();
    console.error(`User API failed (${response.status}):`, errText);
    throw new Error(`AI provider returned ${response.status}. Check your API key and quota.`);
  }
  return response;
}

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

    const userApiConfig = await getUserApiConfig(req, "code_gen");

    const generatedFiles: { filename: string; pageName: string; route: string; code: string; isTemplate?: boolean }[] = [];

    for (const page of config.pages) {
      const templateComponents = page.components.filter((c: any) => TEMPLATE_COMPONENTS.has(c.type));
      const isSingleTemplatePageSkippable = page.components.length === 1 && templateComponents.length === 1;

      if (isSingleTemplatePageSkippable) {
        const filename = page.name.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "") + "Page.tsx";
        generatedFiles.push({
          filename, pageName: page.name, route: page.route,
          code: `// Template: ${templateComponents[0].type}\n// Props: ${JSON.stringify(templateComponents[0].props || {})}\n`,
          isTemplate: true,
        });
        continue;
      }

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

      const requestBody = JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
      });

      const response = await aiRequest(requestBody, userApiConfig);

      const data = await response.json();
      let code = data.choices?.[0]?.message?.content || "";
      code = code.replace(/^```(?:tsx?|jsx?|typescript|javascript)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

      const filename = page.name.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "") + "Page.tsx";
      generatedFiles.push({ filename, pageName: page.name, route: page.route, code });

      if (config.pages.indexOf(page) < config.pages.length - 1) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    const appCode = generateAppRouter(config, generatedFiles);
    generatedFiles.push({ filename: "App.tsx", pageName: "App Router", route: "/", code: appCode });

    const scaffoldFiles = generateScaffold(config);
    generatedFiles.push(...scaffoldFiles);

    return new Response(JSON.stringify({ success: true, files: generatedFiles }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Code generation error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("No API key configured") ? 402 : 500;
    return new Response(JSON.stringify({ success: false, error: message }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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

  files.push({
    filename: "_scaffold/package.json", pageName: "Package Config", route: "",
    code: JSON.stringify({
      name: (config.title || "my-app").toLowerCase().replace(/\s+/g, "-"),
      private: true, version: "1.0.0", type: "module",
      scripts: { dev: "vite", build: "tsc && vite build", preview: "vite preview" },
      dependencies: { react: "^18.3.1", "react-dom": "^18.3.1", "react-router-dom": "^6.30.0", recharts: "^2.15.0", "lucide-react": "^0.460.0", "tailwind-merge": "^2.6.0", clsx: "^2.1.1" },
      devDependencies: { "@types/react": "^18.3.0", "@types/react-dom": "^18.3.0", typescript: "^5.5.0", vite: "^5.4.0", "@vitejs/plugin-react": "^4.3.0", tailwindcss: "^3.4.0", postcss: "^8.4.0", autoprefixer: "^10.4.0" },
    }, null, 2),
  });

  files.push({ filename: "_scaffold/vite.config.ts", pageName: "Vite Config", route: "",
    code: `import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\nimport path from 'path'\n\nexport default defineConfig({\n  plugins: [react()],\n  resolve: { alias: { '@': path.resolve(__dirname, './src') } },\n})\n` });

  const primaryColor = config.style?.primary_color || "#6366f1";
  files.push({ filename: "_scaffold/tailwind.config.js", pageName: "Tailwind Config", route: "",
    code: `/** @type {import('tailwindcss').Config} */\nexport default {\n  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],\n  theme: {\n    extend: {\n      colors: {\n        border: "hsl(var(--border))", input: "hsl(var(--input))", ring: "hsl(var(--ring))",\n        background: "hsl(var(--background))", foreground: "hsl(var(--foreground))",\n        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },\n        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },\n        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },\n        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },\n        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },\n        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },\n      },\n      borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)" },\n    },\n  },\n  plugins: [],\n}\n` });

  files.push({ filename: "_scaffold/index.html", pageName: "HTML Entry", route: "",
    code: `<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>${config.title || "My App"}</title>\n    <meta name="description" content="${config.description || ""}" />\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>\n  </body>\n</html>\n` });

  files.push({ filename: "_scaffold/src/index.css", pageName: "Global CSS", route: "",
    code: `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n@layer base {\n  :root {\n    --background: 0 0% 100%;\n    --foreground: 222.2 84% 4.9%;\n    --card: 0 0% 100%;\n    --card-foreground: 222.2 84% 4.9%;\n    --primary: 243 75% 59%;\n    --primary-foreground: 210 40% 98%;\n    --secondary: 210 40% 96.1%;\n    --secondary-foreground: 222.2 47.4% 11.2%;\n    --muted: 210 40% 96.1%;\n    --muted-foreground: 215.4 16.3% 46.9%;\n    --accent: 210 40% 96.1%;\n    --accent-foreground: 222.2 47.4% 11.2%;\n    --destructive: 0 84.2% 60.2%;\n    --destructive-foreground: 210 40% 98%;\n    --border: 214.3 31.8% 91.4%;\n    --input: 214.3 31.8% 91.4%;\n    --ring: 243 75% 59%;\n    --radius: 0.75rem;\n  }\n  .dark {\n    --background: 222.2 84% 4.9%;\n    --foreground: 210 40% 98%;\n    --card: 222.2 84% 4.9%;\n    --card-foreground: 210 40% 98%;\n    --primary: 243 75% 59%;\n    --primary-foreground: 210 40% 98%;\n    --secondary: 217.2 32.6% 17.5%;\n    --secondary-foreground: 210 40% 98%;\n    --muted: 217.2 32.6% 17.5%;\n    --muted-foreground: 215 20.2% 65.1%;\n    --accent: 217.2 32.6% 17.5%;\n    --accent-foreground: 210 40% 98%;\n    --destructive: 0 62.8% 30.6%;\n    --destructive-foreground: 210 40% 98%;\n    --border: 217.2 32.6% 17.5%;\n    --input: 217.2 32.6% 17.5%;\n    --ring: 243 75% 59%;\n  }\n}\n\n@layer base {\n  * { @apply border-border; }\n  body { @apply bg-background text-foreground; }\n}\n` });

  files.push({ filename: "_scaffold/src/main.tsx", pageName: "App Entry", route: "",
    code: `import React from "react";\nimport ReactDOM from "react-dom/client";\nimport App from "./App";\nimport "./index.css";\n\nReactDOM.createRoot(document.getElementById("root")!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);\n` });

  files.push({ filename: "_scaffold/tsconfig.json", pageName: "TS Config", route: "",
    code: JSON.stringify({
      compilerOptions: { target: "ES2020", useDefineForClassFields: true, lib: ["ES2020", "DOM", "DOM.Iterable"], module: "ESNext", skipLibCheck: true, moduleResolution: "bundler", allowImportingTsExtensions: true, resolveJsonModule: true, isolatedModules: true, noEmit: true, jsx: "react-jsx", strict: true, noUnusedLocals: false, noUnusedParameters: false, noFallthroughCasesInSwitch: true, baseUrl: ".", paths: { "@/*": ["./src/*"] } },
      include: ["src"],
    }, null, 2) });

  return files;
}
