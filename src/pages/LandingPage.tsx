import { Zap, Database, Puzzle, Sparkles, Globe, Shield, ArrowRight, Menu, X, Github, Bot, RefreshCw, Eye, ShoppingBag, Brain, Layers, Code, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Link } from "react-router-dom";
import MirrorDemo from "@/components/landing/MirrorDemo";
import PulseDemo from "@/components/landing/PulseDemo";
import VaultDemo from "@/components/landing/VaultDemo";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Architecture", href: "#architecture" },
  { label: "AI Agents", href: "#agents" },
  { label: "Marketplace", href: "#marketplace" },
  { label: "Docs", href: "/docs", isRoute: true },
];

const features = [
  {
    icon: Database,
    title: "Schema Architect",
    description: "Visual collection builder with AI schema generation, relationship mapping, and zero-downtime deployment.",
  },
  {
    icon: Sparkles,
    title: "AI-Native Engine",
    description: "Schema generation, content writing, SEO optimization, and intelligent layout suggestions powered by AI.",
  },
  {
    icon: Puzzle,
    title: "Plugin Ecosystem",
    description: "Sandboxed .rypkg plugins with dependency resolution, security scanning, and blue-green deployment.",
  },
  {
    icon: Globe,
    title: "Edge-Native APIs",
    description: "Auto-generated REST, GraphQL, and webhooks with CDN caching. API responses under 50ms globally.",
  },
  {
    icon: Zap,
    title: "Visual Builder",
    description: "Drag & drop canvas with live data binding, responsive preview, and real-time collaborative editing.",
  },
  {
    icon: Shield,
    title: "Enterprise Ready",
    description: "Multi-tenant architecture, SSO, field-level permissions, audit logs, and 99.9% uptime SLA.",
  },
];

const agents = [
  { num: 1, name: "Requirement Analyst", icon: Brain, desc: "Converts user prompt into complete FRS/SRS with smart questions" },
  { num: 2, name: "Product Manager", icon: Layers, desc: "Defines modules, user stories, roles & workflows" },
  { num: 3, name: "Task Planner", icon: CheckCircle2, desc: "Creates structured task plan with dependencies" },
  { num: 4, name: "System Architect", icon: Code, desc: "Designs folder structure, API patterns & reusable components" },
  { num: 5, name: "Database Agent", icon: Database, desc: "Generates MySQL/Prisma schema, migrations & seed data" },
  { num: 6, name: "Backend Agent", icon: Globe, desc: "Builds Express server, routes, controllers & RBAC" },
  { num: 7, name: "UI/UX Designer", icon: Eye, desc: "Creates page layouts, forms, tables & responsive design" },
  { num: 8, name: "Testing Agent", icon: Shield, desc: "Generates test scenarios & validates main flows" },
  { num: 9, name: "Debugger Agent", icon: RefreshCw, desc: "Auto-detects & fixes build errors with retry loop" },
  { num: 10, name: "Quality Reviewer", icon: Bot, desc: "Scores UI, Backend, Security & Performance (target 90+)" },
];

const highlights = [
  {
    icon: Brain,
    title: "Master System Prompt",
    description: "Enterprise-grade system prompt governs all 10 agents — enforcing production-ready code, security protocols, and consistent architecture across every build.",
  },
  {
    icon: RefreshCw,
    title: "Autonomous Build Loop",
    description: "PLAN → GENERATE → RUN → FAIL? → FIX → RETRY → SUCCESS. Auto-retry up to 5 times with intelligent error-fix memory that learns from past failures.",
  },
  {
    icon: ShoppingBag,
    title: "Plugin Marketplace",
    description: "Install payments, SMS, WhatsApp, email marketing plugins with one click. Plugin-ready architecture with hooks and middleware stack built-in.",
  },
  {
    icon: Eye,
    title: "Live Sandboxed Preview",
    description: "See your generated app running in a real sandboxed iframe with hot-reload, console output, and responsive viewport switching — before downloading.",
  },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container flex items-center justify-between h-14 sm:h-16 px-4 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-foreground" />
            </div>
            <span className="text-base sm:text-lg font-bold text-foreground">RyaanCMS</span>
          </Link>

          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {navLinks.map((link) =>
              (link as any).isRoute ? (
                <Link key={link.href} to={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {link.label}
                </Link>
              ) : (
                <a key={link.href} href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {link.label}
                </a>
              )
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                <Github className="w-4 h-4" />
              </a>
            </Button>
            <Link to="/dashboard">
              <Button variant="hero" size="sm">
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <button className="md:hidden text-foreground p-1" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card p-4 space-y-3">
            {navLinks.map((link) =>
              (link as any).isRoute ? (
                <Link key={link.href} to={link.href} className="block text-sm text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
                  {link.label}
                </Link>
              ) : (
                <a key={link.href} href={link.href} className="block text-sm text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
                  {link.label}
                </a>
              )
            )}
            <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="hero" size="sm" className="w-full mt-2">Get Started</Button>
            </Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative pt-24 sm:pt-32 pb-12 sm:pb-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] rounded-full bg-primary/5 blur-[80px] sm:blur-[120px] animate-pulse-slow" />
        </div>
        <div className="container relative px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center animate-slide-up">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs sm:text-sm font-medium mb-4 sm:mb-6">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              10-Agent AI Pipeline — Autonomous App Builder
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-4 sm:mb-6">
              The CMS Where
              <br />
              <span className="text-gradient">Others Failed</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-8 px-2">
              AI + CMS + Marketplace + Revenue Engine. 10 autonomous agents build production-ready apps from a single prompt.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link to="/dashboard" className="w-full sm:w-auto">
                <Button variant="hero" size="lg" className="w-full sm:w-auto">
                  Launch Dashboard <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Button variant="hero-outline" size="lg" className="w-full sm:w-auto">
                <Github className="w-5 h-5" /> Star on GitHub
              </Button>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-10 sm:mt-16 max-w-5xl mx-auto animate-fade-in">
            <div className="rounded-xl border border-border bg-card shadow-glow overflow-hidden">
              <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-border">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-destructive/50" />
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-chart-5/30" />
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-primary/30" />
                <span className="ml-2 sm:ml-3 text-[10px] sm:text-xs text-muted-foreground font-mono truncate">ryaancms.app/dashboard</span>
              </div>
              <div className="p-3 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 min-h-[160px] sm:min-h-[200px]">
                <div className="hidden sm:block col-span-1 space-y-2 sm:space-y-3">
                  {["Collections", "Media", "Plugins", "Users", "Settings"].map((item) => (
                    <div key={item} className="px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer">
                      {item}
                    </div>
                  ))}
                </div>
                <div className="sm:col-span-2 rounded-lg border border-border p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h3 className="text-xs sm:text-sm font-semibold text-foreground">Schema Architect</h3>
                    <span className="text-[10px] sm:text-xs text-primary font-mono">AI Ready</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {["Blog Posts", "Products", "Users", "Orders"].map((c) => (
                      <div key={c} className="rounded-md border border-border p-2 sm:p-3 text-[10px] sm:text-xs text-muted-foreground hover:border-primary/40 transition-colors cursor-pointer">
                        <span className="font-medium text-foreground text-xs sm:text-sm">{c}</span>
                        <div className="mt-1 text-muted-foreground">12 fields · REST + GraphQL</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-12 sm:py-20 bg-gradient-surface">
        <div className="container px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-14 animate-slide-up">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-foreground">Everything You Need. Nothing You Don't.</h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
              Built from the ground up for the AI era with enterprise-grade architecture.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((f) => (
              <div key={f.title} className="group rounded-xl border border-border bg-card p-4 sm:p-6 hover:shadow-glow hover:border-primary/30 transition-all duration-300">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-gradient-primary transition-all duration-300">
                  <f.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1.5 sm:mb-2">{f.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10-Agent Architecture */}
      <section id="agents" className="py-12 sm:py-20">
        <div className="container px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium mb-4">
              <Bot className="w-3.5 h-3.5" /> Powered by Master System Prompt
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-foreground">10-Agent Autonomous Pipeline</h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              Each agent is a specialist. Together they build complete, production-ready apps with zero human intervention.
            </p>
          </div>
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {agents.map((a) => (
              <div key={a.num} className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/30 hover:shadow-glow transition-all duration-300">
                <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center shrink-0 text-primary-foreground text-sm font-bold">
                  {a.num}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <a.icon className="w-3.5 h-3.5 text-primary shrink-0" />
                    <h4 className="text-sm font-semibold text-foreground truncate">{a.name}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Autonomous Loop Visual */}
          <div className="mt-10 sm:mt-14 max-w-3xl mx-auto">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-primary" /> Autonomous Build Loop
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                {["PLAN", "GENERATE", "RUN", "FAIL?", "FIX", "RETRY", "SUCCESS"].map((step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    <span className={`px-3 py-1.5 rounded-md font-medium ${step === "SUCCESS" ? "bg-primary text-primary-foreground" : step === "FAIL?" ? "bg-destructive/10 text-destructive" : "bg-accent text-accent-foreground"}`}>
                      {step}
                    </span>
                    {i < 6 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Auto-retry up to 5 times with error-fix memory. Stops only when backend runs, frontend builds, auth works, and UI loads without errors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights — Master Prompt, Autonomous Loop, Marketplace, Live Preview */}
      <section className="py-12 sm:py-20 bg-gradient-surface">
        <div className="container px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-foreground">Why RyaanCMS is Different</h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
              Not just another website builder — an autonomous engineering platform.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {highlights.map((h) => (
              <div key={h.title} className="group rounded-xl border border-border bg-card p-5 sm:p-6 hover:shadow-glow hover:border-primary/30 transition-all duration-300">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-gradient-primary transition-all duration-300">
                  <h.icon className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">{h.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{h.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture — Interactive Demos */}
      <section id="architecture" className="py-12 sm:py-20">
        <div className="container px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-foreground">Tri-Core Architecture</h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">Three powerful layers working in harmony. Try them live.</p>
          </div>
          <div className="max-w-5xl mx-auto space-y-12 sm:space-y-16">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-sm font-bold">1</div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">The Mirror</h3>
                  <span className="text-xs text-primary font-mono">Visual + Realtime UI</span>
                </div>
              </div>
              <MirrorDemo />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent-foreground to-primary flex items-center justify-center text-primary-foreground text-sm font-bold">2</div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">The Pulse</h3>
                  <span className="text-xs text-primary font-mono">API + Distribution</span>
                </div>
              </div>
              <PulseDemo />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/60 to-accent-foreground/60 flex items-center justify-center text-primary-foreground text-sm font-bold">3</div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">The Vault</h3>
                  <span className="text-xs text-primary font-mono">Versioned Data Engine</span>
                </div>
              </div>
              <VaultDemo />
            </div>
          </div>
        </div>
      </section>

      {/* Marketplace */}
      <section id="marketplace" className="py-12 sm:py-20 bg-gradient-surface">
        <div className="container px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-foreground">Plugin Marketplace</h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
              Payments, SMS, WhatsApp, email marketing — install with one click. Plugin-ready architecture built-in.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {[
              { title: "SEO Pro Plugin", type: "Plugin", installs: "12.4k", tag: "Popular" },
              { title: "E-Commerce Template", type: "Template", installs: "8.2k", tag: "Featured" },
              { title: "AI Content Writer", type: "Plugin", installs: "15.1k", tag: "AI" },
              { title: "WhatsApp Integration", type: "Plugin", installs: "6.8k", tag: "Communication" },
              { title: "Payment Gateway", type: "Plugin", installs: "10.3k", tag: "Finance" },
              { title: "Email Marketing", type: "Plugin", installs: "9.1k", tag: "Marketing" },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-border bg-card p-4 sm:p-5 hover:shadow-glow hover:border-primary/30 transition-all duration-300">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <span className="text-[10px] sm:text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">{item.tag}</span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground">{item.installs} installs</span>
                </div>
                <h3 className="font-semibold text-foreground mb-1 text-sm sm:text-base">{item.title}</h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-3 sm:mb-4">{item.type}</p>
                <Button variant="hero-outline" size="sm" className="w-full">Install</Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Source CTA */}
      <section id="opensource" className="py-12 sm:py-20">
        <div className="container px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:p-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-foreground">
              Free. Open Source. <span className="text-gradient">Forever.</span>
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 max-w-lg mx-auto">
              RyaanCMS is built by the community, for the community. Fork it, extend it, make it yours.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link to="/dashboard" className="w-full sm:w-auto">
                <Button variant="hero" size="lg" className="w-full sm:w-auto">Start Building <ArrowRight className="w-5 h-5" /></Button>
              </Link>
              <Button variant="hero-outline" size="lg" className="w-full sm:w-auto">
                <Github className="w-5 h-5" /> View Source
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 sm:py-8">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-primary flex items-center justify-center">
              <Zap className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">RyaanCMS</span>
          </div>
          <p className="text-xs text-muted-foreground text-center">© 2026 RyaanCMS. Free & Open Source. MIT License.</p>
        </div>
      </footer>
    </div>
  );
}