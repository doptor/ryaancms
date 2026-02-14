import { useState } from "react";
import { Link } from "react-router-dom";
import { Zap, ChevronRight, ChevronDown, Menu, X, ArrowLeft, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface DocSection {
  id: string;
  title: string;
  children?: { id: string; title: string }[];
}

const docMenu: DocSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    children: [
      { id: "introduction", title: "Introduction" },
      { id: "installation", title: "Installation" },
      { id: "quick-start", title: "Quick Start" },
    ],
  },
  {
    id: "dashboard",
    title: "Dashboard",
    children: [
      { id: "overview", title: "Overview" },
      { id: "navigation", title: "Navigation" },
    ],
  },
  {
    id: "schema-architect",
    title: "Schema Architect",
    children: [
      { id: "schema-overview", title: "Overview" },
      { id: "creating-schemas", title: "Creating Schemas" },
      { id: "ai-schema-generation", title: "AI Schema Generation" },
      { id: "relationships", title: "Relationships" },
      { id: "schema-deployment", title: "Deployment & Versioning" },
    ],
  },
  {
    id: "ai-builder",
    title: "AI Builder",
    children: [
      { id: "ai-builder-overview", title: "Overview" },
      { id: "ten-agent-pipeline", title: "10-Agent Pipeline" },
      { id: "master-system-prompt", title: "Master System Prompt" },
      { id: "autonomous-build-loop", title: "Autonomous Build Loop" },
      { id: "enterprise-data", title: "Enterprise Data & Summary" },
      { id: "content-generation", title: "Content Generation" },
      { id: "seo-optimization", title: "SEO Optimization" },
      { id: "github-deploy", title: "GitHub Deploy" },
      { id: "project-export", title: "Project Export" },
      { id: "approval-workflows", title: "Approval Workflows" },
      { id: "build-analytics", title: "Build Analytics" },
      { id: "live-preview", title: "Live Sandboxed Preview" },
      { id: "theme-selector", title: "Theme Selector" },
      { id: "build-summary", title: "Build Summary Panel" },
      { id: "auto-fix-loop", title: "Auto-Fix Loop" },
      { id: "plugin-generator", title: "Plugin Generator Wizard" },
    ],
  },
  {
    id: "ai-integrations",
    title: "AI Integrations",
    children: [
      { id: "ai-integrations-overview", title: "Overview" },
      { id: "connecting-providers", title: "Connecting Providers" },
      { id: "model-selection", title: "Model Selection" },
    ],
  },
  {
    id: "marketplace",
    title: "Marketplace",
    children: [
      { id: "marketplace-overview", title: "Overview" },
      { id: "installing-plugins", title: "Installing Plugins" },
      { id: "plugin-management", title: "Plugin Management" },
    ],
  },
  {
    id: "installer",
    title: "Installer",
    children: [
      { id: "installer-overview", title: "Overview" },
      { id: "one-click-install", title: "One-Click Install" },
    ],
  },
  {
    id: "settings",
    title: "Settings",
    children: [
      { id: "general-settings", title: "General" },
      { id: "security-settings", title: "Security" },
      { id: "notification-settings", title: "Notifications" },
      { id: "appearance-settings", title: "Appearance" },
      { id: "database-settings", title: "Database" },
    ],
  },
  {
    id: "authentication",
    title: "Authentication",
    children: [
      { id: "auth-overview", title: "Overview" },
      { id: "sign-up-login", title: "Sign Up & Login" },
      { id: "protected-routes", title: "Protected Routes" },
    ],
  },
  {
    id: "architecture",
    title: "Architecture",
    children: [
      { id: "tri-core", title: "Tri-Core Design" },
      { id: "the-mirror", title: "The Mirror (UI)" },
      { id: "the-pulse", title: "The Pulse (API)" },
      { id: "the-vault", title: "The Vault (Data)" },
    ],
  },
];

const docContent: Record<string, { title: string; content: string }> = {
  introduction: {
    title: "Introduction",
    content: `**RyaanCMS** is a free, open-source, AI-native Content Management System designed to replace traditional CMSs that haven't kept up with modern development needs.

### Why RyaanCMS?

- **AI-First**: Schema generation, content creation, and SEO powered by AI
- **Open Source**: MIT licensed, community driven, forever free
- **Modern Stack**: Built on React, TypeScript, and edge-native APIs
- **Plugin Ecosystem**: Extend with sandboxed plugins from the Marketplace
- **Enterprise Ready**: SSO, MFA, field-level permissions, and audit logs

### Key Features

| Feature | Description |
|---------|-------------|
| Schema Architect | Visual data modeling with AI assistance |
| AI Builder | AI-powered content and layout generation |
| Marketplace | One-click plugin and template installation |
| Edge APIs | Auto-generated REST & GraphQL endpoints |
| Visual Builder | Drag-and-drop page construction |`,
  },
  installation: {
    title: "Installation",
    content: `### Prerequisites

- Node.js 18+ or Bun
- A modern browser (Chrome, Firefox, Safari, Edge)

### Quick Install

1. Visit the RyaanCMS landing page
2. Click **"Get Started"** or **"Launch Dashboard"**
3. Create an account or sign in
4. You're ready to build!

### Self-Hosted (Coming Soon)

For self-hosted deployments, the installer page provides a guided setup:

1. Navigate to **Dashboard → Installer**
2. Follow the step-by-step wizard
3. Configure your database and environment
4. Deploy with one click`,
  },
  "quick-start": {
    title: "Quick Start",
    content: `### Your First 5 Minutes

1. **Sign up** at the Auth page
2. **Open the Dashboard** — you'll see the overview with stats and quick actions
3. **Create a Schema** — go to Settings → Schema tab to define your first content model
4. **Generate with AI** — use the AI Builder to create content automatically
5. **Install a Plugin** — visit the Marketplace and install your first plugin

### Dashboard Navigation

Use the sidebar to navigate between sections:
- **Overview**: Stats, recent activity, quick actions
- **AI Builder**: Generate content with AI
- **Marketplace**: Browse and install plugins
- **Installer**: System setup and deployment
- **Settings**: Configure all aspects of your CMS`,
  },
  overview: {
    title: "Dashboard Overview",
    content: `The Dashboard is your command center for managing everything in RyaanCMS.

### What You'll See

- **Statistics Cards**: Total collections, active plugins, API requests, and uptime
- **Recent Activity**: Latest changes across your CMS
- **Quick Actions**: Shortcuts to common tasks

### Navigation

The sidebar provides access to all major sections. On desktop, it auto-collapses and expands on hover. On mobile, use the hamburger menu.`,
  },
  navigation: {
    title: "Navigation",
    content: `### Desktop Sidebar

The sidebar collapses to icons when not hovered. Hover to expand and see full labels.

**Sections:**
- Overview — Dashboard home
- AI Builder — Content generation
- Marketplace — Plugins & templates
- Installer — Setup & deployment
- Settings — Configuration

### Mobile Navigation

Tap the menu icon (☰) to open the full navigation overlay. Tap any item to navigate, or tap outside to close.

### Back to Site

Use the "Back to Site" link at the bottom of the sidebar to return to the landing page.`,
  },
  "schema-overview": {
    title: "Schema Architect — Overview",
    content: `The Schema Architect is your visual tool for designing content models (collections).

### What is a Schema?

A schema defines the structure of your content — the fields, types, relationships, and validation rules for each collection (e.g., Blog Posts, Products, Users).

### Key Capabilities

- **Visual Builder**: Drag-and-drop field creation
- **AI Generation**: Describe your model in plain English, get a schema instantly
- **Relationship Mapping**: Define links between collections
- **Versioning**: Every schema change is versioned with rollback support
- **Zero-Downtime Deployment**: Deploy schema changes without service interruption`,
  },
  "creating-schemas": {
    title: "Creating Schemas",
    content: `### Manual Creation

1. Go to **Settings → Schema** tab
2. Click **"Add Collection"**
3. Name your collection (e.g., "Blog Posts")
4. Add fields with types (text, number, date, relation, etc.)
5. Configure validation rules
6. Save and deploy

### Field Types

| Type | Description |
|------|-------------|
| Text | Single or multi-line text |
| Number | Integer or decimal values |
| Boolean | True/false toggle |
| Date | Date and time picker |
| Media | Image, video, or file upload |
| Relation | Link to another collection |
| JSON | Flexible structured data |
| Enum | Predefined list of options |`,
  },
  "ai-schema-generation": {
    title: "AI Schema Generation",
    content: `### How It Works

1. Open the Schema Architect
2. Click **"Generate with AI"**
3. Describe your content model in plain English:
   - *"Create a blog with posts, categories, and tags"*
   - *"E-commerce product catalog with variants and pricing"*
4. AI generates the complete schema with fields, types, and relationships
5. Review, customize, and deploy

### Tips for Best Results

- Be specific about field requirements
- Mention relationships between models
- Specify any validation rules needed
- Include example data if helpful`,
  },
  relationships: {
    title: "Relationships",
    content: `### Relationship Types

- **One-to-One**: A user has one profile
- **One-to-Many**: A blog post has many comments
- **Many-to-Many**: Posts can have many tags, tags can have many posts

### Defining Relationships

1. Add a "Relation" field to your schema
2. Select the target collection
3. Choose the relationship type
4. Configure cascade behavior (delete, update)

### Visual Mapping

The Schema Architect shows relationships as connecting lines between collections, making it easy to understand your data model at a glance.`,
  },
  "schema-deployment": {
    title: "Deployment & Versioning",
    content: `### Version Control

Every schema change creates a new version. You can:
- View the full history of changes
- Compare versions side by side
- Roll back to any previous version

### Zero-Downtime Deployment

Schema changes are deployed with zero downtime:
1. New schema is validated
2. Migration is generated automatically
3. Database is updated without service interruption
4. API endpoints are refreshed
5. Rollback is available if needed`,
  },
  "ai-builder-overview": {
    title: "AI Builder — Overview",
    content: `The AI Builder is RyaanCMS's flagship feature — a **10-agent autonomous pipeline** that generates complete, production-ready applications from a single prompt.

### Capabilities

- **10 Specialized AI Agents** working in sequence to plan, design, build, test, and review
- **Master System Prompt** governing all agents for consistent, enterprise-grade output
- **Autonomous Build Loop** with auto-retry and error-fix memory
- **Live Sandboxed Preview** with hot-reload and console output
- **Enterprise Data** including admin credentials, documentation plan, security checklist
- **Code Generation** with downloadable React + Express project files
- **GitHub Deploy** and **Approval Workflows**

### How to Access

Navigate to **Dashboard → AI Builder** from the sidebar.`,
  },
  "ten-agent-pipeline": {
    title: "10-Agent Autonomous Pipeline",
    content: `The AI Builder runs **10 specialized agents** in sequence to build your app:

### Agent Roster

| # | Agent | Responsibility |
|---|-------|---------------|
| 1 | **Requirement Analyst** | Converts prompt into FRS/SRS, asks smart questions if needed |
| 2 | **Product Manager** | Defines modules, user stories, roles & workflows |
| 3 | **Task Planner** | Creates structured task plan with dependencies & complexity |
| 4 | **System Architect** | Designs folder structure, API patterns & reusable components |
| 5 | **Database Agent** | Generates MySQL/Prisma schema, migrations & seed data |
| 6 | **Backend Agent** | Builds Express server, routes, controllers & RBAC |
| 7 | **UI/UX Designer** | Creates page layouts, forms, tables & responsive design |
| 8 | **Testing Agent** | Generates test scenarios & validates main flows |
| 9 | **Debugger Agent** | Auto-detects & fixes build errors with retry loop |
| 10 | **Quality Reviewer** | Scores UI, Backend, Security & Performance (target 90+) |

### Pipeline Flow

Each agent receives the output of previous agents and adds its own structured contribution. The entire pipeline runs autonomously — no manual intervention required.

### Smart Requirement Mode

For common app types, agents auto-populate standard features:
- **CRM**: customers, leads, deals pipeline, notes, tasks, follow-ups
- **E-commerce**: products, cart, checkout, orders, inventory
- **SaaS**: auth, subscriptions, dashboard, billing, admin panel`,
  },
  "master-system-prompt": {
    title: "Master System Prompt",
    content: `The **Master System Prompt** is an enterprise-grade governance layer that controls all 10 agents.

### What It Enforces

- **Fixed Tech Stack**: React (Vite) + TailwindCSS frontend, Node.js + Express + Prisma + MySQL backend
- **Standard API Response Format**: All APIs return \`{success, message, data}\` or \`{success, message, errors}\`
- **Security Protocols**: bcrypt hashing, JWT auth, Zod validation, RBAC middleware
- **Folder Structure**: Strict \`frontend/\` + \`backend/\` separation with organized sub-folders
- **Code Quality**: Service layer separation, reusable components, pagination, audit logs

### Global Rules

1. Always create a complete working project, not partial code snippets
2. Never assume user knows coding — everything automated
3. Every module includes UI, API, DB schema, validation, error handling
4. Always generate seed demo data and default admin login
5. Must include installer-like setup for environment config
6. Must store all progress into Project Memory JSON

### Enterprise Quality Rules

- Service layer separation (no spaghetti code)
- Reusable UI components (Card, Table, Modal, Form)
- Responsive layout for all pages
- Pagination for large tables
- Access control with role-based middleware
- Audit logs table for enterprise apps`,
  },
  "autonomous-build-loop": {
    title: "Autonomous Build Loop",
    content: `The AI Builder uses an **autonomous retry loop** to ensure every build succeeds.

### Loop Flow

\`\`\`
PLAN → GENERATE → RUN → FAIL? → FIX → RETRY → SUCCESS
\`\`\`

### How It Works

1. **PLAN**: Agents analyze requirements and create task plan
2. **GENERATE**: Code, schema, and configuration are generated
3. **RUN**: Build commands execute (npm install, prisma generate, npm run build)
4. **FAIL?**: If any command fails, error logs are captured
5. **FIX**: Debugger agent analyzes logs and patches code
6. **RETRY**: Process repeats (up to 5 retries)
7. **SUCCESS**: Stops when backend runs, frontend builds, auth works, UI loads

### Error Fix Memory

When a build error is fixed, the system saves:
- **Error signature** — the error pattern
- **Fix applied** — what was changed
- **File changes** — which files were modified

Future builds use this memory to fix known errors instantly.

### Quality Gate

After success, the Quality Reviewer agent scores the build:
- UI completeness score
- Backend completeness score
- Security score
- Test coverage score

If the overall score is **below 90%**, an improvement loop runs automatically.`,
  },
  "enterprise-data": {
    title: "Enterprise Data & Summary",
    content: `After a successful build, the AI Builder displays a comprehensive **enterprise summary** in the chat.

### Summary Sections

| Section | Description |
|---------|-------------|
| **Task Plan** | Numbered steps with name, description, and complexity |
| **Pages** | All generated pages with routes, components, and layouts |
| **Database** | Collections with field counts, RLS, and tenant isolation |
| **API Endpoints** | REST endpoints with methods and descriptions |
| **Test Scenarios** | Generated test cases with types and modules |
| **Bugs Found & Fixed** | Auto-detected issues with severity and applied fixes |
| **Roles** | User roles with their permissions |
| **Quality Score** | UI, Backend, Security, and Test scores out of 100 |

### Enterprise-Specific Data

| Data | Description |
|------|-------------|
| **Default Admin Credentials** | Pre-configured email and password for first login |
| **Documentation Plan** | List of auto-generated docs (README, INSTALL, API, DB_SCHEMA) |
| **Documentation Checklist** | Status of each documentation file |
| **Security Checklist** | Verification of security requirements (bcrypt, JWT, CORS, etc.) |
| **Installer Steps** | Step-by-step deployment instructions |
| **Error Fix Memory** | History of errors encountered and fixes applied |
| **Plugin Hooks** | Available extension points for plugin integration |
| **Reusable Components** | List of shared UI components in the project |

### Accessing Enterprise Data

All enterprise data is visible in the build summary message in the AI Builder chat after a successful pipeline run. It's also stored in the project memory for future reference.`,
  },
  "live-preview": {
    title: "Live Sandboxed Preview",
    content: `The **Live Preview** tab renders your generated React code in a real sandboxed iframe.

### Features

- **Sandboxed Execution**: Code runs in an isolated iframe with Babel transpilation
- **Hot Reload**: Changes in the Code tab automatically refresh the preview
- **Responsive Viewports**: Switch between Mobile (375px), Tablet (768px), and Desktop (1280px)
- **Console Output**: Captures console.log, warnings, and errors from the preview
- **Fullscreen Mode**: Expand the preview to full browser width

### How It Works

1. Generate code in the AI Builder (click "Generate Code")
2. Switch to the **Live** tab
3. Your React components render in a sandboxed iframe
4. Edit code in the **Code** tab — preview updates automatically
5. Check the console panel below for errors or logs

### Console Panel

The collapsible console shows:
- 🔵 **Info** logs (console.log)
- 🟡 **Warning** messages (console.warn)
- 🔴 **Error** messages (console.error)
- Timestamps and message count badges`,
  },
  "content-generation": {
    title: "Content Generation",
    content: `### Generating Content

1. Open **AI Builder**
2. Select the content type (blog post, product page, etc.)
3. Provide a prompt or topic
4. AI generates draft content
5. Review, edit, and publish

### Prompt Tips

- Be specific about tone and audience
- Mention key points to cover
- Specify word count or length preference
- Reference your brand voice guidelines`,
  },
  "seo-optimization": {
    title: "SEO Optimization",
    content: `### AI-Powered SEO

- **Meta Tags**: Auto-generated title and description
- **Alt Text**: AI writes descriptive alt text for images
- **Structured Data**: JSON-LD generation for rich search results
- **Keyword Analysis**: Suggestions for keyword placement
- **Readability Score**: Content readability assessment

### Best Practices

- Review AI suggestions before publishing
- Customize meta descriptions for each page
- Use semantic HTML headings (H1, H2, H3)
- Ensure images have descriptive alt text`,
  },
  "github-deploy": {
    title: "GitHub Deploy",
    content: `### Push to GitHub

The AI Builder can push generated configurations directly to a GitHub repository via the **Deploy** tab.

### How It Works

1. Generate your app configuration in the AI Builder
2. Switch to the **Deploy** tab
3. Select **Push to GitHub**
4. Enter a repository name (e.g., \`my-saas-app\`)
5. Click **Push to GitHub**

### What Gets Pushed

| File | Description |
|------|-------------|
| config.json | Full application configuration |
| schema.sql | Database migration SQL |
| README.md | Auto-generated project documentation |
| .ryaancms/metadata.json | Build metadata and versioning |

### Requirements

- A valid **GITHUB_TOKEN** must be configured in your backend secrets
- The token needs \`repo\` scope permissions
- If the repository doesn't exist, it will be created automatically`,
  },
  "project-export": {
    title: "Project Export",
    content: `### Download Project Files

Export your AI-generated project as downloadable files for local development.

### Available Downloads

- **config.json** — Complete application configuration
- **schema.sql** — Database migration SQL
- **README.md** — Project documentation
- **setup.sh** — Quick setup script for local development

### Download All

Click **Download All** to get all files at once. Each file downloads individually with the project name prefix.

### Local Setup

After downloading, run the setup script and apply the database schema.`,
  },
  "approval-workflows": {
    title: "Approval Workflows",
    content: `### Submit for Review

Before deploying, you can submit configurations for team review.

### How It Works

1. Generate your app in the AI Builder
2. Go to the **Deploy** tab → **Submit for Approval**
3. Navigate to **Dashboard → Approvals** to manage reviews

### Review Process

- **Pending**: Awaiting review
- **Approved**: Ready for deployment
- **Rejected**: Needs changes

### Access

Navigate to \`/dashboard/approvals\` from the dashboard.`,
  },
  "build-analytics": {
    title: "Build Analytics",
    content: `### Track Your Builds

The Build Analytics dashboard provides insights into AI Builder usage.

### Metrics

| Metric | Description |
|--------|-------------|
| Total Builds | Number of AI generations |
| Success Rate | Percentage of successful builds |
| Avg Security Score | Average security validation score |
| Total Components | All components generated |

### Component Usage

See which component types are most frequently generated with visual bar charts.

### Access

Navigate to \`/dashboard/analytics\` from the dashboard.`,
  },
  "ai-integrations-overview": {
    title: "AI Integrations — Overview",
    content: `Manage your AI platform connections from **Settings → AI Integrations**.

### Supported Providers

RyaanCMS supports **11 AI providers** out of the box:

| Provider | Models | Best For |
|----------|--------|----------|
| OpenAI | GPT-5, GPT-4.1, o3, DALL-E 3 | General content, coding, images |
| Google Gemini | Gemini 2.5 Pro/Flash, Gemma 3 | Multimodal, large context |
| Anthropic | Claude Sonnet 4, Claude 3.5 | Long-form, analysis |
| Mistral AI | Mistral Large, Codestral | European AI, coding |
| Cohere | Command R+, Embed v4 | RAG, embeddings, reranking |
| Meta (Llama) | Llama 4 Scout/Maverick, Llama 3.3 | Open-source, self-hosted |
| DeepSeek | DeepSeek Chat, Reasoner | Cost-effective reasoning |
| Groq | Llama 3.3 70B, Gemma2 9B | Ultra-fast inference |
| Perplexity | Sonar Pro, Deep Research | Search-augmented AI |
| xAI (Grok) | Grok 3, Grok 2 Vision | Multimodal, real-time |
| Custom | Any model | OpenAI-compatible endpoints |

### Configuration

Each integration requires:
1. A **name** for identification
2. **Provider** selection (models auto-populate)
3. **API key** from the provider
4. **API endpoint** (auto-filled per provider)`,
  },
  "connecting-providers": {
    title: "Connecting Providers",
    content: `### Adding a New Provider

1. Go to **Settings → AI Integrations**
2. Click **"Add Integration"**
3. Select the provider — models and endpoint are auto-filled
4. Enter a name for the integration
5. Enter your API key
6. Choose a model from the auto-populated list
7. Click **"Create"**

### Getting API Keys

Each provider has step-by-step instructions built into the dialog. Click **"How to get your API key"** to expand the guide with:
- Step-by-step instructions
- Direct link to the provider's API key dashboard
- Notes about pricing and free tiers

### Managing Keys

- API keys are stored securely and encrypted
- You can update or rotate keys at any time
- Usage is tracked per integration`,
  },
  "model-selection": {
    title: "Model Selection",
    content: `### Available Models

Each provider offers multiple models optimized for different tasks:

| Provider | Models | Best For |
|----------|--------|----------|
| OpenAI | GPT-4, GPT-3.5 | General content, coding |
| Google | Gemini Pro, Flash | Multimodal, fast responses |
| Anthropic | Claude 3 | Long-form, analysis |

### Choosing the Right Model

- **Speed**: Flash/Lite models for quick tasks
- **Quality**: Pro models for important content
- **Cost**: Balance quality vs. API costs
- **Context**: Larger models for complex documents`,
  },
  "marketplace-overview": {
    title: "Marketplace — Overview",
    content: `The Marketplace is your one-stop shop for plugins, templates, and extensions.

### Browse & Discover

- **Categories**: SEO, E-commerce, Analytics, Social, AI, and more
- **Ratings & Reviews**: Community feedback on each plugin
- **Install Count**: See popularity at a glance
- **Compatibility**: Verified for your CMS version

### Access

Navigate to **Dashboard → Marketplace** from the sidebar.`,
  },
  "installing-plugins": {
    title: "Installing Plugins",
    content: `### One-Click Install

1. Browse the **Marketplace**
2. Find a plugin you want
3. Click **"Install"**
4. The plugin is downloaded, verified, and activated
5. Configure in **Settings** if needed

### Security

All plugins are:
- Sandboxed for security
- Scanned for vulnerabilities
- Version-controlled
- Reversible (uninstall anytime)`,
  },
  "plugin-management": {
    title: "Plugin Management",
    content: `### Managing Installed Plugins

- **Enable/Disable**: Toggle plugins on or off without uninstalling
- **Update**: One-click updates when new versions are available
- **Configure**: Per-plugin settings and preferences
- **Uninstall**: Completely remove a plugin and its data

### Plugin Dependencies

The system automatically resolves dependencies between plugins. If Plugin A requires Plugin B, both will be installed together.`,
  },
  "installer-overview": {
    title: "Installer — Overview",
    content: `The Installer provides a guided setup for deploying RyaanCMS.

### What It Does

- System requirements check
- Database configuration
- Environment setup
- Initial admin account creation
- First-run wizard`,
  },
  "one-click-install": {
    title: "One-Click Install",
    content: `### Deployment Steps

1. Navigate to **Dashboard → Installer**
2. The system checks prerequisites
3. Configure your database connection
4. Set up your admin account
5. Choose your initial theme and plugins
6. Click **"Deploy"**
7. Your CMS is ready!

### Supported Environments

- Cloud-hosted (recommended)
- Self-hosted VPS
- Docker containers
- Serverless platforms`,
  },
  "general-settings": {
    title: "General Settings",
    content: `### Configuration Options

- **Site Name**: Your CMS instance name displayed across the platform
- **Site URL**: The primary URL of your site
- **Timezone**: System timezone for dates and scheduling
- **Language**: Default interface language (100+ languages supported)

### How to Access

Navigate to **Settings → General** tab.

Each setting saves independently — click **"Save General"** to persist changes.`,
  },
  "security-settings": {
    title: "Security Settings",
    content: `### Available Options

- **SSO (Single Sign-On)**: Enable external authentication providers
- **MFA (Multi-Factor Auth)**: Require two-factor authentication
- **API Key**: Manage your API access key

### Best Practices

- Always enable MFA for admin accounts
- Rotate API keys regularly
- Use SSO for team environments
- Review access logs periodically`,
  },
  "notification-settings": {
    title: "Notification Settings",
    content: `### Notification Channels

- **Email**: Receive updates via email
- **Webhooks**: Send events to external URLs
- **In-App**: Show notifications in the dashboard

### Webhook Configuration

1. Enable webhook notifications
2. Enter your webhook URL
3. Select events to trigger
4. Save and test`,
  },
  "appearance-settings": {
    title: "Appearance Settings",
    content: `### Customization Options

- **Dark/Light Mode**: Toggle between themes
- **Primary Color**: Main brand color for buttons and links
- **Accent Color**: Secondary color for gradients and highlights
- **Heading Font**: Typography for headings (18+ font options)
- **Body Font**: Typography for body text
- **Custom CSS**: Inject custom CSS rules for advanced styling

### Live Preview

Color and font changes show a live preview in the settings panel before saving.`,
  },
  "database-settings": {
    title: "Database Settings",
    content: `### Management Options

- **Auto Backup**: Enable daily automatic backups
- **Backup Path**: Configure where backups are stored
- **Export**: Download your entire database
- **Restore**: Restore from a previous backup

### Backup Best Practices

- Enable auto-backup for production sites
- Keep at least 7 days of backup history
- Test restores periodically
- Store backups in a separate location`,
  },
  "auth-overview": {
    title: "Authentication — Overview",
    content: `RyaanCMS includes a built-in authentication system.

### Features

- Email/password sign up and login
- Email verification
- Protected routes (dashboard requires authentication)
- Session management
- Secure sign out`,
  },
  "sign-up-login": {
    title: "Sign Up & Login",
    content: `### Creating an Account

1. Visit the **Auth page** (/auth)
2. Switch to **Sign Up** mode
3. Enter your email and password
4. Verify your email address
5. Sign in with your credentials

### Logging In

1. Visit **/auth**
2. Enter your email and password
3. Click **"Sign In"**
4. You'll be redirected to the Dashboard`,
  },
  "protected-routes": {
    title: "Protected Routes",
    content: `### How It Works

All dashboard routes are wrapped in a \`ProtectedRoute\` component that:

1. Checks if a user session exists
2. Redirects to **/auth** if not authenticated
3. Renders the protected content if authenticated

### Protected Pages

- /dashboard
- /dashboard/ai
- /dashboard/marketplace
- /dashboard/installer
- /dashboard/settings

### Public Pages

- / (Landing page)
- /auth (Authentication)
- /docs (Documentation)`,
  },
  "tri-core": {
    title: "Tri-Core Architecture",
    content: `RyaanCMS is built on a tri-core architecture with three distinct layers:

### 1. The Mirror (Visual + Realtime UI)
Frontend layer for drag-and-drop building, live preview, and collaborative editing.

### 2. The Pulse (API + Distribution)
Middleware for auto-generated REST/GraphQL APIs, edge caching, and webhooks.

### 3. The Vault (Versioned Data Engine)
Backend for atomic content modeling, version control, and schema migrations.

Each layer is independent but works in harmony for a seamless experience.`,
  },
  "the-mirror": {
    title: "The Mirror — UI Layer",
    content: `### Responsibilities

- Drag-and-drop page builder
- Live preview across devices (desktop, tablet, mobile)
- Multi-cursor collaborative editing
- Real-time content updates
- Theme and branding application

### Technology

Built with React, TypeScript, and Tailwind CSS for a modern, responsive experience.`,
  },
  "the-pulse": {
    title: "The Pulse — API Layer",
    content: `### Responsibilities

- Auto-generated REST endpoints for every collection
- GraphQL API with full schema introspection
- Edge caching for sub-50ms global response times
- Webhook delivery for external integrations
- Serverless function support

### API Features

- Pagination, filtering, and sorting out of the box
- Authentication and authorization per endpoint
- Rate limiting and usage tracking`,
  },
  "the-vault": {
    title: "The Vault — Data Layer",
    content: `### Responsibilities

- Atomic content modeling (schemas)
- Time-machine versioning for all content
- Schema migrations with automatic rollback
- Data validation and integrity checks
- Backup and restore capabilities

### Data Safety

Every change is tracked, versioned, and reversible. Your data is always safe.`,
  },
  "theme-selector": {
    title: "Theme Selector",
    content: `### Overview

The Theme Selector lets you choose a visual theme preset **before** generating your app. It appears in the AI Builder top bar.

### Available Presets

| Preset | Primary Color | Style |
|--------|--------------|-------|
| SaaS Clean | Indigo #6366f1 | Modern SaaS with clean whites |
| Corporate Blue | Blue #2563eb | Professional corporate |
| Startup Gradient | Purple #8b5cf6 | Bold vibrant purple-pink |
| Dark Neon | Green #10b981 | Dark theme with neon accent |
| Minimal Mono | Black #18181b | Minimalist monochrome |
| Warm Sunset | Orange #ea580c | Warm tones with amber |

### How It Works

1. Click the **Theme** dropdown in the AI Builder top bar
2. Select a preset — see the color swatch and description
3. Build your app — the selected theme is applied to the generated config
4. Theme tokens (CSS variables) are generated automatically
5. View the applied theme details in the **Summary** tab`,
  },
  "build-summary": {
    title: "Build Summary Panel",
    content: `### Overview

The **Summary** tab provides a comprehensive view of everything generated after a build.

### Sections

| Section | Description |
|---------|-------------|
| **RBAC System** | Roles, permissions, and RLS policies generated |
| **Test Suite** | Coverage %, scenario counts by category |
| **Documentation** | Checklist of generated docs with download button |
| **Theme & Branding** | Applied theme preset, colors, font, radius, mode |

### Download Documentation

Click **Download Docs** in the Documentation section to export a ZIP containing:
- \`README.md\` — Project overview and setup instructions
- \`INSTALL.md\` — Step-by-step installation guide
- \`API.md\` — REST API endpoint documentation
- \`DB_SCHEMA.md\` — Database schema reference`,
  },
  "auto-fix-loop": {
    title: "Auto-Fix Loop",
    content: `### Overview

The **Auto-Fix** tab shows the status of the automated build error detection and correction system.

### Features

- **Risk Score**: 0-100 score indicating overall build risk level
- **Errors Detected**: List of bugs found during the build with severity levels
- **Fixes Applied**: Automatic corrections made by the Debugger agent
- **Error Fix Memory**: Learned patterns from past builds for instant fixes
- **Retry Build**: One-click button to rebuild with all fixes applied

### Loop Flow

\`\`\`
BUILD → DETECT ERRORS → APPLY FIXES → RETRY → SUCCESS
\`\`\`

### Risk Score Levels

| Score | Level | Action |
|-------|-------|--------|
| 0-20 | Low | Production ready |
| 21-50 | Medium | Review recommended |
| 51-100 | High | Fixes required |

### Error Fix Memory

When a build error is fixed, the system remembers:
- The error pattern/signature
- The fix that was applied

Future builds use this memory to fix known errors instantly, making each build faster and more reliable.`,
  },
  "plugin-generator": {
    title: "Plugin Generator Wizard",
    content: `### Overview

The **Plugin** tab provides a step-by-step wizard to define and generate complete plugin scaffolds.

### Wizard Steps

| Step | Description |
|------|-------------|
| 1. Plugin Info | Name, slug, and description |
| 2. Entities | Define database tables with fields and types |
| 3. Permissions | Custom permission keys (CRUD auto-generated) |
| 4. Review | Summary and generate button |

### What Gets Generated

For each entity in the plugin:
- **Database table** with RLS policies
- **5 REST API endpoints** (CRUD + List)
- **Dashboard page** with stats and data table
- **Permission keys** for role-based access

### Entity Field Types

| Type | Description |
|------|-------------|
| string | Short text |
| text | Long text / textarea |
| number | Integer or decimal |
| boolean | True/false toggle |
| date | Date picker |
| email | Email address |
| url | URL / link |
| enum | Predefined options |
| relation | Foreign key link |
| json | Structured data |
| media | File / image upload |

### Plugin Hooks

Every generated plugin includes lifecycle hooks:
- \`onInstall\` — Runs when plugin is installed
- \`onUninstall\` — Cleanup when removed
- \`onActivate\` — When plugin is enabled`,
  },
};

export default function DocumentationPage() {
  const [activeId, setActiveId] = useState("introduction");
  const [expandedSections, setExpandedSections] = useState<string[]>(["getting-started"]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleSection = (id: string) => {
    setExpandedSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const filteredMenu = searchQuery
    ? docMenu
        .map((section) => ({
          ...section,
          children: section.children?.filter(
            (child) =>
              child.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              docContent[child.id]?.content.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        }))
        .filter(
          (section) =>
            (section.children && section.children.length > 0) ||
            section.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
    : docMenu;

  const active = docContent[activeId] || { title: "Not Found", content: "This section is coming soon." };

  const renderSidebar = () => (
    <div className="space-y-1">
      {filteredMenu.map((section) => {
        const isExpanded = expandedSections.includes(section.id) || !!searchQuery;
        return (
          <div key={section.id}>
            <button
              onClick={() => toggleSection(section.id)}
              className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent rounded-lg transition-colors"
            >
              {section.title}
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            {isExpanded && section.children && (
              <div className="ml-3 border-l border-border pl-3 space-y-0.5 mt-0.5 mb-1">
                {section.children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => {
                      setActiveId(child.id);
                      setMobileMenuOpen(false);
                    }}
                    className={cn(
                      "block w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors",
                      activeId === child.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    {child.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // Simple markdown-like rendering
  const renderContent = (content: string) => {
    const lines = content.split("\n");
    const elements: JSX.Element[] = [];
    let inTable = false;
    let tableRows: string[][] = [];
    let tableKey = 0;

    const flushTable = () => {
      if (tableRows.length > 0) {
        elements.push(
          <div key={`table-${tableKey++}`} className="overflow-x-auto my-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  {tableRows[0].map((cell, i) => (
                    <th key={i} className="text-left py-2 px-3 font-semibold text-foreground">
                      {cell.trim()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.slice(2).map((row, ri) => (
                  <tr key={ri} className="border-b border-border/50">
                    {row.map((cell, ci) => (
                      <td key={ci} className="py-2 px-3 text-muted-foreground">
                        {cell.trim()}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
      }
      inTable = false;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith("|")) {
        inTable = true;
        tableRows.push(line.split("|").filter((c) => c.trim() !== ""));
        continue;
      } else if (inTable) {
        flushTable();
      }

      if (line.startsWith("### ")) {
        elements.push(
          <h3 key={i} className="text-lg font-semibold text-foreground mt-6 mb-2">
            {line.replace("### ", "")}
          </h3>
        );
      } else if (line.startsWith("## ")) {
        elements.push(
          <h2 key={i} className="text-xl font-bold text-foreground mt-8 mb-3">
            {line.replace("## ", "")}
          </h2>
        );
      } else if (/^\d+\.\s/.test(line)) {
        elements.push(
          <div key={i} className="flex gap-2 ml-2 my-1">
            <span className="text-primary font-medium shrink-0">{line.match(/^\d+/)?.[0]}.</span>
            <span className="text-muted-foreground">{renderInline(line.replace(/^\d+\.\s/, ""))}</span>
          </div>
        );
      } else if (line.startsWith("- ")) {
        elements.push(
          <div key={i} className="flex gap-2 ml-2 my-1">
            <span className="text-primary mt-1.5 shrink-0">•</span>
            <span className="text-muted-foreground">{renderInline(line.replace("- ", ""))}</span>
          </div>
        );
      } else if (line.trim() === "") {
        elements.push(<div key={i} className="h-2" />);
      } else {
        elements.push(
          <p key={i} className="text-muted-foreground leading-relaxed my-1">
            {renderInline(line)}
          </p>
        );
      }
    }

    if (inTable) flushTable();

    return elements;
  };

  const renderInline = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="text-foreground font-semibold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return <code key={i} className="px-1.5 py-0.5 bg-muted text-foreground rounded text-xs font-mono">{part.slice(1, -1)}</code>;
      }
      if (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) {
        return <em key={i} className="text-muted-foreground italic">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  // Navigation helpers
  const allItems = docMenu.flatMap((s) => s.children || []);
  const currentIndex = allItems.findIndex((item) => item.id === activeId);
  const prevItem = currentIndex > 0 ? allItems[currentIndex - 1] : null;
  const nextItem = currentIndex < allItems.length - 1 ? allItems[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-border bg-card flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-bold text-foreground hidden sm:inline">RyaanCMS</span>
          </Link>
          <span className="text-muted-foreground text-sm">/</span>
          <span className="text-sm font-medium text-foreground">Documentation</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Site
          </Link>
          <button
            className="md:hidden text-foreground p-1"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      <div className="pt-14 flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:block w-72 shrink-0 border-r border-border h-[calc(100vh-3.5rem)] sticky top-14">
          <ScrollArea className="h-full">
            <div className="p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search docs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
              {renderSidebar()}
            </div>
          </ScrollArea>
        </aside>

        {/* Mobile sidebar overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            <div className="absolute top-14 left-0 right-0 bottom-0 bg-card overflow-y-auto p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search docs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
              {renderSidebar()}
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">{active.title}</h1>
            <div className="prose-sm">{renderContent(active.content)}</div>

            {/* Prev/Next navigation */}
            <div className="mt-12 pt-6 border-t border-border flex justify-between gap-4">
              {prevItem ? (
                <button
                  onClick={() => {
                    setActiveId(prevItem.id);
                    // Expand parent section
                    const parent = docMenu.find((s) => s.children?.some((c) => c.id === prevItem.id));
                    if (parent && !expandedSections.includes(parent.id)) {
                      setExpandedSections((prev) => [...prev, parent.id]);
                    }
                  }}
                  className="text-left group"
                >
                  <span className="text-xs text-muted-foreground">Previous</span>
                  <p className="text-sm font-medium text-primary group-hover:underline">{prevItem.title}</p>
                </button>
              ) : (
                <div />
              )}
              {nextItem ? (
                <button
                  onClick={() => {
                    setActiveId(nextItem.id);
                    const parent = docMenu.find((s) => s.children?.some((c) => c.id === nextItem.id));
                    if (parent && !expandedSections.includes(parent.id)) {
                      setExpandedSections((prev) => [...prev, parent.id]);
                    }
                  }}
                  className="text-right group"
                >
                  <span className="text-xs text-muted-foreground">Next</span>
                  <p className="text-sm font-medium text-primary group-hover:underline">{nextItem.title}</p>
                </button>
              ) : (
                <div />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
