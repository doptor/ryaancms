import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Settings, Phone, MessageSquare, Bot, Shield, Save, Loader2 } from "lucide-react";

type SettingMap = Record<string, string>;

export default function CommSettingsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [settings, setSettings] = useState<SettingMap>({});

  const { data: rawSettings, isLoading } = useQuery({
    queryKey: ["comm_settings"], queryFn: async () => { const { data, error } = await supabase.from("comm_settings").select("*"); if (error) throw error; return data ?? []; }, enabled: !!user,
  });

  useEffect(() => {
    if (rawSettings) {
      const map: SettingMap = {};
      rawSettings.forEach(s => { map[s.setting_key] = s.setting_value || ""; });
      setSettings(map);
    }
  }, [rawSettings]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const entries = Object.entries(settings);
      for (const [key, value] of entries) {
        const category = key.split("_")[0] || "general";
        const { error } = await supabase.from("comm_settings").upsert({ setting_key: key, setting_value: value, category, user_id: user!.id }, { onConflict: "user_id,setting_key" });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["comm_settings"] }); toast({ title: "Settings saved" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const set = (key: string, value: string) => setSettings(prev => ({ ...prev, [key]: value }));

  if (isLoading) return <DashboardLayout><div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div><h1 className="text-2xl font-bold flex items-center gap-2"><Settings className="w-6 h-6 text-primary" /> Communication Settings</h1><p className="text-muted-foreground">Configure telephony, WhatsApp & AI providers</p></div>
          <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}><Save className="w-4 h-4 mr-2" />Save All</Button>
        </div>

        <Tabs defaultValue="telephony">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="telephony"><Phone className="w-4 h-4 mr-1" />Telephony</TabsTrigger>
            <TabsTrigger value="whatsapp"><MessageSquare className="w-4 h-4 mr-1" />WhatsApp</TabsTrigger>
            <TabsTrigger value="ai"><Bot className="w-4 h-4 mr-1" />AI Voice</TabsTrigger>
            <TabsTrigger value="general"><Shield className="w-4 h-4 mr-1" />General</TabsTrigger>
          </TabsList>

          <TabsContent value="telephony" className="space-y-4">
            <Card><CardHeader><CardTitle className="text-base">Telephony Provider</CardTitle><CardDescription>Configure your voice call provider (Twilio, Vonage, Plivo)</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Provider</Label><Select value={settings.telephony_provider || "twilio"} onValueChange={v => set("telephony_provider", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="twilio">Twilio</SelectItem><SelectItem value="vonage">Vonage</SelectItem><SelectItem value="plivo">Plivo</SelectItem><SelectItem value="sip">Custom SIP</SelectItem></SelectContent></Select></div>
                <div><Label>Account SID / API Key</Label><Input type="password" value={settings.telephony_account_sid || ""} onChange={e => set("telephony_account_sid", e.target.value)} placeholder="Enter account SID..." /></div>
                <div><Label>Auth Token / API Secret</Label><Input type="password" value={settings.telephony_auth_token || ""} onChange={e => set("telephony_auth_token", e.target.value)} placeholder="Enter auth token..." /></div>
                <div><Label>Default From Number</Label><Input value={settings.telephony_from_number || ""} onChange={e => set("telephony_from_number", e.target.value)} placeholder="+1234567890" /></div>
                <div className="flex items-center justify-between"><Label>Enable Call Recording</Label><Switch checked={settings.telephony_recording === "true"} onCheckedChange={v => set("telephony_recording", String(v))} /></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="whatsapp" className="space-y-4">
            <Card><CardHeader><CardTitle className="text-base">WhatsApp Business API</CardTitle><CardDescription>Configure WhatsApp Business API credentials</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>API Provider</Label><Select value={settings.whatsapp_provider || "meta"} onValueChange={v => set("whatsapp_provider", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="meta">Meta (Official)</SelectItem><SelectItem value="twilio">Twilio WhatsApp</SelectItem><SelectItem value="360dialog">360dialog</SelectItem></SelectContent></Select></div>
                <div><Label>Phone Number ID</Label><Input value={settings.whatsapp_phone_id || ""} onChange={e => set("whatsapp_phone_id", e.target.value)} placeholder="Phone number ID" /></div>
                <div><Label>Access Token</Label><Input type="password" value={settings.whatsapp_token || ""} onChange={e => set("whatsapp_token", e.target.value)} placeholder="Access token..." /></div>
                <div><Label>Webhook Verify Token</Label><Input value={settings.whatsapp_verify_token || ""} onChange={e => set("whatsapp_verify_token", e.target.value)} placeholder="Webhook verify token" /></div>
                <div className="flex items-center justify-between"><Label>Enable Chatbot Auto-Response</Label><Switch checked={settings.whatsapp_bot_enabled === "true"} onCheckedChange={v => set("whatsapp_bot_enabled", String(v))} /></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4">
            <Card><CardHeader><CardTitle className="text-base">AI Voice Configuration</CardTitle><CardDescription>Configure AI voice generation and speech recognition</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Voice AI Provider</Label><Select value={settings.ai_voice_provider || "elevenlabs"} onValueChange={v => set("ai_voice_provider", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="elevenlabs">ElevenLabs</SelectItem><SelectItem value="openai">OpenAI TTS</SelectItem><SelectItem value="deepgram">Deepgram</SelectItem></SelectContent></Select></div>
                <div><Label>Speech Recognition Provider</Label><Select value={settings.ai_stt_provider || "whisper"} onValueChange={v => set("ai_stt_provider", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="whisper">OpenAI Whisper</SelectItem><SelectItem value="deepgram">Deepgram</SelectItem><SelectItem value="google">Google Speech</SelectItem></SelectContent></Select></div>
                <div><Label>Default Voice ID</Label><Input value={settings.ai_voice_id || ""} onChange={e => set("ai_voice_id", e.target.value)} placeholder="e.g., EXAVITQu4vr4xnSDxMaL" /></div>
                <div><Label>Default AI Model</Label><Select value={settings.ai_model || "gemini-2.5-flash"} onValueChange={v => set("ai_model", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem><SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem><SelectItem value="gpt-5">GPT-5</SelectItem></SelectContent></Select></div>
                <div><Label>Default Language</Label><Select value={settings.ai_language || "en"} onValueChange={v => set("ai_language", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="bn">বাংলা</SelectItem><SelectItem value="ar">Arabic</SelectItem><SelectItem value="es">Spanish</SelectItem><SelectItem value="hi">Hindi</SelectItem></SelectContent></Select></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="general" className="space-y-4">
            <Card><CardHeader><CardTitle className="text-base">General Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between"><Label>Auto-assign calls to available agents</Label><Switch checked={settings.general_auto_assign === "true"} onCheckedChange={v => set("general_auto_assign", String(v))} /></div>
                <div className="flex items-center justify-between"><Label>Enable AI transcription for all calls</Label><Switch checked={settings.general_auto_transcribe === "true"} onCheckedChange={v => set("general_auto_transcribe", String(v))} /></div>
                <div className="flex items-center justify-between"><Label>Enable real-time notifications</Label><Switch checked={settings.general_notifications === "true"} onCheckedChange={v => set("general_notifications", String(v))} /></div>
                <div><Label>Max concurrent AI calls</Label><Input type="number" value={settings.general_max_ai_calls || "10"} onChange={e => set("general_max_ai_calls", e.target.value)} /></div>
                <div><Label>Call timeout (seconds)</Label><Input type="number" value={settings.general_call_timeout || "30"} onChange={e => set("general_call_timeout", e.target.value)} /></div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
