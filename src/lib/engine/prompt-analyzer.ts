/**
 * Smart Prompt Analyzer — determines which pipeline steps are needed
 * based on the complexity and type of user request.
 * Also generates phase plans for large projects.
 */

export type BuildScope = "full" | "moderate" | "light" | "micro";

export type BuildTarget = 
  | "website" 
  | "application" 
  | "plugin" 
  | "website+application" 
  | "application+plugin" 
  | "full";

export interface ProjectPhase {
  phase: number;
  title: string;
  description: string;
  prompt: string;
}

export interface PromptAnalysis {
  scope: BuildScope;
  buildTarget: BuildTarget;
  stepsNeeded: number[];
  reason: string;
  phases?: ProjectPhase[];
  appreciation?: string;
}

const MICRO_PATTERNS = [
  /^(change|update|edit|fix|modify|rename|replace)\s+(the\s+)?(text|title|heading|label|name|copy|description|placeholder|button text|color|font|size)/i,
  /^(make|set)\s+(it|the|this)\s+(bigger|smaller|bold|italic|centered|left|right)/i,
  /^(remove|delete|hide)\s+(the\s+)?(text|title|heading|label|button|section)/i,
  /^(add|insert)\s+(a\s+)?(text|title|heading|label|subtitle|paragraph)/i,
];

const LIGHT_PATTERNS = [
  /^(add|insert|create)\s+(a\s+)?(button|link|icon|image|badge|tag|divider|separator)/i,
  /^(change|update|modify)\s+(the\s+)?(style|theme|color|layout|spacing|padding|margin)/i,
  /^(move|reorder|swap|rearrange)\s/i,
  /^(show|hide|toggle)\s/i,
  /^(add|remove)\s+(a\s+)?(field|column|row|item)/i,
];

const MODERATE_PATTERNS = [
  /^(add|create|build)\s+(a\s+)?(page|section|component|form|table|card|modal|dialog|sidebar|navbar|footer)/i,
  /^(add|create|implement)\s+(a\s+)?(search|filter|sort|pagination)/i,
  /^(redesign|rebuild|improve|upgrade)\s+(the\s+)?(page|section|component)/i,
];

// Build target detection patterns
const WEBSITE_KEYWORDS = [
  "website", "site", "landing", "blog", "portfolio", "homepage", "seo",
  "static site", "brochure", "marketing site", "web page", "ওয়েবসাইট", "সাইট",
];

const APPLICATION_KEYWORDS = [
  "app", "application", "dashboard", "saas", "crm", "erp", "admin panel",
  "management system", "portal", "platform", "tool", "অ্যাপ", "অ্যাপ্লিকেশন",
];

const PLUGIN_KEYWORDS = [
  "plugin", "extension", "module", "addon", "add-on", "widget",
  "integration", "প্লাগিন", "মডিউল",
];

function detectBuildTarget(prompt: string): BuildTarget {
  const lower = prompt.toLowerCase();
  const hasWebsite = WEBSITE_KEYWORDS.some(k => lower.includes(k));
  const hasApp = APPLICATION_KEYWORDS.some(k => lower.includes(k));
  const hasPlugin = PLUGIN_KEYWORDS.some(k => lower.includes(k));

  if (hasWebsite && hasApp && hasPlugin) return "full";
  if (hasWebsite && hasApp) return "website+application";
  if (hasApp && hasPlugin) return "application+plugin";
  if (hasWebsite) return "website";
  if (hasPlugin) return "plugin";
  if (hasApp) return "application";

  // Default: infer from project type keywords
  const ecommercePattern = /e-?commerce|shop|store|cart|checkout/i;
  const dashboardPattern = /dashboard|analytics|admin|manage/i;
  if (ecommercePattern.test(lower)) return "website+application";
  if (dashboardPattern.test(lower)) return "application";

  return "application"; // safe default
}

// All 17 step indices
const ALL_STEPS = Array.from({ length: 17 }, (_, i) => i);
const MODERATE_STEPS = [0, 1, 2, 3, 6, 7, 10, 11, 15, 16];
const LIGHT_STEPS = [0, 6, 10, 15, 16];
const MICRO_STEPS = [0, 15, 16];

// Appreciation messages for big projects
const APPRECIATIONS = [
  "🔥 Wow, this is an ambitious project! I love the vision.",
  "💡 Great idea! This is going to be something special.",
  "🚀 Impressive scope! Let's build something amazing together.",
  "✨ Love this concept! You've really thought this through.",
  "🎯 Excellent project idea! I'm excited to work on this with you.",
];

// Feature categories for phase generation
const FEATURE_CATEGORIES = [
  { keywords: ["auth", "login", "signup", "register", "user", "account", "profile", "password"], label: "Authentication & User Management", desc: "User registration, login, profiles, and account management" },
  { keywords: ["dashboard", "analytics", "chart", "stats", "metrics", "report", "kpi"], label: "Dashboard & Analytics", desc: "Main dashboard with charts, KPIs, and data visualization" },
  { keywords: ["crud", "manage", "list", "table", "data", "records", "admin"], label: "Data Management", desc: "CRUD operations, data tables, and admin interfaces" },
  { keywords: ["payment", "checkout", "cart", "order", "subscription", "billing", "stripe", "price", "pricing"], label: "Payments & Commerce", desc: "Shopping cart, checkout flow, payments, and order management" },
  { keywords: ["blog", "post", "article", "content", "cms", "editor", "publish"], label: "Content Management", desc: "Blog posts, articles, rich text editor, and content publishing" },
  { keywords: ["chat", "message", "notification", "real-time", "realtime", "inbox", "email"], label: "Communication & Notifications", desc: "Messaging, notifications, and real-time features" },
  { keywords: ["upload", "file", "media", "image", "gallery", "storage", "document"], label: "Media & File Management", desc: "File uploads, media gallery, and document management" },
  { keywords: ["search", "filter", "sort", "category", "tag"], label: "Search & Discovery", desc: "Search functionality, filters, categories, and sorting" },
  { keywords: ["landing", "hero", "feature", "testimonial", "cta", "about", "contact", "faq"], label: "Landing & Marketing Pages", desc: "Landing page, hero sections, features, testimonials, and CTAs" },
  { keywords: ["setting", "config", "preference", "theme", "role", "permission", "team"], label: "Settings & Configuration", desc: "App settings, user preferences, roles, and permissions" },
  { keywords: ["api", "integration", "webhook", "third-party", "connect"], label: "Integrations & API", desc: "Third-party integrations, API endpoints, and webhooks" },
  { keywords: ["deploy", "production", "seo", "performance", "security", "test"], label: "Polish & Deployment", desc: "SEO optimization, security hardening, testing, and deployment" },
];

function generatePhases(prompt: string): ProjectPhase[] {
  const lower = prompt.toLowerCase();
  const matchedCategories: { label: string; desc: string; score: number }[] = [];

  for (const cat of FEATURE_CATEGORIES) {
    const score = cat.keywords.filter(k => lower.includes(k)).length;
    if (score > 0) {
      matchedCategories.push({ label: cat.label, desc: cat.desc, score });
    }
  }

  // Sort by relevance
  matchedCategories.sort((a, b) => b.score - a.score);

  // If few matches, add generic phases
  if (matchedCategories.length < 2) {
    matchedCategories.push(
      { label: "Core Structure & Layout", desc: "Main layout, navigation, and page structure", score: 0 },
      { label: "Core Features", desc: "Primary functionality and user flows", score: 0 },
      { label: "Polish & Enhancement", desc: "Styling, responsiveness, and final touches", score: 0 },
    );
  }

  // Group into 3-5 phases
  const phases: ProjectPhase[] = [];
  const maxPhases = Math.min(Math.max(Math.ceil(matchedCategories.length / 2), 3), 5);

  // Phase 1 always starts with foundation
  phases.push({
    phase: 1,
    title: "Foundation & " + (matchedCategories[0]?.label || "Core Layout"),
    description: "Setting up the project structure, navigation, and " + (matchedCategories[0]?.desc || "base components"),
    prompt: `Phase 1: Build the foundation for "${prompt}" — focus on project structure, main layout, navigation, and ${matchedCategories[0]?.label || "core components"}`,
  });

  // Middle phases
  for (let i = 1; i < maxPhases - 1 && i < matchedCategories.length; i++) {
    phases.push({
      phase: i + 1,
      title: matchedCategories[i].label,
      description: matchedCategories[i].desc,
      prompt: `Phase ${i + 1}: Continue building "${prompt}" — now implement ${matchedCategories[i].label}: ${matchedCategories[i].desc}`,
    });
  }

  // Final phase: polish
  phases.push({
    phase: phases.length + 1,
    title: "Final Polish & Integration",
    description: "Connect all features, add finishing touches, responsive design, and quality checks",
    prompt: `Final phase: Polish and finalize "${prompt}" — connect all features, add responsive design, error handling, and quality improvements`,
  });

  return phases;
}

export function analyzePrompt(prompt: string, hasExistingProject?: boolean): PromptAnalysis {
  const trimmed = prompt.trim();
  const wordCount = trimmed.split(/\s+/).length;
  const buildTarget = detectBuildTarget(trimmed);

  // Check for phase continuation commands
  const phaseCommands = [
    /^(yes|sure|go|ok|okay|continue|next|proceed|start|let'?s?\s*(go|do|start|build))/i,
    /^(build|start)\s+(phase|next|it)/i,
    /^phase\s+\d/i,
  ];
  for (const pattern of phaseCommands) {
    if (pattern.test(trimmed)) {
      return { scope: "moderate", buildTarget, stepsNeeded: ALL_STEPS, reason: "Phase continuation" };
    }
  }

  // === Edit-intent detection: if there's an existing project, check if this is an edit/update ===
  const editIntentPatterns = [
    /\b(fix|update|change|modify|edit|adjust|tweak|improve|make)\b/i,
    /\b(add|remove|move|swap|reorder)\s+(a\s+)?(section|component|menu|link|button|page|field)/i,
    /\b(not working|doesn'?t work|can'?t|won'?t|broken|issue|bug|problem)\b/i,
    /\b(linkable|clickable|scrollable|responsive|visible|hidden)\b/i,
    /\b(menu|nav|navigation|header|footer|sidebar)\b.*\b(link|click|open|scroll|anchor|jump)\b/i,
    /\b(link|click|open|scroll|anchor|jump)\b.*\b(menu|nav|navigation|header|footer|sidebar)\b/i,
  ];

  if (hasExistingProject) {
    const hasEditIntent = editIntentPatterns.some(p => p.test(trimmed));
    if (hasEditIntent) {
      // Route edit-intent prompts to moderate (updates existing) instead of full (creates new)
      return { scope: "moderate", buildTarget, stepsNeeded: MODERATE_STEPS, reason: "Edit/update to existing project detected" };
    }
  }

  // Very short prompts about text/style changes
  if (wordCount <= 12) {
    for (const pattern of MICRO_PATTERNS) {
      if (pattern.test(trimmed)) {
        return { scope: "micro", buildTarget, stepsNeeded: MICRO_STEPS, reason: "Simple text/style change detected" };
      }
    }
  }

  if (wordCount <= 20) {
    for (const pattern of LIGHT_PATTERNS) {
      if (pattern.test(trimmed)) {
        return { scope: "light", buildTarget, stepsNeeded: LIGHT_STEPS, reason: "Minor UI adjustment detected" };
      }
    }
  }

  if (wordCount <= 40) {
    for (const pattern of MODERATE_PATTERNS) {
      if (pattern.test(trimmed)) {
        return { scope: "moderate", buildTarget, stepsNeeded: MODERATE_STEPS, reason: "Component/section-level change detected" };
      }
    }
  }

  // Check for keywords suggesting full build
  const fullBuildKeywords = [
    "build", "create", "generate", "make me", "design",
    "e-commerce", "saas", "dashboard", "platform", "app", "website",
    "with auth", "with database", "with payment", "full", "complete",
  ];

  const hasFullBuildKeyword = fullBuildKeywords.some(k => trimmed.toLowerCase().includes(k));

  // If existing project and full-build keyword, only trigger full if it's clearly a NEW project request
  if (hasFullBuildKeyword) {
    // If there's an existing project, only trigger full build for explicit "build a new..." or "create a new..." patterns
    if (hasExistingProject) {
      const newProjectPattern = /\b(build|create|generate|make)\s+(me\s+)?(a\s+)?(new|another|different|separate)\b/i;
      if (!newProjectPattern.test(trimmed)) {
        // Treat as moderate update to existing project
        return { scope: "moderate", buildTarget, stepsNeeded: ALL_STEPS, reason: "Updating existing project with new features" };
      }
    }
    const phases = wordCount > 30 ? generatePhases(trimmed) : undefined;
    const appreciation = APPRECIATIONS[Math.floor(Math.random() * APPRECIATIONS.length)];
    return {
      scope: "full",
      buildTarget,
      stepsNeeded: ALL_STEPS,
      reason: "Full application build required",
      phases,
      appreciation,
    };
  }

  const isComplex = wordCount > 30;

  if (isComplex) {
    // For existing projects with complex prompts, still treat as moderate update
    if (hasExistingProject) {
      return { scope: "moderate", buildTarget, stepsNeeded: ALL_STEPS, reason: "Complex update to existing project" };
    }
    const phases = generatePhases(trimmed);
    const appreciation = APPRECIATIONS[Math.floor(Math.random() * APPRECIATIONS.length)];
    return {
      scope: "full",
      buildTarget,
      stepsNeeded: ALL_STEPS,
      reason: "Full application build required",
      phases,
      appreciation,
    };
  }

  // Default to moderate for medium-length prompts
  if (wordCount > 20) {
    return { scope: "moderate", buildTarget, stepsNeeded: MODERATE_STEPS, reason: "Moderate complexity detected" };
  }

  // Short but unmatched — default to light
  return { scope: "light", buildTarget, stepsNeeded: LIGHT_STEPS, reason: "Standard change detected" };
}
