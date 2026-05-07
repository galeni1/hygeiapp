import * as React from "react";
import { cn } from "@/lib/utils";

interface TimeInput24Props {
  value: string; // "HH:mm"
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

/** Always-24h time input. Independent of OS locale (unlike <input type="time">). */
export const TimeInput24 = ({ value, onChange, className, disabled }: TimeInput24Props) => {
  const [h = "00", m = "00"] = (value || "00:00").split(":");

  const update = (hh: string, mm: string) => {
    const H = String(Math.min(23, Math.max(0, parseInt(hh || "0", 10) || 0))).padStart(2, "0");
    const M = String(Math.min(59, Math.max(0, parseInt(mm || "0", 10) || 0))).padStart(2, "0");
    onChange(`${H}:${M}`);
  };

  return (
    <div
      className={cn(
        "flex h-10 w-full items-center rounded-md border border-input bg-background px-3 text-base ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 md:text-sm",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <input
        type="number"
        min={0}
        max={23}
        inputMode="numeric"
        disabled={disabled}
        value={h}
        onChange={(e) => update(e.target.value, m)}
        onBlur={(e) => update(e.target.value, m)}
        className="w-8 bg-transparent text-center outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        aria-label="Ώρα"
      />
      <span className="text-muted-foreground">:</span>
      <input
        type="number"
        min={0}
        max={59}
        inputMode="numeric"
        disabled={disabled}
        value={m}
        onChange={(e) => update(h, e.target.value)}
        onBlur={(e) => update(h, e.target.value)}
        className="w-8 bg-transparent text-center outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        aria-label="Λεπτά"
      />
    </div>
  );
};
