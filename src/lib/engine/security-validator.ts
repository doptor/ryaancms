// ============================================================
// Engine 4: Security & Validation Layer
// Validates all AI outputs before execution
// ============================================================

import type { AppConfig, CollectionConfig, PageConfig, ComponentConfig } from "./component-registry";
import { componentRegistry, getComponentMeta } from "./component-registry";

export type ValidationSeverity = "error" | "warning" | "info";

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  info: ValidationIssue[];
  score: number; // 0-100 security score
}

export interface ValidationIssue {
  severity: ValidationSeverity;
  category: string;
  message: string;
  path?: string;
  fix?: string;
}

// Reserved/dangerous field names
const DANGEROUS_FIELD_NAMES = [
  "password", "secret", "token", "api_key", "private_key",
  "credit_card", "ssn", "social_security",
];

const SQL_INJECTION_PATTERNS = [
  /;\s*drop\s+/i, /;\s*delete\s+/i, /;\s*update\s+/i,
  /;\s*insert\s+/i, /--/, /\/\*/, /\*\//, /xp_/i,
  /exec\s*\(/i, /union\s+select/i,
];

export function validateAppConfig(config: any): ValidationResult {
  const issues: ValidationIssue[] = [];

  // ---- Structure Validation ----
  validateStructure(config, issues);

  // ---- Security Validation ----
  validateSecurity(config, issues);

  // ---- Component Validation ----
  validateComponents(config, issues);

  // ---- Database Validation ----
  validateCollections(config, issues);

  // ---- Cross-Reference Validation ----
  validateCrossReferences(config, issues);

  // ---- Multi-Tenant Validation ----
  if (config.multi_tenant) {
    validateMultiTenant(config, issues);
  }

  // Categorize
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  const info = issues.filter((i) => i.severity === "info");

  // Calculate security score
  const score = Math.max(0, 100 - errors.length * 15 - warnings.length * 5);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    info,
    score,
  };
}

function validateStructure(config: any, issues: ValidationIssue[]) {
  if (!config.project_type) {
    issues.push({ severity: "error", category: "structure", message: "Missing project_type" });
  }
  if (!config.title || typeof config.title !== "string") {
    issues.push({ severity: "error", category: "structure", message: "Missing or invalid title" });
  }
  if (!config.pages || !Array.isArray(config.pages) || config.pages.length === 0) {
    issues.push({ severity: "error", category: "structure", message: "No pages defined" });
  }
  if (!config.collections || !Array.isArray(config.collections)) {
    issues.push({ severity: "error", category: "structure", message: "No collections defined" });
  }
  if (!config.modules || !Array.isArray(config.modules)) {
    issues.push({ severity: "warning", category: "structure", message: "No modules specified" });
  }

  // Check for duplicate routes
  if (config.pages) {
    const routes = new Set<string>();
    for (const page of config.pages) {
      if (routes.has(page.route)) {
        issues.push({
          severity: "error",
          category: "structure",
          message: `Duplicate route: ${page.route}`,
          path: `pages.${page.name}`,
        });
      }
      routes.add(page.route);
    }
  }
}

function validateSecurity(config: any, issues: ValidationIssue[]) {
  // Check auth module requirement
  const hasAuthPages = config.pages?.some((p: PageConfig) =>
    p.components?.some((c: ComponentConfig) => c.type === "auth_form")
  );
  const hasAuthModule = config.modules?.includes("auth");
  const hasDashboardPages = config.pages?.some((p: PageConfig) => p.layout === "dashboard");

  if (hasDashboardPages && !hasAuthModule) {
    issues.push({
      severity: "error",
      category: "security",
      message: "Dashboard pages require auth module",
      fix: 'Add "auth" to modules array',
    });
  }

  if (hasAuthPages && !hasAuthModule) {
    issues.push({
      severity: "error",
      category: "security",
      message: "Auth form components require auth module",
      fix: 'Add "auth" to modules array',
    });
  }

  // Check RLS on all collections
  if (config.collections) {
    for (const col of config.collections as CollectionConfig[]) {
      if (!col.rls) {
        issues.push({
          severity: "warning",
          category: "security",
          message: `Collection "${col.name}" has no RLS — data publicly accessible`,
          path: `collections.${col.name}`,
          fix: "Enable RLS for user-specific data",
        });
      }
    }
  }

  // Check for dangerous field names
  if (config.collections) {
    for (const col of config.collections as CollectionConfig[]) {
      for (const field of col.fields) {
        if (DANGEROUS_FIELD_NAMES.includes(field.name.toLowerCase())) {
          issues.push({
            severity: "warning",
            category: "security",
            message: `Field "${field.name}" in "${col.name}" may contain sensitive data`,
            path: `collections.${col.name}.${field.name}`,
            fix: "Ensure encryption or hashing for sensitive fields",
          });
        }
      }
    }
  }

  // Check roles exist if auth module is present
  if (hasAuthModule && (!config.roles || config.roles.length === 0)) {
    issues.push({
      severity: "warning",
      category: "security",
      message: "Auth module enabled but no roles defined",
      fix: "Add at least admin and user roles",
    });
  }

  // Check page auth requirements
  if (config.pages) {
    for (const page of config.pages as PageConfig[]) {
      if (page.layout === "dashboard" && !page.requires_auth) {
        issues.push({
          severity: "warning",
          category: "security",
          message: `Dashboard page "${page.name}" should require authentication`,
          path: `pages.${page.name}`,
          fix: "Set requires_auth: true",
        });
      }
    }
  }
}

function validateComponents(config: any, issues: ValidationIssue[]) {
  if (!config.pages) return;

  const validTypes = componentRegistry.map((c) => c.type);

  for (const page of config.pages as PageConfig[]) {
    if (!page.components) continue;

    for (const comp of page.components) {
      // Check valid type
      if (!validTypes.includes(comp.type as any)) {
        issues.push({
          severity: "error",
          category: "component",
          message: `Unknown component type "${comp.type}" on page "${page.name}"`,
          path: `pages.${page.name}.components`,
        });
        continue;
      }

      const meta = getComponentMeta(comp.type as any);
      if (!meta) continue;

      // Check layout compatibility
      if (!meta.allowed_layouts.includes(page.layout as any)) {
        issues.push({
          severity: "warning",
          category: "component",
          message: `Component "${comp.type}" not recommended for "${page.layout}" layout on page "${page.name}"`,
          path: `pages.${page.name}.${comp.type}`,
        });
      }

      // Check module requirements
      for (const mod of meta.requires_modules) {
        if (!config.modules?.includes(mod)) {
          issues.push({
            severity: "error",
            category: "component",
            message: `Component "${comp.type}" on "${page.name}" requires "${mod}" module`,
            fix: `Add "${mod}" to modules array`,
          });
        }
      }

      // Validate required props
      if (meta.props_schema) {
        for (const propDef of meta.props_schema) {
          if (propDef.required && (!comp.props || comp.props[propDef.name] === undefined)) {
            issues.push({
              severity: "warning",
              category: "component",
              message: `Component "${comp.type}" on "${page.name}" missing required prop "${propDef.name}"`,
              path: `pages.${page.name}.${comp.type}.props`,
            });
          }
        }
      }
    }
  }
}

function validateCollections(config: any, issues: ValidationIssue[]) {
  if (!config.collections) return;

  const collectionNames = new Set<string>();

  for (const col of config.collections as CollectionConfig[]) {
    // Check duplicate names
    const normalized = col.name.toLowerCase().replace(/\s+/g, "_");
    if (collectionNames.has(normalized)) {
      issues.push({
        severity: "error",
        category: "database",
        message: `Duplicate collection name: "${col.name}"`,
      });
    }
    collectionNames.add(normalized);

    // Check field count
    if (!col.fields || col.fields.length === 0) {
      issues.push({
        severity: "error",
        category: "database",
        message: `Collection "${col.name}" has no fields`,
      });
    }

    // Check audit fields
    if (col.audit_fields === false) {
      issues.push({
        severity: "info",
        category: "database",
        message: `Collection "${col.name}" has audit fields disabled — consider enabling for traceability`,
      });
    }

    // Validate field names for SQL injection
    if (col.fields) {
      for (const field of col.fields) {
        for (const pattern of SQL_INJECTION_PATTERNS) {
          if (pattern.test(field.name)) {
            issues.push({
              severity: "error",
              category: "security",
              message: `Potentially malicious field name "${field.name}" in "${col.name}"`,
              fix: "Remove SQL injection patterns from field names",
            });
          }
        }

        // Check field name length
        if (field.name.length > 63) {
          issues.push({
            severity: "error",
            category: "database",
            message: `Field name "${field.name}" exceeds PostgreSQL 63-char limit`,
          });
        }
      }
    }
  }
}

function validateCrossReferences(config: any, issues: ValidationIssue[]) {
  if (!config.collections || !config.pages) return;

  const collectionNames = new Set(
    (config.collections as CollectionConfig[]).map((c) => c.name.toLowerCase().replace(/\s+/g, "_"))
  );

  // Check that component data sources reference existing collections
  for (const page of config.pages as PageConfig[]) {
    if (!page.components) continue;
    for (const comp of page.components) {
      if (comp.props?.collection) {
        const ref = comp.props.collection.toLowerCase().replace(/\s+/g, "_");
        if (!collectionNames.has(ref)) {
          issues.push({
            severity: "warning",
            category: "reference",
            message: `Component "${comp.type}" on "${page.name}" references unknown collection "${comp.props.collection}"`,
            fix: `Add "${comp.props.collection}" to collections or fix the reference`,
          });
        }
      }
    }
  }

  // Check relation fields
  for (const col of config.collections as CollectionConfig[]) {
    if (!col.fields) continue;
    for (const field of col.fields) {
      if (field.type === "relation" && field.relation_to) {
        const ref = field.relation_to.toLowerCase().replace(/\s+/g, "_");
        if (!collectionNames.has(ref)) {
          issues.push({
            severity: "warning",
            category: "reference",
            message: `Field "${field.name}" in "${col.name}" references unknown collection "${field.relation_to}"`,
          });
        }
      }
    }
  }
}

function validateMultiTenant(config: any, issues: ValidationIssue[]) {
  if (!config.collections) return;

  for (const col of config.collections as CollectionConfig[]) {
    if (!col.tenant_isolated) {
      issues.push({
        severity: "warning",
        category: "multi-tenant",
        message: `Collection "${col.name}" is not tenant-isolated in a multi-tenant project`,
        fix: "Set tenant_isolated: true for tenant-specific data",
      });
    }
  }
}
