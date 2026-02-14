import { WifiOff, RefreshCw, CloudOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface OfflineIndicatorProps {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
}

export function OfflineIndicator({ isOnline, isSyncing, pendingCount }: OfflineIndicatorProps) {
  if (isOnline && pendingCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2">
      {!isOnline && (
        <Badge variant="destructive" className="flex items-center gap-1.5 py-1.5 px-3 shadow-lg">
          <WifiOff className="w-3.5 h-3.5" />
          Offline
        </Badge>
      )}
      {isSyncing && (
        <Badge variant="secondary" className="flex items-center gap-1.5 py-1.5 px-3 shadow-lg">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          Syncing…
        </Badge>
      )}
      {isOnline && pendingCount > 0 && !isSyncing && (
        <Badge variant="outline" className="flex items-center gap-1.5 py-1.5 px-3 shadow-lg border-primary/30">
          <CloudOff className="w-3.5 h-3.5" />
          {pendingCount} pending
        </Badge>
      )}
    </div>
  );
}
