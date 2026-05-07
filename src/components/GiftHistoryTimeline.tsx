import { useGiftHistory, GiftHistoryAction, GiftHistoryEntry } from "@/hooks/useGiftHistory";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, RotateCcw, X, History } from "lucide-react";

interface Props {
  giftId: string;
}

const FIELD_LABELS: Record<string, string> = {
  source: "Πηγή",
  number: "Αριθμός",
  village: "Χωριό",
  guest_type: "Τύπος",
  surname: "Επώνυμο",
  first_name: "Όνομα",
  father_name: "Πατρώνυμο",
  nickname: "Παρατσούκλι",
  responsible: "Υπεύθυνος",
  gift_amount: "Ποσό",
  details: "Λεπτομέρειες",
};

const ACTION_META: Record<GiftHistoryAction, { label: string; icon: typeof Plus; color: string; bg: string }> = {
  create: { label: "Δημιουργία", icon: Plus, color: "text-success", bg: "bg-success/10 border-success/30" },
  update: { label: "Ενημέρωση", icon: Pencil, color: "text-primary", bg: "bg-primary/10 border-primary/30" },
  delete: { label: "Διαγραφή", icon: Trash2, color: "text-destructive", bg: "bg-destructive/10 border-destructive/30" },
  restore: { label: "Επαναφορά", icon: RotateCcw, color: "text-success", bg: "bg-success/10 border-success/30" },
  permanent_delete: { label: "Οριστική διαγραφή", icon: X, color: "text-destructive", bg: "bg-destructive/15 border-destructive/40" },
};

const formatValue = (key: string, value: unknown): string => {
  if (value === null || value === undefined || value === "") return "—";
  if (key === "gift_amount") {
    const num = Number(value);
    if (Number.isFinite(num)) {
      return new Intl.NumberFormat("el-GR", { style: "currency", currency: "EUR" }).format(num);
    }
  }
  return String(value);
};

const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat("el-GR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

const Entry = ({ entry }: { entry: GiftHistoryEntry }) => {
  const meta = ACTION_META[entry.action];
  const Icon = meta.icon;
  const changedKeys = entry.changes ? Object.keys(entry.changes) : [];

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-7 h-7 rounded-full border flex items-center justify-center ${meta.bg}`}>
          <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
        </div>
        <div className="flex-1 w-px bg-border my-1" />
      </div>
      <div className="flex-1 pb-4 min-w-0">
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <span className={`text-xs font-semibold ${meta.color}`}>{meta.label}</span>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {formatDateTime(entry.created_at)}
          </span>
        </div>

        {entry.action === "create" && (
          <p className="text-xs text-muted-foreground mt-1">Η εγγραφή δημιουργήθηκε.</p>
        )}
        {entry.action === "restore" && (
          <p className="text-xs text-muted-foreground mt-1">Η εγγραφή επαναφέρθηκε από τις διαγραμμένες.</p>
        )}
        {entry.action === "delete" && (
          <p className="text-xs text-muted-foreground mt-1">Η εγγραφή μετακινήθηκε στις διαγραμμένες.</p>
        )}
        {entry.action === "permanent_delete" && (
          <p className="text-xs text-muted-foreground mt-1">Η εγγραφή διαγράφηκε οριστικά.</p>
        )}

        {entry.action === "update" && changedKeys.length > 0 && (
          <div className="mt-2 rounded-md border border-border bg-muted/30 divide-y divide-border">
            {changedKeys.map((key) => {
              const change = entry.changes![key];
              return (
                <div key={key} className="px-2.5 py-1.5 text-xs">
                  <div className="font-medium text-foreground mb-0.5">
                    {FIELD_LABELS[key] || key}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-muted-foreground">
                    <span className="line-through opacity-70 break-all">
                      {formatValue(key, change.old)}
                    </span>
                    <span className="text-muted-foreground/60">→</span>
                    <span className="text-foreground font-medium break-all">
                      {formatValue(key, change.new)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export const GiftHistoryTimeline = ({ giftId }: Props) => {
  const { data: entries = [], isLoading, error } = useGiftHistory(giftId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-md" />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-xs text-destructive">Σφάλμα φόρτωσης ιστορικού: {error.message}</p>;
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <History className="w-6 h-6 mx-auto mb-2 opacity-50" />
        <p className="text-xs">Δεν υπάρχει καταγεγραμμένο ιστορικό για αυτή την εγγραφή.</p>
      </div>
    );
  }

  return (
    <div className="pt-1">
      {entries.map((e) => (
        <Entry key={e.id} entry={e} />
      ))}
    </div>
  );
};
