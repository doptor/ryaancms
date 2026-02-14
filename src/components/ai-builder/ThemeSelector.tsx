import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Palette, Check, ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { THEME_PRESETS, type ThemePreset } from "@/lib/engine/theme-generator";

interface ThemeSelectorProps {
  selectedTheme: string | null;
  onSelect: (themeId: string) => void;
}

export function ThemeSelector({ selectedTheme, onSelect }: ThemeSelectorProps) {
  const [open, setOpen] = useState(false);

  const selected = THEME_PRESETS.find((t) => t.id === selectedTheme);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <Palette className="w-3.5 h-3.5" />
          {selected ? selected.name : "Theme"}
          <ChevronDown className="w-3 h-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <p className="text-xs font-semibold text-foreground px-2 py-1.5">
          Choose Theme Preset
        </p>
        <div className="space-y-0.5">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => {
                onSelect(preset.id);
                setOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left transition-colors",
                selectedTheme === preset.id
                  ? "bg-primary/10 text-primary"
                  : "text-foreground hover:bg-accent"
              )}
            >
              <div
                className="w-5 h-5 rounded-md border border-border shrink-0"
                style={{ backgroundColor: preset.tokens.primary_color }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium">{preset.name}</div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {preset.description}
                </div>
              </div>
              {selectedTheme === preset.id && (
                <Check className="w-3.5 h-3.5 text-primary shrink-0" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
