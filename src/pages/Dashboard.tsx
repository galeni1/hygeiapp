import { useMemo, useState } from "react";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import {
  Stethoscope,
  CalendarDays,
  Wallet,
  TrendingUp,
  Clock,
  Plus,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/AppShell";
import { useVisits } from "@/hooks/useVisits";
import { useAppointments } from "@/hooks/useAppointments";
import { useDoctors } from "@/hooks/useDoctors";
import { VisitFormDialog } from "@/components/VisitFormDialog";
import { AppointmentFormDialog } from "@/components/AppointmentFormDialog";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { data: visits = [] } = useVisits();
  const { data: appointments = [] } = useAppointments();
  const { data: doctors = [] } = useDoctors();
  const [visitOpen, setVisitOpen] = useState(false);
  const [apptOpen, setApptOpen] = useState(false);

  const stats = useMemo(() => {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearVisits = visits.filter((v) => new Date(v.visit_date) >= yearStart);
    const totalCost = visits.reduce((s, v) => s + (v.cost || 0), 0);
    const yearCost = yearVisits.reduce((s, v) => s + (v.cost || 0), 0);
    return {
      total: visits.length,
      yearCount: yearVisits.length,
      totalCost,
      yearCost,
    };
  }, [visits]);

  const upcoming = useMemo(() => {
    const now = new Date();
    return appointments
      .filter((a) => !a.completed && new Date(a.appointment_date) >= now)
      .slice(0, 5);
  }, [appointments]);

  const recentVisits = visits.slice(0, 5);

  return (
    <AppShell onAddNew={() => setVisitOpen(true)}>
      <div className="p-3 sm:p-6 space-y-4">
        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Σύνολο επισκέψεων</p>
                <p className="text-2xl font-semibold">{stats.total}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
                <CalendarDays className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Φέτος</p>
                <p className="text-2xl font-semibold">{stats.yearCount}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Κόστος έτους</p>
                <p className="text-2xl font-semibold">{stats.yearCost.toFixed(0)}€</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Σύνολο εξόδων</p>
                <p className="text-2xl font-semibold">{stats.totalCost.toFixed(0)}€</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Upcoming appointments */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4" /> Επόμενα ραντεβού
              </h2>
              <Button size="sm" variant="outline" onClick={() => setApptOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Νέο
              </Button>
            </div>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Κανένα επερχόμενο ραντεβού
              </p>
            ) : (
              <div className="space-y-2">
                {upcoming.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between p-3 rounded-md border bg-muted/30"
                  >
                    <div>
                      <p className="font-medium text-sm">{a.doctor_name || "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.specialty} {a.reason ? `· ${a.reason}` : ""}
                      </p>
                    </div>
                    <Badge variant="outline" className="font-mono text-xs">
                      {format(new Date(a.appointment_date), "dd MMM, HH:mm", { locale: el })}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            <Link to="/appointments" className="text-xs text-primary hover:underline mt-3 inline-block">
              Όλα τα ραντεβού →
            </Link>
          </Card>

          {/* Recent visits */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold flex items-center gap-2">
                <Stethoscope className="h-4 w-4" /> Πρόσφατες επισκέψεις
              </h2>
              <Button size="sm" variant="outline" onClick={() => setVisitOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Νέα
              </Button>
            </div>
            {recentVisits.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Δεν έχετε καταχωρήσει επισκέψεις
              </p>
            ) : (
              <div className="space-y-2">
                {recentVisits.map((v) => (
                  <div key={v.id} className="flex items-center justify-between p-3 rounded-md border bg-muted/30">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{v.doctor_name || v.specialty || "—"}</p>
                      <p className="text-xs text-muted-foreground truncate">{v.reason || v.diagnosis || ""}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono">
                        {format(new Date(v.visit_date), "dd/MM/yy", { locale: el })}
                      </p>
                      {v.cost != null && (
                        <p className="text-xs text-muted-foreground">{v.cost.toFixed(2)}€</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link to="/visits" className="text-xs text-primary hover:underline mt-3 inline-block">
              Όλες οι επισκέψεις →
            </Link>
          </Card>
        </div>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{doctors.length} ιατροί στη λίστα σου</p>
              <p className="text-xs text-muted-foreground">Διαχείριση από τη σελίδα Ιατροί</p>
            </div>
            <Link to="/doctors">
              <Button variant="outline" size="sm">Άνοιγμα</Button>
            </Link>
          </div>
        </Card>
      </div>

      <VisitFormDialog open={visitOpen} onOpenChange={setVisitOpen} />
      <AppointmentFormDialog open={apptOpen} onOpenChange={setApptOpen} />
    </AppShell>
  );
};

export default Dashboard;
