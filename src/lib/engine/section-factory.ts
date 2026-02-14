// ============================================================
// Section Factory — Dynamic Section Registry + CRUD Generator
// Allows AI to dynamically create and register new sections
// ============================================================

import type { ComponentMeta, ComponentType, LayoutType, PropSchema } from "./component-registry";

// === Dynamic Section Registry ===

export interface DynamicSection {
  type: string;
  label: string;
  category: ComponentMeta["category"];
  description: string;
  icon: string;
  props_schema: PropSchema[];
  allowed_layouts: LayoutType[];
}

// Extensible section registry — AI can add new section types at runtime
const dynamicSections: Map<string, DynamicSection> = new Map();

export function registerSection(section: DynamicSection): void {
  dynamicSections.set(section.type, section);
}

export function getSection(type: string): DynamicSection | undefined {
  return dynamicSections.get(type);
}

export function getAllDynamicSections(): DynamicSection[] {
  return Array.from(dynamicSections.values());
}

export function isDynamicSection(type: string): boolean {
  return dynamicSections.has(type);
}

// === CRUD Generator Engine ===

export interface EntityDefinition {
  name: string;
  fields: EntityField[];
  permissions?: string[];
  soft_delete?: boolean;
  searchable_fields?: string[];
}

export interface EntityField {
  name: string;
  type: "string" | "number" | "boolean" | "date" | "email" | "url" | "text" | "enum" | "relation" | "json" | "media";
  required?: boolean;
  unique?: boolean;
  indexed?: boolean;
  default?: string;
  enum_values?: string[];
  relation_to?: string;
  label?: string;
}

export interface CrudGeneratorOutput {
  collection: {
    name: string;
    fields: { name: string; type: string; required?: boolean; unique?: boolean; indexed?: boolean; default?: string; relation_to?: string }[];
    rls: boolean;
    tenant_isolated: boolean;
    audit_fields: boolean;
    soft_delete: boolean;
  };
  api_endpoints: {
    method: "GET" | "POST" | "PUT" | "DELETE";
    path: string;
    description: string;
    auth_required: boolean;
  }[];
  pages: {
    name: string;
    route: string;
    layout: "dashboard";
    components: { type: string; props: Record<string, any> }[];
    requires_auth: boolean;
  }[];
}

export function generateCrudFromEntity(entity: EntityDefinition): CrudGeneratorOutput {
  const tableName = entity.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
  const displayName = entity.name.charAt(0).toUpperCase() + entity.name.slice(1);
  const pluralName = displayName.endsWith("s") ? displayName : displayName + "s";

  // Generate collection schema
  const collection = {
    name: tableName,
    fields: entity.fields.map((f) => ({
      name: f.name.toLowerCase().replace(/[^a-z0-9]/g, "_"),
      type: f.type === "string" || f.type === "text" ? "text" : f.type === "number" ? "number" : f.type === "email" ? "email" : f.type === "url" ? "url" : f.type,
      required: f.required,
      unique: f.unique,
      indexed: f.indexed,
      default: f.default,
      relation_to: f.relation_to,
    })),
    rls: true,
    tenant_isolated: false,
    audit_fields: true,
    soft_delete: entity.soft_delete ?? false,
  };

  // Generate REST API endpoints
  const api_endpoints = [
    { method: "GET" as const, path: `/api/${tableName}`, description: `List all ${pluralName}`, auth_required: true },
    { method: "GET" as const, path: `/api/${tableName}/:id`, description: `Get ${displayName} by ID`, auth_required: true },
    { method: "POST" as const, path: `/api/${tableName}`, description: `Create new ${displayName}`, auth_required: true },
    { method: "PUT" as const, path: `/api/${tableName}/:id`, description: `Update ${displayName}`, auth_required: true },
    { method: "DELETE" as const, path: `/api/${tableName}/:id`, description: `Delete ${displayName}`, auth_required: true },
  ];

  // Generate UI pages
  const columns = entity.fields.filter((f) => f.type !== "json" && f.type !== "media").slice(0, 6).map((f) => f.name);
  const searchFields = entity.searchable_fields || entity.fields.filter((f) => f.type === "string" || f.type === "text" || f.type === "email").map((f) => f.name).slice(0, 3);

  const pages = [
    {
      name: pluralName,
      route: `/${tableName}`,
      layout: "dashboard" as const,
      requires_auth: true,
      components: [
        {
          type: "stats_row",
          props: {
            metrics: [
              { label: `Total ${pluralName}`, value: "0", icon: "Package" },
              { label: "Active", value: "0", icon: "CheckCircle" },
              { label: "This Month", value: "0", icon: "Calendar" },
            ],
          },
        },
        {
          type: "crud_table",
          props: {
            collection: tableName,
            columns,
            searchable: true,
            sortable: true,
            paginated: true,
            page_size: 20,
            bulk_actions: true,
          },
        },
      ],
    },
  ];

  return { collection, api_endpoints, pages };
}

// === Auto-Fix Build Loop ===

export interface BuildLoopState {
  attempt: number;
  maxAttempts: number;
  errors: string[];
  fixes: string[];
  status: "idle" | "building" | "testing" | "fixing" | "success" | "failed";
}

export function createBuildLoop(maxAttempts: number = 5): BuildLoopState {
  return {
    attempt: 0,
    maxAttempts,
    errors: [],
    fixes: [],
    status: "idle",
  };
}

export function recordBuildError(state: BuildLoopState, error: string): BuildLoopState {
  return {
    ...state,
    attempt: state.attempt + 1,
    errors: [...state.errors, error],
    status: state.attempt + 1 >= state.maxAttempts ? "failed" : "fixing",
  };
}

export function recordBuildFix(state: BuildLoopState, fix: string): BuildLoopState {
  return {
    ...state,
    fixes: [...state.fixes, fix],
    status: "building",
  };
}

export function markBuildSuccess(state: BuildLoopState): BuildLoopState {
  return { ...state, status: "success" };
}

// === Plugin Architecture Helper ===

export interface PluginDefinition {
  slug: string;
  name: string;
  description: string;
  entities: EntityDefinition[];
  permissions: string[];
  routes: { path: string; page: string; icon: string }[];
  hooks: string[];
}

export function generatePluginStructure(plugin: PluginDefinition): {
  collections: CrudGeneratorOutput["collection"][];
  api_endpoints: CrudGeneratorOutput["api_endpoints"];
  pages: CrudGeneratorOutput["pages"];
} {
  const allCollections: CrudGeneratorOutput["collection"][] = [];
  const allEndpoints: CrudGeneratorOutput["api_endpoints"] = [];
  const allPages: CrudGeneratorOutput["pages"] = [];

  for (const entity of plugin.entities) {
    const crud = generateCrudFromEntity(entity);
    allCollections.push(crud.collection);
    allEndpoints.push(...crud.api_endpoints);
    allPages.push(...crud.pages);
  }

  return { collections: allCollections, api_endpoints: allEndpoints, pages: allPages };
}
