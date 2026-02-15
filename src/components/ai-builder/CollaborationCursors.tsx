import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CursorPosition {
  x: number;
  y: number;
  userId: string;
  displayName: string;
  color: string;
}

const CURSOR_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

interface CollaborationCursorsProps {
  projectId?: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
  enabled?: boolean;
}

function throttle<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let last = 0;
  return ((...args: any[]) => {
    const now = Date.now();
    if (now - last >= ms) {
      last = now;
      fn(...args);
    }
  }) as T;
}

export function CollaborationCursors({ projectId, containerRef, enabled = true }: CollaborationCursorsProps) {
  const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map());
  const [userId, setUserId] = useState<string | null>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!enabled || !projectId) return;
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, [enabled, projectId]);

  useEffect(() => {
    if (!enabled || !userId || !projectId) return;

    const colorIndex = userId.charCodeAt(0) % CURSOR_COLORS.length;
    const myColor = CURSOR_COLORS[colorIndex];

    const channel = supabase.channel(`builder-cursors-${projectId}`, {
      config: { presence: { key: userId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const newCursors = new Map<string, CursorPosition>();
        Object.entries(state).forEach(([key, presences]: [string, any[]]) => {
          if (key !== userId && presences.length > 0) {
            const p = presences[0];
            newCursors.set(key, {
              x: p.x || 0,
              y: p.y || 0,
              userId: key,
              displayName: p.displayName || "User",
              color: p.color || CURSOR_COLORS[key.charCodeAt(0) % CURSOR_COLORS.length],
            });
          }
        });
        setCursors(newCursors);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ x: 0, y: 0, displayName: "Builder", color: myColor });
        }
      });

    channelRef.current = channel;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      channel.track({ x, y, displayName: "Builder", color: myColor });
    };

    const throttledMove = throttle(handleMouseMove, 50);
    const el = containerRef.current;
    el?.addEventListener("mousemove", throttledMove);

    return () => {
      el?.removeEventListener("mousemove", throttledMove);
      supabase.removeChannel(channel);
    };
  }, [enabled, userId, projectId, containerRef]);

  if (!enabled || !projectId || cursors.size === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from(cursors.values()).map((cursor) => (
        <div
          key={cursor.userId}
          className="absolute transition-all duration-100 ease-out"
          style={{ left: `${cursor.x}%`, top: `${cursor.y}%` }}
        >
          <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
            <path d="M0 0L16 12H6L3 20L0 0Z" fill={cursor.color} stroke="white" strokeWidth="1" />
          </svg>
          <span
            className="absolute left-4 top-3 px-1.5 py-0.5 rounded text-[10px] font-medium text-white whitespace-nowrap shadow-sm"
            style={{ backgroundColor: cursor.color }}
          >
            {cursor.displayName}
          </span>
        </div>
      ))}
    </div>
  );
}
