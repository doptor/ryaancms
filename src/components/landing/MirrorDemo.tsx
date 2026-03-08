import { useState, useRef, useCallback, forwardRef } from "react";
import { Monitor, Tablet, Smartphone, Move, MousePointer2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

type DeviceMode = "desktop" | "tablet" | "mobile";

interface DemoBlock {
  id: string;
  type: string;
  label: string;
}

const initialBlocks: DemoBlock[] = [
  { id: "hero", type: "hero", label: "Hero Section" },
  { id: "features", type: "features", label: "Feature Grid" },
  { id: "cta", type: "cta", label: "Call to Action" },
  { id: "testimonials", type: "testimonials", label: "Testimonials" },
  { id: "footer", type: "footer", label: "Footer" },
];

const deviceWidths: Record<DeviceMode, string> = {
  desktop: "w-full",
  tablet: "w-[70%]",
  mobile: "w-[40%]",
};

// Simulated multi-cursor positions
const cursors = [
  { name: "Alex", color: "hsl(var(--primary))", top: "18%", left: "62%" },
  { name: "Sara", color: "hsl(var(--chart-2))", top: "55%", left: "30%" },
];

const MirrorDemo = forwardRef<HTMLDivElement>(function MirrorDemo(_props, ref) {
  const [blocks, setBlocks] = useState<DemoBlock[]>(initialBlocks);
  const [device, setDevice] = useState<DeviceMode>("desktop");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setOverIndex(index);
  }, []);

  const handleDrop = useCallback((index: number) => {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    const updated = [...blocks];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(index, 0, moved);
    setBlocks(updated);
    setDragIndex(null);
    setOverIndex(null);
  }, [dragIndex, blocks]);

  const blockStyles: Record<string, string> = {
    hero: "h-16 bg-gradient-to-r from-primary/20 to-primary/5",
    features: "h-12 bg-accent/40",
    cta: "h-10 bg-primary/10",
    testimonials: "h-14 bg-accent/30",
    footer: "h-8 bg-muted/50",
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <Move className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground">Visual Builder</span>
        </div>
        <div className="flex items-center gap-1">
          {(["desktop", "tablet", "mobile"] as DeviceMode[]).map((d) => {
            const Icon = d === "desktop" ? Monitor : d === "tablet" ? Tablet : Smartphone;
            return (
              <Button
                key={d}
                variant={device === d ? "default" : "ghost"}
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setDevice(d)}
              >
                <Icon className="w-3.5 h-3.5" />
              </Button>
            );
          })}
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">3 online</span>
        </div>
      </div>

      {/* Canvas */}
      <div className="p-4 flex justify-center bg-muted/20 min-h-[280px] relative">
        <div className={`${deviceWidths[device]} transition-all duration-300 rounded-lg border border-border bg-card p-3 space-y-2 relative`}>
          {blocks.map((block, i) => (
            <div
              key={block.id}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={() => handleDrop(i)}
              onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
              onClick={() => setSelectedBlock(block.id)}
              className={`
                rounded-md border transition-all duration-200 cursor-grab active:cursor-grabbing
                flex items-center justify-between px-3
                ${blockStyles[block.type]}
                ${overIndex === i && dragIndex !== i ? "border-primary border-dashed scale-[1.02]" : "border-border/50"}
                ${dragIndex === i ? "opacity-40" : "opacity-100"}
                ${selectedBlock === block.id ? "ring-2 ring-primary/50 border-primary/40" : "hover:border-primary/30"}
              `}
            >
              <span className="text-[10px] sm:text-xs font-medium text-muted-foreground">{block.label}</span>
              <Move className="w-3 h-3 text-muted-foreground/50" />
            </div>
          ))}

          {/* Simulated cursors */}
          {cursors.map((c) => (
            <div
              key={c.name}
              className="absolute pointer-events-none animate-pulse"
              style={{ top: c.top, left: c.left }}
            >
              <MousePointer2 className="w-4 h-4" style={{ color: c.color }} />
              <span
                className="text-[9px] font-medium px-1.5 py-0.5 rounded-full ml-2 -mt-1 inline-block"
                style={{ backgroundColor: c.color, color: "hsl(var(--card))" }}
              >
                {c.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default MirrorDemo;
