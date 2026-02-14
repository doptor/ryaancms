import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface QueuedMutation {
  id: string;
  table: string;
  type: "insert" | "update" | "delete" | "upsert";
  data: any;
  match?: Record<string, any>;
  timestamp: number;
}

const QUEUE_KEY = "ryaan-offline-queue";

function loadQueue(): QueuedMutation[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedMutation[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(loadQueue().length);

  const syncQueue = useCallback(async () => {
    const queue = loadQueue();
    if (queue.length === 0) return;

    setIsSyncing(true);
    const failed: QueuedMutation[] = [];

    for (const mutation of queue) {
      try {
        let result: any;
        const table = supabase.from(mutation.table as any);
        if (mutation.type === "insert") {
          result = await table.insert(mutation.data);
        } else if (mutation.type === "update") {
          result = await table.update(mutation.data).match(mutation.match || {});
        } else if (mutation.type === "upsert") {
          result = await table.upsert(mutation.data);
        } else if (mutation.type === "delete") {
          result = await table.delete().match(mutation.match || {});
        }
        if (result?.error) throw result.error;
      } catch {
        failed.push(mutation);
      }
    }

    saveQueue(failed);
    setPendingCount(failed.length);
    setIsSyncing(false);

    if (failed.length === 0 && queue.length > 0) {
      toast({ title: "Synced", description: `${queue.length} offline change(s) synced successfully.` });
    } else if (failed.length > 0) {
      toast({ title: "Sync incomplete", description: `${failed.length} change(s) could not be synced.`, variant: "destructive" });
    }
  }, []);

  const queueMutation = useCallback((mutation: Omit<QueuedMutation, "id" | "timestamp">) => {
    const queue = loadQueue();
    queue.push({ ...mutation, id: crypto.randomUUID(), timestamp: Date.now() });
    saveQueue(queue);
    setPendingCount(queue.length);
  }, []);

  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      toast({ title: "Back online", description: "Syncing offline changes…" });
      syncQueue();
    };
    const goOffline = () => {
      setIsOnline(false);
      toast({ title: "You're offline", description: "Changes will be saved locally and synced when you reconnect." });
    };

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    // Attempt sync on mount if online
    if (navigator.onLine) syncQueue();

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [syncQueue]);

  return { isOnline, isSyncing, pendingCount, queueMutation, syncQueue };
}
