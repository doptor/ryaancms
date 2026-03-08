import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Phone, Plus, Trash2, ArrowDown, GitBranch, MessageSquare, Loader2, Save } from "lucide-react";

interface IVRNode {
  id: string;
  type: "greeting" | "menu" | "transfer" | "voicemail" | "ai_response" | "hangup";
  label: string;
  message: string;
  options?: { digit: string; label: string; next_node_id: string }[];
  transfer_to?: string;
  ai_prompt?: string;
}

interface IVRFlow {
  id: string;
  name: string;
  nodes: IVRNode[];
}

const NODE_TYPES = [
  { value: "greeting", label: "Greeting", icon: "👋" },
  { value: "menu", label: "IVR Menu", icon: "📋" },
  { value: "transfer", label: "Transfer", icon: "↗️" },
  { value: "voicemail", label: "Voicemail", icon: "📧" },
  { value: "ai_response", label: "AI Response", icon: "🤖" },
  { value: "hangup", label: "Hang Up", icon: "📴" },
];

export default function CommIVRPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedScript, setSelectedScript] = useState<string | null>(null);
  const [nodes, setNodes] = useState<IVRNode[]>([]);
  const [addNodeOpen, setAddNodeOpen] = useState(false);
  const [newNode, setNewNode] = useState<Partial<IVRNode>>({ type: "greeting", label: "", message: "" });

  const { data: scripts, isLoading } = useQuery({
    queryKey: ["comm_ivr_scripts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comm_scripts")
        .select("*")
        .eq("type", "ivr")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const loadScript = (scriptId: string) => {
    const script = (scripts ?? []).find(s => s.id === scriptId);
    if (script) {
      setSelectedScript(scriptId);
      setNodes((script.steps as any as IVRNode[]) || []);
    }
  };

  const createScript = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase.from("comm_scripts").insert({
        name,
        type: "ivr",
        user_id: user!.id,
        steps: [],
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["comm_ivr_scripts"] });
      setSelectedScript(data.id);
      setNodes([]);
      toast({ title: "IVR flow created" });
    },
  });

  const saveFlow = useMutation({
    mutationFn: async () => {
      if (!selectedScript) throw new Error("No script selected");
      const { error } = await supabase.from("comm_scripts")
        .update({ steps: nodes as any })
        .eq("id", selectedScript);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comm_ivr_scripts"] });
      toast({ title: "IVR flow saved" });
    },
  });

  const addNode = () => {
    const node: IVRNode = {
      id: crypto.randomUUID(),
      type: newNode.type as IVRNode["type"],
      label: newNode.label || newNode.type || "Node",
      message: newNode.message || "",
      options: newNode.type === "menu" ? [{ digit: "1", label: "Option 1", next_node_id: "" }] : undefined,
      transfer_to: newNode.transfer_to,
      ai_prompt: newNode.ai_prompt,
    };
    setNodes([...nodes, node]);
    setAddNodeOpen(false);
    setNewNode({ type: "greeting", label: "", message: "" });
  };

  const removeNode = (id: string) => setNodes(nodes.filter(n => n.id !== id));

  const updateNode = (id: string, updates: Partial<IVRNode>) => {
    setNodes(nodes.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  const addMenuOption = (nodeId: string) => {
    setNodes(nodes.map(n => {
      if (n.id === nodeId && n.options) {
        return { ...n, options: [...n.options, { digit: String(n.options.length + 1), label: "", next_node_id: "" }] };
      }
      return n;
    }));
  };

  const removeMenuOption = (nodeId: string, index: number) => {
    setNodes(nodes.map(n => {
      if (n.id === nodeId && n.options) {
        return { ...n, options: n.options.filter((_, i) => i !== index) };
      }
      return n;
    }));
  };

  const generateTwiML = () => {
    if (nodes.length === 0) return "";
    let twiml = "<Response>";
    for (const node of nodes) {
      switch (node.type) {
        case "greeting":
        case "ai_response":
          twiml += `\n  <Say voice="alice">${node.message}</Say>`;
          break;
        case "menu":
          twiml += `\n  <Gather numDigits="1" action="/handle-menu" method="POST">`;
          twiml += `\n    <Say voice="alice">${node.message}</Say>`;
          twiml += `\n  </Gather>`;
          break;
        case "transfer":
          twiml += `\n  <Dial>${node.transfer_to || ""}</Dial>`;
          break;
        case "voicemail":
          twiml += `\n  <Say voice="alice">${node.message}</Say>`;
          twiml += `\n  <Record maxLength="120" action="/handle-voicemail" />`;
          break;
        case "hangup":
          twiml += `\n  <Say voice="alice">${node.message || "Thank you. Goodbye."}</Say>`;
          twiml += `\n  <Hangup />`;
          break;
      }
    }
    twiml += "\n</Response>";
    return twiml;
  };

  if (isLoading) return <DashboardLayout><div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <GitBranch className="w-6 h-6 text-primary" /> IVR Builder
            </h1>
            <p className="text-muted-foreground">Build interactive voice response flows</p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedScript || ""} onValueChange={loadScript}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Select IVR flow" /></SelectTrigger>
              <SelectContent>
                {(scripts ?? []).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => {
              const name = prompt("IVR Flow name:");
              if (name) createScript.mutate(name);
            }}>
              <Plus className="w-4 h-4 mr-2" />New Flow
            </Button>
            {selectedScript && (
              <Button onClick={() => saveFlow.mutate()} disabled={saveFlow.isPending}>
                <Save className="w-4 h-4 mr-2" />Save
              </Button>
            )}
          </div>
        </div>

        {!selectedScript ? (
          <Card>
            <CardContent className="py-16 text-center">
              <GitBranch className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-medium">No IVR Flow Selected</h3>
              <p className="text-sm text-muted-foreground mb-4">Select an existing flow or create a new one</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              {nodes.map((node, i) => (
                <div key={node.id}>
                  <Card className="border-l-4 border-l-primary">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <span>{NODE_TYPES.find(t => t.value === node.type)?.icon}</span>
                          <Input
                            value={node.label}
                            onChange={e => updateNode(node.id, { label: e.target.value })}
                            className="h-7 text-sm font-medium border-none p-0 shadow-none"
                          />
                        </CardTitle>
                        <div className="flex gap-1">
                          <Badge variant="outline" className="text-[10px] capitalize">{node.type}</Badge>
                          <Button size="sm" variant="ghost" onClick={() => removeNode(node.id)}>
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <Label className="text-xs">Message / Script</Label>
                        <Textarea
                          value={node.message}
                          onChange={e => updateNode(node.id, { message: e.target.value })}
                          rows={2}
                          className="text-sm"
                          placeholder={node.type === "menu" ? "Press 1 for Sales, Press 2 for Support..." : "Enter message..."}
                        />
                      </div>

                      {node.type === "menu" && (
                        <div className="space-y-2">
                          <Label className="text-xs">Menu Options</Label>
                          {(node.options || []).map((opt, oi) => (
                            <div key={oi} className="flex gap-2 items-center">
                              <Input value={opt.digit} onChange={e => {
                                const options = [...(node.options || [])];
                                options[oi] = { ...options[oi], digit: e.target.value };
                                updateNode(node.id, { options });
                              }} className="w-12 h-7 text-xs text-center" />
                              <Input value={opt.label} onChange={e => {
                                const options = [...(node.options || [])];
                                options[oi] = { ...options[oi], label: e.target.value };
                                updateNode(node.id, { options });
                              }} className="flex-1 h-7 text-xs" placeholder="Option label" />
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => removeMenuOption(node.id, oi)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                          <Button size="sm" variant="outline" onClick={() => addMenuOption(node.id)} className="h-7 text-xs">
                            <Plus className="w-3 h-3 mr-1" />Add Option
                          </Button>
                        </div>
                      )}

                      {node.type === "transfer" && (
                        <div>
                          <Label className="text-xs">Transfer To (Phone/Extension)</Label>
                          <Input
                            value={node.transfer_to || ""}
                            onChange={e => updateNode(node.id, { transfer_to: e.target.value })}
                            placeholder="+1234567890"
                            className="h-7 text-sm"
                          />
                        </div>
                      )}

                      {node.type === "ai_response" && (
                        <div>
                          <Label className="text-xs">AI Prompt Context</Label>
                          <Textarea
                            value={node.ai_prompt || ""}
                            onChange={e => updateNode(node.id, { ai_prompt: e.target.value })}
                            rows={2}
                            className="text-sm"
                            placeholder="You are a helpful support agent..."
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  {i < nodes.length - 1 && (
                    <div className="flex justify-center py-1">
                      <ArrowDown className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}

              <Dialog open={addNodeOpen} onOpenChange={setAddNodeOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full border-dashed border-2">
                    <Plus className="w-4 h-4 mr-2" />Add Node
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add IVR Node</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label>Node Type</Label>
                      <Select value={newNode.type} onValueChange={v => setNewNode({ ...newNode, type: v as IVRNode["type"] })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {NODE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.icon} {t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Label</Label>
                      <Input value={newNode.label || ""} onChange={e => setNewNode({ ...newNode, label: e.target.value })} placeholder="Node name" />
                    </div>
                    <div>
                      <Label>Message</Label>
                      <Textarea value={newNode.message || ""} onChange={e => setNewNode({ ...newNode, message: e.target.value })} rows={2} />
                    </div>
                    <Button onClick={addNode} className="w-full">Add Node</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* TwiML Preview */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Generated TwiML</CardTitle>
                  <CardDescription className="text-xs">Auto-generated Twilio markup</CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-96 whitespace-pre-wrap">
                    {generateTwiML() || "Add nodes to generate TwiML"}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
