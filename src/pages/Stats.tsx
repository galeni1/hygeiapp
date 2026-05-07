import { useMemo } from "react";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/card";
import { AppShell } from "@/components/AppShell";
import { useVisits } from "@/hooks/useVisits";

const COLORS = ["hsl(217 91% 55%)", "hsl(142 71% 45%)", "hsl(38 92% 55%)", "hsl(199 89% 55%)", "hsl(350 70% 50%)", "hsl(280 65% 55%)"];

const Stats = () => {
  const { data: visits = [] } = useVisits();

  const monthlyData = useMemo(() => {
    const map = new Map<string, { month: string; count: number; cost: number }>();
    visits.forEach((v) => {
      const d = new Date(v.visit_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = format(d, "MMM yy", { locale: el });
      const cur = map.get(key) || { month: label, count: 0, cost: 0 };
      cur.count += 1;
      cur.cost += v.cost || 0;
      map.set(key, cur);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([, v]) => v);
  }, [visits]);

  const bySpecialty = useMemo(() => {
    const map = new Map<string, number>();
    visits.forEach((v) => {
      const k = v.specialty || "Χωρίς ειδικότητα";
      map.set(k, (map.get(k) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [visits]);

  const byDoctor = useMemo(() => {
    const map = new Map<string, { count: number; cost: number }>();
    visits.forEach((v) => {
      const k = v.doctor_name || "—";
      const cur = map.get(k) || { count: 0, cost: 0 };
      cur.count += 1;
      cur.cost += v.cost || 0;
      map.set(k, cur);
    });
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [visits]);

  return (
    <AppShell>
      <div className="p-3 sm:p-6 space-y-4">
        <Card className="p-4">
          <h2 className="font-semibold mb-4">Επισκέψεις & Κόστος ανά μήνα</h2>
          {monthlyData.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Δεν υπάρχουν δεδομένα</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="count" name="Επισκέψεις" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="cost" name="Κόστος (€)" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-4">
            <h2 className="font-semibold mb-4">Ανά ειδικότητα</h2>
            {bySpecialty.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">—</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={bySpecialty} dataKey="value" nameKey="name" outerRadius={90} label>
                    {bySpecialty.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card className="p-4">
            <h2 className="font-semibold mb-4">Top ιατροί</h2>
            {byDoctor.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">—</p>
            ) : (
              <div className="space-y-2">
                {byDoctor.map((d) => (
                  <div key={d.name} className="flex items-center justify-between p-2 rounded border bg-muted/30">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.count} επισκέψεις</p>
                    </div>
                    <p className="text-sm font-mono">{d.cost.toFixed(2)}€</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
};

export default Stats;
