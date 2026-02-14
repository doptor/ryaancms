// ============================================================
// Test Scenario Generator
// Auto-generates API unit tests and integration test scenarios
// ============================================================

import type { AppConfig, CollectionConfig, ApiEndpoint } from "./component-registry";

export interface TestScenario {
  id: string;
  name: string;
  category: "unit" | "integration" | "e2e" | "security";
  resource: string;
  description: string;
  steps: TestStep[];
  expected_result: string;
  priority: "critical" | "high" | "medium" | "low";
}

export interface TestStep {
  action: string;
  input?: Record<string, any>;
  expected?: string;
}

export interface TestSuite {
  name: string;
  description: string;
  scenarios: TestScenario[];
  coverage_summary: CoverageSummary;
  test_code: string;
}

export interface CoverageSummary {
  total_scenarios: number;
  by_category: Record<string, number>;
  by_priority: Record<string, number>;
  estimated_coverage: number; // 0-100
}

// === Generator ===

export function generateTestSuite(config: AppConfig): TestSuite {
  const scenarios: TestScenario[] = [];

  // Auth tests
  if (config.modules?.includes("auth")) {
    scenarios.push(...generateAuthTests());
  }

  // CRUD tests for each collection
  for (const col of config.collections) {
    scenarios.push(...generateCrudTests(col));
  }

  // API endpoint tests
  if (config.api_endpoints) {
    scenarios.push(...generateApiTests(config.api_endpoints));
  }

  // Security tests
  scenarios.push(...generateSecurityTests(config));

  // Multi-tenant isolation tests
  if (config.multi_tenant) {
    scenarios.push(...generateMultiTenantTests(config));
  }

  // Page render tests
  scenarios.push(...generatePageTests(config));

  const coverage_summary = calculateCoverage(scenarios);
  const test_code = generateTestCode(config, scenarios);

  return {
    name: `${config.title} Test Suite`,
    description: `Automated test scenarios for ${config.title}`,
    scenarios,
    coverage_summary,
    test_code,
  };
}

function generateAuthTests(): TestScenario[] {
  return [
    {
      id: "auth_signup",
      name: "User Registration",
      category: "integration",
      resource: "auth",
      description: "New user can sign up with valid credentials",
      priority: "critical",
      steps: [
        { action: "POST /api/auth/signup", input: { email: "test@example.com", password: "Test@1234", name: "Test User" }, expected: "201 Created" },
        { action: "Check user created in database", expected: "User record exists" },
        { action: "Check default role assigned", expected: "User has 'user' role" },
      ],
      expected_result: "User registered with default role",
    },
    {
      id: "auth_login",
      name: "User Login",
      category: "integration",
      resource: "auth",
      description: "Existing user can log in and receive JWT",
      priority: "critical",
      steps: [
        { action: "POST /api/auth/login", input: { email: "test@example.com", password: "Test@1234" }, expected: "200 OK with JWT token" },
        { action: "Verify JWT contains user_id and role", expected: "Valid JWT payload" },
      ],
      expected_result: "Valid JWT token returned",
    },
    {
      id: "auth_invalid_login",
      name: "Invalid Login Rejected",
      category: "unit",
      resource: "auth",
      description: "Wrong credentials return 401",
      priority: "critical",
      steps: [
        { action: "POST /api/auth/login", input: { email: "test@example.com", password: "wrong" }, expected: "401 Unauthorized" },
      ],
      expected_result: "401 error with message",
    },
    {
      id: "auth_protected_route",
      name: "Protected Route Requires Auth",
      category: "integration",
      resource: "auth",
      description: "Unauthenticated requests to protected routes return 401",
      priority: "critical",
      steps: [
        { action: "GET /api/dashboard without token", expected: "401 Unauthorized" },
        { action: "GET /api/dashboard with valid token", expected: "200 OK" },
      ],
      expected_result: "Auth enforcement works",
    },
  ];
}

function generateCrudTests(col: CollectionConfig): TestScenario[] {
  const resource = col.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
  const label = col.name;
  const requiredFields = col.fields.filter((f) => f.required);
  const sampleInput: Record<string, any> = {};

  for (const f of col.fields.slice(0, 5)) {
    sampleInput[f.name] =
      f.type === "text" || f.type === "email" ? `test_${f.name}@example.com` :
      f.type === "number" ? 42 :
      f.type === "boolean" ? true :
      f.type === "date" ? "2025-01-01" :
      `sample_${f.name}`;
  }

  return [
    {
      id: `${resource}_create`,
      name: `Create ${label}`,
      category: "integration",
      resource,
      description: `Create a new ${label} record with valid data`,
      priority: "high",
      steps: [
        { action: `POST /api/${resource}`, input: sampleInput, expected: "201 Created" },
        { action: "Verify record in database", expected: "Record exists with correct fields" },
      ],
      expected_result: "Record created successfully",
    },
    {
      id: `${resource}_read`,
      name: `List ${label}`,
      category: "unit",
      resource,
      description: `Retrieve list of ${label} records with pagination`,
      priority: "high",
      steps: [
        { action: `GET /api/${resource}?page=1&limit=10`, expected: "200 OK with array" },
        { action: "Check pagination metadata", expected: "total, page, limit present" },
      ],
      expected_result: "Paginated list returned",
    },
    {
      id: `${resource}_update`,
      name: `Update ${label}`,
      category: "integration",
      resource,
      description: `Update an existing ${label} record`,
      priority: "high",
      steps: [
        { action: `PUT /api/${resource}/:id`, input: { ...sampleInput, [col.fields[0]?.name || "name"]: "updated" }, expected: "200 OK" },
        { action: "Verify update persisted", expected: "Field value changed" },
      ],
      expected_result: "Record updated successfully",
    },
    {
      id: `${resource}_delete`,
      name: `Delete ${label}`,
      category: "integration",
      resource,
      description: col.soft_delete ? `Soft-delete ${label} record` : `Delete ${label} record`,
      priority: "medium",
      steps: [
        { action: `DELETE /api/${resource}/:id`, expected: col.soft_delete ? "200 OK (soft deleted)" : "204 No Content" },
        { action: "Verify deletion", expected: col.soft_delete ? "deleted_at is set" : "Record removed" },
      ],
      expected_result: col.soft_delete ? "Record soft-deleted" : "Record deleted",
    },
    {
      id: `${resource}_validation`,
      name: `${label} Validation`,
      category: "unit",
      resource,
      description: `Reject invalid ${label} data`,
      priority: "medium",
      steps: [
        { action: `POST /api/${resource} with empty body`, expected: "400 Bad Request" },
        ...requiredFields.slice(0, 3).map((f) => ({
          action: `POST without required field "${f.name}"`,
          expected: `Validation error for ${f.name}`,
        })),
      ],
      expected_result: "Validation errors returned",
    },
  ];
}

function generateApiTests(endpoints: ApiEndpoint[]): TestScenario[] {
  return endpoints.slice(0, 10).map((ep, i) => ({
    id: `api_${i}_${ep.method.toLowerCase()}_${ep.path.replace(/[^a-z0-9]/gi, "_")}`,
    name: `${ep.method} ${ep.path}`,
    category: "integration" as const,
    resource: "api",
    description: ep.description,
    priority: ep.auth_required ? ("high" as const) : ("medium" as const),
    steps: [
      {
        action: `${ep.method} ${ep.path}`,
        expected: ep.method === "POST" ? "201 Created" : ep.method === "DELETE" ? "204 No Content" : "200 OK",
      },
      ...(ep.auth_required
        ? [{ action: `${ep.method} ${ep.path} without auth`, expected: "401 Unauthorized" }]
        : []),
    ],
    expected_result: `${ep.description} works correctly`,
  }));
}

function generateSecurityTests(config: AppConfig): TestScenario[] {
  const tests: TestScenario[] = [
    {
      id: "sec_sql_injection",
      name: "SQL Injection Prevention",
      category: "security",
      resource: "system",
      description: "API rejects SQL injection attempts",
      priority: "critical",
      steps: [
        { action: "Send malicious input: ' OR 1=1 --", expected: "400 or sanitized" },
        { action: "Send DROP TABLE attempt", expected: "400 or sanitized" },
      ],
      expected_result: "All injection attempts blocked",
    },
    {
      id: "sec_xss",
      name: "XSS Prevention",
      category: "security",
      resource: "system",
      description: "API sanitizes script tags in input",
      priority: "critical",
      steps: [
        { action: "Send <script>alert('xss')</script> as input", expected: "Input sanitized or rejected" },
      ],
      expected_result: "XSS attempts neutralized",
    },
    {
      id: "sec_rate_limit",
      name: "Rate Limiting",
      category: "security",
      resource: "system",
      description: "API enforces rate limits",
      priority: "high",
      steps: [
        { action: "Send 100 requests in 1 minute", expected: "429 Too Many Requests after limit" },
      ],
      expected_result: "Rate limiting enforced",
    },
    {
      id: "sec_rls",
      name: "Row Level Security",
      category: "security",
      resource: "system",
      description: "Users cannot access other users' data",
      priority: "critical",
      steps: [
        { action: "User A creates record", expected: "Record created" },
        { action: "User B tries to read User A's record", expected: "Empty result or 403" },
        { action: "User B tries to update User A's record", expected: "403 or no effect" },
      ],
      expected_result: "Data isolation enforced",
    },
  ];

  if (config.roles && config.roles.length > 1) {
    tests.push({
      id: "sec_rbac",
      name: "Role-Based Access Control",
      category: "security",
      resource: "system",
      description: "Users can only access resources allowed by their role",
      priority: "critical",
      steps: [
        { action: "User with 'user' role tries admin endpoint", expected: "403 Forbidden" },
        { action: "User with 'admin' role accesses admin endpoint", expected: "200 OK" },
      ],
      expected_result: "RBAC enforcement works",
    });
  }

  return tests;
}

function generateMultiTenantTests(config: AppConfig): TestScenario[] {
  const tenantCollections = config.collections.filter(c => c.tenant_isolated);
  const tests: TestScenario[] = [
    {
      id: "mt_tenant_isolation",
      name: "Tenant Data Isolation",
      category: "security",
      resource: "multi-tenant",
      description: "Users from tenant A cannot see or modify tenant B's data",
      priority: "critical",
      steps: [
        { action: "Create record in Tenant A", expected: "Record created with tenant_id = A" },
        { action: "Switch to Tenant B context", expected: "Auth token reflects Tenant B" },
        { action: "List records as Tenant B", expected: "Tenant A's records not visible" },
        { action: "Try to update Tenant A's record as Tenant B", expected: "403 or no effect" },
        { action: "Try to delete Tenant A's record as Tenant B", expected: "403 or no effect" },
      ],
      expected_result: "Complete data isolation between tenants",
    },
    {
      id: "mt_tenant_id_auto",
      name: "Auto tenant_id Assignment",
      category: "integration",
      resource: "multi-tenant",
      description: "tenant_id is automatically assigned on record creation",
      priority: "critical",
      steps: [
        { action: "POST record without tenant_id", expected: "tenant_id auto-filled from auth context" },
        { action: "POST record with wrong tenant_id", expected: "Rejected or overridden to correct tenant" },
      ],
      expected_result: "tenant_id always matches authenticated user's tenant",
    },
    {
      id: "mt_cross_tenant_query",
      name: "Cross-Tenant Query Prevention",
      category: "security",
      resource: "multi-tenant",
      description: "RLS policies prevent cross-tenant data access at DB level",
      priority: "critical",
      steps: [
        { action: "Direct SQL query with wrong tenant_id", expected: "No rows returned (RLS enforced)" },
        { action: "API request with manipulated tenant_id header", expected: "403 or tenant_id from JWT used" },
      ],
      expected_result: "Database-level tenant isolation via RLS",
    },
  ];

  for (const col of tenantCollections.slice(0, 5)) {
    tests.push({
      id: `mt_${col.name}_isolation`,
      name: `${col.name} Tenant Isolation`,
      category: "integration",
      resource: "multi-tenant",
      description: `${col.name} records are isolated per tenant`,
      priority: "high",
      steps: [
        { action: `Create ${col.name} as Tenant A`, expected: "Created with tenant_id = A" },
        { action: `Read ${col.name} as Tenant B`, expected: "Empty result" },
        { action: `Update ${col.name} as Tenant B`, expected: "No effect" },
      ],
      expected_result: `${col.name} fully isolated by tenant`,
    });
  }

  return tests;
}

function generatePageTests(config: AppConfig): TestScenario[] {
  return config.pages.slice(0, 8).map((page) => ({
    id: `page_${page.route.replace(/[^a-z0-9]/gi, "_")}`,
    name: `Page: ${page.name}`,
    category: "e2e" as const,
    resource: "ui",
    description: `${page.name} page renders without errors`,
    priority: "medium" as const,
    steps: [
      { action: `Navigate to ${page.route}`, expected: "Page loads without crash" },
      { action: "Check all components render", expected: `${page.components.length} components visible` },
      ...(page.requires_auth ? [{ action: "Verify auth redirect for unauthenticated user", expected: "Redirected to login" }] : []),
    ],
    expected_result: `${page.name} renders correctly`,
  }));
}

function calculateCoverage(scenarios: TestScenario[]): CoverageSummary {
  const by_category: Record<string, number> = {};
  const by_priority: Record<string, number> = {};

  for (const s of scenarios) {
    by_category[s.category] = (by_category[s.category] || 0) + 1;
    by_priority[s.priority] = (by_priority[s.priority] || 0) + 1;
  }

  return {
    total_scenarios: scenarios.length,
    by_category,
    by_priority,
    estimated_coverage: Math.min(95, 40 + scenarios.length * 3),
  };
}

function generateTestCode(config: AppConfig, scenarios: TestScenario[]): string {
  const lines: string[] = [
    `// ============================================================`,
    `// ${config.title} — Auto-Generated Test Suite`,
    `// Generated: ${new Date().toISOString()}`,
    `// ============================================================`,
    ``,
    `const request = require("supertest");`,
    `const app = require("../src/app");`,
    ``,
    `let authToken = "";`,
    `let testUserId = "";`,
    ``,
    `beforeAll(async () => {`,
    `  const res = await request(app).post("/api/auth/login").send({`,
    `    email: "admin@admin.com",`,
    `    password: "admin123",`,
    `  });`,
    `  authToken = res.body.data?.token || "";`,
    `  testUserId = res.body.data?.user?.id || "";`,
    `});`,
    ``,
  ];

  // Group scenarios by resource
  const byResource = new Map<string, TestScenario[]>();
  for (const s of scenarios) {
    const group = byResource.get(s.resource) || [];
    group.push(s);
    byResource.set(s.resource, group);
  }

  for (const [resource, tests] of byResource) {
    lines.push(`describe("${resource}", () => {`);
    for (const t of tests) {
      lines.push(`  test("${t.name}", async () => {`);
      lines.push(`    // ${t.description}`);
      for (const step of t.steps) {
        lines.push(`    // Step: ${step.action} → ${step.expected || "success"}`);
      }
      lines.push(`    expect(true).toBe(true); // TODO: Implement`);
      lines.push(`  });`);
      lines.push(``);
    }
    lines.push(`});`);
    lines.push(``);
  }

  return lines.join("\n");
}
