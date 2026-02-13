// ============================================================
// Engine 3: Database Schema Generator
// Converts AI JSON collections to PostgreSQL migration SQL with RLS
// ============================================================

import type { CollectionConfig, CollectionField, AppConfig, RoleConfig } from "./component-registry";

const FIELD_TYPE_MAP: Record<string, string> = {
  text: "TEXT",
  number: "NUMERIC",
  boolean: "BOOLEAN",
  date: "DATE",
  timestamp: "TIMESTAMP WITH TIME ZONE",
  relation: "UUID",
  json: "JSONB",
  media: "TEXT", // URL reference
  enum: "TEXT",
  uuid: "UUID",
  email: "TEXT",
  url: "TEXT",
  password: "TEXT",
};

// Naming conventions validation
const RESERVED_TABLE_NAMES = [
  "user", "users", "role", "roles", "session", "sessions",
  "order", "group", "table", "column", "index", "select",
  "insert", "update", "delete", "create", "drop", "alter",
];

function sanitizeTableName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_|_$/g, "");
}

function sanitizeFieldName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_|_$/g, "");
}

export interface GeneratedSchema {
  tables: GeneratedTable[];
  sql: string;
  warnings: string[];
}

export interface GeneratedTable {
  name: string;
  original_name: string;
  sql: string;
  rls_sql: string;
  fields: { name: string; sql_type: string; constraints: string }[];
}

export function generateDatabaseSchema(config: AppConfig): GeneratedSchema {
  const warnings: string[] = [];
  const tables: GeneratedTable[] = [];
  const tableNames = new Set<string>();

  for (const collection of config.collections) {
    const tableName = sanitizeTableName(collection.name);

    // Check for reserved names
    if (RESERVED_TABLE_NAMES.includes(tableName)) {
      warnings.push(`Table name "${tableName}" is reserved. Renamed to "app_${tableName}".`);
    }

    const finalName = RESERVED_TABLE_NAMES.includes(tableName) ? `app_${tableName}` : tableName;

    // Check for duplicates
    if (tableNames.has(finalName)) {
      warnings.push(`Duplicate table name "${finalName}" skipped.`);
      continue;
    }
    tableNames.add(finalName);

    const table = generateTable(finalName, collection, config, warnings);
    tables.push(table);
  }

  // Generate combined SQL
  const sql = [
    "-- ============================================================",
    `-- RyaanCMS AI Builder — Database Schema`,
    `-- Project: ${config.title}`,
    `-- Type: ${config.project_type}`,
    `-- Generated: ${new Date().toISOString()}`,
    "-- ============================================================",
    "",
    ...tables.map((t) => t.sql),
    "",
    "-- Row-Level Security Policies",
    ...tables.map((t) => t.rls_sql).filter(Boolean),
    "",
    "-- Update triggers",
    ...tables.map((t) => generateUpdateTrigger(t.name)),
  ].join("\n");

  return { tables, sql, warnings };
}

function generateTable(
  name: string,
  collection: CollectionConfig,
  config: AppConfig,
  warnings: string[]
): GeneratedTable {
  const fields: { name: string; sql_type: string; constraints: string }[] = [];

  // Always add id
  fields.push({
    name: "id",
    sql_type: "UUID",
    constraints: "NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY",
  });

  // Add user_id if RLS enabled
  if (collection.rls) {
    fields.push({
      name: "user_id",
      sql_type: "UUID",
      constraints: "NOT NULL",
    });
  }

  // Add tenant_id if tenant isolated
  if (collection.tenant_isolated) {
    fields.push({
      name: "tenant_id",
      sql_type: "UUID",
      constraints: "NOT NULL",
    });
  }

  // Process user-defined fields
  for (const field of collection.fields) {
    const fieldName = sanitizeFieldName(field.name);

    // Skip if it's a system field we already added
    if (["id", "user_id", "tenant_id", "created_at", "updated_at", "deleted_at"].includes(fieldName)) {
      continue;
    }

    const sqlType = FIELD_TYPE_MAP[field.type] || "TEXT";
    const constraints: string[] = [];

    if (field.required) constraints.push("NOT NULL");
    if (field.unique) constraints.push("UNIQUE");
    if (field.default) {
      const defaultVal = field.type === "boolean"
        ? field.default
        : field.type === "number"
          ? field.default
          : `'${field.default}'`;
      constraints.push(`DEFAULT ${defaultVal}`);
    }

    // Validate relation fields
    if (field.type === "relation" && field.relation_to) {
      const targetTable = sanitizeTableName(field.relation_to);
      constraints.push(`REFERENCES public.${targetTable}(id) ON DELETE CASCADE`);
    }

    fields.push({
      name: fieldName,
      sql_type: sqlType,
      constraints: constraints.join(" "),
    });
  }

  // Add audit fields
  if (collection.audit_fields !== false) {
    fields.push({
      name: "created_at",
      sql_type: "TIMESTAMP WITH TIME ZONE",
      constraints: "NOT NULL DEFAULT now()",
    });
    fields.push({
      name: "updated_at",
      sql_type: "TIMESTAMP WITH TIME ZONE",
      constraints: "NOT NULL DEFAULT now()",
    });
  }

  // Soft delete
  if (collection.soft_delete) {
    fields.push({
      name: "deleted_at",
      sql_type: "TIMESTAMP WITH TIME ZONE",
      constraints: "DEFAULT NULL",
    });
  }

  // Build CREATE TABLE
  const fieldLines = fields.map(
    (f) => `  ${f.name} ${f.sql_type} ${f.constraints}`.trimEnd()
  );

  const sql = [
    `-- Table: ${name}`,
    `CREATE TABLE IF NOT EXISTS public.${name} (`,
    fieldLines.join(",\n"),
    ");",
    "",
    `ALTER TABLE public.${name} ENABLE ROW LEVEL SECURITY;`,
    "",
  ].join("\n");

  // Generate RLS policies
  const rls_sql = collection.rls
    ? generateRlsPolicies(name, collection.tenant_isolated)
    : "";

  // Add indexes
  const indexLines: string[] = [];
  for (const field of collection.fields) {
    if (field.indexed) {
      const fieldName = sanitizeFieldName(field.name);
      indexLines.push(`CREATE INDEX IF NOT EXISTS idx_${name}_${fieldName} ON public.${name}(${fieldName});`);
    }
  }
  if (collection.rls) {
    indexLines.push(`CREATE INDEX IF NOT EXISTS idx_${name}_user_id ON public.${name}(user_id);`);
  }
  if (collection.tenant_isolated) {
    indexLines.push(`CREATE INDEX IF NOT EXISTS idx_${name}_tenant_id ON public.${name}(tenant_id);`);
  }

  const fullSql = sql + (indexLines.length ? "\n" + indexLines.join("\n") + "\n" : "");

  return { name, original_name: collection.name, sql: fullSql, rls_sql, fields };
}

function generateRlsPolicies(tableName: string, tenantIsolated: boolean): string {
  const condition = tenantIsolated
    ? "(auth.uid() = user_id AND tenant_id = current_setting('app.tenant_id')::uuid)"
    : "(auth.uid() = user_id)";

  return [
    `-- RLS for ${tableName}`,
    `CREATE POLICY "Users can view own ${tableName}"`,
    `ON public.${tableName} FOR SELECT`,
    `USING ${condition};`,
    "",
    `CREATE POLICY "Users can insert own ${tableName}"`,
    `ON public.${tableName} FOR INSERT`,
    `WITH CHECK ${condition};`,
    "",
    `CREATE POLICY "Users can update own ${tableName}"`,
    `ON public.${tableName} FOR UPDATE`,
    `USING ${condition};`,
    "",
    `CREATE POLICY "Users can delete own ${tableName}"`,
    `ON public.${tableName} FOR DELETE`,
    `USING ${condition};`,
    "",
  ].join("\n");
}

function generateUpdateTrigger(tableName: string): string {
  return [
    `CREATE TRIGGER update_${tableName}_updated_at`,
    `BEFORE UPDATE ON public.${tableName}`,
    `FOR EACH ROW`,
    `EXECUTE FUNCTION public.update_updated_at_column();`,
    "",
  ].join("\n");
}
