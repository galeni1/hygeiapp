import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useGifts, useDeleteGift } from "@/hooks/useGifts";
import { useGivenGifts } from "@/hooks/useGivenGifts";
import { usePersonalEvents } from "@/hooks/usePersonalEvents";
import { StatsCards } from "@/components/StatsCards";
import {
  Loader2,
  BarChart3,
  Users,
  Euro,
  Trophy,
  MapPin,
  UserCheck,
  Gift,
  ListFilter,
  Pencil,
  HandHeart,
  PartyPopper,
  CalendarDays,
  Heart,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WeddingGift } from "@/types/gift";
import { GivenGift } from "@/types/givenGift";
import { GiftForm } from "@/components/GiftForm";
import { GiftDetailsDialog } from "@/components/GiftDetailsDialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { format, parseISO } from "date-fns";
import { el } from "date-fns/locale";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--info))",
  "hsl(var(--brand-wine))",
  "hsl(var(--destructive))",
];

const formatEur = (n: number) =>
  new Intl.NumberFormat("el-GR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

interface DrillState {
  title: string;
  description?: string;
  gifts: WeddingGift[];
}

interface GivenDrillState {
  title: string;
  description?: string;
  gifts: GivenGift[];
}

// Scope options:
//   "received:all"   → όλα τα δώρα από όλες τις εκδηλώσεις μου
//   "received:<id>"  → δώρα από συγκεκριμένη δική μου εκδήλωση
//   "received:none"  → δώρα χωρίς εκδήλωση
//   "given"          → τα δώρα που έχω κάνει εγώ
type Scope = string;

const Stats = () => {
  const [scope, setScope] = useState<Scope>("received:all");

  const { data: events = [] } = usePersonalEvents();
  const { data: allReceived = [], isLoading: loadingReceived } = useGifts();
  const { data: allGiven = [], isLoading: loadingGiven } = useGivenGifts();
  const deleteGift = useDeleteGift();

  const isGivenMode = scope === "given";

  // Filter received gifts by scope
  const receivedFiltered = useMemo<WeddingGift[]>(() => {
    if (isGivenMode) return [];
    const active = allReceived.filter((g) => !g.deleted_at);
    if (scope === "received:all") return active;
    if (scope === "received:none") return active.filter((g) => !g.event_id);
    if (scope.startsWith("received:")) {
      const id = scope.slice("received:".length);
      return active.filter((g) => g.event_id === id);
    }
    return active;
  }, [allReceived, scope, isGivenMode]);

  const givenFiltered = useMemo<GivenGift[]>(
    () => allGiven.filter((g) => !g.deleted_at),
    [allGiven]
  );

  const isLoading = loadingReceived || loadingGiven;

  return (
    <AppShell>
      <div className="px-3 sm:px-6 py-4 sm:py-6 max-w-[1600px] mx-auto space-y-4">
        {/* Header + scope selector */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">Στατιστικά</h1>
          </div>

          <div className="sm:ml-auto flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-muted-foreground hidden sm:inline">Προβολή:</span>
            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger className="h-9 w-full sm:w-[320px] bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-50 bg-popover max-h-[60vh]">
                <SelectGroup>
                  <SelectLabel className="flex items-center gap-1.5">
                    <PartyPopper className="w-3.5 h-3.5 text-primary" />
                    Εκδηλώσεις μου (δώρα που μου έκαναν)
                  </SelectLabel>
                  <SelectItem value="received:all">
                    Όλες οι εκδηλώσεις μου
                  </SelectItem>
                  {events.map((ev) => (
                    <SelectItem key={ev.id} value={`received:${ev.id}`}>
                      {ev.name}
                      {ev.event_date ? ` · ${format(parseISO(ev.event_date), "d MMM yyyy", { locale: el })}` : ""}
                    </SelectItem>
                  ))}
                  <SelectItem value="received:none">— Χωρίς εκδήλωση —</SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel className="flex items-center gap-1.5 mt-1">
                    <HandHeart className="w-3.5 h-3.5 text-primary" />
                    Τα δώρα μου (όσα έχω κάνει εγώ)
                  </SelectLabel>
                  <SelectItem value="given">Όλα τα δώρα μου</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-[40vh]">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : isGivenMode ? (
          <GivenStats gifts={givenFiltered} />
        ) : (
          <ReceivedStats
            gifts={receivedFiltered}
            scopeLabel={
              scope === "received:all"
                ? "Όλες οι εκδηλώσεις μου"
                : scope === "received:none"
                  ? "Χωρίς εκδήλωση"
                  : events.find((e) => `received:${e.id}` === scope)?.name || ""
            }
            onDeleteGift={(id) => deleteGift.mutate(id)}
          />
        )}
      </div>
    </AppShell>
  );
};

/* ---------------------------------------------------------------- */
/* Received gifts (wedding_gifts) — stats panel                      */
/* ---------------------------------------------------------------- */

const ReceivedStats = ({
  gifts,
  scopeLabel,
  onDeleteGift,
}: {
  gifts: WeddingGift[];
  scopeLabel: string;
  onDeleteGift: (id: string) => void;
}) => {
  const [drill, setDrill] = useState<DrillState | null>(null);
  const [detailsGift, setDetailsGift] = useState<WeddingGift | null>(null);
  const [editingGift, setEditingGift] = useState<WeddingGift | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const liveDrill = useMemo(() => {
    if (!drill) return null;
    const ids = new Set(drill.gifts.map((g) => g.id));
    const refreshed = gifts.filter((g) => ids.has(g.id));
    return { ...drill, gifts: refreshed.length > 0 ? refreshed : drill.gifts };
  }, [drill, gifts]);

  const liveDetails = detailsGift ? gifts.find((g) => g.id === detailsGift.id) || detailsGift : null;

  const analytics = useMemo(() => {
    const withAmount = gifts.filter((g) => g.gift_amount && g.gift_amount > 0);
    const total = gifts.reduce((s, g) => s + (g.gift_amount || 0), 0);

    const groupBy = (key: keyof WeddingGift) => {
      const map = new Map<string, { count: number; sum: number }>();
      gifts.forEach((g) => {
        const v = (g[key] as string | null)?.toString().trim() || "—";
        const cur = map.get(v) || { count: 0, sum: 0 };
        cur.count += 1;
        cur.sum += g.gift_amount || 0;
        map.set(v, cur);
      });
      return Array.from(map.entries())
        .map(([name, v]) => ({ name, count: v.count, sum: Math.round(v.sum) }))
        .sort((a, b) => b.sum - a.sum);
    };

    const bySource = groupBy("source");
    const byVillage = groupBy("village").slice(0, 10);
    const byResponsible = groupBy("responsible").slice(0, 10);

    const topGifts = [...withAmount]
      .sort((a, b) => (b.gift_amount || 0) - (a.gift_amount || 0))
      .slice(0, 10);

    const buckets = [
      { name: "0-50€", min: 0, max: 50, count: 0 },
      { name: "50-100€", min: 50, max: 100, count: 0 },
      { name: "100-200€", min: 100, max: 200, count: 0 },
      { name: "200-500€", min: 200, max: 500, count: 0 },
      { name: "500€+", min: 500, max: Infinity, count: 0 },
    ];
    withAmount.forEach((g) => {
      const a = g.gift_amount || 0;
      const b = buckets.find((x) => a >= x.min && a < x.max);
      if (b) b.count += 1;
    });

    const median = (() => {
      if (withAmount.length === 0) return 0;
      const sorted = withAmount.map((g) => g.gift_amount || 0).sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
    })();

    const max = withAmount.reduce((m, g) => Math.max(m, g.gift_amount || 0), 0);
    const min = withAmount.reduce((m, g) => Math.min(m, g.gift_amount || Infinity), Infinity);

    return {
      total,
      median,
      max,
      min: min === Infinity ? 0 : min,
      withAmountCount: withAmount.length,
      bySource,
      byVillage,
      byResponsible,
      topGifts,
      buckets,
    };
  }, [gifts]);

  const drillBy = (key: keyof WeddingGift, label: string) => (name: string) => {
    const list = gifts.filter((g) => ((g[key] as string | null)?.toString().trim() || "—") === name);
    setDrill({ title: `${label}: ${name}`, description: `${list.length} εγγραφές`, gifts: list });
  };
  const drillBySource = drillBy("source", "Πηγή");
  const drillByVillage = drillBy("village", "Χωριό");
  const drillByResponsible = drillBy("responsible", "Υπεύθυνος");
  const drillByBucket = (bucket: { name: string; min: number; max: number }) => {
    const list = gifts.filter((g) => {
      const a = g.gift_amount || 0;
      return a > 0 && a >= bucket.min && a < bucket.max;
    });
    setDrill({ title: `Ποσό: ${bucket.name}`, description: `${list.length} εγγραφές`, gifts: list });
  };

  if (gifts.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg shadow-xs py-16 text-center">
        <Gift className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground">Δεν υπάρχουν δεδομένα</p>
        <p className="text-xs text-muted-foreground mt-1">
          Δεν βρέθηκαν δώρα για «{scopeLabel}».
        </p>
      </div>
    );
  }

  return (
    <>
      <StatsCards gifts={gifts} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <KpiCard label="Διάμεσος" value={formatEur(analytics.median)} icon={Euro} tone="text-info bg-info/10" />
        <KpiCard label="Μέγιστο δώρο" value={formatEur(analytics.max)} icon={Trophy} tone="text-warning bg-warning/10" />
        <KpiCard label="Ελάχιστο δώρο" value={formatEur(analytics.min)} icon={Gift} tone="text-success bg-success/10" />
        <KpiCard label="Χωρίς δώρο" value={String(gifts.length - analytics.withAmountCount)} icon={Users} tone="text-destructive bg-destructive/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Panel title="Καλεσμένοι ανά πηγή" icon={Users}>
          {analytics.bySource.length === 0 ? <EmptyMsg /> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={analytics.bySource}
                    dataKey="count"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={85}
                    paddingAngle={2}
                    onClick={(d: any) => d?.name && drillBySource(d.name)}
                    style={{ cursor: "pointer" }}
                  >
                    {analytics.bySource.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <ul className="space-y-1.5 text-sm">
                {analytics.bySource.map((s, i) => (
                  <li key={s.name}>
                    <button
                      type="button"
                      onClick={() => drillBySource(s.name)}
                      className="w-full flex items-center justify-between gap-2 hover:bg-muted/50 rounded-sm px-1.5 py-1 -mx-1.5 transition-colors text-left"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="truncate">{s.name}</span>
                      </span>
                      <span className="font-mono tabular-nums text-xs text-muted-foreground shrink-0">
                        {s.count} · {formatEur(s.sum)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>

        <Panel title="Κατανομή ποσών" icon={Euro}>
          {analytics.withAmountCount === 0 ? <EmptyMsg /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={analytics.buckets}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={axisTick} />
                <YAxis tick={axisTick} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar
                  dataKey="count"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  style={{ cursor: "pointer" }}
                  onClick={(d: any) => d && drillByBucket(d)}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel title="Top 10 χωριά (ανά ποσό)" icon={MapPin}>
          {analytics.byVillage.length === 0 ? <EmptyMsg /> : (
            <ResponsiveContainer width="100%" height={Math.max(220, analytics.byVillage.length * 28)}>
              <BarChart data={analytics.byVillage} layout="vertical" margin={{ left: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={axisTick} />
                <YAxis type="category" dataKey="name" width={100} tick={axisTick} />
                <Tooltip formatter={(v: number) => formatEur(v)} contentStyle={tooltipStyle} />
                <Bar
                  dataKey="sum"
                  fill="hsl(var(--success))"
                  radius={[0, 4, 4, 0]}
                  style={{ cursor: "pointer" }}
                  onClick={(d: any) => d?.name && drillByVillage(d.name)}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel title="Top 10 υπεύθυνοι (ανά ποσό)" icon={UserCheck}>
          {analytics.byResponsible.length === 0 ? <EmptyMsg /> : (
            <ResponsiveContainer width="100%" height={Math.max(220, analytics.byResponsible.length * 28)}>
              <BarChart data={analytics.byResponsible} layout="vertical" margin={{ left: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={axisTick} />
                <YAxis type="category" dataKey="name" width={100} tick={axisTick} />
                <Tooltip formatter={(v: number) => formatEur(v)} contentStyle={tooltipStyle} />
                <Bar
                  dataKey="sum"
                  fill="hsl(var(--warning))"
                  radius={[0, 4, 4, 0]}
                  style={{ cursor: "pointer" }}
                  onClick={(d: any) => d?.name && drillByResponsible(d.name)}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </div>

      <Panel title="Top 10 μεγαλύτερα δώρα" icon={Trophy}>
        {analytics.topGifts.length === 0 ? <EmptyMsg /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="py-2 px-2">#</th>
                  <th className="py-2 px-2">Ονοματεπώνυμο</th>
                  <th className="py-2 px-2 hidden sm:table-cell">Χωριό</th>
                  <th className="py-2 px-2 hidden md:table-cell">Πηγή</th>
                  <th className="py-2 px-2 text-right">Ποσό</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topGifts.map((g, i) => (
                  <tr
                    key={g.id}
                    className="border-b border-border last:border-0 hover:bg-muted/40 cursor-pointer"
                    onClick={() => setDetailsGift(g)}
                  >
                    <td className="py-2 px-2 font-mono text-xs text-muted-foreground">{i + 1}</td>
                    <td className="py-2 px-2 font-medium">{g.surname} {g.first_name}</td>
                    <td className="py-2 px-2 text-muted-foreground hidden sm:table-cell">{g.village || "—"}</td>
                    <td className="py-2 px-2 text-muted-foreground hidden md:table-cell">{g.source || "—"}</td>
                    <td className="py-2 px-2 text-right font-mono tabular-nums font-semibold text-success">
                      {formatEur(g.gift_amount || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Drill dialog */}
      <Dialog open={!!drill} onOpenChange={(o) => !o && setDrill(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-primary" />
              {drill?.title}
            </DialogTitle>
            {drill?.description && <DialogDescription>{drill.description}</DialogDescription>}
          </DialogHeader>
          <div className="overflow-auto -mx-6 px-6">
            {drill && drill.gifts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Δεν υπάρχουν εγγραφές</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background">
                  <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                    <th className="py-2 px-2">#</th>
                    <th className="py-2 px-2">Ονοματεπώνυμο</th>
                    <th className="py-2 px-2 hidden sm:table-cell">Χωριό</th>
                    <th className="py-2 px-2 hidden md:table-cell">Πηγή</th>
                    <th className="py-2 px-2 hidden md:table-cell">Υπεύθυνος</th>
                    <th className="py-2 px-2 text-right">Ποσό</th>
                  </tr>
                </thead>
                <tbody>
                  {liveDrill?.gifts.map((g, i) => (
                    <tr
                      key={g.id}
                      className="border-b border-border last:border-0 hover:bg-muted/40 cursor-pointer group"
                      onClick={() => setDetailsGift(g)}
                    >
                      <td className="py-2 px-2 font-mono text-xs text-muted-foreground">{g.number ?? i + 1}</td>
                      <td className="py-2 px-2 font-medium">
                        <span className="inline-flex items-center gap-1.5">
                          {g.surname} {g.first_name}
                          <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </span>
                      </td>
                      <td className="py-2 px-2 text-muted-foreground hidden sm:table-cell">{g.village || "—"}</td>
                      <td className="py-2 px-2 text-muted-foreground hidden md:table-cell">{g.source || "—"}</td>
                      <td className="py-2 px-2 text-muted-foreground hidden md:table-cell">{g.responsible || "—"}</td>
                      <td className="py-2 px-2 text-right font-mono tabular-nums font-semibold text-success">
                        {g.gift_amount ? formatEur(g.gift_amount) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {liveDrill && liveDrill.gifts.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-border font-semibold">
                      <td colSpan={5} className="py-2 px-2 text-right text-muted-foreground">Σύνολο:</td>
                      <td className="py-2 px-2 text-right font-mono tabular-nums text-primary">
                        {formatEur(liveDrill.gifts.reduce((s, g) => s + (g.gift_amount || 0), 0))}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <GiftDetailsDialog
        gift={liveDetails}
        open={!!detailsGift}
        onOpenChange={(o) => !o && setDetailsGift(null)}
        onEdit={(g) => { setEditingGift(g); setFormOpen(true); }}
        onDelete={(id) => setDeleteId(id)}
      />

      <GiftForm
        open={formOpen}
        onOpenChange={(o) => { setFormOpen(o); if (!o) setEditingGift(null); }}
        editingGift={editingGift}
        onDelete={(id) => setDeleteId(id)}
      />

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            onDeleteGift(deleteId);
            setDeleteId(null);
            setDetailsGift(null);
          }
        }}
      />
    </>
  );
};

/* ---------------------------------------------------------------- */
/* Given gifts (given_gifts) — stats panel                           */
/* ---------------------------------------------------------------- */

const GivenStats = ({ gifts }: { gifts: GivenGift[] }) => {
  const [drill, setDrill] = useState<GivenDrillState | null>(null);

  const analytics = useMemo(() => {
    const withAmount = gifts.filter((g) => g.gift_amount && g.gift_amount > 0);
    const total = gifts.reduce((s, g) => s + (g.gift_amount || 0), 0);

    const groupBy = (getter: (g: GivenGift) => string) => {
      const map = new Map<string, { count: number; sum: number }>();
      gifts.forEach((g) => {
        const v = getter(g) || "—";
        const cur = map.get(v) || { count: 0, sum: 0 };
        cur.count += 1;
        cur.sum += g.gift_amount || 0;
        map.set(v, cur);
      });
      return Array.from(map.entries())
        .map(([name, v]) => ({ name, count: v.count, sum: Math.round(v.sum) }))
        .sort((a, b) => b.sum - a.sum);
    };

    const byEventType = groupBy((g) => g.event_type?.trim() || "—");
    const byRelationship = groupBy((g) => g.relationship?.trim() || "—").slice(0, 10);
    const byVillage = groupBy((g) => g.village?.trim() || "—").slice(0, 10);

    const topGifts = [...withAmount]
      .sort((a, b) => (b.gift_amount || 0) - (a.gift_amount || 0))
      .slice(0, 10);

    const buckets = [
      { name: "0-50€", min: 0, max: 50, count: 0 },
      { name: "50-100€", min: 50, max: 100, count: 0 },
      { name: "100-200€", min: 100, max: 200, count: 0 },
      { name: "200-500€", min: 200, max: 500, count: 0 },
      { name: "500€+", min: 500, max: Infinity, count: 0 },
    ];
    withAmount.forEach((g) => {
      const a = g.gift_amount || 0;
      const b = buckets.find((x) => a >= x.min && a < x.max);
      if (b) b.count += 1;
    });

    const median = (() => {
      if (withAmount.length === 0) return 0;
      const sorted = withAmount.map((g) => g.gift_amount || 0).sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
    })();

    const max = withAmount.reduce((m, g) => Math.max(m, g.gift_amount || 0), 0);
    const min = withAmount.reduce((m, g) => Math.min(m, g.gift_amount || Infinity), Infinity);
    const avg = withAmount.length > 0 ? total / withAmount.length : 0;

    // Group by year
    const byYearMap = new Map<string, { count: number; sum: number }>();
    gifts.forEach((g) => {
      if (!g.event_date) return;
      const y = g.event_date.slice(0, 4);
      const cur = byYearMap.get(y) || { count: 0, sum: 0 };
      cur.count += 1;
      cur.sum += g.gift_amount || 0;
      byYearMap.set(y, cur);
    });
    const byYear = Array.from(byYearMap.entries())
      .map(([name, v]) => ({ name, count: v.count, sum: Math.round(v.sum) }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      total,
      avg,
      median,
      max,
      min: min === Infinity ? 0 : min,
      withAmountCount: withAmount.length,
      byEventType,
      byRelationship,
      byVillage,
      byYear,
      topGifts,
      buckets,
    };
  }, [gifts]);

  const drillBy = (
    label: string,
    getter: (g: GivenGift) => string,
  ) => (name: string) => {
    const list = gifts.filter((g) => (getter(g) || "—") === name);
    setDrill({ title: `${label}: ${name}`, description: `${list.length} εγγραφές`, gifts: list });
  };
  const drillByEventType = drillBy("Τύπος εκδήλωσης", (g) => g.event_type?.trim() || "—");
  const drillByRelationship = drillBy("Σχέση", (g) => g.relationship?.trim() || "—");
  const drillByVillage = drillBy("Χωριό", (g) => g.village?.trim() || "—");
  const drillByBucket = (bucket: { name: string; min: number; max: number }) => {
    const list = gifts.filter((g) => {
      const a = g.gift_amount || 0;
      return a > 0 && a >= bucket.min && a < bucket.max;
    });
    setDrill({ title: `Ποσό: ${bucket.name}`, description: `${list.length} εγγραφές`, gifts: list });
  };
  const drillByYear = (year: string) => {
    const list = gifts.filter((g) => g.event_date?.startsWith(year));
    setDrill({ title: `Έτος: ${year}`, description: `${list.length} εγγραφές`, gifts: list });
  };

  if (gifts.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg shadow-xs py-16 text-center">
        <HandHeart className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground">Δεν υπάρχουν δεδομένα</p>
        <p className="text-xs text-muted-foreground mt-1">
          Δεν έχετε καταχωρήσει δώρα στο «Δώρα μου».
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <KpiCard label="Εκδηλώσεις" value={String(gifts.length)} icon={CalendarDays} tone="text-info bg-info/10" />
        <KpiCard label="Με δώρο" value={String(analytics.withAmountCount)} icon={Gift} tone="text-success bg-success/10" />
        <KpiCard label="Συνολικό ποσό" value={formatEur(analytics.total)} icon={Euro} tone="text-primary bg-primary/10" />
        <KpiCard label="Μέσος όρος" value={formatEur(analytics.avg)} icon={UserCheck} tone="text-warning bg-warning/10" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <KpiCard label="Διάμεσος" value={formatEur(analytics.median)} icon={Euro} tone="text-info bg-info/10" />
        <KpiCard label="Μέγιστο" value={formatEur(analytics.max)} icon={Trophy} tone="text-warning bg-warning/10" />
        <KpiCard label="Ελάχιστο" value={formatEur(analytics.min)} icon={Gift} tone="text-success bg-success/10" />
        <KpiCard label="Χωρίς ποσό" value={String(gifts.length - analytics.withAmountCount)} icon={Users} tone="text-destructive bg-destructive/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Panel title="Ανά τύπο εκδήλωσης" icon={PartyPopper}>
          {analytics.byEventType.length === 0 ? <EmptyMsg /> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={analytics.byEventType}
                    dataKey="sum"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={85}
                    paddingAngle={2}
                    onClick={(d: any) => d?.name && drillByEventType(d.name)}
                    style={{ cursor: "pointer" }}
                  >
                    {analytics.byEventType.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatEur(v)} contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <ul className="space-y-1.5 text-sm">
                {analytics.byEventType.map((s, i) => (
                  <li key={s.name}>
                    <button
                      type="button"
                      onClick={() => drillByEventType(s.name)}
                      className="w-full flex items-center justify-between gap-2 hover:bg-muted/50 rounded-sm px-1.5 py-1 -mx-1.5 transition-colors text-left"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="truncate">{s.name}</span>
                      </span>
                      <span className="font-mono tabular-nums text-xs text-muted-foreground shrink-0">
                        {s.count} · {formatEur(s.sum)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>

        <Panel title="Κατανομή ποσών" icon={Euro}>
          {analytics.withAmountCount === 0 ? <EmptyMsg /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={analytics.buckets}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={axisTick} />
                <YAxis tick={axisTick} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar
                  dataKey="count"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  style={{ cursor: "pointer" }}
                  onClick={(d: any) => d && drillByBucket(d)}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel title="Top 10 σχέσεις (ανά ποσό)" icon={Heart}>
          {analytics.byRelationship.length === 0 ? <EmptyMsg /> : (
            <ResponsiveContainer width="100%" height={Math.max(220, analytics.byRelationship.length * 28)}>
              <BarChart data={analytics.byRelationship} layout="vertical" margin={{ left: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={axisTick} />
                <YAxis type="category" dataKey="name" width={100} tick={axisTick} />
                <Tooltip formatter={(v: number) => formatEur(v)} contentStyle={tooltipStyle} />
                <Bar
                  dataKey="sum"
                  fill="hsl(var(--success))"
                  radius={[0, 4, 4, 0]}
                  style={{ cursor: "pointer" }}
                  onClick={(d: any) => d?.name && drillByRelationship(d.name)}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel title="Top 10 χωριά (ανά ποσό)" icon={MapPin}>
          {analytics.byVillage.length === 0 ? <EmptyMsg /> : (
            <ResponsiveContainer width="100%" height={Math.max(220, analytics.byVillage.length * 28)}>
              <BarChart data={analytics.byVillage} layout="vertical" margin={{ left: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={axisTick} />
                <YAxis type="category" dataKey="name" width={100} tick={axisTick} />
                <Tooltip formatter={(v: number) => formatEur(v)} contentStyle={tooltipStyle} />
                <Bar
                  dataKey="sum"
                  fill="hsl(var(--warning))"
                  radius={[0, 4, 4, 0]}
                  style={{ cursor: "pointer" }}
                  onClick={(d: any) => d?.name && drillByVillage(d.name)}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </div>

      {analytics.byYear.length > 0 && (
        <Panel title="Ανά έτος" icon={CalendarDays}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={analytics.byYear}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" tick={axisTick} />
              <YAxis tick={axisTick} />
              <Tooltip formatter={(v: number) => formatEur(v)} contentStyle={tooltipStyle} />
              <Bar
                dataKey="sum"
                fill="hsl(var(--brand-wine))"
                radius={[4, 4, 0, 0]}
                style={{ cursor: "pointer" }}
                onClick={(d: any) => d?.name && drillByYear(d.name)}
              />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      )}

      <Panel title="Top 10 μεγαλύτερα δώρα μου" icon={Trophy}>
        {analytics.topGifts.length === 0 ? <EmptyMsg /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="py-2 px-2">#</th>
                  <th className="py-2 px-2">Ονοματεπώνυμο</th>
                  <th className="py-2 px-2 hidden sm:table-cell">Τύπος</th>
                  <th className="py-2 px-2 hidden md:table-cell">Ημ/νία</th>
                  <th className="py-2 px-2 text-right">Ποσό</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topGifts.map((g, i) => (
                  <tr key={g.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                    <td className="py-2 px-2 font-mono text-xs text-muted-foreground">{i + 1}</td>
                    <td className="py-2 px-2 font-medium">{g.surname} {g.first_name}</td>
                    <td className="py-2 px-2 text-muted-foreground hidden sm:table-cell">{g.event_type || "—"}</td>
                    <td className="py-2 px-2 text-muted-foreground hidden md:table-cell">
                      {g.event_date ? format(parseISO(g.event_date), "dd/MM/yyyy") : "—"}
                    </td>
                    <td className="py-2 px-2 text-right font-mono tabular-nums font-semibold text-success">
                      {formatEur(g.gift_amount || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Dialog open={!!drill} onOpenChange={(o) => !o && setDrill(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-primary" />
              {drill?.title}
            </DialogTitle>
            {drill?.description && <DialogDescription>{drill.description}</DialogDescription>}
          </DialogHeader>
          <div className="overflow-auto -mx-6 px-6">
            {drill && drill.gifts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Δεν υπάρχουν εγγραφές</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background">
                  <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                    <th className="py-2 px-2">#</th>
                    <th className="py-2 px-2">Ονοματεπώνυμο</th>
                    <th className="py-2 px-2 hidden sm:table-cell">Τύπος</th>
                    <th className="py-2 px-2 hidden md:table-cell">Σχέση</th>
                    <th className="py-2 px-2 hidden md:table-cell">Ημ/νία</th>
                    <th className="py-2 px-2 text-right">Ποσό</th>
                  </tr>
                </thead>
                <tbody>
                  {drill?.gifts.map((g, i) => (
                    <tr key={g.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                      <td className="py-2 px-2 font-mono text-xs text-muted-foreground">{i + 1}</td>
                      <td className="py-2 px-2 font-medium">{g.surname} {g.first_name}</td>
                      <td className="py-2 px-2 text-muted-foreground hidden sm:table-cell">{g.event_type || "—"}</td>
                      <td className="py-2 px-2 text-muted-foreground hidden md:table-cell">{g.relationship || "—"}</td>
                      <td className="py-2 px-2 text-muted-foreground hidden md:table-cell">
                        {g.event_date ? format(parseISO(g.event_date), "dd/MM/yyyy") : "—"}
                      </td>
                      <td className="py-2 px-2 text-right font-mono tabular-nums font-semibold text-success">
                        {g.gift_amount ? formatEur(g.gift_amount) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {drill && drill.gifts.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-border font-semibold">
                      <td colSpan={5} className="py-2 px-2 text-right text-muted-foreground">Σύνολο:</td>
                      <td className="py-2 px-2 text-right font-mono tabular-nums text-primary">
                        {formatEur(drill.gifts.reduce((s, g) => s + (g.gift_amount || 0), 0))}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

/* ---------------------------------------------------------------- */
/* Shared bits                                                       */
/* ---------------------------------------------------------------- */

const tooltipStyle = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 6,
  fontSize: 12,
};

const axisTick = { fontSize: 11, fill: "hsl(var(--muted-foreground))" };

const Panel = ({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) => (
  <div className="bg-card border border-border rounded-lg shadow-xs">
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
      <Icon className="w-4 h-4 text-primary" />
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
    </div>
    <div className="p-4">{children}</div>
  </div>
);

const KpiCard = ({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
}) => (
  <div className="bg-card border border-border rounded-lg p-3 sm:p-4 shadow-xs">
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium truncate">{label}</p>
        <p className="text-lg sm:text-2xl font-semibold text-foreground mt-1 truncate font-mono tabular-nums">{value}</p>
      </div>
      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-md flex items-center justify-center shrink-0 ${tone}`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
  </div>
);

const EmptyMsg = () => (
  <p className="text-sm text-muted-foreground text-center py-8">Δεν υπάρχουν δεδομένα</p>
);

export default Stats;
