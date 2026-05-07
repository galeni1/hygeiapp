import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn, normalizeGreekText } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface MultiSelectFilterProps {
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  className?: string;
  width?: string;
}

export const MultiSelectFilter = ({
  options,
  selected,
  onChange,
  placeholder,
  className,
  width = "w-[180px]",
}: MultiSelectFilterProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = normalizeGreekText(query);
    return options.filter((o) => normalizeGreekText(o).includes(q));
  }, [options, query]);

  const toggle = (val: string) => {
    if (selected.includes(val)) onChange(selected.filter((s) => s !== val));
    else onChange([...selected, val]);
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const label =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? selected[0]
        : `${selected.length} επιλεγμένα`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-9 justify-between bg-card text-sm font-normal",
            width,
            selected.length === 0 && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">{label}</span>
          <span className="flex items-center gap-1 shrink-0 ml-2">
            {selected.length > 0 && (
              <span
                role="button"
                tabIndex={0}
                onClick={clear}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") clear(e as unknown as React.MouseEvent); }}
                className="hover:bg-muted rounded p-0.5"
                aria-label="Καθαρισμός"
              >
                <X className="h-3.5 w-3.5 opacity-60" />
              </span>
            )}
            <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0 bg-popover z-50" align="start">
        <div className="p-2 border-b border-border">
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Αναζήτηση..."
            className="h-8 text-sm"
          />
        </div>
        {selected.length > 0 && (
          <div className="px-2 pt-2 flex flex-wrap gap-1">
            {selected.map((s) => (
              <Badge
                key={s}
                variant="secondary"
                className="text-[10px] gap-1 cursor-pointer"
                onClick={() => toggle(s)}
              >
                {s}
                <X className="h-3 w-3" />
              </Badge>
            ))}
          </div>
        )}
        <div className="max-h-64 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-4">
              Δεν βρέθηκαν επιλογές
            </div>
          ) : (
            filtered.map((opt) => {
              const isSel = selected.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggle(opt)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left hover:bg-muted transition-colors",
                    isSel && "bg-muted/60",
                  )}
                >
                  <span
                    className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                      isSel ? "bg-primary border-primary text-primary-foreground" : "border-border",
                    )}
                  >
                    {isSel && <Check className="w-3 h-3" />}
                  </span>
                  <span className="truncate">{opt}</span>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
