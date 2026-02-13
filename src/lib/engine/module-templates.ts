// ============================================================
// Module Template Library
// Pre-built, stable component templates that AI customizes
// ============================================================

export interface ModuleTemplate {
  id: string;
  name: string;
  description: string;
  category: "auth" | "dashboard" | "crud" | "ui" | "data" | "communication" | "payment";
  code: string;
  dependencies?: string[];
}

// ==== AUTH MODULE ====
const authLoginTemplate: ModuleTemplate = {
  id: "auth-login",
  name: "Login Page",
  description: "Email/password login with form validation",
  category: "auth",
  code: `import React, { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    // TODO: Replace with actual auth logic
    setTimeout(() => { setLoading(false); }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Welcome back</h1>
          <p className="mt-2 text-muted-foreground">Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 bg-card p-6 rounded-xl border border-border shadow-sm">
          {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:outline-none" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:outline-none" placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 transition-all">
            {loading ? "Signing in..." : "Sign In"}
          </button>
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account? <a href="/signup" className="text-primary hover:underline">Sign up</a>
          </p>
        </form>
      </div>
    </div>
  );
}`,
};

const authSignupTemplate: ModuleTemplate = {
  id: "auth-signup",
  name: "Signup Page",
  description: "Registration with name, email, password",
  category: "auth",
  code: `import React, { useState } from "react";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Create Account</h1>
          <p className="mt-2 text-muted-foreground">Start your journey today</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 bg-card p-6 rounded-xl border border-border shadow-sm">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-ring focus:outline-none" placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-ring focus:outline-none" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-ring focus:outline-none" placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50">
            {loading ? "Creating..." : "Create Account"}
          </button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account? <a href="/login" className="text-primary hover:underline">Sign in</a>
          </p>
        </form>
      </div>
    </div>
  );
}`,
};

// ==== DASHBOARD MODULE ====
const dashboardTemplate: ModuleTemplate = {
  id: "dashboard-main",
  name: "Dashboard Layout",
  description: "Sidebar + header + stats + charts dashboard",
  category: "dashboard",
  code: `import React, { useState } from "react";

const stats = [
  { label: "Total Users", value: "2,847", change: "+12.5%", up: true },
  { label: "Revenue", value: "$48,290", change: "+8.2%", up: true },
  { label: "Active Projects", value: "142", change: "-2.1%", up: false },
  { label: "Conversion Rate", value: "3.24%", change: "+0.8%", up: true },
];

const navItems = [
  { label: "Dashboard", icon: "📊", active: true },
  { label: "Customers", icon: "👥", active: false },
  { label: "Projects", icon: "📁", active: false },
  { label: "Reports", icon: "📈", active: false },
  { label: "Settings", icon: "⚙️", active: false },
];

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className={\`\${sidebarOpen ? "w-64" : "w-16"} border-r border-border bg-card transition-all duration-300 flex flex-col\`}>
        <div className="h-14 flex items-center px-4 border-b border-border">
          <span className="text-lg font-bold text-primary">{sidebarOpen ? "AppName" : "A"}</span>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => (
            <button key={item.label}
              className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors \${item.active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-accent"}\`}>
              <span>{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-muted-foreground hover:text-foreground">☰</button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Admin User</span>
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-medium">A</div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6 space-y-6">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-card border border-border rounded-xl p-4">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
                <p className={\`text-xs mt-1 \${s.up ? "text-green-600" : "text-red-500"}\`}>{s.change}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {[1,2,3,4,5].map((i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs">U{i}</div>
                    <div className="flex-1"><p className="text-sm text-foreground">User action {i}</p><p className="text-xs text-muted-foreground">{i} hours ago</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                {["New Project", "Add User", "Generate Report", "View Analytics"].map((action) => (
                  <button key={action} className="p-3 rounded-lg border border-border hover:bg-accent text-sm text-foreground transition-colors">{action}</button>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}`,
};

// ==== CRUD MODULE ====
const crudTableTemplate: ModuleTemplate = {
  id: "crud-table",
  name: "CRUD Table",
  description: "Data table with create, read, update, delete and pagination",
  category: "crud",
  code: `import React, { useState } from "react";

interface Item {
  id: number;
  name: string;
  email: string;
  status: "active" | "inactive";
  created: string;
}

const initialData: Item[] = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  name: \`User \${i + 1}\`,
  email: \`user\${i + 1}@example.com\`,
  status: i % 3 === 0 ? "inactive" : "active",
  created: new Date(Date.now() - i * 86400000).toLocaleDateString(),
}));

export default function CrudTablePage() {
  const [data, setData] = useState<Item[]>(initialData);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const perPage = 8;

  const filtered = data.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()) || d.email.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / perPage);
  const pageData = filtered.slice((page - 1) * perPage, page * perPage);

  const handleDelete = (id: number) => {
    setData((prev) => prev.filter((d) => d.id !== id));
  };

  const handleSave = (item: Item) => {
    if (editItem) {
      setData((prev) => prev.map((d) => (d.id === item.id ? item : d)));
    } else {
      setData((prev) => [...prev, { ...item, id: Date.now() }]);
    }
    setShowModal(false);
    setEditItem(null);
  };

  return (
    <div className="p-6 space-y-4 bg-background min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Records</h1>
        <button onClick={() => { setEditItem(null); setShowModal(true); }}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">+ Add New</button>
      </div>
      <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        placeholder="Search..." className="w-full max-w-sm px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-ring focus:outline-none text-sm" />
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-muted/50">
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
            <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
          </tr></thead>
          <tbody>
            {pageData.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-0 hover:bg-accent/50">
                <td className="px-4 py-3 text-foreground font-medium">{item.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{item.email}</td>
                <td className="px-4 py-3"><span className={\`px-2 py-0.5 rounded-full text-xs font-medium \${item.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}\`}>{item.status}</span></td>
                <td className="px-4 py-3 text-muted-foreground">{item.created}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => { setEditItem(item); setShowModal(true); }} className="text-primary hover:underline text-xs">Edit</button>
                  <button onClick={() => handleDelete(item.id)} className="text-destructive hover:underline text-xs">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{filtered.length} total records</span>
        <div className="flex gap-1">
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => setPage(i + 1)}
              className={\`w-8 h-8 rounded-lg text-xs \${page === i + 1 ? "bg-primary text-primary-foreground" : "hover:bg-accent"}\`}>{i + 1}</button>
          ))}
        </div>
      </div>
    </div>
  );
}`,
};

// ==== ROLE MANAGER MODULE ====
const roleManagerTemplate: ModuleTemplate = {
  id: "role-manager",
  name: "Role & Permission Manager",
  description: "Manage user roles and permissions",
  category: "auth",
  code: `import React, { useState } from "react";

const defaultRoles = [
  { id: 1, name: "Admin", permissions: ["read", "write", "delete", "manage_users", "manage_roles", "view_reports"], color: "bg-red-100 text-red-700" },
  { id: 2, name: "Manager", permissions: ["read", "write", "view_reports", "manage_users"], color: "bg-blue-100 text-blue-700" },
  { id: 3, name: "Editor", permissions: ["read", "write"], color: "bg-green-100 text-green-700" },
  { id: 4, name: "Viewer", permissions: ["read"], color: "bg-gray-100 text-gray-700" },
];

const allPermissions = ["read", "write", "delete", "manage_users", "manage_roles", "view_reports", "billing", "api_access"];

export default function RoleManagerPage() {
  const [roles, setRoles] = useState(defaultRoles);

  const togglePermission = (roleId: number, permission: string) => {
    setRoles(prev => prev.map(r => {
      if (r.id !== roleId) return r;
      const has = r.permissions.includes(permission);
      return { ...r, permissions: has ? r.permissions.filter(p => p !== permission) : [...r.permissions, permission] };
    }));
  };

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Roles & Permissions</h1>
        <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">+ Add Role</button>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-muted/50">
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
            {allPermissions.map(p => (
              <th key={p} className="text-center px-2 py-3 font-medium text-muted-foreground text-xs">{p.replace(/_/g, " ")}</th>
            ))}
          </tr></thead>
          <tbody>
            {roles.map(role => (
              <tr key={role.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3"><span className={\`px-2.5 py-1 rounded-full text-xs font-medium \${role.color}\`}>{role.name}</span></td>
                {allPermissions.map(p => (
                  <td key={p} className="text-center px-2 py-3">
                    <button onClick={() => togglePermission(role.id, p)}
                      className={\`w-5 h-5 rounded border \${role.permissions.includes(p) ? "bg-primary border-primary text-primary-foreground" : "border-input bg-background"} flex items-center justify-center text-xs\`}>
                      {role.permissions.includes(p) && "✓"}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}`,
};

// ==== NOTIFICATION MODULE ====
const notificationTemplate: ModuleTemplate = {
  id: "notification-center",
  name: "Notification Center",
  description: "Notification list with read/unread states",
  category: "communication",
  code: `import React, { useState } from "react";

const initialNotifications = [
  { id: 1, title: "New user registered", message: "John Doe created an account", time: "2 min ago", read: false, type: "info" },
  { id: 2, title: "Payment received", message: "$299.00 from Acme Corp", time: "1 hour ago", read: false, type: "success" },
  { id: 3, title: "Server alert", message: "CPU usage exceeded 90%", time: "3 hours ago", read: true, type: "warning" },
  { id: 4, title: "Task completed", message: "Deployment finished successfully", time: "5 hours ago", read: true, type: "success" },
  { id: 5, title: "New comment", message: "Sarah left a comment on Project X", time: "1 day ago", read: true, type: "info" },
];

export default function NotificationCenterPage() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filtered = filter === "unread" ? notifications.filter(n => !n.read) : notifications;
  const unreadCount = notifications.filter(n => !n.read).length;

  const markRead = (id: number) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  const typeColors: Record<string, string> = { info: "bg-blue-500", success: "bg-green-500", warning: "bg-yellow-500", error: "bg-red-500" };

  return (
    <div className="p-6 space-y-4 bg-background min-h-screen max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          {unreadCount > 0 && <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">{unreadCount}</span>}
        </div>
        <button onClick={markAllRead} className="text-sm text-primary hover:underline">Mark all read</button>
      </div>
      <div className="flex gap-2">
        {(["all", "unread"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={\`px-3 py-1.5 rounded-lg text-sm \${filter === f ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:bg-accent"}\`}>
            {f === "all" ? "All" : "Unread"}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {filtered.map(n => (
          <div key={n.id} onClick={() => markRead(n.id)}
            className={\`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors \${n.read ? "bg-card border-border" : "bg-primary/5 border-primary/20"}\`}>
            <div className={\`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 \${typeColors[n.type]}\`} />
            <div className="flex-1 min-w-0">
              <p className={\`text-sm \${n.read ? "text-foreground" : "text-foreground font-medium"}\`}>{n.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">{n.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}`,
};

// ==== PRICING MODULE ====
const pricingTemplate: ModuleTemplate = {
  id: "pricing-table",
  name: "Pricing Table",
  description: "Three-tier pricing with feature comparison",
  category: "payment",
  code: `import React from "react";

const plans = [
  { name: "Starter", price: "$9", period: "/month", description: "Perfect for individuals", features: ["5 Projects", "1 GB Storage", "Email Support", "Basic Analytics"], cta: "Start Free", popular: false },
  { name: "Pro", price: "$29", period: "/month", description: "Best for growing teams", features: ["Unlimited Projects", "10 GB Storage", "Priority Support", "Advanced Analytics", "API Access", "Custom Branding"], cta: "Get Started", popular: true },
  { name: "Enterprise", price: "$99", period: "/month", description: "For large organizations", features: ["Everything in Pro", "100 GB Storage", "Dedicated Support", "SLA Guarantee", "SSO", "Audit Logs", "Custom Integrations"], cta: "Contact Sales", popular: false },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background py-20 px-4">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-foreground">Simple, transparent pricing</h1>
        <p className="mt-4 text-lg text-muted-foreground">Choose the plan that fits your needs</p>
      </div>
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div key={plan.name} className={\`relative bg-card border rounded-2xl p-8 flex flex-col \${plan.popular ? "border-primary shadow-lg scale-105" : "border-border"}\`}>
            {plan.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">Most Popular</span>}
            <h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-4xl font-bold text-foreground">{plan.price}</span>
              <span className="text-muted-foreground">{plan.period}</span>
            </div>
            <ul className="mt-8 space-y-3 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                  <span className="text-primary">✓</span> {f}
                </li>
              ))}
            </ul>
            <button className={\`mt-8 w-full py-3 rounded-xl font-medium transition-all \${plan.popular ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-accent text-accent-foreground hover:bg-accent/80"}\`}>
              {plan.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}`,
};

// ==== HERO / LANDING MODULE ====
const heroTemplate: ModuleTemplate = {
  id: "hero-landing",
  name: "Hero Landing Section",
  description: "Full-width hero with CTA buttons",
  category: "ui",
  code: `import React from "react";

export default function HeroSection() {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center bg-background overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/10" />
      <div className="relative z-10 max-w-4xl mx-auto text-center px-4 py-20">
        <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">✨ Now Available</span>
        <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
          Build Something <span className="text-primary">Amazing</span> Today
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          The all-in-one platform that helps you create, manage, and scale your projects with ease. Start building in minutes.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
          <button className="px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-medium text-lg hover:opacity-90 transition-all shadow-lg">Get Started Free</button>
          <button className="px-8 py-3.5 rounded-xl border border-border text-foreground font-medium text-lg hover:bg-accent transition-all">Watch Demo →</button>
        </div>
        <div className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground">
          <span>✓ Free to start</span>
          <span>✓ No credit card</span>
          <span>✓ Cancel anytime</span>
        </div>
      </div>
    </section>
  );
}`,
};

// ==== SETTINGS MODULE ====
const settingsTemplate: ModuleTemplate = {
  id: "settings-panel",
  name: "Settings Panel",
  description: "Tabbed settings page with profile, security, notifications",
  category: "ui",
  code: `import React, { useState } from "react";

const tabs = ["Profile", "Security", "Notifications", "Billing"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("Profile");

  return (
    <div className="p-6 bg-background min-h-screen">
      <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>
      <div className="flex gap-1 border-b border-border mb-6">
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={\`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors \${activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}\`}>
            {tab}
          </button>
        ))}
      </div>
      <div className="max-w-2xl">
        {activeTab === "Profile" && (
          <div className="space-y-4 bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold text-foreground">Profile Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-foreground mb-1.5">First Name</label>
                <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground" defaultValue="John" /></div>
              <div><label className="block text-sm font-medium text-foreground mb-1.5">Last Name</label>
                <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground" defaultValue="Doe" /></div>
            </div>
            <div><label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground" defaultValue="john@example.com" /></div>
            <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Save Changes</button>
          </div>
        )}
        {activeTab === "Security" && (
          <div className="space-y-4 bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold text-foreground">Change Password</h3>
            <div><label className="block text-sm font-medium text-foreground mb-1.5">Current Password</label>
              <input type="password" className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground" /></div>
            <div><label className="block text-sm font-medium text-foreground mb-1.5">New Password</label>
              <input type="password" className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground" /></div>
            <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Update Password</button>
          </div>
        )}
        {activeTab === "Notifications" && (
          <div className="space-y-4 bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold text-foreground">Notification Preferences</h3>
            {["Email notifications", "Push notifications", "SMS alerts", "Weekly digest"].map(item => (
              <label key={item} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm text-foreground">{item}</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-input text-primary focus:ring-ring" />
              </label>
            ))}
          </div>
        )}
        {activeTab === "Billing" && (
          <div className="space-y-4 bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold text-foreground">Current Plan</h3>
            <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div><p className="font-medium text-foreground">Pro Plan</p><p className="text-sm text-muted-foreground">$29/month</p></div>
              <button className="px-3 py-1.5 rounded-lg border border-border text-sm text-foreground hover:bg-accent">Upgrade</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}`,
};

// ============================================================
// Registry
// ============================================================

export const MODULE_TEMPLATES: ModuleTemplate[] = [
  authLoginTemplate,
  authSignupTemplate,
  dashboardTemplate,
  crudTableTemplate,
  roleManagerTemplate,
  notificationTemplate,
  pricingTemplate,
  heroTemplate,
  settingsTemplate,
];

export function getTemplatesByCategory(category: ModuleTemplate["category"]): ModuleTemplate[] {
  return MODULE_TEMPLATES.filter((t) => t.category === category);
}

export function getTemplateById(id: string): ModuleTemplate | undefined {
  return MODULE_TEMPLATES.find((t) => t.id === id);
}

// Map component types to template IDs for auto-matching
export const COMPONENT_TEMPLATE_MAP: Record<string, string> = {
  auth_form: "auth-login",
  hero: "hero-landing",
  crud_table: "crud-table",
  pricing_table: "pricing-table",
  notification_center: "notification-center",
  role_manager: "role-manager",
  settings_panel: "settings-panel",
  dashboard_layout: "dashboard-main",
};

export function getTemplateForComponent(componentType: string): ModuleTemplate | undefined {
  const templateId = COMPONENT_TEMPLATE_MAP[componentType];
  return templateId ? getTemplateById(templateId) : undefined;
}
