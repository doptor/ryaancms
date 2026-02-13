import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
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

const ALL_LANGUAGES = [
  "Afrikaans","Albanian","Amharic","Arabic","Armenian","Azerbaijani","Basque","Belarusian","Bengali","Bosnian",
  "Bulgarian","Burmese","Catalan","Chinese (Simplified)","Chinese (Traditional)","Croatian","Czech","Danish",
  "Dutch","English","Estonian","Filipino","Finnish","French","Galician","Georgian","German","Greek","Gujarati",
  "Haitian Creole","Hausa","Hebrew","Hindi","Hungarian","Icelandic","Igbo","Indonesian","Irish","Italian",
  "Japanese","Javanese","Kannada","Kazakh","Khmer","Korean","Kurdish","Kyrgyz","Lao","Latvian","Lithuanian",
  "Luxembourgish","Macedonian","Malay","Malayalam","Maltese","Maori","Marathi","Mongolian","Nepali","Norwegian",
  "Odia","Pashto","Persian","Polish","Portuguese","Punjabi","Romanian","Russian","Samoan","Serbian","Sesotho",
  "Shona","Sindhi","Sinhala","Slovak","Slovenian","Somali","Spanish","Sundanese","Swahili","Swedish","Tajik",
  "Tamil","Tatar","Telugu","Thai","Turkish","Turkmen","Ukrainian","Urdu","Uzbek","Vietnamese","Welsh","Xhosa",
  "Yiddish","Yoruba","Zulu",
];

function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal">
            {value || placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-50 bg-popover" align="start">
          <Command>
            <CommandInput placeholder={`Search ${label.toLowerCase()}...`} />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup className="max-h-60 overflow-y-auto">
                {options.map((opt) => (
                  <CommandItem
                    key={opt}
                    value={opt}
                    onSelect={() => {
                      onChange(opt);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", value === opt ? "opacity-100" : "opacity-0")} />
                    {opt}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function GeneralSettings() {
  const timezones = useMemo(() => (Intl as any).supportedValuesOf("timeZone") as string[], []);
  const detectedTz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

  const [timezone, setTimezone] = useState(detectedTz);
  const [language, setLanguage] = useState("English");

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
      <SearchableSelect
        label="Timezone"
        value={timezone}
        onChange={setTimezone}
        options={timezones}
        placeholder="Select timezone..."
      />
      <SearchableSelect
        label="Language"
        value={language}
        onChange={setLanguage}
        options={ALL_LANGUAGES}
        placeholder="Select language..."
      />
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
  const [activeSection, setActiveSection] = useState<string>("general");

  const ActiveComponent = sectionComponents[activeSection];

  const handleSave = () => {
    toast({ title: "Settings saved", description: "Your changes have been saved successfully." });
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Settings</h1>
            <p className="text-sm text-muted-foreground">Configure your RyaanCMS instance.</p>
          </div>
          <Button variant="default" size="sm" onClick={handleSave}>
            <Save className="w-4 h-4 mr-1" /> Save Changes
          </Button>
        </div>

        {/* Colorful tab bar */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
          {settingSections.map((s) => {
            const active = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200",
                  active
                    ? "bg-primary/10 text-primary border border-primary/30 shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground border border-transparent"
                )}
              >
                <s.icon className={cn("w-4 h-4", active ? "text-primary" : s.color)} />
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Active section content */}
        <Card>
          <CardContent className="pt-6">
            {ActiveComponent && <ActiveComponent />}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
