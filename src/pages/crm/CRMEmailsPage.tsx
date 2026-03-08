import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Mail, Plus, Search, Send, ArrowDownLeft, ArrowUpRight } from "lucide-react";

const statusColor: Record<string, string> = {
  sent: "bg-green-100 text-green-700",
  draft: "bg-gray-100 text-gray-700",
  opened: "bg-blue-100 text-blue-700",
  replied: "bg-purple-100 text-purple-700",
  failed: "bg-red-100 text-red-700",
};

export default function CRMEmailsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ to_email: "", subject: "", body: "" });

  const { data: emails, isLoading } = useQuery({
    queryKey: ["crm-emails"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_emails").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const createEmail = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("crm_emails").insert({
        ...form,
        user_id: user!.id,
        direction: "outbound",
        status: "sent",
        from_email: user!.email,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-emails"] });
      toast({ title: "Email logged" });
      setForm({ to_email: "", subject: "", body: "" });
      setOpen(false);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filtered = (emails ?? []).filter((e) =>
    e.subject.toLowerCase().includes(search.toLowerCase()) ||
    (e.to_email || "").toLowerCase().includes(search.toLowerCase())
  );

  const sentCount = (emails ?? []).filter((e) => e.direction === "outbound").length;
  const openedCount = (emails ?? []).filter((e) => e.opened_at).length;
  const repliedCount = (emails ?? []).filter((e) => e.replied_at).length;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Mail className="w-6 h-6 text-primary" /> Email Hub</h1>
            <p className="text-muted-foreground">Track communication with leads & contacts</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Log Email</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Compose / Log Email</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>To</Label><Input type="email" value={form.to_email} onChange={(e) => setForm({ ...form, to_email: e.target.value })} placeholder="recipient@example.com" /></div>
                <div><Label>Subject *</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
                <div><Label>Body</Label><Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={6} placeholder="Email content..." /></div>
                <Button onClick={() => createEmail.mutate()} disabled={!form.subject.trim()} className="w-full">
                  <Send className="w-4 h-4 mr-2" />Log as Sent
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{sentCount}</div><p className="text-xs text-muted-foreground">Emails Sent</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-blue-600">{openedCount}</div><p className="text-xs text-muted-foreground">Opened</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-purple-600">{repliedCount}</div><p className="text-xs text-muted-foreground">Replied</p></CardContent></Card>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search emails..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>To / From</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      {e.direction === "outbound"
                        ? <ArrowUpRight className="w-4 h-4 text-blue-500" />
                        : <ArrowDownLeft className="w-4 h-4 text-green-500" />
                      }
                    </TableCell>
                    <TableCell className="font-medium">{e.subject}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{e.direction === "outbound" ? e.to_email : e.from_email}</TableCell>
                    <TableCell><Badge variant="outline" className={statusColor[e.status ?? "sent"]}>{e.status}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(e.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">{isLoading ? "Loading..." : "No emails tracked yet"}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
