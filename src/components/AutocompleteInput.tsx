import { useState, useRef, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { normalizeGreekText } from "@/lib/utils";

interface AutocompleteInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  required?: boolean;
  className?: string;
  maxItems?: number;
}

/**
 * Free-text input with a suggestion dropdown filtered from `suggestions`.
 * - Case + Greek-accent insensitive matching
 * - User can always type a brand new value (it does NOT force selection)
 * - Keyboard: ArrowDown/Up to navigate, Enter to accept, Esc to close
 */
export const AutocompleteInput = ({
  id,
  value,
  onChange,
  suggestions,
  placeholder,
  required,
  className,
  maxItems = 8,
}: AutocompleteInputProps) => {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = normalizeGreekText(value.trim());
    if (!q) return [];
    const matches = suggestions.filter((s) => {
      const n = normalizeGreekText(s);
      return n.includes(q) && n !== q;
    });
    // Prioritize prefix matches
    matches.sort((a, b) => {
      const na = normalizeGreekText(a);
      const nb = normalizeGreekText(b);
      const pa = na.startsWith(q) ? 0 : 1;
      const pb = nb.startsWith(q) ? 0 : 1;
      if (pa !== pb) return pa - pb;
      return a.localeCompare(b, "el-GR");
    });
    return matches.slice(0, maxItems);
  }, [value, suggestions, maxItems]);

  useEffect(() => {
    setHighlight(0);
  }, [value]);

  // Click outside closes dropdown
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const accept = (val: string) => {
    onChange(val);
    setOpen(false);
  };

  const showList = open && filtered.length > 0;

  return (
    <div ref={wrapRef} className="relative">
      <Input
        id={id}
        value={value}
        required={required}
        placeholder={placeholder}
        autoComplete="off"
        className={cn("bg-background border-border", className)}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!showList) {
            if (e.key === "ArrowDown" && filtered.length > 0) {
              setOpen(true);
              e.preventDefault();
            }
            return;
          }
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((h) => Math.min(h + 1, filtered.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            accept(filtered[highlight]);
          } else if (e.key === "Escape") {
            setOpen(false);
          } else if (e.key === "Tab") {
            // Tab accepts the current highlight if any, but doesn't block tabbing
            accept(filtered[highlight]);
          }
        }}
      />
      {showList && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-md border border-border bg-popover shadow-lg overflow-hidden">
          {filtered.map((s, i) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => {
                // mousedown so we beat the input blur
                e.preventDefault();
                accept(s);
              }}
              onMouseEnter={() => setHighlight(i)}
              className={cn(
                "w-full text-left px-3 py-2 text-sm",
                i === highlight
                  ? "bg-accent text-accent-foreground"
                  : "text-popover-foreground hover:bg-accent/60",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
