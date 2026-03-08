import { useState } from "react";
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
import { toast } from "@/hooks/use-toast";
import { Plus, Bot, Search, Pencil, Trash2, Loader2, ArrowDown, ArrowRight, MessageSquare } from "lucide-react";

type ScriptStep = { type: string; content: string; options?: string[] };
const STEP_TYPES = ["greeting", "question", "response", "action", "transfer", "end"];
const emptyForm = { name: "", description: "", type: "voice", language: "en", ai_model: "gemini-2.5-flash", steps: "[]" };
const emptyStep: ScriptStep = { type: "greeting", content: "" };

export default function CommScriptsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [steps, setSteps] = useState<ScriptStep[]>([{ type: "greeting", content: "Hello! How can I help you today?" }]);

  const { data: scripts, isLoading } = useQuery({
    queryKey: ["comm_scripts"], queryFn: async () => { const { data, error } = await supabase.from("comm_scripts").select("*").order("created_at", { ascending: false }); if (error) throw error; return data ?? []; }, enabled: !!user,
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload: any = { name: form.name, description: form.description || null, type: form.type, language: form.language, ai_model: form.ai_model, steps: steps, user_id: user!.id };
      if (editId) { const { error } = await supabase.from("comm_scripts").update(payload).eq("id", editId); if (error) throw error; }
      else { const { error } = await supabase.from("comm_scripts").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["comm_scripts"] }); toast({ title: editId ? "Script updated" : "Script created" }); closeDialog(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("comm_scripts").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["comm_scripts"] }); toast({ title: "Script deleted" }); },
  });

  const closeDialog = () => { setOpen(false); setEditId(null); setForm(emptyForm); setSteps([{ type: "greeting", content: "Hello! How can I help you today?" }]); };
  const openEdit = (s: any) => { setEditId(s.id); setForm({ name: s.name, description: s.description || "", type: s.type, language: s.language || "en", ai_model: s.ai_model || "gemini-2.5-flash", steps: "" }); setSteps((s.steps as ScriptStep[]) || []); setOpen(true); };

  const addStep = () => setSteps([...steps, { ...emptyStep }]);
  const removeStep = (i: number) => setSteps(steps.filter((_, idx) => idx !== i));
  const updateStep = (i: number, field: string, value: string) => { const n = [...steps]; (n[i] as any)[field] = value; setSteps(n); };

  const filtered = (scripts ?? []).filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div><h1 className="text-2xl font-bold flex items-center gap-2"><Bot className="w-6 h-6 text-primary" /> AI Conversation Scripts</h1><p className="text-muted-foreground">Build AI conversation flows for calls & chats</p></div>
          <Dialog open={open} onOpenChange={v => { if (!v) closeDialog(); else setOpen(true); }}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />New Script</Button></DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editId ? "Edit Script" : "Create AI Script"}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Script Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                  <div><Label>Type</Label><Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="voice">Voice Call</SelectItem><SelectItem value="whatsapp">WhatsApp</SelectItem><SelectItem value="ivr">IVR</SelectItem></SelectContent></Select></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Language</Label><Select value={form.language} onValueChange={v => setForm({ ...form, language: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="bn">বাংলা</SelectItem><SelectItem value="ar">Arabic</SelectItem><SelectItem value="es">Spanish</SelectItem></SelectContent></Select></div>
                  <div><Label>AI Model</Label><Select value={form.ai_model} onValueChange={v => setForm({ ...form, ai_model: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem><SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem><SelectItem value="gpt-5">GPT-5</SelectItem></SelectContent></Select></div>
                </div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-3"><Label className="text-base font-semibold">Conversation Flow</Label><Button size="sm" variant="outline" onClick={addStep}><Plus className="w-3 h-3 mr-1" />Add Step</Button></div>
                  <div className="space-y-2">
                    {steps.map((step, i) => (
                      <div key={i}>
                        {i > 0 && <div className="flex justify-center py-1"><ArrowDown className="w-4 h-4 text-muted-foreground" /></div>}
                        <div className="border rounded-lg p-3 space-y-2 relative">
                          <div className="flex gap-2 items-center">
                            <Badge variant="secondary" className="capitalize text-xs">{i + 1}</Badge>
                            <Select value={step.type} onValueChange={v => updateStep(i, "type", v)}><SelectTrigger className="h-7 w-28"><SelectValue /></SelectTrigger><SelectContent>{STEP_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent></Select>
                            <Button size="sm" variant="ghost" onClick={() => removeStep(i)} className="ml-auto"><Trash2 className="w-3 h-3 text-destructive" /></Button>
                          </div>
                          <Textarea value={step.content} onChange={e => updateStep(i, "content", e.target.value)} rows={2} placeholder={step.type === "greeting" ? "Hello! How can I help?" : step.type === "question" ? "What is your order number?" : step.type === "action" ? "Transfer to agent / lookup order" : "Enter content..."} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <Button onClick={() => upsert.mutate()} disabled={!form.name.trim()} className="w-full">{editId ? "Update" : "Create"} Script</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Scripts</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{(scripts ?? []).length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Voice Scripts</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{(scripts ?? []).filter(s => s.type === "voice").length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">WhatsApp Scripts</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-emerald-600">{(scripts ?? []).filter(s => s.type === "whatsapp").length}</div></CardContent></Card>
        </div>

        <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search scripts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>

        <Card><CardContent className="pt-4">
          {isLoading ? <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : filtered.length > 0 ? (
            <Table><TableHeader><TableRow><TableHead>Script</TableHead><TableHead>Type</TableHead><TableHead>Language</TableHead><TableHead>AI Model</TableHead><TableHead>Steps</TableHead><TableHead>Used</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>{filtered.map(s => (
                <TableRow key={s.id}><TableCell><div className="font-medium">{s.name}</div>{s.description && <div className="text-xs text-muted-foreground">{s.description}</div>}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{s.type}</Badge></TableCell>
                  <TableCell className="uppercase text-sm">{s.language}</TableCell>
                  <TableCell className="text-sm">{s.ai_model}</TableCell>
                  <TableCell><Badge variant="secondary">{((s.steps as any[]) || []).length} steps</Badge></TableCell>
                  <TableCell>{s.usage_count ?? 0}x</TableCell>
                  <TableCell className="text-right"><div className="flex gap-1 justify-end"><Button size="sm" variant="ghost" onClick={() => openEdit(s)}><Pencil className="w-3.5 h-3.5" /></Button><Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete?")) deleteMut.mutate(s.id); }}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button></div></TableCell>
                </TableRow>
              ))}</TableBody></Table>
          ) : <div className="py-12 text-center"><Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" /><h3 className="text-lg font-medium">No AI Scripts</h3></div>}
        </CardContent></Card>
      </div>
    </DashboardLayout>
  );
}
