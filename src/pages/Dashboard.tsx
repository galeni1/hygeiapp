import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format, parseISO, differenceInCalendarDays, isToday, isTomorrow, startOfDay } from "date-fns";
import { el } from "date-fns/locale";
import {
  CalendarDays,
  PartyPopper,
  HandHeart,
  Users,
  Gift as GiftIcon,
  Euro,
  ArrowRight,
  Sparkles,
  Clock,
  MapPin,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useGivenGifts } from "@/hooks/useGivenGifts";
import { usePersonalEvents } from "@/hooks/usePersonalEvents";
import { useGifts } from "@/hooks/useGifts";
import { GivenGift } from "@/types/givenGift";
import { PersonalEvent } from "@/types/personalEvent";
import { cn } from "@/lib/utils";

const formatEur = (n: number) =>
  new Intl.NumberFormat("el-GR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

type UpcomingItem =
  | {
      kind: "given";
      id: string;
      date: Date;
      title: string;
      subtitle: string;
      eventType: string | null;
      amount: number | null;
      raw: GivenGift;
    }
  | {
      kind: "personal";
      id: string;
      date: Date;
      title: string;
      subtitle: string;
      eventType: string | null;
      raw: PersonalEvent;
    };

const relativeLabel = (date: Date) => {
  if (isToday(date)) return "Σήμερα";
  if (isTomorrow(date)) return "Αύριο";
  const diff = differenceInCalendarDays(date, startOfDay(new Date()));
  if (diff > 0 && diff < 7) return `Σε ${diff} ημέρες`;
  if (diff >= 7 && diff < 31) return `Σε ${Math.round(diff / 7)} εβδ.`;
  if (diff >= 31) return `Σε ${Math.round(diff / 30)} μήνες`;
  return format(date, "d MMM", { locale: el });
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: givenGifts = [], isLoading: loadingGiven } = useGivenGifts();
  const { data: personalEvents = [], isLoading: loadingEvents } = usePersonalEvents();
  const { data: receivedGifts = [], isLoading: loadingReceived } = useGifts();

  const today = startOfDay(new Date());

  const upcoming: UpcomingItem[] = useMemo(() => {
    const items: UpcomingItem[] = [];

    // Δώρα μου = εκδηλώσεις τρίτων που πρέπει να παρευρεθώ
    for (const g of givenGifts) {
      if (g.deleted_at) continue;
      if (!g.event_date) continue;
      const d = parseISO(g.event_date);
      if (d < today) continue;
      const fullName = [g.surname, g.first_name].filter(Boolean).join(" ").trim() || "—";
      items.push({
        kind: "given",
        id: g.id,
        date: d,
        title: `${g.event_type || "Εκδήλωση"} — ${fullName}`,
        subtitle: [g.relationship, g.village].filter(Boolean).join(" · "),
        eventType: g.event_type,
        amount: g.gift_amount,
        raw: g,
      });
    }

    // Δικές μου εκδηλώσεις (μελλοντικές)
    for (const ev of personalEvents) {
      if (!ev.event_date) continue;
      const d = parseISO(ev.event_date);
      if (d < today) continue;
      items.push({
        kind: "personal",
        id: ev.id,
        date: d,
        title: ev.name,
        subtitle: [ev.event_type, ev.notes].filter(Boolean).join(" · "),
        eventType: ev.event_type,
        raw: ev,
      });
    }

    return items.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [givenGifts, personalEvents, today]);

  // Stats
  const stats = useMemo(() => {
    const upcomingCount = upcoming.length;
    const next30 = upcoming.filter((i) => differenceInCalendarDays(i.date, today) <= 30).length;
    const totalGivenAmount = givenGifts
      .filter((g) => !g.deleted_at)
      .reduce((s, g) => s + (g.gift_amount || 0), 0);
    const totalReceivedAmount = receivedGifts
      .filter((g) => !g.deleted_at)
      .reduce((s, g) => s + (g.gift_amount || 0), 0);
    return { upcomingCount, next30, totalGivenAmount, totalReceivedAmount };
  }, [upcoming, givenGifts, receivedGifts, today]);

  const isLoading = loadingGiven || loadingEvents || loadingReceived;

  // Group by relative bucket: today / this week / this month / later
  const groups = useMemo(() => {
    const g = {
      today: [] as UpcomingItem[],
      week: [] as UpcomingItem[],
      month: [] as UpcomingItem[],
      later: [] as UpcomingItem[],
    };
    for (const i of upcoming) {
      const diff = differenceInCalendarDays(i.date, today);
      if (diff <= 0) g.today.push(i);
      else if (diff <= 7) g.week.push(i);
      else if (diff <= 31) g.month.push(i);
      else g.later.push(i);
    }
    return g;
  }, [upcoming, today]);

  return (
    <AppShell>
      <div className="px-3 sm:px-6 py-4 sm:py-6 max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm text-muted-foreground capitalize">
              {format(new Date(), "EEEE, d MMMM yyyy", { locale: el })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/given")} className="gap-1.5">
              <HandHeart className="w-4 h-4" />
              <span className="hidden sm:inline">Δώρα μου</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/events")} className="gap-1.5">
              <PartyPopper className="w-4 h-4" />
              <span className="hidden sm:inline">Εκδηλώσεις μου</span>
            </Button>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <KpiCard
            icon={<CalendarDays className="w-4 h-4" />}
            label="Προσεχείς εκδηλώσεις"
            value={stats.upcomingCount.toString()}
            sub={`${stats.next30} τις επόμενες 30 ημέρες`}
            loading={isLoading}
          />
          <KpiCard
            icon={<Clock className="w-4 h-4" />}
            label="Σήμερα / Αύριο"
            value={(groups.today.length + (groups.week[0] && isTomorrow(groups.week[0].date) ? 1 : 0)).toString()}
            sub={groups.today.length > 0 ? "Έχετε εκδήλωση σήμερα" : "Καμία για σήμερα"}
            loading={isLoading}
            highlight={groups.today.length > 0}
          />
          <KpiCard
            icon={<HandHeart className="w-4 h-4" />}
            label="Σύνολο δώρων μου"
            value={formatEur(stats.totalGivenAmount)}
            sub={`${givenGifts.filter((g) => !g.deleted_at).length} εγγραφές`}
            loading={isLoading}
          />
        </div>

        {/* Upcoming list */}
        <div className="bg-card border border-border rounded-lg shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-foreground text-sm">Προσεχείς εκδηλώσεις</h2>
              <span className="text-xs text-muted-foreground">({upcoming.length})</span>
            </div>
            <Link
              to="/given"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              Όλα τα δώρα μου <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-md" />
              ))}
            </div>
          ) : upcoming.length === 0 ? (
            <div className="text-center py-12 px-4">
              <CalendarDays className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">Καμία προσεχής εκδήλωση</p>
              <p className="text-xs text-muted-foreground mt-1">
                Καταχωρήστε ημερομηνία στις εγγραφές «Δώρα μου» για να εμφανιστούν εδώ.
              </p>
              <Button variant="outline" size="sm" className="mt-4 gap-1.5" onClick={() => navigate("/given")}>
                <HandHeart className="w-4 h-4" /> Μετάβαση στα Δώρα μου
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              <Group title="Σήμερα" items={groups.today} />
              <Group title="Αυτή την εβδομάδα" items={groups.week} />
              <Group title="Αυτόν τον μήνα" items={groups.month} />
              <Group title="Αργότερα" items={groups.later} />
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
};

const Group = ({ title, items }: { title: string; items: UpcomingItem[] }) => {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="px-4 py-1.5 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground bg-muted/20">
        {title} <span className="font-normal">· {items.length}</span>
      </div>
      <ul>
        {items.map((it) => (
          <UpcomingRow key={`${it.kind}-${it.id}`} item={it} />
        ))}
      </ul>
    </div>
  );
};

const UpcomingRow = ({ item }: { item: UpcomingItem }) => {
  const navigate = useNavigate();
  const onClick = () => {
    if (item.kind === "personal") navigate(`/guests?event=${item.id}`);
    else navigate("/given");
  };

  const day = format(item.date, "d", { locale: el });
  const month = format(item.date, "MMM", { locale: el });
  const weekday = format(item.date, "EEEE", { locale: el });

  return (
    <li>
      <button
        onClick={onClick}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
      >
        {/* Date block */}
        <div
          className={cn(
            "w-12 h-12 shrink-0 rounded-md border flex flex-col items-center justify-center leading-none",
            item.kind === "personal"
              ? "bg-primary/10 border-primary/30 text-primary"
              : "bg-muted border-border text-foreground",
          )}
        >
          <span className="text-[10px] uppercase tracking-wider font-semibold opacity-70">{month}</span>
          <span className="text-lg font-bold tabular-nums">{day}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-foreground truncate">{item.title}</p>
            {item.kind === "personal" && (
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                Δική μου
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
            <span className="capitalize">{weekday}</span>
            {item.subtitle && (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {item.subtitle}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-0.5 shrink-0">
          <span
            className={cn(
              "text-xs font-semibold px-2 py-0.5 rounded-full",
              isToday(item.date)
                ? "bg-destructive/15 text-destructive"
                : isTomorrow(item.date)
                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                  : "bg-muted text-muted-foreground",
            )}
          >
            {relativeLabel(item.date)}
          </span>
          {item.kind === "given" && item.amount != null && (
            <span className="text-xs font-mono text-success font-semibold inline-flex items-center gap-0.5">
              <Euro className="w-3 h-3" /> {formatEur(item.amount)}
            </span>
          )}
        </div>
      </button>
    </li>
  );
};

const KpiCard = ({
  icon,
  label,
  value,
  sub,
  loading,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  loading?: boolean;
  highlight?: boolean;
}) => (
  <div
    className={cn(
      "bg-card border rounded-lg p-3 sm:p-4 shadow-xs",
      highlight ? "border-primary/40 ring-1 ring-primary/20" : "border-border",
    )}
  >
    <div className="flex items-center gap-1.5 text-muted-foreground text-xs uppercase tracking-wider font-semibold">
      {icon}
      <span className="truncate">{label}</span>
    </div>
    {loading ? (
      <Skeleton className="h-7 w-24 mt-2" />
    ) : (
      <p className="text-xl sm:text-2xl font-bold text-foreground mt-1.5 tabular-nums">{value}</p>
    )}
    {sub && <p className="text-[11px] text-muted-foreground mt-1 truncate">{sub}</p>}
  </div>
);

export default Dashboard;
