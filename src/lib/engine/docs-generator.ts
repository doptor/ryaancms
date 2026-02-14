// ============================================================
// Documentation Generator
// Auto-generates README, INSTALL, API, DB_SCHEMA markdown docs
// ============================================================

import type { AppConfig, ApiEndpoint, CollectionConfig } from "./component-registry";
import type { GeneratedSchema } from "./database-generator";
import type { ValidationResult } from "./security-validator";
import type { RBACOutput } from "./rbac-generator";

export interface GeneratedDocs {
  readme: string;
  install: string;
  api: string;
  db_schema: string;
  checklist: Record<string, boolean>;
}

export function generateDocumentation(
  config: AppConfig,
  schema?: GeneratedSchema | null,
  validation?: ValidationResult | null,
  rbac?: RBACOutput | null
): GeneratedDocs {
  return {
    readme: generateReadme(config, validation),
    install: generateInstall(config),
    api: generateApiDocs(config),
    db_schema: generateDbSchemaDocs(config, schema),
    checklist: {
      "README.md": true,
      "INSTALL.md": true,
      "API.md": true,
      "DB_SCHEMA.md": true,
      "SECURITY.md": !!validation,
      "RBAC.md": !!rbac,
    },
  };
}

function generateReadme(config: AppConfig, validation?: ValidationResult | null): string {
  const features = config.features || [];
  const modules = config.modules || [];

  return `# ${config.title}

> ${config.description}

## Overview

**Project Type:** ${config.project_type}
**Tech Stack:** React (Vite) + TailwindCSS + Node.js + Express + Prisma + MySQL
${validation ? `**Security Score:** ${validation.score}/100` : ""}

## Features

${features.map((f) => `- ✅ ${f}`).join("\n")}

## Modules

${modules.map((m) => `- 📦 ${m}`).join("\n")}

## Pages

| Page | Route | Layout | Auth Required |
|------|-------|--------|---------------|
${config.pages.map((p) => `| ${p.name} | \`${p.route}\` | ${p.layout} | ${p.requires_auth ? "Yes" : "No"} |`).join("\n")}

## Database

${config.collections.length} collections defined:
${config.collections.map((c) => `- **${c.name}** (${c.fields.length} fields${c.rls ? ", RLS enabled" : ""}${c.soft_delete ? ", soft-delete" : ""})`).join("\n")}

## Roles

${(config.roles || []).map((r) => `- **${r.name}**: ${r.permissions.join(", ")}`).join("\n") || "- Default user role"}

## Quick Start

\`\`\`bash
git clone <repo-url>
cd ${config.title.toLowerCase().replace(/\s+/g, "-")}
npm install
cp .env.example .env
npx prisma migrate dev
npm run seed
npm run dev
\`\`\`

## Default Credentials

- **Email:** admin@admin.com
- **Password:** admin123

> ⚠️ Change these immediately in production!

## License

MIT
`;
}

function generateInstall(config: AppConfig): string {
  return `# Installation Guide — ${config.title}

## Prerequisites

- Node.js 18+
- MySQL 8+
- npm or yarn

## Step 1: Clone Repository

\`\`\`bash
git clone <repo-url>
cd ${config.title.toLowerCase().replace(/\s+/g, "-")}
\`\`\`

## Step 2: Install Dependencies

\`\`\`bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
\`\`\`

## Step 3: Environment Configuration

\`\`\`bash
cp .env.example .env
\`\`\`

Edit \`.env\` with your values:

\`\`\`env
DATABASE_URL="mysql://root:password@localhost:3306/${config.title.toLowerCase().replace(/\s+/g, "_")}"
JWT_SECRET="your-secret-key-min-32-chars"
PORT=3001
FRONTEND_URL="http://localhost:5173"
${config.modules?.includes("payments") ? 'STRIPE_SECRET_KEY="sk_test_..."' : ""}
${config.modules?.includes("media") ? 'UPLOAD_DIR="./uploads"' : ""}
\`\`\`

## Step 4: Database Setup

\`\`\`bash
npx prisma migrate dev --name init
npx prisma db seed
\`\`\`

## Step 5: Run Development Server

\`\`\`bash
# Backend (terminal 1)
cd backend
npm run dev

# Frontend (terminal 2)
cd frontend
npm run dev
\`\`\`

## Step 6: Access Application

- Frontend: http://localhost:5173
- API: http://localhost:3001/api
- Admin login: admin@admin.com / admin123

## Production Deployment

\`\`\`bash
# Build frontend
cd frontend && npm run build

# Start production server
cd ../backend && NODE_ENV=production npm start
\`\`\`

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Database connection failed | Check DATABASE_URL in .env |
| Port already in use | Change PORT in .env |
| Migration failed | Run \`npx prisma migrate reset\` |
| JWT errors | Ensure JWT_SECRET is set |
`;
}

function generateApiDocs(config: AppConfig): string {
  const endpoints = config.api_endpoints || [];

  // Group by resource
  const groups = new Map<string, ApiEndpoint[]>();
  for (const ep of endpoints) {
    const resource = ep.path.split("/")[2] || "general";
    const group = groups.get(resource) || [];
    group.push(ep);
    groups.set(resource, group);
  }

  // Auto-generate from collections if no explicit endpoints
  if (endpoints.length === 0) {
    for (const col of config.collections) {
      const name = col.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
      const autoEndpoints: ApiEndpoint[] = [
        { method: "GET", path: `/api/${name}`, description: `List all ${col.name}`, auth_required: true },
        { method: "GET", path: `/api/${name}/:id`, description: `Get ${col.name} by ID`, auth_required: true },
        { method: "POST", path: `/api/${name}`, description: `Create ${col.name}`, auth_required: true },
        { method: "PUT", path: `/api/${name}/:id`, description: `Update ${col.name}`, auth_required: true },
        { method: "DELETE", path: `/api/${name}/:id`, description: `Delete ${col.name}`, auth_required: true },
      ];
      groups.set(name, autoEndpoints);
    }
  }

  let doc = `# API Documentation — ${config.title}

## Base URL

\`\`\`
http://localhost:3001/api
\`\`\`

## Authentication

All protected endpoints require a JWT token in the Authorization header:

\`\`\`
Authorization: Bearer <token>
\`\`\`

## Standard Response Format

**Success:**
\`\`\`json
{
  "success": true,
  "message": "ok",
  "data": {}
}
\`\`\`

**Error:**
\`\`\`json
{
  "success": false,
  "message": "Error description",
  "errors": []
}
\`\`\`

## Endpoints

`;

  for (const [resource, eps] of groups) {
    doc += `### ${resource.charAt(0).toUpperCase() + resource.slice(1)}\n\n`;
    doc += `| Method | Path | Description | Auth |\n`;
    doc += `|--------|------|-------------|------|\n`;
    for (const ep of eps) {
      doc += `| \`${ep.method}\` | \`${ep.path}\` | ${ep.description} | ${ep.auth_required ? "🔒 Yes" : "No"} |\n`;
    }
    doc += "\n";
  }

  return doc;
}

function generateDbSchemaDocs(config: AppConfig, schema?: GeneratedSchema | null): string {
  let doc = `# Database Schema — ${config.title}

## Overview

- **Database:** MySQL
- **ORM:** Prisma
- **Tables:** ${config.collections.length}
- **RLS:** ${config.collections.filter((c) => c.rls).length} tables with Row Level Security

## Entity Relationship

\`\`\`
`;

  // Simple text-based ERD
  for (const col of config.collections) {
    const relations = col.fields.filter((f) => f.relation_to);
    doc += `[${col.name}]`;
    if (relations.length > 0) {
      doc += ` --> ${relations.map((r) => `[${r.relation_to}]`).join(", ")}`;
    }
    doc += "\n";
  }

  doc += `\`\`\`

## Tables

`;

  for (const col of config.collections) {
    doc += `### ${col.name}\n\n`;
    doc += `| Field | Type | Required | Unique | Indexed | Default |\n`;
    doc += `|-------|------|----------|--------|---------|--------|\n`;

    // System fields
    doc += `| id | UUID | Yes | Yes | Yes | auto |\n`;
    if (col.rls) doc += `| user_id | UUID | Yes | No | Yes | — |\n`;
    if (col.tenant_isolated) doc += `| tenant_id | UUID | Yes | No | Yes | — |\n`;

    for (const f of col.fields) {
      doc += `| ${f.name} | ${f.type} | ${f.required ? "Yes" : "No"} | ${f.unique ? "Yes" : "No"} | ${f.indexed ? "Yes" : "No"} | ${f.default || "—"} |\n`;
    }

    if (col.audit_fields !== false) {
      doc += `| created_at | timestamp | Yes | No | No | now() |\n`;
      doc += `| updated_at | timestamp | Yes | No | No | now() |\n`;
    }
    if (col.soft_delete) {
      doc += `| deleted_at | timestamp | No | No | No | null |\n`;
    }

    doc += `\n**RLS:** ${col.rls ? "✅ Enabled" : "❌ Disabled"}\n`;
    doc += `**Soft Delete:** ${col.soft_delete ? "Yes" : "No"}\n\n`;
  }

  if (schema?.warnings && schema.warnings.length > 0) {
    doc += `## Warnings\n\n`;
    for (const w of schema.warnings) {
      doc += `- ⚠️ ${w}\n`;
    }
    doc += "\n";
  }

  if (schema?.sql) {
    doc += `## Generated SQL\n\n\`\`\`sql\n${schema.sql.slice(0, 2000)}\n\`\`\`\n`;
  }

  return doc;
}
