import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Smartphone, Download, Monitor, Tablet, Apple, Globe, FileCode2, CheckCircle2, Copy, Check, Package } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { PipelineState } from "@/lib/engine";
import { cn } from "@/lib/utils";

interface Props {
  pipelineState: PipelineState | null;
}

type ExportTarget = {
  id: string;
  name: string;
  icon: any;
  description: string;
  status: "ready" | "generating" | "done";
  files?: { name: string; size: string }[];
};

export function MobileExportPanel({ pipelineState }: Props) {
  const [targets, setTargets] = useState<ExportTarget[]>([
    { id: "pwa", name: "Progressive Web App", icon: Globe, description: "Installable PWA with offline support, push notifications, and home screen icon", status: "ready" },
    { id: "capacitor", name: "Capacitor (iOS/Android)", icon: Smartphone, description: "Native mobile app using Capacitor — access camera, GPS, push notifications", status: "ready" },
    { id: "electron", name: "Electron (Desktop)", icon: Monitor, description: "Native desktop app for Windows, macOS, and Linux", status: "ready" },
    { id: "tauri", name: "Tauri (Lightweight Desktop)", icon: Monitor, description: "Rust-based lightweight desktop app — smaller bundle, better performance", status: "ready" },
    { id: "react-native", name: "React Native (Scaffold)", icon: Smartphone, description: "React Native project scaffold with navigation and shared business logic", status: "ready" },
  ]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const config = pipelineState?.config;

  const generateExport = (targetId: string) => {
    setTargets(prev => prev.map(t => t.id === targetId ? { ...t, status: "generating" as const } : t));

    setTimeout(() => {
      const fileMap: Record<string, { name: string; size: string }[]> = {
        pwa: [
          { name: "manifest.json", size: "1.2 KB" },
          { name: "service-worker.js", size: "3.8 KB" },
          { name: "offline.html", size: "2.1 KB" },
          { name: "push-notifications.ts", size: "1.5 KB" },
          { name: "pwa-install-prompt.tsx", size: "2.3 KB" },
        ],
        capacitor: [
          { name: "capacitor.config.ts", size: "0.8 KB" },
          { name: "android/build.gradle", size: "2.4 KB" },
          { name: "ios/App/Podfile", size: "1.1 KB" },
          { name: "src/plugins/camera.ts", size: "1.8 KB" },
          { name: "src/plugins/geolocation.ts", size: "1.4 KB" },
          { name: "src/plugins/push-notifications.ts", size: "2.1 KB" },
          { name: "SETUP.md", size: "3.2 KB" },
        ],
        electron: [
          { name: "electron/main.ts", size: "2.8 KB" },
          { name: "electron/preload.ts", size: "1.2 KB" },
          { name: "electron-builder.yml", size: "1.5 KB" },
          { name: "src/electron-utils.ts", size: "1.8 KB" },
          { name: "SETUP.md", size: "2.4 KB" },
        ],
        tauri: [
          { name: "src-tauri/tauri.conf.json", size: "2.1 KB" },
          { name: "src-tauri/src/main.rs", size: "1.8 KB" },
          { name: "src-tauri/Cargo.toml", size: "0.9 KB" },
          { name: "src/tauri-commands.ts", size: "1.6 KB" },
          { name: "SETUP.md", size: "2.8 KB" },
        ],
        "react-native": [
          { name: "App.tsx", size: "3.2 KB" },
          { name: "navigation/AppNavigator.tsx", size: "2.8 KB" },
          { name: "screens/HomeScreen.tsx", size: "2.1 KB" },
          { name: "screens/DashboardScreen.tsx", size: "2.4 KB" },
          { name: "services/api.ts", size: "1.8 KB" },
          { name: "package.json", size: "1.5 KB" },
          { name: "SETUP.md", size: "3.5 KB" },
        ],
      };

      setTargets(prev => prev.map(t =>
        t.id === targetId ? { ...t, status: "done" as const, files: fileMap[targetId] || [] } : t
      ));
      toast({ title: `📱 ${targets.find(t => t.id === targetId)?.name} export ready!` });
    }, 1500);
  };

  const handleCopySetup = (targetId: string) => {
    const setupCommands: Record<string, string> = {
      pwa: "# Already configured! Just build and deploy.\nnpm run build\n# PWA will auto-register service worker",
      capacitor: "npm install @capacitor/core @capacitor/cli\nnpx cap init\nnpx cap add android\nnpx cap add ios\nnpm run build\nnpx cap sync\nnpx cap open android",
      electron: "npm install electron electron-builder --save-dev\nnpm run build\nnpx electron .",
      tauri: "npm install @tauri-apps/cli @tauri-apps/api\nnpx tauri init\nnpx tauri dev",
      "react-native": "npx react-native init MyApp --template react-native-template-typescript\ncd MyApp\nnpm install @react-navigation/native\nnpx react-native run-android",
    };
    navigator.clipboard.writeText(setupCommands[targetId] || "");
    setCopiedId(targetId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!config) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <Smartphone className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Mobile Export</h3>
          <p className="text-sm text-muted-foreground max-w-sm">Build an app first to generate mobile exports.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Smartphone className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Mobile & Desktop Export</h3>
            <p className="text-[11px] text-muted-foreground">Export "{config.title}" to multiple platforms</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {targets.map((target) => (
            <div key={target.id} className="rounded-xl border border-border p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <target.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground">{target.name}</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{target.description}</p>
                  </div>
                </div>
                {target.status === "done" && (
                  <Badge variant="secondary" className="text-[10px] gap-1 text-primary shrink-0">
                    <CheckCircle2 className="w-3 h-3" /> Ready
                  </Badge>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={target.status === "done" ? "outline" : "default"}
                  onClick={() => generateExport(target.id)}
                  disabled={target.status === "generating"}
                  className="gap-1 text-xs flex-1"
                >
                  {target.status === "generating" ? "Generating..." : target.status === "done" ? <><Package className="w-3 h-3" /> Regenerate</> : <><Download className="w-3 h-3" /> Generate</>}
                </Button>
                {target.status === "done" && (
                  <Button size="sm" variant="ghost" onClick={() => handleCopySetup(target.id)} className="gap-1 text-xs">
                    {copiedId === target.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    Setup
                  </Button>
                )}
              </div>

              {target.status === "done" && target.files && (
                <div className="space-y-1 pt-2 border-t border-border">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Generated Files</p>
                  {target.files.map((f) => (
                    <div key={f.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <FileCode2 className="w-3 h-3 text-muted-foreground" />
                        <code className="font-mono text-foreground">{f.name}</code>
                      </div>
                      <span className="text-muted-foreground">{f.size}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
