import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Filter, X, Save, Star, Trash2, ChevronDown, Search, SlidersHorizontal } from "lucide-react";

export interface FilterField {
  key: string;
  label: string;
  type: "text" | "select" | "date" | "number" | "date-range";
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface Props {
  module: string;
  fields: FilterField[];
  filters: Record<string, string>;
  onFiltersChange: (filters: Record<string, string>) => void;
  search: string;
  onSearchChange: (search: string) => void;
}

export default function EducaAdvancedSearch({ module, fields, filters, onFiltersChange, search, onSearchChange }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [presetName, setPresetName] = useState("");
  const [saveOpen, setSaveOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: presets } = useQuery({
    queryKey: ["educa_saved_searches", module],
    queryFn: async () => {
      const { data } = await supabase.from("educa_saved_searches").select("*").eq("module", module).order("name");
      return data ?? [];
    },
    enabled: !!user,
  });

  const savePreset = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("educa_saved_searches").insert({
        user_id: user!.id, name: presetName, module, filters: { ...filters, _search: search },
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["educa_saved_searches", module] }); toast({ title: "Search preset saved" }); setSaveOpen(false); setPresetName(""); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deletePreset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("educa_saved_searches").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["educa_saved_searches", module] }); toast({ title: "Preset deleted" }); },
  });

  const loadPreset = (preset: any) => {
    const f = preset.filters as Record<string, string>;
    const s = f._search || "";
    const rest = { ...f };
    delete rest._search;
    onSearchChange(s);
    onFiltersChange(rest);
  };

  const clearAll = () => {
    onSearchChange("");
    onFiltersChange({});
  };

  const activeCount = Object.values(filters).filter(v => v && v !== "all").length + (search ? 1 : 0);

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search..." value={search} onChange={e => onSearchChange(e.target.value)} />
        </div>

        {/* Filter toggle */}
        <Button variant="outline" size="sm" onClick={() => setFiltersOpen(!filtersOpen)} className="gap-1">
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeCount > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{activeCount}</Badge>}
        </Button>

        {/* Presets */}
        {(presets ?? []).length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1"><Star className="w-4 h-4" />Presets<ChevronDown className="w-3 h-3" /></Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="end">
              {(presets ?? []).map(p => (
                <div key={p.id} className="flex items-center justify-between py-1 px-2 hover:bg-accent rounded text-sm group cursor-pointer" onClick={() => loadPreset(p)}>
                  <span>{p.name}</span>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => { e.stopPropagation(); deletePreset.mutate(p.id); }}><Trash2 className="w-3 h-3 text-destructive" /></button>
                </div>
              ))}
            </PopoverContent>
          </Popover>
        )}

        {/* Save preset */}
        {activeCount > 0 && (
          <>
            <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
              <DialogTrigger asChild><Button variant="ghost" size="sm"><Save className="w-4 h-4 mr-1" />Save</Button></DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader><DialogTitle>Save Search Preset</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Preset Name</Label><Input value={presetName} onChange={e => setPresetName(e.target.value)} placeholder="e.g. Active Australian Students" /></div>
                  <Button onClick={() => savePreset.mutate()} disabled={!presetName} className="w-full">Save Preset</Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="ghost" size="sm" onClick={clearAll}><X className="w-4 h-4 mr-1" />Clear</Button>
          </>
        )}
      </div>

      {/* Filter fields */}
      {filtersOpen && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-4 border rounded-lg bg-muted/30 animate-in fade-in-0 duration-200">
          {fields.map(f => (
            <div key={f.key}>
              <Label className="text-xs">{f.label}</Label>
              {f.type === "select" ? (
                <Select value={filters[f.key] || "all"} onValueChange={v => onFiltersChange({ ...filters, [f.key]: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {f.options?.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : f.type === "date" || f.type === "date-range" ? (
                <Input type="date" className="h-8 text-xs" value={filters[f.key] || ""} onChange={e => onFiltersChange({ ...filters, [f.key]: e.target.value })} />
              ) : f.type === "number" ? (
                <Input type="number" className="h-8 text-xs" placeholder={f.placeholder} value={filters[f.key] || ""} onChange={e => onFiltersChange({ ...filters, [f.key]: e.target.value })} />
              ) : (
                <Input className="h-8 text-xs" placeholder={f.placeholder || f.label} value={filters[f.key] || ""} onChange={e => onFiltersChange({ ...filters, [f.key]: e.target.value })} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Active filter tags */}
      {activeCount > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {search && <Badge variant="secondary" className="gap-1 text-xs">{`Search: "${search}"`}<X className="w-3 h-3 cursor-pointer" onClick={() => onSearchChange("")} /></Badge>}
          {Object.entries(filters).filter(([_, v]) => v && v !== "all").map(([k, v]) => {
            const field = fields.find(f => f.key === k);
            const label = field?.label || k;
            const display = field?.options?.find(o => o.value === v)?.label || v;
            return <Badge key={k} variant="secondary" className="gap-1 text-xs">{label}: {display}<X className="w-3 h-3 cursor-pointer" onClick={() => onFiltersChange({ ...filters, [k]: "" })} /></Badge>;
          })}
        </div>
      )}
    </div>
  );
}
