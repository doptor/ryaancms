// ============================================================
// RBAC Generator — Role-Based Access Control System
// Generates roles, permissions, middleware, and UI menu control
// ============================================================

import type { RoleConfig, AppConfig, CollectionConfig } from "./component-registry";

// === Core Types ===

export interface Permission {
  key: string;
  label: string;
  resource: string;
  actions: ("create" | "read" | "update" | "delete" | "manage")[];
}

export interface RBACRole {
  name: string;
  label: string;
  level: number; // hierarchy: 0 = superadmin, 10 = admin, 20 = manager, etc.
  permissions: string[];
  is_default: boolean;
  can_be_deleted: boolean;
}

export interface RBACPolicy {
  role: string;
  resource: string;
  actions: string[];
  conditions?: string; // e.g. "own_only", "tenant_only"
}

export interface RBACOutput {
  roles: RBACRole[];
  permissions: Permission[];
  policies: RBACPolicy[];
  middleware_code: string;
  menu_config: MenuAccess[];
  sql_schema: string;
}

export interface MenuAccess {
  route: string;
  page_name: string;
  allowed_roles: string[];
  icon?: string;
}

// === Default Roles ===

const DEFAULT_ROLES: RBACRole[] = [
  {
    name: "superadmin",
    label: "Super Admin",
    level: 0,
    permissions: ["*"],
    is_default: false,
    can_be_deleted: false,
  },
  {
    name: "admin",
    label: "Administrator",
    level: 10,
    permissions: [],
    is_default: false,
    can_be_deleted: false,
  },
  {
    name: "manager",
    label: "Manager",
    level: 20,
    permissions: [],
    is_default: false,
    can_be_deleted: true,
  },
  {
    name: "staff",
    label: "Staff",
    level: 30,
    permissions: [],
    is_default: false,
    can_be_deleted: true,
  },
  {
    name: "user",
    label: "User",
    level: 50,
    permissions: [],
    is_default: true,
    can_be_deleted: false,
  },
];

// === Generator ===

export function generateRBAC(config: AppConfig): RBACOutput {
  const permissions = generatePermissions(config);
  const roles = generateRoles(config, permissions);
  const policies = generatePolicies(roles, permissions);
  const middleware_code = generateMiddlewareCode();
  const menu_config = generateMenuConfig(config, roles);
  const sql_schema = generateRBACSql(roles, permissions);

  return { roles, permissions, policies, middleware_code, menu_config, sql_schema };
}

function generatePermissions(config: AppConfig): Permission[] {
  const permissions: Permission[] = [];

  // Generate CRUD permissions for each collection
  for (const col of config.collections) {
    const resource = col.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const actions: ("create" | "read" | "update" | "delete")[] = ["create", "read", "update", "delete"];

    for (const action of actions) {
      permissions.push({
        key: `${resource}.${action}`,
        label: `${action.charAt(0).toUpperCase() + action.slice(1)} ${col.name}`,
        resource,
        actions: [action],
      });
    }

    // Add manage permission (full control)
    permissions.push({
      key: `${resource}.manage`,
      label: `Manage ${col.name}`,
      resource,
      actions: ["manage"],
    });
  }

  // System-level permissions
  const systemPerms: { key: string; label: string }[] = [
    { key: "system.manage_users", label: "Manage Users" },
    { key: "system.manage_roles", label: "Manage Roles" },
    { key: "system.view_analytics", label: "View Analytics" },
    { key: "system.manage_settings", label: "Manage Settings" },
    { key: "system.view_audit_logs", label: "View Audit Logs" },
    { key: "system.manage_plugins", label: "Manage Plugins" },
    { key: "system.api_access", label: "API Access" },
    { key: "system.export_data", label: "Export Data" },
  ];

  for (const sp of systemPerms) {
    permissions.push({
      key: sp.key,
      label: sp.label,
      resource: "system",
      actions: ["manage"],
    });
  }

  return permissions;
}

function generateRoles(config: AppConfig, permissions: Permission[]): RBACRole[] {
  // Start with config roles if provided, otherwise use defaults
  const configRoles = config.roles || [];
  const allPermKeys = permissions.map((p) => p.key);

  if (configRoles.length > 0) {
    return configRoles.map((r, i) => ({
      name: r.name.toLowerCase().replace(/\s+/g, "_"),
      label: r.name,
      level: i * 10,
      permissions: r.permissions.includes("*") ? ["*"] : r.permissions,
      is_default: r.is_default || false,
      can_be_deleted: r.name.toLowerCase() !== "admin" && r.name.toLowerCase() !== "user",
    }));
  }

  // Use defaults and assign permissions based on level
  return DEFAULT_ROLES.map((role) => {
    let rolePerms: string[] = [];

    if (role.name === "superadmin") {
      rolePerms = ["*"];
    } else if (role.name === "admin") {
      rolePerms = allPermKeys; // all permissions
    } else if (role.name === "manager") {
      // All CRUD + view analytics
      rolePerms = allPermKeys.filter(
        (k) => !k.startsWith("system.manage_roles") && !k.startsWith("system.manage_plugins")
      );
    } else if (role.name === "staff") {
      // Read + create + update, no delete/manage
      rolePerms = allPermKeys.filter(
        (k) => k.endsWith(".read") || k.endsWith(".create") || k.endsWith(".update")
      );
    } else {
      // User: own data read/create/update only
      rolePerms = allPermKeys.filter((k) => k.endsWith(".read") || k.endsWith(".create"));
    }

    return { ...role, permissions: rolePerms };
  });
}

function generatePolicies(roles: RBACRole[], permissions: Permission[]): RBACPolicy[] {
  const policies: RBACPolicy[] = [];
  const resources = [...new Set(permissions.map((p) => p.resource))];

  for (const role of roles) {
    if (role.permissions.includes("*")) {
      // Superadmin: all resources, all actions
      for (const resource of resources) {
        policies.push({ role: role.name, resource, actions: ["*"] });
      }
      continue;
    }

    for (const resource of resources) {
      const rolePermKeys = role.permissions.filter((p) => p.startsWith(`${resource}.`));
      const actions = rolePermKeys.map((k) => k.split(".")[1]);
      if (actions.length > 0) {
        policies.push({
          role: role.name,
          resource,
          actions,
          conditions: role.level >= 50 ? "own_only" : undefined,
        });
      }
    }
  }

  return policies;
}

function generateMiddlewareCode(): string {
  return `// RBAC Middleware (Express.js)
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function requirePermission(...requiredPerms) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const userRole = await prisma.userRole.findFirst({
        where: { userId: req.user.id },
        include: { role: { include: { permissions: true } } },
      });

      if (!userRole) {
        return res.status(403).json({ success: false, message: "No role assigned" });
      }

      const userPerms = userRole.role.permissions.map((p) => p.key);

      // Superadmin bypass
      if (userPerms.includes("*")) return next();

      const hasAll = requiredPerms.every((rp) => userPerms.includes(rp));
      if (!hasAll) {
        return res.status(403).json({ success: false, message: "Insufficient permissions" });
      }

      req.userRole = userRole.role.name;
      req.userPermissions = userPerms;
      next();
    } catch (err) {
      return res.status(500).json({ success: false, message: "Permission check failed" });
    }
  };
}

function requireRole(...roles) {
  return async (req, res, next) => {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

      const userRole = await prisma.userRole.findFirst({
        where: { userId: req.user.id },
        include: { role: true },
      });

      if (!userRole || !roles.includes(userRole.role.name)) {
        return res.status(403).json({ success: false, message: "Role not authorized" });
      }

      req.userRole = userRole.role.name;
      next();
    } catch (err) {
      return res.status(500).json({ success: false, message: "Role check failed" });
    }
  };
}

module.exports = { requirePermission, requireRole };`;
}

function generateMenuConfig(config: AppConfig, roles: RBACRole[]): MenuAccess[] {
  return config.pages.map((page) => {
    let allowed: string[];

    if (page.layout === "auth" || page.layout === "public" || page.layout === "marketing") {
      allowed = ["*"]; // accessible to everyone
    } else if (page.requires_auth) {
      // Dashboard pages: filter by role level
      const pageRoles = page.roles || [];
      allowed =
        pageRoles.length > 0
          ? pageRoles
          : roles.filter((r) => r.level <= 30).map((r) => r.name); // staff+
    } else {
      allowed = ["*"];
    }

    return {
      route: page.route,
      page_name: page.name,
      allowed_roles: allowed,
    };
  });
}

function generateRBACSql(roles: RBACRole[], permissions: Permission[]): string {
  const lines: string[] = [
    "-- ============================================================",
    "-- RBAC Schema — Roles, Permissions, User Role Assignments",
    "-- ============================================================",
    "",
    "-- Role enum",
    `CREATE TYPE public.app_role AS ENUM (${roles.map((r) => `'${r.name}'`).join(", ")});`,
    "",
    "-- User roles table",
    "CREATE TABLE IF NOT EXISTS public.user_roles (",
    "  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,",
    "  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,",
    "  role app_role NOT NULL,",
    "  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),",
    "  UNIQUE (user_id, role)",
    ");",
    "",
    "ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;",
    "",
    "-- Permissions table",
    "CREATE TABLE IF NOT EXISTS public.role_permissions (",
    "  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,",
    "  role app_role NOT NULL,",
    "  permission_key TEXT NOT NULL,",
    "  resource TEXT NOT NULL,",
    "  actions TEXT[] NOT NULL DEFAULT '{}',",
    "  conditions TEXT,",
    "  UNIQUE (role, permission_key)",
    ");",
    "",
    "ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;",
    "",
    "-- Security definer function to check roles (avoids RLS recursion)",
    "CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)",
    "RETURNS BOOLEAN",
    "LANGUAGE sql",
    "STABLE",
    "SECURITY DEFINER",
    "SET search_path = public",
    "AS $$",
    "  SELECT EXISTS (",
    "    SELECT 1 FROM public.user_roles",
    "    WHERE user_id = _user_id AND role = _role",
    "  )",
    "$$;",
    "",
    "-- Check permission function",
    "CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission TEXT)",
    "RETURNS BOOLEAN",
    "LANGUAGE sql",
    "STABLE",
    "SECURITY DEFINER",
    "SET search_path = public",
    "AS $$",
    "  SELECT EXISTS (",
    "    SELECT 1 FROM public.user_roles ur",
    "    JOIN public.role_permissions rp ON ur.role = rp.role",
    "    WHERE ur.user_id = _user_id",
    "    AND (rp.permission_key = _permission OR rp.permission_key = '*')",
    "  )",
    "$$;",
    "",
    "-- RLS: Users can read their own roles",
    "CREATE POLICY \"Users can view own roles\"",
    "ON public.user_roles FOR SELECT",
    "USING (auth.uid() = user_id);",
    "",
    "-- RLS: Only admins can manage roles",
    "CREATE POLICY \"Admins can manage roles\"",
    "ON public.user_roles FOR ALL",
    "USING (public.has_role(auth.uid(), 'admin'));",
    "",
    "-- RLS: Permissions readable by authenticated users",
    "CREATE POLICY \"Authenticated can read permissions\"",
    "ON public.role_permissions FOR SELECT",
    "USING (auth.uid() IS NOT NULL);",
    "",
    "-- Seed default permissions",
    ...permissions.map(
      (p) =>
        `INSERT INTO public.role_permissions (role, permission_key, resource, actions) VALUES ('admin', '${p.key}', '${p.resource}', ARRAY[${p.actions.map((a) => `'${a}'`).join(",")}]) ON CONFLICT DO NOTHING;`
    ),
    "",
    "-- Assign default role trigger",
    "CREATE OR REPLACE FUNCTION public.assign_default_role()",
    "RETURNS TRIGGER",
    "LANGUAGE plpgsql",
    "SECURITY DEFINER",
    "SET search_path = public",
    "AS $$",
    "BEGIN",
    "  INSERT INTO public.user_roles (user_id, role)",
    `  VALUES (NEW.id, 'user')`,
    "  ON CONFLICT DO NOTHING;",
    "  RETURN NEW;",
    "END;",
    "$$;",
    "",
  ];

  return lines.join("\n");
}
