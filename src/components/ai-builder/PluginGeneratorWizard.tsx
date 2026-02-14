import { useState, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Package, Plus, Trash2, ChevronRight, ChevronLeft,
  Sparkles, FileCode2, Shield, Layers, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import type { EntityField } from "@/lib/engine/section-factory";
import { generatePluginStructure, type PluginDefinition } from "@/lib/engine/section-factory";

interface PluginGeneratorWizardProps {
  onGenerate: (plugin: PluginDefinition) => void;
}

type WizardStep = "info" | "entities" | "permissions" | "review";

const FIELD_TYPES = [
  "string", "number", "boolean", "date", "email", "url", "text", "enum", "relation", "json", "media",
] as const;

const ICON_OPTIONS = [
  "Package", "Users", "ShoppingCart", "FileText", "CreditCard", "Calendar",
  "Mail", "MessageSquare", "Settings", "BarChart3", "Database", "Shield",
];

export function PluginGeneratorWizard({ onGenerate }: PluginGeneratorWizardProps) {
  const [step, setStep] = useState<WizardStep>("info");

  // Plugin Info
  const [pluginName, setPluginName] = useState("");
  const [pluginSlug, setPluginSlug] = useState("");
  const [pluginDesc, setPluginDesc] = useState("");

  // Entities
  const [entities, setEntities] = useState<{
    name: string;
    fields: EntityField[];
    softDelete: boolean;
  }[]>([]);
  const [currentEntityName, setCurrentEntityName] = useState("");

  // Permissions
  const [permissions, setPermissions] = useState<string[]>([]);
  const [newPermission, setNewPermission] = useState("");

  // Routes
  const [routes, setRoutes] = useState<{ path: string; page: string; icon: string }[]>([]);

  const autoSlug = useCallback((name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }, []);

  const handleNameChange = (name: string) => {
    setPluginName(name);
    if (!pluginSlug || pluginSlug === autoSlug(pluginName)) {
      setPluginSlug(autoSlug(name));
    }
  };

  const addEntity = () => {
    if (!currentEntityName.trim()) return;
    setEntities((prev) => [
      ...prev,
      { name: currentEntityName.trim(), fields: [], softDelete: false },
    ]);
    // Auto-add route
    const slug = autoSlug(currentEntityName);
    setRoutes((prev) => [...prev, { path: `/${slug}`, page: currentEntityName.trim(), icon: "Package" }]);
    setCurrentEntityName("");
  };

  const removeEntity = (index: number) => {
    setEntities((prev) => prev.filter((_, i) => i !== index));
    setRoutes((prev) => prev.filter((_, i) => i !== index));
  };

  const addFieldToEntity = (entityIndex: number) => {
    setEntities((prev) =>
      prev.map((e, i) =>
        i === entityIndex
          ? { ...e, fields: [...e.fields, { name: "", type: "string" as const, required: false }] }
          : e
      )
    );
  };

  const updateField = (entityIndex: number, fieldIndex: number, updates: Partial<EntityField>) => {
    setEntities((prev) =>
      prev.map((e, i) =>
        i === entityIndex
          ? {
              ...e,
              fields: e.fields.map((f, fi) => (fi === fieldIndex ? { ...f, ...updates } : f)),
            }
          : e
      )
    );
  };

  const removeField = (entityIndex: number, fieldIndex: number) => {
    setEntities((prev) =>
      prev.map((e, i) =>
        i === entityIndex
          ? { ...e, fields: e.fields.filter((_, fi) => fi !== fieldIndex) }
          : e
      )
    );
  };

  const addPermission = () => {
    if (!newPermission.trim()) return;
    setPermissions((prev) => [...prev, newPermission.trim()]);
    setNewPermission("");
  };

  const handleGenerate = () => {
    if (!pluginName.trim() || !pluginSlug.trim()) {
      toast({ title: "Missing info", description: "Plugin name and slug are required.", variant: "destructive" });
      return;
    }
    if (entities.length === 0) {
      toast({ title: "No entities", description: "Add at least one entity.", variant: "destructive" });
      return;
    }

    const plugin: PluginDefinition = {
      slug: pluginSlug,
      name: pluginName,
      description: pluginDesc,
      entities: entities.map((e) => ({
        name: e.name,
        fields: e.fields.filter((f) => f.name.trim()),
        soft_delete: e.softDelete,
      })),
      permissions: permissions.length > 0 ? permissions : entities.flatMap((e) => [
        `${autoSlug(e.name)}.create`,
        `${autoSlug(e.name)}.read`,
        `${autoSlug(e.name)}.update`,
        `${autoSlug(e.name)}.delete`,
      ]),
      routes,
      hooks: ["onInstall", "onUninstall", "onActivate"],
    };

    onGenerate(plugin);
  };

  const steps: { key: WizardStep; label: string; icon: any }[] = [
    { key: "info", label: "Plugin Info", icon: Package },
    { key: "entities", label: "Entities", icon: Layers },
    { key: "permissions", label: "Permissions", icon: Shield },
    { key: "review", label: "Review", icon: CheckCircle2 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);
  const canNext = step === "info" ? pluginName.trim() && pluginSlug.trim() : step === "entities" ? entities.length > 0 : true;

  return (
    <div className="flex flex-col h-full">
      {/* Step indicators */}
      <div className="flex items-center gap-1 px-4 py-3 border-b border-border bg-card shrink-0">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-1">
            <button
              onClick={() => i <= currentStepIndex && setStep(s.key)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors",
                step === s.key ? "bg-primary/10 text-primary font-medium" :
                i < currentStepIndex ? "text-primary/70 hover:bg-accent" :
                "text-muted-foreground"
              )}
            >
              <s.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < steps.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground/40" />}
          </div>
        ))}
      </div>

      {/* Step content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Step 1: Plugin Info */}
          {step === "info" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Plugin Information</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Basic details about your plugin.</p>
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Plugin Name</Label>
                  <Input
                    placeholder="e.g., Invoice Manager"
                    value={pluginName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Slug</Label>
                  <Input
                    placeholder="e.g., invoice-manager"
                    value={pluginSlug}
                    onChange={(e) => setPluginSlug(e.target.value)}
                    className="h-9 text-sm font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Description</Label>
                  <Input
                    placeholder="What does this plugin do?"
                    value={pluginDesc}
                    onChange={(e) => setPluginDesc(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Entities */}
          {step === "entities" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Define Entities</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Each entity becomes a database table with full CRUD.
                </p>
              </div>

              {/* Add entity */}
              <div className="flex gap-2">
                <Input
                  placeholder="Entity name (e.g., Invoice)"
                  value={currentEntityName}
                  onChange={(e) => setCurrentEntityName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addEntity()}
                  className="h-9 text-sm flex-1"
                />
                <Button size="sm" onClick={addEntity} disabled={!currentEntityName.trim()} className="gap-1 h-9">
                  <Plus className="w-3.5 h-3.5" /> Add
                </Button>
              </div>

              {/* Entity list */}
              {entities.map((entity, ei) => (
                <div key={ei} className="rounded-xl border border-border p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">{entity.name}</span>
                      <Badge variant="secondary" className="text-[10px]">{entity.fields.length} fields</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <Label className="text-[10px] text-muted-foreground">Soft Delete</Label>
                        <Switch
                          checked={entity.softDelete}
                          onCheckedChange={(v) =>
                            setEntities((prev) => prev.map((e, i) => (i === ei ? { ...e, softDelete: v } : e)))
                          }
                          className="h-4 w-7"
                        />
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeEntity(ei)}>
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {/* Fields */}
                  {entity.fields.map((field, fi) => (
                    <div key={fi} className="flex items-center gap-2">
                      <Input
                        placeholder="Field name"
                        value={field.name}
                        onChange={(e) => updateField(ei, fi, { name: e.target.value })}
                        className="h-8 text-xs flex-1"
                      />
                      <Select
                        value={field.type}
                        onValueChange={(v) => updateField(ei, fi, { type: v as EntityField["type"] })}
                      >
                        <SelectTrigger className="h-8 w-28 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_TYPES.map((t) => (
                            <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-1">
                        <Label className="text-[10px]">Req</Label>
                        <Switch
                          checked={field.required}
                          onCheckedChange={(v) => updateField(ei, fi, { required: v })}
                          className="h-4 w-7"
                        />
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeField(ei, fi)}>
                        <Trash2 className="w-3 h-3 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}

                  <Button variant="outline" size="sm" className="gap-1 text-xs h-7" onClick={() => addFieldToEntity(ei)}>
                    <Plus className="w-3 h-3" /> Add Field
                  </Button>
                </div>
              ))}

              {entities.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  No entities yet. Add your first entity above.
                </div>
              )}
            </div>
          )}

          {/* Step 3: Permissions */}
          {step === "permissions" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Permissions</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Define custom permission keys. CRUD permissions are auto-generated per entity.
                </p>
              </div>

              {/* Auto-generated */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase">Auto-Generated (per entity)</p>
                <div className="flex gap-1.5 flex-wrap">
                  {entities.flatMap((e) => {
                    const slug = e.name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
                    return [`${slug}.create`, `${slug}.read`, `${slug}.update`, `${slug}.delete`];
                  }).map((p) => (
                    <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Custom */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase">Custom Permissions</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., invoice.export"
                    value={newPermission}
                    onChange={(e) => setNewPermission(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addPermission()}
                    className="h-8 text-xs flex-1"
                  />
                  <Button size="sm" className="h-8 gap-1 text-xs" onClick={addPermission} disabled={!newPermission.trim()}>
                    <Plus className="w-3 h-3" /> Add
                  </Button>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {permissions.map((p, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="text-[10px] gap-1 cursor-pointer hover:bg-destructive/10"
                      onClick={() => setPermissions((prev) => prev.filter((_, pi) => pi !== i))}
                    >
                      {p} <Trash2 className="w-2.5 h-2.5" />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === "review" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Review Plugin</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Confirm your plugin configuration.</p>
              </div>

              <div className="rounded-xl border border-border p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{pluginName}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{pluginSlug}</p>
                  </div>
                </div>
                {pluginDesc && <p className="text-xs text-muted-foreground">{pluginDesc}</p>}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-border p-3 text-center">
                  <p className="text-lg font-bold text-foreground">{entities.length}</p>
                  <p className="text-[10px] text-muted-foreground">Entities</p>
                </div>
                <div className="rounded-xl border border-border p-3 text-center">
                  <p className="text-lg font-bold text-foreground">{entities.reduce((a, e) => a + e.fields.length, 0)}</p>
                  <p className="text-[10px] text-muted-foreground">Fields</p>
                </div>
                <div className="rounded-xl border border-border p-3 text-center">
                  <p className="text-lg font-bold text-foreground">{routes.length}</p>
                  <p className="text-[10px] text-muted-foreground">Routes</p>
                </div>
              </div>

              {/* What will be generated */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground">Will Generate:</p>
                <div className="space-y-1">
                  {[
                    `${entities.length} database table(s) with RLS`,
                    `${entities.length * 5} REST API endpoints`,
                    `${entities.length} dashboard page(s) with CRUD`,
                    `${entities.flatMap((e) => [`create`, `read`, `update`, `delete`]).length + permissions.length} permission key(s)`,
                    "Plugin hooks: onInstall, onUninstall, onActivate",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={handleGenerate} className="w-full gap-2">
                <Sparkles className="w-4 h-4" /> Generate Plugin
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-card shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setStep(steps[currentStepIndex - 1]?.key || "info")}
          disabled={currentStepIndex === 0}
          className="gap-1 text-xs"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Back
        </Button>
        {currentStepIndex < steps.length - 1 && (
          <Button
            size="sm"
            onClick={() => setStep(steps[currentStepIndex + 1]?.key || "review")}
            disabled={!canNext}
            className="gap-1 text-xs"
          >
            Next <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
