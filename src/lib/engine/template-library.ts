// ============================================================
// Template Library — Pre-built Starter Templates
// E-commerce, Blog, SaaS, Portfolio, CRM, LMS
// ============================================================

import type { AppConfig, CollectionConfig, LayoutType, ProjectType } from "./component-registry";

export interface StarterTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "business" | "content" | "commerce" | "personal" | "productivity";
  tags: string[];
  config: AppConfig;
}

function col(name: string, fields: any[], opts: Partial<CollectionConfig> = {}): CollectionConfig {
  return { name, fields, rls: true, tenant_isolated: false, audit_fields: true, ...opts };
}

const L: Record<string, LayoutType> = { pub: "public", dash: "dashboard", auth: "auth", mkt: "marketing" };

const ecommerceTemplate: StarterTemplate = {
  id: "ecommerce",
  name: "E-Commerce Store",
  description: "Full online store with products, cart, checkout, orders & inventory",
  icon: "ShoppingCart",
  category: "commerce",
  tags: ["store", "products", "cart", "checkout", "payments"],
  config: {
    project_type: "ecommerce",
    build_target: "website+application",
    title: "E-Commerce Store",
    description: "A modern e-commerce platform with product catalog, shopping cart, and order management",
    modules: ["auth", "products", "cart", "checkout", "orders", "inventory", "analytics"],
    roles: [
      { name: "admin", permissions: ["*"] },
      { name: "manager", permissions: ["products.read", "products.write", "orders.read", "orders.write"] },
      { name: "customer", permissions: ["products.read", "cart.read", "cart.write", "orders.read"] },
    ],
    features: ["auth", "search", "payments", "notifications"],
    pages: [
      { name: "Home", route: "/", layout: L.mkt, components: [
        { type: "navbar", props: { logo_text: "ShopName", show_auth_buttons: true } },
        { type: "hero", props: { headline: "Shop the Latest Collection", subtitle: "Premium products at unbeatable prices", cta_text: "Shop Now" } },
        { type: "features_grid", props: { title: "Why Shop With Us" } },
        { type: "footer", props: {} },
      ]},
      { name: "Products", route: "/products", layout: L.pub, components: [
        { type: "navbar", props: {} },
        { type: "search_bar", props: { placeholder: "Search products..." } },
        { type: "card_grid", props: { columns: 4 } },
        { type: "footer", props: {} },
      ]},
      { name: "Dashboard", route: "/admin", layout: L.dash, components: [
        { type: "dashboard_layout", props: {} },
        { type: "stats_row", props: {} },
        { type: "crud_table", props: { collection: "orders" } },
      ]},
      { name: "Login", route: "/login", layout: L.auth, components: [{ type: "auth_form", props: { mode: "login" } }] },
      { name: "Signup", route: "/signup", layout: L.auth, components: [{ type: "auth_form", props: { mode: "signup" } }] },
    ],
    collections: [
      col("products", [
        { name: "title", type: "text", required: true },
        { name: "description", type: "text" },
        { name: "price", type: "number", required: true },
        { name: "image_url", type: "media" },
        { name: "category", type: "text" },
        { name: "stock", type: "number", default: "0" },
        { name: "is_active", type: "boolean", default: "true" },
      ], { soft_delete: true }),
      col("orders", [
        { name: "status", type: "enum", default: "pending" },
        { name: "total", type: "number", required: true },
        { name: "shipping_address", type: "json" },
        { name: "payment_method", type: "text" },
      ]),
      col("cart_items", [
        { name: "product_id", type: "relation", relation_to: "products", required: true },
        { name: "quantity", type: "number", required: true, default: "1" },
      ]),
      col("reviews", [
        { name: "product_id", type: "relation", relation_to: "products", required: true },
        { name: "rating", type: "number", required: true },
        { name: "comment", type: "text" },
      ]),
    ],
    style: { primary_color: "#6366f1", font: "Inter", border_radius: "lg", theme: "light" },
    multi_tenant: false,
  },
};

const blogTemplate: StarterTemplate = {
  id: "blog",
  name: "Blog Platform",
  description: "Content platform with posts, categories, comments & SEO",
  icon: "FileText",
  category: "content",
  tags: ["blog", "posts", "articles", "cms", "seo"],
  config: {
    project_type: "blog",
    build_target: "website",
    title: "Blog Platform",
    description: "A modern blog platform with rich text editing, categories, and SEO optimization",
    modules: ["auth", "posts", "categories", "comments", "media", "seo"],
    roles: [
      { name: "admin", permissions: ["*"] },
      { name: "editor", permissions: ["posts.read", "posts.write", "categories.read", "comments.read", "comments.write"] },
      { name: "reader", permissions: ["posts.read", "categories.read", "comments.read"] },
    ],
    features: ["auth", "rich-text", "search", "seo"],
    pages: [
      { name: "Home", route: "/", layout: L.mkt, components: [
        { type: "navbar", props: { logo_text: "Blog" } },
        { type: "hero", props: { headline: "Stories & Ideas", subtitle: "Explore thought-provoking articles" } },
        { type: "blog_preview", props: {} },
        { type: "newsletter_cta", props: {} },
        { type: "footer", props: {} },
      ]},
      { name: "Posts", route: "/posts", layout: L.pub, components: [
        { type: "navbar", props: {} },
        { type: "search_bar", props: {} },
        { type: "card_grid", props: { columns: 3 } },
      ]},
      { name: "Admin", route: "/admin", layout: L.dash, components: [
        { type: "dashboard_layout", props: {} },
        { type: "crud_table", props: { collection: "posts" } },
      ]},
      { name: "Login", route: "/login", layout: L.auth, components: [{ type: "auth_form", props: { mode: "both" } }] },
    ],
    collections: [
      col("posts", [
        { name: "title", type: "text", required: true },
        { name: "slug", type: "text", required: true, unique: true },
        { name: "content", type: "text", required: true },
        { name: "excerpt", type: "text" },
        { name: "cover_image", type: "media" },
        { name: "category_id", type: "relation", relation_to: "categories" },
        { name: "status", type: "enum", default: "draft" },
        { name: "published_at", type: "timestamp" },
      ], { soft_delete: true }),
      col("categories", [
        { name: "name", type: "text", required: true },
        { name: "slug", type: "text", required: true, unique: true },
        { name: "description", type: "text" },
      ]),
      col("comments", [
        { name: "post_id", type: "relation", relation_to: "posts", required: true },
        { name: "content", type: "text", required: true },
        { name: "author_name", type: "text" },
      ]),
    ],
    style: { primary_color: "#10b981", font: "Inter", border_radius: "lg", theme: "light" },
    multi_tenant: false,
  },
};

const saasTemplate: StarterTemplate = {
  id: "saas",
  name: "SaaS Dashboard",
  description: "Multi-tenant SaaS with subscriptions, analytics & team management",
  icon: "BarChart3",
  category: "business",
  tags: ["saas", "dashboard", "analytics", "subscriptions", "teams"],
  config: {
    project_type: "saas",
    build_target: "application",
    title: "SaaS Platform",
    description: "A multi-tenant SaaS platform with user auth, subscription tiers, and analytics dashboard",
    modules: ["auth", "dashboard", "teams", "billing", "analytics", "settings", "notifications"],
    roles: [
      { name: "owner", permissions: ["*"] },
      { name: "admin", permissions: ["team.read", "team.write", "billing.read", "analytics.read", "settings.read", "settings.write"] },
      { name: "member", permissions: ["dashboard.read", "analytics.read"] },
    ],
    features: ["auth", "multi-tenant", "subscriptions", "analytics", "notifications"],
    pages: [
      { name: "Landing", route: "/", layout: L.mkt, components: [
        { type: "navbar", props: { logo_text: "SaaS" } },
        { type: "hero", props: { headline: "Scale Your Business", subtitle: "The all-in-one platform for modern teams" } },
        { type: "features_grid", props: {} },
        { type: "pricing_table", props: {} },
        { type: "testimonials", props: {} },
        { type: "faq", props: {} },
        { type: "footer", props: {} },
      ]},
      { name: "Dashboard", route: "/dashboard", layout: L.dash, components: [
        { type: "dashboard_layout", props: {} },
        { type: "stats_row", props: {} },
        { type: "chart", props: { type: "line" } },
      ]},
      { name: "Team", route: "/team", layout: L.dash, components: [
        { type: "crud_table", props: { collection: "team_members" } },
      ]},
      { name: "Settings", route: "/settings", layout: L.dash, components: [
        { type: "settings_panel", props: {} },
      ]},
      { name: "Login", route: "/login", layout: L.auth, components: [{ type: "auth_form", props: { mode: "both" } }] },
    ],
    collections: [
      col("workspaces", [
        { name: "name", type: "text", required: true },
        { name: "slug", type: "text", required: true, unique: true },
        { name: "plan", type: "enum", default: "free" },
        { name: "settings", type: "json" },
      ], { tenant_isolated: true }),
      col("team_members", [
        { name: "workspace_id", type: "relation", relation_to: "workspaces", required: true },
        { name: "email", type: "email", required: true },
        { name: "role", type: "enum", default: "member" },
        { name: "invited_at", type: "timestamp" },
      ], { tenant_isolated: true }),
      col("subscriptions", [
        { name: "workspace_id", type: "relation", relation_to: "workspaces", required: true },
        { name: "plan", type: "text", required: true },
        { name: "status", type: "enum", default: "active" },
        { name: "expires_at", type: "timestamp" },
      ]),
    ],
    style: { primary_color: "#6366f1", font: "Inter", border_radius: "lg", theme: "light" },
    multi_tenant: true,
  },
};

const portfolioTemplate: StarterTemplate = {
  id: "portfolio",
  name: "Portfolio Website",
  description: "Personal/agency portfolio with projects, skills & contact form",
  icon: "User",
  category: "personal",
  tags: ["portfolio", "personal", "freelancer", "agency", "showcase"],
  config: {
    project_type: "portfolio",
    build_target: "website",
    title: "Portfolio",
    description: "A stunning portfolio website to showcase your work and skills",
    modules: ["portfolio", "contact", "blog"],
    roles: [{ name: "admin", permissions: ["*"] }],
    features: ["seo", "animations", "contact-form", "responsive"],
    pages: [
      { name: "Home", route: "/", layout: L.mkt, components: [
        { type: "navbar", props: { logo_text: "Portfolio" } },
        { type: "hero", props: { headline: "Hi, I'm a Developer", subtitle: "I build beautiful, functional web applications", cta_text: "View My Work" } },
        { type: "features_grid", props: { title: "Skills" } },
        { type: "card_grid", props: { columns: 3 } },
        { type: "testimonials", props: {} },
        { type: "contact_form", props: {} },
        { type: "footer", props: {} },
      ]},
      { name: "Projects", route: "/projects", layout: L.pub, components: [
        { type: "navbar", props: {} },
        { type: "card_grid", props: { columns: 2 } },
      ]},
      { name: "Contact", route: "/contact", layout: L.pub, components: [
        { type: "navbar", props: {} },
        { type: "contact_form", props: {} },
      ]},
    ],
    collections: [
      col("projects", [
        { name: "title", type: "text", required: true },
        { name: "description", type: "text" },
        { name: "image_url", type: "media" },
        { name: "live_url", type: "url" },
        { name: "github_url", type: "url" },
        { name: "tags", type: "json" },
        { name: "featured", type: "boolean", default: "false" },
      ]),
      col("messages", [
        { name: "name", type: "text", required: true },
        { name: "email", type: "email", required: true },
        { name: "message", type: "text", required: true },
        { name: "is_read", type: "boolean", default: "false" },
      ]),
    ],
    style: { primary_color: "#8b5cf6", font: "Inter", border_radius: "lg", theme: "dark" },
    multi_tenant: false,
  },
};

const crmTemplate: StarterTemplate = {
  id: "crm",
  name: "CRM System",
  description: "Customer relationship management with contacts, deals & pipeline",
  icon: "Users",
  category: "business",
  tags: ["crm", "contacts", "deals", "pipeline", "sales"],
  config: {
    project_type: "crm",
    build_target: "application",
    title: "CRM System",
    description: "A comprehensive CRM to manage contacts, deals, and sales pipeline",
    modules: ["auth", "contacts", "deals", "pipeline", "tasks", "reports"],
    roles: [
      { name: "admin", permissions: ["*"] },
      { name: "sales_manager", permissions: ["contacts.*", "deals.*", "pipeline.*", "reports.read"] },
      { name: "sales_rep", permissions: ["contacts.read", "contacts.write", "deals.read", "deals.write"] },
    ],
    features: ["auth", "search", "kanban", "analytics"],
    pages: [
      { name: "Dashboard", route: "/dashboard", layout: L.dash, components: [
        { type: "dashboard_layout", props: {} },
        { type: "stats_row", props: {} },
        { type: "chart", props: { type: "bar" } },
      ]},
      { name: "Contacts", route: "/contacts", layout: L.dash, components: [
        { type: "crud_table", props: { collection: "contacts" } },
      ]},
      { name: "Deals", route: "/deals", layout: L.dash, components: [
        { type: "kanban_board", props: {} },
      ]},
      { name: "Login", route: "/login", layout: L.auth, components: [{ type: "auth_form", props: { mode: "both" } }] },
    ],
    collections: [
      col("contacts", [
        { name: "name", type: "text", required: true },
        { name: "email", type: "email" },
        { name: "phone", type: "text" },
        { name: "company", type: "text" },
        { name: "status", type: "enum", default: "lead" },
        { name: "notes", type: "text" },
      ]),
      col("deals", [
        { name: "title", type: "text", required: true },
        { name: "contact_id", type: "relation", relation_to: "contacts" },
        { name: "value", type: "number" },
        { name: "stage", type: "enum", default: "new" },
        { name: "close_date", type: "date" },
      ]),
      col("tasks", [
        { name: "title", type: "text", required: true },
        { name: "deal_id", type: "relation", relation_to: "deals" },
        { name: "due_date", type: "date" },
        { name: "is_done", type: "boolean", default: "false" },
      ]),
    ],
    style: { primary_color: "#0ea5e9", font: "Inter", border_radius: "md", theme: "light" },
    multi_tenant: false,
  },
};

const lmsTemplate: StarterTemplate = {
  id: "lms",
  name: "Learning Platform",
  description: "Online course platform with lessons, quizzes & progress tracking",
  icon: "GraduationCap",
  category: "productivity",
  tags: ["lms", "courses", "education", "learning", "quizzes"],
  config: {
    project_type: "custom" as ProjectType,
    build_target: "application",
    title: "Learning Platform",
    description: "An online learning platform with courses, lessons, quizzes, and progress tracking",
    modules: ["auth", "courses", "lessons", "quizzes", "progress", "certificates"],
    roles: [
      { name: "admin", permissions: ["*"] },
      { name: "instructor", permissions: ["courses.*", "lessons.*", "quizzes.*"] },
      { name: "student", permissions: ["courses.read", "lessons.read", "progress.read", "progress.write"] },
    ],
    features: ["auth", "search", "progress-tracking", "certificates"],
    pages: [
      { name: "Home", route: "/", layout: L.mkt, components: [
        { type: "navbar", props: { logo_text: "LearnHub" } },
        { type: "hero", props: { headline: "Learn Without Limits", subtitle: "Access world-class courses from anywhere" } },
        { type: "card_grid", props: { columns: 3 } },
        { type: "pricing_table", props: {} },
        { type: "footer", props: {} },
      ]},
      { name: "Courses", route: "/courses", layout: L.pub, components: [
        { type: "navbar", props: {} },
        { type: "search_bar", props: {} },
        { type: "card_grid", props: { columns: 3 } },
      ]},
      { name: "Dashboard", route: "/dashboard", layout: L.dash, components: [
        { type: "dashboard_layout", props: {} },
        { type: "stats_row", props: {} },
        { type: "crud_table", props: { collection: "enrollments" } },
      ]},
      { name: "Login", route: "/login", layout: L.auth, components: [{ type: "auth_form", props: { mode: "both" } }] },
    ],
    collections: [
      col("courses", [
        { name: "title", type: "text", required: true },
        { name: "description", type: "text" },
        { name: "thumbnail", type: "media" },
        { name: "price", type: "number", default: "0" },
        { name: "level", type: "enum", default: "beginner" },
        { name: "is_published", type: "boolean", default: "false" },
      ]),
      col("lessons", [
        { name: "course_id", type: "relation", relation_to: "courses", required: true },
        { name: "title", type: "text", required: true },
        { name: "content", type: "text" },
        { name: "video_url", type: "url" },
        { name: "sort_order", type: "number", default: "0" },
        { name: "duration_minutes", type: "number" },
      ]),
      col("enrollments", [
        { name: "course_id", type: "relation", relation_to: "courses", required: true },
        { name: "progress", type: "number", default: "0" },
        { name: "completed_at", type: "timestamp" },
      ]),
    ],
    style: { primary_color: "#f59e0b", font: "Inter", border_radius: "lg", theme: "light" },
    multi_tenant: false,
  },
};

// ============================================================
// Registry
// ============================================================

export const STARTER_TEMPLATES: StarterTemplate[] = [
  ecommerceTemplate,
  blogTemplate,
  saasTemplate,
  portfolioTemplate,
  crmTemplate,
  lmsTemplate,
];

export function getStarterTemplateById(id: string): StarterTemplate | undefined {
  return STARTER_TEMPLATES.find(t => t.id === id);
}

export function getStarterTemplatesByCategory(category: StarterTemplate["category"]): StarterTemplate[] {
  return STARTER_TEMPLATES.filter(t => t.category === category);
}

export function searchStarterTemplates(query: string): StarterTemplate[] {
  const lower = query.toLowerCase();
  return STARTER_TEMPLATES.filter(t =>
    t.name.toLowerCase().includes(lower) ||
    t.description.toLowerCase().includes(lower) ||
    t.tags.some(tag => tag.includes(lower))
  );
}
