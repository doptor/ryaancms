import { useState, useMemo, useCallback } from "react";
import { icons } from "lucide-react";
import { Search, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const ICON_NAMES = Object.keys(icons);
const PAGE_SIZE = 80;

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
}

export default function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return ICON_NAMES.filter(name => name.toLowerCase().includes(q));
  }, [search]);

  const visible = filtered.slice(0, visibleCount);

  const handleSelect = useCallback((name: string) => {
    onChange(name);
    setOpen(false);
    setSearch("");
    setVisibleCount(PAGE_SIZE);
  }, [onChange]);

  const handleClear = useCallback(() => {
    onChange("");
  }, [onChange]);

  const SelectedIcon = value && (icons as Record<string, any>)[value] ? (icons as Record<string, any>)[value] : null;

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1 justify-start gap-2 h-10"
          onClick={() => setOpen(true)}
        >
          {SelectedIcon ? (
            <>
              <SelectedIcon className="w-4 h-4 shrink-0" />
              <span className="truncate">{value}</span>
            </>
          ) : (
            <span className="text-muted-foreground">Select icon...</span>
          )}
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={handleClear}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setSearch(""); setVisibleCount(PAGE_SIZE); } }}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Select Icon</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search icons..."
              value={search}
              onChange={e => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }}
              className="pl-9"
              autoFocus
            />
          </div>
          <p className="text-xs text-muted-foreground">{filtered.length} icons found</p>
          <ScrollArea className="flex-1 min-h-0 max-h-[50vh]">
            <div className="grid grid-cols-8 gap-1 p-1">
              {visible.map(name => {
                const Icon = (icons as Record<string, any>)[name];
                if (!Icon) return null;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => handleSelect(name)}
                    title={name}
                    className={cn(
                      "flex items-center justify-center p-2 rounded-md hover:bg-accent transition-colors",
                      value === name && "bg-primary/10 ring-1 ring-primary"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                );
              })}
            </div>
            {visibleCount < filtered.length && (
              <div className="flex justify-center py-3">
                <Button variant="outline" size="sm" onClick={() => setVisibleCount(c => c + PAGE_SIZE)}>
                  Load more ({filtered.length - visibleCount} remaining)
                </Button>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
