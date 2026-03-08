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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { MessageSquare, Search, Loader2, Send, Bot, User, Plus, Image, FileText } from "lucide-react";
import { format } from "date-fns";

export default function CommWhatsAppPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [newMsg, setNewMsg] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeForm, setComposeForm] = useState({ contact_id: "", message: "" });

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["comm_conversations"], queryFn: async () => { const { data, error } = await supabase.from("comm_conversations").select("*, comm_contacts(name, whatsapp_number)").eq("channel", "whatsapp").order("last_message_at", { ascending: false }); if (error) throw error; return data ?? []; }, enabled: !!user,
  });
  const { data: contacts } = useQuery({ queryKey: ["comm_contacts_wa"], queryFn: async () => { const { data } = await supabase.from("comm_contacts").select("id, name, whatsapp_number").not("whatsapp_number", "is", null); return data ?? []; }, enabled: !!user });
  const { data: messages } = useQuery({
    queryKey: ["comm_wa_msgs", selectedConv], queryFn: async () => {
      if (!selectedConv) return [];
      const conv = (conversations ?? []).find(c => c.id === selectedConv);
      if (!conv) return [];
      const { data } = await supabase.from("comm_whatsapp_messages").select("*").eq("contact_id", conv.contact_id).order("created_at", { ascending: true });
      return data ?? [];
    }, enabled: !!user && !!selectedConv,
  });

  const sendMessage = useMutation({
    mutationFn: async () => {
      const conv = (conversations ?? []).find(c => c.id === selectedConv);
      if (!conv) throw new Error("No conversation selected");
      const contact = (contacts ?? []).find(ct => ct.id === conv.contact_id);
      const waNumber = contact?.whatsapp_number;

      if (waNumber) {
        // Send via WhatsApp Business API edge function
        const { data, error } = await supabase.functions.invoke("comm-whatsapp", {
          body: { action: "send-message", to: waNumber, message: newMsg, contact_id: conv.contact_id },
        });
        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || "Send failed");
      } else {
        // Fallback: save locally only
        const { error } = await supabase.from("comm_whatsapp_messages").insert({ contact_id: conv.contact_id, direction: "outbound", content: newMsg, status: "sent", user_id: user!.id });
        if (error) throw error;
        await supabase.from("comm_conversations").update({ last_message: newMsg, last_message_at: new Date().toISOString() }).eq("id", selectedConv);
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["comm_wa_msgs"] }); qc.invalidateQueries({ queryKey: ["comm_conversations"] }); setNewMsg(""); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const startConversation = useMutation({
    mutationFn: async () => {
      const { data: conv, error } = await supabase.from("comm_conversations").insert({ contact_id: composeForm.contact_id, channel: "whatsapp", last_message: composeForm.message, last_message_at: new Date().toISOString(), user_id: user!.id }).select().single();
      if (error) throw error;
      if (composeForm.message) {
        await supabase.from("comm_whatsapp_messages").insert({ contact_id: composeForm.contact_id, direction: "outbound", content: composeForm.message, status: "sent", user_id: user!.id });
      }
      return conv;
    },
    onSuccess: (conv) => { qc.invalidateQueries({ queryKey: ["comm_conversations"] }); setSelectedConv(conv.id); setComposeOpen(false); setComposeForm({ contact_id: "", message: "" }); toast({ title: "Conversation started" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filtered = (conversations ?? []).filter(c => { const q = search.toLowerCase(); return !q || (c.comm_contacts?.name || "").toLowerCase().includes(q); });
  const selectedConvData = (conversations ?? []).find(c => c.id === selectedConv);

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div><h1 className="text-2xl font-bold flex items-center gap-2"><MessageSquare className="w-6 h-6 text-primary" /> WhatsApp Chats</h1></div>
          <Dialog open={composeOpen} onOpenChange={v => { setComposeOpen(v); if (!v) setComposeForm({ contact_id: "", message: "" }); }}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />New Chat</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Start WhatsApp Chat</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Contact *</Label><Select value={composeForm.contact_id} onValueChange={v => setComposeForm({ ...composeForm, contact_id: v })}><SelectTrigger><SelectValue placeholder="Select contact" /></SelectTrigger><SelectContent>{(contacts ?? []).map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.whatsapp_number})</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Message</Label><Textarea value={composeForm.message} onChange={e => setComposeForm({ ...composeForm, message: e.target.value })} rows={3} placeholder="Type your first message..." /></div>
                <Button onClick={() => startConversation.mutate()} disabled={!composeForm.contact_id} className="w-full">Start Chat</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-220px)]">
          {/* Conversation list */}
          <Card className="md:col-span-1 overflow-hidden">
            <div className="p-3 border-b"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" /></div></div>
            <ScrollArea className="h-[calc(100%-60px)]">
              {isLoading ? <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div> : filtered.length > 0 ? filtered.map(c => (
                <div key={c.id} className={`p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${selectedConv === c.id ? "bg-muted" : ""}`} onClick={() => setSelectedConv(c.id)}>
                  <div className="flex justify-between items-start">
                    <div className="font-medium text-sm">{c.comm_contacts?.name || "Unknown"}</div>
                    {(c.unread_count ?? 0) > 0 && <Badge className="text-xs">{c.unread_count}</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground truncate mt-0.5">{c.last_message || "No messages"}</div>
                  {c.last_message_at && <div className="text-xs text-muted-foreground mt-0.5">{format(new Date(c.last_message_at), "MMM dd, HH:mm")}</div>}
                  <div className="flex gap-1 mt-1">
                    {c.is_bot_active && <Badge variant="secondary" className="text-[10px] gap-0.5"><Bot className="w-2.5 h-2.5" />Bot</Badge>}
                    <Badge variant="outline" className="text-[10px] capitalize">{c.status}</Badge>
                  </div>
                </div>
              )) : <div className="py-8 text-center text-muted-foreground text-sm">No conversations</div>}
            </ScrollArea>
          </Card>

          {/* Chat area */}
          <Card className="md:col-span-2 flex flex-col overflow-hidden">
            {selectedConvData ? (
              <>
                <div className="p-3 border-b flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><User className="w-4 h-4 text-primary" /></div>
                  <div><div className="font-medium text-sm">{selectedConvData.comm_contacts?.name}</div><div className="text-xs text-muted-foreground">{selectedConvData.comm_contacts?.whatsapp_number}</div></div>
                  <div className="ml-auto"><Badge variant={selectedConvData.is_bot_active ? "secondary" : "outline"} className="gap-1"><Bot className="w-3 h-3" />{selectedConvData.is_bot_active ? "Bot Active" : "Bot Off"}</Badge></div>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {(messages ?? []).map(m => (
                      <div key={m.id} className={`flex ${m.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${m.direction === "outbound" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                          {m.ai_generated && <div className="text-[10px] opacity-70 mb-0.5 flex items-center gap-0.5"><Bot className="w-2.5 h-2.5" />AI</div>}
                          <div>{m.content}</div>
                          <div className={`text-[10px] mt-1 ${m.direction === "outbound" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{format(new Date(m.created_at), "HH:mm")}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="p-3 border-t flex gap-2">
                  <Input value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Type a message..." onKeyDown={e => { if (e.key === "Enter" && newMsg.trim()) sendMessage.mutate(); }} className="flex-1" />
                  <Button onClick={() => sendMessage.mutate()} disabled={!newMsg.trim() || sendMessage.isPending}><Send className="w-4 h-4" /></Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center"><div className="text-center"><MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" /><h3 className="font-medium">Select a conversation</h3><p className="text-sm text-muted-foreground">Choose a chat from the left panel</p></div></div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
