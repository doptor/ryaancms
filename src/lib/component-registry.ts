// Engine 2: Component Registry
// JSON-driven catalog of all available components AI can select and configure

export type ComponentType =
  | "hero" | "navbar" | "footer" | "sidebar"
  | "crud_table" | "form" | "chart" | "card_grid"
  | "stats_row" | "auth_form" | "pricing_table"
  | "media_gallery" | "search_bar" | "notification_center"
  | "rich_text_editor" | "file_upload" | "calendar"
  | "kanban_board" | "timeline" | "map";

export interface ComponentConfig {
  type: ComponentType;
  props?: Record<string, any>;
}

export interface PageConfig {
  name: string;
  route: string;
  layout: "public" | "dashboard" | "auth" | "fullscreen";
  components: ComponentConfig[];
}

export interface CollectionField {
  name: string;
  type: "text" | "number" | "boolean" | "date" | "relation" | "json" | "media" | "enum" | "uuid" | "email";
  required?: boolean;
  default?: string;
}

export interface CollectionConfig {
  name: string;
  fields: CollectionField[];
  rls?: boolean;
}

export interface RoleConfig {
  name: string;
  permissions: string[];
}

export interface StyleConfig {
  primary_color?: string;
  theme?: "light" | "dark" | "auto";
  font?: string;
  border_radius?: "none" | "sm" | "md" | "lg" | "full";
}

export interface AppConfig {
  project_type: "landing" | "blog" | "saas" | "ecommerce" | "portfolio" | "dashboard" | "marketplace" | "custom";
  title: string;
  description: string;
  modules: string[];
  roles?: RoleConfig[];
  features?: string[];
  pages: PageConfig[];
  collections: CollectionConfig[];
  style?: StyleConfig;
}

// Component metadata for the registry
export interface ComponentMeta {
  type: ComponentType;
  label: string;
  category: "layout" | "content" | "data" | "interaction" | "media";
  description: string;
  icon: string; // lucide icon name
}

export const componentRegistry: ComponentMeta[] = [
  { type: "hero", label: "Hero Section", category: "layout", description: "Full-width hero with headline, subtitle, and CTA", icon: "Sparkles" },
  { type: "navbar", label: "Navigation Bar", category: "layout", description: "Top navigation with logo, links, and actions", icon: "Menu" },
  { type: "footer", label: "Footer", category: "layout", description: "Site footer with links, social, and copyright", icon: "ArrowDown" },
  { type: "sidebar", label: "Sidebar", category: "layout", description: "Side navigation panel", icon: "PanelLeft" },
  { type: "crud_table", label: "CRUD Table", category: "data", description: "Data table with create, read, update, delete", icon: "Table" },
  { type: "form", label: "Form", category: "interaction", description: "Dynamic form with validation", icon: "FileText" },
  { type: "chart", label: "Chart", category: "data", description: "Data visualization chart", icon: "BarChart3" },
  { type: "card_grid", label: "Card Grid", category: "content", description: "Grid of content cards", icon: "LayoutGrid" },
  { type: "stats_row", label: "Stats Row", category: "data", description: "Key metrics in a horizontal row", icon: "TrendingUp" },
  { type: "auth_form", label: "Auth Form", category: "interaction", description: "Login/signup form with social auth", icon: "Lock" },
  { type: "pricing_table", label: "Pricing Table", category: "content", description: "Pricing plans comparison", icon: "CreditCard" },
  { type: "media_gallery", label: "Media Gallery", category: "media", description: "Image/video gallery grid", icon: "Image" },
  { type: "search_bar", label: "Search Bar", category: "interaction", description: "Search with filters and suggestions", icon: "Search" },
  { type: "notification_center", label: "Notifications", category: "interaction", description: "Notification feed and management", icon: "Bell" },
  { type: "rich_text_editor", label: "Rich Text Editor", category: "content", description: "WYSIWYG content editor", icon: "Edit" },
  { type: "file_upload", label: "File Upload", category: "media", description: "Drag-and-drop file uploader", icon: "Upload" },
  { type: "calendar", label: "Calendar", category: "data", description: "Event calendar view", icon: "Calendar" },
  { type: "kanban_board", label: "Kanban Board", category: "data", description: "Drag-and-drop task board", icon: "Columns" },
  { type: "timeline", label: "Timeline", category: "content", description: "Chronological event timeline", icon: "Clock" },
  { type: "map", label: "Map", category: "media", description: "Interactive map view", icon: "MapPin" },
];

// Validate AI output against registry
export function validateAppConfig(config: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!config.project_type) errors.push("Missing project_type");
  if (!config.title) errors.push("Missing title");
  if (!config.pages || !Array.isArray(config.pages)) errors.push("Missing or invalid pages");
  if (!config.collections || !Array.isArray(config.collections)) errors.push("Missing or invalid collections");
  
  const validTypes = componentRegistry.map(c => c.type);
  
  if (config.pages) {
    for (const page of config.pages) {
      if (!page.name || !page.route) {
        errors.push(`Page missing name or route`);
      }
      if (page.components) {
        for (const comp of page.components) {
          if (!validTypes.includes(comp.type)) {
            errors.push(`Unknown component type: ${comp.type}`);
          }
        }
      }
    }
  }

  if (config.collections) {
    for (const col of config.collections) {
      if (!col.name || !col.fields) {
        errors.push(`Collection missing name or fields`);
      }
    }
  }
  
  return { valid: errors.length === 0, errors };
}
