import { useMemo, useState } from "react";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { Activity, Stethoscope, Search, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useVisits } from "@/hooks/useVisits";
import { useSymptoms } from "@/hooks/useSymptoms";
import { normalize, smartMatch } from "@/lib/search";

type Entry = {
  id: string;
  kind: "visit" | "symptom";
  date: string;
  bodyPart: string;
  title: string;
  subtitle?: string | null;
  severity?: number | null;
  cost?: number | null;
  resolved?: boolean;
};

const UNCATEGORIZED = "Χωρίς όργανο";

const BodyHistory = () => {
  const { data: visits = [] } = useVisits();
  const { data: symptoms = [] } = useSymptoms();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, Entry[]>();
    const push = (key: string, e: Entry) => {
      const k = key.trim() || UNCATEGORIZED;
      const arr = map.get(k) || [];
      arr.push(e);
      map.set(k, arr);
    };
    visits.forEach((v) =>
      push(v.body_part || "", {
        id: `v-${v.id}`,
        kind: "visit",
        date: v.visit_date,
        bodyPart: v.body_part || UNCATEGORIZED,
        title: v.doctor_name || v.specialty || "Επίσκεψη",
        subtitle: v.diagnosis || v.reason,
        cost: v.cost,
      }),
    );
    symptoms.forEach((s) =>
      push(s.body_part || "", {
        id: `s-${s.id}`,
        kind: "symptom",
        date: s.observed_date,
        bodyPart: s.body_part || UNCATEGORIZED,
        title: s.description,
        subtitle: s.notes,
        severity: s.severity,
        resolved: !!s.resolved_at,
      }),
    );

    // Merge near-duplicate keys (case/accent-insensitive). Pick most common original.
    const norm = new Map<string, { display: string; entries: Entry[]; counts: Map<string, number> }>();
    for (const [k, arr] of map.entries()) {
      const n = normalize(k);
      const cur = norm.get(n) || { display: k, entries: [], counts: new Map() };
      cur.entries.push(...arr);
      cur.counts.set(k, (cur.counts.get(k) || 0) + arr.length);
      // pick the most-used original spelling as display
      let best = cur.display;
      let bestCount = cur.counts.get(best) || 0;
      for (const [variant, c] of cur.counts) {
        if (c > bestCount) {
          best = variant;
          bestCount = c;
        }
      }
      cur.display = best;
      norm.set(n, cur);
    }

    const result = Array.from(norm.values()).map(({ display, entries }) => {
      entries.sort((a, b) => +new Date(b.date) - +new Date(a.date));
      const visitCount = entries.filter((e) => e.kind === "visit").length;
      const symptomCount = entries.filter((e) => e.kind === "symptom").length;
      const activeSymptoms = entries.filter((e) => e.kind === "symptom" && !e.resolved).length;
      const totalCost = entries.reduce((s, e) => s + (e.cost || 0), 0);
      const lastDate = entries[0]?.date;
      const firstDate = entries[entries.length - 1]?.date;
      const sev = entries
        .filter((e) => e.kind === "symptom" && e.severity != null)
        .map((e) => e.severity as number);
      const avgSeverity = sev.length ? sev.reduce((a, b) => a + b, 0) / sev.length : null;
      return {
        bodyPart: display,
        entries,
        visitCount,
        symptomCount,
        activeSymptoms,
        totalCost,
        lastDate,
        firstDate,
        avgSeverity,
      };
    });

    result.sort((a, b) => b.entries.length - a.entries.length);
    return result;
  }, [visits, symptoms]);

  const filteredGroups = useMemo(() => {
    if (!search) return groups;
    return groups.filter((g) => smartMatch(g.bodyPart, search));
  }, [groups, search]);

  const selectedGroup = useMemo(
    () => groups.find((g) => g.bodyPart === selected) || null,
    [groups, selected],
  );

  const totalEntries = visits.length + symptoms.length;
  const maxBarCount = Math.max(1, ...groups.map((g) => g.entries.length));

  return (
    <AppShell>
      <div className="p-3 sm:p-6 space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="p-3">
            <p className="text-xs text-muted-foreground">Όργανα/περιοχές</p>
            <p className="text-2xl font-semibold">{groups.length}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground">Συνολικές καταχωρήσεις</p>
            <p className="text-2xl font-semibold">{totalEntries}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground">Επισκέψεις</p>
            <p className="text-2xl font-semibold">{visits.length}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground">Συμπτώματα</p>
            <p className="text-2xl font-semibold">{symptoms.length}</p>
          </Card>
        </div>

        <Card className="p-3 sm:p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Αναζήτηση οργάνου ή περιοχής σώματος..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </Card>

        {filteredGroups.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">
            Δεν υπάρχουν δεδομένα ακόμα
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-3 sm:p-4">
              <h2 className="font-semibold mb-3">Ανά μέλος του σώματος</h2>
              <div className="space-y-1.5">
                {filteredGroups.map((g) => {
                  const isActive = selected === g.bodyPart;
                  const pct = (g.entries.length / maxBarCount) * 100;
                  return (
                    <button
                      key={g.bodyPart}
                      onClick={() => setSelected(g.bodyPart)}
                      className={`w-full text-left rounded-md border p-2.5 transition-colors hover:bg-accent ${
                        isActive ? "bg-accent border-primary" : "bg-card"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{g.bodyPart}</p>
                            {g.activeSymptoms > 0 && (
                              <Badge variant="destructive" className="text-[10px] h-5">
                                {g.activeSymptoms} ενεργό
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {g.visitCount} επισκ. · {g.symptomCount} συμπτ.
                            {g.totalCost > 0 && ` · ${g.totalCost.toFixed(0)}€`}
                          </p>
                          <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card className="p-3 sm:p-4">
              {!selectedGroup ? (
                <div className="text-center text-muted-foreground py-12">
                  Επίλεξε ένα μέλος για να δεις την ιστορικότητα
                </div>
              ) : (
                <>
                  <div className="mb-3">
                    <h2 className="font-semibold text-lg">{selectedGroup.bodyPart}</h2>
                    <p className="text-xs text-muted-foreground">
                      {selectedGroup.firstDate &&
                        `Από ${format(new Date(selectedGroup.firstDate), "dd MMM yyyy", { locale: el })}`}
                      {selectedGroup.lastDate &&
                        ` · Τελευταία: ${format(new Date(selectedGroup.lastDate), "dd MMM yyyy", { locale: el })}`}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="rounded-md border p-2 bg-muted/30">
                      <p className="text-[10px] text-muted-foreground uppercase">Επισκέψεις</p>
                      <p className="text-lg font-semibold">{selectedGroup.visitCount}</p>
                    </div>
                    <div className="rounded-md border p-2 bg-muted/30">
                      <p className="text-[10px] text-muted-foreground uppercase">Συμπτώματα</p>
                      <p className="text-lg font-semibold">{selectedGroup.symptomCount}</p>
                    </div>
                    <div className="rounded-md border p-2 bg-muted/30">
                      <p className="text-[10px] text-muted-foreground uppercase">
                        {selectedGroup.avgSeverity != null ? "Μ.Ο. έντασης" : "Κόστος"}
                      </p>
                      <p className="text-lg font-semibold font-mono">
                        {selectedGroup.avgSeverity != null
                          ? `${selectedGroup.avgSeverity.toFixed(1)}/10`
                          : `${selectedGroup.totalCost.toFixed(0)}€`}
                      </p>
                    </div>
                  </div>

                  <div className="relative pl-5 border-l-2 border-border space-y-3 max-h-[480px] overflow-y-auto pr-1">
                    {selectedGroup.entries.map((e) => (
                      <div key={e.id} className="relative">
                        <span
                          className={`absolute -left-[26px] top-1.5 h-3 w-3 rounded-full border-2 border-background ${
                            e.kind === "visit" ? "bg-primary" : e.resolved ? "bg-muted-foreground" : "bg-destructive"
                          }`}
                        />
                        <div className="rounded-md border p-2.5 bg-card">
                          <div className="flex items-center gap-2 mb-1">
                            {e.kind === "visit" ? (
                              <Stethoscope className="h-3.5 w-3.5 text-primary" />
                            ) : (
                              <Activity className="h-3.5 w-3.5 text-destructive" />
                            )}
                            <span className="text-[11px] font-mono text-muted-foreground">
                              {format(new Date(e.date), "dd MMM yyyy", { locale: el })}
                            </span>
                            {e.kind === "symptom" && e.severity != null && (
                              <Badge variant="outline" className="text-[10px] h-5">
                                {e.severity}/10
                              </Badge>
                            )}
                            {e.kind === "symptom" && e.resolved && (
                              <Badge variant="secondary" className="text-[10px] h-5">
                                Αποκαταστάθηκε
                              </Badge>
                            )}
                            {e.kind === "visit" && e.cost ? (
                              <span className="text-[11px] font-mono ml-auto">{e.cost.toFixed(2)}€</span>
                            ) : null}
                          </div>
                          <p className="text-sm font-medium">{e.title}</p>
                          {e.subtitle && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{e.subtitle}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {selected && (
                    <div className="mt-3 flex justify-end">
                      <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
                        Καθαρισμός
                      </Button>
                    </div>
                  )}
                </>
              )}
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default BodyHistory;
