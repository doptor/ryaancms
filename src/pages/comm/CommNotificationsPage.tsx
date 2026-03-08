import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, BellOff, Phone, MessageSquare, PhoneIncoming, PhoneMissed, X, Volume2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Notification {
  id: string;
  type: "incoming_call" | "new_message" | "missed_call" | "campaign_complete";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: any;
}

export default function CommNotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [desktopEnabled, setDesktopEnabled] = useState(false);

  // Subscribe to realtime conversation updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("comm-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comm_whatsapp_messages",
          filter: `direction=eq.inbound`,
        },
        (payload) => {
          const msg = payload.new as any;
          const notif: Notification = {
            id: msg.id,
            type: "new_message",
            title: "New WhatsApp Message",
            message: msg.content || "[Media]",
            timestamp: msg.created_at,
            read: false,
            data: msg,
          };
          setNotifications(prev => [notif, ...prev]);

          if (soundEnabled) playNotificationSound();
          if (desktopEnabled) showDesktopNotification(notif);
          toast({ title: "📩 New Message", description: msg.content?.substring(0, 50) });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comm_calls",
          filter: `direction=eq.inbound`,
        },
        (payload) => {
          const call = payload.new as any;
          const notif: Notification = {
            id: call.id,
            type: "incoming_call",
            title: "Incoming Call",
            message: `From ${call.from_number || "Unknown"}`,
            timestamp: call.created_at,
            read: false,
            data: call,
          };
          setNotifications(prev => [notif, ...prev]);

          if (soundEnabled) playNotificationSound();
          if (desktopEnabled) showDesktopNotification(notif);
          toast({ title: "📞 Incoming Call", description: `From ${call.from_number}` });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "comm_campaigns",
          filter: `status=eq.completed`,
        },
        (payload) => {
          const camp = payload.new as any;
          const notif: Notification = {
            id: camp.id,
            type: "campaign_complete",
            title: "Campaign Completed",
            message: `${camp.name}: ${camp.successful || 0} successful, ${camp.failed || 0} failed`,
            timestamp: camp.completed_at || new Date().toISOString(),
            read: false,
            data: camp,
          };
          setNotifications(prev => [notif, ...prev]);
          toast({ title: "✅ Campaign Complete", description: camp.name });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, soundEnabled, desktopEnabled]);

  // Load recent notifications from call/message history
  const { data: recentCalls } = useQuery({
    queryKey: ["comm_recent_missed"],
    queryFn: async () => {
      const { data } = await supabase.from("comm_calls")
        .select("id, from_number, status, created_at")
        .in("status", ["no_answer", "failed"])
        .eq("direction", "inbound")
        .order("created_at", { ascending: false })
        .limit(10);
      return data ?? [];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (recentCalls?.length) {
      const missedNotifs: Notification[] = recentCalls.map(c => ({
        id: c.id,
        type: "missed_call" as const,
        title: "Missed Call",
        message: `From ${c.from_number || "Unknown"}`,
        timestamp: c.created_at,
        read: true,
      }));
      setNotifications(prev => {
        const existingIds = new Set(prev.map(n => n.id));
        const newOnes = missedNotifs.filter(n => !existingIds.has(n.id));
        return [...prev, ...newOnes];
      });
    }
  }, [recentCalls]);

  const playNotificationSound = useCallback(() => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      gain.gain.value = 0.1;
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch { /* ignore audio errors */ }
  }, []);

  const showDesktopNotification = useCallback((notif: Notification) => {
    if (Notification.permission === "granted") {
      new Notification(notif.title, { body: notif.message, icon: "/favicon.ico" });
    }
  }, []);

  const requestDesktopPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      setDesktopEnabled(permission === "granted");
    }
  };

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAll = () => setNotifications([]);
  const unreadCount = notifications.filter(n => !n.read).length;

  const typeIcon = (type: string) => {
    switch (type) {
      case "incoming_call": return <PhoneIncoming className="w-4 h-4 text-green-500" />;
      case "new_message": return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case "missed_call": return <PhoneMissed className="w-4 h-4 text-destructive" />;
      default: return <Bell className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="w-6 h-6 text-primary" /> Notifications
              {unreadCount > 0 && <Badge className="ml-2">{unreadCount}</Badge>}
            </h1>
            <p className="text-muted-foreground">Real-time call & message notifications</p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm">Sound</Label>
              <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
            </div>
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm">Desktop</Label>
              <Switch
                checked={desktopEnabled}
                onCheckedChange={v => { if (v) requestDesktopPermission(); else setDesktopEnabled(false); }}
              />
            </div>
            {notifications.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearAll}>Clear All</Button>
            )}
          </div>
        </div>

        <Card>
          <ScrollArea className="h-[calc(100vh-250px)]">
            {notifications.length > 0 ? (
              <div className="divide-y">
                {notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(notif => (
                  <div
                    key={notif.id}
                    className={`p-4 flex items-start gap-3 transition-colors ${!notif.read ? "bg-primary/5" : ""}`}
                    onClick={() => markRead(notif.id)}
                  >
                    <div className="mt-0.5">{typeIcon(notif.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{notif.title}</span>
                        {!notif.read && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{notif.message}</p>
                      <span className="text-xs text-muted-foreground">{format(new Date(notif.timestamp), "MMM dd, HH:mm")}</span>
                    </div>
                    <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); setNotifications(prev => prev.filter(n => n.id !== notif.id)); }}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <BellOff className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-medium">No Notifications</h3>
                <p className="text-sm text-muted-foreground">Incoming calls and messages will appear here in real-time</p>
              </div>
            )}
          </ScrollArea>
        </Card>
      </div>
    </DashboardLayout>
  );
}
