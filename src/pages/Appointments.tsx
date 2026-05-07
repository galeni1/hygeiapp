import { useMemo, useState } from "react";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { Plus, Pencil, Trash2, Check, Calendar as CalIcon } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAppointments } from "@/hooks/useAppointments";
import { AppointmentFormDialog } from "@/components/AppointmentFormDialog";
import type { Appointment } from "@/types/medical";

const Appointments = () => {
  const { data: appointments = [], isLoading, remove, update } = useAppointments();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Appointment | null>(null);

  const { upcoming, past } = useMemo(() => {
    const now = new Date();
    const u: Appointment[] = [];
    const p: Appointment[] = [];
    appointments.forEach((a) => {
      const isPast = a.completed || new Date(a.appointment_date) < now;
      if (isPast) p.push(a);
      else u.push(a);
    });
    p.sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime());
    return { upcoming: u, past: p };
  }, [appointments]);

  const handleAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const renderList = (list: Appointment[], emptyMsg: string) => {
    if (isLoading) return <div className="p-12 text-center text-muted-foreground">Φόρτωση...</div>;
    if (list.length === 0)
      return (
        <div className="p-12 text-center">
          <CalIcon className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">{emptyMsg}</p>
        </div>
      );
    return (
      <div className="space-y-2">
        {list.map((a) => {
          const date = new Date(a.appointment_date);
          const isPast = a.completed || date < new Date();
          return (
            <Card key={a.id} className="p-4 hover:shadow-md-erp transition-shadow">
              <div className="flex items-start gap-3">
                <div className="text-center shrink-0 bg-primary/10 rounded-md p-2 min-w-16">
                  <p className="text-xs text-muted-foreground uppercase">
                    {format(date, "MMM", { locale: el })}
                  </p>
                  <p className="text-2xl font-bold leading-none">{format(date, "dd")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                    {format(date, "HH:mm")}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold truncate">{a.doctor_name || "—"}</h3>
                    {a.completed && <Badge variant="secondary">Ολοκληρώθηκε</Badge>}
                  </div>
                  {a.specialty && <p className="text-sm text-muted-foreground">{a.specialty}</p>}
                  {a.reason && <p className="text-sm mt-1">{a.reason}</p>}
                  {a.notes && <p className="text-xs text-muted-foreground italic mt-1">{a.notes}</p>}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {!isPast && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-success"
                      onClick={() => update.mutate({ id: a.id, completed: true })}
                      title="Σήμανση ως ολοκληρωμένο"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditing(a);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    onClick={() => setConfirmDelete(a)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <AppShell onAddNew={handleAdd}>
      <div className="p-3 sm:p-6 space-y-4">
        <div className="flex justify-end">
          <Button size="sm" onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-1" /> Νέο ραντεβού
          </Button>
        </div>

        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">Επόμενα ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="past">Παρελθόντα ({past.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="mt-4">
            {renderList(upcoming, "Δεν έχετε επερχόμενα ραντεβού")}
          </TabsContent>
          <TabsContent value="past" className="mt-4">
            {renderList(past, "Δεν υπάρχουν παρελθόντα ραντεβού")}
          </TabsContent>
        </Tabs>
      </div>

      <AppointmentFormDialog open={formOpen} onOpenChange={setFormOpen} appointment={editing} />

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Διαγραφή ραντεβού;</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Ακύρωση</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={async () => {
                if (confirmDelete) await remove.mutateAsync(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              Διαγραφή
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
};

export default Appointments;
