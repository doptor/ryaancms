import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save, Globe, Shield, Bell, Palette, Database, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

const settingSections = [
  { id: "general", icon: Globe, label: "General", desc: "Site name, URL, timezone, and language settings.", color: "text-blue-400" },
  { id: "security", icon: Shield, label: "Security", desc: "SSO, MFA, API keys, and role-based access control.", color: "text-emerald-400" },
  { id: "notifications", icon: Bell, label: "Notifications", desc: "Email, webhook, and in-app notification preferences.", color: "text-amber-400" },
  { id: "appearance", icon: Palette, label: "Appearance", desc: "Theme, branding, custom CSS, and favicon.", color: "text-violet-400" },
  { id: "database", icon: Database, label: "Database", desc: "Backup, restore, migration settings, and export.", color: "text-cyan-400" },
];

function GeneralSettings() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="siteName">Site Name</Label>
        <Input id="siteName" placeholder="RyaanCMS" defaultValue="RyaanCMS" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="siteUrl">Site URL</Label>
        <Input id="siteUrl" placeholder="https://example.com" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="timezone">Timezone</Label>
        <Input id="timezone" placeholder="UTC" defaultValue="UTC" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="language">Language</Label>
        <Input id="language" placeholder="English" defaultValue="English" />
      </div>
    </div>
  );
}

function SecuritySettings() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label>Enable SSO</Label>
          <p className="text-xs text-muted-foreground">Allow Single Sign-On via external providers</p>
        </div>
        <Switch />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <Label>Enable MFA</Label>
          <p className="text-xs text-muted-foreground">Require multi-factor authentication</p>
        </div>
        <Switch />
      </div>
      <div className="space-y-2">
        <Label htmlFor="apiKey">API Key</Label>
        <Input id="apiKey" type="password" placeholder="••••••••••••" />
      </div>
    </div>
  );
}

function NotificationSettings() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label>Email Notifications</Label>
          <p className="text-xs text-muted-foreground">Receive updates via email</p>
        </div>
        <Switch defaultChecked />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <Label>Webhook Notifications</Label>
          <p className="text-xs text-muted-foreground">Send events to a webhook URL</p>
        </div>
        <Switch />
      </div>
      <div className="space-y-2">
        <Label htmlFor="webhookUrl">Webhook URL</Label>
        <Input id="webhookUrl" placeholder="https://hooks.example.com/notify" />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <Label>In-App Notifications</Label>
          <p className="text-xs text-muted-foreground">Show notifications inside dashboard</p>
        </div>
        <Switch defaultChecked />
      </div>
    </div>
  );
}

function AppearanceSettings() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label>Dark Mode</Label>
          <p className="text-xs text-muted-foreground">Use dark theme for the dashboard</p>
        </div>
        <Switch defaultChecked />
      </div>
      <div className="space-y-2">
        <Label htmlFor="brandColor">Brand Color</Label>
        <Input id="brandColor" type="color" defaultValue="#6366f1" className="w-16 h-10" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="customCss">Custom CSS</Label>
        <Input id="customCss" placeholder="e.g. body { font-family: 'Inter'; }" />
      </div>
    </div>
  );
}

function DatabaseSettings() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label>Auto Backup</Label>
          <p className="text-xs text-muted-foreground">Automatically backup database daily</p>
        </div>
        <Switch defaultChecked />
      </div>
      <div className="space-y-2">
        <Label htmlFor="backupPath">Backup Storage Path</Label>
        <Input id="backupPath" placeholder="/backups" defaultValue="/backups" />
      </div>
      <Button variant="outline" size="sm">Export Database</Button>
      <Button variant="outline" size="sm" className="ml-2">Restore from Backup</Button>
    </div>
  );
}

const sectionComponents: Record<string, React.FC> = {
  general: GeneralSettings,
  security: SecuritySettings,
  notifications: NotificationSettings,
  appearance: AppearanceSettings,
  database: DatabaseSettings,
};

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const activeData = settingSections.find((s) => s.id === activeSection);
  const ActiveComponent = activeSection ? sectionComponents[activeSection] : null;

  const handleSave = () => {
    toast({ title: "Settings saved", description: "Your changes have been saved successfully." });
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            {activeSection && (
              <Button variant="ghost" size="icon" onClick={() => setActiveSection(null)}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">
                {activeData ? activeData.label : "Settings"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {activeData ? activeData.desc : "Configure your RyaanCMS instance."}
              </p>
            </div>
          </div>
          {activeSection && (
            <Button variant="default" size="sm" onClick={handleSave}>
              <Save className="w-4 h-4 mr-1" /> Save Changes
            </Button>
          )}
        </div>

        {!activeSection ? (
          <div className="space-y-2">
            {settingSections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-all duration-300 text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <s.icon className={cn("w-5 h-5", s.color)} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{s.label}</h3>
                  <p className="text-xs text-muted-foreground">{s.desc}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {activeData && <activeData.icon className={cn("w-5 h-5", activeData.color)} />}
                {activeData?.label}
              </CardTitle>
              <CardDescription>{activeData?.desc}</CardDescription>
            </CardHeader>
            <CardContent>
              {ActiveComponent && <ActiveComponent />}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
