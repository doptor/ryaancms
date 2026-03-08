import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, FileText, Search, Trash2, Upload, Download, Eye, CheckCircle, Clock, XCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";

const DOC_TYPES = ["passport", "academic_certificate", "english_test", "financial_document", "visa_document", "offer_letter", "coe", "health_insurance", "photo", "resume", "sop", "lor", "other"];
const DOC_STATUSES = ["pending", "verified", "rejected", "expired"];
const statusIcon: Record<string, any> = { pending: Clock, verified: CheckCircle, rejected: XCircle, expired: XCircle };
const statusColor: Record<string, string> = { pending: "secondary", verified: "default", rejected: "destructive", expired: "outline" };

export default function EducaDocumentsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ student_id: "", type: "passport", name: "", notes: "", file: null as File | null });

  const { data: documents, isLoading } = useQuery({
    queryKey: ["educa_documents"], queryFn: async () => {
      const { data, error } = await supabase.from("educa_documents").select("*, educa_students(name)").order("created_at", { ascending: false });
      if (error) throw error; return data ?? [];
    }, enabled: !!user,
  });

  const { data: students } = useQuery({
    queryKey: ["educa_students_for_docs"], queryFn: async () => {
      const { data } = await supabase.from("educa_students").select("id, name").order("name");
      return data ?? [];
    }, enabled: !!user,
  });

  const uploadDoc = useMutation({
    mutationFn: async () => {
      let file_url = null;
      let file_size = null;
      if (form.file) {
        setUploading(true);
        const ext = form.file.name.split(".").pop();
        const path = `${user!.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("educa-documents").upload(path, form.file);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("educa-documents").getPublicUrl(path);
        file_url = urlData.publicUrl;
        file_size = form.file.size;
      }
      const { error } = await supabase.from("educa_documents").insert({
        user_id: user!.id, student_id: form.student_id || null, type: form.type,
        name: form.name || form.file?.name || "Untitled", file_url, file_size,
        notes: form.notes || null, status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["educa_documents"] }); toast({ title: "Document uploaded" }); closeDialog(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    onSettled: () => setUploading(false),
  });

  const verifyDoc = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("educa_documents").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["educa_documents"] }); toast({ title: "Document status updated" }); },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("educa_documents").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["educa_documents"] }); toast({ title: "Document deleted" }); },
  });

  const closeDialog = () => { setOpen(false); setForm({ student_id: "", type: "passport", name: "", notes: "", file: null }); };

  const filtered = (documents ?? []).filter(d => {
    const matchSearch = !search || d.name?.toLowerCase().includes(search.toLowerCase()) || (d as any).educa_students?.name?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || d.type === typeFilter;
    return matchSearch && matchType;
  });

  const stats = {
    total: (documents ?? []).length,
    verified: (documents ?? []).filter(d => d.status === "verified").length,
    pending: (documents ?? []).filter(d => d.status === "pending").length,
    rejected: (documents ?? []).filter(d => d.status === "rejected").length,
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="w-6 h-6 text-primary" /> Document Management</h1>
            <p className="text-muted-foreground text-sm">Manage student documents — passports, certificates, test scores, visa docs</p>
          </div>
          <Dialog open={open} onOpenChange={v => { if (!v) closeDialog(); else setOpen(true); }}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" /> Upload Document</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Student</Label>
                  <Select value={form.student_id} onValueChange={v => setForm(p => ({ ...p, student_id: v }))}><SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger><SelectContent>{(students ?? []).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
                </div>
                <div><Label>Document Type</Label>
                  <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{DOC_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>)}</SelectContent></Select>
                </div>
                <div><Label>Document Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. John's Passport" /></div>
                <div><Label>File</Label><Input type="file" onChange={e => setForm(p => ({ ...p, file: e.target.files?.[0] || null }))} /></div>
                <div><Label>Notes</Label><Input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
                <Button onClick={() => uploadDoc.mutate()} disabled={uploading} className="w-full">
                  {uploading ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Uploading...</> : <><Upload className="w-4 h-4 mr-1" />Upload</>}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Documents</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Verified</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{stats.verified}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pending Review</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-orange-600">{stats.pending}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Rejected</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{stats.rejected}</div></CardContent></Card>
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem>{DOC_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>)}</SelectContent></Select>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Document</TableHead><TableHead>Student</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filtered.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No documents found</TableCell></TableRow> : filtered.map(doc => {
                    const StatusIcon = statusIcon[doc.status || "pending"] || Clock;
                    return (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.name}</TableCell>
                        <TableCell>{(doc as any).educa_students?.name || "—"}</TableCell>
                        <TableCell><Badge variant="outline">{(doc.type || "other").replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}</Badge></TableCell>
                        <TableCell><Badge variant={statusColor[doc.status || "pending"] as any} className="gap-1"><StatusIcon className="w-3 h-3" />{doc.status}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{format(new Date(doc.created_at), "MMM d, yyyy")}</TableCell>
                        <TableCell className="text-right space-x-1">
                          {doc.file_url && <Button size="icon" variant="ghost" onClick={() => window.open(doc.file_url!, "_blank")}><Eye className="w-4 h-4" /></Button>}
                          {doc.status !== "verified" && <Button size="icon" variant="ghost" onClick={() => verifyDoc.mutate({ id: doc.id, status: "verified" })}><CheckCircle className="w-4 h-4 text-green-600" /></Button>}
                          {doc.status !== "rejected" && <Button size="icon" variant="ghost" onClick={() => verifyDoc.mutate({ id: doc.id, status: "rejected" })}><XCircle className="w-4 h-4 text-destructive" /></Button>}
                          <Button size="icon" variant="ghost" onClick={() => deleteMut.mutate(doc.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
