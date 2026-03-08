import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "@/hooks/use-toast";
import { Plus, BookOpen, Pencil, Trash2, Loader2, Search, SlidersHorizontal, X, ChevronDown, ChevronUp, ArrowUpDown, LayoutGrid, LayoutList, Star, Save, GraduationCap, Globe, DollarSign, Clock, Filter } from "lucide-react";
import EducaAdvancedSearch, { FilterField } from "@/components/educa/EducaAdvancedSearch";

const LEVELS = ["diploma", "bachelors", "masters", "phd", "certificate", "foundation"];
const CURRENCIES = ["USD", "AUD", "GBP", "CAD", "EUR", "NZD", "SGD", "MYR"];
const DURATIONS = ["6 months", "1 year", "1.5 years", "2 years", "3 years", "4 years", "5 years"];
const emptyForm = { course_name: "", course_code: "", university_id: "", level: "bachelors", duration: "", tuition_fee: "0", currency: "USD", intake: "", ielts_requirement: "", entry_requirements: "", description: "" };

type SortKey = "course_name" | "tuition_fee" | "ielts_requirement" | "level" | "university";
type SortDir = "asc" | "desc";

export default function EducaCoursesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  // Advanced search state
  const [search, setSearch] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>([]);
  const [selectedUniversities, setSelectedUniversities] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [feeRange, setFeeRange] = useState<[number, number]>([0, 200000]);
  const [ieltsRange, setIeltsRange] = useState<[number, number]>([0, 9]);
  const [intakeSearch, setIntakeSearch] = useState("");
  const [durationFilter, setDurationFilter] = useState<string[]>([]);
  const [entryReqSearch, setEntryReqSearch] = useState("");
  const [hasScholarship, setHasScholarship] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("course_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const { data: courses, isLoading } = useQuery({
    queryKey: ["educa_courses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("educa_courses").select("*, educa_universities(name, country)").order("course_name");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: universities } = useQuery({
    queryKey: ["educa_unis_list"],
    queryFn: async () => {
      const { data } = await supabase.from("educa_universities").select("id, name, country").eq("is_active", true).order("name");
      return data ?? [];
    },
    enabled: !!user,
  });

  // Derive unique countries from universities
  const allCountries = useMemo(() => {
    const set = new Set<string>();
    (universities ?? []).forEach(u => { if (u.country) set.add(u.country); });
    return Array.from(set).sort();
  }, [universities]);

  // Derive fee bounds
  const feeBounds = useMemo(() => {
    const fees = (courses ?? []).map(c => c.tuition_fee || 0);
    return { min: 0, max: Math.max(200000, ...fees) };
  }, [courses]);

  const upsert = useMutation({
    mutationFn: async () => {
      const payload: any = { course_name: form.course_name, course_code: form.course_code || null, university_id: form.university_id || null, level: form.level, duration: form.duration || null, tuition_fee: parseFloat(form.tuition_fee) || 0, currency: form.currency, intake: form.intake || null, ielts_requirement: form.ielts_requirement ? parseFloat(form.ielts_requirement) : null, entry_requirements: form.entry_requirements || null, description: form.description || null, user_id: user!.id };
      if (editId) { const { error } = await supabase.from("educa_courses").update(payload).eq("id", editId); if (error) throw error; }
      else { const { error } = await supabase.from("educa_courses").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["educa_courses"] }); toast({ title: editId ? "Course updated" : "Course added" }); closeDialog(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("educa_courses").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["educa_courses"] }); toast({ title: "Course deleted" }); },
  });

  const closeDialog = () => { setOpen(false); setEditId(null); setForm(emptyForm); };
  const openEdit = (c: any) => { setEditId(c.id); setForm({ course_name: c.course_name, course_code: c.course_code || "", university_id: c.university_id || "", level: c.level || "bachelors", duration: c.duration || "", tuition_fee: c.tuition_fee?.toString() || "0", currency: c.currency || "USD", intake: c.intake || "", ielts_requirement: c.ielts_requirement?.toString() || "", entry_requirements: c.entry_requirements || "", description: c.description || "" }); setOpen(true); };

  const toggleArrayItem = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item];

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (search) c++;
    if (selectedLevels.length) c++;
    if (selectedCurrencies.length) c++;
    if (selectedUniversities.length) c++;
    if (selectedCountries.length) c++;
    if (feeRange[0] > 0 || feeRange[1] < feeBounds.max) c++;
    if (ieltsRange[0] > 0 || ieltsRange[1] < 9) c++;
    if (intakeSearch) c++;
    if (durationFilter.length) c++;
    if (entryReqSearch) c++;
    if (hasScholarship) c++;
    return c;
  }, [search, selectedLevels, selectedCurrencies, selectedUniversities, selectedCountries, feeRange, ieltsRange, intakeSearch, durationFilter, entryReqSearch, hasScholarship, feeBounds.max]);

  const clearAllFilters = () => {
    setSearch(""); setSelectedLevels([]); setSelectedCurrencies([]); setSelectedUniversities([]);
    setSelectedCountries([]); setFeeRange([0, feeBounds.max]); setIeltsRange([0, 9]);
    setIntakeSearch(""); setDurationFilter([]); setEntryReqSearch(""); setHasScholarship(false);
  };

  const filtered = useMemo(() => {
    let result = (courses ?? []).filter(c => {
      const q = search.toLowerCase();
      if (q && !c.course_name.toLowerCase().includes(q) && !(c.course_code || "").toLowerCase().includes(q) && !(c as any).educa_universities?.name?.toLowerCase().includes(q) && !(c.description || "").toLowerCase().includes(q)) return false;
      if (selectedLevels.length && !selectedLevels.includes(c.level || "")) return false;
      if (selectedCurrencies.length && !selectedCurrencies.includes(c.currency || "")) return false;
      if (selectedUniversities.length && !selectedUniversities.includes(c.university_id || "")) return false;
      if (selectedCountries.length && !(c as any).educa_universities?.country) return false;
      if (selectedCountries.length && !selectedCountries.includes((c as any).educa_universities?.country)) return false;
      if ((c.tuition_fee || 0) < feeRange[0] || (c.tuition_fee || 0) > feeRange[1]) return false;
      if (c.ielts_requirement != null && (c.ielts_requirement < ieltsRange[0] || c.ielts_requirement > ieltsRange[1])) return false;
      if (intakeSearch && !(c.intake || "").toLowerCase().includes(intakeSearch.toLowerCase())) return false;
      if (durationFilter.length && !durationFilter.some(d => (c.duration || "").toLowerCase().includes(d.toLowerCase()))) return false;
      if (entryReqSearch && !(c.entry_requirements || "").toLowerCase().includes(entryReqSearch.toLowerCase())) return false;
      return true;
    });

    // Sort
    result.sort((a, b) => {
      let va: any, vb: any;
      switch (sortKey) {
        case "course_name": va = a.course_name.toLowerCase(); vb = b.course_name.toLowerCase(); break;
        case "tuition_fee": va = a.tuition_fee || 0; vb = b.tuition_fee || 0; break;
        case "ielts_requirement": va = a.ielts_requirement || 0; vb = b.ielts_requirement || 0; break;
        case "level": va = LEVELS.indexOf(a.level || ""); vb = LEVELS.indexOf(b.level || ""); break;
        case "university": va = (a as any).educa_universities?.name?.toLowerCase() || ""; vb = (b as any).educa_universities?.name?.toLowerCase() || ""; break;
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [courses, search, selectedLevels, selectedCurrencies, selectedUniversities, selectedCountries, feeRange, ieltsRange, intakeSearch, durationFilter, entryReqSearch, hasScholarship, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => (
    <ArrowUpDown className={`w-3 h-3 inline ml-1 ${sortKey === col ? "text-primary" : "text-muted-foreground/50"}`} />
  );

  // Stats
  const stats = useMemo(() => ({
    total: filtered.length,
    avgFee: filtered.length ? Math.round(filtered.reduce((s, c) => s + (c.tuition_fee || 0), 0) / filtered.length) : 0,
    levels: new Set(filtered.map(c => c.level)).size,
    unis: new Set(filtered.map(c => c.university_id).filter(Boolean)).size,
  }), [filtered]);

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><BookOpen className="w-6 h-6 text-primary" /> Course Search</h1>
            <p className="text-muted-foreground">Super advanced course filtering · {filtered.length} of {(courses ?? []).length} courses</p>
          </div>
          <div className="flex gap-2">
            <div className="flex border rounded-md overflow-hidden">
              <Button variant={viewMode === "table" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("table")} className="rounded-none"><LayoutList className="w-4 h-4" /></Button>
              <Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("grid")} className="rounded-none"><LayoutGrid className="w-4 h-4" /></Button>
            </div>
            <Dialog open={open} onOpenChange={v => { if (!v) closeDialog(); else setOpen(true); }}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" />Add Course</Button></DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader><DialogTitle>{editId ? "Edit Course" : "Add Course"}</DialogTitle></DialogHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label>Course Name *</Label><Input value={form.course_name} onChange={e => setForm(p => ({ ...p, course_name: e.target.value }))} /></div>
                  <div><Label>Course Code</Label><Input value={form.course_code} onChange={e => setForm(p => ({ ...p, course_code: e.target.value }))} /></div>
                  <div><Label>University</Label><Select value={form.university_id} onValueChange={v => setForm(p => ({ ...p, university_id: v }))}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{(universities ?? []).map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Level</Label><Select value={form.level} onValueChange={v => setForm(p => ({ ...p, level: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{LEVELS.map(l => <SelectItem key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Duration</Label><Input value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} placeholder="e.g. 2 years" /></div>
                  <div><Label>Tuition Fee</Label><Input type="number" value={form.tuition_fee} onChange={e => setForm(p => ({ ...p, tuition_fee: e.target.value }))} /></div>
                  <div><Label>Currency</Label><Select value={form.currency} onValueChange={v => setForm(p => ({ ...p, currency: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Intake</Label><Input value={form.intake} onChange={e => setForm(p => ({ ...p, intake: e.target.value }))} placeholder="e.g. Feb, Jul, Sep" /></div>
                  <div><Label>IELTS Requirement</Label><Input type="number" step="0.5" value={form.ielts_requirement} onChange={e => setForm(p => ({ ...p, ielts_requirement: e.target.value }))} /></div>
                  <div><Label>Entry Requirements</Label><Input value={form.entry_requirements} onChange={e => setForm(p => ({ ...p, entry_requirements: e.target.value }))} /></div>
                  <div className="sm:col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} /></div>
                </div>
                <div className="flex justify-end gap-2 mt-4"><Button variant="outline" onClick={closeDialog}>Cancel</Button><Button onClick={() => upsert.mutate()} disabled={!form.course_name || upsert.isPending}>{editId ? "Update" : "Add"}</Button></div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><BookOpen className="w-5 h-5 text-primary" /></div><div><p className="text-xs text-muted-foreground">Courses Found</p><p className="text-xl font-bold">{stats.total}</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><DollarSign className="w-5 h-5 text-primary" /></div><div><p className="text-xs text-muted-foreground">Avg Fee</p><p className="text-xl font-bold">${stats.avgFee.toLocaleString()}</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><GraduationCap className="w-5 h-5 text-primary" /></div><div><p className="text-xs text-muted-foreground">Levels</p><p className="text-xl font-bold">{stats.levels}</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><Globe className="w-5 h-5 text-primary" /></div><div><p className="text-xs text-muted-foreground">Universities</p><p className="text-xl font-bold">{stats.unis}</p></div></CardContent></Card>
        </div>

        {/* Search Bar */}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search courses, codes, universities, descriptions..." value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setSearch("")}><X className="w-4 h-4 text-muted-foreground" /></button>}
          </div>
          <Button variant={advancedOpen ? "default" : "outline"} size="sm" onClick={() => setAdvancedOpen(!advancedOpen)} className="gap-1.5 shrink-0">
            <SlidersHorizontal className="w-4 h-4" />
            Advanced
            {activeFilterCount > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{activeFilterCount}</Badge>}
          </Button>
          {activeFilterCount > 0 && <Button variant="ghost" size="sm" onClick={clearAllFilters} className="gap-1 shrink-0"><X className="w-4 h-4" />Clear All</Button>}
        </div>

        {/* Advanced Filter Panel */}
        {advancedOpen && (
          <Card className="animate-in fade-in-0 slide-in-from-top-2 duration-300">
            <CardContent className="p-5 space-y-5">
              {/* Row 1: Level & Currency multi-select */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Level */}
                <div>
                  <Label className="text-xs font-semibold flex items-center gap-1 mb-2"><GraduationCap className="w-3.5 h-3.5" /> Level</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {LEVELS.map(l => (
                      <Badge key={l} variant={selectedLevels.includes(l) ? "default" : "outline"}
                        className="cursor-pointer capitalize text-xs transition-all hover:scale-105"
                        onClick={() => setSelectedLevels(prev => toggleArrayItem(prev, l))}>
                        {l}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Currency */}
                <div>
                  <Label className="text-xs font-semibold flex items-center gap-1 mb-2"><DollarSign className="w-3.5 h-3.5" /> Currency</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {CURRENCIES.map(c => (
                      <Badge key={c} variant={selectedCurrencies.includes(c) ? "default" : "outline"}
                        className="cursor-pointer text-xs transition-all hover:scale-105"
                        onClick={() => setSelectedCurrencies(prev => toggleArrayItem(prev, c))}>
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Country */}
                <div>
                  <Label className="text-xs font-semibold flex items-center gap-1 mb-2"><Globe className="w-3.5 h-3.5" /> Country</Label>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {allCountries.map(c => (
                      <Badge key={c} variant={selectedCountries.includes(c) ? "default" : "outline"}
                        className="cursor-pointer text-xs transition-all hover:scale-105"
                        onClick={() => setSelectedCountries(prev => toggleArrayItem(prev, c))}>
                        {c}
                      </Badge>
                    ))}
                    {allCountries.length === 0 && <span className="text-xs text-muted-foreground">No countries</span>}
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <Label className="text-xs font-semibold flex items-center gap-1 mb-2"><Clock className="w-3.5 h-3.5" /> Duration</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {DURATIONS.map(d => (
                      <Badge key={d} variant={durationFilter.includes(d) ? "default" : "outline"}
                        className="cursor-pointer text-xs transition-all hover:scale-105"
                        onClick={() => setDurationFilter(prev => toggleArrayItem(prev, d))}>
                        {d}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 2: Sliders & text filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Fee Range */}
                <div>
                  <Label className="text-xs font-semibold mb-2 block">Tuition Fee Range</Label>
                  <Slider min={0} max={feeBounds.max} step={1000} value={feeRange} onValueChange={(v) => setFeeRange(v as [number, number])} className="mt-3" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>${feeRange[0].toLocaleString()}</span>
                    <span>${feeRange[1].toLocaleString()}</span>
                  </div>
                </div>

                {/* IELTS Range */}
                <div>
                  <Label className="text-xs font-semibold mb-2 block">IELTS Requirement</Label>
                  <Slider min={0} max={9} step={0.5} value={ieltsRange} onValueChange={(v) => setIeltsRange(v as [number, number])} className="mt-3" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{ieltsRange[0]}</span>
                    <span>{ieltsRange[1]}</span>
                  </div>
                </div>

                {/* Intake */}
                <div>
                  <Label className="text-xs font-semibold mb-2 block">Intake Period</Label>
                  <Input className="h-8 text-xs" placeholder="e.g. Sep, Feb, Jan" value={intakeSearch} onChange={e => setIntakeSearch(e.target.value)} />
                </div>

                {/* Entry Requirements */}
                <div>
                  <Label className="text-xs font-semibold mb-2 block">Entry Requirements</Label>
                  <Input className="h-8 text-xs" placeholder="Search requirements..." value={entryReqSearch} onChange={e => setEntryReqSearch(e.target.value)} />
                </div>
              </div>

              {/* Row 3: University multi-select */}
              {(universities ?? []).length > 0 && (
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1 text-xs">
                      <Filter className="w-3.5 h-3.5" />
                      Filter by University ({selectedUniversities.length} selected)
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 border rounded-lg bg-muted/30">
                      {(universities ?? []).map(u => (
                        <Badge key={u.id} variant={selectedUniversities.includes(u.id) ? "default" : "outline"}
                          className="cursor-pointer text-xs transition-all hover:scale-105"
                          onClick={() => setSelectedUniversities(prev => toggleArrayItem(prev, u.id))}>
                          {u.name}
                        </Badge>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Active filter tags */}
              {activeFilterCount > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t">
                  {search && <Badge variant="secondary" className="gap-1 text-xs">Search: "{search}" <X className="w-3 h-3 cursor-pointer" onClick={() => setSearch("")} /></Badge>}
                  {selectedLevels.map(l => <Badge key={l} variant="secondary" className="gap-1 text-xs capitalize">Level: {l} <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedLevels(p => p.filter(x => x !== l))} /></Badge>)}
                  {selectedCurrencies.map(c => <Badge key={c} variant="secondary" className="gap-1 text-xs">Currency: {c} <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCurrencies(p => p.filter(x => x !== c))} /></Badge>)}
                  {selectedCountries.map(c => <Badge key={c} variant="secondary" className="gap-1 text-xs">Country: {c} <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCountries(p => p.filter(x => x !== c))} /></Badge>)}
                  {durationFilter.map(d => <Badge key={d} variant="secondary" className="gap-1 text-xs">Duration: {d} <X className="w-3 h-3 cursor-pointer" onClick={() => setDurationFilter(p => p.filter(x => x !== d))} /></Badge>)}
                  {(feeRange[0] > 0 || feeRange[1] < feeBounds.max) && <Badge variant="secondary" className="gap-1 text-xs">Fee: ${feeRange[0].toLocaleString()}–${feeRange[1].toLocaleString()} <X className="w-3 h-3 cursor-pointer" onClick={() => setFeeRange([0, feeBounds.max])} /></Badge>}
                  {(ieltsRange[0] > 0 || ieltsRange[1] < 9) && <Badge variant="secondary" className="gap-1 text-xs">IELTS: {ieltsRange[0]}–{ieltsRange[1]} <X className="w-3 h-3 cursor-pointer" onClick={() => setIeltsRange([0, 9])} /></Badge>}
                  {intakeSearch && <Badge variant="secondary" className="gap-1 text-xs">Intake: {intakeSearch} <X className="w-3 h-3 cursor-pointer" onClick={() => setIntakeSearch("")} /></Badge>}
                  {entryReqSearch && <Badge variant="secondary" className="gap-1 text-xs">Entry Req: {entryReqSearch} <X className="w-3 h-3 cursor-pointer" onClick={() => setEntryReqSearch("")} /></Badge>}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Sort Bar */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Sort by:</span>
          {([["course_name", "Name"], ["tuition_fee", "Fee"], ["ielts_requirement", "IELTS"], ["level", "Level"], ["university", "University"]] as [SortKey, string][]).map(([key, label]) => (
            <Button key={key} variant="ghost" size="sm" className={`h-7 text-xs gap-0.5 ${sortKey === key ? "text-primary font-semibold" : ""}`} onClick={() => handleSort(key)}>
              {label}
              {sortKey === key && (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
            </Button>
          ))}
        </div>

        {/* Results */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No courses match your filters</p>
                <p className="text-sm">Try adjusting or clearing some filters</p>
                {activeFilterCount > 0 && <Button variant="outline" size="sm" className="mt-3" onClick={clearAllFilters}>Clear All Filters</Button>}
              </div>
            ) : viewMode === "table" ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("course_name")}>Course <SortIcon col="course_name" /></TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("university")}>University <SortIcon col="university" /></TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("level")}>Level <SortIcon col="level" /></TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("tuition_fee")}>Fee <SortIcon col="tuition_fee" /></TableHead>
                      <TableHead>Intake</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("ielts_requirement")}>IELTS <SortIcon col="ielts_requirement" /></TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.course_name}<br /><span className="text-xs text-muted-foreground">{c.course_code}</span></TableCell>
                        <TableCell className="text-sm">
                          <div>{(c as any).educa_universities?.name || "—"}</div>
                          {(c as any).educa_universities?.country && <span className="text-xs text-muted-foreground">{(c as any).educa_universities.country}</span>}
                        </TableCell>
                        <TableCell><Badge variant="outline" className="capitalize text-xs">{c.level}</Badge></TableCell>
                        <TableCell className="text-sm">{c.duration || "—"}</TableCell>
                        <TableCell className="text-sm font-medium">{c.currency} {c.tuition_fee?.toLocaleString()}</TableCell>
                        <TableCell className="text-sm">{c.intake || "—"}</TableCell>
                        <TableCell className="text-sm">{c.ielts_requirement ?? "—"}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(c.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              /* Grid View */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {filtered.map(c => (
                  <Card key={c.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-sm leading-tight">{c.course_name}</h3>
                          {c.course_code && <p className="text-xs text-muted-foreground">{c.course_code}</p>}
                        </div>
                        <Badge variant="outline" className="capitalize text-xs shrink-0">{c.level}</Badge>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Globe className="w-3.5 h-3.5" />
                          {(c as any).educa_universities?.name || "—"}
                          {(c as any).educa_universities?.country && <span>· {(c as any).educa_universities.country}</span>}
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <DollarSign className="w-3.5 h-3.5" />
                          <span className="font-medium text-foreground">{c.currency} {c.tuition_fee?.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" /> {c.duration || "—"}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {c.intake && <Badge variant="secondary" className="text-xs">{c.intake}</Badge>}
                          {c.ielts_requirement && <Badge variant="secondary" className="text-xs">IELTS {c.ielts_requirement}</Badge>}
                        </div>
                      </div>
                      <div className="flex justify-end gap-1 pt-1 border-t">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMut.mutate(c.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}