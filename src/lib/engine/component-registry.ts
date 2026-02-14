// ============================================================
// Engine 2: Component Registry — Full Production Version
// JSON-driven catalog with props schemas, validation, tenant safety
// ============================================================

// === Core Types ===

export type ComponentType =
  | "hero" | "navbar" | "footer" | "sidebar"
  | "crud_table" | "form" | "chart" | "card_grid"
  | "stats_row" | "auth_form" | "pricing_table"
  | "media_gallery" | "search_bar" | "notification_center"
  | "rich_text_editor" | "file_upload" | "calendar"
  | "kanban_board" | "timeline" | "map"
  | "role_manager" | "payment_page" | "dashboard_layout"
  | "data_import" | "settings_panel" | "api_docs"
  | "trusted_by" | "features_grid" | "feature_split" | "how_it_works"
  | "testimonials" | "faq" | "final_cta";

export type FieldType = "text" | "number" | "boolean" | "date" | "relation" | "json" | "media" | "enum" | "uuid" | "email" | "url" | "password" | "timestamp";

export type LayoutType = "public" | "dashboard" | "auth" | "fullscreen" | "marketing";

export type ProjectType = "landing" | "blog" | "saas" | "ecommerce" | "portfolio" | "dashboard" | "marketplace" | "crm" | "custom";

// === Component Configuration ===

export interface PropSchema {
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object" | "enum";
  required?: boolean;
  default?: any;
  enum_values?: string[];
  description?: string;
  min?: number;
  max?: number;
}

export interface ComponentConfig {
  type: ComponentType;
  props?: Record<string, any>;
}

export interface ComponentMeta {
  type: ComponentType;
  label: string;
  category: "layout" | "content" | "data" | "interaction" | "media" | "system";
  description: string;
  icon: string;
  tenant_safe: boolean;
  props_schema: PropSchema[];
  allowed_layouts: LayoutType[];
  requires_auth: boolean;
  requires_modules: string[];
}

// === Page Configuration ===

export interface PageConfig {
  name: string;
  route: string;
  layout: LayoutType;
  components: ComponentConfig[];
  requires_auth?: boolean;
  roles?: string[];
}

// === Database Configuration ===

export interface CollectionField {
  name: string;
  type: FieldType;
  required?: boolean;
  default?: string;
  unique?: boolean;
  indexed?: boolean;
  relation_to?: string;
  enum_values?: string[];
}

export interface CollectionConfig {
  name: string;
  fields: CollectionField[];
  rls: boolean;
  tenant_isolated: boolean;
  audit_fields: boolean;
  soft_delete?: boolean;
}

// === Role Configuration ===

export interface RoleConfig {
  name: string;
  permissions: string[];
  is_default?: boolean;
}

// === Style Configuration ===

export interface StyleConfig {
  primary_color?: string;
  theme?: "light" | "dark" | "auto";
  font?: string;
  border_radius?: "none" | "sm" | "md" | "lg" | "full";
}

// === Full App Configuration ===

export interface AppConfig {
  project_type: ProjectType;
  title: string;
  description: string;
  modules: string[];
  roles?: RoleConfig[];
  features?: string[];
  pages: PageConfig[];
  collections: CollectionConfig[];
  style?: StyleConfig;
  multi_tenant?: boolean;
  api_endpoints?: ApiEndpoint[];
}

export interface ApiEndpoint {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  description: string;
  auth_required: boolean;
  roles?: string[];
}

// === Component Registry ===

export const componentRegistry: ComponentMeta[] = [
  {
    type: "hero",
    label: "Hero Section",
    category: "layout",
    description: "Full-width hero with headline, subtitle, CTA, and optional background",
    icon: "Sparkles",
    tenant_safe: true,
    requires_auth: false,
    requires_modules: [],
    allowed_layouts: ["public", "marketing"],
    props_schema: [
      { name: "headline", type: "string", required: true, description: "Main heading text" },
      { name: "subtitle", type: "string", description: "Supporting text below headline" },
      { name: "cta_text", type: "string", default: "Get Started", description: "Call-to-action button text" },
      { name: "cta_link", type: "string", default: "/auth", description: "CTA button link" },
      { name: "background_type", type: "enum", enum_values: ["solid", "gradient", "image", "video"], default: "gradient" },
      { name: "alignment", type: "enum", enum_values: ["left", "center", "right"], default: "center" },
    ],
  },
  {
    type: "navbar",
    label: "Navigation Bar",
    category: "layout",
    description: "Top navigation with logo, links, auth state, and mobile menu",
    icon: "Menu",
    tenant_safe: true,
    requires_auth: false,
    requires_modules: [],
    allowed_layouts: ["public", "marketing", "dashboard"],
    props_schema: [
      { name: "logo_text", type: "string", required: true },
      { name: "show_auth_buttons", type: "boolean", default: true },
      { name: "sticky", type: "boolean", default: true },
      { name: "transparent", type: "boolean", default: false },
    ],
  },
  {
    type: "footer",
    label: "Footer",
    category: "layout",
    description: "Site footer with links, social icons, copyright, and newsletter",
    icon: "ArrowDown",
    tenant_safe: true,
    requires_auth: false,
    requires_modules: [],
    allowed_layouts: ["public", "marketing"],
    props_schema: [
      { name: "columns", type: "number", default: 4, min: 1, max: 6 },
      { name: "show_social", type: "boolean", default: true },
      { name: "show_newsletter", type: "boolean", default: false },
    ],
  },
  {
    type: "sidebar",
    label: "Sidebar Navigation",
    category: "layout",
    description: "Side navigation panel with collapsible sections",
    icon: "PanelLeft",
    tenant_safe: true,
    requires_auth: true,
    requires_modules: [],
    allowed_layouts: ["dashboard"],
    props_schema: [
      { name: "collapsible", type: "boolean", default: true },
      { name: "show_user_avatar", type: "boolean", default: true },
    ],
  },
  {
    type: "dashboard_layout",
    label: "Dashboard Layout",
    category: "layout",
    description: "Complete dashboard shell with sidebar, header, and content area",
    icon: "LayoutDashboard",
    tenant_safe: true,
    requires_auth: true,
    requires_modules: ["auth"],
    allowed_layouts: ["dashboard"],
    props_schema: [
      { name: "sidebar_position", type: "enum", enum_values: ["left", "right"], default: "left" },
      { name: "header_sticky", type: "boolean", default: true },
    ],
  },
  {
    type: "crud_table",
    label: "CRUD Table",
    category: "data",
    description: "Full data table with create, read, update, delete, search, and pagination",
    icon: "Table",
    tenant_safe: true,
    requires_auth: true,
    requires_modules: [],
    allowed_layouts: ["dashboard"],
    props_schema: [
      { name: "collection", type: "string", required: true, description: "Database collection to bind" },
      { name: "columns", type: "array", required: true, description: "Visible columns" },
      { name: "searchable", type: "boolean", default: true },
      { name: "sortable", type: "boolean", default: true },
      { name: "paginated", type: "boolean", default: true },
      { name: "page_size", type: "number", default: 20, min: 5, max: 100 },
      { name: "inline_edit", type: "boolean", default: false },
      { name: "bulk_actions", type: "boolean", default: false },
    ],
  },
  {
    type: "form",
    label: "Dynamic Form",
    category: "interaction",
    description: "Form with validation, conditional fields, and submit actions",
    icon: "FileText",
    tenant_safe: true,
    requires_auth: false,
    requires_modules: [],
    allowed_layouts: ["public", "dashboard", "auth"],
    props_schema: [
      { name: "collection", type: "string", description: "Collection to save to" },
      { name: "fields", type: "array", required: true },
      { name: "submit_label", type: "string", default: "Submit" },
      { name: "success_message", type: "string", default: "Saved successfully" },
      { name: "redirect_on_success", type: "string" },
    ],
  },
  {
    type: "chart",
    label: "Data Chart",
    category: "data",
    description: "Bar, line, pie, area charts with data binding",
    icon: "BarChart3",
    tenant_safe: true,
    requires_auth: true,
    requires_modules: ["analytics"],
    allowed_layouts: ["dashboard"],
    props_schema: [
      { name: "chart_type", type: "enum", enum_values: ["bar", "line", "pie", "area", "donut"], required: true },
      { name: "data_source", type: "string", required: true },
      { name: "x_axis", type: "string" },
      { name: "y_axis", type: "string" },
      { name: "title", type: "string" },
    ],
  },
  {
    type: "card_grid",
    label: "Card Grid",
    category: "content",
    description: "Responsive grid of content cards with images and actions",
    icon: "LayoutGrid",
    tenant_safe: true,
    requires_auth: false,
    requires_modules: [],
    allowed_layouts: ["public", "dashboard", "marketing"],
    props_schema: [
      { name: "columns", type: "number", default: 3, min: 1, max: 6 },
      { name: "collection", type: "string", description: "Data source collection" },
      { name: "show_image", type: "boolean", default: true },
      { name: "show_actions", type: "boolean", default: true },
    ],
  },
  {
    type: "stats_row",
    label: "Stats Row",
    category: "data",
    description: "Key metrics displayed in a horizontal row with trends",
    icon: "TrendingUp",
    tenant_safe: true,
    requires_auth: true,
    requires_modules: ["analytics"],
    allowed_layouts: ["dashboard"],
    props_schema: [
      { name: "metrics", type: "array", required: true, description: "Array of metric configs" },
      { name: "show_trend", type: "boolean", default: true },
    ],
  },
  {
    type: "auth_form",
    label: "Auth Form",
    category: "interaction",
    description: "Login/signup form with email, password, and social auth options",
    icon: "Lock",
    tenant_safe: true,
    requires_auth: false,
    requires_modules: ["auth"],
    allowed_layouts: ["auth", "public"],
    props_schema: [
      { name: "mode", type: "enum", enum_values: ["login", "signup", "both"], default: "both" },
      { name: "social_providers", type: "array", description: "OAuth providers to show" },
      { name: "redirect_after", type: "string", default: "/dashboard" },
    ],
  },
  {
    type: "pricing_table",
    label: "Pricing Table",
    category: "content",
    description: "Pricing plans comparison with feature lists and CTAs",
    icon: "CreditCard",
    tenant_safe: true,
    requires_auth: false,
    requires_modules: ["payments"],
    allowed_layouts: ["public", "marketing"],
    props_schema: [
      { name: "plans", type: "array", required: true, description: "Array of plan configs" },
      { name: "billing_period", type: "enum", enum_values: ["monthly", "annual", "both"], default: "both" },
      { name: "highlight_plan", type: "string", description: "Plan to highlight" },
    ],
  },
  {
    type: "media_gallery",
    label: "Media Gallery",
    category: "media",
    description: "Image/video gallery with lightbox and upload support",
    icon: "Image",
    tenant_safe: true,
    requires_auth: false,
    requires_modules: ["media"],
    allowed_layouts: ["public", "dashboard"],
    props_schema: [
      { name: "layout", type: "enum", enum_values: ["grid", "masonry", "carousel"], default: "grid" },
      { name: "columns", type: "number", default: 3, min: 1, max: 6 },
      { name: "allow_upload", type: "boolean", default: false },
      { name: "lightbox", type: "boolean", default: true },
    ],
  },
  {
    type: "search_bar",
    label: "Search Bar",
    category: "interaction",
    description: "Search with filters, suggestions, and keyboard shortcuts",
    icon: "Search",
    tenant_safe: true,
    requires_auth: false,
    requires_modules: ["search"],
    allowed_layouts: ["public", "dashboard"],
    props_schema: [
      { name: "placeholder", type: "string", default: "Search..." },
      { name: "collections", type: "array", description: "Collections to search" },
      { name: "show_filters", type: "boolean", default: false },
      { name: "keyboard_shortcut", type: "string", default: "cmd+k" },
    ],
  },
  {
    type: "notification_center",
    label: "Notification Center",
    category: "interaction",
    description: "Notification feed with mark as read and preferences",
    icon: "Bell",
    tenant_safe: true,
    requires_auth: true,
    requires_modules: ["notifications"],
    allowed_layouts: ["dashboard"],
    props_schema: [
      { name: "realtime", type: "boolean", default: true },
      { name: "max_items", type: "number", default: 50, min: 10, max: 200 },
    ],
  },
  {
    type: "rich_text_editor",
    label: "Rich Text Editor",
    category: "content",
    description: "WYSIWYG content editor with markdown support",
    icon: "Edit",
    tenant_safe: true,
    requires_auth: true,
    requires_modules: [],
    allowed_layouts: ["dashboard"],
    props_schema: [
      { name: "toolbar", type: "enum", enum_values: ["minimal", "standard", "full"], default: "standard" },
      { name: "markdown_mode", type: "boolean", default: false },
      { name: "max_length", type: "number", min: 100 },
    ],
  },
  {
    type: "file_upload",
    label: "File Upload",
    category: "media",
    description: "Drag-and-drop file uploader with progress and preview",
    icon: "Upload",
    tenant_safe: true,
    requires_auth: true,
    requires_modules: ["media"],
    allowed_layouts: ["dashboard"],
    props_schema: [
      { name: "accept", type: "string", default: "image/*,application/pdf" },
      { name: "max_size_mb", type: "number", default: 10, min: 1, max: 100 },
      { name: "multiple", type: "boolean", default: true },
      { name: "storage_bucket", type: "string" },
    ],
  },
  {
    type: "calendar",
    label: "Calendar",
    category: "data",
    description: "Event calendar with day/week/month views",
    icon: "Calendar",
    tenant_safe: true,
    requires_auth: true,
    requires_modules: [],
    allowed_layouts: ["dashboard"],
    props_schema: [
      { name: "default_view", type: "enum", enum_values: ["day", "week", "month"], default: "month" },
      { name: "event_collection", type: "string", required: true },
      { name: "allow_create", type: "boolean", default: true },
    ],
  },
  {
    type: "kanban_board",
    label: "Kanban Board",
    category: "data",
    description: "Drag-and-drop kanban with customizable columns",
    icon: "Columns",
    tenant_safe: true,
    requires_auth: true,
    requires_modules: [],
    allowed_layouts: ["dashboard"],
    props_schema: [
      { name: "collection", type: "string", required: true },
      { name: "status_field", type: "string", required: true, default: "status" },
      { name: "columns", type: "array", description: "Column definitions" },
    ],
  },
  {
    type: "timeline",
    label: "Timeline",
    category: "content",
    description: "Chronological event timeline with icons and actions",
    icon: "Clock",
    tenant_safe: true,
    requires_auth: false,
    requires_modules: [],
    allowed_layouts: ["public", "dashboard"],
    props_schema: [
      { name: "collection", type: "string" },
      { name: "orientation", type: "enum", enum_values: ["vertical", "horizontal"], default: "vertical" },
    ],
  },
  {
    type: "map",
    label: "Interactive Map",
    category: "media",
    description: "Map view with markers, clustering, and location search",
    icon: "MapPin",
    tenant_safe: true,
    requires_auth: false,
    requires_modules: [],
    allowed_layouts: ["public", "dashboard"],
    props_schema: [
      { name: "provider", type: "enum", enum_values: ["mapbox", "leaflet", "google"], default: "leaflet" },
      { name: "center_lat", type: "number", default: 0 },
      { name: "center_lng", type: "number", default: 0 },
      { name: "zoom", type: "number", default: 10, min: 1, max: 20 },
      { name: "markers_collection", type: "string" },
    ],
  },
  {
    type: "role_manager",
    label: "Role Manager",
    category: "system",
    description: "User role assignment and permission management interface",
    icon: "Shield",
    tenant_safe: true,
    requires_auth: true,
    requires_modules: ["auth"],
    allowed_layouts: ["dashboard"],
    props_schema: [
      { name: "editable", type: "boolean", default: true },
      { name: "show_permissions", type: "boolean", default: true },
    ],
  },
  {
    type: "payment_page",
    label: "Payment Page",
    category: "interaction",
    description: "Checkout page with payment form and order summary",
    icon: "CreditCard",
    tenant_safe: true,
    requires_auth: true,
    requires_modules: ["payments"],
    allowed_layouts: ["fullscreen", "dashboard"],
    props_schema: [
      { name: "provider", type: "enum", enum_values: ["stripe", "paypal", "manual"], default: "stripe" },
      { name: "show_summary", type: "boolean", default: true },
    ],
  },
  {
    type: "data_import",
    label: "Data Import",
    category: "system",
    description: "CSV/JSON data import with mapping and validation",
    icon: "Upload",
    tenant_safe: true,
    requires_auth: true,
    requires_modules: [],
    allowed_layouts: ["dashboard"],
    props_schema: [
      { name: "target_collection", type: "string", required: true },
      { name: "formats", type: "array", description: "Accepted formats" },
      { name: "max_rows", type: "number", default: 10000, min: 100 },
    ],
  },
  {
    type: "settings_panel",
    label: "Settings Panel",
    category: "system",
    description: "Application settings interface with sections",
    icon: "Settings",
    tenant_safe: true,
    requires_auth: true,
    requires_modules: [],
    allowed_layouts: ["dashboard"],
    props_schema: [
      { name: "sections", type: "array", required: true, description: "Setting section configs" },
    ],
  },
  {
    type: "api_docs",
    label: "API Documentation",
    category: "system",
    description: "Auto-generated API documentation viewer",
    icon: "Code",
    tenant_safe: true,
    requires_auth: false,
    requires_modules: ["api"],
    allowed_layouts: ["public", "dashboard"],
    props_schema: [
      { name: "base_url", type: "string" },
      { name: "show_try_it", type: "boolean", default: true },
    ],
  },
  // === Landing Page Section Library ===
  {
    type: "trusted_by",
    label: "Trusted By / Logo Cloud",
    category: "content",
    description: "Logo cloud showing trusted brands/partners with optional label",
    icon: "Award",
    tenant_safe: true,
    requires_auth: false,
    requires_modules: [],
    allowed_layouts: ["public", "marketing"],
    props_schema: [
      { name: "label", type: "string", default: "Trusted by leading companies", description: "Section label text" },
      { name: "logos", type: "array", description: "Array of logo names/brands" },
      { name: "style", type: "enum", enum_values: ["minimal", "cards", "marquee"], default: "minimal" },
    ],
  },
  {
    type: "features_grid",
    label: "Features Grid",
    category: "content",
    description: "Feature cards grid with icons, titles, and descriptions",
    icon: "LayoutGrid",
    tenant_safe: true,
    requires_auth: false,
    requires_modules: [],
    allowed_layouts: ["public", "marketing"],
    props_schema: [
      { name: "headline", type: "string", default: "Everything you need", description: "Section heading" },
      { name: "subtitle", type: "string", default: "Powerful features to help you grow", description: "Section subtitle" },
      { name: "columns", type: "number", default: 3, min: 2, max: 4 },
      { name: "features", type: "array", description: "Array of feature objects with title, description, icon" },
      { name: "style", type: "enum", enum_values: ["cards", "minimal", "bordered"], default: "cards" },
    ],
  },
  {
    type: "feature_split",
    label: "Feature Split",
    category: "content",
    description: "Side-by-side feature section with image/visual on one side and text + CTA on the other",
    icon: "Columns",
    tenant_safe: true,
    requires_auth: false,
    requires_modules: [],
    allowed_layouts: ["public", "marketing"],
    props_schema: [
      { name: "headline", type: "string", default: "Built for modern teams", description: "Section heading" },
      { name: "description", type: "string", default: "Streamline your workflow with powerful automation, real-time collaboration, and deep integrations.", description: "Feature description" },
      { name: "features", type: "array", description: "Array of bullet point features" },
      { name: "image_side", type: "enum", enum_values: ["left", "right"], default: "right" },
      { name: "cta_text", type: "string", default: "Learn More" },
      { name: "cta_link", type: "string", default: "#" },
      { name: "badge_text", type: "string", default: "Why Choose Us" },
    ],
  },
  {
    type: "how_it_works",
    label: "How It Works",
    category: "content",
    description: "Step-by-step process explanation with numbered steps",
    icon: "ListOrdered",
    tenant_safe: true,
    requires_auth: false,
    requires_modules: [],
    allowed_layouts: ["public", "marketing"],
    props_schema: [
      { name: "headline", type: "string", default: "How it works" },
      { name: "subtitle", type: "string", default: "Get started in 3 simple steps" },
      { name: "steps", type: "array", description: "Array of step objects with title and description" },
    ],
  },
  {
    type: "testimonials",
    label: "Testimonials",
    category: "content",
    description: "Customer testimonial cards with avatar, quote, name, and role",
    icon: "MessageSquareQuote",
    tenant_safe: true,
    requires_auth: false,
    requires_modules: [],
    allowed_layouts: ["public", "marketing"],
    props_schema: [
      { name: "headline", type: "string", default: "What our customers say" },
      { name: "subtitle", type: "string", default: "Don't just take our word for it" },
      { name: "testimonials", type: "array", description: "Array of testimonial objects" },
      { name: "columns", type: "number", default: 3, min: 1, max: 4 },
    ],
  },
  {
    type: "faq",
    label: "FAQ Section",
    category: "content",
    description: "Frequently asked questions with expandable accordion",
    icon: "HelpCircle",
    tenant_safe: true,
    requires_auth: false,
    requires_modules: [],
    allowed_layouts: ["public", "marketing"],
    props_schema: [
      { name: "headline", type: "string", default: "Frequently asked questions" },
      { name: "subtitle", type: "string", default: "Everything you need to know" },
      { name: "items", type: "array", description: "Array of FAQ objects with question and answer" },
    ],
  },
  {
    type: "final_cta",
    label: "Final CTA Section",
    category: "content",
    description: "Bottom call-to-action section with headline, subtitle, and buttons",
    icon: "Megaphone",
    tenant_safe: true,
    requires_auth: false,
    requires_modules: [],
    allowed_layouts: ["public", "marketing"],
    props_schema: [
      { name: "headline", type: "string", default: "Ready to get started?" },
      { name: "subtitle", type: "string", default: "Join thousands of happy customers today" },
      { name: "primary_cta", type: "string", default: "Get Started Free" },
      { name: "secondary_cta", type: "string", default: "Talk to Sales" },
    ],
  },
];

// === Lookup Helpers ===

export function getComponentMeta(type: ComponentType): ComponentMeta | undefined {
  return componentRegistry.find((c) => c.type === type);
}

export function getComponentsByCategory(category: ComponentMeta["category"]): ComponentMeta[] {
  return componentRegistry.filter((c) => c.category === category);
}

export function getComponentsForLayout(layout: LayoutType): ComponentMeta[] {
  return componentRegistry.filter((c) => c.allowed_layouts.includes(layout));
}

export function getComponentsRequiringModule(module: string): ComponentMeta[] {
  return componentRegistry.filter((c) => c.requires_modules.includes(module));
}
