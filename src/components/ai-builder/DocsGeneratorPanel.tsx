import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText, Download, Copy, CheckCircle2, Book,
  Database, Shield, Settings, Code, Loader2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { PipelineState } from "@/lib/engine/orchestrator";

interface DocsGeneratorPanelProps {
  pipelineState: PipelineState | null;
}

type DocType = "readme" | "api" | "db_schema" | "install" | "security";

export function DocsGeneratorPanel({ pipelineState }: DocsGeneratorPanelProps) {
  const [activeDoc, setActiveDoc] = useState<DocType>("readme");
  const [copiedDoc, setCopiedDoc] = useState<string | null>(null);

  const config = pipelineState?.config;

  const generateReadme = (): string => {
    if (!config) return "# No project generated yet\n\nBuild a project first to generate documentation.";
    const lines = [
      `# ${config.title}`,
      "",
      `> ${config.description}`,
      "",
      `![Type](https://img.shields.io/badge/type-${config.project_type}-blue) ![Pages](https://img.shields.io/badge/pages-${config.pages.length}-green) ![Collections](https://img.shields.io/badge/collections-${config.collections.length}-orange)`,
      "",
      "## 📋 Overview",
      "",
      `**${config.title}** is a ${config.project_type} application with ${config.modules.length} modules, ${config.pages.length} pages, and ${config.collections.length} database collections.`,
      "",
      "### Modules",
      ...config.modules.map(m => `- ✅ ${m}`),
      "",
      "### Features",
      ...config.features.map(f => `- 🚀 ${f}`),
      "",
      "## 🏗 Tech Stack",
      "",
      "| Layer | Technology |",
      "|-------|-----------|",
      "| Frontend | React + Vite + Tailwind CSS |",
      "| Backend | Node.js + Express |",
      "| ORM | Prisma |",
      "| Database | MySQL / PostgreSQL |",
      "| Auth | JWT (1-day expiry) |",
      "",
      "## 📄 Pages",
      "",
      ...config.pages.map(p => `### ${p.name} (\`${p.route}\`)${p.requires_auth ? " 🔒" : ""}\n- Components: ${p.components.map(c => c.type).join(", ")}\n`),
      "## 👥 Roles",
      "",
      ...(config.roles?.map(r => `- **${r.name}**: ${r.permissions.join(", ")}`) || ["No roles defined"]),
      "",
      "## 🚀 Quick Start",
      "",
      "```bash",
      "# Clone the repository",
      "git clone <repo-url>",
      "cd " + (config.title?.toLowerCase().replace(/\s+/g, "-") || "project"),
      "",
      "# Install dependencies",
      "cd frontend && npm install",
      "cd ../backend && npm install",
      "",
      "# Set up environment",
      "cp .env.example .env",
      "",
      "# Run migrations",
      "npx prisma migrate dev",
      "",
      "# Start development",
      "npm run dev",
      "```",
      "",
      "## 📝 License",
      "",
      "MIT © " + new Date().getFullYear(),
    ];
    return lines.join("\n");
  };

  const generateApiDocs = (): string => {
    if (!config) return "# API Documentation\n\nNo project generated yet.";
    const endpoints = pipelineState?.apiEndpoints || [];
    const lines = [
      `# ${config.title} — API Documentation`,
      "",
      "## Base URL",
      "",
      "```",
      "http://localhost:3000/api/v1",
      "```",
      "",
      "## Authentication",
      "",
      "All protected endpoints require a Bearer token:",
      "```",
      "Authorization: Bearer <jwt_token>",
      "```",
      "",
      "## Response Format",
      "",
      "```json",
      '{',
      '  "success": true,',
      '  "message": "Operation successful",',
      '  "data": {}',
      '}',
      "```",
      "",
      "## Endpoints",
      "",
    ];

    if (endpoints.length > 0) {
      endpoints.forEach((ep: any) => {
        lines.push(`### \`${ep.method || "GET"} ${ep.path || ep.route || "/api/unknown"}\``);
        lines.push("");
        if (ep.description) lines.push(ep.description);
        if (ep.auth) lines.push("🔒 **Requires authentication**");
        lines.push("");
      });
    } else {
      config.collections.forEach(col => {
        const name = col.name.toLowerCase();
        lines.push(`### ${col.name} CRUD`);
        lines.push("");
        lines.push(`| Method | Path | Description |`);
        lines.push(`|--------|------|-------------|`);
        lines.push(`| GET | \`/api/v1/${name}\` | List all ${name} |`);
        lines.push(`| GET | \`/api/v1/${name}/:id\` | Get single ${name} |`);
        lines.push(`| POST | \`/api/v1/${name}\` | Create ${name} |`);
        lines.push(`| PUT | \`/api/v1/${name}/:id\` | Update ${name} |`);
        lines.push(`| DELETE | \`/api/v1/${name}/:id\` | Delete ${name} |`);
        lines.push("");
      });
    }

    return lines.join("\n");
  };

  const generateDbSchema = (): string => {
    if (!config) return "# Database Schema\n\nNo project generated yet.";
    const lines = [
      `# ${config.title} — Database Schema`,
      "",
      `Total collections: **${config.collections.length}**`,
      "",
    ];

    config.collections.forEach(col => {
      lines.push(`## ${col.name}`);
      lines.push("");
      lines.push("| Column | Type | Required | Notes |");
      lines.push("|--------|------|----------|-------|");
      col.fields.forEach(f => {
        lines.push(`| \`${f.name}\` | ${f.type} | ${f.required ? "✅" : "❌"} | ${f.unique ? "Unique" : ""} |`);
      });
      lines.push("");
      if (col.rls) lines.push("🔐 **Row Level Security enabled**\n");
    });

    if (pipelineState?.prismaSchemaHint) {
      lines.push("## Prisma Schema Hint");
      lines.push("");
      lines.push("```prisma");
      lines.push(pipelineState.prismaSchemaHint);
      lines.push("```");
    }

    return lines.join("\n");
  };

  const generateInstallGuide = (): string => {
    if (!config) return "# Installation Guide\n\nNo project generated yet.";
    const steps = pipelineState?.installerSteps || [];
    const lines = [
      `# ${config.title} — Installation Guide`,
      "",
      "## Prerequisites",
      "",
      "- Node.js >= 18",
      "- MySQL 8+ or PostgreSQL 14+",
      "- npm or yarn",
      "",
      "## Step-by-Step Setup",
      "",
    ];

    if (steps.length > 0) {
      steps.forEach((step, i) => {
        lines.push(`### Step ${i + 1}: ${step}`);
        lines.push("");
      });
    } else {
      lines.push(
        "### 1. Clone & Install",
        "",
        "```bash",
        "git clone <repo-url>",
        "npm install",
        "```",
        "",
        "### 2. Environment Configuration",
        "",
        "```env",
        "DATABASE_URL=mysql://user:pass@localhost:3306/dbname",
        "JWT_SECRET=your-secret-key",
        "PORT=3000",
        "```",
        "",
        "### 3. Database Setup",
        "",
        "```bash",
        "npx prisma migrate dev --name init",
        "npx prisma db seed",
        "```",
        "",
        "### 4. Start Application",
        "",
        "```bash",
        "npm run dev",
        "```",
        "",
      );
    }

    const creds = pipelineState?.defaultAdminCredentials;
    if (creds) {
      lines.push("## Default Admin Credentials");
      lines.push("");
      lines.push(`- **Email:** \`${creds.email}\``);
      lines.push(`- **Password:** \`${creds.password}\``);
      lines.push("");
      lines.push("> ⚠️ Change these immediately after first login!");
    }

    return lines.join("\n");
  };

  const generateSecurityDoc = (): string => {
    if (!config) return "# Security Report\n\nNo project generated yet.";
    const v = pipelineState?.validation;
    const checklist = pipelineState?.securityChecklist || {};
    const lines = [
      `# ${config.title} — Security Report`,
      "",
      v ? `## Score: ${v.score}/100` : "## Score: N/A",
      "",
      "## Security Checklist",
      "",
      ...Object.entries(checklist).map(([k, v]) => `- [${v ? "x" : " "}] ${k}`),
      ...(Object.keys(checklist).length === 0 ? [
        "- [ ] RLS enabled on all tables",
        "- [ ] JWT authentication configured",
        "- [ ] Input validation (Zod)",
        "- [ ] Rate limiting",
        "- [ ] CORS configuration",
        "- [ ] SQL injection prevention",
      ] : []),
      "",
    ];

    if (v) {
      if (v.errors.length > 0) {
        lines.push("## ❌ Errors");
        lines.push("");
        v.errors.forEach(e => lines.push(`- **${e.category || "General"}**: ${e.message}`));
        lines.push("");
      }
      if (v.warnings.length > 0) {
        lines.push("## ⚠️ Warnings");
        lines.push("");
        v.warnings.forEach(w => lines.push(`- ${w.message}`));
        lines.push("");
      }
    }

    return lines.join("\n");
  };

  const docGenerators: Record<DocType, { label: string; icon: any; generate: () => string }> = {
    readme: { label: "README.md", icon: Book, generate: generateReadme },
    api: { label: "API.md", icon: Code, generate: generateApiDocs },
    db_schema: { label: "DB_SCHEMA.md", icon: Database, generate: generateDbSchema },
    install: { label: "INSTALL.md", icon: Settings, generate: generateInstallGuide },
    security: { label: "SECURITY.md", icon: Shield, generate: generateSecurityDoc },
  };

  const currentDoc = docGenerators[activeDoc];
  const content = currentDoc.generate();

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopiedDoc(activeDoc);
    setTimeout(() => setCopiedDoc(null), 2000);
    toast({ title: "Copied!", description: `${currentDoc.label} copied to clipboard.` });
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = currentDoc.label;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded", description: `${currentDoc.label} saved.` });
  };

  const handleDownloadAll = () => {
    Object.entries(docGenerators).forEach(([, doc]) => {
      const blob = new Blob([doc.generate()], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.label;
      a.click();
      URL.revokeObjectURL(url);
    });
    toast({ title: "All docs downloaded", description: "5 documentation files saved." });
  };

  const docChecklist = pipelineState?.documentationChecklist || {};

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Documentation Generator</span>
          <Badge variant="secondary" className="text-[10px]">5 docs</Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1 h-7 text-xs">
            {copiedDoc === activeDoc ? <CheckCircle2 className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
            Copy
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDownload} className="gap-1 h-7 text-xs">
            <Download className="w-3 h-3" /> Save
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadAll} className="gap-1 h-7 text-xs">
            <Download className="w-3 h-3" /> All
          </Button>
        </div>
      </div>

      {/* Doc tabs */}
      <div className="px-4 py-2 border-b border-border bg-card/50 shrink-0">
        <Tabs value={activeDoc} onValueChange={(v) => setActiveDoc(v as DocType)}>
          <TabsList className="bg-transparent h-8 p-0 gap-1">
            {Object.entries(docGenerators).map(([key, doc]) => {
              const Icon = doc.icon;
              const isChecked = docChecklist[doc.label];
              return (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md px-2.5 py-1 text-[11px] gap-1"
                >
                  <Icon className="w-3 h-3" />
                  {doc.label}
                  {isChecked && <CheckCircle2 className="w-2.5 h-2.5 text-primary" />}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 min-h-0">
        <pre className="p-4 text-xs font-mono text-foreground whitespace-pre-wrap break-words leading-relaxed">
          {content}
        </pre>
      </ScrollArea>
    </div>
  );
}
