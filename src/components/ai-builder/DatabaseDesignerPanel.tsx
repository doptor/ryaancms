import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Database, Plus, Trash2, Key, Link2, Edit, Check, X,
  Shield, Table, ChevronRight, GripVertical, Hash,
  Lock, Clock, FileText, ToggleLeft, Calendar, Globe,
  Image as ImageIcon, List, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppConfig, CollectionConfig, CollectionField, FieldType } from "@/lib/engine";

interface DatabaseDesignerPanelProps {
  config: AppConfig | null;
  onConfigUpdate: (config: AppConfig) => void;
}

const FIELD_TYPES: { value: FieldType; label: string; icon: any }[] = [
  { value: "uuid", label: "UUID", icon: Key },
  { value: "text", label: "Text", icon: FileText },
  { value: "number", label: "Number", icon: Hash },
  { value: "boolean", label: "Boolean", icon: ToggleLeft },
  { value: "date", label: "Date", icon: Calendar },
  { value: "timestamp", label: "Timestamp", icon: Clock },
  { value: "email", label: "Email", icon: Globe },
  { value: "url", label: "URL", icon: Link2 },
  { value: "password", label: "Password", icon: Lock },
  { value: "json", label: "JSON", icon: FileText },
  { value: "media", label: "Media", icon: ImageIcon },
  { value: "enum", label: "Enum", icon: List },
  { value: "relation", label: "Relation", icon: Link2 },
];

const FIELD_TYPE_ICON: Record<string, any> = Object.fromEntries(
  FIELD_TYPES.map(ft => [ft.value, ft.icon])
);

export function DatabaseDesignerPanel({ config, onConfigUpdate }: DatabaseDesignerPanelProps) {
  const [selectedCollection, setSelectedCollection] = useState<number | null>(null);
  const [isAddingCollection, setIsAddingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isAddingField, setIsAddingField] = useState(false);
  const [newField, setNewField] = useState<Partial<CollectionField>>({ name: "", type: "text", required: false });
  const [editingFieldIdx, setEditingFieldIdx] = useState<number | null>(null);

  if (!config) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <Database className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Database Designer</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Build an app first, then design your database schema visually.
          </p>
        </div>
      </div>
    );
  }

  const collections = config.collections;
  const selected = selectedCollection !== null ? collections[selectedCollection] : null;

  const updateCollections = (newCollections: CollectionConfig[]) => {
    onConfigUpdate({ ...config, collections: newCollections });
  };

  const handleAddCollection = () => {
    if (!newCollectionName.trim()) return;
    const name = newCollectionName.trim().toLowerCase().replace(/\s+/g, "_");
    const newCol: CollectionConfig = {
      name,
      fields: [
        { name: "id", type: "uuid", required: true, unique: true },
        { name: "created_at", type: "timestamp", required: true },
        { name: "updated_at", type: "timestamp", required: true },
      ],
      rls: true,
      tenant_isolated: false,
      audit_fields: true,
    };
    updateCollections([...collections, newCol]);
    setSelectedCollection(collections.length);
    setNewCollectionName("");
    setIsAddingCollection(false);
  };

  const handleDeleteCollection = (idx: number) => {
    const newCollections = collections.filter((_, i) => i !== idx);
    updateCollections(newCollections);
    if (selectedCollection === idx) setSelectedCollection(null);
    else if (selectedCollection !== null && selectedCollection > idx) setSelectedCollection(selectedCollection - 1);
  };

  const handleAddField = () => {
    if (!newField.name?.trim() || selectedCollection === null) return;
    const col = { ...collections[selectedCollection] };
    col.fields = [...col.fields, { name: newField.name.trim().toLowerCase().replace(/\s+/g, "_"), type: newField.type || "text", required: newField.required || false, unique: newField.unique || false, relation_to: newField.relation_to }];
    const newCollections = [...collections];
    newCollections[selectedCollection] = col;
    updateCollections(newCollections);
    setNewField({ name: "", type: "text", required: false });
    setIsAddingField(false);
  };

  const handleDeleteField = (fieldIdx: number) => {
    if (selectedCollection === null) return;
    const col = { ...collections[selectedCollection] };
    col.fields = col.fields.filter((_, i) => i !== fieldIdx);
    const newCollections = [...collections];
    newCollections[selectedCollection] = col;
    updateCollections(newCollections);
  };

  const handleUpdateField = (fieldIdx: number, updates: Partial<CollectionField>) => {
    if (selectedCollection === null) return;
    const col = { ...collections[selectedCollection] };
    col.fields = col.fields.map((f, i) => i === fieldIdx ? { ...f, ...updates } : f);
    const newCollections = [...collections];
    newCollections[selectedCollection] = col;
    updateCollections(newCollections);
    setEditingFieldIdx(null);
  };

  const handleToggleRLS = () => {
    if (selectedCollection === null) return;
    const col = { ...collections[selectedCollection] };
    col.rls = !col.rls;
    const newCollections = [...collections];
    newCollections[selectedCollection] = col;
    updateCollections(newCollections);
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: Collections list */}
      <div className="w-52 border-r border-border bg-card flex flex-col shrink-0">
        <div className="px-3 py-2.5 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-foreground">Collections</span>
            </div>
            <Badge variant="secondary" className="text-[10px] h-4">{collections.length}</Badge>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {collections.map((col, i) => (
              <button
                key={`${col.name}-${i}`}
                onClick={() => setSelectedCollection(i)}
                className={cn(
                  "w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors text-left group",
                  selectedCollection === i
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Table className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-medium truncate font-mono text-[11px]">{col.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  {col.rls && <Shield className="w-3 h-3 text-primary/60" />}
                  <span className="text-[10px] text-muted-foreground">{col.fields.length}f</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteCollection(i); }}
                    className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </button>
            ))}

            {/* Add collection */}
            {isAddingCollection ? (
              <div className="flex items-center gap-1 px-2 py-1">
                <Input
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="table_name"
                  className="h-7 text-xs font-mono"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddCollection();
                    if (e.key === "Escape") setIsAddingCollection(false);
                  }}
                />
                <Button size="icon" className="h-7 w-7 shrink-0" onClick={handleAddCollection}>
                  <Check className="w-3 h-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => setIsAddingCollection(false)}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingCollection(true)}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Collection
              </button>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right: Field editor */}
      <div className="flex-1 flex flex-col min-w-0">
        {selected ? (
          <>
            {/* Collection header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
              <div>
                <h3 className="text-sm font-semibold text-foreground font-mono">{selected.name}</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {selected.fields.length} fields · {selected.rls ? "RLS enabled" : "No RLS"} · {selected.audit_fields ? "Audit" : "No audit"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={selected.rls ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={handleToggleRLS}
                >
                  <Shield className="w-3 h-3" />
                  {selected.rls ? "RLS On" : "RLS Off"}
                </Button>
              </div>
            </div>

            {/* Fields */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-1.5">
                {selected.fields.map((field, fi) => {
                  const Icon = FIELD_TYPE_ICON[field.type] || FileText;
                  const isEditing = editingFieldIdx === fi;

                  return (
                    <div
                      key={`${field.name}-${fi}`}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors group",
                        isEditing ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                      )}
                    >
                      <GripVertical className="w-3 h-3 text-muted-foreground/30 shrink-0" />
                      
                      {field.name === "id" && <Key className="w-3.5 h-3.5 text-primary shrink-0" />}
                      {field.relation_to && <Link2 className="w-3.5 h-3.5 text-accent-foreground shrink-0" />}
                      {!field.relation_to && field.name !== "id" && <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}

                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            defaultValue={field.name}
                            className="h-7 text-xs font-mono w-32"
                            onBlur={(e) => handleUpdateField(fi, { name: e.target.value })}
                          />
                          <Select
                            defaultValue={field.type}
                            onValueChange={(v) => handleUpdateField(fi, { type: v as FieldType })}
                          >
                            <SelectTrigger className="h-7 text-xs w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {FIELD_TYPES.map(ft => (
                                <SelectItem key={ft.value} value={ft.value} className="text-xs">
                                  {ft.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingFieldIdx(null)}>
                            <Check className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="text-sm font-medium text-foreground font-mono flex-1">{field.name}</span>
                          <div className="flex items-center gap-2">
                            {field.required && <Badge variant="outline" className="text-[9px] h-4 px-1">required</Badge>}
                            {field.unique && <Badge variant="outline" className="text-[9px] h-4 px-1">unique</Badge>}
                            {field.relation_to && (
                              <Badge variant="secondary" className="text-[9px] h-4 px-1 gap-0.5">
                                <Link2 className="w-2.5 h-2.5" /> {field.relation_to}
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-[10px] h-5 font-mono">{field.type}</Badge>
                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => setEditingFieldIdx(fi)} className="text-muted-foreground hover:text-foreground">
                                <Edit className="w-3 h-3" />
                              </button>
                              <button onClick={() => handleDeleteField(fi)} className="text-muted-foreground hover:text-destructive">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}

                {/* Add field */}
                {isAddingField ? (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-primary bg-primary/5">
                    <Input
                      value={newField.name || ""}
                      onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                      placeholder="field_name"
                      className="h-7 text-xs font-mono w-36"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddField();
                        if (e.key === "Escape") setIsAddingField(false);
                      }}
                    />
                    <Select
                      value={newField.type || "text"}
                      onValueChange={(v) => setNewField({ ...newField, type: v as FieldType })}
                    >
                      <SelectTrigger className="h-7 text-xs w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPES.map(ft => (
                          <SelectItem key={ft.value} value={ft.value} className="text-xs">
                            {ft.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <label className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={newField.required || false}
                        onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                        className="rounded"
                      />
                      Req
                    </label>
                    {newField.type === "relation" && (
                      <Select
                        value={newField.relation_to || ""}
                        onValueChange={(v) => setNewField({ ...newField, relation_to: v })}
                      >
                        <SelectTrigger className="h-7 text-xs w-28">
                          <SelectValue placeholder="→ table" />
                        </SelectTrigger>
                        <SelectContent>
                          {collections.map((c, ci) => (
                            <SelectItem key={ci} value={c.name} className="text-xs">{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Button size="icon" className="h-7 w-7 shrink-0" onClick={handleAddField}>
                      <Check className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => setIsAddingField(false)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAddingField(true)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Field
                  </button>
                )}
              </div>
            </ScrollArea>

            {/* ERD relationships overview */}
            {selected.fields.some(f => f.relation_to) && (
              <div className="px-4 py-2.5 border-t border-border bg-muted/30 shrink-0">
                <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">RELATIONSHIPS</p>
                <div className="flex flex-wrap gap-1.5">
                  {selected.fields.filter(f => f.relation_to).map((f, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] gap-1">
                      {selected.name}.{f.name} → {f.relation_to}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center space-y-3">
              <Database className="w-12 h-12 text-muted-foreground/30 mx-auto" />
              <h3 className="text-lg font-semibold text-foreground">Select a Collection</h3>
              <p className="text-sm text-muted-foreground">Choose a collection to view and edit its schema, or create a new one.</p>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setIsAddingCollection(true)}
              >
                <Plus className="w-3.5 h-3.5" /> New Collection
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
