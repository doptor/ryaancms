import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Save, Globe, Shield, Bell, Palette, Database } from "lucide-react";

const settingSections = [
  { icon: Globe, label: "General", desc: "Site name, URL, timezone, and language settings." },
  { icon: Shield, label: "Security", desc: "SSO, MFA, API keys, and role-based access control." },
  { icon: Bell, label: "Notifications", desc: "Email, webhook, and in-app notification preferences." },
  { icon: Palette, label: "Appearance", desc: "Theme, branding, custom CSS, and favicon." },
  { icon: Database, label: "Database", desc: "Backup, restore, migration settings, and export." },
];

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Settings</h1>
            <p className="text-sm text-muted-foreground">Configure your RyaanCMS instance.</p>
          </div>
          <Button variant="hero" size="sm">
            <Save className="w-4 h-4" /> Save Changes
          </Button>
        </div>

        <div className="space-y-3">
          {settingSections.map((s) => (
            <button
              key={s.label}
              className="w-full flex items-center gap-4 px-5 py-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-all duration-300 text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <s.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{s.label}</h3>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
