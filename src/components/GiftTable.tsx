import { useEffect, useRef, useState, useCallback } from "react";
import { WeddingGift } from "@/types/gift";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, ArrowUp, ArrowDown, Check, X, Loader2 } from "lucide-react";
import { usePatchGift } from "@/hooks/useGifts";
import { useIsMobile } from "@/hooks/use-mobile";

export type SortField =
  | "surname"
  | "first_name"
  | "village"
  | "nickname"
  | "responsible"
  | "gift_amount"
  | "source"
  | "details";
export type SortDirection = "asc" | "desc";

interface GiftTableProps {
  gifts: WeddingGift[];
  onRowClick: (gift: WeddingGift) => void;
  selectedIds?: Set<string>;
  onSelect?: (id: string, selected: boolean) => void;
  onSelectAll?: () => void;
  sortField?: SortField;
  sortDirection?: SortDirection;
  onSort?: (field: SortField) => void;
  stickyHeaderTop?: number;
}

type ColKey = "surname" | "first_name" | "village" | "nickname" | "responsible" | "gift_amount" | "source" | "details";

const DEFAULT_WIDTHS: Record<ColKey, number> = {
  surname: 180,
  first_name: 160,
  village: 160,
  nickname: 140,
  responsible: 160,
  gift_amount: 120,
  source: 140,
  details: 260,
};

const MIN_WIDTH = 60;
const STORAGE_KEY = "giftTable.colWidths.v1";

export const GiftTable = ({
  gifts,
  onRowClick,
  selectedIds,
  onSelect,
  onSelectAll,
  sortField,
  sortDirection,
  onSort,
  stickyHeaderTop = 0,
}: GiftTableProps) => {
  const isMobile = useIsMobile();
  const MANUAL_KEY = "giftTable.colManual.v1";
  const [widths, setWidths] = useState<Record<ColKey, number>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...DEFAULT_WIDTHS, ...JSON.parse(raw) };
    } catch {
      // ignore corrupt localStorage
    }
    return DEFAULT_WIDTHS;
  });
  const [manualCols, setManualCols] = useState<Record<ColKey, boolean>>(() => {
    try {
      const raw = localStorage.getItem(MANUAL_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore corrupt localStorage
    }
    return {} as Record<ColKey, boolean>;
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(widths)); } catch { /* quota exceeded */ }
  }, [widths]);
  useEffect(() => {
    try { localStorage.setItem(MANUAL_KEY, JSON.stringify(manualCols)); } catch { /* quota exceeded */ }
  }, [manualCols]);

  const tableWrapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ key: ColKey; startX: number; startW: number } | null>(null);

  const patchGift = usePatchGift();
  const [editingAmountId, setEditingAmountId] = useState<string | null>(null);
  const [amountDraft, setAmountDraft] = useState<string>("");

  const startEditAmount = (gift: WeddingGift) => {
    setEditingAmountId(gift.id);
    setAmountDraft(gift.gift_amount != null ? String(gift.gift_amount) : "");
  };
  const cancelEditAmount = () => {
    setEditingAmountId(null);
    setAmountDraft("");
  };
  const commitEditAmount = async (gift: WeddingGift) => {
    const trimmed = amountDraft.trim().replace(",", ".");
    const newVal = trimmed === "" ? null : Number(trimmed);
    if (newVal !== null && Number.isNaN(newVal)) return;
    if (newVal === (gift.gift_amount ?? null)) {
      cancelEditAmount();
      return;
    }
    try {
      await patchGift.mutateAsync({ id: gift.id, patch: { gift_amount: newVal } });
      cancelEditAmount();
    } catch {
      /* toast handled in hook */
    }
  };

  const onMouseDown = (e: React.MouseEvent, key: ColKey) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startW = widths[key];
    dragRef.current = { key, startX, startW };
    const handleMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const next = Math.max(MIN_WIDTH, startW + dx);
      setWidths((w) => ({ ...w, [key]: next }));
    };
    const handleUp = () => {
      setManualCols((m) => ({ ...m, [key]: true }));
      dragRef.current = null;
      dragRef.current = null;
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  };

  // Auto-fit on double-click: measure widest cell text in that column (resets manual flag)
  const autoFit = useCallback((key: ColKey, markManual = true) => {
    const wrap = tableWrapRef.current;
    if (!wrap) return;
    const cells = wrap.querySelectorAll<HTMLElement>(`[data-col="${key}"]`);
    const headerEl = wrap.querySelector<HTMLElement>(`[data-col-head="${key}"]`);
    if (cells.length === 0 && !headerEl) return;
    const measurer = document.createElement("span");
    const sample = (cells[0] || headerEl) as HTMLElement;
    const cs = window.getComputedStyle(sample);
    measurer.style.font = cs.font;
    measurer.style.fontWeight = cs.fontWeight;
    measurer.style.fontSize = cs.fontSize;
    measurer.style.fontFamily = cs.fontFamily;
    measurer.style.letterSpacing = cs.letterSpacing;
    measurer.style.position = "absolute";
    measurer.style.visibility = "hidden";
    measurer.style.whiteSpace = "nowrap";
    measurer.style.top = "-9999px";
    document.body.appendChild(measurer);
    let max = 0;
    if (headerEl) {
      measurer.textContent = headerEl.innerText || headerEl.textContent || "";
      max = measurer.offsetWidth + 24; // extra for sort icon
    }
    cells.forEach((c) => {
      measurer.textContent = c.innerText || c.textContent || "";
      if (measurer.offsetWidth > max) max = measurer.offsetWidth;
    });
    document.body.removeChild(measurer);
    const padding = 28;
    setWidths((w) => ({ ...w, [key]: Math.max(MIN_WIDTH, Math.ceil(max + padding)) }));
    if (!markManual) {
      setManualCols((m) => {
        if (!m[key]) return m;
        const { [key]: _, ...rest } = m;
        return rest as Record<ColKey, boolean>;
      });
    }
  }, []);

  // Auto-adjust columns whenever data changes, but skip user-resized ones
  useEffect(() => {
    if (isMobile) return;
    const id = requestAnimationFrame(() => {
      (Object.keys(DEFAULT_WIDTHS) as ColKey[]).forEach((k) => {
        if (!manualCols[k]) autoFit(k, false);
      });
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gifts, autoFit]);

  const formatAmount = (amount: number | null) => {
    if (!amount) return "—";
    return new Intl.NumberFormat("el-GR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const allSelected = selectedIds && gifts.length > 0 && gifts.every((g) => selectedIds.has(g.id));
  const someSelected = selectedIds && gifts.some((g) => selectedIds.has(g.id));

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40 shrink-0" />;
    return sortDirection === "asc"
      ? <ArrowUp className="w-3 h-3 ml-1 text-primary shrink-0" />
      : <ArrowDown className="w-3 h-3 ml-1 text-primary shrink-0" />;
  };

  const renderResizeHandle = (colKey: ColKey) => (
    <div
      onMouseDown={(e) => onMouseDown(e, colKey)}
      onDoubleClick={(e) => { e.stopPropagation(); autoFit(colKey, false); }}
      onClick={(e) => e.stopPropagation()}
      title="Σύρετε για αλλαγή πλάτους · Διπλό κλικ για αυτόματη προσαρμογή"
      className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize hover:bg-primary/40 active:bg-primary transition-colors z-10"
    />
  );

  const renderColHeader = (
    field: SortField,
    colKey: ColKey,
    children: React.ReactNode,
    align: "left" | "right" = "left",
    hiddenClass = ""
  ) => (
    <TableHead
      key={colKey}
      data-col-head={colKey}
      style={
        isMobile
          ? { top: stickyHeaderTop }
          : { width: widths[colKey], minWidth: widths[colKey], maxWidth: widths[colKey], top: stickyHeaderTop }
      }
      className={`relative h-9 px-2 md:px-3 text-[10px] md:text-[11px] uppercase tracking-wider font-semibold text-muted-foreground cursor-pointer hover:bg-muted select-none sticky z-10 bg-muted/95 backdrop-blur supports-[backdrop-filter]:bg-muted/80 print:static print:bg-transparent ${hiddenClass}`}
      onClick={() => onSort?.(field)}
    >
      <div className={`flex items-center ${align === "right" ? "justify-end" : ""}`}>
        <span className="truncate">{children}</span>
        {onSort && renderSortIcon(field)}
      </div>
      {!isMobile && renderResizeHandle(colKey)}
    </TableHead>
  );

  return (
    <div className="rounded-md border border-border bg-card shadow-xs">
      <div ref={tableWrapRef} className="w-full">
        <table
          className="w-full caption-bottom text-sm"
          style={
            isMobile
              ? { tableLayout: "fixed", width: "100%" }
              : { tableLayout: "fixed", width: "max-content", minWidth: "100%" }
          }
        >
          <TableHeader>
            <TableRow className="bg-muted/60 hover:bg-muted/60 border-b border-border">
              {onSelect && (
                <TableHead
                  className="w-10 h-9 px-3 sticky z-10 bg-muted/95 backdrop-blur supports-[backdrop-filter]:bg-muted/80 print:static print:bg-transparent"
                  style={{ width: 40, minWidth: 40, top: stickyHeaderTop }}
                >
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={onSelectAll}
                    className={someSelected && !allSelected ? "data-[state=checked]:bg-primary/50" : ""}
                  />
                </TableHead>
              )}
              {renderColHeader("surname", "surname", "Επώνυμο")}
              {renderColHeader("first_name", "first_name", "Όνομα")}
              {renderColHeader("village", "village", "Χωριό", "left", "hidden md:table-cell")}
              {renderColHeader("nickname", "nickname", "Παρατσούκλι", "left", "hidden lg:table-cell")}
              {renderColHeader("responsible", "responsible", "Υπεύθυνος", "left", "hidden lg:table-cell")}
              {renderColHeader("gift_amount", "gift_amount", "Ποσό", "right")}
              {renderColHeader("source", "source", "Πηγή", "left", "hidden md:table-cell")}
              {renderColHeader("details", "details", "Λεπτομέρειες", "left", "hidden xl:table-cell")}
            </TableRow>
          </TableHeader>
          <TableBody>
            {gifts.map((gift) => (
              <TableRow
                key={gift.id}
                onClick={() => onRowClick(gift)}
                className={`border-b border-border last:border-0 hover:bg-muted/40 transition-colors cursor-pointer ${
                  selectedIds?.has(gift.id) ? "bg-primary/5" : ""
                }`}
              >
                {onSelect && (
                  <TableCell
                    className="px-3 py-2"
                    style={{ width: 40 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={selectedIds?.has(gift.id)}
                      onCheckedChange={(checked) => onSelect(gift.id, checked === true)}
                    />
                  </TableCell>
                )}
                <TableCell data-col="surname" style={isMobile ? undefined : { width: widths.surname, maxWidth: widths.surname }} className="px-2 md:px-3 py-2 font-medium text-foreground text-[13px] md:text-sm truncate">{gift.surname}</TableCell>
                <TableCell data-col="first_name" style={isMobile ? undefined : { width: widths.first_name, maxWidth: widths.first_name }} className="px-2 md:px-3 py-2 text-foreground text-[13px] md:text-sm truncate">{gift.first_name}</TableCell>
                <TableCell data-col="village" style={{ width: widths.village, maxWidth: widths.village }} className="px-3 py-2 text-muted-foreground text-sm hidden md:table-cell truncate">{gift.village || "—"}</TableCell>
                <TableCell data-col="nickname" style={{ width: widths.nickname, maxWidth: widths.nickname }} className="px-3 py-2 text-muted-foreground text-sm hidden lg:table-cell truncate">{gift.nickname || "—"}</TableCell>
                <TableCell data-col="responsible" style={{ width: widths.responsible, maxWidth: widths.responsible }} className="px-3 py-2 text-muted-foreground text-sm hidden lg:table-cell truncate">{gift.responsible || "—"}</TableCell>
                <TableCell
                  data-col="gift_amount"
                  style={isMobile ? undefined : { width: widths.gift_amount, maxWidth: widths.gift_amount }}
                  className="px-2 md:px-3 py-2 text-right"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (editingAmountId !== gift.id) startEditAmount(gift);
                  }}
                  onDoubleClick={(e) => e.stopPropagation()}
                  title="Κλικ για επεξεργασία ποσού"
                >
                  {editingAmountId === gift.id ? (
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Input
                        autoFocus
                        type="text"
                        inputMode="decimal"
                        value={amountDraft}
                        onChange={(e) => setAmountDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); commitEditAmount(gift); }
                          if (e.key === "Escape") { e.preventDefault(); cancelEditAmount(); }
                        }}
                        className="h-7 text-right font-mono text-sm px-2"
                        disabled={patchGift.isPending}
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-success hover:text-success"
                        onClick={(e) => { e.stopPropagation(); commitEditAmount(gift); }}
                        disabled={patchGift.isPending}
                      >
                        {patchGift.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground"
                        onClick={(e) => { e.stopPropagation(); cancelEditAmount(); }}
                        disabled={patchGift.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : gift.gift_amount ? (
                    <span className="font-mono tabular-nums text-[13px] md:text-sm font-semibold text-success whitespace-nowrap">
                      {formatAmount(gift.gift_amount)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-[13px] md:text-sm">—</span>
                  )}
                </TableCell>
                <TableCell data-col="source" style={{ width: widths.source, maxWidth: widths.source }} className="px-3 py-2 text-muted-foreground text-sm hidden md:table-cell truncate">{gift.source || "—"}</TableCell>
                <TableCell
                  data-col="details"
                  style={{ width: widths.details, maxWidth: widths.details }}
                  className="px-3 py-2 text-muted-foreground text-sm hidden xl:table-cell truncate"
                  title={gift.details || ""}
                >
                  {gift.details || "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </table>
      </div>
    </div>
  );
};
